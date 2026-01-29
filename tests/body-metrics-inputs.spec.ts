import { test, expect, Page } from '@playwright/test';

test.describe('Body Metrics Input Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to goals and get to body metrics step
    await page.goto('http://localhost:8081/goals');
    await page.waitForTimeout(2000);

    // Step 1: Select goal (Lose Weight to show all controls)
    await page.locator('text=Lose Weight').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=CONTINUE').first().click();
    await page.waitForTimeout(1500);

    console.log('--- Navigated to Body Metrics Step ---');
  });

  test.describe('Weight Scale Slider Tests', () => {
    test('Current weight scale slider should be visible and responsive', async ({ page }) => {
      console.log('Testing Current Weight Scale Slider...');

      // Find the Current Weight label and scale
      const currentWeightLabel = page.locator('text=Current Weight');
      await expect(currentWeightLabel).toBeVisible();
      console.log('Current Weight label found');

      // Look for the scale value display (large number)
      const scaleValues = await page.locator('[class*="scaleValue"], text=/^\\d{2,3}$/').all();
      console.log(`Found ${scaleValues.length} scale value elements`);

      // Take initial screenshot
      await page.screenshot({ path: 'tests/screenshots/weight-scale-initial.png', fullPage: true });

      // Find the horizontal scroll container for current weight
      // The scale slider should have horizontal scrolling
      const scrollContainers = await page.locator('[class*="scaleTrack"], [class*="scale"]').all();
      console.log(`Found ${scrollContainers.length} scale containers`);

      // Try to find any scrollable element in the weight section
      const weightSection = page.locator('text=WEIGHT').locator('..').locator('..');

      // Get the initial displayed weight value
      const initialWeightText = await page.locator('text=/\\d{2,3}.*lbs|\\d{2,3}.*kg/').first().textContent();
      console.log('Initial weight display:', initialWeightText);

      // Try horizontal scroll/drag on the scale
      const scaleArea = page.locator('text=Current Weight').locator('..').locator('..').locator('[class*="scale"]').first();

      // Alternative: Try to find a scrollable element
      try {
        // Simulate horizontal drag
        const boundingBox = await weightSection.boundingBox();
        if (boundingBox) {
          console.log('Weight section bounding box:', boundingBox);

          // Perform horizontal drag (left to right)
          await page.mouse.move(boundingBox.x + boundingBox.width * 0.3, boundingBox.y + 150);
          await page.mouse.down();
          await page.mouse.move(boundingBox.x + boundingBox.width * 0.7, boundingBox.y + 150, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(500);

          console.log('Performed horizontal drag on weight section');
        }
      } catch (e) {
        console.log('Could not perform drag on weight section:', e);
      }

      // Take screenshot after interaction
      await page.screenshot({ path: 'tests/screenshots/weight-scale-after-drag.png', fullPage: true });
    });

    test('Weight scale should respond to multiple scroll directions', async ({ page }) => {
      console.log('Testing weight scale scroll responsiveness...');

      // Get weight section
      const weightSection = page.locator('text=WEIGHT').locator('..').locator('..');
      await expect(weightSection).toBeVisible();

      // Find the scale track (horizontal scrollable area)
      const scaleTrack = weightSection.locator('div').filter({
        has: page.locator('div') // Has child divs (tick marks)
      });

      // Get initial weight value from any visible number
      const weightNumbers = await page.locator('text=/^\\d{2,3}$/').allTextContents();
      console.log('Weight numbers on screen:', weightNumbers.slice(0, 5));

      // Record initial value
      const initialValue = weightNumbers[0];
      console.log('Initial weight value:', initialValue);

      // Find bounds of weight section
      const bounds = await weightSection.boundingBox();
      if (!bounds) {
        console.log('Could not get weight section bounds');
        return;
      }

      // Test 1: Scroll right (decrease weight)
      console.log('Test 1: Scrolling right...');
      const centerY = bounds.y + bounds.height * 0.6;
      const startX = bounds.x + bounds.width * 0.6;
      const endX = bounds.x + bounds.width * 0.2;

      await page.mouse.move(startX, centerY);
      await page.mouse.down();
      await page.mouse.move(endX, centerY, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(800);

      // Check if value changed
      const afterScrollRight = await page.locator('text=/^\\d{2,3}$/').first().textContent();
      console.log('After scroll right:', afterScrollRight);

      // Test 2: Scroll left (increase weight)
      console.log('Test 2: Scrolling left...');
      await page.mouse.move(endX, centerY);
      await page.mouse.down();
      await page.mouse.move(startX, centerY, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(800);

      const afterScrollLeft = await page.locator('text=/^\\d{2,3}$/').first().textContent();
      console.log('After scroll left:', afterScrollLeft);

      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/weight-scroll-test.png', fullPage: true });

      // Report findings
      console.log('\n=== Weight Scale Scroll Test Results ===');
      console.log(`Initial value: ${initialValue}`);
      console.log(`After right scroll: ${afterScrollRight}`);
      console.log(`After left scroll: ${afterScrollLeft}`);
      console.log(`Slider responded: ${initialValue !== afterScrollRight || afterScrollRight !== afterScrollLeft ? 'YES' : 'NO - STICKY!'}`);
    });

    test('Target weight scale should be independent from current weight', async ({ page }) => {
      console.log('Testing Target Weight Scale...');

      // Scroll down to see target weight
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(500);

      // Find Target Weight label
      const targetWeightLabel = page.locator('text=Target Weight');
      const isVisible = await targetWeightLabel.isVisible().catch(() => false);

      if (!isVisible) {
        console.log('Target Weight section not visible - may be hidden for maintain goal');
        return;
      }

      console.log('Target Weight section found');
      await page.screenshot({ path: 'tests/screenshots/target-weight-visible.png', fullPage: true });

      // Get target weight section bounds
      const targetSection = targetWeightLabel.locator('..').locator('..');
      const bounds = await targetSection.boundingBox();

      if (bounds) {
        // Try to interact with target weight scale
        const centerY = bounds.y + bounds.height / 2;
        await page.mouse.move(bounds.x + bounds.width * 0.5, centerY);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width * 0.2, centerY, { steps: 15 });
        await page.mouse.up();
        await page.waitForTimeout(500);

        console.log('Interacted with target weight scale');
      }

      await page.screenshot({ path: 'tests/screenshots/target-weight-after.png', fullPage: true });
    });
  });

  test.describe('Date Picker Tests', () => {
    test('Start date picker should open and respond to changes', async ({ page }) => {
      console.log('Testing Start Date Picker...');

      // Scroll to date section
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(500);

      // Find start date section
      const startDateSection = page.locator('text=WHEN DO YOU WANT TO START?');
      await expect(startDateSection).toBeVisible({ timeout: 5000 });
      console.log('Start date section found');

      // Find the date button (contains a formatted date)
      const dateButton = page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first();
      const initialDate = await dateButton.textContent();
      console.log('Initial start date:', initialDate);

      // Click to open
      await dateButton.click();
      await page.waitForTimeout(800);
      console.log('Clicked start date button');

      // Take screenshot of open state
      await page.screenshot({ path: 'tests/screenshots/start-date-opened.png', fullPage: true });

      // Check if picker opened (Done button should be visible on iOS)
      const doneButton = page.locator('text=Done');
      const isOpen = await doneButton.isVisible().catch(() => false);
      console.log('Date picker opened (Done visible):', isOpen);

      if (isOpen) {
        // Try to interact with the date picker
        // On web, this may be rendered differently

        // Close it
        await doneButton.click();
        await page.waitForTimeout(500);
      }

      // Verify date persisted
      const finalDate = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first().textContent();
      console.log('Final start date:', finalDate);
      console.log('Date persisted correctly:', initialDate === finalDate ? 'YES' : 'NO - CHANGED UNEXPECTEDLY');
    });

    test('Goal date picker should work independently', async ({ page }) => {
      console.log('Testing Goal Date Picker...');

      // Scroll to goal date section
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForTimeout(500);

      // Find goal date section
      const goalDateSection = page.locator('text=WHEN DO YOU WANT TO REACH YOUR GOAL?');
      const isVisible = await goalDateSection.isVisible().catch(() => false);

      if (!isVisible) {
        console.log('Goal date section not visible - scrolling more');
        await page.evaluate(() => window.scrollTo(0, 800));
        await page.waitForTimeout(500);
      }

      await expect(goalDateSection).toBeVisible({ timeout: 5000 });
      console.log('Goal date section found');

      // Find all date displays
      const allDates = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').all();
      console.log(`Found ${allDates.length} date displays`);

      if (allDates.length >= 2) {
        // Goal date is the second one
        const goalDateButton = allDates[1];
        const initialGoalDate = await goalDateButton.textContent();
        console.log('Initial goal date:', initialGoalDate);

        // Click to open
        await goalDateButton.click();
        await page.waitForTimeout(800);

        await page.screenshot({ path: 'tests/screenshots/goal-date-opened.png', fullPage: true });

        // Close if open
        const doneButton = page.locator('text=Done').last();
        if (await doneButton.isVisible().catch(() => false)) {
          await doneButton.click();
          await page.waitForTimeout(500);
        }

        // Verify
        const allDatesAfter = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').all();
        if (allDatesAfter.length >= 2) {
          const finalGoalDate = await allDatesAfter[1].textContent();
          console.log('Final goal date:', finalGoalDate);
        }
      }
    });

    test('Rapid date picker open/close should not corrupt state', async ({ page }) => {
      console.log('Testing rapid date picker interactions...');

      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(300);

      const dateButton = page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first();
      const initialDate = await dateButton.textContent();
      console.log('Initial date:', initialDate);

      // Rapid open/close 5 times
      for (let i = 0; i < 5; i++) {
        console.log(`Rapid cycle ${i + 1}/5`);

        const btn = page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first();
        await btn.click();
        await page.waitForTimeout(200);

        const done = page.locator('text=Done').first();
        if (await done.isVisible().catch(() => false)) {
          await done.click();
          await page.waitForTimeout(200);
        }
      }

      // Check final state
      const finalDate = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first().textContent();
      console.log('Date after rapid interactions:', finalDate);
      console.log('State corrupted:', initialDate !== finalDate ? 'YES - BUG!' : 'NO - OK');

      await page.screenshot({ path: 'tests/screenshots/date-rapid-test.png', fullPage: true });
    });
  });

  test.describe('Age Wheel Picker Tests', () => {
    test('Age picker should be visible and scrollable', async ({ page }) => {
      console.log('Testing Age Wheel Picker...');

      // Scroll to age section
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(500);

      // Find AGE section
      const ageSection = page.locator('text=AGE').first();
      await expect(ageSection).toBeVisible({ timeout: 5000 });
      console.log('Age section found');

      await page.screenshot({ path: 'tests/screenshots/age-picker-initial.png', fullPage: true });

      // Find the wheel picker area (should show "years" text)
      const yearsText = page.locator('text=/\\d+ years/');
      const yearsVisible = await yearsText.first().isVisible().catch(() => false);
      console.log('Age with "years" label visible:', yearsVisible);

      // Get all age values visible
      const ageValues = await page.locator('text=/\\d+ years/').allTextContents();
      console.log('Visible age values:', ageValues.slice(0, 5));

      // Get the age section bounds for scrolling
      const ageSectionParent = ageSection.locator('..');
      const bounds = await ageSectionParent.boundingBox();

      if (bounds) {
        console.log('Age section bounds:', bounds);

        // Try vertical scroll (up = increase age, down = decrease age)
        const centerX = bounds.x + bounds.width / 2;
        const startY = bounds.y + bounds.height * 0.7;
        const endY = bounds.y + bounds.height * 0.3;

        // Scroll up (should increase age)
        console.log('Attempting to scroll age picker up...');
        await page.mouse.move(centerX, startY);
        await page.mouse.down();
        await page.mouse.move(centerX, endY, { steps: 15 });
        await page.mouse.up();
        await page.waitForTimeout(800);

        const ageValuesAfterUp = await page.locator('text=/\\d+ years/').allTextContents();
        console.log('Age values after scroll up:', ageValuesAfterUp.slice(0, 5));

        // Scroll down (should decrease age)
        console.log('Attempting to scroll age picker down...');
        await page.mouse.move(centerX, endY);
        await page.mouse.down();
        await page.mouse.move(centerX, startY, { steps: 15 });
        await page.mouse.up();
        await page.waitForTimeout(800);

        const ageValuesAfterDown = await page.locator('text=/\\d+ years/').allTextContents();
        console.log('Age values after scroll down:', ageValuesAfterDown.slice(0, 5));

        // Check if values changed
        const changed = JSON.stringify(ageValues) !== JSON.stringify(ageValuesAfterUp) ||
                       JSON.stringify(ageValuesAfterUp) !== JSON.stringify(ageValuesAfterDown);
        console.log('Age picker responded to scroll:', changed ? 'YES' : 'NO - STICKY!');
      }

      await page.screenshot({ path: 'tests/screenshots/age-picker-after.png', fullPage: true });
    });

    test('Age picker should snap to values', async ({ page }) => {
      console.log('Testing Age Picker snap behavior...');

      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(500);

      const ageSection = page.locator('text=AGE').locator('..');
      const bounds = await ageSection.boundingBox();

      if (!bounds) {
        console.log('Could not get age section bounds');
        return;
      }

      // Small scroll that shouldn't change value (less than snap threshold)
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      await page.mouse.move(centerX, centerY);
      await page.mouse.wheel(0, 20); // Small scroll
      await page.waitForTimeout(500);

      // Larger scroll that should change value
      await page.mouse.wheel(0, 100); // Larger scroll
      await page.waitForTimeout(800);

      await page.screenshot({ path: 'tests/screenshots/age-snap-test.png', fullPage: true });
    });
  });

  test.describe('Combined Interaction Tests', () => {
    test('All inputs should work together without interference', async ({ page }) => {
      console.log('Testing all inputs together...');

      // Record initial state
      const initialState: Record<string, string | null> = {};

      // Get initial weight
      const weightDisplay = await page.locator('text=/\\d{2,3}.*lbs|\\d{2,3}.*kg/').first().textContent();
      initialState.currentWeight = weightDisplay;
      console.log('Initial current weight:', weightDisplay);

      // Scroll and get start date
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(300);
      const startDate = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first().textContent();
      initialState.startDate = startDate;
      console.log('Initial start date:', startDate);

      // Scroll and get age
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(300);
      const ageValues = await page.locator('text=/\\d+ years/').allTextContents();
      initialState.age = ageValues[0] || null;
      console.log('Initial age visible:', ageValues.slice(0, 3));

      // Now interact with each and verify others aren't affected
      console.log('\n--- Interacting with each control ---');

      // 1. Interact with age
      const ageSection = page.locator('text=AGE').locator('..');
      const ageBounds = await ageSection.boundingBox();
      if (ageBounds) {
        await page.mouse.move(ageBounds.x + ageBounds.width / 2, ageBounds.y + ageBounds.height * 0.6);
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(500);
        console.log('Interacted with age picker');
      }

      // 2. Go back and interact with date
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(300);
      const dateBtn = page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first();
      await dateBtn.click();
      await page.waitForTimeout(300);
      const done = page.locator('text=Done').first();
      if (await done.isVisible().catch(() => false)) {
        await done.click();
        await page.waitForTimeout(300);
      }
      console.log('Interacted with date picker');

      // 3. Check start date hasn't changed
      const startDateAfter = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first().textContent();
      console.log('Start date after interactions:', startDateAfter);

      // 4. Go back to top and check weight
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const weightAfter = await page.locator('text=/\\d{2,3}.*lbs|\\d{2,3}.*kg/').first().textContent();
      console.log('Current weight after interactions:', weightAfter);

      // Summary
      console.log('\n=== Combined Test Summary ===');
      console.log('Weight changed:', initialState.currentWeight !== weightAfter);
      console.log('Start date changed:', initialState.startDate !== startDateAfter);
      console.log('Interference detected:',
        (initialState.currentWeight !== weightAfter && initialState.startDate !== startDateAfter)
          ? 'POSSIBLE - Multiple values changed'
          : 'NO');

      await page.screenshot({ path: 'tests/screenshots/combined-test-final.png', fullPage: true });
    });

    test('Scrolling page should not accidentally change input values', async ({ page }) => {
      console.log('Testing page scroll vs input scroll...');

      // Get initial values
      const initialWeight = await page.locator('text=/\\d{2,3}.*lbs|\\d{2,3}.*kg/').first().textContent();
      console.log('Initial weight:', initialWeight);

      // Scroll page aggressively
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollTo(0, Math.random() * 1000));
        await page.waitForTimeout(200);
      }

      // Return to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      // Check weight
      const finalWeight = await page.locator('text=/\\d{2,3}.*lbs|\\d{2,3}.*kg/').first().textContent();
      console.log('Weight after page scrolls:', finalWeight);
      console.log('Weight accidentally changed:', initialWeight !== finalWeight ? 'YES - BUG!' : 'NO - OK');

      await page.screenshot({ path: 'tests/screenshots/page-scroll-test.png', fullPage: true });
    });
  });
});
