import type { Match } from "../types/plugin";
import { icon } from "../icons";

export interface PageInfo {
  url: string;
  hostname: string;
  title: string;
}

// Single source of truth for getting current tab's page info
let _cachedPageInfo: PageInfo | null = null;

export async function getPageInfo(): Promise<PageInfo | null> {
  return new Promise(resolve => {
    (chrome.runtime.sendMessage as Function)({ target: "content", type: "getPageInfo" }, (response: any) => {
      if (response) _cachedPageInfo = response as PageInfo;
      resolve(response ? (response as PageInfo) : _cachedPageInfo || null);
    });
  });
}

export function getCachedPageInfo(): PageInfo | null {
  return _cachedPageInfo;
}

export function setCachedPageInfo(info: PageInfo): void {
  _cachedPageInfo = info;
}

export function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Notify content script to re-sync plugins
export function triggerSync(): void {
  chrome.runtime.sendMessage({ target: "content", type: "syncPlugins" });
}

// ── Overflow Menu ──

export interface MenuAction {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

let _activeMenu: HTMLElement | null = null;
let _menuCleanup: (() => void) | null = null;

export function showOverflowMenu(trigger: HTMLElement, actions: MenuAction[]): void {
  // Close any existing menu
  closeOverflowMenu();

  const menu = document.createElement("div");
  menu.className = "domo-menu";

  for (const action of actions) {
    if (action.separator) {
      menu.appendChild(Object.assign(document.createElement("div"), { className: "domo-menu-separator" }));
    }
    const btn = document.createElement("button");
    btn.className = `domo-menu-item${action.danger ? " domo-menu-item-danger" : ""}`;
    btn.setAttribute("role", "menuitem");
    btn.innerHTML = `${icon(action.icon)} ${esc(action.label)}`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeOverflowMenu();
      action.onClick();
    });
    menu.appendChild(btn);
  }

  // Append to body with fixed positioning to avoid overflow:hidden clipping
  document.body.appendChild(menu);

  // Calculate position from trigger
  const triggerRect = trigger.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.top = `${triggerRect.bottom + 4}px`;
  menu.style.left = "auto";
  menu.style.right = `${window.innerWidth - triggerRect.right}px`;

  // Animate in
  requestAnimationFrame(() => menu.classList.add("open"));

  // Edge detection: flip up if overflows bottom, shift left if overflows right
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${triggerRect.top - rect.height - 4}px`;
    }
    if (rect.left < 0) {
      menu.style.right = "auto";
      menu.style.left = "8px";
    }
  });

  _activeMenu = menu;

  // Close handlers
  const onClickOutside = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && e.target !== trigger) {
      closeOverflowMenu();
    }
  };
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeOverflowMenu();
  };

  setTimeout(() => {
    document.addEventListener("click", onClickOutside);
    document.addEventListener("keydown", onEscape);
  }, 0);

  _menuCleanup = () => {
    document.removeEventListener("click", onClickOutside);
    document.removeEventListener("keydown", onEscape);
  };
}

function closeOverflowMenu(): void {
  if (_activeMenu) {
    _activeMenu.remove();
    _activeMenu = null;
  }
  if (_menuCleanup) {
    _menuCleanup();
    _menuCleanup = null;
  }
}

// ── Confirm Dialog ──

export function showConfirm({ message, title, confirmText = "Confirm", cancelText = "Cancel", danger = false }: {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean> {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = `
      <div class="confirm-dialog">
        ${title ? `<div class="confirm-title">${danger ? icon("alertTriangle") + " " : ""}${esc(title)}</div>` : ""}
        <div class="confirm-message">${esc(message)}</div>
        <div class="confirm-actions">
          <button class="btn btn-sm confirm-cancel">${esc(cancelText)}</button>
          <button class="btn btn-sm ${danger ? "btn-danger" : "btn-primary"} confirm-ok">${danger ? icon("trash") + " " : ""}${esc(confirmText)}</button>
        </div>
      </div>
    `;

    const cleanup = (result: boolean): void => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector(".confirm-cancel")!.addEventListener("click", () => cleanup(false));
    overlay.querySelector(".confirm-ok")!.addEventListener("click", () => cleanup(true));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(false); });
    document.addEventListener("keydown", function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { document.removeEventListener("keydown", onKey); cleanup(false); }
    });

    document.getElementById("app")!.appendChild(overlay);
    (overlay.querySelector(".confirm-ok") as HTMLButtonElement).focus();
  });
}

// ── Toast Notifications ──

const TOAST_ICONS: Record<string, string> = {
  success: "check",
  error: "alertTriangle",
  info: "info",
  warning: "alertTriangle",
};

export function showToast(message: string, { type = "success", duration = 3000 }: { type?: string; duration?: number } = {}): void {
  let container = document.getElementById("domo-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "domo-toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const iconName = TOAST_ICONS[type] || "info";
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icon(iconName)} <span>${esc(message)}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("toast-show")));

  // Click to dismiss
  toast.addEventListener("click", () => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 200);
  });

  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// ── Loading State Helper ──

const _btnOriginals = new WeakMap<HTMLButtonElement, string>();

export function setButtonLoading(btn: HTMLButtonElement, loading: boolean, text?: string): void {
  if (loading) {
    _btnOriginals.set(btn, btn.innerHTML);
    btn.disabled = true;
    btn.innerHTML = `<span class="domo-spinner"></span>${text ? esc(text) : ""}`;
  } else {
    btn.disabled = false;
    const original = _btnOriginals.get(btn);
    if (original !== undefined) {
      btn.innerHTML = original;
      _btnOriginals.delete(btn);
    }
  }
}

// ── Format Match Info ──

export function formatMatchInfo(match: Match | null | undefined): string {
  if (!match) return "unknown";
  if (match.type === "site") {
    return match.host === "*" ? "All sites" : match.host;
  }
  if (match.type === "path") {
    return `${match.host}${match.pathPrefix || ""}`;
  }
  if (match.type === "exact") {
    try {
      const u = new URL(match.url);
      const display = `${u.host}${u.pathname}`;
      return display.length > 50 ? display.slice(0, 47) + "..." : display;
    } catch { return match.url || ""; }
  }
  if (match.type === "glob") return match.pattern;
  if (match.type === "regex") return `/${match.pattern}/`;
  return "unknown";
}
