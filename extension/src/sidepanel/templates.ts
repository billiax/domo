export interface PluginTemplate {
  name: string;
  description: string;
  code: { css: string; html: string; js: string };
}

export const PLUGIN_TEMPLATES: PluginTemplate[] = [
  {
    name: "CSS Only",
    description: "Simple CSS customization",
    code: {
      css: "/* Add your CSS here */\n",
      html: "",
      js: ""
    }
  },
  {
    name: "DOM Watcher",
    description: "Watch for DOM changes and react",
    code: {
      css: "",
      html: "",
      js: `// Watch for new elements matching a selector
const target = 'article'; // Change this

api.waitForSelector(target).then(el => {
  if (!el) return;
  api.log('Found target element');

  // Watch for new instances
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node instanceof Element && node.matches(target)) {
          api.log('New element added');
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  api.onCleanup(() => observer.disconnect());
});
`
    }
  },
  {
    name: "Keyboard Shortcut",
    description: "Add custom keyboard shortcuts",
    code: {
      css: "",
      html: "",
      js: `// Add a keyboard shortcut
api.addEventListener(document, 'keydown', (e) => {
  // Example: Ctrl+Shift+K
  if (e.ctrlKey && e.shiftKey && e.key === 'K') {
    e.preventDefault();
    api.log('Shortcut triggered!');
    // Add your action here
  }
});
`
    }
  },
  {
    name: "Periodic Check",
    description: "Run code on an interval",
    code: {
      css: "",
      html: "",
      js: `// Check something every 5 seconds
api.setInterval(() => {
  const el = document.querySelector('.notification-badge');
  if (el) {
    api.log('Found notification badge:', el.textContent);
  }
}, 5000);
`
    }
  },
  {
    name: "Custom Panel",
    description: "Inject a floating panel with CSS + HTML + JS",
    code: {
      css: `#domo-custom-panel {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 300px;
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 99999;
  font-family: sans-serif;
  font-size: 13px;
}
`,
      html: `<div id="domo-custom-panel">
  <strong>My Panel</strong>
  <p>Custom content here</p>
</div>
`,
      js: `// Interact with the injected HTML
api.waitForSelector('#domo-custom-panel').then(panel => {
  if (!panel) return;
  api.log('Panel ready');
});
`
    }
  }
];
