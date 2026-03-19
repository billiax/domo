import { isInOurUi } from '../lib/dom';

export interface PickerOptions {
  onHover?: (el: Element) => void;
}

export async function pickElementOnce({ onHover }: PickerOptions = {}): Promise<Element | null> {
  return new Promise((resolve) => {
    let active = true;
    let last: Element | null = null;
    const overlay = document.createElement("div");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483646",
      "cursor:crosshair",
      "background:rgba(0,0,0,0.02)",
      "pointer-events:none"
    ].join(";");

    const highlight = document.createElement("div");
    highlight.style.cssText = [
      "position:fixed",
      "z-index:2147483647",
      "pointer-events:none",
      "border:2px solid #ff4d4f",
      "border-radius:6px",
      "box-shadow:0 0 0 4px rgba(255,77,79,.15)"
    ].join(";");

    function cleanup(): void {
      active = false;
      overlay.remove();
      highlight.remove();
      document.documentElement.style.cursor = "";
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
    }

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
        resolve(null);
      }
    }

    function onMove(e: MouseEvent): void {
      if (!active) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isInOurUi(el)) return;
      if (last !== el) {
        last = el;
        onHover?.(el);
      }
      const r = el.getBoundingClientRect();
      highlight.style.left = `${Math.max(0, r.left)}px`;
      highlight.style.top = `${Math.max(0, r.top)}px`;
      highlight.style.width = `${Math.max(0, r.width)}px`;
      highlight.style.height = `${Math.max(0, r.height)}px`;
    }

    function onClick(e: MouseEvent): void {
      if (!active) return;
      e.preventDefault();
      e.stopPropagation();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isInOurUi(el)) return;
      cleanup();
      resolve(el);
    }

    document.body.appendChild(overlay);
    document.body.appendChild(highlight);
    document.documentElement.style.cursor = "crosshair";
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
  });
}
