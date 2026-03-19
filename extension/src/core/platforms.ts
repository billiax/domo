import type { PlatformInfo, Match } from "../types";
import { hostMatches } from "./matching";

const KNOWN_PLATFORMS: PlatformInfo[] = [
  { id: "github", name: "GitHub", hostPatterns: ["github.com"] },
  { id: "jira", name: "Jira", hostPatterns: ["*.atlassian.net"] },
  { id: "youtube", name: "YouTube", hostPatterns: ["youtube.com", "www.youtube.com"] },
  { id: "linkedin", name: "LinkedIn", hostPatterns: ["linkedin.com", "www.linkedin.com"] },
];

export function detectPlatform(match: Match): string {
  let host: string | undefined;
  if (match.type === "site") host = match.host;
  else if (match.type === "path") host = match.host;
  else if (match.type === "exact") {
    try { host = new URL(match.url).host; } catch { /* ignore */ }
  } else if (match.type === "glob") {
    const m = match.pattern.match(/^[^:]+:\/\/([^/]+)/);
    if (m) host = m[1]!.replace(/^\*\./, "").replace(/^\*$/, "");
  } else if (match.type === "regex") {
    return "custom"; // Can't reliably extract host from regex
  }
  if (!host) return "custom";

  for (const platform of KNOWN_PLATFORMS) {
    for (const pattern of platform.hostPatterns) {
      if (hostMatches(host, pattern)) return platform.id;
    }
  }
  return "custom";
}

export function getPlatformInfo(id: string): PlatformInfo | undefined {
  return KNOWN_PLATFORMS.find(p => p.id === id);
}

export function getPlatformLabel(host: string): string {
  for (const platform of KNOWN_PLATFORMS) {
    for (const pattern of platform.hostPatterns) {
      if (hostMatches(host, pattern)) return platform.name;
    }
  }
  return host;
}

export function getAllPlatforms(): PlatformInfo[] {
  return KNOWN_PLATFORMS;
}
