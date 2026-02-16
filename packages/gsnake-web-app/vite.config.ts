import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import wasm from "vite-plugin-wasm";

// Declare process to avoid TypeScript errors since @types/node is not installed
declare const process: { env: Record<string, string | undefined> };

// https://vitejs.dev/config/
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
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    port: 3000,
    strictPort: true,
    fs: {
      allow: [
        ".",
        "../../../contracts",
        "../../../gsnake-core/engine/bindings/wasm/pkg",
        "../gsnake-web-ui",
      ],
    },
  },
  optimizeDeps: {
    exclude: ["gsnake-wasm"],
  },
});
