import type { Plugin, Match, PluginCode } from "../types/plugin";
import { getPlugin, upsertPlugin } from "../core/plugins";
import { getSettings } from "../core/storage";
import { detectPlatform } from "../core/platforms";
import { CodeEditor } from "./code-editor";
import { MatchBuilder } from "./match-builder";
import { ConsolePanel } from "./console-panel";
import { renderApiDocs } from "./api-docs";
import { saveDraft, loadDraft, clearDraft } from "./drafts";
import { icon } from "../icons";

type EditorTab = "css" | "html" | "js" | "match" | "options" | "api";

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function showEditorToast(msg: string, type: "success" | "error" = "success"): void {
  const existing = document.querySelector(".ed-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = `ed-toast ${type === "error" ? "error" : ""}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("show")));
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 200); }, 2500);
}

export class EditorApp {
  private root: HTMLElement;
  private pluginId: string | null;
  private plugin: Plugin | null = null;
  private activeTab: EditorTab = "css";
  private codeEditor: CodeEditor | null = null;
  private matchBuilder: MatchBuilder | null = null;
  private consolePanel: ConsolePanel | null = null;

  private name = "";
  private description = "";
  private platform = "";
  private priority = 100;
  private match: Match = { type: "site", host: "" };
  private matchAll: Match[] = [];
  private excludes: Match[] = [];
  private code: PluginCode = { css: "", html: "", js: "" };
  private runAt: "document_start" | "document_idle" | undefined;
  private isPreviewActive = false;

  constructor(root: HTMLElement, pluginId: string | null) {
    this.root = root;
    this.pluginId = pluginId;
  }

  async init(): Promise<void> {
    // Load theme
    const settings = await getSettings();
    document.documentElement.setAttribute("data-theme", settings.theme || "system");

    // Load plugin data
    if (this.pluginId) {
      this.plugin = await getPlugin(this.pluginId);
      if (this.plugin) {
        this.name = this.plugin.name;
        this.description = this.plugin.description;
        this.platform = this.plugin.platform;
        this.priority = this.plugin.priority;
        this.match = this.plugin.match;
        this.matchAll = this.plugin.matchAll ? [...this.plugin.matchAll] : [];
        this.excludes = this.plugin.exclude ? [...this.plugin.exclude] : [];
        this.code = { ...this.plugin.code };
        this.runAt = this.plugin.runAt;
      }
    }

    // Check for draft
    if (!this.plugin) {
      const draft = await loadDraft(this.pluginId);
      if (draft) {
        this.name = draft.name;
        this.description = draft.description;
        this.platform = draft.platform;
        this.match = draft.match;
        this.matchAll = draft.matchAll || [];
        this.excludes = draft.exclude || [];
        this.code = draft.code;
        this.runAt = draft.runAt;
      }
    }

    this.render();
    this.wireEvents();
  }

