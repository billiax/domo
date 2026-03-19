// Only system plugins are bundled — they must work offline for first-run auto-install.
// Everything else (GitHub, Jira, community plugins) is fetched from the repo.
import systemHider from '../../../templates/system/hider.json';
import systemShortcuts from '../../../templates/system/shortcuts.json';

import { upsertPlugin, getPlugin } from './plugins';
import { getCatalogCache, setCatalogCache, getSettings } from './storage';
import type { PluginCode, PluginOptionDef, PluginDefinition, PluginMeta, Plugin } from "../types/plugin";
import { detectPlatform } from './platforms';

// ── Bundled definitions (system only — offline fallback) ──

let _definitions: Record<string, PluginDefinition> = __DEV_MODE__ ? {} : {
  'system-hider': systemHider as unknown as PluginDefinition,
  'system-shortcuts': systemShortcuts as unknown as PluginDefinition,
};

let _defsLoaded = !__DEV_MODE__;

async function loadDefinitionsFromRuntime(): Promise<Record<string, PluginDefinition>> {
  const manifestUrl = chrome.runtime.getURL("templates/_manifest.json");
  const resp = await fetch(manifestUrl);
  const paths: string[] = await resp.json();

  const definitions: Record<string, PluginDefinition> = {};
  await Promise.all(paths.map(async (relPath) => {
    const url = chrome.runtime.getURL(`templates/${relPath}`);
    const r = await fetch(url);
    const def: PluginDefinition = await r.json();
    definitions[def.id] = def;
  }));

  return definitions;
}

/** Call at sidepanel init. No-op in production (already loaded from static imports). */
export async function ensureDefinitionsLoaded(): Promise<void> {
  if (_defsLoaded) return;
  _definitions = await loadDefinitionsFromRuntime();
  _defsLoaded = true;
  console.log(`[domo] Dev mode: loaded ${Object.keys(_definitions).length} templates at runtime`);
}

/** Force-reload definitions from disk. Dev mode only. */
export async function reloadDefinitions(): Promise<void> {
  if (!__DEV_MODE__) return;
  _defsLoaded = false;
  await ensureDefinitionsLoaded();
}

// ── Definition code resolution ──

export function resolvePluginCode(code: PluginCode, options: Record<string, unknown>, _optionDefs?: Record<string, PluginOptionDef>): PluginCode {
  if (!code) return code;
  const resolved: PluginCode = { css: code.css || "", html: code.html || "", js: code.js || "" };
  for (const field of ["css", "html"] as const) {
    let text = resolved[field];
    text = text.replace(/\{\{#(\w+)=(\w+)\}\}([\s\S]*?)\{\{\/\1=\2\}\}/g, (_, key: string, value: string, content: string) => {
      return String(options[key]) === value ? content : "";
    });
    text = text.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key: string, content: string) => {
      return options[key] ? content : "";
    });
    resolved[field] = text;
  }
  return resolved;
}

export function mergeDefinitionDefaults(definition: PluginDefinition, userSettings: Record<string, unknown>): Record<string, unknown> {
  const defaults = Object.fromEntries(
    Object.entries(definition.options || {}).map(([k, v]) => [k, v.default])
  );
  return { ...defaults, ...userSettings };
}

export function resolveFullDefinition(definition: PluginDefinition, userSettings: Record<string, unknown>): { code: PluginCode; mergedSettings: Record<string, unknown> } {
  const mergedSettings = mergeDefinitionDefaults(definition, userSettings);
  const code = resolvePluginCode(definition.code, mergedSettings, definition.options);
  return { code, mergedSettings };
}

// ── Bundled definition access (system plugins only) ──

export function getBundledDefinitions(): PluginMeta[] {
  return Object.values(_definitions).map(def => ({
    id: def.id,
    name: def.name,
    description: def.description,
    author: def.author,
    version: def.version,
    tags: def.tags,
    website: def.website,
    platform: def.platform,
    match: def.match,
    options: def.options
  }));
}

export function getBundledDefinition(definitionId: string): PluginDefinition | null {
  return _definitions[definitionId] ?? null;
}

// ── Resolve a definition from any source: bundled or remote cache ──

export async function getDefinition(definitionId: string): Promise<PluginDefinition | null> {
  // Try bundled first (system plugins)
  const bundled = getBundledDefinition(definitionId);
  if (bundled) return bundled;

  // Try remote catalog cache — fetch the full definition
  const cache = await getCatalogCache();
  const entry = cache?.data?.find(t => t.id === definitionId);
  if (entry?._definitionUrl) {
    return fetchRemoteDefinition(entry._definitionUrl);
  }

  return null;
}

// ── Installation ──

export async function installDefinition(definitionId: string, userSettings: Record<string, unknown>): Promise<Plugin> {
  const def = await getDefinition(definitionId);
  if (!def) throw new Error("Definition not found: " + definitionId);

  const { code, mergedSettings } = resolveFullDefinition(def, userSettings);
  const platform = def.platform || detectPlatform(def.match);

  return upsertPlugin({
    match: def.match,
    matchAll: def.matchAll,
    exclude: def.exclude,
    name: def.name,
    description: def.description || "",
    platform,
    source: "catalog",
    definitionId: def.id,
    priority: def.defaultPriority || 50,
    settings: mergedSettings,
    code,
    _definition: def,
    installedDefVersion: def.version,
    modified: false,
  });
}

