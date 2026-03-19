# Contributing to Domo

Thank you for your interest in contributing! This guide will help you get started.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** (comes with Node.js)
- **Chrome** (for testing the extension)

## Setup

```bash
git clone https://github.com/billiax/domo.git
cd domo
npm install
npm run build:ext

# Verify everything works
npm run typecheck && npm run test
```

Load the extension: `chrome://extensions` → Developer mode → Load unpacked → select `extension/`

## Development Workflow

```bash
npm run build:ext        # One-time build (content + sidepanel + editor + background)
npm run watch:ext        # Watch + rebuild on changes
npm run typecheck        # TypeScript type checking (no emit)
npm run test             # Run all tests (vitest)
npm run test:watch       # Watch mode tests
npm run test:coverage    # Tests with coverage report
npm run package          # Build + zip for Chrome Web Store
```

## Project Structure

```
extension/src/
  types/        Type definitions (Plugin, Match, StorageSchema, DomoMessage, etc.)
  core/         Data layer: plugins, storage, matching, catalog, migrations
  engine/       Runtime: injector, lifecycle, matcher (Navigation API), observer
  sidepanel/    Side panel UI (tabs: installed, discover, create)
  editor/       Full-tab CodeMirror 6 plugin editor
  tools/        Element picker: picker.ts
  lib/          Shared utilities: constants.ts, dom.ts, selector.ts, utils.ts
  icons.ts      Shared SVG icon module
  content.ts    Content script entry point
  background.ts Service worker entry point
  sidepanel.ts  Side panel entry point
templates/      Plugin definition JSON (bundled into sidepanel.js)
tests/          Unit tests (vitest + happy-dom)
docs/           Documentation
```

## Submitting Issues

- **Bugs:** Use the [bug report template](https://github.com/billiax/domo/issues/new?template=bug_report.yml)
- **Features:** Use the [feature request template](https://github.com/billiax/domo/issues/new?template=feature_request.yml)
- **Security issues:** See [SECURITY.md](SECURITY.md) — do NOT open public issues

## Pull Request Process

1. **Fork** the repository and create a branch from `main`
2. **Branch naming:** `feat/description`, `fix/description`, `docs/description`
3. **Write tests** for any new or changed behavior
4. **Run checks** — `npm run typecheck && npm run test` must pass
5. **Open a PR** against `main` with a clear description
6. Respond to review feedback

### PR Checklist

- [ ] Read this contributing guide
- [ ] Code follows the project style (see below)
- [ ] Tests added/updated for changed behavior
- [ ] `npm run typecheck && npm run test` passes
- [ ] Documentation updated if needed

## Code Style

- **TypeScript strict mode** — no `any` unless unavoidable
- **Named exports only** — no default exports
- **Types in `types/`** directory with per-domain files
- **DOM element IDs:** `__domo_*` prefix
- **Storage keys:** `domo_*` prefix
- **Plugin IDs:** `p_*` prefix
- **Cross-world messaging:** `postMessage` with `{ __domo: true }` flag (never `CustomEvent.detail`)
- **No frameworks** — vanilla DOM manipulation

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(editor): add live preview for CSS changes
fix(engine): handle SPA navigation edge case in lifecycle
docs: update plugin API reference
test: add matching tests for glob patterns
refactor(sidepanel): simplify tab switching logic
```

**Scopes:** `engine`, `editor`, `sidepanel`, `core`, `content`, `background`, `catalog`, `templates`

## Creating Plugin Definitions

See [docs/contributing.md](docs/contributing.md) for a detailed guide on creating plugin definitions for the catalog.

## Testing

- Tests live in `tests/` using vitest + happy-dom
- Chrome API mocks provided for storage, runtime, tabs, etc.
- Test edge cases: URL matching, plugin lifecycle, migrations, export/import
- Run `npm run test:coverage` to check coverage

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
