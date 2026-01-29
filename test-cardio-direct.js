const { chromium } = require('playwright');

(async () => {
  console.log('=== Direct Cardio Preference Test ===\n');
  console.log('This test directly sets cardio preference in AsyncStorage\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();

  // Capture ALL console messages for debugging
  page.on('console', msg => {
    const text = msg.text();
    // Show training and cardio related logs
    if (text.includes('[Training') ||
        text.includes('[TrainingService]') ||
        text.includes('cardio') ||
        text.includes('Cardio') ||
        text.includes('Preferences:') ||
        text.includes('Running') ||
        text.includes('Walking')) {
      console.log('APP:', text);
    }
  });

  try {
    // Load app
    console.log('Step 1: Loading app...');
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);

    // Skip onboarding
    const skipButton = page.locator('text=/Skip/i');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 2: Directly set cardio preference to 'running' in AsyncStorage
    console.log('\nStep 2: Setting cardio preference to "running" directly...');
    await page.evaluate(async () => {
      // Get current saved goals
      const storageKey = 'hc_goal_wizard_progress';
      const saved = localStorage.getItem(storageKey);
      let goalData = saved ? JSON.parse(saved) : {
        primaryGoal: 'lose_weight',
        currentWeight: 200,
        targetWeight: 180,
        weightUnit: 'lb',
        heightFt: 5,
        heightIn: 10,
        heightCm: 178,
        heightUnit: 'ft_in',
        age: 35,
        sex: 'male',
        targetDate: null,
        activityLevel: 'moderate',
        workoutsPerWeek: 4,
        workoutDuration: 45,
        dietStyle: 'standard',
        mealsPerDay: 3,
        intermittentFasting: false,
        fastingStart: '12:00',
        fastingEnd: '20:00',
        allergies: [],
        results: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 67
        },
        currentStep: 5,
        isComplete: true,
        isSaving: false
      };

      // Set cardio preference to 'running'
      goalData.cardioPreference = 'running';
      goalData.isComplete = true;

      // Save back
      localStorage.setItem(storageKey, JSON.stringify(goalData));
      console.log('[Test] Set cardioPreference to:', goalData.cardioPreference);
      return goalData.cardioPreference;
    });

    console.log('  Cardio preference set to "running" in localStorage');

    // Reload the app to pick up the new values
    console.log('\nStep 3: Reloading app to pick up new values...');
    await page.reload();
    await page.waitForTimeout(3000);

    // Navigate to Programs/Training page
    console.log('\nStep 4: Going to Training page...');
    await page.goto('http://localhost:8081/programs');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/direct-training-page.png' });

    // Generate training plan
    console.log('\nStep 5: Generating training plan...');
    const generateBtn = page.locator('text=/Generate.*Training Plan/i');
    if (await generateBtn.isVisible({ timeout: 3000 })) {
      const isDisabled = await generateBtn.evaluate(el => {
        const button = el.closest('[role="button"]') || el.closest('button');
        return button?.getAttribute('aria-disabled') === 'true' || button?.disabled;
      });

      console.log(`  Generate button disabled: ${isDisabled}`);

      if (!isDisabled) {
        await generateBtn.click({ force: true });
        console.log('  Clicked! Waiting for plan generation...');
        await page.waitForTimeout(5000);
      } else {
        console.log('  Button is disabled - goals may not be set');
      }
    } else {
      console.log('  Generate button not found');
    }

    await page.screenshot({ path: 'screenshots/direct-after-generate.png' });

    // Check page content for cardio workout names
    console.log('\nStep 6: Checking generated workouts...');
    const pageContent = await page.content();

    console.log('\n=== WORKOUT CONTENT ANALYSIS ===');
    console.log(`Contains "Running Session": ${pageContent.includes('Running Session')}`);
    console.log(`Contains "Walking Session": ${pageContent.includes('Walking Session')}`);
    console.log(`Contains "Treadmill Running": ${pageContent.includes('Treadmill Running')}`);
    console.log(`Contains "Outdoor Running": ${pageContent.includes('Outdoor Running')}`);
    console.log(`Contains "Interval Running": ${pageContent.includes('Interval Running')}`);
    console.log(`Contains "Brisk Walking": ${pageContent.includes('Brisk Walking')}`);
    console.log(`Contains "HIIT Cardio": ${pageContent.includes('HIIT Cardio')}`);
    console.log(`Contains "Cardio Session": ${pageContent.includes('Cardio Session')}`);

    // Also look for any workout cards
    const workoutNames = await page.$$eval('[class*="workout"], [class*="exercise"]', els =>
      els.map(el => el.textContent).filter(t => t.length < 100)
    );
    console.log('\nWorkout elements found:', workoutNames.slice(0, 10));

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({ path: 'screenshots/direct-error.png' });
  }

  console.log('\n=== Test Complete ===');
  await page.waitForTimeout(3000);
  await browser.close();
})();
