// Target types (same structure as old Match, just conceptually renamed)
export interface SiteMatch {
  type: "site";
  host: string;
}

export interface PathMatch {
  type: "path";
  host: string;
  pathPrefix: string;
}

export interface ExactMatch {
  type: "exact";
  url: string;
}

export interface GlobMatch {
  type: "glob";
  pattern: string;  // "*://github.com/*/issues/*"
}

export interface RegexMatch {
  type: "regex";
  pattern: string;  // "https://github\\.com/.+/pulls"
  flags?: string;   // default "i"
}

export type Match = SiteMatch | PathMatch | ExactMatch | GlobMatch | RegexMatch;

export type Scope = "site" | "path" | "exact";

// Plugin types
export type PluginSource = "user" | "catalog" | "ai" | "system";

export interface PluginCode {
  css: string;
  html: string;
  js: string;
}

export interface PluginOptionDef {
  type: "boolean" | "string" | "number";
  label?: string;
  default: unknown;
}

export interface PluginDefinition {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  website?: string;
  platform?: string;
  match: Match;
  matchAll?: Match[];
  exclude?: Match[];
  options?: Record<string, PluginOptionDef>;
  code: PluginCode;
  defaultPriority?: number;
}

export interface PluginMeta {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  website?: string;
  platform?: string;
  match?: Match;
  options?: Record<string, PluginOptionDef>;
  _source?: "bundled" | "community";
  _definitionUrl?: string;
}

export interface PluginVersion {
  version: number;
  code: PluginCode;
  match: Match;
  matchAll?: Match[];
  exclude?: Match[];
  savedAt: string;
}

export interface Plugin {
  id: string;
  match: Match;
  matchAll?: Match[];
  exclude?: Match[];
  name: string;
  description: string;
  platform: string;
  source: PluginSource;
  definitionId: string | null;
  enabled: boolean;
  priority: number;
  version: number;
  settings: Record<string, unknown>;
  code: PluginCode;
  modified?: boolean;
  runAt?: "document_start" | "document_idle";
  installedDefVersion?: string;
  lastUpdateCheck?: string;
  _definition?: PluginDefinition;
  _history?: PluginVersion[];
  contextMeta?: {
    url?: string;
    title?: string;
    selected?: { selector: string } | null;
  };
  createdAt: string;
  updatedAt: string;
}
