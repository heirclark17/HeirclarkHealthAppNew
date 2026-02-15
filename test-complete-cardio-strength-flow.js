const { chromium } = require('playwright');

/**
 * End-to-End Test: Goal Wizard → Success Screen → Programs Page (Cardio/Strength Separation)
 *
 * Tests the complete flow including:
 * 1. Complete goal wizard (6 steps)
 * 2. Click "Start Your Training Plan"
 * 3. Wait for AI generation
 * 4. Verify Programs page displays:
 *    - Strength Training Calendar
 *    - Today's Workout
 *    - Today's Cardio Recommendation (NEW)
 *    - Nutrition Guidance (NEW)
 */

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting End-to-End Test: Goal Wizard → Programs Page');
    console.log('═══════════════════════════════════════════════════════\n');

    // Navigate to the app
    console.log('📱 Step 1: Navigating to app...');
    await page.goto('http://192.168.4.28:8081');
    await page.waitForTimeout(3000);
    console.log('✅ App loaded\n');

    // Check if already logged in by looking for Goals tab
    console.log('🔐 Step 2: Checking login status...');
    const goalsTab = await page.locator('text=Goals').first();
    const isGoalsTabVisible = await goalsTab.isVisible().catch(() => false);

    if (!isGoalsTabVisible) {
      console.log('   Not logged in - looking for login/signup flow...');

      // Look for "Try the App" button (onboarding)
      const tryAppButton = await page.locator('text=/Try.*App/i').first();
      const isTryAppVisible = await tryAppButton.isVisible().catch(() => false);

      if (isTryAppVisible) {
        console.log('   Found "Try the App" button - clicking...');
        await tryAppButton.click();
        await page.waitForTimeout(2000);
      }

      // Look for email/password login
      const emailInput = await page.locator('input[placeholder*="email" i], input[type="email"]').first();
      const isEmailVisible = await emailInput.isVisible().catch(() => false);

      if (isEmailVisible) {
        console.log('   Found login form - entering credentials...');
        await emailInput.fill('test@example.com');
        await page.locator('input[type="password"]').fill('password123');
        await page.locator('text=/log.*in/i').first().click();
        await page.waitForTimeout(3000);
      }
    }
    console.log('✅ Logged in\n');

    // Navigate to Goals tab
    console.log('📋 Step 3: Opening Goals tab...');
    await page.locator('text=Goals').first().click();
    await page.waitForTimeout(2000);
    console.log('✅ Goals tab opened\n');

    // Check if goal wizard is already visible or if we need to start it
    const step1 = await page.locator('text=/Lose Weight|Build Muscle|Improve Fitness/i').first();
    const isStep1Visible = await step1.isVisible().catch(() => false);

    if (!isStep1Visible) {
      console.log('   Goal wizard not visible - looking for "Set Goals" or similar button...');
      const setGoalsButton = await page.locator('text=/Set Goals|Start|Begin/i').first();
      const isButtonVisible = await setGoalsButton.isVisible().catch(() => false);

      if (isButtonVisible) {
        console.log('   Found button - clicking...');
        await setGoalsButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Step 1: Primary Goal
    console.log('🎯 Step 4: Completing Goal Wizard Step 1/6 (Primary Goal)...');
    await page.locator('text=Lose Weight').first().click();
    await page.waitForTimeout(1000);
    await page.locator('text=Next').first().click();
    await page.waitForTimeout(1500);
    console.log('✅ Step 1 complete\n');

    // Step 2: Body Metrics
    console.log('📊 Step 5: Completing Goal Wizard Step 2/6 (Body Metrics)...');
    // Fill in metrics
    const currentWeightInput = await page.locator('input').nth(0); // First input
    await currentWeightInput.fill('180');
    await page.waitForTimeout(500);

    const targetWeightInput = await page.locator('input').nth(1); // Second input
    await targetWeightInput.fill('160');
    await page.waitForTimeout(500);

    const heightInput = await page.locator('input').nth(2); // Third input
    await heightInput.fill('70');
    await page.waitForTimeout(500);

    const ageInput = await page.locator('input').nth(3); // Fourth input
    await ageInput.fill('30');
    await page.waitForTimeout(1000);

    await page.locator('text=Next').first().click();
    await page.waitForTimeout(1500);
    console.log('✅ Step 2 complete\n');

    // Step 3: Activity Level
    console.log('🏃 Step 6: Completing Goal Wizard Step 3/6 (Activity Level)...');
    await page.locator('text=/Moderate.*Active/i').first().click();
    await page.waitForTimeout(1000);
    await page.locator('text=Next').first().click();
    await page.waitForTimeout(1500);
    console.log('✅ Step 3 complete\n');

    // Step 4: Nutrition Preferences
    console.log('🍽️ Step 7: Completing Goal Wizard Step 4/6 (Nutrition)...');
    // Skip nutrition customization for now - just click Next
    await page.locator('text=Next').first().click();
    await page.waitForTimeout(1500);
    console.log('✅ Step 4 complete\n');

    // Step 5: Program Selection
    console.log('💪 Step 8: Completing Goal Wizard Step 5/6 (Program Selection)...');
    // Select first program (Push/Pull/Legs or similar)
    const programCard = await page.locator('text=/Push.*Pull|Full.*Body|Upper.*Lower/i').first();
    const isProgramVisible = await programCard.isVisible().catch(() => false);

    if (isProgramVisible) {
      await programCard.click();
      await page.waitForTimeout(1000);
    }

    await page.locator('text=Next').first().click();
    await page.waitForTimeout(1500);
    console.log('✅ Step 5 complete\n');

    // Step 6: Review and Confirm
    console.log('📝 Step 9: Completing Goal Wizard Step 6/6 (Review)...');
    await page.locator('text=/Complete|Finish|Confirm/i').first().click();
    await page.waitForTimeout(3000);
    console.log('✅ Step 6 complete - Goal wizard finished!\n');

    // Success Screen - Click "Start Your Training Plan"
    console.log('🎉 Step 10: On Success Screen - clicking "Start Your Training Plan"...');
    const startTrainingButton = await page.locator('text=/Start.*Training.*Plan/i').first();
    await startTrainingButton.waitFor({ timeout: 10000 });
    await startTrainingButton.click();
    console.log('✅ Button clicked - waiting for AI generation...\n');

    // Wait for AI generation (up to 5 minutes)
    console.log('⏳ Step 11: Waiting for AI workout plan generation (max 5 minutes)...');
    await page.waitForTimeout(5000); // Initial wait

    // Check if we navigated to Programs tab
    let currentUrl = page.url();
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 5 seconds = 5 minutes

    while (!currentUrl.includes('/programs') && attempts < maxAttempts) {
      console.log(`   Attempt ${attempts + 1}/${maxAttempts} - Waiting for navigation...`);
      await page.waitForTimeout(5000);
      currentUrl = page.url();
      attempts++;
    }

    if (currentUrl.includes('/programs')) {
      console.log('✅ Successfully navigated to Programs page!\n');
    } else {
      console.log('⚠️  Did not auto-navigate - checking if plan generated...\n');
      // Manually navigate to programs tab
      await page.locator('text=Programs').first().click();
      await page.waitForTimeout(3000);
    }

    // Verify Programs Page Content
    console.log('🔍 Step 12: Verifying Programs page content...\n');

    // Check for Strength Training Calendar
    const calendarCard = await page.locator('text=/Calendar|Weekly.*Schedule/i').first();
    const hasCalendar = await calendarCard.isVisible().catch(() => false);
    console.log(hasCalendar ? '✅ Strength Training Calendar: FOUND' : '❌ Strength Training Calendar: NOT FOUND');

    // Check for Today's Workout
    const workoutCard = await page.locator('text=/Today.*Workout|Current.*Workout/i').first();
    const hasWorkout = await workoutCard.isVisible().catch(() => false);
    console.log(hasWorkout ? '✅ Today\'s Workout: FOUND' : '❌ Today\'s Workout: NOT FOUND');

    // Check for Cardio Recommendation Card (NEW)
    const cardioCard = await page.locator('text=/Cardio|Monday.*Cardio|Tuesday.*Cardio|Wednesday.*Cardio/i').first();
    const hasCardio = await cardioCard.isVisible().catch(() => false);
    console.log(hasCardio ? '✅ Today\'s Cardio Recommendation: FOUND (NEW)' : '❌ Today\'s Cardio Recommendation: NOT FOUND');

    // Check for Nutrition Guidance Card (NEW)
    const nutritionCard = await page.locator('text=/Nutrition.*Guidance|Calorie.*Deficit/i').first();
    const hasNutrition = await nutritionCard.isVisible().catch(() => false);
    console.log(hasNutrition ? '✅ Nutrition Guidance: FOUND (NEW)' : '❌ Nutrition Guidance: NOT FOUND');

    // Take screenshot of Programs page
    await page.screenshot({ path: 'test-programs-page-cardio-strength.png', fullPage: true });
    console.log('\n📸 Screenshot saved: test-programs-page-cardio-strength.png');

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Strength Calendar: ${hasCalendar ? 'PASS' : 'FAIL'}`);
    console.log(`Today's Workout: ${hasWorkout ? 'PASS' : 'FAIL'}`);
    console.log(`Cardio Card: ${hasCardio ? 'PASS' : 'FAIL'}`);
    console.log(`Nutrition Card: ${hasNutrition ? 'PASS' : 'FAIL'}`);
    console.log('═══════════════════════════════════════════════════════\n');

    const allPassed = hasCalendar && hasWorkout && hasCardio && hasNutrition;

    if (allPassed) {
      console.log('✅ ALL TESTS PASSED! Cardio/Strength separation working correctly!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Review screenshot for details');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error);
    await page.screenshot({ path: 'test-error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved: test-error-screenshot.png');
  } finally {
    console.log('\n🏁 Test complete - closing browser...');
    await browser.close();
  }
})();
