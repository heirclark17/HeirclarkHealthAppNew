const { chromium } = require('playwright');

(async () => {
  console.log('Starting comprehensive test: Goals → Training Plan generation...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
  });
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser error:', msg.text());
    } else if (msg.text().includes('[Training')) {
      console.log('🏋️', msg.text());
    }
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.error('💥 Page error:', error.message);
  });

  try {
    // Step 1: Load app and skip onboarding
    console.log('Step 1: Loading app...');
    await page.goto('http://localhost:8085');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test-01-app-loaded.png' });

    const skipButton = page.locator('text=/Skip/i');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✓ Skipping onboarding...');
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 2: Navigate to Goals page and start wizard
    console.log('\nStep 2: Setting up goals...');
    await page.goto('http://localhost:8085/goals');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test-02-goals-page.png' });

    // Look for "Set Your Goals" or "Start" button
    const startGoalsButton = page.locator('text=/Set.*Goals|Start|Begin|Get Started/i').first();
    if (await startGoalsButton.isVisible({ timeout: 3000 })) {
      console.log('✓ Found goals setup button, clicking...');
      await startGoalsButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/test-03-goals-wizard-step1.png' });

      // Step 3: Complete goals wizard
      console.log('\nStep 3: Completing goals wizard...');

      // Select primary goal (Lose Weight)
      const loseWeightOption = page.locator('text=/Lose Weight|Weight Loss/i').first();
      if (await loseWeightOption.isVisible({ timeout: 2000 })) {
        console.log('✓ Selecting "Lose Weight" goal...');
        await loseWeightOption.click();
        await page.waitForTimeout(1000);
      }

      // Click Next/Continue through wizard steps
      for (let step = 1; step <= 6; step++) {
        const nextButton = page.locator('text=/Next|Continue|Save|Complete|Confirm/i').first();
        if (await nextButton.isVisible({ timeout: 2000 })) {
          const buttonText = await nextButton.textContent().catch(() => '');
          console.log(`✓ Step ${step}: Clicking "${buttonText}"...`);
          await nextButton.click();
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `screenshots/test-04-wizard-step${step + 1}.png` });
        } else {
          console.log(`  ℹ️ No Next/Confirm button found at step ${step}, checking if wizard is complete`);
          break;
        }
      }

      console.log('✓ Goals wizard completed');
    } else {
      console.log('ℹ️ No goals setup needed (already configured)');
    }

    // Step 4: Navigate to Programs page
    console.log('\nStep 4: Navigating to Programs/Training page...');
    await page.goto('http://localhost:8085/programs');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test-05-programs-page.png' });

    // Step 5: Check if Generate button is enabled
    console.log('\nStep 5: Testing "Generate My Training Plan" button...');
    const generateButton = page.locator('text=/Generate.*Training Plan/i');

    if (await generateButton.isVisible({ timeout: 3000 })) {
      console.log('✓ Generate button found');

      // Check button state
      const isDisabled = await generateButton.evaluate(el => {
        const button = el.closest('button') || el.closest('[role="button"]');
        return button ? button.disabled : false;
      });

      const opacity = await generateButton.evaluate(el => {
        const button = el.closest('button') || el.closest('[role="button"]');
        return button ? window.getComputedStyle(button).opacity : '1';
      });

      console.log(`  Button disabled attribute: ${isDisabled}`);
      console.log(`  Button opacity: ${opacity}`);

      if (isDisabled) {
        console.log('❌ Button is still disabled - goals may not be set correctly');
      } else {
        console.log('✓ Button is enabled - clicking to generate training plan...');
        await generateButton.click();
        await page.waitForTimeout(1000);

        // Step 6: Check for loading state
        console.log('\nStep 6: Checking for loading/generation state...');
        const loadingVisible = await page.locator('text=/Generating|Loading|Creating/i').isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  Loading state visible: ${loadingVisible}`);

        if (loadingVisible) {
          console.log('  Waiting for plan generation to complete...');
          await page.waitForTimeout(5000);
        }

        await page.screenshot({ path: 'screenshots/test-06-after-generate.png' });

        // Step 7: Verify training plan appeared
        console.log('\nStep 7: Verifying training plan content...');
        await page.waitForTimeout(2000);

        const workoutVisible = await page.locator('text=/Workout|Exercise|Training Day|Monday|Rest Day/i').isVisible({ timeout: 2000 }).catch(() => false);
        const daySelector = await page.locator('text=/Mon|Tue|Wed|Thu|Fri|Sat|Sun/i').isVisible({ timeout: 2000 }).catch(() => false);
        const alignmentCard = await page.locator('text=/Goal Alignment|Calorie|Muscle/i').isVisible({ timeout: 2000 }).catch(() => false);

        console.log(`  Workout content visible: ${workoutVisible}`);
        console.log(`  Day selector visible: ${daySelector}`);
        console.log(`  Alignment card visible: ${alignmentCard}`);

        if (workoutVisible || daySelector || alignmentCard) {
          console.log('\n✅ SUCCESS: Training plan generated!');
        } else {
          console.log('\n❌ FAIL: Training plan did not generate - content not found');
        }

        await page.screenshot({ path: 'screenshots/test-07-final-result.png' });
      }
    } else {
      console.log('❌ Generate button not found on Programs page');
    }

    console.log('\n=== Test Complete ===\n');

  } catch (error) {
    console.error('\n💥 Test error:', error.message);
    await page.screenshot({ path: 'screenshots/test-error.png' });
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
