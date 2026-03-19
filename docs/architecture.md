# Architecture

All source lives in `extension/src/` as TypeScript, compiled by **esbuild** (not tsc).

## Entry Points

| Entry | Output | Format | Notes |
|---|---|---|---|
| `content.ts` | `extension/dist/content.js` | Bundled IIFE | Injected into pages |
| `sidepanel.ts` | `extension/dist/sidepanel.js` | Bundled IIFE | Side panel UI |
| `editor.ts` | `extension/dist/editor.js` | Bundled IIFE | Full-tab plugin editor (CodeMirror 6) |
| `background.ts` | `extension/background.js` | ESM (type-strip only) | Service worker, NOT bundled |

## Directory Structure

```
extension/src/
  types/        Type definitions (Plugin, Match, StorageSchema, DomoMessage, etc.)
  core/         Data layer: plugins.ts (CRUD), storage.ts (settings),
                matching.ts (URL matching), catalog.ts (definition resolution),
                platforms.ts (platform detection), messaging.ts, migrations.ts,
                transfer.ts (export/import), updates.ts (auto-update)
  engine/       Runtime: injector.ts, lifecycle.ts (PluginEngine),
                matcher.ts (Navigation API), observer.ts (MutationObserver)
  tools/        Element picker: picker.ts
  lib/          Shared utilities: constants.ts, dom.ts, selector.ts, utils.ts
  sidepanel/    UI: layout.ts (TabLayout), state.ts (reactive store),
                tabs/ (installed, discover, create), settings.ts, templates.ts
  editor/       Full-tab editor: app.ts, code-editor.ts (CodeMirror 6),
                match-builder.ts, console-panel.ts, api-docs.ts, drafts.ts
  icons.ts      Shared SVG icon module
templates/      Plugin definition JSON files (bundled into sidepanel.js)
  github/       GitHub plugins (toolbar, dashboard, cleanup, tweaks)
  jira/         Jira plugins (card-colors, cleanup, compact-board)
  system/       System plugins (element hider, keyboard shortcuts)
```

## Storage Schema (v4)

All data in `chrome.storage.local` with prefixed keys:

```
domo_plugins        Plugin instances with resolved code + original definition
domo_settings       Registry URL, theme, UI state
domo_version        Schema version (currently 4)
domo_catalog_cache  Cached catalog data
```

A migration system handles schema upgrades: v1->v2 (rules to plugins), v2->v3 (hiders to system plugin), v3->v4 (glob/regex/exclude/history support).

## URL Matching

Plugins match URLs by specificity, then by priority:

| Match Type | Specificity |
|---|---|
| Exact URL | 3000 |
| Path prefix | 2000 + path length |
| Glob pattern | 1500 |
| Regex pattern | 1500 |
| Site (host) | 1000 |

Multiple plugins can match the same URL. Higher specificity wins; ties broken by `priority` (ascending). Plugins can define `exclude` patterns (checked first, early exit) and `matchAll` arrays (OR logic across multiple patterns).

## SPA Support

URL changes are detected instantly via the Navigation API and `webNavigation.onHistoryStateUpdated`. A two-tier MutationObserver handles DOM changes: immediate callback when injected elements are destroyed (SPA body wipes), plus a debounced (300ms) callback for general DOM mutations. No polling.

CSS `<style>` tags in `<head>` survive SPA navigation (routers only replace `<body>`). HTML containers in `<body>` get destroyed and are automatically repaired. JS lives in MAIN world heap, unaffected by DOM changes.

## JS Injection

Plugin JS runs in the **MAIN world** via `chrome.scripting.executeScript`, not the content script world. Each plugin's JS is wrapped in an IIFE with an `api` object providing lifecycle controls, storage, networking, and DOM utilities.

See [Plugin API Reference](plugin-api.md) for the full `api` object documentation.

## Plugin Definitions

Catalog plugins are JSON files in `templates/`, bundled into `sidepanel.js` via esbuild JSON imports. They support conditional blocks for CSS/HTML:

```
{{#key}}...{{/key}}          Conditional on truthy value
{{#key=value}}...{{/key}}    Conditional on specific value
```

JS uses `api.options` at runtime instead of template substitution.

See [Creating Plugin Definitions](contributing.md) for the full authoring guide.
