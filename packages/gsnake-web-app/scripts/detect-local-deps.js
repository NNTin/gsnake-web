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
const packageLockPath = join(workspaceRoot, "package-lock.json");

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
const localLockResolved = "../gsnake-core/engine/bindings/wasm/pkg";
const vendorLockResolved = "vendor/gsnake-wasm";
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

const rustModelsUrl =
  "https://raw.githubusercontent.com/NNTin/gSnake/main/gsnake-core/engine/core/src/models.rs";
const rustModelsVendorPath = join(
  workspaceRoot,
  "vendor",
  "gsnake-core-src",
  "models.rs",
);

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

const ensureVendorRustModels = async () => {
  console.log(
    "[detect-local-deps] Downloading models.rs for standalone contract tests...",
  );
  mkdirSync(join(workspaceRoot, "vendor", "gsnake-core-src"), {
    recursive: true,
  });

  const response = await fetch(rustModelsUrl);
  if (!response.ok) {
    throw new Error(
      `[detect-local-deps] Failed to download ${rustModelsUrl}: ${response.status}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(rustModelsVendorPath, buffer);
  console.log("[detect-local-deps] ✓ models.rs downloaded");
};

/**
 * @param {string} targetDependency
 * @param {string} label
 * @param {string} targetResolved
 */
const updateDependency = (targetDependency, label, targetResolved) => {
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

  if (!existsSync(packageLockPath)) {
    console.log(
      "[detect-local-deps] package-lock.json not found, skipping lock update",
    );
    return;
  }

  const packageLock = JSON.parse(readFileSync(packageLockPath, "utf8"));
  const packages = packageLock.packages ?? {};
  let lockChanged = false;

  const appPackage = packages["packages/gsnake-web-app"];
  if (!appPackage || !appPackage.dependencies) {
    console.warn(
      "[detect-local-deps] Unexpected package-lock.json format for gsnake-web-app; skipping lock update",
    );
  } else if (appPackage.dependencies["gsnake-wasm"] !== targetDependency) {
    appPackage.dependencies["gsnake-wasm"] = targetDependency;
    lockChanged = true;
  }

  const nodeModule = packages["node_modules/gsnake-wasm"] ?? {};
  if (nodeModule.resolved !== targetResolved || nodeModule.link !== true) {
    nodeModule.resolved = targetResolved;
    nodeModule.link = true;
    packages["node_modules/gsnake-wasm"] = nodeModule;
    lockChanged = true;
  }

  if (!packages[targetResolved]) {
    const template =
      packages[localLockResolved] ?? packages[vendorLockResolved] ?? null;
    packages[targetResolved] = template
      ? JSON.parse(JSON.stringify(template))
      : { name: "gsnake-wasm", version: "0.1.0" };
    lockChanged = true;
  }

  if (lockChanged) {
    packageLock.packages = packages;
    writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2) + "\n");
    console.log(`[detect-local-deps] ✓ package-lock.json updated for ${label}`);
  } else {
    console.log(
      `[detect-local-deps] ✓ package-lock.json already configured for ${label}`,
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
    updateDependency(
      localPathDependency,
      "local development",
      localLockResolved,
    );
    return;
  }

  console.log(
    "[detect-local-deps] ⚠️  Standalone mode detected - using vendored WASM",
  );
  console.log(
    "[detect-local-deps] Standalone mode will fetch prebuilt WASM from main branch",
  );

  await ensureVendorWasm();
  await ensureVendorRustModels();
  updateDependency(vendorDependency, "standalone mode", vendorLockResolved);
};

run()
  .then(() => {
    console.log("[detect-local-deps] Done");
  })
  .catch((error) => {
    console.error(String(error));
    process.exit(1);
  });
