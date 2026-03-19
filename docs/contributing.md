# Creating Plugin Definitions

This guide covers how to create plugin definitions for the Domo catalog. For general contribution guidelines (setup, PR process, code style), see the root [CONTRIBUTING.md](../CONTRIBUTING.md).

## Template Structure

Plugin definitions are JSON files in `templates/`. They're bundled into the sidepanel at build time.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "What it does",
  "author": "Your Name",
  "version": "1.0.0",
  "platform": "github",
  "tags": ["cleanup", "productivity"],
  "match": { "type": "site", "host": "github.com" },
  "options": {
    "featureX": { "type": "boolean", "label": "Enable Feature X", "default": true }
  },
  "code": {
    "css": "/* CSS here */",
    "html": "<!-- HTML here -->",
    "js": "// JS here — uses api.* object"
  }
}
```

## Conditional Blocks

CSS and HTML support conditional blocks based on options:

```css
{{#featureX}}
.sidebar { display: none; }
{{/featureX}}

{{#theme=dark}}
body { background: #000; }
{{/theme=dark}}
```

JS uses `api.options` at runtime instead.

## File Organization

```
templates/
  github/        # GitHub-specific plugins
  jira/          # Jira-specific plugins
  system/        # System plugins (hider, shortcuts)
  registry.json  # Catalog registry metadata
```

## Testing Locally

1. Create your JSON file in `templates/<platform>/`
2. If using `npm run watch:ext`, templates auto-reload in the sidepanel
3. Go to Discover tab -> find your plugin -> Install
4. Edit via the full-tab editor for iteration

## Plugin JS API

Plugins that include JavaScript get access to an `api` object with lifecycle management, storage, network, and DOM utilities. See [plugin-api.md](plugin-api.md) for the full API reference.

## Key Architecture Context

For reference, plugin definitions interact with these parts of the codebase:

- `extension/src/core/catalog.ts` -- Definition resolution, bundled definition access, install/update
- `extension/src/core/matching.ts` -- URL matching logic (site, path, exact, glob, regex)
- `extension/src/core/plugins.ts` -- Plugin CRUD, version history
- `extension/src/engine/` -- DOM injection and lifecycle (injector, lifecycle, matcher, observer)
- `extension/src/sidepanel/tabs/discover.ts` -- Catalog browser UI (list/detail view, install)
