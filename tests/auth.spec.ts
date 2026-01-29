import { test, expect, Page } from '@playwright/test';

// Helper function to wait for React Native Web to fully render
async function waitForAppReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.innerHTML.length > 500;
  }, { timeout: 15000 });
  await page.waitForTimeout(1000);
}

test.describe('Authentication Flow', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:19006/');
    await waitForAppReady(page);

    // Should show HEIRCLARK branding
    const logo = page.locator('text=HEIRCLARK');
    await expect(logo).toBeVisible({ timeout: 10000 });

    // Should show Welcome Back title
    const title = page.locator('text=Welcome');
    await expect(title).toBeVisible({ timeout: 10000 });

    // Should show Sign in with Apple button (fallback for web)
    const signInButton = page.locator('text=/Sign in with Apple/i');
    await expect(signInButton).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/auth-login-page.png', fullPage: true });
  });

  test('should show feature icons on login page', async ({ page }) => {
    await page.goto('http://localhost:19006/');
    await waitForAppReady(page);

    // Should show feature categories
    const content = await page.content();
    expect(content).toContain('Nutrition');
    expect(content).toContain('Training');
    expect(content).toContain('Goals');

    await page.screenshot({ path: 'test-results/auth-features.png', fullPage: true });
  });

  test('should redirect to login when accessing tabs without auth', async ({ page }) => {
    // Increase timeout for this specific test
    test.setTimeout(60000);

    // Try to access the tabs directly
    await page.goto('http://localhost:19006/(tabs)');

    // Wait for redirect to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check current URL - should be redirected to root
    const url = page.url();
    console.log('Current URL after trying to access tabs:', url);

    // The URL should NOT contain (tabs) if redirect worked
    expect(url).not.toContain('(tabs)');
  });

  test('should have proper disclaimer text', async ({ page }) => {
    await page.goto('http://localhost:19006/');
    await waitForAppReady(page);

    // Should show Terms of Service mention
    const disclaimer = page.locator('text=/Terms of Service/i');
    await expect(disclaimer).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/auth-disclaimer.png', fullPage: true });
  });
});

test.describe('Settings Page Authentication UI', () => {
  test('settings page should load (when auth check allows)', async ({ page }) => {
    // Navigate to settings
    await page.goto('http://localhost:19006/(tabs)/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of whatever state we're in
    await page.screenshot({ path: 'test-results/auth-settings.png', fullPage: true });
  });
});
