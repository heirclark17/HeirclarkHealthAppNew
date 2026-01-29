import { test, expect } from '@playwright/test';

test.describe('Goal Wizard API Debug', () => {
  test('Complete wizard and capture API calls', async ({ page }) => {
    // Listen to all network requests
    const apiCalls: any[] = [];

    page.on('request', request => {
      if (request.url().includes('/api/v1/health/goals')) {
        console.log('\n🔵 API REQUEST:', request.method(), request.url());
        console.log('📦 Payload:', request.postData());
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          payload: request.postData(),
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/v1/health/goals')) {
        console.log('\n🟢 API RESPONSE:', response.status());
        try {
          const body = await response.text();
          console.log('📥 Response body:', body);
        } catch (error) {
          console.log('❌ Could not read response body');
        }
      }
    });

    // Listen for console logs from the app
    page.on('console', msg => {
      if (msg.text().includes('[API]') || msg.text().includes('goals') || msg.text().includes('error')) {
        console.log('📱 App log:', msg.text());
      }
    });

    // Go to goals screen
    await page.goto('http://localhost:8081/goals');
    await page.waitForTimeout(2000);

    console.log('\n✅ Starting wizard...');

    // Step 1: Select goal
    await page.locator('text=Lose Weight').first().click();
    await page.waitForTimeout(500);
    await page.locator('text=CONTINUE').first().click();
    await page.waitForTimeout(1500);

    // Step 2: Body Metrics - Use defaults
    console.log('✅ Step 2: Body Metrics (using defaults)...');
    await page.locator('text=CONTINUE').first().click();
    await page.waitForTimeout(500);

    // Step 3: Activity & Lifestyle
    console.log('✅ Step 3: Activity level...');
    await page.locator('text=Moderately Active').first().click();
    await page.waitForTimeout(500);
    await page.locator('text=CONTINUE').first().click();
    await page.waitForTimeout(1500);

    // Step 4: Nutrition Preferences
    console.log('✅ Step 4: Nutrition preferences...');
    await page.locator('text=High Protein').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=CONTINUE').first().click();
    await page.waitForTimeout(500);

    // Step 5: Preview - Confirm
    console.log('✅ Step 5: Confirming plan...');
    console.log('⏳ Waiting for CONFIRM MY PLAN button...');

    await page.waitForSelector('text=CONFIRM MY PLAN', { timeout: 5000 });

    console.log('\n🚀 CLICKING CONFIRM - WATCH FOR API CALL...\n');
    await page.locator('text=CONFIRM MY PLAN').first().click();

    // Wait for API call to complete
    await page.waitForTimeout(5000);

    console.log('\n📊 Total API calls captured:', apiCalls.length);
    apiCalls.forEach((call, i) => {
      console.log(`\nCall ${i + 1}:`, JSON.stringify(call, null, 2));
    });

    // Check if we got to success screen or error
    const hasSuccess = await page.locator('text=Goals Set Successfully').isVisible().catch(() => false);
    const hasError = await page.locator('text=error').isVisible().catch(() => false);

    console.log('\n✅ Success screen visible:', hasSuccess);
    console.log('❌ Error visible:', hasError);

    if (!hasSuccess) {
      // Take screenshot
      await page.screenshot({ path: 'test-results/api-debug-screenshot.png', fullPage: true });
      console.log('📸 Screenshot saved to test-results/api-debug-screenshot.png');
    }
  });
});
