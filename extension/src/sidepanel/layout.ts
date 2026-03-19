import { esc } from './shared';

export interface TabConfig {
  id: string;
  label: string;
  badge?: number;
}

export class TabLayout {
  private parent: HTMLElement;
  private tabs: TabConfig[];
  private activeTab: string;
  private containers = new Map<string, HTMLElement>();
  private badges = new Map<string, HTMLSpanElement>();
  private indicator: HTMLElement | null = null;

  constructor(parent: HTMLElement, tabs: TabConfig[]) {
    this.parent = parent;
    this.tabs = tabs;
    this.activeTab = tabs[0]?.id ?? "";
  }

  render(): void {
    // Tab bar
    const tabBar = document.createElement("div");
    tabBar.className = "tab-bar";

    for (const tab of this.tabs) {
      const btn = document.createElement("button");
      btn.className = `tab-btn${tab.id === this.activeTab ? " active" : ""}`;
      btn.dataset.tabId = tab.id;
      btn.innerHTML = `${esc(tab.label)}<span class="tab-badge" id="tab-badge-${esc(tab.id)}" style="display:none"></span>`;
      btn.addEventListener("click", () => this.switchTab(tab.id));
      tabBar.appendChild(btn);

      const badge = btn.querySelector<HTMLSpanElement>(".tab-badge")!;
      this.badges.set(tab.id, badge);
    }

    // Sliding indicator
    this.indicator = document.createElement("div");
    this.indicator.className = "tab-indicator";
    tabBar.appendChild(this.indicator);

    this.parent.appendChild(tabBar);

    // Tab containers
    for (const tab of this.tabs) {
      const container = document.createElement("div");
      container.className = "tab-content";
      container.id = `tab-${tab.id}`;
      container.style.display = tab.id === this.activeTab ? "" : "none";
      this.parent.appendChild(container);
      this.containers.set(tab.id, container);
    }

    // Position indicator after DOM layout
    requestAnimationFrame(() => this.updateIndicator());
  }

  private updateIndicator(): void {
    if (!this.indicator) return;
    const activeBtn = this.parent.querySelector<HTMLButtonElement>(`.tab-btn[data-tab-id="${this.activeTab}"]`);
    if (!activeBtn) return;
    this.indicator.style.width = `${activeBtn.offsetWidth}px`;
    this.indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
  }

  switchTab(tabId: string): void {
    if (tabId === this.activeTab) return;
    this.activeTab = tabId;

    // Update buttons
    this.parent.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tabId === tabId);
    });

    // Toggle containers
    for (const [id, container] of this.containers) {
      container.style.display = id === tabId ? "" : "none";
    }

    // Slide indicator
    this.updateIndicator();

    // Emit custom event
    document.dispatchEvent(new CustomEvent("domo:tabSwitch", { detail: { tabId } }));
  }

  getTabContainer(tabId: string): HTMLElement {
    const el = this.containers.get(tabId);
    if (!el) throw new Error(`Tab container not found: ${tabId}`);
    return el;
  }

  updateBadge(tabId: string, count: number): void {
    const badge = this.badges.get(tabId);
    if (!badge) return;
    if (count > 0) {
      badge.textContent = String(count);
      badge.style.display = "";
    } else {
      badge.style.display = "none";
    }
  }

  getActiveTab(): string {
    return this.activeTab;
  }
}
