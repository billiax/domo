import { sleep } from './lib/utils';
import { PluginEngine } from './engine/lifecycle';
import { CSS_ID_PREFIX, DATA_ATTR } from './lib/constants';
import { STORAGE_KEY_PLUGINS } from './core/plugins';
import { pickElementOnce } from './tools/picker';
import { computeSelector } from './lib/selector';
import { runMigrations } from './core/migrations';
import { pluginMatchesUrl } from './core/matching';
import type { Plugin } from './types/plugin';

// Collected during early CSS injection, passed to engine to avoid double storage read
let earlyMatchedPlugins: Plugin[] | null = null;

if (window.top === window) {
  // ── Early CSS injection (runs at document_start, before page renders) ──
  // Generic: reads ALL matching plugins' code.css from chrome.storage.
  // No plugin-specific logic — any plugin that persists CSS via api.updateCSS()
  // gets early injection for free.
  try {
    chrome.storage.local.get(STORAGE_KEY_PLUGINS, (data) => {
      try {
        const plugins = (data?.[STORAGE_KEY_PLUGINS] || {}) as Record<string, Plugin>;
        let urlObj: URL;
        try { urlObj = new URL(location.href); } catch { return; }

        const matchedPlugins: Plugin[] = [];
        const earlyJsPlugins: Plugin[] = [];
        for (const plugin of Object.values(plugins)) {
          if (!plugin?.match || plugin.enabled === false) continue;
          try { if (!pluginMatchesUrl(plugin, urlObj)) continue; } catch { continue; }

          matchedPlugins.push(plugin);

          // Early CSS injection
          const css = plugin.code?.css;
          if (css) {
            const id = CSS_ID_PREFIX + plugin.id;
            if (!document.getElementById(id)) {
              const style = document.createElement('style');
              style.id = id;
              style.textContent = css;
              (document.head || document.documentElement).appendChild(style);
            }
          }

          // Collect document_start JS plugins
          if (plugin.runAt === "document_start" && plugin.code?.js?.trim()) {
            earlyJsPlugins.push(plugin);
          }
        }

        // Save matched plugins for engine to avoid re-reading storage
        earlyMatchedPlugins = matchedPlugins;

        // Inject document_start JS immediately
        for (const plugin of earlyJsPlugins) {
          try {
            chrome.runtime.sendMessage({
              type: "injectJS",
              ruleId: plugin.id,
              ruleVersion: plugin.version,
              options: plugin.settings || {},
              jsCode: plugin.code.js
            });
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    });
  } catch { /* ignore */ }

  // ── Listen for plugin CSS updates from MAIN world (via api.updateCSS()) ──
  // Plugins that generate CSS at runtime (e.g. hider) call api.updateCSS(css)
  // which uses window.postMessage (not CustomEvent) because CustomEvent.detail
  // is NOT accessible across Chrome's content script / MAIN world boundary.
  //
  // IMPORTANT: We do NOT increment plugin.version here. The version bump would
  // trigger a storage change → sync() → full cleanup+re-apply cycle, which
  // destroys running JS and causes flicker. Instead, we silently update code.css.
  // The engine's sync() checks for CSS content changes separately.
  window.addEventListener('message', async (e: MessageEvent) => {
    if (e.origin !== location.origin) return;
    if (!e.data?.__domo) return;

    // Relay proxy fetch requests from MAIN world to background
    if (e.data.type === 'domo:proxyFetch') {
      const { requestId, pluginId, url, options } = e.data;
      chrome.runtime.sendMessage({ type: "proxyFetch", requestId, pluginId, url, options });
      return;
    }

    // Capture JS runtime errors from MAIN world and forward to sidepanel
    if (e.data.type === 'domo:pluginError') {
      const { pluginId, message, stack } = e.data;
      try {
        chrome.runtime.sendMessage({
          target: "sidepanel",
          type: "pluginError",
          error: {
            pluginId,
            pluginName: pluginId,
            timestamp: new Date().toISOString(),
            phase: "js-runtime" as const,
            message: message || "Unknown error",
            stack: stack || undefined
          }
        });
      } catch { /* sidepanel may not be open */ }
      return;
    }

    if (e.data.type !== 'domo:updateCSS') return;
    const { pluginId, css } = e.data;
    if (!pluginId || typeof css !== 'string') return;
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY_PLUGINS);
      const plugins = (data[STORAGE_KEY_PLUGINS] || {}) as Record<string, Plugin>;
      const plugin = plugins[pluginId];
      if (!plugin) return;
      // Skip if CSS hasn't actually changed (avoid unnecessary storage writes)
      if (plugin.code.css === css) return;
      plugin.code.css = css;
      plugin.updatedAt = new Date().toISOString();
      await chrome.storage.local.set({ [STORAGE_KEY_PLUGINS]: plugins });
    } catch { /* ignore */ }
  });

  // ── Full engine init (waits for body) ──
  main().catch((err) => console.warn("[domo] init failed", err));
}

async function main(): Promise<void> {
  while (!document.body) await sleep(50);

  // Run any pending storage migrations
  await runMigrations();

  // Legacy cleanup
  document.querySelectorAll('[id^="__myapp_personalizer_"]').forEach(el => el.remove());
  document.querySelectorAll('[data-myapp-personalizer]').forEach(el => el.remove());
  document.getElementById("__domo_hider__")?.remove();

  // Create engine — handlers reference it by closure, safe to register listeners now
  const engine = new PluginEngine();

  // Pass early-matched plugins to engine to avoid re-reading storage on first sync
  if (earlyMatchedPlugins) {
    engine.setEarlyPlugins(earlyMatchedPlugins);
    earlyMatchedPlugins = null;
  }

  // ── Register message listener BEFORE engine.init() ──
  // This is critical: the sidepanel may send messages (openFloatingPanel, syncPlugins)
  // while the engine is still initializing. If we register after init(), those messages
  // are silently dropped — the "configure" button for system plugins would do nothing.
  chrome.runtime.onMessage.addListener((msg: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): undefined => {
    if (msg.type === "getPageInfo") {
      sendResponse({
        url: location.href,
        hostname: location.hostname,
        title: document.title
      });
      return;
    }

    if (msg.type === "startPicker") {
      pickElementOnce().then(el => {
        if (el) {
          const selector = computeSelector(el);
          chrome.runtime.sendMessage({ target: "sidepanel", type: "elementPicked", selector });
        }
      });
      return;
    }

    if (msg.type === "syncPlugins") {
      engine.sync();
      return;
    }

    if (msg.type === "previewPlugin") {
      let el = document.getElementById("__domo_preview_css__") as HTMLStyleElement | null;
      if (!el) { el = document.createElement("style"); el.id = "__domo_preview_css__"; document.head.appendChild(el); }
      el.textContent = msg.code.css || "";
      let htmlEl = document.getElementById("__domo_preview_html__") as HTMLDivElement | null;
      if (!htmlEl) { htmlEl = document.createElement("div"); htmlEl.id = "__domo_preview_html__"; htmlEl.setAttribute(DATA_ATTR, "html"); document.body.appendChild(htmlEl); }
      htmlEl.innerHTML = msg.code.html || "";
      return;
    }

    if (msg.type === "stopPreview") {
      document.getElementById("__domo_preview_css__")?.remove();
      document.getElementById("__domo_preview_html__")?.remove();
      return;
    }

    if (msg.type === "navigationChanged") {
      engine.sync();
      return;
    }

    // NOTE: "command", "openFloatingPanel", "closeFloatingPanel" are dispatched
    // directly in MAIN world by the background via chrome.scripting.executeScript
    // + window.postMessage. This avoids the cross-world CustomEvent.detail issue
    // where detail is null when accessed from a different JS world.
  });

  // Now init engine — first sync, watchers, etc.
  await engine.init();

  window.addEventListener("beforeunload", () => engine.destroy());
}
