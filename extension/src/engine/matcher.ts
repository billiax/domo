/**
 * Navigation detection using Navigation API (Chrome 105+) with popstate/hashchange fallback.
 * Replaces the 900ms setInterval polling.
 */
export function watchNavigation(callback: (url: string) => void): () => void {
  let lastUrl = location.href;

  const handler = (): void => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      callback(location.href);
    }
  };

  // Primary: Navigation API (Chrome 105+, well within our Chrome 120 target)
  if (typeof navigation !== "undefined") {
    navigation.addEventListener("navigatesuccess", handler);
  }

  // Fallback: popstate + hashchange
  window.addEventListener("popstate", handler);
  window.addEventListener("hashchange", handler);

  return () => {
    if (typeof navigation !== "undefined") {
      navigation.removeEventListener("navigatesuccess", handler);
    }
    window.removeEventListener("popstate", handler);
    window.removeEventListener("hashchange", handler);
  };
}
