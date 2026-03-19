const fs = require("fs");
const path = require("path");

const type = process.argv[2] || "patch";
if (!["patch", "minor", "major"].includes(type)) {
  console.error("Usage: node scripts/bump-version.js [patch|minor|major]");
  process.exit(1);
}

// Read package.json
const pkgPath = path.resolve("package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);

let newVersion;
if (type === "major") newVersion = `${major + 1}.0.0`;
else if (type === "minor") newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// Update manifest.json
const manifestPath = path.resolve("extension/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`Bumped version: ${major}.${minor}.${patch} → ${newVersion}`);
