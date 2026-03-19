import { describe, it, expect } from "vitest";
import {
  hostMatches, matchesUrl, matchSpecificity, findMatchingPlugins,
  matchFromScope, globToRegex, globMatchesUrl, regexMatchesUrl,
  pluginMatchesUrl
} from "./matching";
import type { Match, Plugin } from "../types/plugin";

// ── hostMatches ──

describe("hostMatches", () => {
  it("matches exact host", () => {
    expect(hostMatches("github.com", "github.com")).toBe(true);
  });
  it("rejects different host", () => {
    expect(hostMatches("gitlab.com", "github.com")).toBe(false);
  });
  it("wildcard * matches any host", () => {
    expect(hostMatches("anything.com", "*")).toBe(true);
  });
  it("*.domain matches subdomains", () => {
    expect(hostMatches("foo.atlassian.net", "*.atlassian.net")).toBe(true);
  });
  it("*.domain matches bare domain", () => {
    expect(hostMatches("atlassian.net", "*.atlassian.net")).toBe(true);
  });
  it("*.domain rejects unrelated host", () => {
    expect(hostMatches("github.com", "*.atlassian.net")).toBe(false);
  });
});

// ── matchesUrl — site ──

describe("matchesUrl — site", () => {
  const url = new URL("https://github.com/user/repo");
  it("matches site by host", () => {
    expect(matchesUrl({ type: "site", host: "github.com" }, url)).toBe(true);
  });
  it("rejects wrong host", () => {
    expect(matchesUrl({ type: "site", host: "gitlab.com" }, url)).toBe(false);
  });
  it("wildcard * matches any", () => {
    expect(matchesUrl({ type: "site", host: "*" }, url)).toBe(true);
  });
});

// ── matchesUrl — path ──

describe("matchesUrl — path", () => {
  const url = new URL("https://github.com/user/repo/issues");
  it("matches path prefix", () => {
    expect(matchesUrl({ type: "path", host: "github.com", pathPrefix: "/user/repo" }, url)).toBe(true);
  });
  it("rejects wrong prefix", () => {
    expect(matchesUrl({ type: "path", host: "github.com", pathPrefix: "/other" }, url)).toBe(false);
  });
  it("rejects wrong host", () => {
    expect(matchesUrl({ type: "path", host: "gitlab.com", pathPrefix: "/user/repo" }, url)).toBe(false);
  });
});

// ── matchesUrl — exact ──

describe("matchesUrl — exact", () => {
  const url = new URL("https://github.com/user/repo");
  it("matches exact URL", () => {
    expect(matchesUrl({ type: "exact", url: "https://github.com/user/repo" }, url)).toBe(true);
  });
  it("rejects different URL", () => {
    expect(matchesUrl({ type: "exact", url: "https://github.com/other" }, url)).toBe(false);
  });
});

// ── matchesUrl — glob ──

describe("matchesUrl — glob", () => {
  it("matches simple glob", () => {
    const url = new URL("https://github.com/user/issues");
    expect(matchesUrl({ type: "glob", pattern: "https://github.com/*/issues" }, url)).toBe(true);
  });
  it("rejects non-matching glob", () => {
    const url = new URL("https://github.com/user/pulls");
    expect(matchesUrl({ type: "glob", pattern: "https://github.com/*/issues" }, url)).toBe(false);
  });
  it("** matches any depth", () => {
    const url = new URL("https://github.com/a/b/c/d");
    expect(matchesUrl({ type: "glob", pattern: "https://github.com/**" }, url)).toBe(true);
  });
  it("scheme wildcard", () => {
    const url = new URL("http://example.com/page");
    expect(matchesUrl({ type: "glob", pattern: "*://example.com/page" }, url)).toBe(true);
  });
});

// ── matchesUrl — regex ──

describe("matchesUrl — regex", () => {
  it("matches regex pattern", () => {
    const url = new URL("https://github.com/user/pulls");
    expect(matchesUrl({ type: "regex", pattern: "https://github\\.com/.+/pulls" }, url)).toBe(true);
  });
  it("rejects non-matching regex", () => {
    const url = new URL("https://github.com/user/issues");
    expect(matchesUrl({ type: "regex", pattern: "https://github\\.com/.+/pulls" }, url)).toBe(false);
  });
  it("uses case-insensitive flag by default", () => {
    const url = new URL("https://GitHub.com/user/pulls");
    expect(matchesUrl({ type: "regex", pattern: "https://github\\.com/.+/pulls" }, url)).toBe(true);
  });
  it("respects custom flags", () => {
    // Case-sensitive match: pattern has lowercase path but URL has uppercase
    const url = new URL("https://github.com/User/PULLS");
    expect(matchesUrl({ type: "regex", pattern: "https://github\\.com/user/pulls", flags: "" }, url)).toBe(false);
  });
  it("invalid regex returns false", () => {
    const url = new URL("https://example.com");
    expect(matchesUrl({ type: "regex", pattern: "[invalid" }, url)).toBe(false);
  });
});

// ── globToRegex ──

describe("globToRegex", () => {
  it("converts * to [^/]*", () => {
    const re = globToRegex("*://*/path");
    expect(re.test("https://example.com/path")).toBe(true);
    expect(re.test("https://example.com/other")).toBe(false);
  });
  it("converts ** to .*", () => {
    const re = globToRegex("https://example.com/**");
    expect(re.test("https://example.com/a/b/c")).toBe(true);
  });
  it("escapes special chars", () => {
    const re = globToRegex("https://example.com/path?q=1");
    expect(re.test("https://example.com/path?q=1")).toBe(true);
  });
});

