// Pure plugin matching functions. Zero I/O.
import type { Match, Scope, Plugin } from "../types/plugin";

// ── Regex cache for glob/regex patterns ──
const _regexCache = new Map<string, RegExp>();
const REGEX_CACHE_MAX = 200;

function getCachedRegex(key: string, builder: () => RegExp): RegExp {
  let re = _regexCache.get(key);
  if (re) return re;
  if (_regexCache.size >= REGEX_CACHE_MAX) _regexCache.clear();
  re = builder();
  _regexCache.set(key, re);
  return re;
}

// ── Host matching ──

export function hostMatches(host: string, pattern: string): boolean {
  if (pattern === "*") return true;
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1); // ".atlassian.net"
    return host.endsWith(suffix) || host === pattern.slice(2);
  }
  return host === pattern;
}

// ── Glob matching ──

export function globToRegex(pattern: string): RegExp {
  // Format: scheme://host/path where * = single segment, ** = any
  // Examples: "*://github.com/*/issues/*", "https://*.example.com/**"
  let regexStr = "";
  let i = 0;
  while (i < pattern.length) {
    if (pattern[i] === "*" && pattern[i + 1] === "*") {
      regexStr += ".*";
      i += 2;
    } else if (pattern[i] === "*") {
      regexStr += "[^/]*";
      i += 1;
    } else if (".+?^${}()|[]\\".includes(pattern[i]!)) {
      regexStr += "\\" + pattern[i];
      i += 1;
    } else {
      regexStr += pattern[i];
      i += 1;
    }
  }
  return new RegExp("^" + regexStr + "$", "i");
}

export function globMatchesUrl(pattern: string, urlObj: URL): boolean {
  const re = getCachedRegex("glob:" + pattern, () => globToRegex(pattern));
  return re.test(urlObj.href);
}

// ── Regex matching ──

export function regexMatchesUrl(pattern: string, flags: string | undefined, urlObj: URL): boolean {
  const effectiveFlags = flags ?? "i";
  const key = "regex:" + effectiveFlags + ":" + pattern;
  try {
    const re = getCachedRegex(key, () => new RegExp(pattern, effectiveFlags));
    return re.test(urlObj.href);
  } catch {
    return false;
  }
}

// ── Core URL matching ──

export function matchesUrl(match: Match, urlObj: URL): boolean {
  if (match.type === "site") return hostMatches(urlObj.host, match.host);
  if (match.type === "path") return hostMatches(urlObj.host, match.host) && urlObj.pathname.startsWith(match.pathPrefix);
  if (match.type === "exact") return urlObj.href === match.url;
  if (match.type === "glob") return globMatchesUrl(match.pattern, urlObj);
  if (match.type === "regex") return regexMatchesUrl(match.pattern, match.flags, urlObj);
  return false;
}

// ── Plugin-level matching (with exclude + matchAll) ──

export function pluginMatchesUrl(plugin: Pick<Plugin, "match" | "matchAll" | "exclude">, urlObj: URL): boolean {
  // Check excludes first (early exit)
  if (plugin.exclude) {
    for (const ex of plugin.exclude) {
      if (matchesUrl(ex, urlObj)) return false;
    }
  }
  // Check primary match
  if (matchesUrl(plugin.match, urlObj)) return true;
  // Check additional patterns (OR logic)
  if (plugin.matchAll) {
    for (const m of plugin.matchAll) {
      if (matchesUrl(m, urlObj)) return true;
    }
  }
  return false;
}

// ── Specificity ──

export function matchSpecificity(match: Match): number {
  if (match.type === "exact") return 3000;
  if (match.type === "path") return 2000 + (match.pathPrefix?.length ?? 0);
  if (match.type === "site") {
    if (match.host === "*") return 500;
    return 1000;
  }
  if (match.type === "glob") return 1500;
  if (match.type === "regex") return 1500;
  return 0;
}

function pluginMaxSpecificity(plugin: Pick<Plugin, "match" | "matchAll">, urlObj: URL): number {
  let max = matchesUrl(plugin.match, urlObj) ? matchSpecificity(plugin.match) : 0;
  if (plugin.matchAll) {
    for (const m of plugin.matchAll) {
      if (matchesUrl(m, urlObj)) {
        const s = matchSpecificity(m);
        if (s > max) max = s;
      }
    }
  }
  return max || matchSpecificity(plugin.match);
}

// ── Find matching plugins ──

export function findMatchingPlugins(plugins: Plugin[], url: string): Plugin[] {
  let urlObj: URL;
  try { urlObj = new URL(url); } catch { return []; }
  const candidates = plugins.filter(p => p?.match && p.enabled !== false && pluginMatchesUrl(p, urlObj));
  candidates.sort((a, b) => {
    const specDiff = pluginMaxSpecificity(a, urlObj) - pluginMaxSpecificity(b, urlObj);
    if (specDiff !== 0) return specDiff;
    return (a.priority ?? 100) - (b.priority ?? 100);
  });
  return candidates;
}

export function matchFromScope(url: string, scope: Scope): Match {
  const u = new URL(url);
  if (scope === "exact") return { type: "exact", url: u.href };
  if (scope === "path") return { type: "path", host: u.host, pathPrefix: u.pathname };
  return { type: "site", host: u.host };
}
