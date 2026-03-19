import type { Plugin } from "../types/plugin";
import type { ExportedPlugin, ExportedPluginData, ExportedBackup } from "../types/transfer";
import { getPlugin, getAllPlugins, upsertPlugin, generatePluginId } from "./plugins";
import { nowIso } from "../lib/utils";

// ── Export ──

function pluginToExportData(plugin: Plugin): ExportedPluginData {
  return {
    name: plugin.name,
    description: plugin.description,
    platform: plugin.platform,
    match: plugin.match,
    matchAll: plugin.matchAll,
    exclude: plugin.exclude,
    code: plugin.code,
    settings: plugin.settings,
    source: plugin.source,
    definitionId: plugin.definitionId,
    priority: plugin.priority,
    runAt: plugin.runAt,
  };
}

export async function exportPlugin(pluginId: string): Promise<ExportedPlugin | null> {
  const plugin = await getPlugin(pluginId);
  if (!plugin) return null;
  return {
    $schema: "https://domo.dev/schemas/plugin-export-v1.json",
    formatVersion: 1,
    exportedAt: nowIso(),
    plugin: pluginToExportData(plugin),
  };
}

export async function exportAllPlugins(opts?: { includeSystem?: boolean }): Promise<ExportedBackup> {
  let plugins = await getAllPlugins();
  if (!opts?.includeSystem) {
    plugins = plugins.filter(p => p.source !== "system");
  }
  return {
    $schema: "https://domo.dev/schemas/backup-v1.json",
    formatVersion: 1,
    exportedAt: nowIso(),
    plugins: plugins.map(pluginToExportData),
  };
}

export async function pluginToClipboard(pluginId: string): Promise<boolean> {
  const exported = await exportPlugin(pluginId);
  if (!exported) return false;
  try {
    await navigator.clipboard.writeText(JSON.stringify(exported, null, 2));
    return true;
  } catch {
    return false;
  }
}

// ── Validation ──

export function validateImport(data: unknown): { valid: boolean; error?: string; type?: "single" | "backup" } {
  if (!data || typeof data !== "object") return { valid: false, error: "Invalid JSON" };
  const d = data as Record<string, unknown>;

  // Single plugin export
  if (d.plugin && typeof d.plugin === "object") {
    const p = d.plugin as Record<string, unknown>;
    if (!p.name || !p.match || !p.code) return { valid: false, error: "Missing required fields (name, match, code)" };
    const match = p.match as Record<string, unknown>;
    if (!match.type) return { valid: false, error: "Invalid match format" };
    return { valid: true, type: "single" };
  }

  // Backup
  if (Array.isArray(d.plugins)) {
    if (d.plugins.length === 0) return { valid: false, error: "Backup contains no plugins" };
    for (let i = 0; i < d.plugins.length; i++) {
      const p = d.plugins[i] as Record<string, unknown>;
      if (!p.match || !p.code) return { valid: false, error: `Plugin ${i} missing match or code` };
    }
    return { valid: true, type: "backup" };
  }

  return { valid: false, error: "Unrecognized format" };
}

// ── Import ──

export type ConflictStrategy = "skip" | "replace" | "duplicate";

function findConflict(existing: Plugin[], imported: ExportedPluginData): Plugin | null {
  // Match by definitionId first
  if (imported.definitionId) {
    const match = existing.find(p => p.definitionId === imported.definitionId);
    if (match) return match;
  }
  // Match by name + match type + host
  return existing.find(p => {
    if (p.name !== imported.name) return false;
    if (p.match.type !== imported.match.type) return false;
    return true;
  }) || null;
}

async function importSinglePlugin(data: ExportedPluginData, strategy: ConflictStrategy, existingPlugins: Plugin[]): Promise<{ imported: boolean; skipped: boolean; replaced: boolean }> {
  const conflict = findConflict(existingPlugins, data);

  if (conflict) {
    if (strategy === "skip") return { imported: false, skipped: true, replaced: false };
    if (strategy === "replace") {
      await upsertPlugin({
        id: conflict.id,
        match: data.match,
        matchAll: data.matchAll,
        exclude: data.exclude,
        name: data.name,
        description: data.description,
        platform: data.platform,
        source: data.source || "user",
        definitionId: data.definitionId,
        priority: data.priority,
        settings: data.settings || {},
        code: data.code,
        runAt: data.runAt,
      });
      return { imported: true, skipped: false, replaced: true };
    }
    // "duplicate" — fall through to create new
  }

  await upsertPlugin({
    match: data.match,
    matchAll: data.matchAll,
    exclude: data.exclude,
    name: data.name,
    description: data.description,
    platform: data.platform,
    source: data.source || "user",
    definitionId: strategy === "duplicate" && conflict ? null : data.definitionId,
    priority: data.priority,
    settings: data.settings || {},
    code: data.code,
    runAt: data.runAt,
  });
  return { imported: true, skipped: false, replaced: false };
}

export async function importPlugin(data: unknown, strategy: ConflictStrategy): Promise<{ imported: number; skipped: number; replaced: number }> {
  const validation = validateImport(data);
  if (!validation.valid) throw new Error(validation.error || "Invalid import data");

  const existing = await getAllPlugins();
  const result = { imported: 0, skipped: 0, replaced: 0 };

  if (validation.type === "single") {
    const d = (data as ExportedPlugin).plugin;
    const r = await importSinglePlugin(d, strategy, existing);
    if (r.imported) result.imported++;
    if (r.skipped) result.skipped++;
    if (r.replaced) result.replaced++;
  } else {
    const plugins = (data as ExportedBackup).plugins;
    for (const p of plugins) {
      const r = await importSinglePlugin(p, strategy, existing);
      if (r.imported) result.imported++;
      if (r.skipped) result.skipped++;
      if (r.replaced) result.replaced++;
    }
  }

  return result;
}

export async function importFromUrl(url: string, strategy: ConflictStrategy): Promise<{ imported: number; skipped: number; replaced: number }> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return importPlugin(data, strategy);
}
