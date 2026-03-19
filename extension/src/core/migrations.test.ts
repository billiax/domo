import { describe, it, expect, beforeEach } from "vitest";
import { runMigrations } from "./migrations";

describe("runMigrations", () => {
  it("sets version on fresh install", async () => {
    await runMigrations();
    const data = await chrome.storage.local.get("domo_version");
    expect(data.domo_version).toBe(4);
  });

  it("is idempotent", async () => {
    await runMigrations();
    await runMigrations();
    const data = await chrome.storage.local.get("domo_version");
    expect(data.domo_version).toBe(4);
  });

  it("runs v2 migration: rules → plugins", async () => {
    await chrome.storage.local.set({
      domo_version: 1,
      domo_rules: {
        r_abc: {
          source: "template",
          match: { type: "site", host: "github.com" },
          instruction: "Test Rule",
          enabled: true,
          priority: 100,
          version: 1,
          options: {},
          code: { css: "body{}", html: "", js: "" },
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
        },
      },
    });

    await runMigrations();

    const data = await chrome.storage.local.get("domo_plugins");
    const plugins = data.domo_plugins as Record<string, any>;
    const pluginList = Object.values(plugins);
    expect(pluginList.length).toBe(1);
    expect(pluginList[0].source).toBe("catalog");
    expect(pluginList[0].name).toBe("Test Rule");
  });

  it("runs v3 migration: removes legacy keys", async () => {
    await chrome.storage.local.set({
      domo_version: 2,
      domo_hiders: { test: true },
      domo_features: { test: true },
      domo_plugins: {},
    });

    await runMigrations();

    const data = await chrome.storage.local.get(["domo_hiders", "domo_features"]);
    expect(data.domo_hiders).toBeUndefined();
    expect(data.domo_features).toBeUndefined();
  });

  it("runs v4 migration: cleans editor drafts", async () => {
    await chrome.storage.local.set({
      domo_version: 3,
      domo_editor_drafts: { draft: true },
    });

    await runMigrations();

    const data = await chrome.storage.local.get("domo_editor_drafts");
    expect(data.domo_editor_drafts).toBeUndefined();
  });
});
