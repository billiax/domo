// Background service worker — NOT bundled by esbuild, just type-stripped.
// Has zero runtime imports. Types used only for authoring.

// On install/update: set sidepanel behavior, configure userScripts world,
// and inject content script into existing tabs
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Inject content script into all existing tabs that match <all_urls>
  // (content scripts only auto-inject into tabs loaded AFTER install)
  chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) continue;
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["dist/content.js"],
      }).catch(() => {});
    }
  });
});

// Handle keyboard shortcut commands — dispatch directly in MAIN world
// (bypasses content script relay to avoid cross-world CustomEvent.detail issue)
chrome.commands?.onCommand?.addListener((command: string) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
    if (!tabs[0]?.id) return;
    const tabId = tabs[0].id;
    // Also notify content script for any non-MAIN-world handling
    chrome.tabs.sendMessage(tabId, { type: "command", command }).catch(() => {});
    // Dispatch directly in MAIN world where plugin JS listens
    chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: ((cmd: string) => {
        window.postMessage({ __domo: true, type: "domo:command", command: cmd }, "*");
      }) as () => void,
      args: [command]
    }).catch(() => {});
  });
});

// webNavigation listener for SPA navigation detection
chrome.webNavigation?.onHistoryStateUpdated?.addListener((details) => {
  if (details.frameId !== 0) return; // Only main frame
  chrome.tabs.sendMessage(details.tabId, {
    type: "navigationChanged",
    url: details.url,
    tabId: details.tabId
  }).catch(() => {});
});

