#!/usr/bin/env node
/**
 * Dependency detection script for gsnake-web
 *
 * Detects whether gsnake-web is running in root repository or standalone mode,
 * and ensures the correct dependency path is configured.
 *
 * Root repo mode: Uses local file: path to sibling gsnake-core
 * Standalone mode: Downloads prebuilt WASM (committed in gsnake-core)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const workspaceRoot = join(projectRoot, "..", "..");
const packageJsonPath = join(projectRoot, "package.json");

const forceGitDeps =
  process.env.FORCE_GIT_DEPS === "1" || process.env.FORCE_GIT_DEPS === "true";

// Check for root repository context
const rootGitPath = join(projectRoot, "..", "..", "..", ".git");
const workspaceGitPath = join(projectRoot, "..", "..", ".git");
const gsnakeCoreCargoPath = join(
  projectRoot,
  "..",
  "..",
  "..",
  "gsnake-core",
  "Cargo.toml",
);
const wasmPkgPath = join(
  projectRoot,
  "..",
  "..",
  "..",
  "gsnake-core",
  "engine",
  "bindings",
  "wasm",
  "pkg",
  "package.json",
);

const isRootRepo =
  !forceGitDeps &&
  (existsSync(rootGitPath) || existsSync(workspaceGitPath)) &&
  existsSync(gsnakeCoreCargoPath);
const localPathDependency =
  "file:../../../gsnake-core/engine/bindings/wasm/pkg";
const vendorDependency = "file:../../vendor/gsnake-wasm";
const vendorDir = join(workspaceRoot, "vendor", "gsnake-wasm");
const vendorBaseUrl =
  "https://raw.githubusercontent.com/nntin/gsnake/main/gsnake-core/engine/bindings/wasm/pkg";
const vendorFiles = [
  "package.json",
  "gsnake_wasm.js",
  "gsnake_wasm.d.ts",
  "gsnake_wasm_bg.wasm",
  "gsnake_wasm_bg.js",
  "gsnake_wasm_bg.wasm.d.ts",
];

console.log("[detect-local-deps] Checking dependency context...");
console.log(`[detect-local-deps] FORCE_GIT_DEPS: ${forceGitDeps}`);
console.log(`[detect-local-deps] Root .git exists: ${existsSync(rootGitPath)}`);
console.log(
  `[detect-local-deps] Workspace .git exists: ${existsSync(workspaceGitPath)}`,
);
console.log(
  `[detect-local-deps] gsnake-core exists: ${existsSync(gsnakeCoreCargoPath)}`,
);
console.log(`[detect-local-deps] WASM pkg exists: ${existsSync(wasmPkgPath)}`);

const ensureVendorWasm = async () => {
  const missingFiles = vendorFiles.filter(
    (file) => !existsSync(join(vendorDir, file)),
  );

  if (missingFiles.length === 0) {
    console.log("[detect-local-deps] ✓ Vendor WASM already present");
    return;
  }

  console.log(
    "[detect-local-deps] Downloading prebuilt WASM package for standalone mode...",
  );
  mkdirSync(vendorDir, { recursive: true });

  for (const file of vendorFiles) {
    const url = `${vendorBaseUrl}/${file}`;
    const destination = join(vendorDir, file);
    console.log(`[detect-local-deps]   - ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `[detect-local-deps] Failed to download ${url}: ${response.status}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(destination, buffer);
  }

  console.log("[detect-local-deps] ✓ Vendor WASM downloaded");
};

/**
 * @param {string} targetDependency
 * @param {string} label
 */
const updateDependency = (targetDependency, label) => {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const currentDep = packageJson.dependencies["gsnake-wasm"];

  if (currentDep !== targetDependency) {
    console.log(
      `[detect-local-deps] Updating package.json: ${currentDep} → ${targetDependency}`,
    );
    packageJson.dependencies["gsnake-wasm"] = targetDependency;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
    console.log(`[detect-local-deps] ✓ package.json updated for ${label}`);
  } else {
    console.log(
      `[detect-local-deps] ✓ package.json already configured for ${label}`,
    );
  }
};

const run = async () => {
  if (isRootRepo) {
    console.log(
      "[detect-local-deps] ✓ Root repository detected - using local WASM",
    );

    // Verify the WASM package exists
    if (!existsSync(wasmPkgPath)) {
      console.error(
        "[detect-local-deps] ⚠️  WARNING: Local WASM package not found!",
      );
      console.error(
        "[detect-local-deps] Run: cd ../../../gsnake-core/engine/bindings/wasm && wasm-pack build",
      );
      process.exit(1);
    }

    // Ensure package.json uses local path
    updateDependency(localPathDependency, "local development");
    return;
  }

  console.log(
    "[detect-local-deps] ⚠️  Standalone mode detected - using vendored WASM",
  );
  console.log(
    "[detect-local-deps] Standalone mode will fetch prebuilt WASM from main branch",
  );

  await ensureVendorWasm();
  updateDependency(vendorDependency, "standalone mode");
};

run()
  .then(() => {
    console.log("[detect-local-deps] Done");
  })
  .catch((error) => {
    console.error(String(error));
    process.exit(1);
  });
