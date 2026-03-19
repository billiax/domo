import { esc, triggerSync, showConfirm, showToast, showOverflowMenu, formatMatchInfo, setButtonLoading, getCachedPageInfo } from "../shared";
import { icon } from "../../icons";
import { getState, subscribe, setState, reloadPlugins } from "../state";
import { deletePlugin, togglePlugin, forkPlugin } from "../../core/plugins";
import { reloadInstalledPlugin, getBundledDefinition } from "../../core/catalog";
import { findMatchingPlugins } from "../../core/matching";
import { detectPlatform, getPlatformInfo } from "../../core/platforms";
import { updateAllPlugins } from "../../core/updates";
import { exportAllPlugins, pluginToClipboard, importPlugin, validateImport } from "../../core/transfer";
import type { Plugin } from "../../types/plugin";
import type { PluginError } from "../../types/engine";
import type { MenuAction } from "../shared";

let _container: HTMLElement | null = null;
const collapsedPlatforms = new Set<string>();

export function initInstalledTab(container: HTMLElement): void {
  _container = container;
  renderInstalled();
  subscribe("plugins", () => renderInstalled());
  subscribe("pluginErrors", () => renderInstalled());
  subscribe("installedSearchQuery", () => renderInstalled());
}

export function refreshInstalledTab(): void {
  renderInstalled();
}

function isSystemDefinition(plugin: Plugin): boolean {
  return !!plugin.definitionId?.startsWith("system-");
}

