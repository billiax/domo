import type { Plugin } from "../types/plugin";
import { getBundledDefinition, reloadInstalledPlugin } from "./catalog";
import { getCatalogCache } from "./storage";

export interface UpdateInfo {
  pluginId: string;
  pluginName: string;
  currentVersion: string;
  availableVersion: string;
  isModified: boolean;
}

export function checkForUpdates(plugins: Plugin[], catalogVersions?: Record<string, string>): UpdateInfo[] {
  const updates: UpdateInfo[] = [];

  for (const plugin of plugins) {
    if (plugin.source !== "catalog" || !plugin.definitionId) continue;

    // Check bundled definition first (system plugins), then remote catalog cache
    const bundled = getBundledDefinition(plugin.definitionId);
    const availableVersion = bundled?.version || catalogVersions?.[plugin.definitionId];
    if (!availableVersion) continue;

    const installedVersion = plugin.installedDefVersion || plugin._definition?.version || "";
    if (!installedVersion || installedVersion === availableVersion) continue;

    updates.push({
      pluginId: plugin.id,
      pluginName: plugin.name,
      currentVersion: installedVersion,
      availableVersion,
      isModified: plugin.modified === true,
    });
  }

  return updates;
}

/** Build a definitionId→version map from the cached catalog for update checks */
export async function getCatalogVersionMap(): Promise<Record<string, string>> {
  const cache = await getCatalogCache();
  if (!cache?.data) return {};
  const map: Record<string, string> = {};
  for (const entry of cache.data) {
    if (entry.id && entry.version) map[entry.id] = entry.version;
  }
  return map;
}

export async function updatePlugin(pluginId: string): Promise<Plugin | null> {
  return reloadInstalledPlugin(pluginId);
}

export async function updateAllPlugins(pluginIds: string[]): Promise<{ updated: number; skipped: number; failed: number }> {
  let updated = 0, skipped = 0, failed = 0;

  for (const id of pluginIds) {
    try {
      const result = await updatePlugin(id);
      if (result) updated++;
      else skipped++;
    } catch {
      failed++;
    }
  }

  return { updated, skipped, failed };
}
