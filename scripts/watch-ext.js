const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const TEMPLATES_SRC = path.resolve("templates");
const TEMPLATES_DEST = path.resolve("extension/templates");

function copyTemplates() {
  // Clean destination
  if (fs.existsSync(TEMPLATES_DEST)) fs.rmSync(TEMPLATES_DEST, { recursive: true });
  fs.mkdirSync(TEMPLATES_DEST, { recursive: true });

  const manifest = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const srcPath = path.join(dir, entry.name);
      const relPath = path.relative(TEMPLATES_SRC, srcPath);
      if (entry.isDirectory()) {
        fs.mkdirSync(path.join(TEMPLATES_DEST, relPath), { recursive: true });
        walk(srcPath);
      } else if (entry.name.endsWith(".json") && entry.name !== "registry.json") {
        fs.copyFileSync(srcPath, path.join(TEMPLATES_DEST, relPath));
        manifest.push(relPath);
      }
    }
  }

  walk(TEMPLATES_SRC);
  fs.writeFileSync(
    path.join(TEMPLATES_DEST, "_manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  fs.writeFileSync(
    path.join(TEMPLATES_DEST, "_version.json"),
    JSON.stringify({ timestamp: Date.now() })
  );
  console.log(`[domo] Copied ${manifest.length} templates to extension/templates/`);
}

async function watch() {
  const common = { bundle: true, format: "iife", target: "chrome120", loader: { ".json": "json" }, define: { "__DEV_MODE__": "true" }, sourcemap: true };

  // Content (bundled IIFE)
  const ctx1 = await esbuild.context({
    ...common,
    entryPoints: ["extension/src/content.ts"],
    outfile: "extension/dist/content.js"
  });

  // Sidepanel (bundled IIFE)
  const ctx2 = await esbuild.context({
    ...common,
    entryPoints: ["extension/src/sidepanel.ts"],
    outfile: "extension/dist/sidepanel.js"
  });

  // Editor (bundled IIFE)
  const ctx3 = await esbuild.context({
    ...common,
    entryPoints: ["extension/src/editor.ts"],
    outfile: "extension/dist/editor.js"
  });

  // Background (NOT bundled — just strip types)
  const ctx4 = await esbuild.context({
    entryPoints: ["extension/src/background.ts"],
    outfile: "extension/background.js",
    bundle: false,
    format: "esm",
    target: "chrome120",
    define: { "__DEV_MODE__": "true" }
  });

  await ctx1.watch();
  await ctx2.watch();
  await ctx3.watch();
  await ctx4.watch();
  console.log("Watching extension/src/{content,sidepanel,editor,background}.ts ...");

  // Copy templates initially and watch for changes
  copyTemplates();

  let debounceTimer = null;
  fs.watch(TEMPLATES_SRC, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith(".json")) return;
    // Debounce rapid changes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      copyTemplates();
      debounceTimer = null;
    }, 200);
  });
  console.log("Watching templates/ for changes ...");
}

watch().catch(err => {
  console.error(err);
  process.exit(1);
});
