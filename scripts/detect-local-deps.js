#!/usr/bin/env node
/**
 * Dependency detection script for gsnake-web
 *
 * Detects whether gsnake-web is running in root repository or standalone mode,
 * and ensures the correct dependency path is configured.
 *
 * Root repo mode: Uses local file: path to sibling gsnake-core
 * Standalone mode: Requires prebuilt WASM (committed in gsnake-core)
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const packageJsonPath = join(projectRoot, 'package.json');

// Check for root repository context
const rootGitPath = join(projectRoot, '..', '.git');
const gsnakeCoreCargoPath = join(projectRoot, '..', 'gsnake-core', 'Cargo.toml');
const wasmPkgPath = join(projectRoot, '..', 'gsnake-core', 'engine', 'bindings', 'wasm', 'pkg', 'package.json');

const isRootRepo = existsSync(rootGitPath) && existsSync(gsnakeCoreCargoPath);
const localPathDependency = 'file:../gsnake-core/engine/bindings/wasm/pkg';

console.log('[detect-local-deps] Checking dependency context...');
console.log(`[detect-local-deps] Root .git exists: ${existsSync(rootGitPath)}`);
console.log(`[detect-local-deps] gsnake-core exists: ${existsSync(gsnakeCoreCargoPath)}`);
console.log(`[detect-local-deps] WASM pkg exists: ${existsSync(wasmPkgPath)}`);

if (isRootRepo) {
  console.log('[detect-local-deps] ✓ Root repository detected - using local WASM');

  // Verify the WASM package exists
  if (!existsSync(wasmPkgPath)) {
    console.error('[detect-local-deps] ⚠️  WARNING: Local WASM package not found!');
    console.error('[detect-local-deps] Run: cd ../gsnake-core/engine/bindings/wasm && wasm-pack build');
    process.exit(1);
  }

  // Ensure package.json uses local path
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const currentDep = packageJson.dependencies['gsnake-wasm'];

  if (currentDep !== localPathDependency) {
    console.log(`[detect-local-deps] Updating package.json: ${currentDep} → ${localPathDependency}`);
    packageJson.dependencies['gsnake-wasm'] = localPathDependency;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('[detect-local-deps] ✓ package.json updated');
  } else {
    console.log('[detect-local-deps] ✓ package.json already configured for local development');
  }
} else {
  console.log('[detect-local-deps] ⚠️  Standalone mode detected');
  console.log('[detect-local-deps] Note: npm does not support git dependencies for subdirectories');
  console.log('[detect-local-deps] For standalone builds:');
  console.log('[detect-local-deps]   1. Clone gsnake repo');
  console.log('[detect-local-deps]   2. Use local file: path dependency (current configuration)');
  console.log('[detect-local-deps]   3. Or publish gsnake-wasm to npm registry');

  // In standalone mode, we keep the current dependency as-is
  // The user needs to have the WASM package available locally
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const currentDep = packageJson.dependencies['gsnake-wasm'];
  console.log(`[detect-local-deps] Current dependency: ${currentDep}`);

  if (currentDep.startsWith('file:')) {
    const depPath = join(projectRoot, currentDep.replace('file:', ''));
    if (!existsSync(join(depPath, 'package.json'))) {
      console.error('[detect-local-deps] ❌ ERROR: WASM package not found at', depPath);
      console.error('[detect-local-deps] Standalone builds require local WASM artifacts');
      process.exit(1);
    } else {
      console.log('[detect-local-deps] ✓ WASM package found');
    }
  }
}

console.log('[detect-local-deps] Done');
