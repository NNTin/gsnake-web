import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [
    wasm(),
    svelte({
      compilerOptions: {
        runes: false,
        compatibility: {
          componentApi: 4,
        },
      },
    }),
  ],
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json", "html", "lcov"],
      reportsDirectory: "coverage",
      include: [
        "App.svelte",
        "components/**/*.svelte",
        "engine/**/*.ts",
        "stores/**/*.ts",
      ],
      exclude: ["**/*.d.ts", "tests/**", "**/*.test.ts", "metadata.json"],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 30,
        branches: 45,
      },
    },
  },
});