// ── Remote definition installation ──

export async function installRemoteDefinition(definition: PluginDefinition, userSettings: Record<string, unknown>): Promise<Plugin> {
  const { code, mergedSettings } = resolveFullDefinition(definition, userSettings);
  const platform = definition.platform || detectPlatform(definition.match);

  return upsertPlugin({
    match: definition.match,
    matchAll: definition.matchAll,
    exclude: definition.exclude,
    name: definition.name,
    description: definition.description || "",
    platform,
    source: "catalog",
    definitionId: definition.id,
    priority: definition.defaultPriority || 50,
    settings: mergedSettings,
    code,
    _definition: definition,
    installedDefVersion: definition.version,
    modified: false,
  });
}

// ── Settings update ──

export async function updatePluginSettings(pluginId: string, newSettings: Record<string, unknown>): Promise<Plugin | null> {
  const plugin = await getPlugin(pluginId);
  if (!plugin || !plugin.definitionId) return null;

  const def = await getDefinition(plugin.definitionId);
  if (!def) return null;

  const mergedSettings = mergeDefinitionDefaults(def, newSettings);
  const code = resolvePluginCode(def.code, mergedSettings, def.options);

  return upsertPlugin({
    ...plugin,
    settings: mergedSettings,
    code
  });
}

// ── Reload installed plugin from latest definition ──

export async function reloadInstalledPlugin(pluginId: string): Promise<Plugin | null> {
  const plugin = await getPlugin(pluginId);
  if (!plugin || !plugin.definitionId) return null;

  const def = await getDefinition(plugin.definitionId);
  if (!def) return null;

  const { code, mergedSettings } = resolveFullDefinition(def, plugin.settings || {});
  const platform = def.platform || detectPlatform(def.match);

  return upsertPlugin({
    ...plugin,
    name: def.name,
    description: def.description || "",
    platform,
    match: def.match,
    matchAll: def.matchAll,
    exclude: def.exclude,
    settings: mergedSettings,
    code,
    _definition: def,
    installedDefVersion: def.version,
    modified: false,
  });
}

// ── Remote catalog ──

const CATALOG_TTL = 60 * 60 * 1000; // 1 hour — registry changes rarely
const CATALOG_STALE_OK = 24 * 60 * 60 * 1000; // 24 hours — serve stale if fetch fails

export async function fetchCatalogEntries(registryUrl: string): Promise<PluginMeta[]> {
  const cache = await getCatalogCache();

  // Fresh cache with actual data — return immediately, no network
  if (cache?.data?.length && (Date.now() - cache.timestamp < CATALOG_TTL)) {
    return cache.data;
  }

  try {
    const { githubToken } = await getSettings();
    const headers: Record<string, string> = {};
    if (githubToken) headers["Authorization"] = `Bearer ${githubToken}`;

    // Conditional request — send ETag so GitHub can return 304
    if (cache?.etag) headers["If-None-Match"] = cache.etag;

    const resp = await fetch(registryUrl, { headers });

    // 304 Not Modified — registry unchanged, refresh timestamp
    if (resp.status === 304 && cache?.data) {
      await setCatalogCache({ ...cache, timestamp: Date.now() });
      return cache.data;
    }

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    if (!json.templates || !Array.isArray(json.templates)) {
      throw new Error("Invalid registry format");
    }

    const etag = resp.headers.get("etag") || undefined;
    const baseUrl = registryUrl.replace(/\/[^/]*$/, "/");
    const enriched: PluginMeta[] = json.templates.map((entry: Record<string, unknown>) => ({
      ...entry,
      _definitionUrl: (entry.url as string).startsWith("http") ? entry.url : baseUrl + entry.url,
      _source: "community" as const
    }));

    await setCatalogCache({ data: enriched, timestamp: Date.now(), etag });
    return enriched;
  } catch {
    // Stale cache is fine for up to 24h — no error spam
    if (cache?.data && (Date.now() - cache.timestamp < CATALOG_STALE_OK)) {
      return cache.data;
    }
    // Only warn when we truly have nothing to show
    if (!cache?.data) {
      console.warn("[domo] Catalog unavailable: no cache and fetch failed");
    }
    return cache?.data || [];
  }
}

export async function fetchRemoteDefinition(definitionUrl: string): Promise<PluginDefinition | null> {
  try {
    const { githubToken } = await getSettings();
    const headers: Record<string, string> = {};
    if (githubToken) headers["Authorization"] = `Bearer ${githubToken}`;

    const resp = await fetch(definitionUrl, { headers });
    if (!resp.ok) return null;
    const def = await resp.json();
    if (!def.id || !def.code) return null;
    return def as PluginDefinition;
  } catch {
    return null;
  }
}
