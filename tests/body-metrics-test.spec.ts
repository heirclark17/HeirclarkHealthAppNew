import { test, expect } from '@playwright/test';

test.describe('Body Metrics Page Tests', () => {
  test('Test all Body Metrics controls', async ({ page }) => {
    console.log('=== Body Metrics Controls Test ===');
    test.setTimeout(180000);

    // Navigate and wait for bundle
    console.log('Loading app...');
    await page.goto('http://localhost:8081/goals', {
      waitUntil: 'networkidle',
      timeout: 90000,
    });
    await page.waitForTimeout(3000);

    // Screenshot initial
    await page.screenshot({ path: 'tests/screenshots/01-goals-page.png', fullPage: true });

    // Find and click "Lose Weight"
    console.log('Looking for goal options...');
    const loseWeight = page.locator('text=Lose Weight').first();
    await expect(loseWeight).toBeVisible({ timeout: 15000 });
    console.log('Found "Lose Weight" - clicking...');
    await loseWeight.click();
    await page.waitForTimeout(500);

    // Click CONTINUE
    const continueBtn = page.locator('text=CONTINUE').first();
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    console.log('Clicking CONTINUE...');
    await continueBtn.click();
    await page.waitForTimeout(3000);

    // Screenshot Body Metrics page
    await page.screenshot({ path: 'tests/screenshots/02-body-metrics-page.png', fullPage: true });

    // Check we're on Body Metrics
    console.log('\n=== On Body Metrics Page ===');

    // Look for key sections
    const weightSection = page.locator('text=WEIGHT').first();
    const heightSection = page.locator('text=HEIGHT').first();
    const ageSection = page.locator('text=AGE').first();

    const weightVisible = await weightSection.isVisible().catch(() => false);
    const heightVisible = await heightSection.isVisible().catch(() => false);
    const ageVisible = await ageSection.isVisible().catch(() => false);

    console.log(`WEIGHT section: ${weightVisible ? 'VISIBLE' : 'NOT FOUND'}`);
    console.log(`HEIGHT section: ${heightVisible ? 'VISIBLE' : 'NOT FOUND'}`);
    console.log(`AGE section: ${ageVisible ? 'VISIBLE' : 'NOT FOUND'}`);

    // Find all numeric values displayed
    const numericValues = await page.locator('text=/^\\d{1,3}$/').allTextContents();
    console.log('Numeric values on page:', numericValues.slice(0, 10));

    // Find age values
    const ageValues = await page.locator('text=/\\d+ years/').allTextContents();
    console.log('Age values:', ageValues.slice(0, 5));

    // ========================================
    // TEST WEIGHT CONTROLS
    // ========================================
    console.log('\n=== Testing Weight Controls ===');

    // Find weight display - should be a large number like 180
    const weightDisplay = page.locator('text=/^\\d{2,3}$/').first();
    const initialWeight = await weightDisplay.textContent();
    console.log('Initial weight value:', initialWeight);

    // Find +10 and -10 buttons by their text
    const minus10Btn = page.locator('text=-10').first();
    const plus10Btn = page.locator('text=+10').first();

    const minus10Visible = await minus10Btn.isVisible().catch(() => false);
    const plus10Visible = await plus10Btn.isVisible().catch(() => false);
    console.log(`-10 button: ${minus10Visible ? 'VISIBLE' : 'NOT FOUND'}`);
    console.log(`+10 button: ${plus10Visible ? 'VISIBLE' : 'NOT FOUND'}`);

    if (plus10Visible) {
      console.log('Clicking +10...');
      await plus10Btn.click();
      await page.waitForTimeout(500);

      const afterPlus10 = await page.locator('text=/^\\d{2,3}$/').first().textContent();
      console.log(`Weight after +10: ${afterPlus10}`);
      console.log(`+10 button worked: ${Number(afterPlus10) > Number(initialWeight) ? 'YES' : 'NO'}`);
    }

    if (minus10Visible) {
      console.log('Clicking -10...');
      await minus10Btn.click();
      await page.waitForTimeout(500);

      const afterMinus10 = await page.locator('text=/^\\d{2,3}$/').first().textContent();
      console.log(`Weight after -10: ${afterMinus10}`);
    }

    // Screenshot after weight changes
    await page.screenshot({ path: 'tests/screenshots/03-after-weight-test.png', fullPage: true });

    // ========================================
    // TEST AGE CONTROLS
    // ========================================
    console.log('\n=== Testing Age Controls ===');

    // Scroll to AGE section
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);

    // Find chevron buttons (up/down arrows)
    const chevronUpButtons = await page.locator('svg').filter({ hasText: '' }).all();
    console.log(`Found ${chevronUpButtons.length} SVG elements`);

    // Look for age values
    const currentAgeValues = await page.locator('text=/\\d+ years/').allTextContents();
    console.log('Current age values:', currentAgeValues.slice(0, 5));

    // Find the selected/center age value (should be more prominent)
    const ageItems = await page.locator('text=/\\d+ years/').all();
    console.log(`Found ${ageItems.length} age items`);

    if (ageItems.length >= 3) {
      // Click on a different age to select it
      console.log('Clicking on age item to change selection...');
      await ageItems[0].click();
      await page.waitForTimeout(500);

      const newAgeValues = await page.locator('text=/\\d+ years/').allTextContents();
      console.log('Age values after click:', newAgeValues.slice(0, 5));
    }

    // Screenshot after age test
    await page.screenshot({ path: 'tests/screenshots/04-after-age-test.png', fullPage: true });

    // ========================================
    // TEST HEIGHT CONTROLS
    // ========================================
    console.log('\n=== Testing Height Controls ===');

    // Find height stepper buttons (ft/in values)
    const ftValue = await page.locator('text=/\\d ft/').first().textContent().catch(() => null);
    const inValue = await page.locator('text=/\\d+ in/').first().textContent().catch(() => null);
    console.log(`Height ft: ${ftValue}, in: ${inValue}`);

    // ========================================
    // TEST DATE PICKERS
    // ========================================
    console.log('\n=== Testing Date Pickers ===');

    // Scroll up to see date sections
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);

    // Find date display (format like "Jan 25, 2026")
    const dateDisplays = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').allTextContents();
    console.log('Date values found:', dateDisplays);

    if (dateDisplays.length > 0) {
      // Click on first date to open picker
      const dateBtn = page.locator('text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/').first();
      console.log('Clicking date to open picker...');
      await dateBtn.click();
      await page.waitForTimeout(1000);

      // Check if Done button appeared (iOS date picker)
      const doneBtn = page.locator('text=Done').first();
      const doneVisible = await doneBtn.isVisible().catch(() => false);
      console.log(`Date picker opened (Done visible): ${doneVisible ? 'YES' : 'NO'}`);

      if (doneVisible) {
        await doneBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'tests/screenshots/05-final-state.png', fullPage: true });

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Weight section: ${weightVisible ? 'OK' : 'MISSING'}`);
    console.log(`Height section: ${heightVisible ? 'OK' : 'MISSING'}`);
    console.log(`Age section: ${ageVisible ? 'OK' : 'MISSING'}`);
    console.log(`+10/-10 buttons: ${plus10Visible ? 'OK' : 'MISSING'}`);
    console.log(`Age items: ${ageItems.length > 0 ? 'OK' : 'MISSING'}`);
    console.log('Screenshots saved to tests/screenshots/');
  });
});
