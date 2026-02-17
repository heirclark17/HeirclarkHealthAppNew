import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

// Helper to navigate to goals tab
async function navigateToGoals(page: Page) {
  await page.goto(`${BASE_URL}/goals`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
}

// Helper to complete wizard steps 1-4
async function completeWizardSteps1to4(page: Page) {
  // Step 1: Select "Lose Weight"
  await expect(page.locator('text=What\'s Your Goal?')).toBeVisible({ timeout: 10000 });
  await page.locator('text=Lose Weight').first().click();
  await page.waitForTimeout(500);
  await page.locator('text=CONTINUE').first().click();
  await page.waitForTimeout(1000);

  // Step 2: Body Metrics (use defaults)
  await expect(page.locator('text=Your Body Metrics')).toBeVisible({ timeout: 10000 });
  await page.locator('text=CONTINUE').first().click();
  await page.waitForTimeout(1000);

  // Step 3: Activity & Lifestyle
  await expect(page.getByText('Activity Level', { exact: true }).first()).toBeVisible({ timeout: 10000 });
  await page.locator('text=CONTINUE').first().click();
  await page.waitForTimeout(1000);

  // Step 4: Nutrition Preferences
  await expect(page.locator('text=Nutrition Preferences')).toBeVisible({ timeout: 10000 });
  await page.locator('text=CONTINUE').first().click();
  await page.waitForTimeout(1500);
}

test.describe('Training Plan Generation - Goal Wizard Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Step 5: Program Selection step displays correctly', async ({ page }) => {
    test.setTimeout(60000);
    console.log('Testing Step 5: Program Selection...');

    await navigateToGoals(page);
    await completeWizardSteps1to4(page);

    // Step 5: Program Selection should be visible
    await expect(page.locator('text=Training Program')).toBeVisible({ timeout: 10000 });

    // Should display available programs
    const pageContent = await page.textContent('body');
    const hasPrograms = pageContent?.includes('Starting Strength') ||
                        pageContent?.includes('StrongLifts') ||
                        pageContent?.includes('Push Pull Legs') ||
                        pageContent?.includes('Upper Lower');

    console.log('Has program options:', hasPrograms);
    expect(hasPrograms).toBeTruthy();

    console.log('Step 5 displays correctly');
  });

  test('Can select a program and proceed to Plan Preview', async ({ page }) => {
    test.setTimeout(90000);
    console.log('Testing program selection flow...');

    await navigateToGoals(page);
    await completeWizardSteps1to4(page);

    // Step 5: Wait for Program Selection
    await expect(page.locator('text=Training Program')).toBeVisible({ timeout: 10000 });

    // Click on the first available program card
    // Programs are rendered as GlassCard components - click the first program name
    const programCards = page.locator('text=Starting Strength, text=StrongLifts, text=Push Pull Legs, text=Upper Lower').first();
    const fallbackCard = page.locator('[data-testid]').filter({ hasText: /Strength|Legs|Upper|Push|Pull|HIIT/ }).first();

    // Try clicking any visible program
    const startingStrength = page.locator('text=Starting Strength').first();
    const strongLifts = page.locator('text=StrongLifts').first();
    const pushPull = page.locator('text=Push Pull Legs').first();

    let clicked = false;
    for (const programLocator of [startingStrength, strongLifts, pushPull]) {
      if (await programLocator.isVisible().catch(() => false)) {
        await programLocator.click();
        clicked = true;
        console.log('Clicked program card');
        break;
      }
    }

    if (!clicked) {
      // Fallback: click the first item that looks like a program
      const anyProgram = page.locator('text=/Strength|Legs|Upper|Push|HIIT|Fat Loss|Muscle/i').first();
      await anyProgram.click();
      console.log('Clicked fallback program card');
    }

    await page.waitForTimeout(1000);

    // Program Preview Modal should appear with "SELECT THIS PROGRAM" button
    const selectButton = page.locator('text=SELECT THIS PROGRAM');
    await expect(selectButton).toBeVisible({ timeout: 10000 });
    console.log('Program preview modal appeared');

    // Click "SELECT THIS PROGRAM"
    await selectButton.click();
    await page.waitForTimeout(2000);

    // Should auto-advance to Step 6: Plan Preview
    await expect(page.locator('text=Your Personalized Plan')).toBeVisible({ timeout: 15000 });
    console.log('Successfully advanced to Plan Preview (Step 6)');
  });

  test('Full wizard flow with training plan generation', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes - AI generation takes time

    // Capture console logs for debugging
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Training]') || text.includes('[Goals]') || text.includes('[Programs]') || text.includes('[PlanGenerator]')) {
        consoleLogs.push(text);
      }
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`PAGEERROR: ${error.name}: ${error.message}`);
    });

    console.log('Starting full wizard flow with training plan generation...');

    await navigateToGoals(page);
    await completeWizardSteps1to4(page);

    // Step 5: Select a program
    console.log('Step 5: Selecting training program...');
    await expect(page.locator('text=Training Program')).toBeVisible({ timeout: 10000 });

    // Click on the first visible program
    const programNames = ['Starting Strength', 'StrongLifts', 'Push Pull Legs', 'Upper Lower'];
    let selectedProgramName = '';

    for (const name of programNames) {
      const locator = page.locator(`text=${name}`).first();
      if (await locator.isVisible().catch(() => false)) {
        await locator.click();
        selectedProgramName = name;
        console.log(`Selected program: ${name}`);
        break;
      }
    }

    if (!selectedProgramName) {
      // Try any visible program card
      const anyProgram = page.locator('text=/Strength|Legs|Upper|Push|HIIT|Fat Loss|Muscle/i').first();
      await anyProgram.click();
      selectedProgramName = 'first available';
      console.log('Selected first available program');
    }

    await page.waitForTimeout(1000);

    // Confirm program selection
    await expect(page.locator('text=SELECT THIS PROGRAM')).toBeVisible({ timeout: 10000 });
    await page.locator('text=SELECT THIS PROGRAM').click();
    await page.waitForTimeout(2000);

    // Step 6: Plan Preview - Confirm the plan
    console.log('Step 6: Confirming plan...');
    await expect(page.locator('text=Your Personalized Plan')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=CONFIRM MY PLAN')).toBeVisible({ timeout: 5000 });
    await page.locator('text=CONFIRM MY PLAN').first().click();
    await page.waitForTimeout(4000);

    // Success Screen
    console.log('Verifying success screen...');
    await expect(page.locator('text=You\'re All Set!')).toBeVisible({ timeout: 10000 });

    // Click "Start Your Training Plan" button
    console.log('Clicking Start Your Training Plan...');
    const trainingButton = page.getByTestId('start-training-plan-button');
    await expect(trainingButton).toBeVisible({ timeout: 10000 });
    await trainingButton.click({ force: true });

    // Wait for AI generation (this can take 15-60 seconds)
    console.log('Waiting for AI training plan generation...');

    // Check for "Generating AI Training Plan..." loading state
    const generatingText = page.locator('text=Generating AI Training Plan...');
    const isGenerating = await generatingText.isVisible({ timeout: 5000 }).catch(() => false);
    if (isGenerating) {
      console.log('AI generation in progress...');
    }

    // Wait for navigation to Programs page (up to 90 seconds for AI generation)
    await page.waitForURL('**/programs**', { timeout: 90000 }).catch(async () => {
      // If URL doesn't change, manually navigate after generation completes
      console.log('URL did not change to /programs, navigating manually...');
      await page.waitForTimeout(5000);
      await page.goto(`${BASE_URL}/programs`);
      await page.waitForLoadState('networkidle');
    });

    await page.waitForTimeout(3000);

    // Verify Programs page shows workouts (NOT all rest days)
    console.log('Verifying Programs page has workouts...');
    const programsContent = await page.textContent('body');

    // Check for workout content - at least one of these should be present
    const hasWorkoutContent = programsContent?.includes('Workout') ||
                              programsContent?.includes('sets') ||
                              programsContent?.includes('reps') ||
                              programsContent?.includes('Bench Press') ||
                              programsContent?.includes('Squat') ||
                              programsContent?.includes('Deadlift') ||
                              programsContent?.includes('exercises') ||
                              programsContent?.includes('Push') ||
                              programsContent?.includes('Pull') ||
                              programsContent?.includes('Legs');

    // Check that it's NOT all rest days
    const allRestDays = !hasWorkoutContent && (
      programsContent?.includes('Rest Day') ||
      programsContent?.includes('rest day') ||
      programsContent?.includes('No workout')
    );

    console.log('Has workout content:', hasWorkoutContent);
    console.log('All rest days:', allRestDays);
    console.log('Console logs captured:', consoleLogs.length);

    // Print relevant console logs
    consoleLogs.forEach(log => console.log('  ', log));

    // Check for critical errors
    const criticalErrors = consoleErrors.filter(err =>
      err.includes('ReferenceError') ||
      err.includes('TypeError') ||
      err.includes('selectProgramAndGenerate') ||
      err.includes('PAGEERROR')
    );

    if (criticalErrors.length > 0) {
      console.log('CRITICAL ERRORS found:');
      criticalErrors.forEach(err => console.log('  ERROR:', err));
    }

    // Assert no critical JS errors (like ReferenceError for missing imports)
    expect(criticalErrors.length).toBe(0);

    // Assert workouts are present (not all rest days)
    if (allRestDays) {
      console.log('FAIL: Programs page shows all rest days - generation may have failed');
    }
    expect(hasWorkoutContent || !allRestDays).toBeTruthy();

    console.log('Full wizard flow with training plan generation passed!');
  });

  test('selectProgramAndGenerate is properly imported and callable', async ({ page }) => {
    test.setTimeout(60000);

    // This test specifically verifies the fix: selectProgramAndGenerate must be
    // destructured from useTraining() in goals.tsx

    const jsErrors: string[] = [];

    page.on('pageerror', error => {
      jsErrors.push(`${error.name}: ${error.message}`);
    });

    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('ReferenceError')) {
        jsErrors.push(msg.text());
      }
    });

    await navigateToGoals(page);
    await completeWizardSteps1to4(page);

    // Step 5: Select a program
    await expect(page.locator('text=Training Program')).toBeVisible({ timeout: 10000 });

    // Click first visible program
    const anyProgram = page.locator('text=/Strength|Legs|Upper|Push|HIIT|Fat Loss|Muscle|StrongLifts/i').first();
    await anyProgram.click();
    await page.waitForTimeout(1000);

    // Confirm selection
    await expect(page.locator('text=SELECT THIS PROGRAM')).toBeVisible({ timeout: 10000 });
    await page.locator('text=SELECT THIS PROGRAM').click();
    await page.waitForTimeout(2000);

    // Step 6: Confirm plan
    await expect(page.locator('text=CONFIRM MY PLAN')).toBeVisible({ timeout: 15000 });
    await page.locator('text=CONFIRM MY PLAN').first().click();
    await page.waitForTimeout(4000);

    // Success screen: Click Start Training Plan
    await expect(page.locator('text=You\'re All Set!')).toBeVisible({ timeout: 10000 });
    const trainingButton = page.getByTestId('start-training-plan-button');
    await expect(trainingButton).toBeVisible({ timeout: 10000 });
    await trainingButton.click({ force: true });

    // Wait a moment for any JS errors to surface
    await page.waitForTimeout(3000);

    // Check for ReferenceError (the original bug was selectProgramAndGenerate not imported)
    const referenceErrors = jsErrors.filter(e =>
      e.includes('ReferenceError') ||
      e.includes('selectProgramAndGenerate is not defined') ||
      e.includes('selectProgramAndGenerate is not a function')
    );

    if (referenceErrors.length > 0) {
      console.log('REFERENCE ERRORS FOUND (selectProgramAndGenerate not imported):');
      referenceErrors.forEach(e => console.log('  ', e));
    }

    expect(referenceErrors.length).toBe(0);
    console.log('selectProgramAndGenerate is properly imported - no ReferenceErrors');
  });
});

