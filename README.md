# gsnake-web

Svelte + Vite frontend for gSnake. Uses the local `gsnake-wasm` package built from `gsnake-core`.

## Standalone Build Instructions

This package uses automatic dependency detection to work in both root repository and standalone modes.

### Building Standalone (Without Sibling Repositories)

When building `gsnake-web` as a standalone package:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nntin/gsnake.git
   cd gsnake/gsnake-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   The `preinstall` script will automatically detect standalone mode and configure the git dependency to fetch prebuilt WASM from the `main` branch.

3. **Build and test:**
   ```bash
   npm run check  # Type checking and linting
   npm test       # Run tests
   npm run build  # Build for production
   ```

**Requirements:**
- Node.js 18+ and npm
- Git (for fetching the WASM dependency)
- Prebuilt WASM artifacts must be available in the `main` branch at `gsnake-core/engine/bindings/wasm/pkg`

**What happens in standalone mode:**
- The git dependency `git+https://github.com/nntin/gsnake.git#main:gsnake-core/engine/bindings/wasm/pkg` is used
- Prebuilt WASM artifacts are fetched from the main branch
- No local Rust compilation is required
- The `build-wasm.js` script detects standalone mode and skips WASM rebuilding

### Auto-Detection Behavior

The detection script (`scripts/detect-local-deps.js`) runs automatically before every `npm install` and configures the appropriate dependency:

**Detection Logic:**
1. Checks if `../.git` exists (root repository)
2. Checks if `../gsnake-core/Cargo.toml` exists (sibling submodule)
3. If both exist → **Root Repository Mode**
4. Otherwise → **Standalone Mode**

**Root Repository Mode:**
- Automatically uses `file:../gsnake-core/engine/bindings/wasm/pkg` for local development
- Provides fast hot-reloading with local changes
- Runs WASM build scripts before building
- Requires building WASM locally: `cd ../gsnake-core/engine/bindings/wasm && wasm-pack build`

**Standalone Mode:**
- Automatically uses git dependency to fetch prebuilt WASM from `main` branch
- No local Rust toolchain required
- No WASM build scripts are executed
- Faster setup for frontend-only development

The script automatically updates `package.json` to reflect the detected mode, ensuring the correct dependency source is always used.

## Setup

```bash
npm install
```

## Refresh wasm package

From this directory:

```bash
npm run build:wasm
```

## Contract Test Fixtures

The contract tests in `tests/contract/fixtures.test.ts` validate that TypeScript types match the Rust-generated JSON structure. Test fixtures are located in `tests/fixtures/` and are duplicated from `gsnake-core/engine/core/tests/fixtures` to enable standalone builds.

**Fixtures included:**
- `frame.json` - Sample game frame with grid and state
- `level.json` - Sample level definition
- `error-*.json` - Contract error examples for all error kinds

These fixtures ensure type safety between the Rust WASM backend and TypeScript frontend. If the Rust contract changes, these fixtures should be updated to match.

## CI/CD

This submodule has its own GitHub Actions workflow at `.github/workflows/ci.yml` to validate standalone builds.

### Testing CI Locally with nektos/act

You can test the CI workflow locally using [nektos/act](https://github.com/nektos/act):

```bash
# Install act (if not already installed)
# Ubuntu/Debian: sudo apt install act
# macOS: brew install act

# Test the build job
cd gsnake-web
act -j build

# Test the typecheck job
act -j typecheck

# Test the test job
act -j test

# List all available jobs
act -l
```

**Note:** act requires Docker and uses it to simulate GitHub Actions runners. On first run, it will prompt you to select a Docker image size (recommend the medium image: `ghcr.io/catthehacker/ubuntu:act-latest`).

**Known Limitations:**
- Cache actions may not work exactly as on GitHub Actions
- Some network operations may differ from GitHub's environment
- `workflow_dispatch` trigger cannot be tested with act
- The preinstall script will detect standalone mode when running in act

For simple workflow validation without running jobs, use:
```bash
act -n  # dry run mode
```

## Troubleshooting

### Standalone Build Issues

**Problem: `npm install` fails with "Cannot find module 'gsnake-wasm'"`**
- **Cause:** Git dependency may not have prebuilt WASM artifacts on the main branch
- **Solution:** Verify that `gsnake-core/engine/bindings/wasm/pkg` exists in the main branch on GitHub
- **Workaround:** Clone the full repository and build in root repo mode instead

**Problem: Type errors after `npm install` in standalone mode**
- **Cause:** Prebuilt WASM may be out of sync with TypeScript types
- **Solution:** Rebuild type definitions: `npm run build:types` (requires root repo context)
- **Alternative:** Update to the latest main branch which should have synchronized types

**Problem: Detection script switches to wrong mode**
- **Cause:** Unexpected directory structure or git configuration
- **Solution:** Manually verify detection by running `node scripts/detect-local-deps.js`
- **Check:** Ensure `../.git` and `../gsnake-core/Cargo.toml` exist for root repo mode
- **Fix:** If needed, manually edit `package.json` to set the correct dependency path

**Problem: Tests fail in standalone mode**
- **Cause:** Test fixtures or WASM version mismatch
- **Solution:** Ensure you're using the latest version from main branch
- **Note:** Some tests may require local WASM builds; check test output for details

**Problem: Build fails with "WASM not found" in root repo mode**
- **Cause:** Local WASM package hasn't been built yet
- **Solution:** Build the WASM package first:
  ```bash
  cd ../gsnake-core/engine/bindings/wasm
  wasm-pack build --target web
  ```
- **Verify:** Check that `../gsnake-core/engine/bindings/wasm/pkg/package.json` exists

### Auto-Detection Issues

**Detection script always selects standalone mode in root repo:**
- Verify both `../.git` and `../gsnake-core/Cargo.toml` exist
- Run detection script manually: `node scripts/detect-local-deps.js`
- Check script output for specific missing paths

**Detection script always selects root repo mode in standalone:**
- This shouldn't happen in a clean clone
- Check for unexpected `.git` files in parent directories
- Try cloning to a fresh directory

## Common commands

```bash
# Dev server
npm run dev

# Type check
npm run check

# Tests
npm test

# Build (runs tests, generates TS types, builds wasm, then Vite)
npm run build

# Preview production build
npm run preview
```
