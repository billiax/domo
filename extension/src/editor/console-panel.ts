import { icon } from "../icons";

export class ConsolePanel {
  private container: HTMLElement;
  private entriesEl: HTMLElement;
  private collapsed = true;
  private entries: { level: string; text: string }[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.innerHTML = `
      <div class="ed-panel-header" id="console-toggle">
        <span class="console-arrow">${icon("chevronRight", "domo-icon-sm")}</span> Console <span id="console-count" style="font-weight:normal;opacity:0.6;"></span>
      </div>
      <div class="ed-console-entries ed-hidden" id="console-entries"></div>
    `;
    this.entriesEl = container.querySelector("#console-entries")!;

    container.querySelector("#console-toggle")!.addEventListener("click", () => {
      this.collapsed = !this.collapsed;
      this.entriesEl.classList.toggle("ed-hidden", this.collapsed);
      const arrow = container.querySelector(".console-arrow")!;
      arrow.innerHTML = this.collapsed ? icon("chevronRight", "domo-icon-sm") : icon("chevronDown", "domo-icon-sm");
    });
  }

  addEntry(level: string, text: string): void {
    this.entries.push({ level, text });
    if (this.entries.length > 200) this.entries.shift();

    const el = document.createElement("div");
    el.className = `ed-console-entry ${level === "error" ? "error" : level === "warn" ? "warn" : ""}`;
    el.textContent = `[${level}] ${text}`;
    this.entriesEl.appendChild(el);
    this.entriesEl.scrollTop = this.entriesEl.scrollHeight;

    const count = this.container.querySelector("#console-count")!;
    count.textContent = `(${this.entries.length})`;
  }

  clear(): void {
    this.entries = [];
    this.entriesEl.innerHTML = "";
    const count = this.container.querySelector("#console-count")!;
    count.textContent = "";
  }
}
