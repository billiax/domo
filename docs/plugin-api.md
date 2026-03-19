# Domo Plugin JS API Reference

All plugin JavaScript runs in the MAIN world via `chrome.scripting.executeScript`. An `api` object is injected into the IIFE scope.

## Identity

### `api.pluginId` / `api.ruleId`
- Type: `string`
- Unique plugin identifier (e.g., `"p_1a2b3c4d"`)

### `api.ruleVersion`
- Type: `number`
- Current version number. Increments on each plugin save.

### `api.url`
- Type: `string`
- The page URL at the time the plugin was injected.

### `api.options`
- Type: `Record<string, unknown>`
- Plugin settings object. For catalog plugins, populated from the user's settings choices.

## Lifecycle

### `api.signal`
- Type: `AbortSignal`
- Fires when the plugin is cleaned up (removed, updated, or page unload). Use with `fetch()` or custom logic:
```js
fetch('/api/data', { signal: api.signal }).then(...)
```

### `api.onCleanup(fn)`
- Type: `(fn: () => void) => void`
- Register a function to run when the plugin is cleaned up.

## Timers & Events

### `api.setInterval(fn, ms)`
- Type: `(fn: () => void, ms: number) => number`
- Like `setInterval` but auto-cleared on cleanup.

### `api.setTimeout(fn, ms)`
- Type: `(fn: () => void, ms: number) => number`
- Like `setTimeout` but auto-cleared on cleanup.

### `api.addEventListener(target, event, handler, opts?)`
- Type: `(target: EventTarget, event: string, handler: Function, opts?: object) => void`
- Like `target.addEventListener` but auto-removed on cleanup. Error-safe handler wrapper.

## DOM

### `api.waitForSelector(selector, opts?)`
- Type: `(selector: string, opts?: { timeoutMs?: number }) => Promise<Element | null>`
- Polls every 100ms for an element. Default timeout: 4000ms.

### `api.updateCSS(css)`
- Type: `(css: string) => void`
- Persists runtime-generated CSS to chrome.storage for early injection on next page load. Does NOT bump plugin version (avoids triggering full re-apply).

## Storage

### `api.storage.get(key)`
- Type: `(key: string) => unknown | null`
- Read a value from per-plugin localStorage.

### `api.storage.set(key, value)`
- Type: `(key: string, value: unknown) => void`
- Store a JSON-serializable value.

### `api.storage.remove(key)`
- Type: `(key: string) => void`
- Delete a key.

### `api.storage.keys()`
- Type: `() => string[]`
- List all keys for this plugin.

### `api.storage.clear()`
- Type: `() => void`
- Remove all stored data for this plugin.

## Network

### `api.fetch(url, opts?)`
- Type: `(url: string, opts?: { method?: string, headers?: Record<string, string>, body?: string }) => Promise<{ status: number, headers: Record<string, string>, text(): Promise<string>, json(): Promise<unknown> }>`
- Cross-origin fetch via background service worker proxy. Bypasses CORS restrictions.
- 30 second timeout.

### `api.require(url)`
- Type: `(url: string) => Promise<void>`
- Load an external script tag. Returns a Promise that resolves when loaded. Script is auto-removed on cleanup.

## Logging

### `api.log(...args)`
- Type: `(...args: unknown[]) => void`
- Logs to console with `[domo vN]` prefix.
