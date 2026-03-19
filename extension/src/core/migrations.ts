import { getStorageVersion, setStorageVersion } from "./storage";
import { STORAGE_KEY_PLUGINS, generatePluginId } from "./plugins";
import { detectPlatform } from "./platforms";
import type { Plugin, PluginSource, Match } from "../types/plugin";

interface Migration {
  version: number;
  description: string;
  migrate: () => Promise<void>;
}

const CURRENT_VERSION = 4;

const migrations: Migration[] = [
  {
    version: 2,
    description: "Convert rules to plugins, rename registry_cache to catalog_cache",
    migrate: async () => {
      // Read old rules
      const rulesData = await chrome.storage.local.get("domo_rules");
      const oldRules = (rulesData["domo_rules"] as Record<string, Record<string, unknown>>) || {};

      // Transform rules → plugins
      const plugins: Record<string, Plugin> = {};
      for (const [_oldId, rule] of Object.entries(oldRules)) {
        const newId = generatePluginId();
        const oldSource = (rule.source as string) || "user";
        let source: PluginSource = "user";
        if (oldSource === "template") source = "catalog";
        else if (oldSource === "ai") source = "ai";

        const match = rule.match as Match;
        const platform = detectPlatform(match);

        plugins[newId] = {
          id: newId,
          match,
          name: (rule.instruction as string) || (rule.templateId as string) || "",
          description: "",
          platform,
          source,
          definitionId: (rule.templateId as string) || null,
          enabled: (rule.enabled as boolean) ?? true,
          priority: (rule.priority as number) ?? 100,
          version: (rule.version as number) ?? 1,
          settings: (rule.options as Record<string, unknown>) || {},
          code: (rule.code as Plugin["code"]) || { css: "", html: "", js: "" },
          _definition: rule._template as Plugin["_definition"],
          contextMeta: rule.contextMeta as Plugin["contextMeta"],
          createdAt: (rule.createdAt as string) || new Date().toISOString(),
          updatedAt: (rule.updatedAt as string) || new Date().toISOString()
        };
      }

      // Write new plugins
      await chrome.storage.local.set({ [STORAGE_KEY_PLUGINS]: plugins });

      // Rename registry cache → catalog cache
      const cacheData = await chrome.storage.local.get("domo_registry_cache");
      if (cacheData["domo_registry_cache"]) {
        await chrome.storage.local.set({ "domo_catalog_cache": cacheData["domo_registry_cache"] });
        await chrome.storage.local.remove("domo_registry_cache");
      }

      // Remove old keys
      await chrome.storage.local.remove("domo_rules");
    }
  },
  {
    version: 3,
    description: "Remove legacy domo_hiders and domo_features keys, clean up old system plugins",
    migrate: async () => {
      // Remove old storage keys (hiders now managed by the hider plugin via localStorage)
      await chrome.storage.local.remove(["domo_hiders", "domo_features"]);

      // Remove any old system plugins from a previous migration attempt
      const pluginsData = await chrome.storage.local.get(STORAGE_KEY_PLUGINS);
      const plugins: Record<string, Plugin> = (pluginsData[STORAGE_KEY_PLUGINS] as Record<string, Plugin>) || {};
      let changed = false;
      for (const [id, p] of Object.entries(plugins)) {
        if (p.source === "system") {
          delete plugins[id];
          changed = true;
        }
      }
      if (changed) {
        await chrome.storage.local.set({ [STORAGE_KEY_PLUGINS]: plugins });
      }
    }
  },
  {
    version: 4,
    description: "Add glob/regex match types, exclude patterns, multi-match, plugin history support",
    migrate: async () => {
      // No-op data transformation — all new fields are optional.
      // Clean up stale editor drafts if present.
      await chrome.storage.local.remove(["domo_editor_drafts"]);
    }
  }
];

export async function runMigrations(): Promise<void> {
  const currentVersion = await getStorageVersion();

  if (currentVersion >= CURRENT_VERSION) return;

  const pending = migrations
    .filter(m => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    try {
      console.log(`[domo] Running migration v${migration.version}: ${migration.description}`);
      await migration.migrate();
      await setStorageVersion(migration.version);
    } catch (err) {
      console.error(`[domo] Migration v${migration.version} failed:`, err);
      break;
    }
  }

  // Set to current version even if no migrations ran (first install)
  if (currentVersion === 0) {
    await setStorageVersion(CURRENT_VERSION);
  }
}
