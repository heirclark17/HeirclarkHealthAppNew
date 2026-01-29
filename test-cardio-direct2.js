const { chromium } = require('playwright');

(async () => {
  console.log('=== Direct Cardio Preference Test v2 ===\n');
  console.log('This test directly sets localStorage and tests training generation\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
  });
  const page = await context.newPage();

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    // Show all relevant logs
    if (text.includes('[GoalWizard]') ||
        text.includes('[Training]') ||
        text.includes('[TrainingService]') ||
        text.includes('[Programs]') ||
        text.includes('cardio') ||
        text.includes('Cardio') ||
        text.includes('Walking') ||
        text.includes('walking') ||
        text.includes('HIIT') ||
        text.includes('preference')) {
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

    // Step 2: Directly set goal wizard data with WALKING preference
    console.log('\nStep 2: Setting goal data with WALKING preference directly in localStorage...');

    await page.evaluate(() => {
      const goalData = {
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
        // THIS IS THE KEY - setting cardio preference to WALKING
        cardioPreference: 'walking',
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

      localStorage.setItem('hc_goal_wizard_progress', JSON.stringify(goalData));
      console.log('[Test] Set localStorage with cardioPreference:', goalData.cardioPreference);
      return goalData.cardioPreference;
    });

    console.log('  Goal data set with cardioPreference: walking');

    // Verify it was saved
    const savedPref = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('hc_goal_wizard_progress') || '{}');
      return data.cardioPreference;
    });
    console.log('  Verified saved cardioPreference:', savedPref);

    // Reload to pick up the new data
    console.log('\nStep 3: Reloading app to load the goal data...');
    await page.reload();
    await page.waitForTimeout(4000);

    // Navigate to Training page
    console.log('\nStep 4: Going to Training page...');
    await page.goto('http://localhost:8081/programs');
    await page.waitForTimeout(4000);

    await page.screenshot({ path: 'screenshots/direct2-training-page.png' });

    // Check if there's a cached training plan that needs to be cleared
    console.log('\nStep 5: Clearing any cached training plan...');
    await page.evaluate(() => {
      localStorage.removeItem('hc_training_plan_cache');
      console.log('[Test] Cleared training plan cache');
    });

    await page.reload();
    await page.waitForTimeout(3000);

    // Generate training plan
    console.log('\nStep 6: Generating training plan...');
    const generateBtn = page.locator('text=/Generate.*Training Plan/i');

    if (await generateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  Generate button found');

      // Check if disabled
      const buttonInfo = await generateBtn.evaluate(el => {
        const container = el.closest('[role="button"]') || el.closest('button') || el.parentElement;
        return {
          text: el.textContent,
          disabled: container?.getAttribute('aria-disabled') === 'true',
          opacity: container?.style?.opacity,
          classes: container?.className
        };
      });
      console.log('  Button info:', buttonInfo);

      await generateBtn.click({ force: true });
      console.log('  Clicked Generate button!');

      // Wait for generation
      console.log('  Waiting for plan generation (check console logs above)...');
      await page.waitForTimeout(6000);
    } else {
      console.log('  ERROR: Generate button not found');

      // Maybe plan already exists?
      const content = await page.content();
      if (content.includes('Regenerate')) {
        console.log('  Found Regenerate button - plan may already exist');
        const regenBtn = page.locator('text=/Regenerate/i');
        if (await regenBtn.isVisible().catch(() => false)) {
          await regenBtn.click({ force: true });
          console.log('  Clicked Regenerate');
          await page.waitForTimeout(6000);
        }
      }
    }

    await page.screenshot({ path: 'screenshots/direct2-after-generate.png' });

    // Analyze results
    console.log('\n=== ANALYZING RESULTS ===');

    const content = await page.content();

    console.log('\n--- Workout Type Check ---');
    console.log(`"Walking Session" in page: ${content.includes('Walking Session')}`);
    console.log(`"Running Session" in page: ${content.includes('Running Session')}`);
    console.log(`"HIIT Cardio Blast" in page: ${content.includes('HIIT Cardio Blast')}`);
    console.log(`"HIIT Cardio" in page: ${content.includes('HIIT Cardio')}`);

    console.log('\n--- Exercise Check ---');
    console.log(`"Brisk Walking" in page: ${content.includes('Brisk Walking')}`);
    console.log(`"Incline Treadmill Walk" in page: ${content.includes('Incline Treadmill Walk')}`);
    console.log(`"Power Walking" in page: ${content.includes('Power Walking')}`);
    console.log(`"Burpees" in page: ${content.includes('Burpees')}`);
    console.log(`"Mountain Climbers" in page: ${content.includes('Mountain Climbers')}`);
    console.log(`"Jump Squats" in page: ${content.includes('Jump Squats')}`);
    console.log(`"Jumping Jacks" in page: ${content.includes('Jumping Jacks')}`);

    // Check the cached training plan
    console.log('\n--- Cached Training Plan Check ---');
    const cachedPlan = await page.evaluate(() => {
      const cache = localStorage.getItem('hc_training_plan_cache');
      if (!cache) return null;
      const parsed = JSON.parse(cache);
      return {
        preferences: parsed.preferences,
        workoutNames: parsed.weeklyPlan?.days?.map(d => d.workout?.name).filter(Boolean),
        exerciseNames: parsed.weeklyPlan?.days
          ?.flatMap(d => d.workout?.exercises?.map(e => e.exercise?.name))
          .filter(Boolean)
          .slice(0, 15)
      };
    });

    if (cachedPlan) {
      console.log('Cached preferences:', JSON.stringify(cachedPlan.preferences, null, 2));
      console.log('Workout names:', cachedPlan.workoutNames);
      console.log('Some exercise names:', cachedPlan.exerciseNames);
    } else {
      console.log('No cached training plan found');
    }

    // Navigate through days to check for cardio day
    console.log('\n--- Checking all days for Walking workouts ---');
    for (let i = 0; i < 7; i++) {
      const dayBtn = page.locator(`text=/Mon|Tue|Wed|Thu|Fri|Sat|Sun/`).nth(i);
      if (await dayBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await dayBtn.click();
        await page.waitForTimeout(500);
        const dayContent = await page.content();
        const hasWalking = dayContent.includes('Walking Session') || dayContent.includes('Brisk Walking');
        const hasHiit = dayContent.includes('HIIT') || dayContent.includes('Burpees');
        if (hasWalking || hasHiit) {
          console.log(`Day ${i + 1}: Walking=${hasWalking}, HIIT=${hasHiit}`);
        }
      }
    }

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({ path: 'screenshots/direct2-error.png' });
  }

  console.log('\n=== Test Complete ===');
  await page.waitForTimeout(3000);
  await browser.close();
})();
