import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: false,
    cors: true,
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('three') || id.includes('@react-three')) {
            return 'vendor-three'
          }

          if (id.includes('plotly.js-dist-min')) {
            return 'vendor-plotly'
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'vendor-react'
          }

          return 'vendor'
        }
      },
      onwarn(warning, warn) {
        // Suppress chunk size warnings for Three.js
        if (warning.code === 'WARN_CHUNK_SIZE_EXCEEDED') return
        warn(warning)
      }
    }
  }
})
