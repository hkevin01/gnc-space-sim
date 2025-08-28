import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use node to avoid requiring jsdom for simple unit tests
    environment: 'node',
    globals: true,
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx'
    ],
    exclude: [
      'tests/**', // exclude Playwright and other E2E tests from Vitest
      'node_modules/**',
      'dist/**'
    ]
  }
})
