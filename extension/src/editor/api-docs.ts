export function renderApiDocs(container: HTMLElement): void {
  container.innerHTML = `<div class="ed-api-docs">
    <h3>api.pluginId / api.ruleId</h3>
    <p>Unique identifier string for this plugin.</p>

    <h3>api.ruleVersion</h3>
    <p>Current version number (increments on each save).</p>

    <h3>api.options</h3>
    <p>Plugin settings object. For catalog plugins, populated from user's settings choices.</p>

    <h3>api.url</h3>
    <p>The page URL when the plugin was injected.</p>

    <h3>api.signal</h3>
    <p><code>AbortSignal</code> that fires when the plugin is cleaned up. Use with <code>fetch()</code> or custom logic.</p>

    <h3>api.log(...args)</h3>
    <p>Logs to console with a <code>[domo vN]</code> prefix.</p>

    <h3>api.onCleanup(fn)</h3>
    <p>Register a function to run when the plugin is removed or updated.</p>

    <h3>api.setInterval(fn, ms)</h3>
    <p>Like <code>setInterval</code> but auto-cleared on cleanup.</p>

    <h3>api.setTimeout(fn, ms)</h3>
    <p>Like <code>setTimeout</code> but auto-cleared on cleanup.</p>

    <h3>api.addEventListener(target, event, handler, opts?)</h3>
    <p>Like <code>target.addEventListener</code> but auto-removed on cleanup. Error-safe handler wrapper.</p>

    <h3>api.waitForSelector(selector, opts?)</h3>
    <p>Returns a Promise&lt;Element|null&gt;. Polls every 100ms, default timeout 4s. Options: <code>{ timeoutMs: number }</code></p>

    <h3>api.updateCSS(css)</h3>
    <p>Persists runtime-generated CSS to storage for early injection on next page load. Does NOT bump version.</p>

    <h3>api.storage</h3>
    <p>Per-plugin localStorage-backed key-value store:</p>
    <p><code>api.storage.get(key)</code> — returns parsed JSON or null</p>
    <p><code>api.storage.set(key, value)</code> — stores as JSON</p>
    <p><code>api.storage.remove(key)</code> — delete a key</p>
    <p><code>api.storage.keys()</code> — list all keys</p>
    <p><code>api.storage.clear()</code> — remove all plugin data</p>

    <h3>api.fetch(url, opts?)</h3>
    <p>Cross-origin fetch via background proxy. Returns <code>{ status, headers, text(), json() }</code>. Options: <code>{ method, headers, body }</code></p>

    <h3>api.require(url)</h3>
    <p>Load an external script. Returns a Promise that resolves when loaded. Script tag is auto-removed on cleanup.</p>
  </div>`;
}
