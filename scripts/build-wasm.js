#!/usr/bin/env node
/**
 * Conditional WASM build script for gsnake-web
 *
 * In root repo mode: Builds WASM from local gsnake-core
 * In standalone mode: Expects prebuilt WASM from git dependency (no build needed)
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const forceGitDeps = process.env.FORCE_GIT_DEPS === '1' || process.env.FORCE_GIT_DEPS === 'true';

// Check for root repository context
const rootGitPath = join(projectRoot, '..', '.git');
const gsnakeCoreCargoPath = join(projectRoot, '..', 'gsnake-core', 'Cargo.toml');
const buildWasmScript = join(projectRoot, '..', 'scripts', 'build_wasm.py');

const isRootRepo = !forceGitDeps && existsSync(rootGitPath) && existsSync(gsnakeCoreCargoPath);

console.log('[build-wasm] Checking build context...');
console.log(`[build-wasm] FORCE_GIT_DEPS: ${forceGitDeps}`);

if (isRootRepo) {
  console.log('[build-wasm] ✓ Root repository detected - building WASM from local gsnake-core');

  if (!existsSync(buildWasmScript)) {
    console.error('[build-wasm] ❌ ERROR: build_wasm.py not found at', buildWasmScript);
    process.exit(1);
  }

  // Run the WASM build script
  const result = spawnSync('python3', [buildWasmScript], {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  if (result.error) {
    console.error('[build-wasm] ❌ ERROR: Failed to execute build_wasm.py:', result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error('[build-wasm] ❌ ERROR: build_wasm.py exited with status', result.status);
    process.exit(result.status);
  }

  console.log('[build-wasm] ✓ WASM build completed successfully');
} else {
  if (forceGitDeps) {
    console.log('[build-wasm] FORCE_GIT_DEPS set - skipping local WASM build');
  }
  console.log('[build-wasm] ⚠️  Standalone mode detected - skipping WASM build');
  console.log('[build-wasm] Expecting prebuilt WASM from git dependency');
  console.log('[build-wasm] ✓ No build required');
}