// JS wrapper builder with cleanup lifecycle support
// NOTE: Cross-world communication uses window.postMessage (not CustomEvent.detail)
// because Chrome's content script isolation makes CustomEvent.detail null across worlds.
function buildJsWrapper(ruleId: string, ruleVersion: number, options: Record<string, unknown>, jsCode: string): string {
  return `// Rule: ${ruleId} | Version: ${ruleVersion} | Injected: ${new Date().toISOString()}
(function() {
  window.__domo_rules__ = window.__domo_rules__ || {};
  // Tear down previous version
  if (window.__domo_rules__[${JSON.stringify(ruleId)}]) {
    try { window.__domo_rules__[${JSON.stringify(ruleId)}].abort(); } catch(e) {}
  }
  var _ac = new AbortController();
  window.__domo_rules__[${JSON.stringify(ruleId)}] = _ac;
  var _cleanups = [];

  _ac.signal.addEventListener("abort", function() {
    for (var i = _cleanups.length - 1; i >= 0; i--) {
      try { _cleanups[i](); } catch(e) {}
    }
    delete window.__domo_rules__[${JSON.stringify(ruleId)}];
  });

  var _storagePrefix = 'domo_pdata_' + ${JSON.stringify(ruleId)} + '_';
  var _fetchCallbacks = {};
  var api = {
    url: location.href,
    ruleId: ${JSON.stringify(ruleId)},
    pluginId: ${JSON.stringify(ruleId)},
    ruleVersion: ${ruleVersion},
    options: ${JSON.stringify(options)},
    signal: _ac.signal,
    log: function() { console.log.apply(console, ["[domo v" + ${ruleVersion} + "]"].concat(Array.from(arguments))); },
    track: function() {},
    onCleanup: function(fn) { _cleanups.push(fn); },
    waitForSelector: function(selector, opts) {
      var timeoutMs = (opts && opts.timeoutMs) || 4000;
      return new Promise(function(resolve) {
        var el = document.querySelector(selector);
        if (el) return resolve(el);
        var start = Date.now();
        var id = api.setInterval(function() {
          var el = document.querySelector(selector);
          if (el) { clearInterval(id); return resolve(el); }
          if (Date.now() - start > timeoutMs) { clearInterval(id); return resolve(null); }
        }, 100);
      });
    },
    setInterval: function(fn, ms) { var id = setInterval(fn, ms); _cleanups.push(function() { clearInterval(id); }); return id; },
    setTimeout: function(fn, ms) { var id = setTimeout(fn, ms); _cleanups.push(function() { clearTimeout(id); }); return id; },
    addEventListener: function(target, event, handler, opts) {
      var safeHandler = function() {
        try { return handler.apply(this, arguments); }
        catch(e) {
          console.warn('[domo] event handler error:', e);
          window.postMessage({ __domo: true, type: 'domo:pluginError', pluginId: ${JSON.stringify(ruleId)}, message: e && e.message || String(e), stack: e && e.stack || '' }, '*');
        }
      };
      target.addEventListener(event, safeHandler, Object.assign({}, opts, { signal: _ac.signal }));
    },
    updateCSS: function(css) {
      window.postMessage({ __domo: true, type: 'domo:updateCSS', pluginId: ${JSON.stringify(ruleId)}, css: String(css || '') }, '*');
    },
    storage: {
      get: function(key) { try { return JSON.parse(localStorage.getItem(_storagePrefix + key)); } catch(e) { return null; } },
      set: function(key, value) { localStorage.setItem(_storagePrefix + key, JSON.stringify(value)); },
      remove: function(key) { localStorage.removeItem(_storagePrefix + key); },
      keys: function() {
        var result = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(_storagePrefix) === 0) result.push(k.slice(_storagePrefix.length));
        }
        return result;
      },
      clear: function() {
        var toRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(_storagePrefix) === 0) toRemove.push(k);
        }
        toRemove.forEach(function(k) { localStorage.removeItem(k); });
      }
    },
    fetch: function(url, opts) {
      return new Promise(function(resolve, reject) {
        var requestId = 'r_' + Math.random().toString(36).slice(2);
        _fetchCallbacks[requestId] = { resolve: resolve, reject: reject };
        window.postMessage({ __domo: true, type: 'domo:proxyFetch', pluginId: ${JSON.stringify(ruleId)}, requestId: requestId, url: url, options: opts || {} }, '*');
        api.setTimeout(function() {
          if (_fetchCallbacks[requestId]) {
            delete _fetchCallbacks[requestId];
            reject(new Error('Fetch timeout'));
          }
        }, 30000);
      });
    },
    require: function(url) {
      return new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.src = url;
        script.onload = function() { resolve(); };
        script.onerror = function() { reject(new Error('Failed to load: ' + url)); };
        document.head.appendChild(script);
        _cleanups.push(function() { script.remove(); });
      });
    }
  };
  // Listen for proxy fetch responses
  function _onFetchResponse(e) {
    if (!e.data || !e.data.__domo || e.data.type !== 'domo:proxyFetchResponse') return;
    var cb = _fetchCallbacks[e.data.requestId];
    if (!cb) return;
    delete _fetchCallbacks[e.data.requestId];
    if (e.data.error) { cb.reject(new Error(e.data.error)); return; }
    var d = e.data;
    cb.resolve({ status: d.status, headers: d.headers || {}, text: function() { return Promise.resolve(d.body || ''); }, json: function() { return Promise.resolve(JSON.parse(d.body || 'null')); } });
  }
  window.addEventListener('message', _onFetchResponse);
  _cleanups.push(function() { window.removeEventListener('message', _onFetchResponse); _fetchCallbacks = {}; });
  var _initTimeout = setTimeout(function() {
    console.warn('[domo] plugin init timeout (30s) — aborting ' + ${JSON.stringify(ruleId)});
    _ac.abort();
  }, 30000);
  try {
${jsCode}
  } catch(e) { console.warn('[domo] plugin init error (' + ${JSON.stringify(ruleId)} + '):', e); }
  clearTimeout(_initTimeout);
})();`;
}

// Helper: get active tab ID
function getActiveTabId(callback: (tabId: number) => void): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
    if (tabs[0]?.id) callback(tabs[0].id);
  });
}

