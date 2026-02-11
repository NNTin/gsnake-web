#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import { compile } from "svelte/compiler";
import chokidar from "chokidar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, "..");
const componentsDir = join(packageRoot, "components");
const distDir = join(packageRoot, "dist");
const componentNames = ["Modal", "Overlay"];
const watchMode = process.argv.includes("--watch");

function buildComponent(name) {
  const inputPath = join(componentsDir, `${name}.svelte`);
  const outputPath = join(distDir, `${name}.js`);
  const source = readFileSync(inputPath, "utf8");
  const compiled = compile(source, {
    filename: inputPath,
    generate: "client",
    css: "injected",
    dev: false,
    runes: false,
    compatibility: {
      componentApi: 4,
    },
  });

  writeFileSync(outputPath, compiled.js.code + "\n");
  console.log(`[gsnake-web-ui] built ${name}`);
}

function buildAll() {
  mkdirSync(distDir, { recursive: true });
  for (const name of componentNames) {
    buildComponent(name);
  }
}

buildAll();

if (watchMode) {
  const watcher = chokidar.watch(
    componentNames.map((name) => join(componentsDir, `${name}.svelte`)),
    { ignoreInitial: true },
  );

  watcher.on("change", (filePath) => {
    const name = basename(filePath).replace(/\.svelte$/, "");
    if (name && componentNames.includes(name)) {
      try {
        buildComponent(name);
      } catch (error) {
        console.error(String(error));
      }
    }
  });

  console.log("[gsnake-web-ui] watching component changes");
}
