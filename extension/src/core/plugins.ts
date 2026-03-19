import type { Plugin, Match, PluginSource, PluginCode, PluginVersion } from "../types/plugin";
import { nowIso, createMutex } from "../lib/utils";

export const STORAGE_KEY_PLUGINS = "domo_plugins";

const storageMutex = createMutex();

export function generatePluginId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return "p_" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

// ── Validation ──

const VALID_MATCH_TYPES = new Set(["site", "path", "exact", "glob", "regex"]);

export function validatePlugin(data: unknown): Plugin | null {
  if (!data || typeof data !== "object") return null;
  const p = data as Record<string, unknown>;
  if (typeof p.id !== "string" || !p.id.startsWith("p_")) return null;
  if (!p.match || typeof p.match !== "object") return null;
  const match = p.match as Record<string, unknown>;
  if (!VALID_MATCH_TYPES.has(match.type as string)) return null;
  if (!p.code || typeof p.code !== "object") return null;
  const code = p.code as Record<string, unknown>;
  if (typeof code.css !== "string" && code.css !== undefined) return null;
  if (typeof p.enabled !== "boolean" && p.enabled !== undefined) return null;
  if (p.version !== undefined && (typeof p.version !== "number" || p.version < 0)) return null;
  return data as Plugin;
}

// ── Plugin CRUD ──

async function getPluginsMap(): Promise<Record<string, Plugin>> {
  const data = await chrome.storage.local.get(STORAGE_KEY_PLUGINS);
  const raw = (data[STORAGE_KEY_PLUGINS] as Record<string, unknown>) || {};
  const validated: Record<string, Plugin> = {};
  for (const [id, entry] of Object.entries(raw)) {
    const plugin = validatePlugin(entry);
    if (plugin) {
      validated[id] = plugin;
    } else {
      console.warn(`[domo] Skipping corrupted plugin entry: ${id}`);
    }
  }
  return validated;
}

async function setPluginsMap(plugins: Record<string, Plugin>): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_PLUGINS]: plugins });
}

export async function getAllPlugins(): Promise<Plugin[]> {
  const map = await getPluginsMap();
  return Object.values(map);
}

export async function getPlugin(pluginId: string): Promise<Plugin | null> {
  const map = await getPluginsMap();
  return map[pluginId] ?? null;
}

export async function upsertPlugin(plugin: Partial<Plugin> & { match: Match; code: PluginCode }): Promise<Plugin> {
  return storageMutex(async () => {
    const map = await getPluginsMap();
    const id = plugin.id || generatePluginId();
    const prev = map[id];
    const version = ((prev?.version ?? 0) + 1);

    // Snapshot previous version into history (cap at 10)
    let history = prev?._history ? [...prev._history] : [];
    if (prev) {
      const snapshot: PluginVersion = {
        version: prev.version,
        code: prev.code,
        match: prev.match,
        matchAll: prev.matchAll,
        exclude: prev.exclude,
        savedAt: prev.updatedAt
      };
      history.unshift(snapshot);
      if (history.length > 10) history = history.slice(0, 10);
    }

    const saved: Plugin = {
      ...prev,
      ...plugin,
      id,
      enabled: plugin.enabled ?? prev?.enabled ?? true,
      priority: plugin.priority ?? prev?.priority ?? 100,
      source: (plugin.source ?? prev?.source ?? "user") as PluginSource,
      definitionId: plugin.definitionId ?? prev?.definitionId ?? null,
      settings: plugin.settings ?? prev?.settings ?? {},
      name: plugin.name ?? prev?.name ?? "",
      description: plugin.description ?? prev?.description ?? "",
      platform: plugin.platform ?? prev?.platform ?? "",
      version,
      match: plugin.match,
      code: plugin.code,
      _history: history.length > 0 ? history : undefined,
      updatedAt: nowIso(),
      createdAt: prev?.createdAt ?? nowIso()
    };
    map[id] = saved;
    await setPluginsMap(map);
    return saved;
  });
}

export async function deletePlugin(pluginId: string): Promise<boolean> {
  return storageMutex(async () => {
    const map = await getPluginsMap();
    if (!map[pluginId]) return false;
    delete map[pluginId];
    await setPluginsMap(map);
    return true;
  });
}

export async function forkPlugin(pluginId: string): Promise<Plugin | null> {
  const original = await getPlugin(pluginId);
  if (!original) return null;
  return upsertPlugin({
    match: original.match,
    matchAll: original.matchAll,
    exclude: original.exclude,
    name: original.name + " (copy)",
    description: original.description,
    platform: original.platform,
    source: "user",
    definitionId: null,
    settings: { ...original.settings },
    code: { ...original.code },
  });
}

export async function togglePlugin(pluginId: string): Promise<Plugin | null> {
  return storageMutex(async () => {
    const map = await getPluginsMap();
    const plugin = map[pluginId];
    if (!plugin) return null;
    plugin.enabled = plugin.enabled === false;
    plugin.version = (plugin.version ?? 0) + 1;
    plugin.updatedAt = nowIso();
    map[pluginId] = plugin;
    await setPluginsMap(map);
    return plugin;
  });
}
