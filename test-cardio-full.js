const { chromium } = require('playwright');

(async () => {
  console.log('=== Full Cardio Preference Test ===\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Training]') || text.includes('[GoalWizard]') || text.includes('cardio')) {
      console.log('APP:', text);
    }
  });

  try {
    // Step 1: Load app and clear any saved state
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
    console.log('\nStep 2: Opening Goals page...');
    await page.goto('http://localhost:8081/goals');
    await page.waitForTimeout(2000);

    // Look for "Set Your Goals" or reset wizard
    const startGoalsButton = page.locator('text=/Set.*Goals|Start|Begin|Get Started|Edit/i').first();
    if (await startGoalsButton.isVisible({ timeout: 3000 })) {
      console.log('  Starting goals wizard...');
      await startGoalsButton.click();
      await page.waitForTimeout(2000);
    }

    // STEP 1 of WIZARD: Primary Goal
    console.log('\n=== WIZARD STEP 1: Primary Goal ===');
    await page.screenshot({ path: 'screenshots/cardio-step1-goal.png' });

    const loseWeightOption = page.locator('text=/Lose Weight/i').first();
    if (await loseWeightOption.isVisible({ timeout: 2000 })) {
      console.log('  Selecting "Lose Weight"...');
      await loseWeightOption.click();
      await page.waitForTimeout(500);
    }

    // Click Continue
    let continueBtn = page.locator('text=/Continue/i').first();
    await continueBtn.click();
    await page.waitForTimeout(1500);

    // STEP 2 of WIZARD: Body Metrics
    console.log('\n=== WIZARD STEP 2: Body Metrics ===');
    await page.screenshot({ path: 'screenshots/cardio-step2-metrics.png' });

    continueBtn = page.locator('text=/Continue/i').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1500);
    }

    // STEP 3 of WIZARD: Activity & Lifestyle (THIS IS WHERE CARDIO IS)
    console.log('\n=== WIZARD STEP 3: Activity & Lifestyle ===');
    await page.screenshot({ path: 'screenshots/cardio-step3-activity-top.png' });

    // Check what page we're on
    const pageTitle = await page.locator('text=/Activity Level|Activity & Lifestyle/i').first();
    const isActivityPage = await pageTitle.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  On Activity page: ${isActivityPage}`);

    // Scroll down to find cardio section
    console.log('  Scrolling to find cardio preference section...');

    // Try multiple scroll approaches
    for (let i = 0; i < 5; i++) {
      // Check if cardio section is visible
      const cardioTitle = page.locator('text=/PREFERRED CARDIO TYPE/i');
      if (await cardioTitle.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log('  ✓ Found cardio preference section!');
        break;
      }

      // Scroll down
      await page.evaluate(() => {
        const scrollView = document.querySelector('[data-testid="scroll-view"]') ||
                          document.querySelector('.ScrollView') ||
                          document.documentElement;
        if (scrollView) {
          scrollView.scrollTop += 300;
        }
        window.scrollBy(0, 300);
      });
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'screenshots/cardio-step3-scrolled.png' });

    // Look for the cardio options
    const walkingCard = page.locator('text=/Walking/i').first();
    const runningCard = page.locator('text=/Running/i').first();
    const hiitCard = page.locator('text=/HIIT Training/i').first();

    console.log(`  Walking option visible: ${await walkingCard.isVisible({ timeout: 1000 }).catch(() => false)}`);
    console.log(`  Running option visible: ${await runningCard.isVisible({ timeout: 1000 }).catch(() => false)}`);
    console.log(`  HIIT option visible: ${await hiitCard.isVisible({ timeout: 1000 }).catch(() => false)}`);

    // Select Running
    if (await runningCard.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  >>> Selecting RUNNING as cardio preference...');
      await runningCard.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/cardio-step3-running-selected.png' });
    } else {
      console.log('  WARNING: Could not find Running option');
    }

    // Continue to next step
    continueBtn = page.locator('text=/Continue/i').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1500);
    }

    // STEP 4 of WIZARD: Nutrition Preferences
    console.log('\n=== WIZARD STEP 4: Nutrition Preferences ===');
    await page.screenshot({ path: 'screenshots/cardio-step4-nutrition.png' });

    continueBtn = page.locator('text=/Continue/i').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1500);
    }

    // STEP 5 of WIZARD: Preview/Confirm
    console.log('\n=== WIZARD STEP 5: Confirm Plan ===');
    await page.screenshot({ path: 'screenshots/cardio-step5-preview.png' });

    const confirmBtn = page.locator('text=/Confirm.*Plan|Save|Complete/i').first();
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      console.log('  Confirming plan...');
      await confirmBtn.click();
      await page.waitForTimeout(3000);
    }

    // Check success page for cardio display
    console.log('\n=== SUCCESS PAGE ===');
    await page.screenshot({ path: 'screenshots/cardio-success.png' });

    const runningBasedCardio = page.locator('text=/Running-based cardio/i');
    const cardioDisplayed = await runningBasedCardio.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  "Running-based cardio" displayed: ${cardioDisplayed}`);

    // Navigate to Training/Programs page
    console.log('\n=== TRAINING PAGE ===');
    await page.goto('http://localhost:8081/programs');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/cardio-training-before.png' });

    // Generate training plan
    const generateBtn = page.locator('text=/Generate.*Training Plan/i');
    if (await generateBtn.isVisible({ timeout: 3000 })) {
      console.log('  Generating training plan...');
      await generateBtn.click();
      await page.waitForTimeout(4000);
    }

    await page.screenshot({ path: 'screenshots/cardio-training-after.png' });

    // Check for running-specific content
    const pageContent = await page.content();
    console.log('\n=== VERIFICATION ===');
    console.log(`  Contains "Running Session": ${pageContent.includes('Running Session')}`);
    console.log(`  Contains "Walking Session": ${pageContent.includes('Walking Session')}`);
    console.log(`  Contains "HIIT": ${pageContent.includes('HIIT')}`);
    console.log(`  Contains "Treadmill": ${pageContent.includes('Treadmill')}`);
    console.log(`  Contains "Outdoor": ${pageContent.includes('Outdoor')}`);

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('\nTest error:', error.message);
    await page.screenshot({ path: 'screenshots/cardio-error.png' });
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
