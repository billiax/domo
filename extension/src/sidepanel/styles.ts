export function getStyles() {
  return `
/* Dark (default) */
:root, [data-theme="dark"] {
  --domo-bg-body: #0d1117;
  --domo-bg-card: #161b22;
  --domo-bg-btn: #21262d;
  --domo-bg-btn-hover: #30363d;
  --domo-bg-primary: #238636;
  --domo-bg-primary-hover: #2ea043;
  --domo-bg-danger: rgba(248,81,73,0.1);
  --domo-bg-danger-hover: rgba(248,81,73,0.2);
  --domo-text-primary: #c9d1d9;
  --domo-text-heading: #e6edf3;
  --domo-text-secondary: #8b949e;
  --domo-text-dim: #484f58;
  --domo-text-accent: #58a6ff;
  --domo-text-danger: #f85149;
  --domo-border-default: #21262d;
  --domo-border-muted: #30363d;
  --domo-border-accent: #58a6ff;
  --domo-border-danger: #da3633;
  --domo-focus-shadow: rgba(56,139,253,0.15);
  --domo-pill-green-bg: rgba(35,134,54,0.15);
  --domo-pill-green-text: #3fb950;
  --domo-pill-red-bg: rgba(248,81,73,0.15);
  --domo-pill-red-text: #f85149;
  --domo-pill-blue-bg: rgba(56,139,253,0.15);
  --domo-pill-blue-text: #58a6ff;
  --domo-pill-purple-bg: rgba(136,98,217,0.15);
  --domo-pill-purple-text: #a371f7;
  --domo-code-text: #79c0ff;
  --domo-code-bg: rgba(56,139,253,0.1);
  --domo-shadow-sm: 0 1px 2px rgba(0,0,0,0.12);
  --domo-shadow-md: 0 4px 12px rgba(0,0,0,0.15);
  --domo-shadow-lg: 0 8px 24px rgba(0,0,0,0.2);
  --domo-shadow-card-hover: 0 2px 8px rgba(0,0,0,0.12);
  --domo-transition-fast: 0.12s ease;
  --domo-transition-base: 0.2s ease;
  --domo-transition-slow: 0.3s ease-out;
  --domo-bg-elevated: #1c2128;
  --domo-bg-overlay: #2d333b;
  --domo-radius-sm: 4px;
  --domo-radius-md: 6px;
  --domo-radius-lg: 8px;
  --domo-radius-xl: 12px;
  --domo-overlay-bg: rgba(0,0,0,0.5);
}

/* Light */
[data-theme="light"] {
  --domo-bg-body: #ffffff;
  --domo-bg-card: #f6f8fa;
  --domo-bg-btn: #f3f4f6;
  --domo-bg-btn-hover: #e5e7eb;
  --domo-bg-primary: #1a7f37;
  --domo-bg-primary-hover: #1a9a3e;
  --domo-bg-danger: rgba(207,34,46,0.08);
  --domo-bg-danger-hover: rgba(207,34,46,0.15);
  --domo-text-primary: #1f2328;
  --domo-text-heading: #1f2328;
  --domo-text-secondary: #656d76;
  --domo-text-dim: #8b949e;
  --domo-text-accent: #0969da;
  --domo-text-danger: #cf222e;
  --domo-border-default: #d0d7de;
  --domo-border-muted: #d0d7de;
  --domo-border-accent: #0969da;
  --domo-border-danger: #cf222e;
  --domo-focus-shadow: rgba(9,105,218,0.2);
  --domo-pill-green-bg: rgba(26,127,55,0.12);
  --domo-pill-green-text: #1a7f37;
  --domo-pill-red-bg: rgba(207,34,46,0.12);
  --domo-pill-red-text: #cf222e;
  --domo-pill-blue-bg: rgba(9,105,218,0.12);
  --domo-pill-blue-text: #0969da;
  --domo-pill-purple-bg: rgba(130,80,223,0.12);
  --domo-pill-purple-text: #8250df;
  --domo-code-text: #0550ae;
  --domo-code-bg: rgba(9,105,218,0.08);
  --domo-shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --domo-shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --domo-shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --domo-shadow-card-hover: 0 2px 8px rgba(0,0,0,0.08);
  --domo-transition-fast: 0.12s ease;
  --domo-transition-base: 0.2s ease;
  --domo-transition-slow: 0.3s ease-out;
  --domo-bg-elevated: #f0f2f5;
  --domo-bg-overlay: #ffffff;
  --domo-radius-sm: 4px;
  --domo-radius-md: 6px;
  --domo-radius-lg: 8px;
  --domo-radius-xl: 12px;
  --domo-overlay-bg: rgba(0,0,0,0.5);
}

/* System auto */
@media (prefers-color-scheme: light) {
  [data-theme="system"] {
    --domo-bg-body: #ffffff;
    --domo-bg-card: #f6f8fa;
    --domo-bg-btn: #f3f4f6;
    --domo-bg-btn-hover: #e5e7eb;
    --domo-bg-primary: #1a7f37;
    --domo-bg-primary-hover: #1a9a3e;
    --domo-bg-danger: rgba(207,34,46,0.08);
    --domo-bg-danger-hover: rgba(207,34,46,0.15);
    --domo-text-primary: #1f2328;
    --domo-text-heading: #1f2328;
    --domo-text-secondary: #656d76;
    --domo-text-dim: #8b949e;
    --domo-text-accent: #0969da;
    --domo-text-danger: #cf222e;
    --domo-border-default: #d0d7de;
    --domo-border-muted: #d0d7de;
    --domo-border-accent: #0969da;
    --domo-border-danger: #cf222e;
    --domo-focus-shadow: rgba(9,105,218,0.2);
    --domo-pill-green-bg: rgba(26,127,55,0.12);
    --domo-pill-green-text: #1a7f37;
    --domo-pill-red-bg: rgba(207,34,46,0.12);
    --domo-pill-red-text: #cf222e;
    --domo-pill-blue-bg: rgba(9,105,218,0.12);
    --domo-pill-blue-text: #0969da;
    --domo-pill-purple-bg: rgba(130,80,223,0.12);
    --domo-pill-purple-text: #8250df;
    --domo-code-text: #0550ae;
    --domo-code-bg: rgba(9,105,218,0.08);
    --domo-shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
    --domo-shadow-md: 0 4px 12px rgba(0,0,0,0.08);
    --domo-shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
    --domo-shadow-card-hover: 0 2px 8px rgba(0,0,0,0.08);
    --domo-transition-fast: 0.12s ease;
    --domo-transition-base: 0.2s ease;
    --domo-transition-slow: 0.3s ease-out;
    --domo-bg-elevated: #f0f2f5;
    --domo-bg-overlay: #ffffff;
    --domo-radius-sm: 4px;
    --domo-radius-md: 6px;
    --domo-radius-lg: 8px;
    --domo-radius-xl: 12px;
    --domo-overlay-bg: rgba(0,0,0,0.5);
  }
}

/* Animations */
@keyframes domo-dialog-in {
  from { opacity: 0; transform: scale(0.95) translateY(4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes domo-spin {
  to { transform: rotate(360deg); }
}

/* Reset & Body */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--domo-bg-body);
  color: var(--domo-text-primary);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
#app { padding: 16px; }

/* ── Header ── */
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 8px; border-bottom: 1px solid var(--domo-border-default); margin-bottom: 4px;
}
.header h1 { font-size: 16px; font-weight: 700; color: var(--domo-text-heading); }
.header-actions { display: flex; align-items: center; gap: 4px; }
.page-info-bar {
  font-size: 10px; color: var(--domo-text-dim); padding: 2px 0 8px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── Icons ── */
.domo-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex-shrink: 0; }
.domo-icon svg { width: 100%; height: 100%; }
.domo-icon-sm { width: 12px; height: 12px; }
.domo-icon-lg { width: 20px; height: 20px; }
.domo-icon-xl { width: 48px; height: 48px; }

/* ── Tab bar ── */
.tab-bar {
  position: relative;
  display: flex; gap: 0; border-bottom: 1px solid var(--domo-border-default); margin-bottom: 14px;
}
.tab-btn {
  flex: 1; padding: 8px 4px; border: none; background: none; color: var(--domo-text-secondary);
  font: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
  border-bottom: 2px solid transparent; transition: color var(--domo-transition-fast);
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.tab-btn:hover { color: var(--domo-text-primary); }
.tab-btn.active { color: var(--domo-text-accent); border-bottom-color: transparent; }
.tab-indicator {
  position: absolute; bottom: 0; height: 2px; background: var(--domo-text-accent);
  transition: transform var(--domo-transition-base), width var(--domo-transition-base);
}
.tab-content { }

/* Tab badges */
.tab-badge { display:inline-flex; align-items:center; justify-content:center; min-width:16px; height:16px; padding:0 4px; border-radius:8px; font-size:9px; font-weight:700; background:var(--domo-text-accent); color:#fff; }

/* ── Buttons ── */
.btn {
  padding: 6px 12px; border-radius: var(--domo-radius-md); border: 1px solid var(--domo-border-muted);
  background: var(--domo-bg-btn); color: var(--domo-text-primary); font: inherit; font-size: 12px;
  font-weight: 600; cursor: pointer; transition: all var(--domo-transition-fast);
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.btn:hover { background: var(--domo-bg-btn-hover); border-color: var(--domo-text-secondary); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--domo-bg-primary); border-color: var(--domo-bg-primary); color: #fff; }
.btn-primary:hover { background: var(--domo-bg-primary-hover); }
.btn-danger { background: var(--domo-bg-danger); border-color: var(--domo-border-danger); color: var(--domo-text-danger); }
.btn-danger:hover { background: var(--domo-bg-danger-hover); }
.btn-sm { padding: 3px 8px; font-size: 11px; }
.btn-block { display: block; width: 100%; }
.btn-xs { font-size: 10px; padding: 1px 6px; }

/* Icon buttons */
.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: var(--domo-radius-sm);
  border: none; background: none; color: var(--domo-text-secondary);
  cursor: pointer; transition: all var(--domo-transition-fast); flex-shrink: 0;
}
.btn-icon:hover { background: var(--domo-bg-btn); color: var(--domo-text-primary); }
.btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-icon-sm { width: 22px; height: 22px; }

/* Spinner */
.domo-spinner {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid var(--domo-border-muted); border-top-color: var(--domo-text-accent);
  border-radius: 50%; animation: domo-spin 0.6s linear infinite;
  margin-right: 6px; vertical-align: middle;
}

/* ── Cards ── */
.card {
  background: var(--domo-bg-card); border: 1px solid var(--domo-border-default); border-radius: var(--domo-radius-lg);
  padding: 12px; margin-bottom: 8px; transition: border-color var(--domo-transition-fast), box-shadow var(--domo-transition-fast);
}
.card:hover { border-color: var(--domo-border-muted); box-shadow: var(--domo-shadow-card-hover); }
.card-dim { opacity: 0.6; }
.card-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;
}
.card-title { font-weight: 600; font-size: 13px; color: var(--domo-text-heading); }
.card-meta { font-size: 11px; color: var(--domo-text-secondary); }
.card-desc { font-size: 12px; color: var(--domo-text-secondary); margin-top: 2px; }

/* ── Platform groups (Installed tab) ── */
.platform-group { margin-bottom: 4px; }
.platform-header {
  width: 100%; background: none; border: none; cursor: pointer;
  display: flex; align-items: center; gap: 6px; padding: 6px 0;
  font-size: 11px; font-weight: 600; color: var(--domo-text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px; transition: color var(--domo-transition-fast);
  user-select: none;
}
.platform-header:hover { color: var(--domo-text-primary); }
.platform-label { flex-shrink: 0; }
.platform-chevron { transition: transform var(--domo-transition-fast); display: inline-flex; flex-shrink: 0; }
.platform-chevron.expanded { transform: rotate(90deg); }
.platform-count { font-size: 10px; color: var(--domo-text-dim); font-weight: 400; text-transform: none; letter-spacing: 0; }
.platform-active-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--domo-pill-green-text); flex-shrink: 0; }
.platform-plugins { padding-bottom: 4px; overflow: hidden; max-height: 2000px; transition: max-height var(--domo-transition-slow), padding var(--domo-transition-slow); }
.platform-plugins.collapsed { max-height: 0; padding: 0; }
.platform-bulk-actions { opacity: 0; transition: opacity var(--domo-transition-fast); margin-left: auto; display: flex; gap: 2px; flex-shrink: 0; }
.platform-header:hover .platform-bulk-actions { opacity: 1; }

/* ── Plugin cards (Installed tab) ── */
.plugin-card {
  position: relative;
  background: var(--domo-bg-card); border: 1px solid var(--domo-border-default); border-radius: var(--domo-radius-lg);
  padding: 10px 12px; margin-bottom: 6px;
  transition: border-color var(--domo-transition-fast), box-shadow var(--domo-transition-fast), background var(--domo-transition-fast);
}
.plugin-card:hover { border-color: var(--domo-border-muted); box-shadow: var(--domo-shadow-card-hover); }
.plugin-active { border-left: 3px solid var(--domo-pill-green-text); background: rgba(35,134,54,0.04); }
.plugin-active:hover { border-left-color: var(--domo-pill-green-text); }
.plugin-disabled { opacity: 0.6; }
.plugin-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.plugin-card-body { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
.plugin-name { font-weight: 600; font-size: 13px; color: var(--domo-text-heading); word-break: break-word; }
.plugin-meta-line {
  font-size: 11px; color: var(--domo-text-dim); flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.plugin-card-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.plugin-badges { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }

/* Toggle switch */
.toggle-switch { position: relative; display: inline-block; width: 28px; height: 16px; flex-shrink: 0; }
.toggle-switch .toggle-input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-slider {
  position: absolute; cursor: pointer; inset: 0; background: var(--domo-bg-btn);
  border: 1px solid var(--domo-border-muted); border-radius: 16px; transition: all 0.2s;
}
.toggle-slider::before {
  content: ""; position: absolute; width: 10px; height: 10px; left: 2px; top: 2px;
  background: var(--domo-text-secondary); border-radius: 50%; transition: all 0.2s;
}
.toggle-input:checked + .toggle-slider { background: var(--domo-bg-primary); border-color: var(--domo-bg-primary); }
.toggle-input:checked + .toggle-slider::before { transform: translateX(12px); background: #fff; }

/* ── Pills ── */
.pill {
  display: inline-block; padding: 1px 7px; border-radius: 10px;
  font-size: 10px; font-weight: 600; line-height: 1.6;
}
.pill-green { background: var(--domo-pill-green-bg); color: var(--domo-pill-green-text); }
.pill-red { background: var(--domo-pill-red-bg); color: var(--domo-pill-red-text); }
.pill-blue { background: var(--domo-pill-blue-bg); color: var(--domo-pill-blue-text); }
.pill-purple { background: var(--domo-pill-purple-bg); color: var(--domo-pill-purple-text); }
.plugin-error-badge { cursor: pointer; }
.plugin-error-detail { padding: 4px 8px; font-size: 11px; background: var(--domo-pill-red-bg); border-radius: var(--domo-radius-sm); margin-top: 4px; }
.plugin-error-line { color: var(--domo-pill-red-text); padding: 2px 0; }

/* ── Forms ── */
input, textarea, select {
  width: 100%; padding: 7px 10px; border-radius: var(--domo-radius-md);
  border: 1px solid var(--domo-border-muted); background: var(--domo-bg-body); color: var(--domo-text-primary);
  font: inherit; font-size: 12px; transition: border-color var(--domo-transition-fast), box-shadow var(--domo-transition-fast);
}
input:focus, textarea:focus, select:focus {
  outline: none; border-color: var(--domo-border-accent);
  box-shadow: 0 0 0 3px var(--domo-focus-shadow);
}
textarea { resize: vertical; min-height: 60px; }
label { display: block; font-size: 11px; color: var(--domo-text-secondary); margin-bottom: 4px; margin-top: 10px; }
label:first-child { margin-top: 0; }

/* Checkbox */
.checkbox-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.checkbox-row input[type="checkbox"] { width: auto; accent-color: var(--domo-text-accent); }
.checkbox-row label { margin: 0; font-size: 12px; color: var(--domo-text-primary); }

/* Selector item */
.selector-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; background: var(--domo-bg-card); border: 1px solid var(--domo-border-default);
  border-radius: var(--domo-radius-md); margin-bottom: 4px; font-size: 12px;
  transition: border-color var(--domo-transition-fast);
}
.selector-item code {
  font-size: 11px; color: var(--domo-code-text); background: var(--domo-code-bg);
  padding: 1px 5px; border-radius: 4px; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; max-width: 200px;
}
.selector-info { display:flex; flex-direction:column; gap:2px; overflow:hidden; flex:1; }
.selector-label { font-size:12px; color:var(--domo-text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* ── Installed tab header ── */
.installed-header { display: flex; gap: 6px; align-items: center; padding: 6px 0; }
.search-field { position: relative; flex: 1; }
.search-field-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: var(--domo-text-dim); pointer-events: none; }
.search-field input { padding-left: 30px; }
.installed-search {
  flex: 1; background: var(--domo-bg-btn); border: 1px solid var(--domo-border-default);
  color: var(--domo-text-primary); padding: 5px 8px; border-radius: var(--domo-radius-sm); font-size: 12px; outline: none;
  transition: border-color var(--domo-transition-fast);
}
.installed-search:focus { border-color: var(--domo-border-accent); }
.installed-header-actions { display: flex; gap: 4px; flex-shrink: 0; }

/* Update banner */
.update-banner { display:flex; align-items:center; justify-content:space-between; background:var(--domo-pill-blue-bg); color:var(--domo-pill-blue-text); border:1px solid var(--domo-pill-blue-text); border-radius:var(--domo-radius-md); padding:6px 10px; font-size:11px; margin-bottom:6px; }

/* Plugin update dot */
.plugin-update-dot { position:relative; }
.plugin-update-dot::after { content:''; position:absolute; top:-2px; right:-2px; width:6px; height:6px; border-radius:50%; background:var(--domo-pill-blue-text); }

/* ── Empty states ── */
.empty { text-align: center; padding: 24px 12px; color: var(--domo-text-dim); font-size: 12px; }
.empty-state {
  text-align: center; padding: 40px 24px; display: flex; flex-direction: column;
  align-items: center; gap: 8px;
}
.empty-state-icon { color: var(--domo-text-dim); margin-bottom: 4px; }
.empty-state-icon .domo-icon { width: 48px; height: 48px; }
.empty-state-title { font-size: 14px; font-weight: 600; color: var(--domo-text-heading); }
.empty-state-desc { font-size: 12px; color: var(--domo-text-secondary); max-width: 240px; line-height: 1.5; }

/* ── Status bar ── */
.status-bar {
  margin-top: 12px; padding: 8px; font-size: 11px; color: var(--domo-text-secondary);
  background: var(--domo-bg-card); border-radius: var(--domo-radius-md); text-align: center;
}

/* Template options */
.option-group { margin-top: 8px; }

/* ── Theme toggle ── */
.theme-toggle {
  background: none; border: none; cursor: pointer; padding: 4px;
  color: var(--domo-text-secondary); display: flex; align-items: center;
  border-radius: var(--domo-radius-sm); transition: color var(--domo-transition-fast);
}
.theme-toggle:hover { color: var(--domo-text-primary); }
.theme-toggle svg { width: 14px; height: 14px; }

/* Dev mode badge */
.dev-badge {
  font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: var(--domo-radius-sm);
  background: var(--domo-pill-purple-bg); color: var(--domo-pill-purple-text);
  letter-spacing: 0.5px;
}

/* ── Discover: Toolbar ── */
.discover-toolbar { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
.discover-sort {
  width: auto; padding: 5px 8px; font-size: 11px; font-weight: 600;
  background: var(--domo-bg-btn); border: 1px solid var(--domo-border-default);
  color: var(--domo-text-secondary); border-radius: var(--domo-radius-sm);
  cursor: pointer; transition: border-color var(--domo-transition-fast); flex-shrink: 0;
}
.discover-sort:focus { border-color: var(--domo-border-accent); }

/* ── Discover: Platform filters ── */
.filter-scroll-wrapper {
  position: relative; margin-bottom: 10px;
}
.filter-scroll-wrapper::after {
  content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 24px;
  background: linear-gradient(to right, transparent, var(--domo-bg-body));
  pointer-events: none; opacity: 0; transition: opacity var(--domo-transition-fast);
}
.filter-scroll-wrapper.has-overflow::after { opacity: 1; }
.platform-filters {
  display: flex; gap: 4px; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch;
  scrollbar-width: none; padding-bottom: 2px;
}
.platform-filters::-webkit-scrollbar { display: none; }
.platform-pill {
  padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600;
  border: 1px solid var(--domo-border-muted); background: none;
  color: var(--domo-text-secondary); cursor: pointer; transition: all var(--domo-transition-fast);
  white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;
}
.platform-pill:hover { border-color: var(--domo-text-accent); color: var(--domo-text-accent); }
.platform-pill.active { background: var(--domo-text-accent); color: #fff; border-color: var(--domo-text-accent); }
.filter-count {
  font-size: 9px; font-weight: 700; opacity: 0.6;
}
.platform-pill.active .filter-count { opacity: 0.85; }

/* Create sections & template grid */
.create-section { margin-bottom: 12px; }
.create-section-desc { font-size: 11px; color: var(--domo-text-secondary); margin-bottom: 10px; line-height: 1.5; }
.create-actions { margin-top: 14px; }
.template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 4px; }
.template-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 4px; border-radius: var(--domo-radius-md);
  border: 1px solid var(--domo-border-default); background: var(--domo-bg-card);
  color: var(--domo-text-secondary); cursor: pointer; font: inherit; font-size: 10px;
  transition: all var(--domo-transition-fast);
}
.template-card:hover { border-color: var(--domo-border-muted); background: var(--domo-bg-btn); }
.template-card-active { border-color: var(--domo-text-accent); background: rgba(88,166,255,0.06); color: var(--domo-text-accent); }
.template-card-icon { color: inherit; }
.template-card-name { font-weight: 600; text-align: center; line-height: 1.2; }
/* Template search + filter (legacy compat) */
.tpl-search { display: flex; gap: 6px; margin-bottom: 10px; }
.tpl-search input { flex: 1; }

/* ── Discover: Template cards ── */
.tpl-card {
  background: var(--domo-bg-card); border: 1px solid var(--domo-border-default);
  border-radius: var(--domo-radius-lg); padding: 10px 12px; margin-bottom: 6px; cursor: pointer;
  transition: border-color var(--domo-transition-fast), box-shadow var(--domo-transition-fast), background var(--domo-transition-fast);
}
.tpl-card:hover { border-color: var(--domo-border-muted); box-shadow: var(--domo-shadow-card-hover); background: var(--domo-bg-elevated); }
.tpl-card-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.tpl-card-name { font-weight: 600; font-size: 13px; color: var(--domo-text-heading); }
.tpl-card-badges { display: flex; gap: 4px; flex-shrink: 0; flex-wrap: wrap; }
.tpl-card-desc {
  font-size: 11px; color: var(--domo-text-secondary); margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.tpl-card-meta { font-size: 10px; color: var(--domo-text-dim); margin-top: 2px; }
.tpl-card-actions { display: flex; gap: 4px; margin-top: 6px; }

/* Source badges */
.badge-builtin { background: var(--domo-pill-blue-bg); color: var(--domo-pill-blue-text); }
.badge-community { background: var(--domo-pill-purple-bg); color: var(--domo-pill-purple-text); }
.badge-installed { background: var(--domo-pill-green-bg); color: var(--domo-pill-green-text); }

/* ── Discover: Detail view ── */
.detail-back {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--domo-text-accent); background: none; border: none;
  cursor: pointer; font: inherit; font-size: 12px; padding: 0; margin-bottom: 10px;
  transition: opacity var(--domo-transition-fast);
}
.detail-back:hover { opacity: 0.8; }
.detail-header { margin-bottom: 8px; }
.detail-title { font-size: 15px; font-weight: 700; color: var(--domo-text-heading); margin-bottom: 4px; }
.detail-badges { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
.detail-meta { font-size: 11px; color: var(--domo-text-secondary); }
.detail-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
.detail-tag {
  font-size: 10px; padding: 2px 8px; border-radius: 8px;
  background: var(--domo-bg-btn); color: var(--domo-text-secondary);
}
.detail-description { font-size: 12px; color: var(--domo-text-secondary); margin: 0 0 8px; line-height: 1.5; }
.detail-section { margin-bottom: 12px; }
.detail-section-title {
  font-size: 11px; font-weight: 600; color: var(--domo-text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
}
.detail-actions { display: flex; gap: 6px; margin-top: 10px; }

/* Code preview */
.code-tabs { display: flex; border-bottom: 1px solid var(--domo-border-default); margin-top: 10px; }
.code-tab-btn {
  padding: 4px 10px; background: none; border: none; font: inherit; font-size: 11px;
  color: var(--domo-text-secondary); border-bottom: 2px solid transparent;
  cursor: pointer; transition: all var(--domo-transition-fast);
}
.code-tab-btn:hover { color: var(--domo-text-primary); }
.code-tab-btn.active { color: var(--domo-text-accent); border-bottom-color: var(--domo-text-accent); }
.code-preview {
  background: var(--domo-bg-body); border: 1px solid var(--domo-border-default);
  border-top: none; border-radius: 0 0 var(--domo-radius-md) var(--domo-radius-md); max-height: 200px; overflow: auto;
  padding: 8px; margin-bottom: 6px;
}
.code-preview pre {
  font-family: 'Consolas', 'Fira Code', monospace; font-size: 11px;
  color: var(--domo-code-text); white-space: pre-wrap; margin: 0;
}
.code-note { font-size: 10px; color: var(--domo-text-dim); font-style: italic; }

/* Preview banner */
.preview-banner {
  background: var(--domo-pill-blue-bg); color: var(--domo-pill-blue-text);
  padding: 6px 10px; border-radius: var(--domo-radius-md); font-size: 11px;
  text-align: center; margin-bottom: 8px;
}

/* Section headers */
.tpl-section-header {
  font-size: 11px; font-weight: 600; color: var(--domo-text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0 6px;
}

/* Collapsible sections */
.collapsible { margin-top:10px; }
.collapsible-toggle { background:none; border:none; color:var(--domo-text-secondary); font:inherit; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; padding:0; display:flex; align-items:center; gap:4px; transition: color var(--domo-transition-fast); }
.collapsible-toggle:hover { color:var(--domo-text-primary); }

/* ── Overflow Menu ── */
.domo-menu {
  position: fixed; min-width: 180px;
  background: var(--domo-bg-overlay); border: 1px solid var(--domo-border-muted);
  border-radius: var(--domo-radius-lg); padding: 4px 0;
  box-shadow: var(--domo-shadow-lg); z-index: 10000;
  opacity: 0; transform: translateY(-4px) scale(0.97);
  transition: opacity var(--domo-transition-fast), transform var(--domo-transition-fast);
}
.domo-menu.open { opacity: 1; transform: translateY(0) scale(1); }
.domo-menu-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; font-size: 12px; color: var(--domo-text-primary);
  cursor: pointer; border: none; background: none; width: 100%; text-align: left;
  transition: background var(--domo-transition-fast); font-family: inherit;
}
.domo-menu-item:hover { background: var(--domo-bg-btn-hover); }
.domo-menu-item-danger { color: var(--domo-text-danger); }
.domo-menu-item-danger:hover { background: var(--domo-bg-danger); }
.domo-menu-separator { height: 1px; background: var(--domo-border-default); margin: 4px 0; }

/* ── Confirm dialog ── */
.confirm-overlay { position:fixed; inset:0; background:var(--domo-overlay-bg); backdrop-filter:blur(2px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; }
.confirm-dialog { background:var(--domo-bg-card); border:1px solid var(--domo-border-default); border-radius:var(--domo-radius-xl); padding:16px; max-width:280px; width:100%; box-shadow:var(--domo-shadow-lg); animation: domo-dialog-in var(--domo-transition-base) ease; }
.confirm-title { font-size: 14px; font-weight: 600; color: var(--domo-text-heading); margin-bottom: 6px; }
.confirm-message { font-size:13px; color:var(--domo-text-primary); margin-bottom:14px; line-height:1.5; }
.confirm-actions { display:flex; gap:8px; justify-content:flex-end; }
.confirm-actions .btn { padding: 6px 16px; }

/* ── Toast ── */
.toast-container { position:fixed; bottom:52px; left:16px; right:16px; z-index:9998; display:flex; flex-direction:column; gap:6px; pointer-events:none; }
.toast { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:var(--domo-radius-md); font-size:12px; font-weight:600; opacity:0; transform:translateY(12px); transition:all 0.2s ease; pointer-events:auto; cursor:pointer; }
.toast-show { opacity:1; transform:translateY(0); }
.toast-success { background:var(--domo-pill-green-bg); color:var(--domo-pill-green-text); border:1px solid var(--domo-pill-green-text); }
.toast-error { background:var(--domo-pill-red-bg); color:var(--domo-pill-red-text); border:1px solid var(--domo-pill-red-text); }
.toast-warning { background:rgba(210,153,34,0.15); color:#d69e22; border:1px solid #d69e22; }
.toast-info { background:var(--domo-pill-blue-bg); color:var(--domo-pill-blue-text); border:1px solid var(--domo-pill-blue-text); }

/* ── Settings slide-in panel ── */
.settings-overlay { position:fixed; inset:0; background:var(--domo-overlay-bg); z-index:500; opacity:0; transition:opacity var(--domo-transition-base); }
.settings-overlay.open { opacity:1; }
.settings-panel {
  position:fixed; top:0; right:0; bottom:0; width:300px;
  background:var(--domo-bg-body); border-left:1px solid var(--domo-border-default);
  box-shadow:var(--domo-shadow-lg); z-index:501; padding:16px;
  transform:translateX(100%); transition:transform var(--domo-transition-slow);
  overflow-y:auto;
}
.settings-panel.open { transform:translateX(0); }
.settings-panel-header {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--domo-border-default);
}
.settings-panel-header h2 { font-size: 14px; font-weight: 600; color: var(--domo-text-heading); }
.settings-section { margin-bottom: 16px; }
.settings-section-title {
  font-size: 11px; font-weight: 600; color: var(--domo-text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
}
.settings-page label { display:block; font-size:11px; color:var(--domo-text-secondary); margin:10px 0 4px; }
.settings-page label:first-of-type { margin-top:4px; }
.settings-page input, .settings-page select {
  width:100%; background:var(--domo-bg-btn); border:1px solid var(--domo-border-default);
  color:var(--domo-text-primary); padding:5px 8px; border-radius:var(--domo-radius-sm); font-size:12px; outline:none;
  transition: border-color var(--domo-transition-fast);
}
.settings-page input:focus, .settings-page select:focus { border-color:var(--domo-border-accent); }

/* ── Accessibility ── */
.btn:focus-visible, .btn-icon:focus-visible, .toggle-input:focus-visible + .toggle-slider, input:focus-visible, select:focus-visible, textarea:focus-visible { outline:2px solid var(--domo-border-accent); outline-offset:1px; }

.ed-hidden { display:none !important; }
`;
}
