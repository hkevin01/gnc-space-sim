import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
  '@gnc/core': new URL('../../packages/gnc-core/src', import.meta.url).pathname,
  '@gnc/ui': new URL('../../packages/ui-components/src', import.meta.url).pathname,
  '@gnc/scenarios': new URL('../../packages/mission-scenarios/src', import.meta.url).pathname
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
    cors: true,
    // Allow serving files from the monorepo root (packages/*)
    fs: {
      allow: ['..', '/workspace', '/workspaces/gnc-space-sim']
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onwarn(warning: any, warn: any) {
        // Suppress chunk size warnings for Three.js
        if (warning.code === 'WARN_CHUNK_SIZE_EXCEEDED') return
        warn(warning)
      }
    }
  }
})
