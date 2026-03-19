import { getEditorStyles } from "./editor/styles";
import { EditorApp } from "./editor/app";

async function init(): Promise<void> {
  // Inject styles
  const style = document.createElement("style");
  style.textContent = getEditorStyles();
  document.head.appendChild(style);

  // Parse URL params
  const params = new URLSearchParams(location.search);
  const pluginId = params.get("pluginId");

  // Create editor app
  const root = document.getElementById("editor-root")!;
  const app = new EditorApp(root, pluginId);
  await app.init();
}

init().catch(err => console.error("[domo editor] init failed:", err));
