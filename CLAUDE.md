# Domo

Community-driven plugin platform for per-URL web personalization via CSS/HTML/JS injection.

## Quick Start

```bash
npm run build:ext    # One-time bundle (content + sidepanel + editor + background)
npm run watch:ext    # Watch + bundle all four entry points
npm run typecheck    # Type-check with tsc (no emit)
npm run test         # Run vitest test suite
npm run test:watch   # Watch mode tests
npm run package      # Build + zip for Chrome Web Store
```

Load extension: `chrome://extensions` → Developer mode → Load unpacked → select `extension/`

## Architecture

```
Extension → chrome.storage.local (self-contained, event-driven)
```

### Extension (Chrome MV3) — Self-Contained, TypeScript

All source in `extension/src/` as TypeScript. All data stored in `chrome.storage.local` with prefixed keys: `domo_plugins`, `domo_settings`, `domo_version`, `domo_catalog_cache`.

**Type definitions** (`extension/src/types/`):
- `plugin.ts` — Plugin, PluginDefinition, PluginMeta, PluginVersion, Match (discriminated union: site|path|exact|glob|regex), PluginCode, Scope, PluginSource, PluginOptionDef
- `storage.ts` — StorageSchema, Settings (incl. githubToken, lastScope, discoverSort, onboardingDone), CatalogCache, HiderSelector/HiderEntry (legacy, unused)
- `messages.ts` — DomoMessage discriminated union (Content/Sidepanel/Background bound), OpenFloatingPanel/CloseFloatingPanel, ProxyFetch, PluginError, OpenEditor, PreviewJS, EditorConsole
- `engine.ts` — SyncState, AppliedPlugin, CleanupHandle, PluginError, InjectionResult
- `transfer.ts` — ExportedPlugin, ExportedPluginData, ExportedBackup (export/import format)
- `platform.ts` — PlatformInfo
- `global.d.ts` — `__DEV_MODE__` build constant, Navigation API types, Window augmentation (`__domo_rules__`)

**Core modules** (`extension/src/core/`):
- `plugins.ts` — Plugin CRUD (getAllPlugins, getPlugin, upsertPlugin, deletePlugin, togglePlugin, forkPlugin, validatePlugin). Version history snapshots (last 10). Uses storage mutex for write safety.
- `storage.ts` — Settings, catalog cache, storage version. No plugin or hider CRUD.
- `matching.ts` — Pure plugin matching functions. Supports 5 match types: site, path, exact, glob, regex. `pluginMatchesUrl()` handles exclude-first + matchAll OR logic. Regex cache (cap 200). Zero I/O.
- `catalog.ts` — Plugin definition resolution, bundled definition access, install/update. Stores `_definition` and `installedDefVersion` on install. Imports template JSON via esbuild.
- `platforms.ts` — Known platform registry (GitHub, Jira, YouTube, LinkedIn). detectPlatform(), getPlatformInfo(), getPlatformLabel(), getAllPlatforms(). Handles glob host extraction.
- `messaging.ts` — Typed send/listen wrappers for chrome.runtime messaging. Dev-mode error logging.
- `migrations.ts` — Storage version tracking and migration runner. v1→v2: rules→plugins. v2→v3: hiders→system plugins. v3→v4: glob/regex/exclude/history support (no-op data, new fields optional).
- `transfer.ts` — Export/import system. `exportPlugin()`, `exportAllPlugins()`, `importPlugin()`, `importFromUrl()`, `validateImport()`, `pluginToClipboard()`. Supports `.domo.json` format with conflict resolution (skip/replace/duplicate).
- `updates.ts` — Auto-update system. `checkForUpdates()` compares `installedDefVersion` vs bundled. `updatePlugin()`, `updateAllPlugins()`. Respects `modified` flag.

