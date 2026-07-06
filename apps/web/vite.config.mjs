import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: false,
    cors: true,
    proxy: {
      '/api/horizons': {
        target: 'https://ssd.jpl.nasa.gov',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/horizons/, '/api/horizons.api')
      }
    }
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/node_modules/three/')) {
            return 'vendor-three-core'
          }

          if (id.includes('@react-three/fiber')) {
            return 'vendor-r3f'
          }

          if (id.includes('@react-three/drei')) {
            return 'vendor-drei'
          }

          if (id.includes('@react-three/postprocessing') || id.includes('/node_modules/postprocessing/')) {
            return 'vendor-postprocessing'
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
