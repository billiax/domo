import type { Settings, CatalogCache } from "../types/storage";

export const STORAGE_KEY_SETTINGS = "domo_settings";
export const STORAGE_KEY_CATALOG_CACHE = "domo_catalog_cache";
export const STORAGE_KEY_VERSION = "domo_version";

// ── Settings ──

const REGISTRY_URL = "https://raw.githubusercontent.com/billiax/domo/main/templates/registry.json";

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get(STORAGE_KEY_SETTINGS);
  const settings = (data[STORAGE_KEY_SETTINGS] as Partial<Settings>) || {};
  return {
    ...settings,
    registryUrl: REGISTRY_URL,
  };
}

export async function updateSettings(partial: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: { ...current, ...partial } });
}

// ── Catalog Cache ──

export async function getCatalogCache(): Promise<CatalogCache | null> {
  const data = await chrome.storage.local.get(STORAGE_KEY_CATALOG_CACHE);
  return (data[STORAGE_KEY_CATALOG_CACHE] as CatalogCache) || null;
}

export async function setCatalogCache(cache: CatalogCache): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_CATALOG_CACHE]: cache });
}

// ── Storage Version ──

export async function getStorageVersion(): Promise<number> {
  const data = await chrome.storage.local.get(STORAGE_KEY_VERSION);
  return (data[STORAGE_KEY_VERSION] as number) || 0;
}

export async function setStorageVersion(version: number): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_VERSION]: version });
}
