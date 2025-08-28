import { expect, test } from '@playwright/test';

test.describe('GNC Space Sim Application', () => {
  test('loads the main application and shows mission controls', async ({ page }) => {
    await page.goto('/');

    // Check that the page title contains GNC
    await expect(page).toHaveTitle(/GNC/i);

    // Look for key mission elements that should be visible
    await expect(page.getByText(/Mission Phase/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Altitude/i)).toBeVisible({ timeout: 10000 });

    // Check for essential space sim elements
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
  });

  test('navigation and basic interaction', async ({ page }) => {
    await page.goto('/');

    // Wait for the 3D scene to load
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });

    // Test basic interactions (if there are any interactive elements)
    // This is a placeholder - adjust based on actual UI elements
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });

    // Check that the application responds to interaction
    await page.waitForTimeout(1000);
  });

  test('performance - no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (if any)
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('WebGL') &&
      !error.includes('THREE.WebGLRenderer')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('responsive design - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page).toHaveTitle(/GNC/i);
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
  });
});
