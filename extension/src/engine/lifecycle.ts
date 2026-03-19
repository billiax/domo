import type { SyncState, AppliedPlugin, PluginError } from '../types/engine';
import type { Plugin } from '../types/plugin';
import { getAllPlugins, STORAGE_KEY_PLUGINS, togglePlugin } from '../core/plugins';
import { findMatchingPlugins, pluginMatchesUrl } from '../core/matching';
import { applyPlugin, cleanupPlugin, isDomIntact, repairPlugin } from './injector';
import { watchNavigation } from './matcher';
import { watchDomMutations } from './observer';
import { nowIso } from '../lib/utils';

const MAX_ERRORS_PER_PLUGIN = 5;
const AUTO_DISABLE_THRESHOLD = 3;

/**
 * PluginEngine manages the sync state machine for plugin application.
 *
 * Key design principle: CSS and HTML injected into the DOM can be destroyed
 * externally by SPA routers (which replace <body> content). The engine
 * detects this and re-injects (repairs) without restarting JS, since JS
 * lives in the MAIN world heap, not in the DOM.
 */
export class PluginEngine {
  private state: SyncState = "idle";
  private applied = new Map<string, AppliedPlugin>();
  private pluginErrors = new Map<string, PluginError[]>();
  private consecutiveErrorCounts = new Map<string, number>();
  private navTeardown: (() => void) | null = null;
  private obsTeardown: (() => void) | null = null;
  private storageListener: ((changes: Record<string, unknown>, areaName: string) => void) | null = null;
  private matchCache: { url: string; pluginIds: string[]; storageVersion: number } | null = null;
  private storageVersion = 0;
  private earlyPlugins: Plugin[] | null = null;

  /** Optionally pass early-read plugins to avoid re-reading storage on first sync */
  setEarlyPlugins(plugins: Plugin[]): void {
    this.earlyPlugins = plugins;
  }

  async init(): Promise<void> {
    // Initial sync
    await this.sync();

    // Watch for navigation changes (SPA pushState/popstate)
    this.navTeardown = watchNavigation(() => this.sync());

    // Watch for DOM mutations — two callbacks:
    // 1. Immediate: when our own injected elements are removed (SPA router wipe)
    // 2. Debounced: general DOM changes that may need re-sync
    this.obsTeardown = watchDomMutations(
      // Debounced callback for general DOM changes
      () => {
        if (this.applied.size > 0) {
          this.sync();
        }
      },
      // Immediate callback when our injected elements are destroyed
      () => {
        this.repairAllDom();
      }
    );

    // Watch for storage changes (plugin install/update/toggle from sidepanel)
    this.storageListener = (changes, areaName) => {
      if (areaName !== "local") return;
      if (changes[STORAGE_KEY_PLUGINS]) {
        this.storageVersion++;
        this.matchCache = null;
        this.sync();
      }
    };
    chrome.storage.onChanged.addListener(this.storageListener);
  }

  /**
   * Fast DOM repair pass — no storage reads, no async.
   * Checks if any applied plugin's DOM elements were destroyed and re-creates them.
   * This is the fast path for SPA router body wipes.
   */
  private repairAllDom(): void {
    for (const applied of this.applied.values()) {
      if (!isDomIntact(applied)) {
        repairPlugin(applied);
      }
    }
  }

  private recordError(plugin: Plugin, phase: PluginError["phase"], err: Error): void {
    const pluginError: PluginError = {
      pluginId: plugin.id,
      pluginName: plugin.name || plugin.id,
      timestamp: nowIso(),
      phase,
      message: err.message || String(err),
      stack: err.stack
    };

    let errors = this.pluginErrors.get(plugin.id) || [];
    errors.unshift(pluginError);
    if (errors.length > MAX_ERRORS_PER_PLUGIN) errors = errors.slice(0, MAX_ERRORS_PER_PLUGIN);
    this.pluginErrors.set(plugin.id, errors);

    const count = (this.consecutiveErrorCounts.get(plugin.id) ?? 0) + 1;
    this.consecutiveErrorCounts.set(plugin.id, count);
  }

  private async autoDisableIfNeeded(plugin: Plugin): Promise<boolean> {
    const count = this.consecutiveErrorCounts.get(plugin.id) ?? 0;
    if (count >= AUTO_DISABLE_THRESHOLD) {
      try {
        await togglePlugin(plugin.id);
        this.consecutiveErrorCounts.delete(plugin.id);
        try {
          chrome.runtime.sendMessage({
            target: "sidepanel",
            type: "pluginAutoDisabled",
            pluginId: plugin.id,
            pluginName: plugin.name || plugin.id
          });
        } catch { /* sidepanel may not be open */ }
        return true;
      } catch { /* ignore toggle failure */ }
    }
    return false;
  }

