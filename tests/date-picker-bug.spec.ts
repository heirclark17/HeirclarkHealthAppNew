import { test, expect } from '@playwright/test';

test.describe('Date Picker Bug Investigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to goals and get to body metrics step
    await page.goto('http://localhost:8081/goals');
    await page.waitForTimeout(2000);

    // Step 1: Select goal (Lose Weight to show date pickers)
    await page.locator('text=Lose Weight').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=CONTINUE').first().click();
    await page.waitForTimeout(1000);
  });

  test('Start date picker should update correctly when date is selected', async ({ page }) => {
    console.log('🧪 Testing START date picker...');

    // Find the "WHEN DO YOU WANT TO START?" section
    const startSection = page.locator('text=WHEN DO YOU WANT TO START?');
    await expect(startSection).toBeVisible();
    console.log('✅ Start date section found');

    // Get the date button (the one with calendar icon)
    const startDateButton = page.locator('text=WHEN DO YOU WANT TO START?').locator('..').locator('[role="button"]').first();

    // Alternative: find by the calendar icon presence
    const dateButtons = page.locator('div').filter({ has: page.locator('text=WHEN DO YOU WANT TO START?') });

    // Get initial date text
    const initialDateText = await page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/').first().textContent();
    console.log('📅 Initial start date:', initialDateText);

    // Click to open date picker
    await page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/').first().click();
    await page.waitForTimeout(500);
    console.log('✅ Clicked start date button');

    // Check if date picker opened (look for Done button on iOS or date picker elements)
    const doneButton = page.locator('text=Done');
    const hasDoneButton = await doneButton.isVisible().catch(() => false);
    console.log('📱 Date picker opened (Done button visible):', hasDoneButton);

    // Take screenshot of current state
    await page.screenshot({ path: 'tests/screenshots/start-date-picker-open.png' });

    // If Done button exists, click it
    if (hasDoneButton) {
      await doneButton.click();
      await page.waitForTimeout(500);
    }

    // Get new date text
    const newDateText = await page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/').first().textContent();
    console.log('📅 Date after interaction:', newDateText);
  });

  test('Target/Goal date picker should update correctly when date is selected', async ({ page }) => {
    console.log('🧪 Testing GOAL date picker...');

    // Find the "WHEN DO YOU WANT TO REACH YOUR GOAL?" section
    const goalSection = page.locator('text=WHEN DO YOU WANT TO REACH YOUR GOAL?');
    const hasGoalSection = await goalSection.isVisible().catch(() => false);

    if (!hasGoalSection) {
      console.log('⚠️ Goal date section not visible - may need to scroll');
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
    }

    await expect(goalSection).toBeVisible({ timeout: 5000 });
    console.log('✅ Goal date section found');

    // Get all date buttons (formatted dates like "Jan 25, 2026")
    const allDateTexts = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').all();
    console.log('📅 Found date elements:', allDateTexts.length);

    // The second date should be the goal date (first is start date)
    if (allDateTexts.length >= 2) {
      const goalDateElement = allDateTexts[1];
      const initialGoalDate = await goalDateElement.textContent();
      console.log('📅 Initial goal date:', initialGoalDate);

      // Click to open date picker
      await goalDateElement.click();
      await page.waitForTimeout(500);
      console.log('✅ Clicked goal date button');

      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/goal-date-picker-open.png' });

      // Check for Done button
      const doneButton = page.locator('text=Done').last();
      const hasDoneButton = await doneButton.isVisible().catch(() => false);
      console.log('📱 Goal date picker opened (Done button visible):', hasDoneButton);

      if (hasDoneButton) {
        // Try to interact with the date picker if visible
        // DateTimePicker on web may render as native input
        const dateInputs = page.locator('input[type="date"]');
        const hasDateInput = await dateInputs.count() > 0;

        if (hasDateInput) {
          // Web date input found - try to change it
          const futureDate = new Date();
          futureDate.setMonth(futureDate.getMonth() + 2);
          const dateString = futureDate.toISOString().split('T')[0];
          await dateInputs.first().fill(dateString);
          console.log('📅 Set date input to:', dateString);
        }

        await doneButton.click();
        await page.waitForTimeout(500);
      }

      // Get new goal date text
      const allDateTextsAfter = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').all();
      if (allDateTextsAfter.length >= 2) {
        const newGoalDate = await allDateTextsAfter[1].textContent();
        console.log('📅 Goal date after interaction:', newGoalDate);

        // Verify dates are properly set
        console.log('🔍 Comparing dates:');
        console.log('   Initial:', initialGoalDate);
        console.log('   After:', newGoalDate);
      }
    }
  });

  test('Date picker state persistence - open, change, close, reopen', async ({ page }) => {
    console.log('🧪 Testing date picker state persistence...');

    // Scroll to ensure goal date section is visible
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Find date buttons
    const dateButtons = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').all();

    if (dateButtons.length < 2) {
      console.log('⚠️ Not enough date buttons found, skipping test');
      return;
    }

    // Record initial state
    const initialStartDate = await dateButtons[0].textContent();
    const initialGoalDate = await dateButtons[1].textContent();
    console.log('📅 Initial dates - Start:', initialStartDate, 'Goal:', initialGoalDate);

    // Open start date picker
    await dateButtons[0].click();
    await page.waitForTimeout(500);
    console.log('✅ Opened start date picker');

    // Close without changing (click Done if visible)
    const doneButton1 = page.locator('text=Done').first();
    if (await doneButton1.isVisible().catch(() => false)) {
      await doneButton1.click();
      await page.waitForTimeout(500);
    }

    // Verify start date hasn't changed unexpectedly
    const dateButtonsAfter1 = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').all();
    const startDateAfter1 = await dateButtonsAfter1[0].textContent();
    console.log('📅 Start date after open/close:', startDateAfter1);

    // Open goal date picker
    await dateButtonsAfter1[1].click();
    await page.waitForTimeout(500);
    console.log('✅ Opened goal date picker');

    // Close without changing
    const doneButton2 = page.locator('text=Done').last();
    if (await doneButton2.isVisible().catch(() => false)) {
      await doneButton2.click();
      await page.waitForTimeout(500);
    }

    // Verify goal date hasn't changed unexpectedly
    const dateButtonsAfter2 = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').all();
    const goalDateAfter2 = await dateButtonsAfter2[1].textContent();
    console.log('📅 Goal date after open/close:', goalDateAfter2);

    // Final verification
    console.log('🔍 State persistence check:');
    console.log('   Start date unchanged:', startDateAfter1 === initialStartDate);
    console.log('   Goal date unchanged:', goalDateAfter2 === initialGoalDate);

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/date-picker-final-state.png' });

    // BUG CHECK: If dates changed unexpectedly, log it
    if (startDateAfter1 !== initialStartDate) {
      console.log('🐛 BUG DETECTED: Start date changed unexpectedly!');
    }
    if (goalDateAfter2 !== initialGoalDate) {
      console.log('🐛 BUG DETECTED: Goal date changed unexpectedly!');
    }
  });

  test('Rapid date picker interactions', async ({ page }) => {
    console.log('🧪 Testing rapid date picker interactions...');

    // Scroll to ensure sections are visible
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);

    // Get date buttons
    const dateButtons = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').all();

    if (dateButtons.length < 1) {
      console.log('⚠️ No date buttons found');
      return;
    }

    // Record initial
    const initialDate = await dateButtons[0].textContent();
    console.log('📅 Initial date:', initialDate);

    // Rapid open/close cycles
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Cycle ${i + 1}/3`);

      // Open
      await dateButtons[0].click();
      await page.waitForTimeout(200);

      // Close quickly
      const doneBtn = page.locator('text=Done').first();
      if (await doneBtn.isVisible().catch(() => false)) {
        await doneBtn.click();
        await page.waitForTimeout(200);
      }

      // Re-fetch buttons (DOM may have changed)
      const updatedButtons = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').all();
      if (updatedButtons.length > 0) {
        const currentDate = await updatedButtons[0].textContent();
        console.log(`   Date after cycle ${i + 1}:`, currentDate);

        if (currentDate !== initialDate) {
          console.log(`🐛 BUG: Date changed after rapid cycle ${i + 1}!`);
        }
      }
    }

    // Final state
    await page.screenshot({ path: 'tests/screenshots/rapid-interaction-final.png' });
  });
});
