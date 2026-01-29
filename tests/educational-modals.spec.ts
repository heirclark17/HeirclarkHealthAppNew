import { test, expect } from '@playwright/test';

test.describe('Educational Info Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8083');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for data to load
  });

  test('Daily Balance modal opens and displays content', async ({ page }) => {
    console.log('🧪 Testing Daily Balance info modal...');

    // Find and click the Daily Balance card
    const dailyBalanceCard = page.locator('text=DAILY BALANCE').first();
    await expect(dailyBalanceCard).toBeVisible({ timeout: 10000 });

    // Click the card to open modal
    await dailyBalanceCard.click();
    await page.waitForTimeout(1000);

    // Verify modal content
    await expect(page.locator('text=Daily Calorie Balance')).toBeVisible();
    await expect(page.locator('text=The Foundation of Weight Management')).toBeVisible();
    await expect(page.locator('text=Why Track It?')).toBeVisible();
    await expect(page.locator('text=The Science')).toBeVisible();
    await expect(page.locator('text=Best Practices')).toBeVisible();

    console.log('✅ Daily Balance modal content verified');

    // Close modal
    const closeButton = page.locator('[aria-label="close"]').or(page.locator('button').filter({ hasText: '×' })).first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('Protein modal opens and displays content', async ({ page }) => {
    console.log('🧪 Testing Protein info modal...');

    // Find and click a Protein card
    const proteinCard = page.locator('text=PROTEIN').first();
    await expect(proteinCard).toBeVisible({ timeout: 10000 });

    await proteinCard.click();
    await page.waitForTimeout(1000);

    // Verify modal content
    await expect(page.locator('text=The Muscle Preservation Macronutrient')).toBeVisible();
    await expect(page.locator('text=Recommended Intake')).toBeVisible();
    await expect(page.locator('text=Top Sources')).toBeVisible();

    console.log('✅ Protein modal content verified');

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('Steps modal opens and displays content', async ({ page }) => {
    console.log('🧪 Testing Steps info modal...');

    // Find and click the Steps card
    const stepsCard = page.locator('text=STEPS').first();
    await expect(stepsCard).toBeVisible({ timeout: 10000 });

    await stepsCard.click();
    await page.waitForTimeout(1000);

    // Verify modal content
    await expect(page.locator('text=Daily Steps')).toBeVisible();
    await expect(page.locator('text=Your Non-Exercise Activity Foundation')).toBeVisible();
    await expect(page.locator('text=Step Goals')).toBeVisible();
    await expect(page.locator('text=7,000 steps')).toBeVisible();

    console.log('✅ Steps modal content verified');

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('Active Energy modal opens and displays content', async ({ page }) => {
    console.log('🧪 Testing Active Energy info modal...');

    // Find and click the Active Energy card
    const activeEnergyCard = page.locator('text=ACTIVE ENERGY').first();
    await expect(activeEnergyCard).toBeVisible({ timeout: 10000 });

    await activeEnergyCard.click();
    await page.waitForTimeout(1000);

    // Verify modal content
    await expect(page.locator('text=Calories Burned Through Movement')).toBeVisible();
    await expect(page.locator('text=Activity Level Guide')).toBeVisible();
    await expect(page.locator('text=TDEE')).toBeVisible();

    console.log('✅ Active Energy modal content verified');

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('Resting Energy modal opens and displays content', async ({ page }) => {
    console.log('🧪 Testing Resting Energy info modal...');

    // Find and click the Resting Energy card
    const restingEnergyCard = page.locator('text=RESTING ENERGY').first();
    await expect(restingEnergyCard).toBeVisible({ timeout: 10000 });

    await restingEnergyCard.click();
    await page.waitForTimeout(1000);

    // Verify modal content
    await expect(page.locator('text=Your Metabolic Baseline')).toBeVisible();
    await expect(page.locator('text=BMR')).toBeVisible();
    await expect(page.locator('text=Typical BMR Ranges')).toBeVisible();

    console.log('✅ Resting Energy modal content verified');

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('All macro modals (Fat and Carbs) work', async ({ page }) => {
    console.log('🧪 Testing Fat and Carbs modals...');

    // Test Fat modal
    const fatCard = page.locator('text=FAT').first();
    await expect(fatCard).toBeVisible({ timeout: 10000 });
    await fatCard.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Essential for Hormones')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Test Carbs modal
    const carbsCard = page.locator('text=CARBS').first();
    await expect(carbsCard).toBeVisible();
    await carbsCard.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Your Body\'s Primary Energy Source')).toBeVisible();
    await expect(page.locator('text=fibermaxxing')).toBeVisible();

    console.log('✅ Fat and Carbs modals verified');
  });
});
