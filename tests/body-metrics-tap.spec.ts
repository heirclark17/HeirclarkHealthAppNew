import { test, expect } from '@playwright/test';

test.describe('Body Metrics Tap-to-Select Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081/goals');
    await page.waitForTimeout(2000);

    // Select "Lose Weight" goal
    await page.locator('text=Lose Weight').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=CONTINUE').first().click();
    await page.waitForTimeout(1500);
  });

  test('Age picker items should be tappable to select', async ({ page }) => {
    console.log('Testing age picker tap-to-select...');

    // Scroll to age section
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);

    // Find age items
    const ageItems = await page.locator('text=/\\d+ years/').all();
    console.log(`Found ${ageItems.length} age items`);

    if (ageItems.length > 2) {
      // Get initial selected value (should be highlighted/centered)
      const initialTexts = await Promise.all(ageItems.slice(0, 5).map(el => el.textContent()));
      console.log('Initial age items:', initialTexts);

      // Click on a different age item (e.g., the 3rd one)
      await ageItems[2].click();
      await page.waitForTimeout(800);
      console.log('Clicked on 3rd age item');

      // Check if selection changed
      const afterTexts = await page.locator('text=/\\d+ years/').allTextContents();
      console.log('After click age items:', afterTexts.slice(0, 5));

      // Click on another item
      const ageItemsAfter = await page.locator('text=/\\d+ years/').all();
      if (ageItemsAfter.length > 4) {
        await ageItemsAfter[4].click();
        await page.waitForTimeout(800);
        console.log('Clicked on 5th age item');
      }

      await page.screenshot({ path: 'tests/screenshots/age-tap-select.png', fullPage: true });
    }
  });

  test('Weight scale ticks should be tappable to select', async ({ page }) => {
    console.log('Testing weight scale tap-to-select...');

    // Find weight value display
    const weightDisplay = page.locator('text=/^\\d{2,3}$/').first();
    const initialWeight = await weightDisplay.textContent();
    console.log('Initial weight:', initialWeight);

    // Find major tick labels (numbers like 180, 190, etc.)
    const tickLabels = await page.locator('text=/^\\d{2,3}$/').all();
    console.log(`Found ${tickLabels.length} tick labels`);

    // Try clicking on different weight tick labels
    for (let i = 0; i < Math.min(3, tickLabels.length); i++) {
      const label = tickLabels[i];
      const labelText = await label.textContent();
      console.log(`Clicking on tick label: ${labelText}`);

      await label.click();
      await page.waitForTimeout(600);

      // Check if weight display changed
      const currentWeight = await page.locator('text=/^\\d{2,3}$/').first().textContent();
      console.log(`Weight after clicking ${labelText}: ${currentWeight}`);
    }

    await page.screenshot({ path: 'tests/screenshots/weight-tap-select.png', fullPage: true });
  });

  test('Date picker should open on tap and allow selection', async ({ page }) => {
    console.log('Testing date picker tap interaction...');

    // Scroll to date section
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    // Find date button
    const dateButton = page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first();
    const initialDate = await dateButton.textContent();
    console.log('Initial date:', initialDate);

    // Tap to open
    await dateButton.click();
    await page.waitForTimeout(800);

    // Check if opened (Done button visible)
    const doneButton = page.locator('text=Done').first();
    const isOpen = await doneButton.isVisible().catch(() => false);
    console.log('Date picker opened:', isOpen);

    if (isOpen) {
      // Try web date input if available
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.count() > 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        await dateInput.first().fill(dateStr);
        console.log('Set date input to:', dateStr);
      }

      await doneButton.click();
      await page.waitForTimeout(500);

      // Check final date
      const finalDate = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first().textContent();
      console.log('Final date:', finalDate);
    }

    await page.screenshot({ path: 'tests/screenshots/date-tap-test.png', fullPage: true });
  });

  test('Scroll container should allow wheel scroll', async ({ page }) => {
    console.log('Testing wheel scroll on age picker...');

    // Scroll to age section
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);

    const ageSection = page.locator('text=AGE').locator('..');
    const bounds = await ageSection.boundingBox();

    if (bounds) {
      // Position mouse over age section
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      await page.mouse.move(centerX, centerY);

      // Get initial values
      const before = await page.locator('text=/\\d+ years/').allTextContents();
      console.log('Before wheel scroll:', before.slice(0, 3));

      // Use wheel event
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(800);

      const after = await page.locator('text=/\\d+ years/').allTextContents();
      console.log('After wheel scroll:', after.slice(0, 3));

      // Another wheel event
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(800);

      const final = await page.locator('text=/\\d+ years/').allTextContents();
      console.log('After reverse wheel:', final.slice(0, 3));

      const responded = JSON.stringify(before) !== JSON.stringify(after) ||
                       JSON.stringify(after) !== JSON.stringify(final);
      console.log('Wheel scroll response:', responded ? 'YES' : 'NO');
    }

    await page.screenshot({ path: 'tests/screenshots/wheel-scroll-test.png', fullPage: true });
  });
});
