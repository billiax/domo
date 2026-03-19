import { esc, triggerSync, showConfirm, showToast, setButtonLoading } from "../shared";
import { icon } from "../../icons";
import { getState, reloadPlugins } from "../state";
import {
  getBundledDefinitions, getDefinition, installDefinition, installRemoteDefinition,
  fetchCatalogEntries, resolveFullDefinition
} from "../../core/catalog";
import { deletePlugin, togglePlugin } from "../../core/plugins";
import { getSettings, updateSettings } from "../../core/storage";
import { detectPlatform, getPlatformInfo, getAllPlatforms } from "../../core/platforms";
import { debounce } from "../../lib/utils";
import type { Plugin } from "../../types/plugin";
import type { PluginDefinition, PluginMeta } from "../../types/plugin";

interface PluginMetaWithSource extends PluginMeta {
  _source: "bundled" | "community";
}

// Internal state
let currentView: "list" | "detail" = "list";
let selectedDefinitionId: string | null = null;
let searchQuery = "";
let platformFilter = "all";
let sortBy = "az";
let isPreviewActive = false;
let _previewingDefId: string | null = null;
let allDefinitions: PluginMetaWithSource[] = [];
let installedByDefinition: Record<string, Plugin> = {};
let _container: HTMLElement | null = null;
let _escapeHandler: ((e: KeyboardEvent) => void) | null = null;

const debouncedRender = debounce(() => renderListView(), 200);

export async function initDiscoverTab(container: HTMLElement): Promise<void> {
  _container = container;
  container.innerHTML = '<div class="empty">Loading catalog...</div>';

  try {
    // Load saved sort preference
    const initSettings = await getSettings();
    if (initSettings.discoverSort) sortBy = initSettings.discoverSort;

    // Bundled = system plugins only (offline fallback)
    const bundled: PluginMetaWithSource[] = getBundledDefinitions().map(d => ({ ...d, _source: "bundled" as const }));
    rebuildInstalledMap();
    allDefinitions = bundled;
    renderCurrentView();

    // Fetch full catalog from repo — this is the primary source
    getSettings().then(settings => {
      const registryUrl = settings.registryUrl;
      if (!registryUrl) return;
      return fetchCatalogEntries(registryUrl);
    }).then(remote => {
      if (remote && remote.length > 0) {
        // Remote catalog is primary — bundled system plugins are fallback only.
        // Merge: remote wins for any ID that exists in both.
        allDefinitions = mergeDefinitionLists(
          remote as PluginMetaWithSource[],
          bundled
        );
        if (currentView === "list") renderCurrentView();
      }
    }).catch(() => {});
  } catch (err) {
    container.innerHTML = `<div class="empty">Error: ${esc((err as Error).message)}</div>`;
  }

  document.addEventListener("domo:openDefinition", ((e: CustomEvent<{ definitionId: string }>) => {
    const { definitionId } = e.detail;
    if (definitionId) {
      selectedDefinitionId = definitionId;
      currentView = "detail";
      renderDetailView();
    }
  }) as EventListener);
}

export function refreshDiscoverTab(): void {
  rebuildInstalledMap();
  renderCurrentView();
}

function mergeDefinitionLists(primary: PluginMetaWithSource[], fallback: PluginMetaWithSource[]): PluginMetaWithSource[] {
  const seen = new Set(primary.map(d => d.id));
  return [...primary, ...fallback.filter(d => !seen.has(d.id))];
}

function rebuildInstalledMap(): void {
  const { plugins } = getState();
  installedByDefinition = {};
  for (const plugin of plugins) {
    if (plugin.source === "catalog" && plugin.definitionId) {
      installedByDefinition[plugin.definitionId] = plugin;
    }
  }
}

function renderCurrentView(): void {
  if (!_container) return;
  if (currentView === "detail" && selectedDefinitionId) {
    renderDetailView();
  } else {
    renderListView();
  }
}

async function getFullDefinition(meta: PluginMetaWithSource): Promise<PluginDefinition | null> {
  return getDefinition(meta.id);
}

// ── List View ──

