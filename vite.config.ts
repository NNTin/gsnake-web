import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// Declare process to avoid TypeScript errors since @types/node is not installed
declare const process: { env: Record<string, string | undefined> }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    svelte()
  ],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 3000,
    strictPort: true,
    fs: {
      allow: ['.', '../gsnake-core/engine/bindings/wasm/pkg']
    }
  },
  optimizeDeps: {
    exclude: ['gsnake-wasm']
  }
})
