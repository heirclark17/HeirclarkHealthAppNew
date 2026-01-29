const { chromium } = require('playwright');

(async () => {
  console.log('=== Simple Cardio Preference Test ===\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 900 }, // Taller viewport to avoid tab bar issues
  });
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Training]') || text.includes('cardioPreference') || text.includes('Preferences:')) {
      console.log('APP:', text);
    }
  });

  try {
    // Load app
    console.log('Loading app...');
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);

    // Skip onboarding
    const skipButton = page.locator('text=/Skip/i');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    // Go to goals page
    console.log('\nNavigating to Goals...');
    await page.goto('http://localhost:8081/goals');
    await page.waitForTimeout(2000);

    // Start wizard
    const startBtn = page.locator('text=/Set.*Goals|Start|Begin|Edit/i').first();
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }

    // Step 1: Select goal
    console.log('\nStep 1: Selecting Lose Weight...');
    const loseWeight = page.locator('text=/Lose Weight/i').first();
    if (await loseWeight.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loseWeight.click();
      await page.waitForTimeout(500);
    }

    // Use force click for Continue buttons to bypass overlay issues
    console.log('  Clicking Continue (force)...');
    await page.locator('text=/Continue/i').first().click({ force: true });
    await page.waitForTimeout(1500);

    // Step 2: Body Metrics - continue
    console.log('\nStep 2: Body Metrics - continuing...');
    await page.locator('text=/Continue/i').first().click({ force: true });
    await page.waitForTimeout(1500);

    // Step 3: Activity & Lifestyle
    console.log('\nStep 3: Activity & Lifestyle...');
    await page.screenshot({ path: 'screenshots/simple-step3-top.png' });

    // Check page title
    const activityTitle = await page.locator('text=/Activity Level/i').isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`  On Activity page: ${activityTitle}`);

    // Scroll down to find cardio section
    console.log('  Scrolling down...');
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/simple-step3-scroll1.png' });

    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/simple-step3-scroll2.png' });

    // Check for cardio options
    const cardioTitle = await page.locator('text=/PREFERRED CARDIO TYPE/i').isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`  Cardio section visible: ${cardioTitle}`);

    // Try to find Running option
    const runningOption = page.locator('text=Running').first();
    const runningVisible = await runningOption.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`  Running option visible: ${runningVisible}`);

    if (runningVisible) {
      console.log('  >>> Selecting Running...');
      await runningOption.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/simple-running-selected.png' });
    }

    // Continue
    await page.locator('text=/Continue/i').first().click({ force: true });
    await page.waitForTimeout(1500);

    // Step 4: Nutrition - continue
    console.log('\nStep 4: Nutrition - continuing...');
    await page.locator('text=/Continue/i').first().click({ force: true });
    await page.waitForTimeout(1500);

    // Step 5: Confirm
    console.log('\nStep 5: Confirming...');
    const confirmBtn = page.locator('text=/Confirm.*Plan/i').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'screenshots/simple-success.png' });

    // Go to training page
    console.log('\nNavigating to Training...');
    await page.goto('http://localhost:8081/programs');
    await page.waitForTimeout(3000);

    // Generate plan
    console.log('\nGenerating training plan...');
    const generateBtn = page.locator('text=/Generate.*Training Plan/i');
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generateBtn.click({ force: true });
      await page.waitForTimeout(4000);
    }

    await page.screenshot({ path: 'screenshots/simple-training.png' });

    // Check content
    const content = await page.content();
    console.log('\n=== Results ===');
    console.log(`Contains "Running Session": ${content.includes('Running Session')}`);
    console.log(`Contains "Walking Session": ${content.includes('Walking Session')}`);
    console.log(`Contains "Treadmill Running": ${content.includes('Treadmill Running')}`);
    console.log(`Contains "HIIT": ${content.includes('HIIT')}`);

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({ path: 'screenshots/simple-error.png' });
  }

  console.log('\nDone.');
  await page.waitForTimeout(2000);
  await browser.close();
})();