  private render(): void {
    const title = this.plugin ? `Edit: ${esc(this.name)}` : "New Plugin";
    const tabs: { id: EditorTab; label: string }[] = [
      { id: "css", label: "CSS" },
      { id: "html", label: "HTML" },
      { id: "js", label: "JS" },
      { id: "match", label: "Match" },
      { id: "options", label: "Options" },
      { id: "api", label: "API Docs" },
    ];

    this.root.innerHTML = `
      <div class="ed-toolbar">
        <input class="ed-name" id="ed-name" value="${esc(this.name)}" placeholder="Plugin name">
        <button class="ed-btn" id="ed-save">${icon("save")} Save</button>
        <button class="ed-btn ed-btn-primary" id="ed-save-close">${icon("save")} Save & Close</button>
        <button class="ed-btn" id="ed-preview">${this.isPreviewActive ? icon("eyeOff") + " Stop Preview" : icon("eye") + " Run Preview"}</button>
      </div>
      <div class="ed-tabs">
        ${tabs.map(t => `<button class="ed-tab${this.activeTab === t.id ? " active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("")}
      </div>
      <div class="ed-main">
        <div class="ed-code-panel">
          <div id="ed-code-area" style="flex:1;display:${["css", "html", "js"].includes(this.activeTab) ? "flex" : "none"};flex-direction:column;"></div>
          <div id="ed-match-area" class="ed-meta-panel" style="display:${this.activeTab === "match" ? "block" : "none"};"></div>
          <div id="ed-options-area" class="ed-meta-panel" style="display:${this.activeTab === "options" ? "block" : "none"};"></div>
          <div id="ed-api-area" style="display:${this.activeTab === "api" ? "block" : "none"};"></div>
        </div>
        <div class="ed-preview-panel">
          <div class="ed-panel-header">Preview</div>
          <div class="ed-preview-content" id="ed-preview-content">
            <p style="color:var(--ed-text-muted);font-size:11px;">Click "Run Preview" to see live output on the active tab.</p>
          </div>
        </div>
      </div>
      <div class="ed-console" id="ed-console"></div>
    `;

    // Init code editor
    const codeArea = this.root.querySelector<HTMLElement>("#ed-code-area")!;
    this.codeEditor = new CodeEditor(codeArea, (lang, content) => {
      this.code[lang] = content;
      this.scheduleDraftSave();
    });
    this.codeEditor.init(this.code);
    if (["css", "html", "js"].includes(this.activeTab)) {
      this.codeEditor.switchTab(this.activeTab as "css" | "html" | "js");
    }

    // Init match builder
    const matchArea = this.root.querySelector<HTMLElement>("#ed-match-area")!;
    this.matchBuilder = new MatchBuilder(matchArea, this.match, this.matchAll, this.excludes, () => {
      this.match = this.matchBuilder!.getMatch();
      this.matchAll = this.matchBuilder!.getMatchAll();
      this.excludes = this.matchBuilder!.getExcludes();
      this.scheduleDraftSave();
    });
    this.matchBuilder.render();

    // Init options area
    this.renderOptions();

    // Init API docs
    renderApiDocs(this.root.querySelector<HTMLElement>("#ed-api-area")!);

    // Init console
    this.consolePanel = new ConsolePanel(this.root.querySelector<HTMLElement>("#ed-console")!);
  }

  private renderOptions(): void {
    const area = this.root.querySelector<HTMLElement>("#ed-options-area")!;
    area.innerHTML = `
      <label>Description</label>
      <textarea id="ed-desc" rows="2" placeholder="What does this plugin do?">${esc(this.description)}</textarea>

      <label>Platform</label>
      <input id="ed-platform" value="${esc(this.platform)}" placeholder="Auto-detected from match">

      <label>Priority</label>
      <input id="ed-priority" type="number" value="${this.priority}" min="1" max="10000">

