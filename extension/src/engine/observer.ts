import { isInOurUi, isInOurInjectedHtml } from '../lib/dom';
import { CSS_ID_PREFIX, HTML_ID_PREFIX, DATA_ATTR } from '../lib/constants';
import { debounce } from '../lib/utils';

/**
 * Check if any removed nodes contain our injected elements (CSS or HTML).
 * SPA routers that replace <body> content will remove our HTML containers.
 */
function containsOurElements(mutations: MutationRecord[]): boolean {
  for (const m of mutations) {
    for (const node of m.removedNodes) {
      if (!(node instanceof Element)) continue;
      // Direct match: our CSS or HTML container was removed
      if (node.id?.startsWith(CSS_ID_PREFIX) || node.id?.startsWith(HTML_ID_PREFIX)) return true;
      // Subtree match: a parent element containing our elements was removed
      if (node.querySelector(`[id^="${CSS_ID_PREFIX}"], [id^="${HTML_ID_PREFIX}"]`)) return true;
    }
  }
  return false;
}

/**
 * MutationObserver with two callback tiers:
 * 1. `onElementDestroyed` — fires immediately (no debounce) when our injected
 *    CSS/HTML elements are removed from the DOM. This handles SPA router body
 *    wipes where we need instant re-injection to avoid flicker.
 * 2. `onDomChanged` — fires with debounce for general DOM mutations (new content
 *    loaded, third-party scripts, etc.) where a full re-sync may be needed.
 */
export function watchDomMutations(
  onDomChanged: () => void,
  onElementDestroyed: () => void,
  debounceMs = 300
): () => void {
  const debouncedCallback = debounce(onDomChanged, debounceMs);

  const observer = new MutationObserver((mutations) => {
    // Fast path: check if SPA router destroyed our elements
    if (containsOurElements(mutations)) {
      onElementDestroyed();
      return; // No need for debounced sync — immediate repair handles it
    }

    // Slow path: general DOM changes, debounced
    for (const m of mutations) {
      const t = m.target;
      // Skip mutations in our UI or injected HTML
      if (isInOurUi(t) || isInOurInjectedHtml(t)) continue;
      // Skip mutations on our own data-domo elements
      if (t instanceof Element && t.hasAttribute(DATA_ATTR)) continue;
      debouncedCallback();
      break;
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  return () => observer.disconnect();
}
