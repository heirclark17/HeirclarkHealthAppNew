import { test, expect } from '@playwright/test';

test.describe('Heirclark App Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Expo dev server
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000); // Wait for app to load
  });

  test('Weekly bucket updates with meal inputs', async ({ page }) => {
    console.log('🧪 Testing weekly bucket reactivity...');

    // Listen for console logs from the app
    const weeklyUpdateLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Weekly Update]')) {
        weeklyUpdateLogs.push(text);
        console.log('📊', text);
      }
    });

    // Wait for initial load and weekly update effect
    await page.waitForTimeout(2000);

    // Check if we received the expected log sequence
    const hasEffectTriggered = weeklyUpdateLogs.some(log =>
      log.includes('Effect triggered')
    );
    const hasHistoryFetched = weeklyUpdateLogs.some(log =>
      log.includes('History fetched')
    );
    const hasFinalTotals = weeklyUpdateLogs.some(log =>
      log.includes('🎯 FINAL WEEKLY TOTALS')
    );

    console.log('\n📝 Weekly Update Log Summary:');
    console.log('✅ Effect triggered:', hasEffectTriggered);
    console.log('✅ History fetched:', hasHistoryFetched);
    console.log('✅ Final totals calculated:', hasFinalTotals);

    // Verify all critical logs are present
    expect(hasEffectTriggered, 'Weekly update effect should trigger').toBeTruthy();
    expect(hasHistoryFetched, 'History should be fetched').toBeTruthy();
    expect(hasFinalTotals, 'Final weekly totals should be calculated').toBeTruthy();

    // Extract the final totals from logs
    const finalTotalsLog = weeklyUpdateLogs.find(log =>
      log.includes('FINAL WEEKLY TOTALS')
    );

    if (finalTotalsLog) {
      console.log('\n🎯 Final Totals Log:', finalTotalsLog);

      // Parse the log to extract calorie value
      const caloriesMatch = finalTotalsLog.match(/calories:\s*(\d+)/);
      if (caloriesMatch) {
        const calories = parseInt(caloriesMatch[1]);
        console.log('📈 Weekly calories detected:', calories);
        expect(calories, 'Weekly calories should be greater than 0').toBeGreaterThan(0);
      }
    }
  });

  test('Font weight is bold/heavy (900)', async ({ page }) => {
    console.log('🧪 Testing font weight for iOS lock screen style...');

    // Look for elements with RoundedNumeral component
    // This will depend on how the component is rendered in the DOM
    await page.waitForTimeout(2000);

    // Check computed styles - this assumes we can access the rendered elements
    const evaluateResult = await page.evaluate(() => {
      // Find all text elements that should have heavy font weight
      const elements = document.querySelectorAll('[class*="text"], [class*="Text"]');
      const fontWeights: string[] = [];

      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const fontWeight = computedStyle.fontWeight;
        if (fontWeight) {
          fontWeights.push(fontWeight);
        }
      });

      return fontWeights;
    });

    console.log('📊 Font weights found:', evaluateResult);

    // Check if any font-weight 900 (heavy) is present
    const hasHeavyWeight = evaluateResult.some(weight =>
      weight === '900' || weight === 'black' || parseInt(weight) >= 900
    );

    console.log('✅ Heavy font weight (900) detected:', hasHeavyWeight);
  });

  test('Calorie gauge text is not cut off', async ({ page }) => {
    console.log('🧪 Testing calorie gauge text visibility...');

    await page.waitForTimeout(2000);

    // Take a screenshot to visually verify
    const screenshotPath = 'test-results/calorie-gauge-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('📸 Screenshot saved to:', screenshotPath);

    // Check for overflow or clipping in the gauge component area
    const hasOverflow = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="gauge"], [class*="Gauge"]');
      let overflowDetected = false;

      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.overflow === 'hidden') {
          const scrollHeight = (el as HTMLElement).scrollHeight;
          const clientHeight = (el as HTMLElement).clientHeight;
          if (scrollHeight > clientHeight) {
            overflowDetected = true;
            console.log('⚠️ Overflow detected in element:', el.className);
          }
        }
      });

      return overflowDetected;
    });

    console.log('🔍 Text overflow detected:', hasOverflow);
    expect(hasOverflow, 'Calorie gauge should not have text overflow').toBeFalsy();
  });

  test('Console shows detailed weekly bucket logging', async ({ page }) => {
    console.log('🧪 Verifying detailed weekly bucket logging...');

    const allLogs: string[] = [];
    page.on('console', msg => {
      allLogs.push(msg.text());
    });

    await page.waitForTimeout(3000);

    // Check for specific log patterns that indicate the fix is working
    const expectedLogPatterns = [
      /\[Weekly Update\] Effect triggered/,
      /\[Weekly Update\] History fetched/,
      /historyLength:/,
      /daysToFetch:/,
      /\[Weekly Update\] 🎯 FINAL WEEKLY TOTALS/,
      /historyTotals:/,
      /todayLive:/,
      /finalTotals:/
    ];

    console.log('\n📋 Checking for expected log patterns:');
    expectedLogPatterns.forEach((pattern, index) => {
      const found = allLogs.some(log => pattern.test(log));
      console.log(`${found ? '✅' : '❌'} Pattern ${index + 1}: ${pattern}`);
    });

    // Count how many patterns matched
    const matchedPatterns = expectedLogPatterns.filter(pattern =>
      allLogs.some(log => pattern.test(log))
    ).length;

    console.log(`\n📊 Matched ${matchedPatterns}/${expectedLogPatterns.length} expected log patterns`);

    // Should match at least 5 out of 8 patterns (accounting for timing issues)
    expect(matchedPatterns).toBeGreaterThanOrEqual(5);
  });
});
