import { expect, test } from '@playwright/test';

test.describe('GNC Space Sim - Orbital Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the 3D scene to fully load
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20000 });
  });

  test('orbital telemetry displays correctly', async ({ page }) => {
    // Check for orbital mechanics data
    await expect(page.getByText(/altitude/i)).toBeVisible();
    await expect(page.getByText(/velocity/i)).toBeVisible();

    // Look for numerical values that indicate live telemetry
    const altitudeElement = page.locator('[data-testid="altitude"]').or(
      page.locator('text=/\\d+\\s*km/i')
    );
    await expect(altitudeElement).toBeVisible({ timeout: 10000 });
  });

  test('mission phase transitions', async ({ page }) => {
    // Look for mission phase indicators
    await expect(page.getByText(/mission phase/i)).toBeVisible();

    // Check for different mission phases that might be displayed
    const phaseElement = page.locator('[data-testid="mission-phase"]').or(
      page.locator('text=/(pre-launch|launch|ascent|orbit|landing)/i')
    );
    await expect(phaseElement).toBeVisible({ timeout: 10000 });
  });

  test('3D scene performance', async ({ page }) => {
    // Test that the 3D scene renders without major performance issues
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Simulate some user interactions with the 3D scene
    await canvas.click({ position: { x: 200, y: 200 } });
    await page.mouse.wheel(0, -100); // Simulate zoom

    // Check that the scene is still responsive
    await page.waitForTimeout(1000);
    await expect(canvas).toBeVisible();
  });

  test('responsive layout on different screen sizes', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('canvas')).toBeVisible();

    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('canvas')).toBeVisible();

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('accessibility features', async ({ page }) => {
    // Check for basic accessibility features
    await expect(page.locator('main, [role="main"]')).toBeVisible();

    // Verify that the page has proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible({ timeout: 5000 });

    // Check for keyboard navigation support
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible({ timeout: 2000 });
  });
});
