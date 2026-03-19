import { describe, it, expect, beforeEach } from "vitest";
import { generatePluginId, getAllPlugins, getPlugin, upsertPlugin, deletePlugin, togglePlugin, forkPlugin, validatePlugin } from "./plugins";
import type { Plugin } from "../types/plugin";

describe("generatePluginId", () => {
  it("starts with p_", () => {
    expect(generatePluginId().startsWith("p_")).toBe(true);
  });
  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generatePluginId()));
    expect(ids.size).toBe(50);
  });
});

describe("Plugin CRUD", () => {
  it("creates a new plugin", async () => {
    const plugin = await upsertPlugin({
      match: { type: "site", host: "github.com" },
      name: "Test Plugin",
      code: { css: "body{}", html: "", js: "" },
    });
    expect(plugin.id).toMatch(/^p_/);
    expect(plugin.name).toBe("Test Plugin");
    expect(plugin.version).toBe(1);
    expect(plugin.enabled).toBe(true);
    expect(plugin.source).toBe("user");
  });

  it("gets all plugins", async () => {
    await upsertPlugin({ match: { type: "site", host: "a.com" }, code: { css: "", html: "", js: "" } });
    await upsertPlugin({ match: { type: "site", host: "b.com" }, code: { css: "", html: "", js: "" } });
    const all = await getAllPlugins();
    expect(all.length).toBe(2);
  });

  it("gets a specific plugin", async () => {
    const created = await upsertPlugin({
      match: { type: "site", host: "test.com" },
      name: "Find Me",
      code: { css: "", html: "", js: "" },
    });
    const found = await getPlugin(created.id);
    expect(found?.name).toBe("Find Me");
  });

  it("returns null for missing plugin", async () => {
    expect(await getPlugin("p_nonexistent")).toBeNull();
  });

  it("updates existing plugin and increments version", async () => {
    const created = await upsertPlugin({
      match: { type: "site", host: "test.com" },
      name: "V1",
      code: { css: "a{}", html: "", js: "" },
    });
    expect(created.version).toBe(1);

    const updated = await upsertPlugin({
      id: created.id,
      match: { type: "site", host: "test.com" },
      name: "V2",
      code: { css: "b{}", html: "", js: "" },
    });
    expect(updated.version).toBe(2);
    expect(updated.name).toBe("V2");
  });

  it("snapshots history on update", async () => {
    const created = await upsertPlugin({
      match: { type: "site", host: "test.com" },
      name: "Original",
      code: { css: "original{}", html: "", js: "" },
    });

    const updated = await upsertPlugin({
      id: created.id,
      match: { type: "site", host: "test.com" },
      name: "Updated",
      code: { css: "updated{}", html: "", js: "" },
    });

    expect(updated._history).toBeDefined();
    expect(updated._history!.length).toBe(1);
    expect(updated._history![0]!.code.css).toBe("original{}");
    expect(updated._history![0]!.version).toBe(1);
  });

  it("caps history at 10 entries", async () => {
    let plugin = await upsertPlugin({
      match: { type: "site", host: "test.com" },
      code: { css: "v0", html: "", js: "" },
    });

    for (let i = 1; i <= 12; i++) {
      plugin = await upsertPlugin({
        id: plugin.id,
        match: { type: "site", host: "test.com" },
        code: { css: `v${i}`, html: "", js: "" },
      });
    }

    expect(plugin._history!.length).toBe(10);
  });

  it("deletes a plugin", async () => {
    const created = await upsertPlugin({
      match: { type: "site", host: "test.com" },
      code: { css: "", html: "", js: "" },
    });
    expect(await deletePlugin(created.id)).toBe(true);
    expect(await getPlugin(created.id)).toBeNull();
  });

  it("delete returns false for missing", async () => {
    expect(await deletePlugin("p_nope")).toBe(false);
  });

  it("toggles plugin enabled state", async () => {
    const created = await upsertPlugin({
      match: { type: "site", host: "test.com" },
      code: { css: "", html: "", js: "" },
    });
    expect(created.enabled).toBe(true);

    const toggled = await togglePlugin(created.id);
    expect(toggled!.enabled).toBe(false);

    const toggledBack = await togglePlugin(created.id);
    expect(toggledBack!.enabled).toBe(true);
  });
});

describe("forkPlugin", () => {
  it("creates independent copy", async () => {
    const original = await upsertPlugin({
      match: { type: "site", host: "test.com" },
      name: "Original",
      code: { css: "body{}", html: "", js: "" },
      source: "catalog",
      definitionId: "test-def",
    });

    const fork = await forkPlugin(original.id);
    expect(fork).not.toBeNull();
    expect(fork!.id).not.toBe(original.id);
    expect(fork!.name).toBe("Original (copy)");
    expect(fork!.source).toBe("user");
    expect(fork!.definitionId).toBeNull();
    expect(fork!.code.css).toBe("body{}");
  });

  it("returns null for missing plugin", async () => {
    expect(await forkPlugin("p_nope")).toBeNull();
  });
});

describe("validatePlugin", () => {
  it("accepts valid plugin", () => {
    const plugin = {
      id: "p_test1234",
      match: { type: "site", host: "test.com" },
      code: { css: "", html: "", js: "" },
      enabled: true,
      version: 1,
    };
    expect(validatePlugin(plugin)).not.toBeNull();
  });

  it("rejects null", () => {
    expect(validatePlugin(null)).toBeNull();
  });

  it("rejects invalid id prefix", () => {
    expect(validatePlugin({ id: "x_123", match: { type: "site" }, code: { css: "" } })).toBeNull();
  });

  it("rejects missing match", () => {
    expect(validatePlugin({ id: "p_123", code: { css: "" } })).toBeNull();
  });

  it("rejects invalid match type", () => {
    expect(validatePlugin({ id: "p_123", match: { type: "invalid" }, code: { css: "" } })).toBeNull();
  });

  it("rejects missing code", () => {
    expect(validatePlugin({ id: "p_123", match: { type: "site" } })).toBeNull();
  });
});
