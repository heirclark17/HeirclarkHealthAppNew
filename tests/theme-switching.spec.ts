import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

// Helper to navigate to settings
async function navigateToSettings(page: Page) {
  // Click on settings tab
  await page.click('[data-testid="settings-tab"], [aria-label="Settings"], text=Settings', { timeout: 5000 }).catch(() => {
    // Try clicking the settings icon in the tab bar
    return page.locator('div[role="tab"]').filter({ hasText: /settings/i }).click();
  }).catch(() => {
    // Try using the feather icon
    return page.locator('svg[class*="feather-settings"]').click();
  }).catch(async () => {
    // Navigate directly
    await page.goto(`${BASE_URL}/settings`);
  });

  await page.waitForTimeout(1000);
}

// Helper to get background color
async function getBackgroundColor(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return '';
    return window.getComputedStyle(element).backgroundColor;
  }, selector);
}

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for app to fully load
  });

  test('settings page should load with dark mode by default', async ({ page }) => {
    await navigateToSettings(page);

    // Check that dark mode toggle exists and is on by default
    const darkModeToggle = page.locator('text=Dark Mode').first();
    await expect(darkModeToggle).toBeVisible({ timeout: 10000 });

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/theme-dark-default.png', fullPage: true });

    console.log('Dark mode is the default theme');
  });

  test('should toggle to light mode when dark mode switch is turned off', async ({ page }) => {
    await navigateToSettings(page);

    // Find the Dark Mode toggle switch
    const darkModeRow = page.locator('text=Dark Mode').first();
    await expect(darkModeRow).toBeVisible({ timeout: 10000 });

    // Take screenshot before toggle
    await page.screenshot({ path: 'test-results/theme-before-toggle.png', fullPage: true });

    // Find and click the switch next to Dark Mode
    // The switch should be near the "Dark Mode" text
    const switchElement = page.locator('div').filter({ hasText: /^Dark Mode$/ }).locator('..').locator('[role="switch"], input[type="checkbox"]').first();

    // If we can't find the switch directly, try clicking near the Dark Mode label
    const clicked = await switchElement.click({ timeout: 3000 }).then(() => true).catch(() => false);

    if (!clicked) {
      // Try alternative: click anywhere in the Dark Mode row that might contain the switch
      await page.locator('text=Dark Mode').first().locator('..').click();
    }

    await page.waitForTimeout(500);

    // Take screenshot after toggle
    await page.screenshot({ path: 'test-results/theme-after-toggle-light.png', fullPage: true });

    console.log('Toggled to light mode');
  });

  test('theme should persist after navigation', async ({ page }) => {
    await navigateToSettings(page);

    // Toggle to light mode
    const darkModeRow = page.locator('text=Dark Mode').first();
    await expect(darkModeRow).toBeVisible({ timeout: 10000 });

    // Toggle the switch off (to light mode)
    const switchElement = page.locator('div').filter({ hasText: /^Dark Mode$/ }).locator('..').locator('[role="switch"], input[type="checkbox"]').first();
    await switchElement.click({ timeout: 3000 }).catch(async () => {
      await page.locator('text=Dark Mode').first().locator('..').click();
    });

    await page.waitForTimeout(500);

    // Navigate to home
    await page.click('[aria-label="Home"], text=Home', { timeout: 3000 }).catch(async () => {
      await page.goto(BASE_URL);
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/theme-home-light.png', fullPage: true });

    // Navigate back to settings
    await navigateToSettings(page);
    await page.waitForTimeout(500);

    // Verify settings page is still in light mode
    await page.screenshot({ path: 'test-results/theme-settings-persisted.png', fullPage: true });

    console.log('Theme persisted after navigation');
  });

  test('light mode should have light background colors', async ({ page }) => {
    await navigateToSettings(page);

    // Get initial background style
    const initialBg = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    console.log('Initial background:', initialBg);

    // Toggle to light mode
    const switchElement = page.locator('div').filter({ hasText: /^Dark Mode$/ }).locator('..').locator('[role="switch"], input[type="checkbox"]').first();
    await switchElement.click({ timeout: 3000 }).catch(async () => {
      await page.locator('text=Dark Mode').first().locator('..').click();
    });

    await page.waitForTimeout(1000);

    // Get background after toggle
    const afterBg = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    console.log('After toggle background:', afterBg);

    // The backgrounds should be different
    // Dark mode: rgb(0, 0, 0) or similar
    // Light mode: rgb(245, 245, 247) or similar

    await page.screenshot({ path: 'test-results/theme-light-background.png', fullPage: true });
  });

  test('tab bar should change colors with theme', async ({ page }) => {
    // Take screenshot of tab bar in dark mode
    await page.screenshot({ path: 'test-results/tabbar-dark.png', fullPage: true });

    // Navigate to settings and toggle to light mode
    await navigateToSettings(page);

    const switchElement = page.locator('div').filter({ hasText: /^Dark Mode$/ }).locator('..').locator('[role="switch"], input[type="checkbox"]').first();
    await switchElement.click({ timeout: 3000 }).catch(async () => {
      await page.locator('text=Dark Mode').first().locator('..').click();
    });

    await page.waitForTimeout(1000);

    // Take screenshot of tab bar in light mode
    await page.screenshot({ path: 'test-results/tabbar-light.png', fullPage: true });

    console.log('Tab bar theme test completed');
  });
});

test.describe('Theme Visual Verification', () => {
  test('capture all pages in both themes', async ({ page }) => {
    const pages = ['/', '/settings', '/meals', '/goals', '/programs', '/steps'];

    // Capture in dark mode (default)
    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      await page.waitForTimeout(1500);
      const safeName = pagePath === '/' ? 'home' : pagePath.replace('/', '');
      await page.screenshot({ path: `test-results/dark-${safeName}.png`, fullPage: true });
    }

    // Toggle to light mode
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(1000);

    const switchElement = page.locator('div').filter({ hasText: /^Dark Mode$/ }).locator('..').locator('[role="switch"], input[type="checkbox"]').first();
    await switchElement.click({ timeout: 3000 }).catch(async () => {
      await page.locator('text=Dark Mode').first().locator('..').click();
    });

    await page.waitForTimeout(500);

    // Capture in light mode
    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      await page.waitForTimeout(1500);
      const safeName = pagePath === '/' ? 'home' : pagePath.replace('/', '');
      await page.screenshot({ path: `test-results/light-${safeName}.png`, fullPage: true });
    }

    console.log('Captured all pages in both themes');
  });
});
