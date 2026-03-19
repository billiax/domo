# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2025-03-19

### Added

- Full-tab CodeMirror 6 plugin editor with CSS/HTML/JS panes
- Visual match pattern builder supporting 5 match types (site, path, exact, glob, regex)
- Exclude patterns and multi-match (matchAll) with OR logic
- Plugin version history (last 10 snapshots)
- Export/import system with `.domo.json` format and conflict resolution
- Auto-update detection for catalog plugins via `installedDefVersion`
- Plugin fork/duplicate functionality
- Error isolation with auto-disable after 3 consecutive errors
- Per-plugin `api.storage` (localStorage), `api.fetch()` (cross-origin proxy), `api.require()` (script loading)
- SPA anti-flicker: CSS survives navigation, HTML repaired instantly, JS unaffected
- Navigation API-based URL change detection (replaces polling)
- Two-tier MutationObserver: immediate for SPA router detection, debounced for general DOM changes
- Element Hider and Keyboard Shortcuts as system catalog plugins
- Platform detection for GitHub, Jira, YouTube, LinkedIn
- Side panel with Installed, Discover, and Create tabs
- Plugin catalog with bundled definitions and live preview
- GitHub-dark theme with shared SVG icon system
- Auto-save drafts in editor with 2s debounce
- Storage migrations v1 through v4
- CI pipeline with typecheck, test, and build
