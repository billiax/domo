<p align="center">
  <img src="extension/icons/icon-128.png" width="80" height="80" alt="Domo">
</p>

<h1 align="center">Domo</h1>

<p align="center">
  Personalize any website with CSS, HTML, and JS plugins — per URL, instantly.
</p>

<p align="center">
  <a href="https://github.com/billiax/domo/actions/workflows/ci.yml"><img src="https://github.com/billiax/domo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6.svg" alt="TypeScript: strict">
  <img src="https://img.shields.io/badge/Chrome-MV3-4285f4.svg" alt="Chrome MV3">
</p>

---

<!-- TODO: Add a screenshot or GIF demo here -->
<!-- <p align="center"><img src="docs/assets/demo.gif" width="720" alt="Domo in action"></p> -->

## What is Domo?

A Chrome extension that lets you inject custom CSS, HTML, and JavaScript into any web page. Plugins match URLs by pattern and run automatically — no dev tools needed.

- **Install from the catalog** — bundled plugins for GitHub, Jira, and more
- **Create your own** — full-tab editor with CodeMirror 6, live preview, and visual URL matcher
- **SPA-aware** — instant detection via Navigation API, no polling, zero flicker
- **No backend** — everything runs locally in your browser

## Install

<!-- TODO: Uncomment when published to Chrome Web Store -->
<!-- **Chrome Web Store:** [Install Domo](https://chrome.google.com/webstore/detail/domo/EXTENSION_ID) -->

**From source:**

```bash
git clone https://github.com/billiax/domo.git
cd domo && npm install
npm run build:ext
```

Then: `chrome://extensions` → Developer mode → Load unpacked → select `extension/`

## Features

- **Plugin catalog** — 7 bundled plugins (GitHub, Jira) + 2 system plugins (Element Hider, Keyboard Shortcuts)
- **5 URL match types** — site, path, exact, glob, regex — with exclude patterns and multi-match
- **Full-tab editor** — CodeMirror 6 with CSS/HTML/JS panes, match builder, console, API docs
- **Plugin JS API** — lifecycle signals, auto-cleanup timers, per-plugin storage, cross-origin fetch, script loading
- **Export/import** — `.domo.json` format with conflict resolution (skip/replace/duplicate)
- **Version history** — last 10 snapshots per plugin, auto-update detection for catalog plugins
- **Platform detection** — GitHub, Jira, YouTube, LinkedIn
- **Element hider** — visual picker (Alt+H) to hide any element on any page
- **Themes** — system, light, dark

## Development

```bash
npm run build:ext        # Build all entry points
npm run watch:ext        # Watch + rebuild
npm run typecheck        # Type-check (tsc --noEmit)
npm run test             # Run tests (vitest)
npm run test:watch       # Watch mode tests
npm run package          # Build + zip for Chrome Web Store
```

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | Entry points, directory structure, storage schema, matching, SPA support |
| [Plugin API](docs/plugin-api.md) | Full `api.*` reference for plugin JavaScript |
| [Creating Plugins](docs/contributing.md) | How to write plugin definitions for the catalog |
| [Contributing](CONTRIBUTING.md) | Setup, PR process, code style, testing |
| [Security](SECURITY.md) | Vulnerability reporting policy |
| [Privacy Policy](docs/privacy-policy.md) | Data handling and permissions |
| [Changelog](CHANGELOG.md) | Release history |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## License

[MIT](LICENSE)
