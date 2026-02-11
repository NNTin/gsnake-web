#!/usr/bin/env node

import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptPath = join(
  __dirname,
  "..",
  "packages",
  "gsnake-web-app",
  "scripts",
  "detect-local-deps.js",
);

const result = spawnSync("node", [scriptPath], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(String(result.error));
  process.exit(1);
}

process.exit(result.status ?? 0);
