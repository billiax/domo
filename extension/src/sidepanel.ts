import { getStyles } from "./sidepanel/styles";
import { TabLayout } from "./sidepanel/layout";
import { initInstalledTab, refreshInstalledTab } from "./sidepanel/tabs/installed";
import { initDiscoverTab, refreshDiscoverTab } from "./sidepanel/tabs/discover";
import { initCreateTab } from "./sidepanel/tabs/create";
import { installDefinition, getBundledDefinition } from "./core/catalog";
import { getAllPlugins } from "./core/plugins";
import { getPageInfo, setCachedPageInfo, showToast } from "./sidepanel/shared";
import { openSettingsPanel } from "./sidepanel/settings";
import { checkForUpdates, getCatalogVersionMap } from "./core/updates";
import type { PluginError } from "./types/engine";
import { getSettings, updateSettings } from "./core/storage";
import { runMigrations } from "./core/migrations";
import { ensureDefinitionsLoaded, reloadDefinitions, reloadInstalledPlugin } from "./core/catalog";
import { triggerSync } from "./sidepanel/shared";
import { getState, setState, reloadAll, reloadPlugins } from "./sidepanel/state";
import { icon } from "./icons";
import type { PageInfo } from "./sidepanel/shared";

function getThemeIconName(theme: string): string {
  if (theme === "light") return "sun";
  if (theme === "dark") return "moon";
  return "monitor";
}

