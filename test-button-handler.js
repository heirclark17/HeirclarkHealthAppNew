const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } });

  // Intercept console logs
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:8085');
  await page.waitForTimeout(3000);

  // Skip onboarding
  const skip = page.locator('text=/Skip/i');
  if (await skip.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skip.click();
    await page.waitForTimeout(2000);
  }

  // Go directly to programs page
  console.log('\nNavigating to /programs...');
  await page.goto('http://localhost:8085/programs');
  await page.waitForTimeout(3000);

  // Find the generate button by testID first, then fall back to text
  let generateButton = page.locator('[data-testid="generate-training-plan-button"]');
  let foundByTestId = await generateButton.isVisible({ timeout: 1000 }).catch(() => false);

  if (!foundByTestId) {
    console.log('Test ID not found, trying text locator...');
    generateButton = page.locator('text=/Generate.*Training Plan/i');
  } else {
    console.log('✓ Found button by testID');
  }

  if (await generateButton.isVisible({ timeout: 3000 })) {
    console.log('\n✓ Generate button found');

    // Inject a function to check if the button has an onClick/onPress handler
    const hasHandler = await generateButton.evaluate((el) => {
      const button = el.closest('button') || el.closest('[role="button"]') || el.closest('div[data-pressable="true"]');
      if (!button) return 'No button parent found';

      // Check for React event handlers
      const reactKeys = Object.keys(button).filter(k => k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers'));
      if (reactKeys.length > 0) {
        const props = button[reactKeys[0]];
        return {
          hasOnClick: !!props?.onClick,
          hasOnPress: !!props?.onPress,
          disabled: props?.disabled,
          keys: Object.keys(props || {})
        };
      }

      return 'No React props found';
    });

    console.log('Button handler check:', JSON.stringify(hasHandler, null, 2));

    // Try clicking with multiple methods
    console.log('\n📍 Method 1: Regular click');
    try {
      await generateButton.click({ timeout: 2000 });
      console.log('  ✓ Regular click succeeded');
    } catch (e) {
      console.log('  ✗ Regular click failed:', e.message);
    }

    await page.waitForTimeout(2000);

    console.log('\n📍 Method 2: Force click');
    try {
      await generateButton.click({ force: true, timeout: 2000 });
      console.log('  ✓ Force click succeeded');
    } catch (e) {
      console.log('  ✗ Force click failed:', e.message);
    }

    await page.waitForTimeout(2000);

    console.log('\n📍 Method 3: Dispatch click event');
    try {
      await generateButton.dispatchEvent('click');
      console.log('  ✓ Dispatch click succeeded');
    } catch (e) {
      console.log('  ✗ Dispatch click failed:', e.message);
    }

    console.log('\nWaiting 3 more seconds for any logs...');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/button-test.png' });
  } else {
    console.log('❌ Button not found');
  }

  await browser.close();
})();