      <label>Run At</label>
      <select id="ed-runAt">
        <option value="document_idle"${!this.runAt || this.runAt === "document_idle" ? " selected" : ""}>document_idle (default)</option>
        <option value="document_start"${this.runAt === "document_start" ? " selected" : ""}>document_start (early)</option>
      </select>
      ${this.runAt === "document_start" ? '<div class="ed-runAt-warn">Warning: document_start JS runs before the DOM is ready. Use api.waitForSelector() for DOM access.</div>' : ""}
    `;

    area.querySelector("#ed-desc")!.addEventListener("input", (e) => {
      this.description = (e.target as HTMLTextAreaElement).value;
      this.scheduleDraftSave();
    });
    area.querySelector("#ed-platform")!.addEventListener("input", (e) => {
      this.platform = (e.target as HTMLInputElement).value;
    });
    area.querySelector("#ed-priority")!.addEventListener("input", (e) => {
      this.priority = parseInt((e.target as HTMLInputElement).value, 10) || 100;
    });
    area.querySelector("#ed-runAt")!.addEventListener("change", (e) => {
      this.runAt = (e.target as HTMLSelectElement).value as "document_start" | "document_idle";
      this.renderOptions();
    });
  }

  private wireEvents(): void {
    // Tab switching
    this.root.querySelectorAll<HTMLButtonElement>(".ed-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTab = btn.dataset.tab as EditorTab;
        this.root.querySelectorAll<HTMLButtonElement>(".ed-tab").forEach(b => b.classList.toggle("active", b === btn));

        const isCodeTab = ["css", "html", "js"].includes(this.activeTab);
        this.root.querySelector<HTMLElement>("#ed-code-area")!.style.display = isCodeTab ? "flex" : "none";
        this.root.querySelector<HTMLElement>("#ed-match-area")!.style.display = this.activeTab === "match" ? "block" : "none";
        this.root.querySelector<HTMLElement>("#ed-options-area")!.style.display = this.activeTab === "options" ? "block" : "none";
        this.root.querySelector<HTMLElement>("#ed-api-area")!.style.display = this.activeTab === "api" ? "block" : "none";

        if (isCodeTab) {
          this.codeEditor?.switchTab(this.activeTab as "css" | "html" | "js");
        }
      });
    });

    // Name input
    this.root.querySelector<HTMLInputElement>("#ed-name")!.addEventListener("input", (e) => {
      this.name = (e.target as HTMLInputElement).value;
      this.scheduleDraftSave();
    });

    // Save
    this.root.querySelector("#ed-save")!.addEventListener("click", () => this.save());
    this.root.querySelector("#ed-save-close")!.addEventListener("click", async () => {
      const ok = await this.save();
      if (ok) window.close();
    });

    // Preview
    this.root.querySelector("#ed-preview")!.addEventListener("click", () => this.togglePreview());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        this.save();
      }
    });

    // Console messages
    chrome.runtime.onMessage.addListener((msg: any): undefined => {
      if (msg.type === "editorConsole" && this.consolePanel) {
        this.consolePanel.addEntry(msg.level || "log", String(msg.args?.join(" ") || ""));
      }
    });
  }

  private async save(): Promise<boolean> {
    if (!this.name.trim()) {
      showEditorToast("Plugin name is required", "error");
      return false;
    }

    const code = this.codeEditor?.getAllContent() || this.code;
    const platform = this.platform || detectPlatform(this.match);

    const isModifyingCatalog = this.plugin?.source === "catalog" && this.plugin.definitionId;

    try {
      await upsertPlugin({
        id: this.plugin?.id,
        match: this.match,
        matchAll: this.matchAll.length > 0 ? this.matchAll : undefined,
        exclude: this.excludes.length > 0 ? this.excludes : undefined,
        name: this.name,
        description: this.description,
        platform,
        source: this.plugin?.source ?? "user",
        modified: isModifyingCatalog ? true : this.plugin?.modified,
        priority: this.priority,
        code,
        settings: this.plugin?.settings ?? {},
        runAt: this.runAt,
      });

      await clearDraft(this.pluginId);
      showEditorToast("Plugin saved!");

      // Trigger sync on the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "syncPlugins" }).catch(() => {});
        }
      });

      return true;
    } catch (err) {
      showEditorToast(`Save failed: ${(err as Error).message}`, "error");
      return false;
    }
  }

  private togglePreview(): void {
    this.isPreviewActive = !this.isPreviewActive;
    const btn = this.root.querySelector<HTMLButtonElement>("#ed-preview")!;
    btn.textContent = this.isPreviewActive ? "Stop Preview" : "Run Preview";

    if (this.isPreviewActive) {
      this.sendPreview();
    } else {
      this.stopPreview();
    }
  }

  private sendPreview(): void {
    const code = this.codeEditor?.getAllContent() || this.code;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "previewPlugin",
        code: { css: code.css, html: code.html }
      }).catch(() => {});
    });

    const content = this.root.querySelector<HTMLElement>("#ed-preview-content")!;
    content.innerHTML = '<p style="color:var(--ed-success);font-size:11px;">Preview active on current tab (CSS + HTML only)</p>';
  }

  private stopPreview(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "stopPreview" }).catch(() => {});
    });

    const content = this.root.querySelector<HTMLElement>("#ed-preview-content")!;
    content.innerHTML = '<p style="color:var(--ed-text-muted);font-size:11px;">Click "Run Preview" to see live output on the active tab.</p>';
  }

  private _draftTimer: ReturnType<typeof setTimeout> | null = null;
  private scheduleDraftSave(): void {
    if (this._draftTimer) clearTimeout(this._draftTimer);
    this._draftTimer = setTimeout(() => {
      saveDraft({
        pluginId: this.pluginId,
        name: this.name,
        description: this.description,
        platform: this.platform,
        match: this.match,
        matchAll: this.matchAll,
        exclude: this.excludes,
        code: this.codeEditor?.getAllContent() || this.code,
        runAt: this.runAt,
        savedAt: new Date().toISOString(),
      });
    }, 2000);
  }
}
