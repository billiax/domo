import type { Match } from "../types/plugin";
import { icon } from "../icons";

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export class MatchBuilder {
  private container: HTMLElement;
  private match: Match;
  private matchAll: Match[];
  private excludes: Match[];
  private onChange: () => void;

  constructor(container: HTMLElement, match: Match, matchAll: Match[], excludes: Match[], onChange: () => void) {
    this.container = container;
    this.match = match;
    this.matchAll = matchAll;
    this.excludes = excludes;
    this.onChange = onChange;
  }

  getMatch(): Match { return this.match; }
  getMatchAll(): Match[] { return this.matchAll; }
  getExcludes(): Match[] { return this.excludes; }

  render(): void {
    let html = '<div class="ed-section-title">Primary Match</div>';
    html += this.renderMatchRow(this.match, "primary", 0);

    if (this.matchAll.length > 0) {
      html += '<div class="ed-section-title" style="margin-top:12px;">Additional Matches (OR)</div>';
      this.matchAll.forEach((m, i) => {
        html += this.renderMatchRow(m, "matchAll", i);
      });
    }
    html += `<button class="ed-btn" style="margin-top:6px;" data-action="add-matchAll">${icon("plus")} Add Match</button>`;

    if (this.excludes.length > 0) {
      html += '<div class="ed-section-title" style="margin-top:12px;">Exclude Patterns</div>';
      this.excludes.forEach((m, i) => {
        html += this.renderMatchRow(m, "exclude", i);
      });
    }
    html += `<button class="ed-btn" style="margin-top:6px;" data-action="add-exclude">${icon("plus")} Add Exclude</button>`;

    this.container.innerHTML = html;
    this.wireEvents();
  }

  private renderMatchRow(match: Match, group: string, index: number): string {
    const types = ["site", "path", "exact", "glob", "regex"];
    const canRemove = group !== "primary";

    let fields = "";
    if (match.type === "site") {
      fields = `<input type="text" data-field="host" value="${esc((match as any).host || "")}" placeholder="Host (e.g., github.com)">`;
    } else if (match.type === "path") {
      fields = `<input type="text" data-field="host" value="${esc((match as any).host || "")}" placeholder="Host" style="width:40%;">
        <input type="text" data-field="pathPrefix" value="${esc((match as any).pathPrefix || "")}" placeholder="Path prefix" style="flex:1;">`;
    } else if (match.type === "exact") {
      fields = `<input type="text" data-field="url" value="${esc((match as any).url || "")}" placeholder="Exact URL">`;
    } else if (match.type === "glob") {
      fields = `<input type="text" data-field="pattern" value="${esc((match as any).pattern || "")}" placeholder="*://github.com/*/issues/*">`;
    } else if (match.type === "regex") {
      fields = `<input type="text" data-field="pattern" value="${esc((match as any).pattern || "")}" placeholder="https://github\\.com/.+/pulls">
        <input type="text" data-field="flags" value="${esc((match as any).flags || "i")}" placeholder="flags" style="width:50px;">`;
    }

    return `<div class="ed-match-row" data-group="${group}" data-index="${index}">
      <select data-field="type">${types.map(t => `<option value="${t}"${match.type === t ? " selected" : ""}>${t}</option>`).join("")}</select>
      ${fields}
      ${canRemove ? `<button class="ed-btn ed-btn-danger" data-action="remove" style="padding:2px 6px;">${icon("close", "domo-icon-sm")}</button>` : ""}
    </div>`;
  }

  private wireEvents(): void {
    this.container.querySelectorAll<HTMLElement>(".ed-match-row").forEach(row => {
      const group = row.dataset.group!;
      const index = parseInt(row.dataset.index!, 10);

      row.querySelectorAll<HTMLElement>("input, select").forEach(el => {
        el.addEventListener("input", () => this.updateMatchFromRow(row, group, index));
        el.addEventListener("change", () => this.updateMatchFromRow(row, group, index));
      });

      row.querySelector('[data-action="remove"]')?.addEventListener("click", () => {
        if (group === "matchAll") this.matchAll.splice(index, 1);
        else if (group === "exclude") this.excludes.splice(index, 1);
        this.render();
        this.onChange();
      });
    });

    this.container.querySelector('[data-action="add-matchAll"]')?.addEventListener("click", () => {
      this.matchAll.push({ type: "site", host: "" });
      this.render();
      this.onChange();
    });

    this.container.querySelector('[data-action="add-exclude"]')?.addEventListener("click", () => {
      this.excludes.push({ type: "site", host: "" });
      this.render();
      this.onChange();
    });
  }

  private updateMatchFromRow(row: HTMLElement, group: string, index: number): void {
    const type = (row.querySelector('[data-field="type"]') as HTMLSelectElement).value;
    let newMatch: Match;

    if (type === "site") {
      newMatch = { type: "site", host: (row.querySelector('[data-field="host"]') as HTMLInputElement)?.value || "" };
    } else if (type === "path") {
      newMatch = { type: "path", host: (row.querySelector('[data-field="host"]') as HTMLInputElement)?.value || "", pathPrefix: (row.querySelector('[data-field="pathPrefix"]') as HTMLInputElement)?.value || "" };
    } else if (type === "exact") {
      newMatch = { type: "exact", url: (row.querySelector('[data-field="url"]') as HTMLInputElement)?.value || "" };
    } else if (type === "glob") {
      newMatch = { type: "glob", pattern: (row.querySelector('[data-field="pattern"]') as HTMLInputElement)?.value || "" };
    } else if (type === "regex") {
      newMatch = { type: "regex", pattern: (row.querySelector('[data-field="pattern"]') as HTMLInputElement)?.value || "", flags: (row.querySelector('[data-field="flags"]') as HTMLInputElement)?.value || "i" };
    } else {
      return;
    }

    // Check if type changed — need re-render for different fields
    const currentMatch = group === "primary" ? this.match : group === "matchAll" ? this.matchAll[index] : this.excludes[index];
    const typeChanged = currentMatch?.type !== type;

    if (group === "primary") this.match = newMatch;
    else if (group === "matchAll") this.matchAll[index] = newMatch;
    else if (group === "exclude") this.excludes[index] = newMatch;

    if (typeChanged) this.render();
    this.onChange();
  }
}
