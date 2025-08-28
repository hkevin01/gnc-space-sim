import { test as base, expect } from '@playwright/test';

// Extend the base test to include custom fixtures
export const test = base.extend({
  // Custom fixture for console error tracking
  page: async ({ page }, use) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    await use(page);

    // Filter out expected/benign errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('WebGL') &&
      !error.includes('THREE.WebGLRenderer') &&
      !error.includes('ResizeObserver') &&
      !error.includes('Non-passive event listener')
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors detected:', criticalErrors);
      // Uncomment the next line if you want to fail tests on console errors
      // expect(criticalErrors).toHaveLength(0);
    }
  }
});

export { expect };
