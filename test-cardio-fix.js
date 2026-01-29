const { chromium } = require('playwright');

(async () => {
  console.log('=== Testing Cardio Preference Fix ===\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 900 },
  });
  const page = await context.newPage();

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[GoalWizard]') ||
        text.includes('[Training]') ||
        text.includes('[TrainingService]') ||
        text.includes('cardio')) {
      console.log('APP:', text);
    }
  });

  try {
    // Clear storage first
    console.log('Step 1: Loading app and clearing storage...');
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
    await page.waitForTimeout(3000);

    // Skip onboarding if present
    const skipButton = page.locator('text=/Skip/i');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    // Go to goals page
    console.log('\nStep 2: Going to Goals page...');
    await page.goto('http://localhost:8081/goals');
    await page.waitForTimeout(2000);

    // Start wizard
    const startBtn = page.locator('text=/Set.*Goals|Start|Begin|Edit/i').first();
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }

    // Step 1: Select goal
    console.log('\nStep 3: Selecting Lose Weight goal...');
    const loseWeight = page.locator('text=/Lose Weight/i').first();
    if (await loseWeight.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loseWeight.click();
      await page.waitForTimeout(500);
    }
    await page.locator('text=/Continue/i').first().click({ force: true });
    await page.waitForTimeout(1500);

    // Step 2: Body Metrics - continue
    console.log('\nStep 4: Body Metrics - continuing...');
    await page.locator('text=/Continue/i').first().click({ force: true });
    await page.waitForTimeout(1500);

    // Step 3: Activity & Lifestyle - SELECT WALKING
    console.log('\nStep 5: Activity & Lifestyle - Selecting WALKING...');
    await page.screenshot({ path: 'screenshots/fix-step3-before-scroll.png' });

    // Scroll to find cardio section
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'screenshots/fix-step3-scrolled.png' });

    // Look for Walking option
    const walkingOption = page.locator('text=/^Walking$/i').first();
    const walkingVisible = await walkingOption.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  Walking option visible: ${walkingVisible}`);

    if (walkingVisible) {
      console.log('  >>> Clicking Walking...');
      await walkingOption.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/fix-walking-selected.png' });
    } else {
      // Try finding by test content
      const cardioSection = await page.locator('text=/PREFERRED CARDIO/i').isVisible().catch(() => false);
      console.log(`  Cardio section visible: ${cardioSection}`);

      // Try clicking any element containing "Walking"
      const allWalking = page.locator('[class*="card"], [class*="Card"]').filter({ hasText: 'Walking' }).first();
      if (await allWalking.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('  >>> Found Walking card, clicking...');
        await allWalking.click();
        await page.waitForTimeout(1000);
      }
    }

    // Continue to next step
    await page.locator('text=/Continue/i').first().click({ force: true });
    await page.waitForTimeout(1500);

    // Step 4: Nutrition - continue
    console.log('\nStep 6: Nutrition - continuing...');
    await page.locator('text=/Continue/i').first().click({ force: true });
    await page.waitForTimeout(1500);

    // Step 5: Confirm
    console.log('\nStep 7: Confirming plan...');
    await page.screenshot({ path: 'screenshots/fix-before-confirm.png' });

    const confirmBtn = page.locator('text=/Confirm.*Plan/i').first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
      console.log('  Clicked Confirm!');
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'screenshots/fix-after-confirm.png' });

    // Check what was saved
    console.log('\nStep 8: Checking saved data...');
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('hc_goal_wizard_progress');
      return data ? JSON.parse(data) : null;
    });

    if (savedData) {
      console.log('  Saved cardioPreference:', savedData.cardioPreference);
      console.log('  Saved primaryGoal:', savedData.primaryGoal);
      console.log('  isComplete:', savedData.isComplete);
    } else {
      console.log('  ERROR: No saved data found!');
    }

    // Go to Training page
    console.log('\nStep 9: Going to Training page...');
    await page.goto('http://localhost:8081/programs');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/fix-training-page.png' });

    // Generate training plan
    console.log('\nStep 10: Generating training plan...');
    const generateBtn = page.locator('text=/Generate.*Training Plan/i');
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isDisabled = await generateBtn.evaluate(el => {
        const button = el.closest('[role="button"]') || el.closest('button') || el;
        return button?.getAttribute('aria-disabled') === 'true' ||
               button?.disabled ||
               button?.style?.opacity === '0.5';
      });

      console.log(`  Button disabled: ${isDisabled}`);

      if (!isDisabled) {
        await generateBtn.click({ force: true });
        console.log('  Clicked Generate!');
        await page.waitForTimeout(5000);
      }
    } else {
      console.log('  Generate button not found');
    }

    await page.screenshot({ path: 'screenshots/fix-after-generate.png' });

    // Check the page content
    console.log('\n=== RESULTS ===');
    const content = await page.content();

    console.log('\nWorkout names found:');
    console.log(`  "Walking Session": ${content.includes('Walking Session')}`);
    console.log(`  "Running Session": ${content.includes('Running Session')}`);
    console.log(`  "HIIT Cardio": ${content.includes('HIIT Cardio')}`);
    console.log(`  "HIIT Cardio Blast": ${content.includes('HIIT Cardio Blast')}`);

    console.log('\nExercise names found:');
    console.log(`  "Brisk Walking": ${content.includes('Brisk Walking')}`);
    console.log(`  "Incline Treadmill Walk": ${content.includes('Incline Treadmill Walk')}`);
    console.log(`  "Power Walking": ${content.includes('Power Walking')}`);
    console.log(`  "Burpees": ${content.includes('Burpees')}`);
    console.log(`  "Mountain Climbers": ${content.includes('Mountain Climbers')}`);
    console.log(`  "Jump Squats": ${content.includes('Jump Squats')}`);

    // Get visible text from workout cards
    const workoutText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const texts = [];
      elements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('Session') || text.includes('Cardio') || text.includes('Walking') || text.includes('HIIT')) {
          if (text.length < 100) {
            texts.push(text.trim());
          }
        }
      });
      return [...new Set(texts)].slice(0, 20);
    });

    console.log('\nRelevant UI text found:', workoutText);

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({ path: 'screenshots/fix-error.png' });
  }

  console.log('\n=== Test Complete ===');
  console.log('Check the console logs above for [GoalWizard] and [TrainingService] messages');

  await page.waitForTimeout(5000);
  await browser.close();
})();
