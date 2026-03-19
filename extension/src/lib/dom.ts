import { UI_ROOT_ID, CSS_ID_PREFIX, HTML_ID_PREFIX, DATA_ATTR } from './constants';

export function getOrCreateStyleTag(ruleId: string): HTMLStyleElement {
  const id = `${CSS_ID_PREFIX}${ruleId}`;
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    (document.head || document.documentElement).appendChild(el);
  }
  return el;
}

export function getOrCreateHtmlContainer(ruleId: string): HTMLDivElement {
  const id = `${HTML_ID_PREFIX}${ruleId}`;
  let el = document.getElementById(id) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.setAttribute(DATA_ATTR, "html");
    document.body.appendChild(el);
  }
  return el;
}

export function isInOurUi(node: Node | null): boolean {
  if (!node) return false;
  const root = document.getElementById(UI_ROOT_ID);
  if (!root) return false;
  if (node === root) return true;
  if (root.shadowRoot && root.shadowRoot.contains(node)) return true;
  return root.contains(node);
}

export function isInOurInjectedHtml(node: Node | null): boolean {
  if (!node) return false;
  const el = node.nodeType === 1 ? node as Element : (node as Node).parentElement;
  return Boolean(el?.closest?.(`[${DATA_ATTR}="html"]`));
}
