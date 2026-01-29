import { test, expect } from '@playwright/test';

test.describe('Console Error Capture', () => {
  test('Capture all console errors on app load', async ({ page }) => {
    console.log('=== Console Error Capture Test ===\n');
    test.setTimeout(120000);

    const errors: string[] = [];
    const warnings: string[] = [];
    const logs: string[] = [];

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
      } else if (msg.type() === 'warning') {
        warnings.push(text);
      } else {
        // Capture logs that contain "error" or "Error"
        if (text.toLowerCase().includes('error')) {
          logs.push(text);
        }
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });

    // Navigate to goals page
    console.log('Loading app at /goals...');
    await page.goto('http://localhost:8081/goals', {
      waitUntil: 'networkidle',
      timeout: 90000,
    });
    await page.waitForTimeout(5000);

    // Click through to Body Metrics
    const loseWeight = page.locator('text=Lose Weight').first();
    if (await loseWeight.isVisible({ timeout: 10000 }).catch(() => false)) {
      await loseWeight.click();
      await page.waitForTimeout(500);

      const continueBtn = page.locator('text=CONTINUE').first();
      if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Navigate to other pages to capture more errors
    console.log('Navigating to home...');
    await page.goto('http://localhost:8081/', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:8081/dashboard', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    console.log('Navigating to profile...');
    await page.goto('http://localhost:8081/profile', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    // Print all errors
    console.log('\n========================================');
    console.log('CONSOLE ERRORS CAPTURED:');
    console.log('========================================\n');

    if (errors.length === 0) {
      console.log('No errors found!');
    } else {
      errors.forEach((err, i) => {
        console.log(`\n--- ERROR ${i + 1} ---`);
        console.log(err.substring(0, 2000)); // Truncate very long errors
      });
    }

    console.log('\n========================================');
    console.log('WARNINGS CAPTURED:');
    console.log('========================================\n');

    if (warnings.length === 0) {
      console.log('No warnings found!');
    } else {
      // Deduplicate warnings
      const uniqueWarnings = [...new Set(warnings)];
      uniqueWarnings.slice(0, 30).forEach((warn, i) => {
        console.log(`\n--- WARNING ${i + 1} ---`);
        console.log(warn.substring(0, 1000));
      });
      if (uniqueWarnings.length > 30) {
        console.log(`\n... and ${uniqueWarnings.length - 30} more warnings`);
      }
    }

    console.log('\n========================================');
    console.log('ERROR-RELATED LOGS:');
    console.log('========================================\n');

    if (logs.length === 0) {
      console.log('No error-related logs found!');
    } else {
      const uniqueLogs = [...new Set(logs)];
      uniqueLogs.slice(0, 20).forEach((log, i) => {
        console.log(`\n--- LOG ${i + 1} ---`);
        console.log(log.substring(0, 1000));
      });
    }

    console.log('\n========================================');
    console.log(`SUMMARY: ${errors.length} errors, ${warnings.length} warnings`);
    console.log('========================================\n');
  });
});
