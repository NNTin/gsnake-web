import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json", "html", "lcov"],
      reportsDirectory: "coverage",
      all: true,
      include: [
        "App.svelte",
        "components/**/*.svelte",
        "engine/**/*.ts",
        "stores/**/*.ts",
      ],
      exclude: ["**/*.d.ts", "tests/**", "**/*.test.ts", "metadata.json"],
      thresholds: {
        lines: 12,
        statements: 12,
        functions: 30,
        branches: 45,
      },
    },
  },
});