**Engine layer** (`extension/src/engine/`):
- `injector.ts` — CSS/HTML/JS injection + cleanup with per-plugin error isolation. `isDomIntact()` checks if DOM elements survived SPA nav. `repairPlugin()` re-creates CSS/HTML without touching JS.
- `matcher.ts` — Navigation API-based URL change detection (replaces 900ms polling).
- `observer.ts` — Two-tier MutationObserver: immediate callback when our injected elements are destroyed (SPA router detection), debounced (300ms) for general DOM changes.
- `lifecycle.ts` — PluginEngine class with sync state machine (idle→syncing→pending). `repairAllDom()` for instant DOM repair without storage reads. `sync()` verifies DOM presence on version-match skip and updates CSS content in place. Matching cache (URL + storage version). `PluginError` collection (last 5 per plugin). Auto-disable after 3 consecutive errors. Uses `pluginMatchesUrl` for exclude/matchAll support.

**Shared modules** (`extension/src/lib/`):
- `constants.ts` — CSS_ID_PREFIX, DATA_ATTR, and other shared constants.
- `utils.ts` — Utility functions (sleep, etc.).
- `selector.ts` — CSS selector computation from DOM elements.
- `dom.ts` — DOM utility helpers.

**Icons** (`extension/src/icons.ts`) — Shared SVG icon module, provides `icon(name)` function for consistent iconography across sidepanel and editor.

**Tools** (`extension/src/tools/`):
- `picker.ts` — Element picker with visual feedback.

**Content script** — Runs at `document_start`. Phase 1: early CSS injection from `chrome.storage` for all matching plugins (generic, no plugin-specific code), plus immediate injection of `document_start` JS plugins. Phase 2: listens for `domo:updateCSS` and `domo:proxyFetch` and `domo:pluginError` postMessages from MAIN world. Phase 3: full engine init after `document.body` (runs migrations, legacy cleanup, engine init). Note: `domo:command`, `domo:openPanel`, `domo:closePanel` are dispatched directly in MAIN world by the background via `chrome.scripting.executeScript`, not by the content script.

**Side panel** (not popup) — 3 tabs: Installed, Discover, Create. Header with theme toggle and settings button. Auto-installs system plugins (hider, shortcuts) on first run.
- `sidepanel.ts` — Entry point, 3-tab wiring, centralized message listener, theme toggle, settings button. Syncs on browser tab switch via `chrome.tabs.onActivated`/`onUpdated`. Dev mode: auto-reloads templates on disk changes.
- `sidepanel/layout.ts` — TabLayout class (3 tabs with badges, sliding indicator).
- `sidepanel/state.ts` — Shared reactive state store with subscribe/reload.
- `sidepanel/tabs/installed.ts` — Plugins grouped by platform, toggle switches, active indicators.
- `sidepanel/tabs/discover.ts` — Plugin catalog browser (list/detail view, platform filters, preview, install).
- `sidepanel/tabs/create.ts` — Manual plugin creation with scope selector and template picker (Blank, CSS Only, DOM Watcher, Keyboard Shortcut, Periodic Check, Custom Panel). Opens full editor on create.
- `sidepanel/shared.ts` — Utilities: getPageInfo, getCachedPageInfo, setCachedPageInfo, esc, triggerSync, showOverflowMenu, showConfirm, showToast, setButtonLoading, formatMatchInfo.
- `sidepanel/settings.ts` — Slide-in settings panel (registry URL, GitHub token, theme).
- `sidepanel/templates.ts` — Plugin template definitions for the Create tab.
- `sidepanel/styles.ts` — All CSS (theme vars, tab bar, platform groups, plugin cards, toggle switches, settings panel).