async function init(): Promise<void> {
  await runMigrations();

  // Load bundled definitions (in dev mode: fetches from extension/templates/ at runtime)
  if (__DEV_MODE__) {
    await reloadDefinitions();
  } else {
    await ensureDefinitionsLoaded();
  }

  // Inject styles
  const style = document.createElement("style");
  style.textContent = getStyles();
  document.head.appendChild(style);

  // Load settings
  const settings = await getSettings();
  const theme = settings.theme || "system";
  document.documentElement.setAttribute("data-theme", theme);

  const app = document.getElementById("app")!;

  // Header
  app.innerHTML = `
    <div class="header">
      <h1>Domo</h1>
      <div class="header-actions">
        ${__DEV_MODE__ ? '<span class="dev-badge">DEV</span>' : ''}
        <button class="btn-icon" id="theme-toggle" title="Theme: ${theme}">${icon(getThemeIconName(theme))}</button>
        <button class="btn-icon" id="settings-btn" title="Settings">${icon("gear")}</button>
      </div>
    </div>
    <div class="page-info-bar" id="page-info">connecting...</div>
  `;

  // Dev mode: auto-reload templates when files change on disk
  if (__DEV_MODE__) {
    let lastVersion = 0;
    let reloading = false;

    async function checkForTemplateChanges(): Promise<void> {
      if (reloading) return;
      try {
        const resp = await fetch(chrome.runtime.getURL("templates/_version.json"), { cache: "no-store" });
        const { timestamp } = await resp.json();
        if (lastVersion === 0) {
          lastVersion = timestamp;
          return; // First check — just record the baseline
        }
        if (timestamp === lastVersion) return;
        lastVersion = timestamp;

        reloading = true;
        await reloadDefinitions();

        // Re-resolve all installed catalog plugins
        const { plugins } = getState();
        const catalogPlugins = plugins.filter(p => p.source === "catalog" && p.definitionId);
        let reloaded = 0;
        for (const p of catalogPlugins) {
          const updated = await reloadInstalledPlugin(p.id);
          if (updated) reloaded++;
        }

        if (reloaded > 0) {
          triggerSync();
          await reloadPlugins();
          refreshInstalledTab();
        }
        refreshDiscoverTab();
        showToast(`Auto-reloaded: ${reloaded} plugin${reloaded !== 1 ? "s" : ""} updated`);
        reloading = false;
      } catch {
        reloading = false;
      }
    }

    setInterval(checkForTemplateChanges, 1000);
  }

  // Get page info FIRST so state and tabs have it
  const pageInfo = await getPageInfo();
  const pageInfoEl = document.getElementById("page-info");
  if (pageInfo) {
    setCachedPageInfo(pageInfo);
    if (pageInfoEl) pageInfoEl.textContent = pageInfo.hostname || "";
  } else {
    if (pageInfoEl) pageInfoEl.textContent = "no page";
  }

  // Load initial state
  await reloadAll(pageInfo || undefined);

  // Create 3-tab layout
  const layout = new TabLayout(app, [
    { id: "installed", label: "Installed" },
    { id: "discover", label: "Discover" },
    { id: "create", label: "Create" },
  ]);
  layout.render();

  // Update installed badge
  const updateInstalledBadge = () => {
    const { plugins } = getState();
    layout.updateBadge("installed", plugins.filter(p => p.enabled !== false).length);
  };
  updateInstalledBadge();

  // Init tabs
  initInstalledTab(layout.getTabContainer("installed"));
  await initDiscoverTab(layout.getTabContainer("discover"));
  initCreateTab(layout.getTabContainer("create"));

  // Auto-install system plugins if missing
  const allPlugins = await getAllPlugins();
  const systemDefs = ["system-hider", "system-shortcuts"];
  let systemInstalled = false;
  for (const defId of systemDefs) {
    if (!allPlugins.some(p => p.definitionId === defId) && getBundledDefinition(defId)) {
      await installDefinition(defId, {});
      systemInstalled = true;
    }
  }
  if (systemInstalled) {
    await reloadPlugins();
    updateInstalledBadge();
  }

  // Theme toggle
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", async () => {
      const cycle: Record<string, string> = { system: "light", light: "dark", dark: "system" };
      const current = document.documentElement.getAttribute("data-theme") || "system";
      const next = cycle[current] || "system";
      document.documentElement.setAttribute("data-theme", next);
      themeToggle.innerHTML = icon(getThemeIconName(next));
      themeToggle.title = `Theme: ${next}`;
      await updateSettings({ theme: next });
    });
  }

  // Settings button — opens slide-in panel
  document.getElementById("settings-btn")?.addEventListener("click", () => {
    openSettingsPanel();
  });

  // Re-fetch page info when user switches browser tabs
  chrome.tabs.onActivated.addListener(async () => {
    const info = await getPageInfo();
    if (info) {
      setCachedPageInfo(info);
      if (pageInfoEl) pageInfoEl.textContent = info.hostname || "";
      reloadAll(info);
    } else {
      if (pageInfoEl) pageInfoEl.textContent = "no page";
    }
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status !== "complete") return;
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id !== tabId) return;
    const info = await getPageInfo();
    if (info) {
      setCachedPageInfo(info);
      if (pageInfoEl) pageInfoEl.textContent = info.hostname || "";
      reloadAll(info);
    }
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
    if (e.key === "1") layout.switchTab("installed");
    if (e.key === "2") layout.switchTab("discover");
    if (e.key === "3") layout.switchTab("create");
  });

  // Check for updates (against bundled + remote catalog versions)
  const catalogVersions = await getCatalogVersionMap();
  const updates = checkForUpdates(getState().plugins, catalogVersions);
  if (updates.length > 0) {
    setState({ availableUpdates: updates });
  }

  // Centralized message listener
  chrome.runtime.onMessage.addListener((msg: any): undefined => {
    if (msg.type === "pluginsUpdated") {
      // Wire error data from engine
      if (msg.errors) {
        setState({ pluginErrors: msg.errors as Record<string, PluginError[]> });
      }
      reloadPlugins().then(() => {
        updateInstalledBadge();
        // Re-check updates
        getCatalogVersionMap().then(cv => {
          setState({ availableUpdates: checkForUpdates(getState().plugins, cv) });
        });

        if (layout.getActiveTab() === "installed") {
          refreshInstalledTab();
        } else {
          setState({ dirtyInstalled: true });
        }
        if (layout.getActiveTab() === "discover") {
          refreshDiscoverTab();
        } else {
          setState({ dirtyDiscover: true });
        }
      });
    }
    if (msg.type === "pluginAutoDisabled") {
      showToast(`Plugin "${msg.pluginName}" auto-disabled after repeated errors`, { type: "error", duration: 5000 });
    }
    if (msg.type === "pluginError") {
      // Accumulate runtime errors
      const { pluginErrors } = getState();
      const errs = [...(pluginErrors[msg.error.pluginId] || [])];
      errs.unshift(msg.error);
      if (errs.length > 5) errs.length = 5;
      setState({ pluginErrors: { ...pluginErrors, [msg.error.pluginId]: errs } });
    }
    if (msg.type === "pageInfo") {
      const info = msg as unknown as PageInfo;
      setCachedPageInfo(info);
      if (pageInfoEl) pageInfoEl.textContent = (msg.hostname as string) || "";
      reloadAll(info);
    }
  });

  // Tab switch handler: refresh if dirty
  document.addEventListener("domo:tabSwitch", ((e: CustomEvent<{ tabId: string; navigate?: boolean }>) => {
    const { tabId, navigate } = e.detail;
    // If this is a navigation request, switch the tab
    if (navigate) {
      layout.switchTab(tabId);
      return;
    }
    if (tabId === "installed" && getState().dirtyInstalled) {
      setState({ dirtyInstalled: false });
      refreshInstalledTab();
    }
    if (tabId === "discover" && getState().dirtyDiscover) {
      setState({ dirtyDiscover: false });
      refreshDiscoverTab();
    }
  }) as EventListener);

  // Handle cross-tab navigation (installed plugin settings → discover detail)
  document.addEventListener("domo:openDefinition", ((e: CustomEvent<{ definitionId: string }>) => {
    layout.switchTab("discover");
  }) as EventListener);
}

init();