  async sync(): Promise<void> {
    // State machine: idle→syncing, syncing→pending
    if (this.state === "syncing") {
      this.state = "pending";
      return;
    }
    this.state = "syncing";

    try {
      try { new URL(location.href); } catch { return; }

      // Use early-read plugins on first sync to avoid double storage read
      let allPlugins: Plugin[];
      if (this.earlyPlugins) {
        allPlugins = this.earlyPlugins;
        this.earlyPlugins = null;
      } else {
        allPlugins = await getAllPlugins();
      }

      // Use matching cache if URL and storage version haven't changed
      const currentUrl = location.href;
      let incomingPlugins: Plugin[];
      if (this.matchCache && this.matchCache.url === currentUrl && this.matchCache.storageVersion === this.storageVersion) {
        const cachedIds = new Set(this.matchCache.pluginIds);
        incomingPlugins = allPlugins.filter(p => cachedIds.has(p.id) && p.enabled !== false);
      } else {
        incomingPlugins = findMatchingPlugins(allPlugins, currentUrl);
        this.matchCache = {
          url: currentUrl,
          pluginIds: incomingPlugins.map(p => p.id),
          storageVersion: this.storageVersion
        };
      }

      const incomingIds = new Set(incomingPlugins.map(p => p.id));

      // Remove plugins no longer in the incoming set
      for (const [pluginId, appliedPlugin] of this.applied) {
        if (!incomingIds.has(pluginId)) {
          cleanupPlugin(appliedPlugin);
          this.applied.delete(pluginId);
          this.pluginErrors.delete(pluginId);
          this.consecutiveErrorCounts.delete(pluginId);
        }
      }

      // Apply/update incoming plugins (each in try/catch for error isolation)
      for (const plugin of incomingPlugins) {
        const existing = this.applied.get(plugin.id);

        if (existing && existing.version === plugin.version) {
          // Same version — but check if DOM elements were destroyed externally
          // (e.g. by SPA router replacing <body> content)
          if (!isDomIntact(existing)) {
            repairPlugin(existing);
          }
          // Also update cached content in case CSS was updated via updateCSS
          // without a version bump
          const newCss = plugin.code.css || "";
          if (existing.cssContent !== newCss) {
            existing.cssContent = newCss;
            if (existing.styleEl?.isConnected) {
              existing.styleEl.textContent = newCss;
            }
          }
          // Clear consecutive error count on successful presence
          this.consecutiveErrorCounts.delete(plugin.id);
          continue;
        }

        // Clean up previous version
        if (existing) {
          cleanupPlugin(existing);
        }

        try {
          const appliedPlugin = applyPlugin(plugin);
          this.applied.set(plugin.id, appliedPlugin);
          this.consecutiveErrorCounts.delete(plugin.id);
        } catch (err) {
          console.warn(`[domo] Error applying plugin ${plugin.id}:`, (err as Error).message);
          this.recordError(plugin, "sync", err as Error);
          const disabled = await this.autoDisableIfNeeded(plugin);
          if (disabled) {
            console.warn(`[domo] Auto-disabled plugin ${plugin.id} after ${AUTO_DISABLE_THRESHOLD} consecutive errors`);
          }
        }
      }

      // Notify side panel
      const count = incomingPlugins.length;
      const errors = this.pluginErrors.size > 0
        ? Object.fromEntries(this.pluginErrors)
        : undefined;
      try {
        chrome.runtime.sendMessage({ target: "sidepanel", type: "pluginsUpdated", count, hiderCount: 0, errors });
      } catch { /* sidepanel may not be open */ }
    } catch (err) {
      console.warn("[domo] sync error:", (err as Error).message);
    } finally {
      // Cast needed because TS can't track async mutations to this.state
      const wasState = this.state as SyncState;
      this.state = "idle";
      if (wasState === "pending") {
        // Re-enter sync for queued request
        this.sync();
      }
    }
  }

  destroy(): void {
    // Tear down watchers
    if (this.navTeardown) {
      this.navTeardown();
      this.navTeardown = null;
    }
    if (this.obsTeardown) {
      this.obsTeardown();
      this.obsTeardown = null;
    }
    if (this.storageListener) {
      chrome.storage.onChanged.removeListener(this.storageListener);
      this.storageListener = null;
    }

    // Clean up all applied plugins
    for (const appliedPlugin of this.applied.values()) {
      cleanupPlugin(appliedPlugin);
    }
    this.applied.clear();
    this.pluginErrors.clear();
    this.consecutiveErrorCounts.clear();
    this.matchCache = null;
    this.state = "idle";
  }

  getApplied(): ReadonlyMap<string, AppliedPlugin> {
    return this.applied;
  }

  getErrors(): ReadonlyMap<string, PluginError[]> {
    return this.pluginErrors;
  }
}