**Background** (`extension/src/background.ts`) — Compiled by esbuild (type-strip only, NOT bundled). Relays messages, handles `Alt+H` shortcut, handles JS injection via `chrome.scripting.executeScript({ world: "MAIN" })`, handles `webNavigation.onHistoryStateUpdated` for SPA detection, handles `cleanupJS` messages. On `onInstalled`: injects content script into all existing http/https tabs (content scripts don't auto-inject into pre-existing tabs).

**Full-tab editor** (`extension/src/editor/`) — CodeMirror 6-based plugin editor opened in a new tab. Modules: `app.ts` (main controller), `code-editor.ts` (3 CodeMirror instances for CSS/HTML/JS), `match-builder.ts` (visual match pattern builder with all 5 types), `console-panel.ts`, `api-docs.ts`, `styles.ts`, `drafts.ts` (auto-save to chrome.storage with 2s debounce).

**JS injection lifecycle**: Content script sends `{ type: "injectJS", ruleId, ruleVersion, options, jsCode }` to background, which wraps it in an IIFE with the `api` object including `signal`, `onCleanup()`, `setInterval()`, `setTimeout()`, `addEventListener()` (auto-cleanup variants), `pluginId` (alias for `ruleId`), `updateCSS(css)`, `storage` (per-plugin localStorage), `fetch()` (cross-origin proxy), `require()` (script loading), `waitForSelector()`, `log()`, `track()` (no-op, legacy). 30s init timeout. Cleanup via `{ type: "cleanupJS", ruleId }` aborts the rule's AbortController.

**Cross-world communication**: All ISOLATED↔MAIN world messaging uses `window.postMessage` with `{ __domo: true }` flag — NOT `CustomEvent.detail`. Chrome's content script isolation makes `CustomEvent.detail` null when accessed across JS worlds. The background dispatches `domo:command`, `domo:openPanel`, `domo:closePanel` directly in MAIN world via `chrome.scripting.executeScript`. Plugin JS sends `domo:updateCSS` via `postMessage` to the content script.

### Plugin Matching

Plugins match URLs by specificity: `exact` (3000) > `path` (2000+len) > `glob` (1500) > `regex` (1500) > `site` (1000) > `global` (500), then by `priority` (ascending). Multiple plugins can match the same URL. `pluginMatchesUrl()` checks excludes first (early exit), then primary match, then `matchAll[]` (OR logic). When `matchAll` matches, highest specificity among all matching patterns is used.

### Plugin Definitions (Catalog)

JSON files in `templates/` bundled into sidepanel.js via esbuild JSON imports. Conditional blocks: `{{#key}}...{{/key}}` and `{{#key=value}}...{{/key=value}}`. Works for CSS/HTML only. JS uses `api.options` at runtime.

Catalog plugins store resolved code + `_definition` (full original) in chrome.storage for re-resolution on settings changes.

### Storage Schema

```typescript
{
  domo_plugins: {
    "p_XXXXX": {
      id, match, matchAll?, exclude?,
      name, description, platform,
      source, definitionId, enabled, priority,
      version, settings, modified?, runAt?,
      installedDefVersion?, lastUpdateCheck?,
      code: { css, html, js },
      _definition: { ... },          // Full original definition (for re-resolution)
      _history?: PluginVersion[],    // Last 10 versions (most recent first)
      contextMeta, createdAt, updatedAt
    },
    "p_YYYYY": {                         // Element Hider (auto-installed from catalog)
      source: "catalog", definitionId: "system-hider",
      match: { type: "site", host: "*" },
      code: { js: "..." }                // Hider logic uses localStorage for per-site selectors
    },
    "p_ZZZZZ": {                         // Keyboard Shortcuts (auto-installed from catalog)
      source: "catalog", definitionId: "system-shortcuts",
      match: { type: "site", host: "*" },
      code: { js: "..." }                // Shortcuts logic uses localStorage for per-site bindings
    }
  },
  domo_settings: {
    registryUrl: "...",
    theme?: "system" | "light" | "dark",
    githubToken?: string,
    lastScope?: string,
    collapsedSections?: string[],
    discoverSort?: string,
    onboardingDone?: boolean
  },
  domo_version: 4,               // Storage schema version for migrations
  domo_catalog_cache: { data, timestamp }
}
```

## Terminology

| Concept | Type | Storage Key |
|---|---|---|
| Installed instance | Plugin | `domo_plugins` |
| Catalog entry | PluginDefinition | bundled JSON / remote |
| Catalog metadata | PluginMeta | `domo_catalog_cache` |
| Source types | "user" \| "catalog" \| "system" \| "ai" (legacy, migration only) | `plugin.source` |

**MAIN world plumbing (unchanged):** `__domo_rules__` on Window, `ruleId` in InjectJS/CleanupJS messages, `api.ruleId` in injected JS.

## Build

TypeScript compiled by esbuild (not tsc). `tsc --noEmit` for type checking only.

esbuild bundles four entry points:
- `extension/src/content.ts` → `extension/dist/content.js` (bundled IIFE)
- `extension/src/sidepanel.ts` → `extension/dist/sidepanel.js` (bundled IIFE)
- `extension/src/editor.ts` → `extension/dist/editor.js` (bundled IIFE, includes CodeMirror 6)
- `extension/src/background.ts` → `extension/background.js` (NOT bundled, ESM, type-strip only)

Format: IIFE (content/sidepanel/editor), ESM (background). Target: Chrome 120+. Production: minified + linked sourcemaps.

**Import chain isolation**: `content.ts` imports `core/plugins.ts` + `core/matching.ts` but NOT `core/catalog.ts`, so template JSON data is only bundled into `sidepanel.js`.

## Important Notes

- `extension/dist/` is gitignored — must build before loading extension.
- Generated JS runs in MAIN world via `chrome.scripting.executeScript` (not content script world).
- `api.onCleanup(fn)` registers cleanup functions called when plugin is removed/updated.
- `api.setInterval`/`api.setTimeout`/`api.addEventListener` auto-register cleanup.
- `api.signal` is an AbortSignal that fires when the plugin is cleaned up.
- `api.pluginId` is an alias for `api.ruleId` in injected JS.
- `extension/background.js` is compiled from `src/background.ts` — NOT bundled, just type-stripped.
- DOM element IDs use `__domo_*` prefix (migrated from `__myapp_personalizer_*`). Legacy cleanup runs on startup.
- `webNavigation` permission added for SPA navigation detection.
- Migration v1→v2 converts old `domo_rules` (r_* IDs) to `domo_plugins` (p_* IDs) and renames `domo_registry_cache` to `domo_catalog_cache`.
- Migration v2→v3 removes legacy `domo_hiders` and `domo_features` keys, cleans up old system plugins. Hiders now managed by the Element Hider plugin via localStorage.
- Migration v3→v4 adds glob/regex match types, exclude patterns, multi-match, plugin history support. No-op data transformation (all new fields optional).
- **SPA anti-flicker design**: CSS `<style>` tags in `<head>` survive SPA navigation (routers only replace `<body>`). HTML containers in `<body>` get destroyed. The engine detects this via MutationObserver (immediate, not debounced) and `isDomIntact()` checks, then re-creates HTML without restarting JS. JS lives in MAIN world heap, unaffected by DOM changes.
- **updateCSS does not bump version**: `api.updateCSS()` persists CSS to storage for early injection but does NOT increment `plugin.version`. This prevents storage change → sync → full cleanup+re-apply cycles that would destroy running JS and cause flicker.
- **URL matching**: 5 match types (site, path, exact, glob, regex) with exclude patterns and matchAll OR logic. Glob: `*` = segment, `**` = any depth. Regex: cached compilations (cap 200).
- **Security**: PostMessage origin validation (`e.origin !== location.origin`), storage data validation (`validatePlugin()`), 30s plugin init timeout.
- **Plugin lifecycle**: Version history (last 10), fork/duplicate, modified flag for catalog plugins, auto-update detection via `installedDefVersion`.
- **JS API**: `api.storage` (per-plugin localStorage), `api.fetch()` (cross-origin proxy via background), `api.require()` (script loading), `api.waitForSelector()`, `api.log()`, `runAt: "document_start"` support.
- **Error handling**: PluginError model with phase/message/stack. Auto-disable after 3 consecutive errors. Error badges in sidepanel.
- **Export/Import**: `.domo.json` format with single/backup modes, conflict resolution (skip/replace/duplicate).
- **Full-tab editor**: CodeMirror 6, visual match pattern builder, live preview, auto-save drafts, API docs panel.
- **Testing**: Vitest + happy-dom, Chrome API mocks, 70+ tests covering matching, plugins, migrations. CI via GitHub Actions.
- **Production build**: Minified + linked sourcemaps. Packaging script for CWS zip. Version bump script syncs package.json + manifest.json.
