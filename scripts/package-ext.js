const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = pkg.version;

console.log(`Packaging Domo v${version}...`);

// Run build
execSync("node scripts/build-ext.js", { stdio: "inherit" });

// Create releases dir
const releasesDir = path.resolve("releases");
if (!fs.existsSync(releasesDir)) fs.mkdirSync(releasesDir);

// Create temp dir
const tmpDir = path.resolve("releases/_tmp_package");
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

// Copy extension files (excluding source maps and templates source)
const extDir = path.resolve("extension");
function copyDir(src, dest, excludePatterns = []) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relPath = path.relative(extDir, srcPath);

    if (excludePatterns.some(p => relPath.match(p))) continue;

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, excludePatterns);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(extDir, tmpDir, [
  /\.map$/,      // Source maps
  /^src\//,      // Source TypeScript
  /^templates\//, // Template source (bundled into JS)
  /^_metadata\//, // Extension metadata
]);

// Create zip
const zipName = `domo-${version}.zip`;
const zipPath = path.join(releasesDir, zipName);
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

execSync(`cd "${tmpDir}" && zip -r "${zipPath}" .`, { stdio: "inherit" });

// Cleanup
fs.rmSync(tmpDir, { recursive: true });

const size = (fs.statSync(zipPath).size / 1024).toFixed(1);
console.log(`\nPackaged: releases/${zipName} (${size} KB)`);
