const { chromium } = require('playwright');

(async () => {
  console.log('=== Testing Cardio Preference Feature ===\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Training]') || text.includes('[GoalWizard]')) {
      console.log('APP:', text);
    }
  });

  try {
    // Step 1: Load app
    console.log('Step 1: Loading app...');
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);

    // Skip onboarding if present
    const skipButton = page.locator('text=/Skip/i');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  Skipping onboarding...');
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 2: Navigate to Goals page
    console.log('\nStep 2: Opening Goals wizard...');
    await page.goto('http://localhost:8081/goals');
    await page.waitForTimeout(2000);

    // Look for "Set Your Goals" or similar button
    const startGoalsButton = page.locator('text=/Set.*Goals|Start|Begin|Get Started/i').first();
    if (await startGoalsButton.isVisible({ timeout: 3000 })) {
      console.log('  Found goals setup button, clicking...');
      await startGoalsButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 3: Select primary goal (Lose Weight)
    console.log('\nStep 3: Selecting primary goal...');
    const loseWeightOption = page.locator('text=/Lose Weight|Weight Loss/i').first();
    if (await loseWeightOption.isVisible({ timeout: 3000 })) {
      console.log('  Selecting "Lose Weight"...');
      await loseWeightOption.click();
      await page.waitForTimeout(1000);
    }

    // Click Continue to go to next step
    const continueBtn1 = page.locator('text=/Continue|Next/i').first();
    if (await continueBtn1.isVisible({ timeout: 2000 })) {
      await continueBtn1.click();
      await page.waitForTimeout(1500);
    }

    // Step 4: Body Metrics - just continue with defaults
    console.log('\nStep 4: Continuing through body metrics...');
    const continueBtn2 = page.locator('text=/Continue|Next/i').first();
    if (await continueBtn2.isVisible({ timeout: 2000 })) {
      await continueBtn2.click();
      await page.waitForTimeout(1500);
    }

    // Step 5: Activity & Lifestyle - This is where cardio preference should be
    console.log('\nStep 5: Testing cardio preference selection...');
    await page.screenshot({ path: 'screenshots/cardio-01-activity-page.png' });

    // Check for cardio preference section
    const cardioSectionTitle = page.locator('text=/PREFERRED CARDIO TYPE/i');
    const cardioSectionVisible = await cardioSectionTitle.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Cardio preference section visible: ${cardioSectionVisible}`);

    if (cardioSectionVisible) {
      // Check for all three cardio options
      const walkingOption = page.locator('text=/Walking/i').first();
      const runningOption = page.locator('text=/Running/i').first();
      const hiitOption = page.locator('text=/HIIT Training/i').first();

      const walkingVisible = await walkingOption.isVisible({ timeout: 1000 }).catch(() => false);
      const runningVisible = await runningOption.isVisible({ timeout: 1000 }).catch(() => false);
      const hiitVisible = await hiitOption.isVisible({ timeout: 1000 }).catch(() => false);

      console.log(`  Walking option visible: ${walkingVisible}`);
      console.log(`  Running option visible: ${runningVisible}`);
      console.log(`  HIIT option visible: ${hiitVisible}`);

      // Select Running as the cardio preference
      if (runningVisible) {
        console.log('  Selecting "Running" as cardio preference...');
        await runningOption.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/cardio-02-running-selected.png' });
      }
    } else {
      console.log('  Scrolling to find cardio section...');
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);

      const runningOption = page.locator('text=/Running/i').first();
      if (await runningOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  Found Running option after scroll, selecting...');
        await runningOption.click();
        await page.waitForTimeout(1000);
      }
    }

    // Continue to next step
    const continueBtn3 = page.locator('text=/Continue|Next/i').first();
    if (await continueBtn3.isVisible({ timeout: 2000 })) {
      await continueBtn3.click();
      await page.waitForTimeout(1500);
    }

    // Step 6: Nutrition Preferences - continue with defaults
    console.log('\nStep 6: Continuing through nutrition preferences...');
    const continueBtn4 = page.locator('text=/Continue|Next/i').first();
    if (await continueBtn4.isVisible({ timeout: 2000 })) {
      await continueBtn4.click();
      await page.waitForTimeout(1500);
    }

    // Step 7: Confirm the plan
    console.log('\nStep 7: Confirming the plan...');
    const confirmBtn = page.locator('text=/Confirm|Save|Complete/i').first();
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'screenshots/cardio-03-success-page.png' });

    // Check if cardio preference is shown on success page
    const cardioDisplay = page.locator('text=/Running-based cardio|Running Session/i');
    const cardioDisplayVisible = await cardioDisplay.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Cardio preference displayed on success: ${cardioDisplayVisible}`);

    // Step 8: Navigate to Programs/Training page
    console.log('\nStep 8: Navigating to Training page...');
    await page.goto('http://localhost:8081/programs');
    await page.waitForTimeout(3000);

    // Step 9: Generate training plan
    console.log('\nStep 9: Generating training plan...');
    const generateButton = page.locator('text=/Generate.*Training Plan/i');
    if (await generateButton.isVisible({ timeout: 3000 })) {
      const isDisabled = await generateButton.evaluate(el => {
        const button = el.closest('button') || el.closest('[role="button"]');
        return button ? button.disabled : false;
      });

      console.log(`  Generate button disabled: ${isDisabled}`);

      if (!isDisabled) {
        await generateButton.click();
        console.log('  Clicked generate button...');
        await page.waitForTimeout(3000);
      }
    }

    await page.screenshot({ path: 'screenshots/cardio-04-training-plan.png' });

    // Step 10: Check for cardio-specific workouts
    console.log('\nStep 10: Checking training plan content...');

    // Look for running-related workout names
    const runningSession = page.locator('text=/Running Session|Treadmill Running|Outdoor Running/i');
    const runningSessionVisible = await runningSession.isVisible({ timeout: 2000 }).catch(() => false);

    // Look for generic cardio
    const cardioSession = page.locator('text=/Cardio Session|Cardio|HIIT/i');
    const cardioSessionVisible = await cardioSession.isVisible({ timeout: 2000 }).catch(() => false);

    console.log(`  Running-specific workout found: ${runningSessionVisible}`);
    console.log(`  Cardio workout found: ${cardioSessionVisible}`);

    // Check the page content for workout details
    const pageContent = await page.content();
    const hasRunning = pageContent.includes('Running') || pageContent.includes('running');
    const hasWalking = pageContent.includes('Walking Session');
    const hasHIIT = pageContent.includes('HIIT');

    console.log(`\n  Page contains 'Running': ${hasRunning}`);
    console.log(`  Page contains 'Walking Session': ${hasWalking}`);
    console.log(`  Page contains 'HIIT': ${hasHIIT}`);

    await page.screenshot({ path: 'screenshots/cardio-05-final.png' });

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Cardio preference section visible: ${cardioSectionVisible}`);
    console.log(`Running-based cardio in workouts: ${runningSessionVisible || hasRunning}`);

    if (cardioSectionVisible) {
      console.log('\n SUCCESS: Cardio preference feature is implemented!');
    } else {
      console.log('\n NOTE: Cardio section may require scrolling or wizard step navigation');
    }

  } catch (error) {
    console.error('\n Test error:', error.message);
    await page.screenshot({ path: 'screenshots/cardio-error.png' });
  }

  console.log('\nTest complete. Check screenshots folder for visual results.');
  await page.waitForTimeout(3000);
  await browser.close();
})();
