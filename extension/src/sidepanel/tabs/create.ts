import { getPageInfo, esc, triggerSync, showToast, formatMatchInfo, setButtonLoading } from "../shared";
import { icon } from "../../icons";
import { reloadPlugins } from "../state";
import { upsertPlugin } from "../../core/plugins";
import { matchFromScope } from "../../core/matching";
import { detectPlatform } from "../../core/platforms";
import { getSettings, updateSettings } from "../../core/storage";
import { PLUGIN_TEMPLATES } from "../templates";
import type { Scope } from "../../types/plugin";

let _container: HTMLElement | null = null;

export function initCreateTab(container: HTMLElement): void {
  _container = container;
  renderCreateTab();
}

function renderCreateTab(): void {
  if (!_container) return;

  _container.innerHTML = `
    <div class="create-section">
      <div class="create-section-desc">Create a new plugin and open it in the full editor.</div>

      <label>Name</label>
      <input id="manual-name" placeholder="My Plugin">

      <label>Scope</label>
      <select id="manual-scope">
        <option value="site">Entire site</option>
        <option value="path" selected>This path</option>
        <option value="exact">Exact URL</option>
      </select>

      <label>Start from template</label>
      <div class="template-grid" id="template-grid">
        <button class="template-card template-card-active" data-tmpl="">
          <div class="template-card-icon">${icon("plus")}</div>
          <div class="template-card-name">Blank</div>
        </button>
        ${PLUGIN_TEMPLATES.map((t, i) => `
          <button class="template-card" data-tmpl="${i}">
            <div class="template-card-icon">${icon("code")}</div>
            <div class="template-card-name">${esc(t.name)}</div>
          </button>
        `).join("")}
      </div>
    </div>

    <div class="create-actions">
      <button class="btn btn-primary btn-block" id="manual-create">${icon("externalLink")} Create & Open in Editor</button>
    </div>
  `;

  let selectedTemplate: number | null = null;

  getSettings().then(settings => {
    if (settings.lastScope) {
      (_container!.querySelector("#manual-scope") as HTMLSelectElement).value = settings.lastScope;
    }
  });

  // Template grid selection
  _container.querySelectorAll<HTMLButtonElement>(".template-card").forEach(card => {
    card.addEventListener("click", () => {
      _container!.querySelectorAll(".template-card").forEach(c => c.classList.remove("template-card-active"));
      card.classList.add("template-card-active");
      const val = card.dataset.tmpl!;
      selectedTemplate = val === "" ? null : parseInt(val, 10);
    });
  });

  _container.querySelector("#manual-scope")!.addEventListener("change", (e) => {
    updateSettings({ lastScope: (e.target as HTMLSelectElement).value });
  });

  _container.querySelector("#manual-create")!.addEventListener("click", async () => {
    const name = (_container!.querySelector("#manual-name") as HTMLInputElement).value.trim();
    const scope = (_container!.querySelector("#manual-scope") as HTMLSelectElement).value as Scope;
    const btn = _container!.querySelector("#manual-create") as HTMLButtonElement;

    const pageInfo = await getPageInfo();
    const url = pageInfo?.url || "";
    if (!url) {
      showToast("No page detected", { type: "error" });
      return;
    }

    const code = selectedTemplate !== null
      ? { ...PLUGIN_TEMPLATES[selectedTemplate]!.code }
      : { css: "", html: "", js: "" };

    // Need at least something for blank — add a CSS comment so it's not empty
    if (!code.css.trim() && !code.html.trim() && !code.js.trim()) {
      code.css = "/* Add your CSS here */\n";
    }

    const match = matchFromScope(url, scope);
    const platform = detectPlatform(match);

    setButtonLoading(btn, true, "Creating...");

    try {
      const plugin = await upsertPlugin({
        match,
        name: name || "Custom Plugin",
        description: "",
        platform,
        source: "user",
        code
      });

      triggerSync();
      await reloadPlugins();
      showToast("Plugin created!");
      chrome.runtime.sendMessage({ type: "openEditor", pluginId: plugin.id });

      // Reset form
      (_container!.querySelector("#manual-name") as HTMLInputElement).value = "";
      selectedTemplate = null;
      _container!.querySelectorAll(".template-card").forEach(c => c.classList.remove("template-card-active"));
      _container!.querySelector(".template-card")?.classList.add("template-card-active");
      setButtonLoading(btn, false);
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`, { type: "error" });
      setButtonLoading(btn, false);
    }
  });
}
