import { getSettings, updateSettings } from "../core/storage";
import { showToast } from "./shared";
import { icon } from "../icons";

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function openSettingsPanel(): void {
  // Close any existing settings panel
  document.querySelector(".settings-overlay")?.remove();
  document.querySelector(".settings-panel")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "settings-overlay";

  const panel = document.createElement("div");
  panel.className = "settings-panel";

  function close(): void {
    overlay.classList.remove("open");
    panel.classList.remove("open");
    setTimeout(() => {
      overlay.remove();
      panel.remove();
    }, 300);
  }

  overlay.addEventListener("click", close);
  document.addEventListener("keydown", function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", onKey);
      close();
    }
  });

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add("open");
    panel.classList.add("open");
  });

  // Load settings and render form
  getSettings().then(settings => {
    panel.innerHTML = `
      <div class="settings-panel-header">
        <h2>Settings</h2>
        <button class="btn-icon" id="settings-close" title="Close">${icon("close")}</button>
      </div>
      <div class="settings-page">
        <div class="settings-section">
          <div class="settings-section-title">Connection</div>
          <label>GitHub Token (optional, for private repos)</label>
          <input id="settings-token" type="password" value="${esc(settings.githubToken || "")}" placeholder="ghp_...">
        </div>
        <div class="settings-section">
          <div class="settings-section-title">Appearance</div>
          <label>Theme</label>
          <select id="settings-theme">
            <option value="system"${(settings.theme || "system") === "system" ? " selected" : ""}>System</option>
            <option value="light"${settings.theme === "light" ? " selected" : ""}>Light</option>
            <option value="dark"${settings.theme === "dark" ? " selected" : ""}>Dark</option>
          </select>
        </div>
        <div style="margin-top:16px;">
          <button class="btn btn-primary" id="settings-save" style="width:100%;">${icon("check")} Save Settings</button>
        </div>
      </div>
    `;

    panel.querySelector("#settings-close")!.addEventListener("click", close);

    panel.querySelector("#settings-save")!.addEventListener("click", async () => {
      const githubToken = (panel.querySelector("#settings-token") as HTMLInputElement).value.trim();
      const theme = (panel.querySelector("#settings-theme") as HTMLSelectElement).value;

      await updateSettings({ githubToken, theme });
      document.documentElement.setAttribute("data-theme", theme);

      // Update theme toggle icon if visible
      const themeToggle = document.getElementById("theme-toggle");
      if (themeToggle) {
        const iconName = theme === "light" ? "sun" : theme === "dark" ? "moon" : "monitor";
        themeToggle.innerHTML = icon(iconName);
      }

      showToast("Settings saved");
      close();
    });
  });
}