function renderInstalled(): void {
  if (!_container) return;

  const { plugins, pluginErrors, installedSearchQuery, availableUpdates } = getState();
  const pageInfo = getCachedPageInfo();
  const currentUrl = pageInfo?.url;

  // Determine which plugins are active on the current page
  const activeIds = new Set<string>();
  if (currentUrl) {
    const matching = findMatchingPlugins(plugins, currentUrl);
    for (const p of matching) activeIds.add(p.id);
  }

  // Filter by search
  let filteredPlugins = plugins;
  const query = installedSearchQuery.toLowerCase().trim();
  if (query) {
    filteredPlugins = plugins.filter(p => {
      const hay = [p.name, p.description, p.platform, p.definitionId || ""].join(" ").toLowerCase();
      return hay.includes(query);
    });
  }

  // Group by platform
  const groups = new Map<string, Plugin[]>();
  for (const plugin of filteredPlugins) {
    const platformId = plugin.platform || detectPlatform(plugin.match);
    if (!groups.has(platformId)) groups.set(platformId, []);
    groups.get(platformId)!.push(plugin);
  }

  // Sort platforms: active ones first, then alphabetical
  const sortedPlatforms = [...groups.entries()].sort(([aId, aPlugins], [bId, bPlugins]) => {
    const aActive = aPlugins.some(p => activeIds.has(p.id)) ? 0 : 1;
    const bActive = bPlugins.some(p => activeIds.has(p.id)) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return aId.localeCompare(bId);
  });

  // Update available banner — uses pre-computed updates from state
  const updateInfos = availableUpdates;
  const nonModifiedUpdates = updateInfos.filter(u => !u.isModified);
  const modifiedSkipped = updateInfos.filter(u => u.isModified);

  let html = "";

  // Header bar with search + import/export
  html += `<div class="installed-header">
    <div class="search-field">
      ${icon("search", "search-field-icon")}
      <input type="text" class="installed-search" id="installed-search" placeholder="Search plugins..." value="${esc(installedSearchQuery)}">
    </div>
    <div class="installed-header-actions">
      <button class="btn-icon" id="import-btn" title="Import plugins">${icon("upload")}</button>
      <button class="btn-icon" id="export-all-btn" title="Export all">${icon("download")}</button>
    </div>
  </div>`;

  // Update banner
  if (updateInfos.length > 0) {
    html += `<div class="update-banner">
      <span>${nonModifiedUpdates.length} update${nonModifiedUpdates.length !== 1 ? "s" : ""} available${modifiedSkipped.length > 0 ? ` (${modifiedSkipped.length} skipped)` : ""}</span>
      ${nonModifiedUpdates.length > 0 ? `<button class="btn btn-sm btn-primary" id="update-all-btn">${icon("refresh")} Update All</button>` : ""}
    </div>`;
  }

  if (filteredPlugins.length === 0 && !query) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">${icon("package", "domo-icon-xl")}</div>
        <div class="empty-state-title">No plugins yet</div>
        <div class="empty-state-desc">Browse the catalog to discover plugins for your favorite sites.</div>
        <button class="btn btn-sm btn-primary" id="browse-catalog-btn" style="margin-top:8px;">Browse Catalog</button>
      </div>
    `;
  } else if (filteredPlugins.length === 0 && query) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">${icon("search", "domo-icon-xl")}</div>
        <div class="empty-state-title">No matches</div>
        <div class="empty-state-desc">Try a different search term.</div>
        <button class="btn btn-sm" id="clear-search-btn" style="margin-top:8px;">Clear search</button>
      </div>
    `;
  } else {
    for (const [platformId, platformPlugins] of sortedPlatforms) {
      const info = getPlatformInfo(platformId);
      const label = info?.name || (platformId === "custom" ? "Custom" : platformId === "system" ? "System" : platformId);
      const hasActive = platformPlugins.some(p => activeIds.has(p.id));
      const isCollapsed = collapsedPlatforms.has(platformId);
      const enabledCount = platformPlugins.filter(p => p.enabled !== false).length;
      const countText = enabledCount > 0
        ? `${enabledCount} of ${platformPlugins.length} active`
        : String(platformPlugins.length);

      html += `<div class="platform-group" data-platform="${esc(platformId)}">
        <div class="platform-header" data-platform-toggle="${esc(platformId)}">
          <span class="platform-chevron${isCollapsed ? "" : " expanded"}">${icon("chevronRight")}</span>
          ${hasActive ? '<span class="platform-active-dot"></span>' : ''}
          <span class="platform-label">${esc(label)}</span>
          <span class="platform-count">${esc(countText)}</span>
          <span class="platform-bulk-actions">
            <button class="btn-icon btn-icon-sm platform-enable-all" data-platform="${esc(platformId)}" title="Enable all">${icon("check")}</button>
            <button class="btn-icon btn-icon-sm platform-disable-all" data-platform="${esc(platformId)}" title="Disable all">${icon("close")}</button>
          </span>
        </div>
        <div class="platform-plugins${isCollapsed ? " collapsed" : ""}">`;

      for (const plugin of platformPlugins) {
        const isActive = activeIds.has(plugin.id);
        const enabled = plugin.enabled !== false;
        const isSystem = isSystemDefinition(plugin);
        const name = plugin.name || plugin.definitionId || plugin.id;
        const errors = pluginErrors[plugin.id] || [];
        const hasErrors = errors.length > 0;
        const isModified = plugin.modified === true;
        const hasUpdate = updateInfos.some(u => u.pluginId === plugin.id && !u.isModified);

        const badgesHtml = (hasErrors || isModified || hasUpdate)
          ? `<div class="plugin-badges">
              ${hasErrors ? `<span class="pill pill-red plugin-error-badge" data-plugin-id="${esc(plugin.id)}" title="${errors.length} error${errors.length !== 1 ? "s" : ""}">${errors.length} error${errors.length !== 1 ? "s" : ""}</span>` : ""}
              ${isModified ? '<span class="pill pill-purple">modified</span>' : ""}
              ${hasUpdate ? '<span class="pill pill-blue">update</span>' : ""}
            </div>`
          : "";

        html += `
          <div class="plugin-card${isActive ? " plugin-active" : ""}${!enabled ? " plugin-disabled" : ""}" data-plugin-id="${esc(plugin.id)}">
            <div class="plugin-card-header">
              <span class="plugin-name">${esc(name)}</span>
              <label class="toggle-switch" title="${enabled ? "Disable" : "Enable"}">
                <input type="checkbox" class="toggle-input" data-plugin-id="${esc(plugin.id)}" ${enabled ? "checked" : ""}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="plugin-card-body">
              <span class="plugin-meta-line">${esc(formatMatchInfo(plugin.match))}</span>
              <div class="plugin-card-actions">
                ${isSystem ? `<button class="btn-icon btn-icon-sm plugin-configure-btn" data-plugin-id="${esc(plugin.id)}" title="Configure">${icon("sliders")}</button>` : ''}
                <button class="btn-icon btn-icon-sm plugin-edit-btn" data-plugin-id="${esc(plugin.id)}" title="Edit">${icon("edit")}</button>
                <button class="btn-icon btn-icon-sm plugin-overflow-btn" data-plugin-id="${esc(plugin.id)}" title="More actions">${icon("moreVertical")}</button>
              </div>
            </div>
            ${badgesHtml}
            ${hasErrors ? `<div class="plugin-error-detail ed-hidden" data-error-for="${esc(plugin.id)}">
              ${errors.slice(0, 3).map(e => `<div class="plugin-error-line">[${esc(e.phase)}] ${esc(e.message)}</div>`).join("")}
            </div>` : ""}
          </div>`;
      }

      html += `</div></div>`;
    }
  }

  _container.innerHTML = html;

  // ── Wire events ──

  // Search
  const searchInput = _container.querySelector<HTMLInputElement>("#installed-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      setState({ installedSearchQuery: (e.target as HTMLInputElement).value });
    });
    if (installedSearchQuery) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  }

  _container.querySelector("#clear-search-btn")?.addEventListener("click", () => {
    setState({ installedSearchQuery: "" });
  });

  // Export all
  _container.querySelector("#export-all-btn")?.addEventListener("click", async () => {
    try {
      const backup = await exportAllPlugins();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `domo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Backup exported");
    } catch (err) {
      showToast(`Export failed: ${(err as Error).message}`, { type: "error" });
    }
  });

  // Import
  _container.querySelector("#import-btn")?.addEventListener("click", () => {
    showImportModal();
  });

  // Update all
  _container.querySelector("#update-all-btn")?.addEventListener("click", async () => {
    const ids = nonModifiedUpdates.map(u => u.pluginId);
    const btn = _container!.querySelector("#update-all-btn") as HTMLButtonElement;
    setButtonLoading(btn, true, "Updating...");
    const result = await updateAllPlugins(ids);
    triggerSync();
    await reloadPlugins();
    showToast(`Updated ${result.updated} plugin${result.updated !== 1 ? "s" : ""}`);
  });

  // Browse catalog
  _container.querySelector("#browse-catalog-btn")?.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("domo:tabSwitch", { detail: { tabId: "discover", navigate: true } }));
  });

  // Platform header toggles
  _container.querySelectorAll<HTMLElement>("[data-platform-toggle]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      if ((e.target as Element).closest(".platform-bulk-actions")) return;
      const platformId = btn.dataset.platformToggle!;
      const group = _container!.querySelector(`.platform-group[data-platform="${platformId}"]`);
      const pluginsEl = group?.querySelector<HTMLElement>(".platform-plugins");
      if (!pluginsEl) return;
      const isCollapsed = pluginsEl.classList.contains("collapsed");
      pluginsEl.classList.toggle("collapsed");
      const chevron = btn.querySelector(".platform-chevron");
      if (chevron) chevron.classList.toggle("expanded", isCollapsed);
      if (isCollapsed) collapsedPlatforms.delete(platformId);
      else collapsedPlatforms.add(platformId);
    });
  });

  // Bulk enable/disable
  _container.querySelectorAll<HTMLButtonElement>(".platform-enable-all").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const platformId = btn.dataset.platform!;
      const platformPlugins = groups.get(platformId) || [];
      for (const p of platformPlugins) {
        if (p.enabled === false) await togglePlugin(p.id);
      }
      triggerSync();
      await reloadPlugins();
    });
  });

  _container.querySelectorAll<HTMLButtonElement>(".platform-disable-all").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const platformId = btn.dataset.platform!;
      const platformPlugins = groups.get(platformId) || [];
      for (const p of platformPlugins) {
        if (p.enabled !== false) await togglePlugin(p.id);
      }
      triggerSync();
      await reloadPlugins();
    });
  });

  // Toggle switches
  _container.querySelectorAll<HTMLInputElement>(".toggle-input").forEach(input => {
    input.addEventListener("change", async () => {
      const pluginId = input.dataset.pluginId!;
      input.disabled = true;
      try {
        await togglePlugin(pluginId);
        triggerSync();
        await reloadPlugins();
      } catch {
        input.disabled = false;
      }
    });
  });

  // Edit buttons
  _container.querySelectorAll<HTMLButtonElement>(".plugin-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "openEditor", pluginId: btn.dataset.pluginId! });
    });
  });

  // Configure buttons (system plugins → floating panel on page)
  _container.querySelectorAll<HTMLButtonElement>(".plugin-configure-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ target: "content", type: "openFloatingPanel", pluginId: btn.dataset.pluginId! });
    });
  });

  // Overflow menu buttons
  _container.querySelectorAll<HTMLButtonElement>(".plugin-overflow-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const pluginId = btn.dataset.pluginId!;
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) return;

      const isSystem = isSystemDefinition(plugin);
      const hasUpdate = updateInfos.some(u => u.pluginId === pluginId && !u.isModified);

      const actions: MenuAction[] = [
        {
          label: "Copy to clipboard",
          icon: "clipboard",
          onClick: async () => {
            const ok = await pluginToClipboard(pluginId);
            showToast(ok ? "Copied to clipboard" : "Copy failed", { type: ok ? "success" : "error" });
          }
        },
      ];

      if (!isSystem && plugin.definitionId) {
        actions.push({
          label: hasUpdate ? "Update available" : "Reload from definition",
          icon: "refresh",
          onClick: async () => {
            const updated = await reloadInstalledPlugin(pluginId);
            if (updated) {
              triggerSync();
              showToast("Plugin reloaded");
              await reloadPlugins();
            } else {
              showToast("Definition not found", { type: "error" });
            }
          }
        });
        actions.push({
          label: "Settings",
          icon: "gear",
          onClick: () => {
            document.dispatchEvent(new CustomEvent("domo:openDefinition", { detail: { definitionId: plugin.definitionId } }));
          }
        });
      }

      actions.push({
        label: "Duplicate",
        icon: "fork",
        onClick: async () => {
          await forkPlugin(pluginId);
          triggerSync();
          await reloadPlugins();
          showToast("Plugin duplicated");
        }
      });

      actions.push({
        label: "Delete",
        icon: "trash",
        danger: true,
        separator: true,
        onClick: async () => {
          const msg = isSystem
            ? "This is a system plugin. Delete it? You can reinstall from the catalog."
            : "Delete this plugin? This cannot be undone.";
          const confirmed = await showConfirm({
            message: msg,
            title: "Delete Plugin",
            confirmText: "Delete",
            danger: true
          });
          if (!confirmed) return;
          await deletePlugin(pluginId);
          triggerSync();
          showToast("Plugin deleted");
          await reloadPlugins();
        }
      });

      showOverflowMenu(btn, actions);
    });
  });

  // Error badge click → toggle error detail
  _container.querySelectorAll<HTMLElement>(".plugin-error-badge").forEach(badge => {
    badge.addEventListener("click", () => {
      const pluginId = badge.dataset.pluginId!;
      const detail = _container!.querySelector(`[data-error-for="${pluginId}"]`);
      if (detail) detail.classList.toggle("ed-hidden");
    });
  });
}

// ── Import Modal ──

function showImportModal(): void {
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-dialog" style="max-width:400px;">
      <div class="confirm-title" style="display:flex;align-items:center;gap:6px;">${icon("upload")} Import Plugins</div>
      <div style="margin-bottom:8px;margin-top:8px;">
        <label style="font-size:12px;">From File</label>
        <input type="file" id="import-file" accept=".json,.domo.json" style="font-size:12px;">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:12px;">Or from URL</label>
        <input type="text" id="import-url" placeholder="https://..." style="width:100%;font-size:12px;padding:4px 6px;">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:12px;">On conflict</label>
        <select id="import-strategy" style="font-size:12px;">
          <option value="skip">Skip existing</option>
          <option value="replace">Replace existing</option>
          <option value="duplicate">Create duplicate</option>
        </select>
      </div>
      <div id="import-preview" style="font-size:11px;color:var(--domo-text-secondary);margin-bottom:8px;"></div>
      <div class="confirm-actions">
        <button class="btn btn-sm confirm-cancel">Cancel</button>
        <button class="btn btn-sm btn-primary" id="import-go" disabled>${icon("download")} Import</button>
      </div>
    </div>
  `;

  let parsedData: unknown = null;

  const cleanup = () => overlay.remove();
  overlay.querySelector(".confirm-cancel")!.addEventListener("click", cleanup);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(); });

  const previewEl = overlay.querySelector<HTMLElement>("#import-preview")!;
  const goBtn = overlay.querySelector<HTMLButtonElement>("#import-go")!;

  function updatePreview(data: unknown): void {
    const result = validateImport(data);
    if (!result.valid) {
      previewEl.textContent = result.error || "Invalid data";
      previewEl.style.color = "var(--domo-pill-red-bg)";
      goBtn.disabled = true;
      parsedData = null;
    } else {
      const count = result.type === "single" ? 1 : (data as { plugins: unknown[] }).plugins.length;
      previewEl.textContent = `Valid: ${count} plugin${count !== 1 ? "s" : ""} found`;
      previewEl.style.color = "var(--domo-text-secondary)";
      goBtn.disabled = false;
      parsedData = data;
    }
  }

  overlay.querySelector<HTMLInputElement>("#import-file")!.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      updatePreview(JSON.parse(text));
    } catch {
      previewEl.textContent = "Invalid JSON file";
      goBtn.disabled = true;
    }
  });

  overlay.querySelector<HTMLInputElement>("#import-url")!.addEventListener("change", async (e) => {
    const url = (e.target as HTMLInputElement).value.trim();
    if (!url) return;
    previewEl.textContent = "Fetching...";
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      updatePreview(data);
    } catch {
      previewEl.textContent = "Failed to fetch URL";
      goBtn.disabled = true;
    }
  });

  goBtn.addEventListener("click", async () => {
    if (!parsedData) return;
    const strategy = (overlay.querySelector<HTMLSelectElement>("#import-strategy")!).value as "skip" | "replace" | "duplicate";
    setButtonLoading(goBtn, true, "Importing...");
    try {
      const result = await importPlugin(parsedData, strategy);
      triggerSync();
      await reloadPlugins();
      showToast(`Imported ${result.imported}, skipped ${result.skipped}`);
      cleanup();
    } catch (err) {
      previewEl.textContent = `Error: ${(err as Error).message}`;
      setButtonLoading(goBtn, false);
    }
  });

  document.getElementById("app")!.appendChild(overlay);
}
