// Centralized SVG icon system for Domo
// All icons: viewBox 0 0 16 16, stroke-based with currentColor

export const ICONS: Record<string, string> = {
  edit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 11.5V14h2.5L13 5.5 10.5 3 2 11.5z"/><path d="M9.5 4l2.5 2.5"/></svg>',
  clipboard: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="1.5" width="8" height="9.5" rx="1.5"/><path d="M5.5 5H4A1.5 1.5 0 0 0 2.5 6.5v6A1.5 1.5 0 0 0 4 14h5a1.5 1.5 0 0 0 1.5-1.5V12"/></svg>',
  gear: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.6 2h2.8l.36 1.77a5 5 0 0 1 1.12.63l1.72-.65 1.4 2.42-1.36 1.12c.04.23.06.47.06.71s-.02.48-.06.71l1.36 1.12-1.4 2.42-1.72-.65a5 5 0 0 1-1.12.63L9.4 14H6.6l-.36-1.77a5 5 0 0 1-1.12-.63l-1.72.65-1.4-2.42 1.36-1.12A5 5 0 0 1 3.3 8c0-.24.02-.48.06-.71L2 6.17l1.4-2.42 1.72.65a5 5 0 0 1 1.12-.63L6.6 2z"/><circle cx="8" cy="8" r="2"/></svg>',
  fork: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="3.5" r="1.5"/><circle cx="11" cy="3.5" r="1.5"/><circle cx="8" cy="12.5" r="1.5"/><path d="M5 5v2a3 3 0 0 0 3 3 3 3 0 0 0 3-3V5"/></svg>',
  trash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M6 4V2.5h4V4M4.5 4l.5 9.5h6l.5-9.5"/></svg>',
  refresh: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.5A5.5 5.5 0 0 1 13 7M13.5 9.5A5.5 5.5 0 0 1 3 9"/><path d="M2 3.5v3h3M14 12.5v-3h-3"/></svg>',
  moreVertical: '<svg viewBox="0 0 16 16" fill="currentColor" stroke="none"><circle cx="8" cy="3.5" r="1.25"/><circle cx="8" cy="8" r="1.25"/><circle cx="8" cy="12.5" r="1.25"/></svg>',
  close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  upload: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10V3M5 5.5l3-3 3 3M3 10.5v3h10v-3"/></svg>',
  download: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v7.5M5 7l3 3 3-3M3 12v1.5h10V12"/></svg>',
  search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="4"/><path d="M13 13l-3-3"/></svg>',
  arrowLeft: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>',
  chevronDown: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>',
  chevronRight: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.5 3.5L13 4"/></svg>',
  alertTriangle: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5L1 14h14L8 1.5z"/><path d="M8 6v4M8 12h.01"/></svg>',
  plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  externalLink: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4H3V4h4"/><path d="M10 2h4v4"/><path d="M7 9l7-7"/></svg>',
  code: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4L1.5 8 5 12M11 4l3.5 4L11 12"/></svg>',
  eye: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5S1 8 1 8z"/><circle cx="8" cy="8" r="2"/></svg>',
  eyeOff: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l12 12"/><path d="M6.5 6.5a2 2 0 0 0 3 3"/><path d="M1 8s2.2-4.4 5.8-4.9"/><path d="M15 8s-2.2 4.4-5.8 4.9"/></svg>',
  save: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 14.5h-9a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h7l3 3v9a1 1 0 0 1-1 1z"/><path d="M5.5 14.5v-4h5v4M5.5 1.5v3h4"/></svg>',
  sun: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.7 3.7l1.42 1.42M10.88 10.88l1.42 1.42M12.3 3.7l-1.42 1.42M5.12 10.88l-1.42 1.42"/></svg>',
  moon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 8.5a5.5 5.5 0 1 1-6-6 4 4 0 0 0 6 6z"/></svg>',
  monitor: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2" width="13" height="9" rx="1.5"/><path d="M5.5 14h5M8 11v3"/></svg>',
  sparkle: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/></svg>',
  package: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5l6-3.5L14 5v6l-6 3.5L2 11V5z"/><path d="M2 5l6 3.5L14 5M8 8.5V14.5"/></svg>',
  info: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5h.01"/></svg>',
  sliders: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h3M9 4h5M2 8h8M13 8h1M2 12h1M6 12h8"/><circle cx="7.5" cy="4" r="1.5"/><circle cx="11.5" cy="8" r="1.5"/><circle cx="4" cy="12" r="1.5"/></svg>',
};

export function icon(name: string, cls?: string): string {
  const svg = ICONS[name] || '';
  return `<span class="domo-icon${cls ? ' ' + cls : ''}">${svg}</span>`;
}
