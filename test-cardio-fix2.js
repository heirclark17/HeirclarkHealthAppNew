const { chromium } = require('playwright');

(async () => {
  console.log('=== Testing Cardio Preference Fix v2 ===\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 }, // iPhone XR size - taller
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

  // Helper to click Continue button
  async function clickContinue() {
    // Scroll to bottom first to make sure Continue is visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);

    const continueBtn = page.locator('text=/^CONTINUE$/i, text=/Continue/i').first();
    await continueBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await continueBtn.click({ force: true });
    await page.waitForTimeout(1500);
  }

  try {
    // Clear storage first
    console.log('Step 1: Loading app and clearing storage...');
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
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

    await clickContinue();
    console.log('  Moved to Step 2');

    // Step 2: Body Metrics - continue
    console.log('\nStep 4: Body Metrics - continuing...');
    await clickContinue();
    console.log('  Moved to Step 3');

    // Step 3: Activity & Lifestyle - SELECT WALKING
    console.log('\nStep 5: Activity & Lifestyle - Looking for Walking option...');
    await page.waitForTimeout(1000);

    // Take screenshot before scrolling
    await page.screenshot({ path: 'screenshots/fix2-step3-initial.png' });

    // Find the scrollable container and scroll within it
    const scrollResult = await page.evaluate(async () => {
      // Find all scrollable elements
      const scrollables = document.querySelectorAll('[class*="scroll"], [class*="Scroll"]');
      let foundWalking = false;

      // Try to find Walking text
      const walkingElements = document.querySelectorAll('*');
      for (const el of walkingElements) {
        if (el.textContent === 'Walking' || el.textContent?.includes('Walking')) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.height < 100) {
            foundWalking = true;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      }

      // Also scroll the main content area
      const mainScroll = document.querySelector('[class*="ScrollView"]') ||
                         document.querySelector('[data-testid*="scroll"]') ||
                         document.documentElement;
      if (mainScroll) {
        mainScroll.scrollTop = mainScroll.scrollHeight / 2;
      }

      return { foundWalking };
    });

    console.log('  Scroll result:', scrollResult);
    await page.waitForTimeout(1000);

    // Try multiple scroll approaches
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 250);
      await page.waitForTimeout(400);
    }

    await page.screenshot({ path: 'screenshots/fix2-step3-scrolled.png' });

    // Look for Walking option with multiple strategies
    let walkingClicked = false;

    // Strategy 1: Direct text match
    const walkingText = page.locator('text="Walking"').first();
    if (await walkingText.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  Found "Walking" text, clicking...');
      await walkingText.click();
      walkingClicked = true;
    }

    // Strategy 2: Look for card containing Walking
    if (!walkingClicked) {
      const walkingCard = page.locator('[class*="card"]').filter({ hasText: /^Walking$/ }).first();
      if (await walkingCard.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('  Found Walking card, clicking...');
        await walkingCard.click();
        walkingClicked = true;
      }
    }

    // Strategy 3: Use evaluate to click
    if (!walkingClicked) {
      const clicked = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          if (el.textContent === 'Walking' && el.offsetParent !== null) {
            el.click();
            return true;
          }
        }
        // Also try parent elements
        for (const el of elements) {
          if (el.textContent?.trim() === 'Walking') {
            const parent = el.parentElement?.parentElement;
            if (parent) {
              parent.click();
              return true;
            }
          }
        }
        return false;
      });
      if (clicked) {
        console.log('  Clicked Walking via evaluate');
        walkingClicked = true;
      }
    }

    console.log(`  Walking clicked: ${walkingClicked}`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/fix2-after-walking-click.png' });

    // Continue to next step
    await clickContinue();
    console.log('  Moved to Step 4');

    // Step 4: Nutrition - continue
    console.log('\nStep 6: Nutrition - continuing...');
    await clickContinue();
    console.log('  Moved to Step 5');

    // Step 5: Confirm
    console.log('\nStep 7: Confirming plan...');
    await page.waitForTimeout(1000);

    // Scroll to find Confirm button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/fix2-before-confirm.png' });

    const confirmBtn = page.locator('text=/Confirm.*Plan/i').first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
      console.log('  Clicked Confirm!');
      await page.waitForTimeout(3000);
    } else {
      console.log('  Confirm button not found, trying alternative...');
      const altConfirm = page.locator('button, [role="button"]').filter({ hasText: /confirm/i }).first();
      if (await altConfirm.isVisible({ timeout: 1000 }).catch(() => false)) {
        await altConfirm.click({ force: true });
        console.log('  Clicked alternative confirm!');
        await page.waitForTimeout(3000);
      }
    }

    await page.screenshot({ path: 'screenshots/fix2-after-confirm.png' });

    // Check what was saved
    console.log('\n=== CHECKING SAVED DATA ===');
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('hc_goal_wizard_progress');
      return data ? JSON.parse(data) : null;
    });

    if (savedData) {
      console.log('Saved cardioPreference:', savedData.cardioPreference);
      console.log('Saved primaryGoal:', savedData.primaryGoal);
      console.log('Saved isComplete:', savedData.isComplete);
    } else {
      console.log('ERROR: No saved data found in localStorage!');
    }

    // Go to Training page
    console.log('\n=== TESTING TRAINING PLAN GENERATION ===');
    console.log('Going to Training page...');
    await page.goto('http://localhost:8081/programs');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/fix2-training-page.png' });

    // Generate training plan
    console.log('Looking for Generate button...');
    const generateBtn = page.locator('text=/Generate.*Training Plan/i');
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  Generate button found, clicking...');
      await generateBtn.click({ force: true });
      console.log('  Waiting for plan generation...');
      await page.waitForTimeout(6000);
    } else {
      console.log('  Generate button not visible');
    }

    await page.screenshot({ path: 'screenshots/fix2-after-generate.png' });

    // Check the page content
    console.log('\n=== RESULTS ===');
    const content = await page.content();

    console.log('\nWorkout names in page:');
    console.log(`  "Walking Session": ${content.includes('Walking Session')}`);
    console.log(`  "Running Session": ${content.includes('Running Session')}`);
    console.log(`  "HIIT Cardio Blast": ${content.includes('HIIT Cardio Blast')}`);

    console.log('\nExercise names in page:');
    console.log(`  "Brisk Walking": ${content.includes('Brisk Walking')}`);
    console.log(`  "Incline Treadmill": ${content.includes('Incline Treadmill')}`);
    console.log(`  "Power Walking": ${content.includes('Power Walking')}`);
    console.log(`  "Burpees": ${content.includes('Burpees')}`);
    console.log(`  "Mountain Climbers": ${content.includes('Mountain Climbers')}`);

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({ path: 'screenshots/fix2-error.png' });
  }

  console.log('\n=== Test Complete ===');
  await page.waitForTimeout(5000);
  await browser.close();
})();
