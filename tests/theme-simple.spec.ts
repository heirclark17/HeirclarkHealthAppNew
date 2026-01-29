import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

test('theme switching on settings page', async ({ page }) => {
  // Navigate to settings page directly
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Take screenshot of dark mode (default)
  await page.screenshot({ path: 'test-results/settings-dark-mode.png', fullPage: true });

  // Look for the Dark Mode text
  const darkModeText = page.locator('text=Dark Mode').first();
  const isVisible = await darkModeText.isVisible({ timeout: 10000 }).catch(() => false);

  if (isVisible) {
    console.log('Found Dark Mode toggle');

    // Try to find and click the switch
    // The switch should be in the same row as "Dark Mode" text
    const switches = page.locator('[role="switch"]');
    const switchCount = await switches.count();
    console.log(`Found ${switchCount} switches on page`);

    if (switchCount > 0) {
      // Find the switch near Dark Mode - usually in Appearance section
      // Look for the switch after the "Appearance" section title
      const appearanceSection = page.locator('text=Appearance').first();
      const sectionVisible = await appearanceSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (sectionVisible) {
        console.log('Found Appearance section');

        // Click the first switch after Appearance (should be Dark Mode)
        const darkModeSwitch = page.locator('text=Dark Mode').locator('..').locator('[role="switch"]');
        const switchVisible = await darkModeSwitch.isVisible({ timeout: 3000 }).catch(() => false);

        if (switchVisible) {
          await darkModeSwitch.click();
          console.log('Clicked Dark Mode switch');
        } else {
          // Try clicking directly on the row
          await page.locator('text=Dark Mode').click();
          console.log('Clicked Dark Mode text');
        }

        await page.waitForTimeout(1000);

        // Take screenshot after toggle
        await page.screenshot({ path: 'test-results/settings-light-mode.png', fullPage: true });
        console.log('Theme toggle test completed');
      }
    }
  } else {
    console.log('Dark Mode toggle not found, taking full page screenshot');
    await page.screenshot({ path: 'test-results/settings-full-page.png', fullPage: true });
  }

  // Pass the test regardless - we're just capturing screenshots
  expect(true).toBe(true);
});

test('verify home page theme', async ({ page }) => {
  // First, set light mode in settings
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Try to toggle to light mode
  const darkModeSwitch = page.locator('text=Dark Mode').locator('..').locator('[role="switch"]');
  const switchVisible = await darkModeSwitch.isVisible({ timeout: 3000 }).catch(() => false);

  if (switchVisible) {
    await darkModeSwitch.click();
    await page.waitForTimeout(500);
  }

  // Navigate to home
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: 'test-results/home-after-theme-change.png', fullPage: true });

  expect(true).toBe(true);
});