// ── pluginMatchesUrl ──

describe("pluginMatchesUrl", () => {
  const url = new URL("https://github.com/user/repo");

  it("matches primary match", () => {
    const plugin = { match: { type: "site" as const, host: "github.com" } };
    expect(pluginMatchesUrl(plugin, url)).toBe(true);
  });

  it("matches via matchAll", () => {
    const plugin = {
      match: { type: "site" as const, host: "gitlab.com" },
      matchAll: [{ type: "site" as const, host: "github.com" }]
    };
    expect(pluginMatchesUrl(plugin, url)).toBe(true);
  });

  it("excluded URL returns false", () => {
    const plugin = {
      match: { type: "site" as const, host: "github.com" },
      exclude: [{ type: "path" as const, host: "github.com", pathPrefix: "/user/repo" }]
    };
    expect(pluginMatchesUrl(plugin, url)).toBe(false);
  });

  it("exclude checked before match", () => {
    const plugin = {
      match: { type: "site" as const, host: "github.com" },
      exclude: [{ type: "site" as const, host: "github.com" }]
    };
    expect(pluginMatchesUrl(plugin, url)).toBe(false);
  });

  it("matchAll doesn't match if excluded", () => {
    const plugin = {
      match: { type: "site" as const, host: "gitlab.com" },
      matchAll: [{ type: "site" as const, host: "github.com" }],
      exclude: [{ type: "exact" as const, url: "https://github.com/user/repo" }]
    };
    expect(pluginMatchesUrl(plugin, url)).toBe(false);
  });
});

// ── matchSpecificity ──

describe("matchSpecificity", () => {
  it("exact = 3000", () => {
    expect(matchSpecificity({ type: "exact", url: "x" })).toBe(3000);
  });
  it("path = 2000 + path length", () => {
    expect(matchSpecificity({ type: "path", host: "x", pathPrefix: "/foo" })).toBe(2004);
  });
  it("site = 1000", () => {
    expect(matchSpecificity({ type: "site", host: "x" })).toBe(1000);
  });
  it("global site = 500", () => {
    expect(matchSpecificity({ type: "site", host: "*" })).toBe(500);
  });
  it("glob = 1500", () => {
    expect(matchSpecificity({ type: "glob", pattern: "x" })).toBe(1500);
  });
  it("regex = 1500", () => {
    expect(matchSpecificity({ type: "regex", pattern: "x" })).toBe(1500);
  });
});

// ── findMatchingPlugins ──

describe("findMatchingPlugins", () => {
  const makePlugin = (id: string, match: Match, priority = 100, enabled = true): Plugin => ({
    id, match, name: id, description: "", platform: "", source: "user",
    definitionId: null, enabled, priority, version: 1, settings: {},
    code: { css: "", html: "", js: "" }, createdAt: "", updatedAt: ""
  });

  it("returns matching plugins", () => {
    const plugins = [
      makePlugin("a", { type: "site", host: "github.com" }),
      makePlugin("b", { type: "site", host: "gitlab.com" }),
    ];
    const result = findMatchingPlugins(plugins, "https://github.com/user");
    expect(result.map(p => p.id)).toEqual(["a"]);
  });

  it("excludes disabled plugins", () => {
    const plugins = [
      makePlugin("a", { type: "site", host: "github.com" }, 100, false),
    ];
    expect(findMatchingPlugins(plugins, "https://github.com/user")).toEqual([]);
  });

  it("sorts by specificity then priority", () => {
    const plugins = [
      makePlugin("site", { type: "site", host: "github.com" }, 100),
      makePlugin("path", { type: "path", host: "github.com", pathPrefix: "/user" }, 100),
      makePlugin("exact", { type: "exact", url: "https://github.com/user" }, 100),
    ];
    const result = findMatchingPlugins(plugins, "https://github.com/user");
    expect(result.map(p => p.id)).toEqual(["site", "path", "exact"]);
  });

  it("same specificity sorts by priority", () => {
    const plugins = [
      makePlugin("b", { type: "site", host: "github.com" }, 200),
      makePlugin("a", { type: "site", host: "github.com" }, 50),
    ];
    const result = findMatchingPlugins(plugins, "https://github.com");
    expect(result.map(p => p.id)).toEqual(["a", "b"]);
  });

  it("handles invalid URL gracefully", () => {
    expect(findMatchingPlugins([], "not-a-url")).toEqual([]);
  });
});

// ── matchFromScope ──

describe("matchFromScope", () => {
  it("exact scope", () => {
    const m = matchFromScope("https://example.com/page?q=1", "exact");
    expect(m.type).toBe("exact");
    expect((m as any).url).toBe("https://example.com/page?q=1");
  });
  it("path scope", () => {
    const m = matchFromScope("https://example.com/page", "path");
    expect(m.type).toBe("path");
    expect((m as any).pathPrefix).toBe("/page");
  });
  it("site scope", () => {
    const m = matchFromScope("https://example.com/page", "site");
    expect(m.type).toBe("site");
    expect((m as any).host).toBe("example.com");
  });
});