function renderListView(): void {
  currentView = "list";
  rebuildInstalledMap();
  const filtered = getFilteredDefinitions();
  const platforms = getAllPlatforms();

  // Count plugins per platform for filter badges
  const platformCounts = new Map<string, number>();
  platformCounts.set("all", allDefinitions.length);
  for (const d of allDefinitions) {
    const pId = d.platform || (d.match ? detectPlatform(d.match) : "custom");
    platformCounts.set(pId, (platformCounts.get(pId) || 0) + 1);
    if (d.id.startsWith("system-")) platformCounts.set("system", (platformCounts.get("system") || 0) + 1);
  }

  let html = '';

  // Search + sort bar
  html += `<div class="discover-toolbar">
    <div class="search-field" style="flex:1;">
      ${icon("search", "search-field-icon")}
      <input type="text" class="installed-search" id="tpl-search-input" placeholder="Search plugins..." value="${esc(searchQuery)}">
    </div>
    <select id="tpl-sort" class="discover-sort">
      <option value="az" ${sortBy==="az"?"selected":""}>A-Z</option>
      <option value="installed" ${sortBy==="installed"?"selected":""}>Installed first</option>
      <option value="platform" ${sortBy==="platform"?"selected":""}>By platform</option>
    </select>
  </div>`;

  // Platform filters with counts
  html += `<div class="filter-scroll-wrapper">
    <div class="platform-filters">
      <button class="platform-pill${platformFilter === "all" ? " active" : ""}" data-filter="all">All <span class="filter-count">${platformCounts.get("all") || 0}</span></button>
      ${platforms.map(p => {
        const count = platformCounts.get(p.id) || 0;
        if (count === 0) return '';
        return `<button class="platform-pill${platformFilter === p.id ? " active" : ""}" data-filter="${esc(p.id)}">${esc(p.name)} <span class="filter-count">${count}</span></button>`;
      }).join("")}
      ${(platformCounts.get("system") || 0) > 0 ? `<button class="platform-pill${platformFilter === "system" ? " active" : ""}" data-filter="system">System <span class="filter-count">${platformCounts.get("system") || 0}</span></button>` : ''}
    </div>
  </div>`;

  // Cards
  if (filtered.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">${icon("search", "domo-icon-xl")}</div>
        <div class="empty-state-title">No plugins match</div>
        <div class="empty-state-desc">Try a different search or filter.</div>
        <button class="btn btn-sm" id="tpl-clear-search" style="margin-top:8px;">Clear search</button>
      </div>`;
  } else {
    html += filtered.map(def => {
      const installed = installedByDefinition[def.id];
      const source = def._source === "community" ? "Community" : "Built-in";
      const badgeClass = def._source === "community" ? "badge-community" : "badge-builtin";
      const platformId = def.platform || (def.match ? detectPlatform(def.match) : "custom");
      const platformInfo = getPlatformInfo(platformId);
      const platformLabel = platformInfo?.name || platformId;

      let actionsHtml: string;
      if (installed) {
        const enableLabel = installed.enabled !== false ? "Disable" : "Enable";
        actionsHtml = `<div class="tpl-card-actions">
          <button class="btn btn-sm tpl-quick-toggle" data-plugin-id="${esc(installed.id)}" data-def-id="${esc(def.id)}">${enableLabel}</button>
          <button class="btn btn-sm tpl-quick-options" data-def-id="${esc(def.id)}">Options</button>
        </div>`;
      } else {
        const isPreviewing = isPreviewActive && _previewingDefId === def.id;
        actionsHtml = `<div class="tpl-card-actions">
          ${isPreviewing
            ? `<button class="btn btn-sm tpl-quick-stop-preview" data-def-id="${esc(def.id)}">${icon("eyeOff")} Stop</button>`
            : `<button class="btn btn-sm tpl-quick-preview" data-def-id="${esc(def.id)}">${icon("eye")} Preview</button>`}
          <button class="btn btn-sm btn-primary tpl-quick-install" data-def-id="${esc(def.id)}">${icon("download")} Install</button>
        </div>`;
      }

      return `<div class="tpl-card" data-def-id="${esc(def.id)}">
        <div class="tpl-card-header">
          <span class="tpl-card-name">${esc(def.name)}</span>
          <span class="tpl-card-badges">
            ${installed ? '<span class="pill badge-installed">Installed</span>' : ''}
            <span class="pill ${badgeClass}">${source}</span>
            <span class="pill pill-blue">${esc(platformLabel)}</span>
          </span>
        </div>
        <div class="tpl-card-desc">${esc(def.description || "")}</div>
        <div class="tpl-card-meta">${def.version ? "v" + esc(def.version) : ""}${def.author ? " &middot; " + esc(def.author) : ""}</div>
        ${actionsHtml}
      </div>`;
    }).join("");
  }

  _container!.innerHTML = html;

  // Detect filter overflow for fade indicator
  const filterWrapper = _container!.querySelector<HTMLElement>(".filter-scroll-wrapper");
  const filterScroll = _container!.querySelector<HTMLElement>(".platform-filters");
  if (filterWrapper && filterScroll) {
    const checkOverflow = () => {
      const hasOverflow = filterScroll.scrollWidth > filterScroll.clientWidth;
      const atEnd = filterScroll.scrollLeft + filterScroll.clientWidth >= filterScroll.scrollWidth - 4;
      filterWrapper.classList.toggle("has-overflow", hasOverflow && !atEnd);
    };
    checkOverflow();
    filterScroll.addEventListener("scroll", checkOverflow);
  }

  // Event: search
  const searchInput = _container!.querySelector<HTMLInputElement>("#tpl-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = (e.target as HTMLInputElement).value;
      debouncedRender();
    });
  }

  // Event: clear search
  _container!.querySelector("#tpl-clear-search")?.addEventListener("click", () => {
    searchQuery = "";
    platformFilter = "all";
    renderListView();
  });

  // Event: sort
  const sortSelect = _container!.querySelector<HTMLSelectElement>("#tpl-sort");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      sortBy = (e.target as HTMLSelectElement).value;
      updateSettings({ discoverSort: sortBy });
      renderListView();
    });
  }

  // Event: platform filter pills
  _container!.querySelectorAll<HTMLButtonElement>(".platform-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      platformFilter = btn.dataset.filter!;
      renderListView();
    });
  });

  // Event: card click → detail
  _container!.querySelectorAll<HTMLElement>(".tpl-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if ((e.target as Element).closest(".tpl-card-actions")) return;
      selectedDefinitionId = card.dataset.defId!;
      currentView = "detail";
      renderDetailView();
    });
  });

  // Event: quick install
  _container!.querySelectorAll<HTMLButtonElement>(".tpl-quick-install").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const defId = btn.dataset.defId!;
      const defMeta = allDefinitions.find(d => d.id === defId);
      if (!defMeta) return;
      setButtonLoading(btn, true, "Installing...");
      try {
        const fullDef = await getFullDefinition(defMeta);
        if (!fullDef) throw new Error("Failed to load plugin definition");
        if (defMeta._source === "community") {
          await installRemoteDefinition(fullDef, {});
        } else {
          await installDefinition(defMeta.id, {});
        }
        triggerSync();
        await reloadPlugins();
        rebuildInstalledMap();
        showToast(`"${defMeta.name}" installed`);
        renderListView();
      } catch {
        setButtonLoading(btn, false);
        btn.textContent = "Error";
      }
    });
  });

  // Event: quick preview
  _container!.querySelectorAll<HTMLButtonElement>(".tpl-quick-preview").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const defId = btn.dataset.defId!;
      const defMeta = allDefinitions.find(d => d.id === defId);
      if (!defMeta) return;
      setButtonLoading(btn, true, "Loading...");
      try {
        const fullDef = await getFullDefinition(defMeta);
        if (!fullDef) throw new Error("Failed to load plugin definition");
        const { code } = resolveFullDefinition(fullDef, {});
        isPreviewActive = true;
        _previewingDefId = defId;
        sendPreview(code);
        showToast("Preview active");
        renderListView();
      } catch {
        setButtonLoading(btn, false);
        btn.textContent = "Error";
      }
    });
  });

  // Event: quick stop preview
  _container!.querySelectorAll<HTMLButtonElement>(".tpl-quick-stop-preview").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      stopPreview();
      renderListView();
    });
  });

  // Event: quick toggle
  _container!.querySelectorAll<HTMLButtonElement>(".tpl-quick-toggle").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const pluginId = btn.dataset.pluginId!;
      btn.disabled = true;
      try {
        await togglePlugin(pluginId);
        triggerSync();
        await reloadPlugins();
        rebuildInstalledMap();
        renderListView();
      } catch {
        btn.disabled = false;
      }
    });
  });

  // Event: quick options
  _container!.querySelectorAll<HTMLButtonElement>(".tpl-quick-options").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedDefinitionId = btn.dataset.defId!;
      currentView = "detail";
      renderDetailView();
    });
  });

  // Restore search focus
  if (searchQuery) {
    const input = _container!.querySelector<HTMLInputElement>("#tpl-search-input");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

function getFilteredDefinitions(): PluginMetaWithSource[] {
  let list = allDefinitions;
  if (platformFilter === "system") {
    list = list.filter(d => d.id.startsWith("system-"));
  } else if (platformFilter !== "all") {
    list = list.filter(d => {
      const pId = d.platform || (d.match ? detectPlatform(d.match) : "custom");
      return pId === platformFilter;
    });
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(d => {
      const haystack = [d.name, d.description, d.author, ...(d.tags || [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }
  list = [...list];
  if (sortBy === "az") {
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (sortBy === "installed") {
    list.sort((a, b) => {
      const aInst = installedByDefinition[a.id] ? 0 : 1;
      const bInst = installedByDefinition[b.id] ? 0 : 1;
      if (aInst !== bInst) return aInst - bInst;
      return (a.name || "").localeCompare(b.name || "");
    });
  } else if (sortBy === "platform") {
    list.sort((a, b) => {
      const aPlatform = a.platform || (a.match ? detectPlatform(a.match) : "custom");
      const bPlatform = b.platform || (b.match ? detectPlatform(b.match) : "custom");
      const cmp = aPlatform.localeCompare(bPlatform);
      if (cmp !== 0) return cmp;
      return (a.name || "").localeCompare(b.name || "");
    });
  }
  return list;
}

// ── Detail View ──

let _detailDefinition: PluginDefinition | null = null;
let _detailSettings: Record<string, unknown> = {};
let _activeCodeTab = "css";

function getFirstNonEmptyCodeTab(definition: PluginDefinition, settings: Record<string, unknown>): string {
  const { code } = resolveFullDefinition(definition, settings);
  if (code.css?.trim()) return "css";
  if (code.html?.trim()) return "html";
  if (code.js?.trim()) return "js";
  return "css";
}

async function renderDetailView(): Promise<void> {
  currentView = "detail";
  const defMeta = allDefinitions.find(d => d.id === selectedDefinitionId);
  if (!defMeta) {
    _container!.innerHTML = '<div class="empty">Plugin not found.</div>';
    return;
  }

  _container!.innerHTML = `
    <button class="detail-back" id="detail-back">${icon("arrowLeft")} Back to catalog</button>
    <div class="empty">Loading plugin...</div>
  `;
  _container!.querySelector("#detail-back")?.addEventListener("click", goBackToList);

  const fullDef = await getFullDefinition(defMeta);
  if (!fullDef) {
    _container!.innerHTML = `
      <button class="detail-back" id="detail-back">${icon("arrowLeft")} Back to catalog</button>
      <div class="empty">Failed to load plugin definition.</div>
    `;
    _container!.querySelector("#detail-back")?.addEventListener("click", goBackToList);
    return;
  }

  _detailDefinition = fullDef;
  rebuildInstalledMap();
  const installed = installedByDefinition[defMeta.id];

  _detailSettings = {};
  if (fullDef.options) {
    for (const [key, opt] of Object.entries(fullDef.options)) {
      _detailSettings[key] = installed?.settings?.[key] ?? opt.default;
    }
  }

  _activeCodeTab = getFirstNonEmptyCodeTab(fullDef, _detailSettings);
  renderDetailContent(defMeta, fullDef, installed);

  _escapeHandler = (e: KeyboardEvent) => { if (e.key === "Escape") goBackToList(); };
  document.addEventListener("keydown", _escapeHandler);
}

function renderDetailContent(defMeta: PluginMetaWithSource, fullDef: PluginDefinition, installed: Plugin | undefined): void {
  const { code: resolvedCode } = resolveFullDefinition(fullDef, _detailSettings);
  const source = defMeta._source === "community" ? "Community" : "Built-in";
  const badgeClass = defMeta._source === "community" ? "badge-community" : "badge-builtin";
  const platformId = fullDef.platform || detectPlatform(fullDef.match);
  const platformInfo = getPlatformInfo(platformId);

  let html = `<button class="detail-back" id="detail-back">${icon("arrowLeft")} Back to catalog</button>`;

  if (isPreviewActive) {
    html += `<div class="preview-banner">Live preview active on current page</div>`;
  }

  // Header section
  html += `<div class="detail-header">
    <div class="detail-title">${esc(fullDef.name)}</div>
    <div class="detail-badges">
      ${installed ? '<span class="pill badge-installed">Installed</span>' : ''}
      <span class="pill ${badgeClass}">${source}</span>
      ${platformInfo ? `<span class="pill pill-blue">${esc(platformInfo.name)}</span>` : ''}
    </div>
    <div class="detail-meta">
      ${fullDef.version ? "v" + esc(fullDef.version) : ""}${fullDef.author ? " &middot; by " + esc(fullDef.author) : ""}
    </div>
  </div>`;

  // Tags
  if (fullDef.tags && fullDef.tags.length > 0) {
    html += `<div class="detail-tags">${fullDef.tags.map(t => `<span class="detail-tag">${esc(t)}</span>`).join("")}</div>`;
  }

  // Description
  html += `<p class="detail-description">${esc(fullDef.description || "")}</p>`;

  // Settings section
  if (fullDef.options && Object.keys(fullDef.options).length > 0) {
    html += `<div class="detail-section">
      <div class="detail-section-title">Settings</div>`;
    html += `<div class="option-group">`;
    for (const [key, opt] of Object.entries(fullDef.options)) {
      const val = _detailSettings[key];
      if (opt.type === "boolean") {
        html += `<div class="checkbox-row">
          <input type="checkbox" id="dopt-${esc(key)}" data-opt-key="${esc(key)}" ${val ? "checked" : ""}>
          <label for="dopt-${esc(key)}">${esc(opt.label || key)}</label>
        </div>`;
      } else {
        html += `<label>${esc(opt.label || key)}<input data-opt-key="${esc(key)}" value="${esc(String(val ?? ""))}"></label>`;
      }
    }
    html += `</div></div>`;
  }

  // Code preview section (always visible)
  const codeTabs = ["css", "html", "js"];
  html += `<div class="detail-section">
    <div class="detail-section-title">Code</div>
    <div class="code-tabs">${codeTabs.map(tab =>
      `<button class="code-tab-btn${_activeCodeTab === tab ? " active" : ""}" data-code-tab="${tab}">${tab.toUpperCase()}</button>`
    ).join("")}</div>
    <div class="code-preview"><pre id="code-preview-content">${esc(resolvedCode[_activeCodeTab as keyof typeof resolvedCode] || "(empty)")}</pre></div>
    ${_activeCodeTab === "js" ? '<div class="code-note">JS is not included in live preview</div>' : ''}
  </div>`;

  // Actions
  html += `<div class="detail-actions">`;
  if (installed) {
    html += `<button class="btn btn-danger btn-sm" id="tpl-uninstall">${icon("trash")} Uninstall</button>`;
    html += `<button class="btn btn-primary btn-sm" id="tpl-update">${icon("check")} Update Settings</button>`;
  } else {
    if (isPreviewActive) {
      html += `<button class="btn btn-sm" id="tpl-stop-preview">${icon("eyeOff")} Stop Preview</button>`;
    } else {
      html += `<button class="btn btn-sm" id="tpl-preview">${icon("eye")} Preview</button>`;
    }
    html += `<button class="btn btn-primary btn-sm" id="tpl-install">${icon("download")} Install</button>`;
  }
  html += `</div>`;

  _container!.innerHTML = html;

  // Event: back
  _container!.querySelector("#detail-back")?.addEventListener("click", goBackToList);

  // Event: options change
  _container!.querySelectorAll<HTMLInputElement>("[data-opt-key]").forEach(el => {
    const evt = el.type === "checkbox" ? "change" : "input";
    el.addEventListener(evt, () => {
      const key = el.dataset.optKey!;
      _detailSettings[key] = el.type === "checkbox" ? el.checked : el.value;
      const { code: newCode } = resolveFullDefinition(fullDef, _detailSettings);
      const preEl = _container!.querySelector("#code-preview-content");
      if (preEl) preEl.textContent = newCode[_activeCodeTab as keyof typeof newCode] || "(empty)";
      if (isPreviewActive) sendPreview(newCode);
    });
  });

  // Event: code tabs
  _container!.querySelectorAll<HTMLButtonElement>(".code-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      _activeCodeTab = btn.dataset.codeTab!;
      _container!.querySelectorAll<HTMLButtonElement>(".code-tab-btn").forEach(b => b.classList.toggle("active", b.dataset.codeTab === _activeCodeTab));
      const { code: c } = resolveFullDefinition(fullDef, _detailSettings);
      const preEl = _container!.querySelector("#code-preview-content");
      if (preEl) preEl.textContent = c[_activeCodeTab as keyof typeof c] || "(empty)";
      const existingNote = _container!.querySelector(".code-note");
      if (existingNote) existingNote.remove();
      if (_activeCodeTab === "js") {
        const note = document.createElement("div");
        note.className = "code-note";
        note.textContent = "JS is not included in live preview";
        _container!.querySelector(".code-preview")?.after(note);
      }
    });
  });

  // Event: preview
  _container!.querySelector("#tpl-preview")?.addEventListener("click", () => {
    const { code: c } = resolveFullDefinition(fullDef, _detailSettings);
    isPreviewActive = true;
    sendPreview(c);
    showToast("Preview active");
    renderDetailContent(defMeta, fullDef, installed);
  });

  // Event: stop preview
  _container!.querySelector("#tpl-stop-preview")?.addEventListener("click", () => {
    stopPreview();
    renderDetailContent(defMeta, fullDef, installed);
  });

  // Event: install
  _container!.querySelector("#tpl-install")?.addEventListener("click", async () => {
    const btn = _container!.querySelector("#tpl-install") as HTMLButtonElement;
    setButtonLoading(btn, true, "Installing...");
    stopPreview();
    try {
      if (defMeta._source === "community") {
        await installRemoteDefinition(fullDef, _detailSettings);
      } else {
        await installDefinition(defMeta.id, _detailSettings);
      }
      triggerSync();
      await reloadPlugins();
      rebuildInstalledMap();
      showToast(`"${fullDef.name}" installed`);
      goBackToList();
    } catch {
      setButtonLoading(btn, false);
      btn.textContent = "Error";
    }
  });

  // Event: uninstall
  _container!.querySelector("#tpl-uninstall")?.addEventListener("click", async () => {
    if (!installed) return;
    const confirmed = await showConfirm({
      message: `Uninstall "${fullDef.name}"? The plugin will be removed.`,
      title: "Uninstall Plugin",
      confirmText: "Uninstall",
      danger: true
    });
    if (!confirmed) return;
    const btn = _container!.querySelector("#tpl-uninstall") as HTMLButtonElement;
    setButtonLoading(btn, true, "Removing...");
    try {
      await deletePlugin(installed.id);
      triggerSync();
      await reloadPlugins();
      delete installedByDefinition[defMeta.id];
      showToast(`"${fullDef.name}" uninstalled`);
      renderDetailContent(defMeta, fullDef, undefined);
    } catch {
      setButtonLoading(btn, false);
      btn.textContent = "Error";
    }
  });

  // Event: update settings
  _container!.querySelector("#tpl-update")?.addEventListener("click", async () => {
    if (!installed) return;
    const btn = _container!.querySelector("#tpl-update") as HTMLButtonElement;
    setButtonLoading(btn, true, "Updating...");
    try {
      await deletePlugin(installed.id);
      if (defMeta._source === "community") {
        await installRemoteDefinition(fullDef, _detailSettings);
      } else {
        await installDefinition(defMeta.id, _detailSettings);
      }
      triggerSync();
      await reloadPlugins();
      rebuildInstalledMap();
      const newInstalled = installedByDefinition[defMeta.id];
      showToast("Settings updated");
      renderDetailContent(defMeta, fullDef, newInstalled);
    } catch {
      setButtonLoading(btn, false);
      btn.textContent = "Error";
    }
  });
}

function goBackToList(): void {
  if (_escapeHandler) {
    document.removeEventListener("keydown", _escapeHandler);
    _escapeHandler = null;
  }
  stopPreview();
  selectedDefinitionId = null;
  _detailDefinition = null;
  currentView = "list";
  renderListView();
}

// ── Live Preview ──

function sendPreview(code: { css: string; html: string; js: string }): void {
  chrome.runtime.sendMessage({
    target: "content",
    type: "previewPlugin",
    code: { css: code.css || "", html: code.html || "" }
  });
}

function stopPreview(): void {
  if (isPreviewActive) {
    isPreviewActive = false;
    _previewingDefId = null;
    chrome.runtime.sendMessage({ target: "content", type: "stopPreview" });
  }
}
