import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
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
    outDir: 'dist',
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
      }
    }
  }
})
