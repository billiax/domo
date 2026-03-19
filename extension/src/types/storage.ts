import type { Plugin } from "./plugin";
import type { PluginMeta } from "./plugin";

export interface HiderSelector {
  selector: string;
  addedAt: string;
  label: string | null;
}

export interface HiderEntry {
  selectors: HiderSelector[];
  updatedAt: string | null;
}

export interface Settings {
  registryUrl: string;
  theme?: string;
  githubToken?: string;
  lastScope?: string;
  collapsedSections?: string[];
  discoverSort?: string;
  onboardingDone?: boolean;
}

export interface CatalogCache {
  data: PluginMeta[];
  timestamp: number;
  etag?: string;
}

export interface StorageSchema {
  domo_plugins: Record<string, Plugin>;
  domo_settings: Settings;
  domo_catalog_cache: CatalogCache;
  domo_version: number;
}
