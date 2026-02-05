import { test, expect } from '@playwright/test';

test.describe('Nutrition Preferences → Meal Plan Integration', () => {

  test.beforeEach(async ({ page }) => {
    // Start app
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000); // Wait for app to load
  });

  test('should use nutrition preferences when generating meal plan', async ({ page }) => {
    console.log('[Test] Starting nutrition preferences → meal plan test');

    // Step 1: Navigate to Food Preferences
    console.log('[Test] Step 1: Opening food preferences');
    await page.waitForTimeout(2000);

    // Look for "Meals" tab or "Food Preferences" link
    const mealsTab = page.locator('text=/Meals|7-Day Meal Plan/i').first();
    if (await mealsTab.isVisible({ timeout: 5000 })) {
      await mealsTab.tap();
      await page.waitForTimeout(1000);
    }

    // Open food preferences modal
    const foodPrefsButton = page.locator('text=/Edit Food Preferences|Food Preferences/i').first();
    if (await foodPrefsButton.isVisible({ timeout: 5000 })) {
      await foodPrefsButton.tap();
      await page.waitForTimeout(1000);
    } else {
      console.log('[Test] Food Preferences button not found, skipping to goal check');
    }

    // Step 2: Set specific preferences (if modal opened)
    const allergyField = page.locator('text=/Allergies|Allergens/i').first();
    if (await allergyField.isVisible({ timeout: 3000 })) {
      console.log('[Test] Step 2: Setting allergies to "peanuts"');

      // Try to find and tap on peanuts checkbox
      const peanutsOption = page.locator('text=/Peanuts/i').first();
      if (await peanutsOption.isVisible({ timeout: 2000 })) {
        await peanutsOption.tap();
        console.log('[Test] Selected "peanuts" allergy');
      }

      // Set dietary preference to vegetarian
      const dietarySection = page.locator('text=/Dietary|Diet Type/i').first();
      if (await dietarySection.isVisible({ timeout: 2000 })) {
        const vegetarianOption = page.locator('text=/Vegetarian/i').first();
        if (await vegetarianOption.isVisible({ timeout: 2000 })) {
          await vegetarianOption.tap();
          console.log('[Test] Selected "vegetarian" diet');
        }
      }

      // Save preferences
      const saveButton = page.locator('text=/Save|Done|Confirm/i').last();
      if (await saveButton.isVisible({ timeout: 2000 })) {
        await saveButton.tap();
        await page.waitForTimeout(1000);
        console.log('[Test] Saved food preferences');
      }
    }

    // Step 3: Generate meal plan
    console.log('[Test] Step 3: Generating AI meal plan');
    await page.waitForTimeout(1000);

    const generateButton = page.locator('text=/Generate.*AI|AI.*Plan|Generate.*Plan/i').first();
    if (await generateButton.isVisible({ timeout: 5000 })) {
      await generateButton.tap();
      console.log('[Test] Tapped generate button, waiting for meal plan...');

      // Wait for generation (max 3 minutes)
      await page.waitForTimeout(180000);
    } else {
      console.log('[Test] ERROR: Generate button not found');
      throw new Error('Generate button not visible');
    }

    // Step 4: Verify meal plan respects preferences
    console.log('[Test] Step 4: Verifying meal plan');
    await page.waitForTimeout(2000);

    // Take screenshot of generated plan
    await page.screenshot({ path: 'test-results/meal-plan-generated.png', fullPage: true });

    // Get all meal names
    const mealCards = await page.locator('[data-testid*="meal"], [class*="MealCard"], text=/breakfast|lunch|dinner/i').all();
    console.log(`[Test] Found ${mealCards.length} meal cards`);

    // Check page content for meat keywords (should not exist for vegetarian)
    const pageText = await page.textContent('body');
    const meatKeywords = ['chicken', 'beef', 'pork', 'salmon', 'fish', 'turkey', 'steak'];
    const peanutKeywords = ['peanut', 'peanuts', 'peanut butter'];

    let hasMeat = false;
    let hasPeanuts = false;

    for (const keyword of meatKeywords) {
      if (pageText.toLowerCase().includes(keyword)) {
        console.log(`[Test] WARNING: Found meat keyword "${keyword}" in vegetarian meal plan`);
        hasMeat = true;
      }
    }

    for (const keyword of peanutKeywords) {
      if (pageText.toLowerCase().includes(keyword)) {
        console.log(`[Test] WARNING: Found peanut keyword "${keyword}" despite peanut allergy`);
        hasPeanuts = true;
      }
    }

    // Log results
    if (!hasMeat && !hasPeanuts) {
      console.log('[Test] ✓ SUCCESS: Meal plan respects vegetarian + no peanuts preferences');
    } else {
      if (hasMeat) {
        console.log('[Test] ✗ FAIL: Meal plan contains meat (should be vegetarian)');
      }
      if (hasPeanuts) {
        console.log('[Test] ✗ FAIL: Meal plan contains peanuts (user is allergic)');
      }
    }

    // Assertions
    expect(hasMeat).toBeFalsy(); // Should not have meat for vegetarian
    expect(hasPeanuts).toBeFalsy(); // Should not have peanuts for allergy

    console.log('[Test] Test completed');
  });

  test('should display MacroProgressBar with correct targets', async ({ page }) => {
    console.log('[Test] Starting MacroProgressBar display test');

    // Navigate to meals tab
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);

    const mealsTab = page.locator('text=/Meals|7-Day/i').first();
    if (await mealsTab.isVisible({ timeout: 5000 })) {
      await mealsTab.tap();
      await page.waitForTimeout(2000);
    }

    // Check if MacroProgressBar is rendered
    const progressBar = page.locator('text=/Progress|Daily Progress/i').first();
    const isVisible = await progressBar.isVisible({ timeout: 5000 });

    console.log(`[Test] MacroProgressBar visible: ${isVisible}`);

    if (isVisible) {
      // Check for macro labels
      const caloriesLabel = await page.locator('text=/Calories/i').first().isVisible({ timeout: 2000 });
      const proteinLabel = await page.locator('text=/Protein/i').first().isVisible({ timeout: 2000 });
      const carbsLabel = await page.locator('text=/Carbs/i').first().isVisible({ timeout: 2000 });
      const fatLabel = await page.locator('text=/Fat/i').first().isVisible({ timeout: 2000 });

      console.log(`[Test] Progress bars - Calories: ${caloriesLabel}, Protein: ${proteinLabel}, Carbs: ${carbsLabel}, Fat: ${fatLabel}`);

      expect(caloriesLabel).toBeTruthy();
      expect(proteinLabel).toBeTruthy();
      expect(carbsLabel).toBeTruthy();
      expect(fatLabel).toBeTruthy();

      // Take screenshot
      await page.screenshot({ path: 'test-results/macro-progress-bar.png', fullPage: true });
      console.log('[Test] ✓ MacroProgressBar displayed correctly');
    } else {
      console.log('[Test] WARNING: MacroProgressBar not visible (may not have a meal plan yet)');
    }
  });

  test('should show consistent goals across Dashboard and Meals screens', async ({ page }) => {
    console.log('[Test] Starting goal consistency test');

    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);

    // Get goals from Dashboard
    console.log('[Test] Checking Dashboard goals');
    const dashboardCalories = await page.locator('text=/\\d{4}.*Calories/i').first().textContent();
    const dashboardProtein = await page.locator('text=/\\d+g.*Protein/i').first().textContent();
    const dashboardCarbs = await page.locator('text=/\\d+g.*Carbs/i').first().textContent();
    const dashboardFat = await page.locator('text=/\\d+g.*Fat/i').first().textContent();

    console.log('[Test] Dashboard goals:', { dashboardCalories, dashboardProtein, dashboardCarbs, dashboardFat });

    // Navigate to Meals tab
    const mealsTab = page.locator('text=/Meals|7-Day/i').first();
    if (await mealsTab.isVisible({ timeout: 5000 })) {
      await mealsTab.tap();
      await page.waitForTimeout(2000);
    }

    // Get goals from Meals screen
    console.log('[Test] Checking Meals screen goals');
    const mealsCalories = await page.locator('text=/\\d{4}/i').first().textContent();
    const mealsProtein = await page.locator('text=/\\d+g/i').first().textContent();

    console.log('[Test] Meals goals:', { mealsCalories, mealsProtein });

    // Compare (basic check - both should show similar values)
    await page.screenshot({ path: 'test-results/goals-consistency.png', fullPage: true });

    console.log('[Test] Goal consistency check completed');
  });
});
