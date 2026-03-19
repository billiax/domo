const esbuild = require("esbuild");

async function build() {
  const common = { bundle: true, format: "iife", target: "chrome120", loader: { ".json": "json" }, define: { "__DEV_MODE__": "false" }, sourcemap: "linked", minify: true, legalComments: "none" };

  // Content (bundled IIFE)
  await esbuild.build({
    ...common,
    entryPoints: ["extension/src/content.ts"],
    outfile: "extension/dist/content.js"
  });

  // Sidepanel (bundled IIFE)
  await esbuild.build({
    ...common,
    entryPoints: ["extension/src/sidepanel.ts"],
    outfile: "extension/dist/sidepanel.js"
  });

  // Editor (bundled IIFE)
  await esbuild.build({
    ...common,
    entryPoints: ["extension/src/editor.ts"],
    outfile: "extension/dist/editor.js"
  });

  // Background (NOT bundled — just strip types)
  await esbuild.build({
    entryPoints: ["extension/src/background.ts"],
    outfile: "extension/background.js",
    bundle: false,
    format: "esm",
    target: "chrome120"
  });

  console.log("Build complete.");
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