// Relay messages between side panel and content script
chrome.runtime.onMessage.addListener((msg: Record<string, unknown>, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void): boolean | undefined => {
  if (msg.type === "openSidePanel") {
    chrome.sidePanel.open({ windowId: sender.tab?.windowId });
    return;
  }

  // Open full-tab editor
  if (msg.type === "openEditor") {
    const editorUrl = chrome.runtime.getURL("editor.html") + (msg.pluginId ? "?pluginId=" + encodeURIComponent(msg.pluginId as string) : "");
    chrome.tabs.create({ url: editorUrl });
    return;
  }

  // Proxy fetch for plugin cross-origin requests
  if (msg.type === "proxyFetch") {
    const { requestId, pluginId, url: fetchUrl, options: fetchOpts } = msg as { requestId: string; pluginId: string; url: string; options?: { method?: string; headers?: Record<string, string>; body?: string } };
    if (!sender.tab?.id) return;
    const tabId = sender.tab.id;
    (async () => {
      try {
        const resp = await fetch(fetchUrl, {
          method: fetchOpts?.method || "GET",
          headers: fetchOpts?.headers,
          body: fetchOpts?.body
        });
        const body = await resp.text();
        const headers: Record<string, string> = {};
        resp.headers.forEach((v, k) => { headers[k] = v; });
        chrome.scripting.executeScript({
          target: { tabId },
          world: "MAIN",
          func: ((data: { requestId: string; status: number; headers: Record<string, string>; body: string }) => {
            window.postMessage({ __domo: true, type: "domo:proxyFetchResponse", ...data }, "*");
          }) as () => void,
          args: [{ requestId, status: resp.status, headers, body }]
        }).catch(() => {});
      } catch (err: unknown) {
        chrome.scripting.executeScript({
          target: { tabId },
          world: "MAIN",
          func: ((data: { requestId: string; error: string }) => {
            window.postMessage({ __domo: true, type: "domo:proxyFetchResponse", ...data }, "*");
          }) as () => void,
          args: [{ requestId, error: (err as Error).message }]
        }).catch(() => {});
      }
    })();
    return;
  }

  // Preview JS for editor
  if (msg.type === "previewJS") {
    const activeTabId = sender.tab?.id;
    if (!activeTabId) {
      getActiveTabId((tabId) => {
        const wrappedCode = buildJsWrapper(msg.ruleId as string, 0, msg.options as Record<string, unknown>, msg.jsCode as string);
        chrome.scripting.executeScript({
          target: { tabId },
          world: "MAIN",
          func: ((code: string) => {
            const s = document.createElement("script");
            s.textContent = code;
            (document.head || document.documentElement).appendChild(s);
            s.remove();
          }) as () => void,
          args: [wrappedCode]
        }).catch(() => {});
      });
    }
    return;
  }

  // JS injection from content script
  if (msg.type === "injectJS") {
    if (!sender.tab?.id) return;
    const wrappedCode = buildJsWrapper(
      msg.ruleId as string,
      msg.ruleVersion as number,
      msg.options as Record<string, unknown>,
      msg.jsCode as string
    );
    // CSP is stripped via declarativeNetRequest rules, so inline scripts work.
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: "MAIN",
      func: ((code: string) => {
        const s = document.createElement("script");
        s.textContent = code;
        (document.head || document.documentElement).appendChild(s);
        s.remove();
      }) as () => void,
      args: [wrappedCode]
    }).catch((err) => {
      console.warn(`[domo] JS injection failed for tab ${sender.tab!.id}:`, err);
    });
    return;
  }

  // JS cleanup from content script
  if (msg.type === "cleanupJS") {
    if (!sender.tab?.id) return;
    const ruleId = msg.ruleId as string;
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: "MAIN",
      func: ((id: string) => {
        const rules = (window as any).__domo_rules__;
        if (rules?.[id]) {
          rules[id]!.abort();
        }
      }) as () => void,
      args: [ruleId]
    }).catch(() => {});
    return;
  }

  // Open floating panel — dispatch directly in MAIN world
  // (bypasses content script relay to avoid cross-world CustomEvent.detail issue)
  if (msg.type === "openFloatingPanel" && msg.target === "content") {
    getActiveTabId((tabId) => {
      chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: ((pluginId: string) => {
          window.postMessage({ __domo: true, type: "domo:openPanel", pluginId }, "*");
        }) as () => void,
        args: [msg.pluginId as string]
      }).catch(() => {});
    });
    return;
  }

  // Close floating panel — dispatch directly in MAIN world
  if (msg.type === "closeFloatingPanel" && msg.target === "content") {
    getActiveTabId((tabId) => {
      chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: (() => {
          window.postMessage({ __domo: true, type: "domo:closePanel" }, "*");
        }) as () => void,
      }).catch(() => {});
    });
    return;
  }

  // Side panel → content script (generic relay for other messages)
  if (msg.target === "content") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (!tabs[0]?.id) {
        sendResponse(undefined);
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, msg, {}, (response: any) => {
        const _err = (chrome.runtime as any).lastError;
        if (_err) { /* normal for fire-and-forget messages */ }
        sendResponse(response);
      });
    });
    return true; // keep channel open for async response
  }

  // Content script → side panel (broadcast to all extension pages)
  if (msg.target === "sidepanel") {
    chrome.runtime.sendMessage(msg).catch(() => {});
  }
});
