import { getOrCreateStyleTag, getOrCreateHtmlContainer } from '../lib/dom';
import { CSS_ID_PREFIX, HTML_ID_PREFIX } from '../lib/constants';
import type { Plugin } from '../types/plugin';
import type { AppliedPlugin } from '../types/engine';

export function injectCSS(ruleId: string, css: string): HTMLStyleElement {
  const styleTag = getOrCreateStyleTag(ruleId);
  styleTag.textContent = String(css || "");
  return styleTag;
}

export function injectHTML(ruleId: string, html: string): HTMLDivElement {
  const htmlContainer = getOrCreateHtmlContainer(ruleId);
  htmlContainer.innerHTML = String(html || "");
  return htmlContainer;
}

export function injectJS(ruleId: string, ruleVersion: number, options: Record<string, unknown>, jsCode: string): void {
  try {
    chrome.runtime.sendMessage({
      type: "injectJS",
      ruleId,
      ruleVersion,
      options,
      jsCode
    });
  } catch (err) {
    console.warn(`[domo] JS inject error for ${ruleId}:`, err);
  }
}

/**
 * Check whether an applied plugin's DOM elements are still connected.
 * Returns true if everything is intact, false if any element was destroyed
 * (e.g. by an SPA router replacing <body> content).
 */
export function isDomIntact(applied: AppliedPlugin): boolean {
  // CSS in <head> almost always survives SPA nav, but check anyway
  if (applied.styleEl && !applied.styleEl.isConnected) return false;
  // HTML in <body> is the primary victim of SPA routers
  if (applied.htmlEl && !applied.htmlEl.isConnected) return false;
  return true;
}

/**
 * Repair a plugin's DOM elements that were destroyed externally (SPA router).
 * Only re-creates CSS and HTML — does NOT touch JS since the MAIN world
 * AbortController and all JS state are still alive (they live in JS heap,
 * not the DOM).
 */
export function repairPlugin(applied: AppliedPlugin): void {
  // Re-create CSS style tag if destroyed
  if (applied.styleEl && !applied.styleEl.isConnected) {
    applied.styleEl = injectCSS(applied.ruleId, applied.cssContent);
  }
  // Re-create HTML container if destroyed
  if (applied.htmlEl && !applied.htmlEl.isConnected) {
    applied.htmlEl = injectHTML(applied.ruleId, applied.htmlContent);
  }
}

export function removeInjection(ruleId: string): void {
  const styleEl = document.getElementById(`${CSS_ID_PREFIX}${ruleId}`);
  if (styleEl) styleEl.remove();

  const htmlEl = document.getElementById(`${HTML_ID_PREFIX}${ruleId}`);
  if (htmlEl) htmlEl.remove();

  // Send cleanup message for JS
  try {
    chrome.runtime.sendMessage({ type: "cleanupJS", ruleId });
  } catch { /* ignore */ }
}

export function applyPlugin(plugin: Plugin): AppliedPlugin {
  let styleEl: HTMLStyleElement | null = null;
  let htmlEl: HTMLDivElement | null = null;
  const cssContent = plugin.code.css || "";
  const htmlContent = plugin.code.html || "";

  // CSS injection — isolated
  try {
    styleEl = injectCSS(plugin.id, cssContent);
  } catch (err) {
    console.warn(`[domo] CSS injection failed for ${plugin.id}:`, err);
  }

  // HTML injection — isolated
  try {
    htmlEl = injectHTML(plugin.id, htmlContent);
  } catch (err) {
    console.warn(`[domo] HTML injection failed for ${plugin.id}:`, err);
  }

  // JS injection — isolated
  const js = String(plugin.code.js || "").trim();
  if (js) {
    try {
      injectJS(plugin.id, plugin.version, plugin.settings || {}, js);
    } catch (err) {
      console.warn(`[domo] JS injection failed for ${plugin.id}:`, err);
    }
  }

  return {
    ruleId: plugin.id,
    version: plugin.version,
    cleanup: null,
    styleEl,
    htmlEl,
    hasJs: js.length > 0,
    cssContent,
    htmlContent
  };
}

export function cleanupPlugin(applied: AppliedPlugin): void {
  if (applied.cleanup) {
    try { applied.cleanup.abort(); } catch { /* ignore */ }
  }
  removeInjection(applied.ruleId);
}
