import { cssEscape } from './utils';

export function computeSelector(el: Element): string | null {
  if (!(el instanceof Element)) return null;
  if (el.id) return `#${cssEscape(el.id)}`;
  const testId = el.getAttribute("data-testid") || el.getAttribute("data-test-id");
  if (testId) return `[data-testid="${testId.replaceAll('"', '\\"')}"]`;

  const parts: string[] = [];
  let cur: Element | null = el;
  for (let i = 0; i < 6 && cur && cur.nodeType === 1 && cur !== document.body; i++) {
    const tag = cur.tagName.toLowerCase();
    if (!tag) break;
    const parent: Element | null = cur.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }
    const curTag = cur.tagName;
    const siblings = Array.from(parent.children).filter((c: Element) => c.tagName === curTag);
    const idx = siblings.indexOf(cur) + 1;
    const piece = siblings.length > 1 ? `${tag}:nth-of-type(${idx})` : tag;
    parts.unshift(piece);
    if (parent.id) {
      parts.unshift(`#${cssEscape(parent.id)}`);
      break;
    }
    cur = parent;
  }
  return parts.join(" > ");
}