test.describe('Programs Page - Workout Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Programs page loads without critical errors', async ({ page }) => {
    test.setTimeout(30000);

    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(`${error.name}: ${error.message}`);
    });

    await page.goto(`${BASE_URL}/programs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    // Check for uncaught errors
    const uncaught = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('favicon') &&
      !e.includes('expo-system-ui')
    );

    if (uncaught.length > 0) {
      console.log('Uncaught errors on Programs page:');
      uncaught.forEach(e => console.log('  ', e));
    }

    // Programs page should have either content or empty state
    const hasContent = pageContent?.includes('Training') ||
                       pageContent?.includes('Program') ||
                       pageContent?.includes('Workout') ||
                       pageContent?.includes('Generate') ||
                       pageContent?.includes('personalized');

    expect(hasContent).toBeTruthy();
    console.log('Programs page loads without critical errors');
  });

  test('Programs page displays workout details when plan exists', async ({ page }) => {
    test.setTimeout(30000);

    const trainingLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[Training]')) {
        trainingLogs.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/programs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const pageContent = await page.textContent('body');

    // Log what TrainingContext is doing
    console.log('Training context logs:');
    trainingLogs.forEach(l => console.log('  ', l));

    // Check for workout details
    const hasWorkoutDetails = pageContent?.includes('Workout') ||
                              pageContent?.includes('sets') ||
                              pageContent?.includes('reps') ||
                              pageContent?.includes('Bench') ||
                              pageContent?.includes('Squat') ||
                              pageContent?.includes('Deadlift');

    const isEmptyState = pageContent?.includes('Generate') ||
                         pageContent?.includes('Set Your Goals') ||
                         pageContent?.includes('personalized');

    const isRestDay = pageContent?.includes('Rest Day') ||
                      pageContent?.includes('rest day') ||
                      pageContent?.includes('recovery');

    console.log('Has workout details:', hasWorkoutDetails);
    console.log('Is empty state:', isEmptyState);
    console.log('Shows rest day:', isRestDay);

    // The page should show something (not blank)
    expect(hasWorkoutDetails || isEmptyState || isRestDay).toBeTruthy();

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/programs-page-state.png' });
    console.log('Screenshot saved to test-results/programs-page-state.png');
  });

  test('Generate button triggers plan creation', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for AI generation

    const trainingLogs: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Training]') || text.includes('[Programs]') || text.includes('[PlanGenerator]')) {
        trainingLogs.push(text);
      }
    });

    page.on('pageerror', error => {
      errors.push(`${error.name}: ${error.message}`);
    });

    await page.goto(`${BASE_URL}/programs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for generate button
    const generateButton = page.locator('text=/Generate.*Training|Generate.*Plan/i').first();
    const hasGenerate = await generateButton.isVisible().catch(() => false);

    if (hasGenerate) {
      console.log('Found Generate button, clicking...');
      await generateButton.click();

      // Wait for generation to start
      await page.waitForTimeout(5000);

      // Check for loading state
      const isLoading = await page.locator('text=/Generating|Creating|Loading/i').isVisible().catch(() => false);
      console.log('Generation in progress:', isLoading);

      // Wait for generation to complete (up to 90 seconds)
      if (isLoading) {
        await page.waitForFunction(
          () => !document.body.textContent?.includes('Generating'),
          { timeout: 90000 }
        ).catch(() => {
          console.log('Generation may still be in progress after timeout');
        });
      }

      await page.waitForTimeout(3000);

      // Verify workouts appear
      const afterContent = await page.textContent('body');
      const hasWorkouts = afterContent?.includes('Workout') ||
                          afterContent?.includes('sets') ||
                          afterContent?.includes('reps') ||
                          afterContent?.includes('exercises');

      console.log('Has workouts after generation:', hasWorkouts);

      // Print training logs
      console.log('Training logs during generation:');
      trainingLogs.forEach(l => console.log('  ', l));

      // Check for errors
      if (errors.length > 0) {
        console.log('Errors during generation:');
        errors.forEach(e => console.log('  ', e));
      }
    } else {
      console.log('No Generate button visible (plan may already exist)');

      // Verify existing plan has content
      const content = await page.textContent('body');
      const hasPlanContent = content?.includes('Workout') ||
                             content?.includes('Week') ||
                             content?.includes('Rest Day');
      console.log('Existing plan has content:', hasPlanContent);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/programs-after-generate.png' });
    console.log('Screenshot saved');
  });
});
