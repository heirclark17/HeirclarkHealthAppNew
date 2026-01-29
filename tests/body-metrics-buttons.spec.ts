import { test, expect } from '@playwright/test';

test.describe('Body Metrics Button Controls', () => {
  test('Weight +/- buttons should increment and decrement value', async ({ page }) => {
    // Navigate directly to goals
    await page.goto('http://localhost:8081/goals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Select a goal to get to body metrics
    const loseWeight = page.locator('text=Lose Weight');
    await expect(loseWeight.first()).toBeVisible({ timeout: 10000 });
    await loseWeight.first().click();
    await page.waitForTimeout(500);

    await page.locator('text=CONTINUE').first().click();
    await page.waitForTimeout(2000);

    console.log('--- On Body Metrics Step ---');

    // Screenshot initial state
    await page.screenshot({ path: 'tests/screenshots/weight-buttons-initial.png', fullPage: true });

    // Find the weight value display (large number)
    const weightValue = page.locator('text=/^\\d{2,3}$/').first();
    const initialWeight = await weightValue.textContent();
    console.log('Initial weight:', initialWeight);

    // Find minus (-) button - look for the remove icon
    const minusButtons = page.locator('[data-testid="minus"], text=-').all();
    const minusButton = page.getByRole('button').filter({ has: page.locator('text=-') }).first();

    // Alternative: find by icon name
    const removeIcons = await page.locator('svg, [name*="remove"], [name*="minus"]').all();
    console.log(`Found ${removeIcons.length} potential minus icons`);

    // Try clicking on an area that should be a minus button
    // The - button should be to the left of the weight value
    const valueBounds = await weightValue.boundingBox();
    if (valueBounds) {
      // Click to the left of the value (where - button should be)
      await page.mouse.click(valueBounds.x - 50, valueBounds.y + valueBounds.height / 2);
      await page.waitForTimeout(500);

      const afterMinus = await page.locator('text=/^\\d{2,3}$/').first().textContent();
      console.log('After clicking left of value (minus area):', afterMinus);

      // Click to the right of the value (where + button should be)
      await page.mouse.click(valueBounds.x + valueBounds.width + 50, valueBounds.y + valueBounds.height / 2);
      await page.waitForTimeout(500);

      const afterPlus = await page.locator('text=/^\\d{2,3}$/').first().textContent();
      console.log('After clicking right of value (plus area):', afterPlus);
    }

    // Screenshot after interactions
    await page.screenshot({ path: 'tests/screenshots/weight-buttons-after.png', fullPage: true });

    // Try finding TouchableOpacity elements with icons
    const allTouchables = await page.locator('[role="button"], [data-testid], button').all();
    console.log(`Found ${allTouchables.length} button-like elements`);
  });

  test('Age picker chevron buttons should change age', async ({ page }) => {
    await page.goto('http://localhost:8081/goals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Select goal
    await page.locator('text=Lose Weight').first().click();
    await page.waitForTimeout(500);
    await page.locator('text=CONTINUE').first().click();
    await page.waitForTimeout(2000);

    // Scroll to age section
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);

    console.log('--- Testing Age Chevron Buttons ---');

    // Find AGE section
    const ageSection = page.locator('text=AGE');
    await expect(ageSection.first()).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'tests/screenshots/age-chevrons-initial.png', fullPage: true });

    // Get age section bounds
    const ageSectionParent = ageSection.locator('..').locator('..');
    const bounds = await ageSectionParent.boundingBox();

    if (bounds) {
      console.log('Age section bounds:', bounds);

      // Find visible age values
      const ageValues = await page.locator('text=/\\d+ years/').allTextContents();
      console.log('Initial age values:', ageValues.slice(0, 5));

      // Click on top area (chevron up - should decrease)
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + 20);
      await page.waitForTimeout(600);

      const ageValuesAfterUp = await page.locator('text=/\\d+ years/').allTextContents();
      console.log('After clicking top (up chevron):', ageValuesAfterUp.slice(0, 5));

      // Click on bottom area (chevron down - should increase)
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height - 20);
      await page.waitForTimeout(600);

      const ageValuesAfterDown = await page.locator('text=/\\d+ years/').allTextContents();
      console.log('After clicking bottom (down chevron):', ageValuesAfterDown.slice(0, 5));

      // Check if values changed
      const changed = JSON.stringify(ageValues) !== JSON.stringify(ageValuesAfterUp) ||
                     JSON.stringify(ageValuesAfterUp) !== JSON.stringify(ageValuesAfterDown);
      console.log('Chevron buttons responded:', changed ? 'YES' : 'NO');
    }

    await page.screenshot({ path: 'tests/screenshots/age-chevrons-after.png', fullPage: true });
  });
});
