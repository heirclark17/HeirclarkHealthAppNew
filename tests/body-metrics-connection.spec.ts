import { test, expect } from '@playwright/test';

test.describe('Body Metrics Connection & Stability Tests', () => {
  test('Check page loads and Body Metrics controls work', async ({ page }) => {
    console.log('=== Starting Body Metrics Connection Test ===');

    // Set longer timeout for initial load
    test.setTimeout(120000);

    // Navigate to goals page
    console.log('Navigating to localhost:8081/goals...');
    const startTime = Date.now();

    try {
      const response = await page.goto('http://localhost:8081/goals', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      console.log(`Page loaded in ${Date.now() - startTime}ms`);
      console.log(`Response status: ${response?.status()}`);

      if (!response?.ok()) {
        console.log('WARNING: Response not OK');
      }
    } catch (error) {
      console.log(`ERROR loading page: ${error}`);
      await page.screenshot({ path: 'tests/screenshots/connection-error.png', fullPage: true });
      throw error;
    }

    // Wait for app to hydrate
    console.log('Waiting for app to hydrate...');
    await page.waitForTimeout(3000);

    // Take screenshot of initial state
    await page.screenshot({ path: 'tests/screenshots/goals-initial.png', fullPage: true });

    // Check for "Lose Weight" option
    console.log('Looking for goal options...');
    const loseWeight = page.locator('text=Lose Weight');
    const loseWeightVisible = await loseWeight.first().isVisible().catch(() => false);
    console.log(`"Lose Weight" visible: ${loseWeightVisible}`);

    if (!loseWeightVisible) {
      // Maybe we're already on body metrics or another step
      const pageContent = await page.content();
      console.log('Page content length:', pageContent.length);

      // Check what's visible
      const bodyMetricsVisible = await page.locator('text=Body Metrics').isVisible().catch(() => false);
      const weightVisible = await page.locator('text=WEIGHT').isVisible().catch(() => false);
      const ageVisible = await page.locator('text=AGE').isVisible().catch(() => false);

      console.log(`Body Metrics visible: ${bodyMetricsVisible}`);
      console.log(`WEIGHT section visible: ${weightVisible}`);
      console.log(`AGE section visible: ${ageVisible}`);

      await page.screenshot({ path: 'tests/screenshots/current-state.png', fullPage: true });
    } else {
      // Click on Lose Weight
      console.log('Clicking "Lose Weight"...');
      await loseWeight.first().click();
      await page.waitForTimeout(500);

      // Click Continue
      const continueBtn = page.locator('text=CONTINUE');
      await expect(continueBtn.first()).toBeVisible({ timeout: 5000 });
      console.log('Clicking CONTINUE...');
      await continueBtn.first().click();
      await page.waitForTimeout(2000);
    }

    // Now test Body Metrics controls
    console.log('\n=== Testing Body Metrics Controls ===');
    await page.screenshot({ path: 'tests/screenshots/body-metrics-page.png', fullPage: true });

    // Test weight +/- buttons
    console.log('Looking for weight controls...');
    const minusButtons = await page.locator('button, [role="button"]').filter({ has: page.locator('text=-10') }).all();
    const plusButtons = await page.locator('button, [role="button"]').filter({ has: page.locator('text=+10') }).all();

    console.log(`Found ${minusButtons.length} -10 buttons`);
    console.log(`Found ${plusButtons.length} +10 buttons`);

    // Find all touchable elements
    const touchables = await page.locator('[role="button"], button').all();
    console.log(`Found ${touchables.length} total button/touchable elements`);

    // Test clicking on +/- icons
    const addIcons = await page.locator('[data-testid*="add"], text=+').all();
    const removeIcons = await page.locator('[data-testid*="remove"], [data-testid*="minus"]').all();
    console.log(`Found ${addIcons.length} add icons, ${removeIcons.length} remove icons`);

    // Try to find the weight value
    const weightValues = await page.locator('text=/^\\d{2,3}$/').allTextContents();
    console.log('Weight-like values found:', weightValues.slice(0, 5));

    // Test age chevron buttons
    console.log('\nLooking for age controls...');
    const chevronUp = await page.locator('[data-testid*="chevron-up"], text=chevron-up').all();
    const chevronDown = await page.locator('[data-testid*="chevron-down"], text=chevron-down').all();
    console.log(`Chevron up: ${chevronUp.length}, Chevron down: ${chevronDown.length}`);

    // Find age values
    const ageValues = await page.locator('text=/\\d+ years/').allTextContents();
    console.log('Age values found:', ageValues.slice(0, 5));

    // Test interaction - click a + button if found
    if (plusButtons.length > 0) {
      console.log('\nTesting +10 button click...');
      const beforeClick = await page.locator('text=/^\\d{2,3}$/').first().textContent();
      console.log('Value before click:', beforeClick);

      await plusButtons[0].click();
      await page.waitForTimeout(500);

      const afterClick = await page.locator('text=/^\\d{2,3}$/').first().textContent();
      console.log('Value after click:', afterClick);
      console.log(`Button responded: ${beforeClick !== afterClick ? 'YES' : 'NO'}`);
    }

    // Final screenshot
    await page.screenshot({ path: 'tests/screenshots/body-metrics-final.png', fullPage: true });
    console.log('\n=== Test Complete ===');
  });

  test('Connection stability - multiple reloads', async ({ page }) => {
    console.log('=== Testing Connection Stability ===');
    test.setTimeout(180000);

    const results: { attempt: number; success: boolean; time: number; error?: string }[] = [];

    for (let i = 1; i <= 5; i++) {
      console.log(`\nAttempt ${i}/5...`);
      const startTime = Date.now();

      try {
        const response = await page.goto('http://localhost:8081/', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        const loadTime = Date.now() - startTime;
        const success = response?.ok() ?? false;

        results.push({ attempt: i, success, time: loadTime });
        console.log(`  Status: ${response?.status()}, Time: ${loadTime}ms`);

        // Wait a bit between attempts
        await page.waitForTimeout(2000);

      } catch (error: any) {
        const loadTime = Date.now() - startTime;
        results.push({ attempt: i, success: false, time: loadTime, error: error.message });
        console.log(`  FAILED: ${error.message}`);
      }
    }

    // Summary
    console.log('\n=== Connection Stability Summary ===');
    const successCount = results.filter(r => r.success).length;
    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;

    console.log(`Success rate: ${successCount}/5 (${(successCount/5*100).toFixed(0)}%)`);
    console.log(`Average load time: ${avgTime.toFixed(0)}ms`);

    results.forEach(r => {
      console.log(`  Attempt ${r.attempt}: ${r.success ? 'OK' : 'FAIL'} (${r.time}ms)${r.error ? ` - ${r.error}` : ''}`);
    });

    expect(successCount).toBeGreaterThanOrEqual(3); // At least 60% success rate
  });
});
