export function getEditorStyles(): string {
  return `
/* Unified GitHub-dark palette (matches sidepanel) */
:root {
  --ed-bg: #0d1117;
  --ed-bg-secondary: #161b22;
  --ed-bg-tertiary: #21262d;
  --ed-text: #c9d1d9;
  --ed-text-secondary: #8b949e;
  --ed-text-muted: #484f58;
  --ed-border: #21262d;
  --ed-accent: #58a6ff;
  --ed-accent-hover: #79c0ff;
  --ed-danger: #f85149;
  --ed-success: #3fb950;
  --ed-warning: #d69e22;
  --ed-tab-active: #58a6ff;
  --ed-input-bg: #0d1117;
  --ed-input-border: #30363d;
  --ed-button-bg: #21262d;
  --ed-button-hover: #30363d;
  --ed-shadow-sm: 0 1px 2px rgba(0,0,0,0.12);
  --ed-shadow-md: 0 4px 12px rgba(0,0,0,0.15);
  --ed-transition-fast: 0.12s ease;
  --ed-transition-base: 0.2s ease;
  --ed-focus-shadow: rgba(56,139,253,0.15);
  --ed-pill-green-bg: rgba(35,134,54,0.15);
  --ed-pill-green-text: #3fb950;
  --ed-pill-blue-bg: rgba(56,139,253,0.15);
  --ed-pill-blue-text: #58a6ff;
  --ed-radius-sm: 4px;
  --ed-radius-md: 6px;
  --ed-radius-lg: 8px;
}
[data-theme="light"] {
  --ed-bg: #ffffff;
  --ed-bg-secondary: #f6f8fa;
  --ed-bg-tertiary: #f3f4f6;
  --ed-text: #1f2328;
  --ed-text-secondary: #656d76;
  --ed-text-muted: #8b949e;
  --ed-border: #d0d7de;
  --ed-accent: #0969da;
  --ed-accent-hover: #0550ae;
  --ed-danger: #cf222e;
  --ed-success: #1a7f37;
  --ed-warning: #bf8700;
  --ed-tab-active: #0969da;
  --ed-input-bg: #ffffff;
  --ed-input-border: #d0d7de;
  --ed-button-bg: #f3f4f6;
  --ed-button-hover: #e5e7eb;
  --ed-shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --ed-shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --ed-transition-fast: 0.12s ease;
  --ed-transition-base: 0.2s ease;
  --ed-focus-shadow: rgba(9,105,218,0.2);
  --ed-pill-green-bg: rgba(26,127,55,0.12);
  --ed-pill-green-text: #1a7f37;
  --ed-pill-blue-bg: rgba(9,105,218,0.12);
  --ed-pill-blue-text: #0969da;
  --ed-radius-sm: 4px;
  --ed-radius-md: 6px;
  --ed-radius-lg: 8px;
}

/* System auto — mirrors light values when OS is light */
@media (prefers-color-scheme: light) {
  [data-theme="system"] {
    --ed-bg: #ffffff;
    --ed-bg-secondary: #f6f8fa;
    --ed-bg-tertiary: #f3f4f6;
    --ed-text: #1f2328;
    --ed-text-secondary: #656d76;
    --ed-text-muted: #8b949e;
    --ed-border: #d0d7de;
    --ed-accent: #0969da;
    --ed-accent-hover: #0550ae;
    --ed-danger: #cf222e;
    --ed-success: #1a7f37;
    --ed-warning: #bf8700;
    --ed-tab-active: #0969da;
    --ed-input-bg: #ffffff;
    --ed-input-border: #d0d7de;
    --ed-button-bg: #f3f4f6;
    --ed-button-hover: #e5e7eb;
    --ed-shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
    --ed-shadow-md: 0 4px 12px rgba(0,0,0,0.08);
    --ed-transition-fast: 0.12s ease;
    --ed-transition-base: 0.2s ease;
    --ed-focus-shadow: rgba(9,105,218,0.2);
    --ed-pill-green-bg: rgba(26,127,55,0.12);
    --ed-pill-green-text: #1a7f37;
    --ed-pill-blue-bg: rgba(9,105,218,0.12);
    --ed-pill-blue-text: #0969da;
    --ed-radius-sm: 4px;
    --ed-radius-md: 6px;
    --ed-radius-lg: 8px;
  }
}

/* Animations */
@keyframes ed-spin {
  to { transform: rotate(360deg); }
}

/* Reset & Body */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--ed-bg); color: var(--ed-text);
  height: 100vh; overflow: hidden; -webkit-font-smoothing: antialiased;
}
#editor-root { display: flex; flex-direction: column; height: 100vh; }

/* Toolbar */
.ed-toolbar {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: var(--ed-bg-secondary); border-bottom: 1px solid var(--ed-border);
  flex-shrink: 0; box-shadow: var(--ed-shadow-sm);
}
.ed-toolbar input {
  background: var(--ed-input-bg); border: 1px solid var(--ed-input-border);
  color: var(--ed-text); padding: 5px 10px; border-radius: var(--ed-radius-md);
  font-size: 13px; outline: none; transition: border-color var(--ed-transition-fast);
}
.ed-toolbar input:focus { border-color: var(--ed-accent); box-shadow: 0 0 0 3px var(--ed-focus-shadow); }
.ed-toolbar .ed-name { flex: 1; font-size: 14px; font-weight: 600; }

/* Buttons */
.ed-btn {
  background: var(--ed-button-bg); color: var(--ed-text); border: 1px solid var(--ed-border);
  padding: 5px 14px; border-radius: var(--ed-radius-md); font-size: 12px; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  display: inline-flex; align-items: center; gap: 6px;
  transition: background var(--ed-transition-fast), border-color var(--ed-transition-fast);
}
.ed-btn:hover { background: var(--ed-button-hover); border-color: var(--ed-text-secondary); }
.ed-btn-primary { background: var(--ed-accent); color: #fff; border-color: var(--ed-accent); }
.ed-btn-primary:hover { background: var(--ed-accent-hover); border-color: var(--ed-accent-hover); }
.ed-btn-danger { background: rgba(248,81,73,0.1); color: var(--ed-danger); border-color: var(--ed-danger); }
.ed-btn-danger:hover { background: rgba(248,81,73,0.2); }
.ed-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ed-btn:focus-visible { outline: 2px solid var(--ed-accent); outline-offset: 1px; }

/* Tabs */
.ed-tabs {
  display: flex; gap: 0; background: var(--ed-bg-secondary);
  border-bottom: 1px solid var(--ed-border); flex-shrink: 0;
}
.ed-tab {
  padding: 7px 16px; font-size: 12px; font-weight: 600; cursor: pointer;
  border: none; background: none; color: var(--ed-text-muted);
  border-bottom: 2px solid transparent;
  transition: color var(--ed-transition-fast), border-color var(--ed-transition-fast);
}
.ed-tab:hover { color: var(--ed-text-secondary); }
.ed-tab.active { color: var(--ed-tab-active); border-bottom-color: var(--ed-tab-active); }

/* Layout */
.ed-main { display: flex; flex: 1; overflow: hidden; }
.ed-code-panel { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.ed-code-panel .cm-editor { flex: 1; overflow: auto; }
.ed-code-panel .cm-editor .cm-scroller { overflow: auto; }

/* Preview panel */
.ed-preview-panel {
  width: 360px; border-left: 1px solid var(--ed-border);
  display: flex; flex-direction: column; background: var(--ed-bg-secondary);
}
.ed-preview-panel .ed-panel-header {
  padding: 8px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--ed-text-muted); border-bottom: 1px solid var(--ed-border);
}
.ed-preview-content { flex: 1; overflow: auto; padding: 10px; font-size: 12px; }

/* Console */
.ed-console {
  border-top: 1px solid var(--ed-border); background: var(--ed-bg-tertiary);
  max-height: 200px; overflow: auto; flex-shrink: 0;
}
.ed-console .ed-panel-header {
  padding: 6px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--ed-text-muted); border-bottom: 1px solid var(--ed-border);
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: color var(--ed-transition-fast);
}
.ed-console .ed-panel-header:hover { color: var(--ed-text-secondary); }
.ed-console-entries { padding: 4px 8px; font-family: 'Consolas', 'Fira Code', monospace; font-size: 11px; }
.ed-console-entry { padding: 3px 4px; border-bottom: 1px solid var(--ed-border); color: var(--ed-text-secondary); }
.ed-console-entry.error { color: var(--ed-danger); }
.ed-console-entry.warn { color: var(--ed-warning); }

/* Meta panel */
.ed-meta-panel { padding: 12px; overflow: auto; }
.ed-meta-panel label {
  display: block; font-size: 11px; color: var(--ed-text-muted);
  margin-bottom: 4px; margin-top: 12px; font-weight: 600;
}
.ed-meta-panel label:first-child { margin-top: 0; }
.ed-meta-panel input, .ed-meta-panel select, .ed-meta-panel textarea {
  width: 100%; background: var(--ed-input-bg); border: 1px solid var(--ed-input-border);
  color: var(--ed-text); padding: 6px 10px; border-radius: var(--ed-radius-md);
  font-size: 13px; outline: none; transition: border-color var(--ed-transition-fast);
}
.ed-meta-panel input:focus, .ed-meta-panel select:focus, .ed-meta-panel textarea:focus {
  border-color: var(--ed-accent); box-shadow: 0 0 0 3px var(--ed-focus-shadow);
}

/* Match builder */
.ed-match-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.ed-match-row select { width: auto; flex-shrink: 0; }
.ed-match-row input { flex: 1; }
.ed-match-row .ed-btn { padding: 4px 8px; flex-shrink: 0; }

/* Sections */
.ed-section { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--ed-border); }
.ed-section-title {
  font-size: 11px; font-weight: 600; color: var(--ed-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
}

/* API docs */
.ed-api-docs { padding: 12px; overflow: auto; font-size: 12px; line-height: 1.6; }
.ed-api-docs h3 { font-size: 13px; color: var(--ed-accent); margin-top: 14px; margin-bottom: 4px; }
.ed-api-docs h3:first-child { margin-top: 0; }
.ed-api-docs code { background: var(--ed-button-bg); padding: 1px 5px; border-radius: 3px; font-size: 11px; }
.ed-api-docs p { color: var(--ed-text-secondary); margin-bottom: 6px; }

/* Toast */
.ed-toast {
  position: fixed; bottom: 16px; right: 16px;
  padding: 8px 16px; border-radius: var(--ed-radius-md);
  font-size: 13px; font-weight: 600; z-index: 9999;
  opacity: 0; transform: translateY(8px);
  transition: opacity var(--ed-transition-base), transform var(--ed-transition-base);
  box-shadow: var(--ed-shadow-md);
}
.ed-toast.show { opacity: 1; transform: translateY(0); }
.ed-toast:not(.error) { background: var(--ed-pill-green-bg); color: var(--ed-pill-green-text); border: 1px solid var(--ed-pill-green-text); }
.ed-toast.error { background: rgba(248,81,73,0.15); color: var(--ed-danger); border: 1px solid var(--ed-danger); }

/* Utilities */
.ed-hidden { display: none !important; }
.ed-runAt-warn { font-size: 11px; color: var(--ed-warning); margin-top: 4px; padding: 4px 8px; background: rgba(214,158,34,0.1); border-radius: var(--ed-radius-sm); }

/* Icon system (shared with sidepanel) */
.domo-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex-shrink: 0; }
.domo-icon svg { width: 100%; height: 100%; }
.domo-icon-sm { width: 12px; height: 12px; }
.domo-icon-lg { width: 20px; height: 20px; }

/* Focus rings */
.ed-toolbar input:focus-visible, .ed-meta-panel input:focus-visible, .ed-meta-panel select:focus-visible, .ed-meta-panel textarea:focus-visible { outline: 2px solid var(--ed-accent); outline-offset: 1px; }
`;
}
