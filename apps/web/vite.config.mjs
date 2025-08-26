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
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress chunk size warnings for Three.js
        if (warning.code === 'WARN_CHUNK_SIZE_EXCEEDED') return
        warn(warning)
      }
    }
  }
})
