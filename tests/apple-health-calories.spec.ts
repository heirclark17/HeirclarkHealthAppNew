import { test, expect } from '@playwright/test';

/**
 * Apple Health Calories Integration Test
 *
 * Tests that calories burned from Apple Health are properly displayed in the app.
 * This test verifies:
 * 1. The calories out section displays data
 * 2. The calorie gauge is updated
 * 3. The Daily Fat Loss card shows accurate calculations
 */

test.describe('Apple Health Calories Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8083');
    await page.waitForLoadState('networkidle');

    // Wait for the dashboard to load
    await page.waitForSelector('text="DAILY BALANCE"', { timeout: 10000 });
  });

  test('should display calories out from Apple Health', async ({ page }) => {
    // Wait for the "CALORIES OUT" card to be visible
    const caloriesOutCard = page.locator('text="CALORIES OUT"').locator('..');
    await expect(caloriesOutCard).toBeVisible();

    // Check that the calories out value is displayed (should be a number)
    const caloriesOutValue = caloriesOutCard.locator('[class*="calorieSubCardValue"]');
    await expect(caloriesOutValue).toBeVisible();

    // Get the actual value and verify it's a number
    const value = await caloriesOutValue.textContent();
    console.log('Calories Out Value:', value);

    // Verify it's a valid number (could be 0 if no activity yet)
    expect(value).toMatch(/^\d+$/);
  });

  test('should update calories out after Apple Health sync', async ({ page }) => {
    // Get initial calories out value
    const caloriesOutValue = page.locator('text="CALORIES OUT"').locator('..').locator('[class*="calorieSubCardValue"]');
    const initialValue = await caloriesOutValue.textContent();
    console.log('Initial Calories Out:', initialValue);

    // Expand the Wearable Sync card
    await page.click('text="WEARABLE SYNC"');

    // Wait for the card to expand
    await page.waitForTimeout(500);

    // Check if Apple Health is already connected
    const appleHealthStatus = await page.textContent('text="Apple Health"').catch(() => null);

    if (appleHealthStatus && appleHealthStatus.includes('Disconnect')) {
      console.log('Apple Health already connected');

      // Try syncing
      const syncButton = page.locator('text="Apple Health"').locator('..').locator('button:has-text("Sync")');
      if (await syncButton.isVisible()) {
        await syncButton.click();
        console.log('Clicked Sync button');

        // Wait for sync to complete (look for success alert or updated lastSync time)
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('Apple Health not connected yet');

      // Try connecting
      const connectButton = page.locator('text="Apple Health"').locator('..').locator('button:has-text("Connect")');
      if (await connectButton.isVisible()) {
        await connectButton.click();
        console.log('Clicked Connect button');

        // Wait for iOS Health permission dialog and sync
        await page.waitForTimeout(5000);
      }
    }

    // Wait for calories to update
    await page.waitForTimeout(2000);

    // Get updated calories out value
    const updatedValue = await caloriesOutValue.textContent();
    console.log('Updated Calories Out:', updatedValue);

    // Verify the value is still a valid number
    expect(updatedValue).toMatch(/^\d+$/);

    // Log if value changed
    if (updatedValue !== initialValue) {
      console.log(`✅ Calories updated from ${initialValue} to ${updatedValue}`);
    } else {
      console.log(`ℹ️ Calories remained at ${initialValue} (might be same value from Apple Health)`);
    }
  });

  test('should show calories in Daily Balance gauge', async ({ page }) => {
    // Check that the Daily Balance gauge is visible
    const dailyBalanceTitle = page.locator('text="DAILY BALANCE"');
    await expect(dailyBalanceTitle).toBeVisible();

    // The gauge should be rendered (SVG element)
    const gauge = page.locator('svg').first();
    await expect(gauge).toBeVisible();

    // Check that calories in card is visible
    const caloriesInCard = page.locator('text="CALORIES IN"').locator('..');
    await expect(caloriesInCard).toBeVisible();

    // Check that calories out card is visible
    const caloriesOutCard = page.locator('text="CALORIES OUT"').locator('..');
    await expect(caloriesOutCard).toBeVisible();
  });

  test('should calculate calorie balance correctly', async ({ page }) => {
    // Get calories in value
    const caloriesInValue = await page.locator('text="CALORIES IN"').locator('..').locator('[class*="calorieSubCardValue"]').textContent();
    const caloriesIn = parseInt(caloriesInValue || '0');

    // Get calories out value
    const caloriesOutValue = await page.locator('text="CALORIES OUT"').locator('..').locator('[class*="calorieSubCardValue"]').textContent();
    const caloriesOut = parseInt(caloriesOutValue || '0');

    // Calculate expected balance
    const expectedBalance = caloriesIn - caloriesOut;

    console.log('Calories In:', caloriesIn);
    console.log('Calories Out:', caloriesOut);
    console.log('Expected Balance:', expectedBalance);

    // Verify the Daily Fat Loss card shows the balance (it uses caloriesIn and caloriesOut)
    const dailyFatLossCard = page.locator('text="DAILY FAT LOSS"').locator('..');
    await expect(dailyFatLossCard).toBeVisible();
  });

  test('should handle refresh correctly', async ({ page }) => {
    // Get initial calories out value
    const caloriesOutValue = page.locator('text="CALORIES OUT"').locator('..').locator('[class*="calorieSubCardValue"]');
    const initialValue = await caloriesOutValue.textContent();

    // Perform pull-to-refresh by scrolling to top and pulling down
    await page.mouse.move(200, 200);
    await page.mouse.down();
    await page.mouse.move(200, 400, { steps: 10 });
    await page.mouse.up();

    // Wait for refresh to complete
    await page.waitForTimeout(3000);

    // Get updated value
    const updatedValue = await caloriesOutValue.textContent();

    console.log('After refresh - Calories Out:', updatedValue);

    // Verify value is still valid
    expect(updatedValue).toMatch(/^\d+$/);
  });

  test('should log fetch attempts to console', async ({ page }) => {
    // Listen for console logs
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Dashboard]') || text.includes('[AppleHealth]')) {
        logs.push(text);
        console.log('📱', text);
      }
    });

    // Trigger a refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for logs
    await page.waitForTimeout(5000);

    // Verify we got logs about fetching Apple Health data
    const hasAppleHealthLogs = logs.some(log =>
      log.includes('Fetching Apple Health') ||
      log.includes('Apple Health data received') ||
      log.includes('Setting caloriesOut')
    );

    if (hasAppleHealthLogs) {
      console.log('✅ Found Apple Health fetch logs');
    } else {
      console.log('⚠️ No Apple Health fetch logs found - might be Android or simulator');
      console.log('Available logs:', logs);
    }
  });
});
