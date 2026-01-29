const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright test for Training Page...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE dimensions
  });
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:8085');

    // Wait for app to load
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/01-initial-load.png' });

    // Check if onboarding screen is shown
    console.log('Checking for onboarding...');
    const skipButton = page.locator('text=/Skip/i');
    const nextButton = page.locator('text=/Next/i');

    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Onboarding detected, clicking Skip...');
      await skipButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/01b-after-skip.png' });
    } else if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Onboarding detected, clicking Next through screens...');
      for (let i = 0; i < 5; i++) {
        const next = page.locator('text=/Next|Get Started|Continue/i').first();
        if (await next.isVisible({ timeout: 1000 }).catch(() => false)) {
          await next.click();
          await page.waitForTimeout(1500);
        }
      }
      await page.screenshot({ path: 'screenshots/01b-after-onboarding.png' });
    }

    console.log('Navigating to Programs page...');
    await page.waitForTimeout(1000);

    // Navigate directly to the programs page using the URL
    await page.goto('http://localhost:8085/programs');
    await page.waitForTimeout(3000); // Wait for page to load
    await page.screenshot({ path: 'screenshots/02-programs-page.png' });

    // Look for the "Generate My Training Plan" button
    console.log('Looking for Generate button...');
    const generateButton = page.locator('text=/Generate.*Training Plan/i');

    if (await generateButton.isVisible({ timeout: 5000 })) {
      console.log('✓ Generate button found!');

      // Check if button is disabled
      const isDisabled = await generateButton.evaluate(el => {
        // Check for disabled attribute or disabled styles
        return el.disabled ||
               el.getAttribute('aria-disabled') === 'true' ||
               el.style.opacity === '0.5' ||
               el.classList.contains('buttonDisabled');
      });

      console.log('Button disabled status:', isDisabled);

      // Try to click the button
      console.log('Attempting to click Generate button...');
      await generateButton.click();
      await page.waitForTimeout(2000);

      // Check for loading state
      const loadingVisible = await page.locator('text=/Generating|Loading/i').isVisible({ timeout: 2000 }).catch(() => false);
      console.log('Loading state visible:', loadingVisible);

      // Wait a bit more and take screenshot
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/03-after-generate-click.png' });

      // Check if workout plan appeared
      const workoutVisible = await page.locator('text=/Workout|Exercise|Training Day/i').isVisible({ timeout: 2000 }).catch(() => false);
      console.log('Workout content visible:', workoutVisible);

    } else {
      console.log('✗ Generate button NOT found');

      // Check if there's a message about completing goals first
      const goalsMessage = await page.locator('text=/complete.*goal|set.*goal/i').isVisible({ timeout: 2000 }).catch(() => false);
      console.log('Goals requirement message visible:', goalsMessage);

      await page.screenshot({ path: 'screenshots/03-no-generate-button.png' });
    }

    // Get all button text on the page to debug
    console.log('\nAll buttons on page:');
    const buttons = await page.locator('button, [role="button"]').allTextContents();
    buttons.forEach((text, i) => console.log(`  ${i + 1}. "${text}"`));

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/error.png' });
  }

  await page.waitForTimeout(5000); // Keep browser open to see result
  await browser.close();
})();
