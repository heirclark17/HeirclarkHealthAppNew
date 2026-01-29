import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

// Helper to wait for app to load
async function waitForAppLoad(page: any) {
  await page.waitForTimeout(3000);
}

// Helper to skip onboarding
async function skipOnboarding(page: any) {
  await page.goto(BASE_URL);
  await waitForAppLoad(page);

  // Try to skip onboarding by clicking "Skip" button
  try {
    const skipButton = page.locator('text=Skip').first();
    if (await skipButton.isVisible({ timeout: 3000 })) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }
  } catch (e) {
    console.log('No skip button found, trying Next');
  }

  // If skip not available, try clicking through onboarding
  for (let i = 0; i < 5; i++) {
    try {
      const nextButton = page.locator('text=Next').first();
      if (await nextButton.isVisible({ timeout: 1000 })) {
        await nextButton.click();
        await page.waitForTimeout(1500);
      }
    } catch (e) {
      break;
    }
  }
}

// Helper to navigate to goals tab
async function navigateToGoals(page: any) {
  // Look for Goals tab in bottom navigation
  try {
    const goalsTab = page.locator('[aria-label*="goal" i], [data-testid*="goal" i], text=Goals').first();
    if (await goalsTab.isVisible({ timeout: 2000 })) {
      await goalsTab.click();
      await page.waitForTimeout(2000);
      return true;
    }
  } catch (e) {
    console.log('Could not find goals tab');
  }
  return false;
}

test.describe('iOS 26 Liquid Glass Audit - Goals Pages', () => {

  test.beforeEach(async ({ page }) => {
    // Set viewport to iPhone size
    await page.setViewportSize({ width: 430, height: 932 });
  });

  test('Full App Screenshot with Onboarding', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    // Screenshot 1: Initial onboarding page
    await page.screenshot({
      path: 'tests/screenshots/01-onboarding-page.png',
      fullPage: true
    });

    console.log('Screenshot 01: Onboarding page captured');

    // Skip onboarding
    await skipOnboarding(page);

    // Screenshot 2: After skipping onboarding
    await page.screenshot({
      path: 'tests/screenshots/02-after-onboarding.png',
      fullPage: true
    });

    console.log('Screenshot 02: After onboarding captured');
  });

  test('Goals Step 1: Primary Goal Selection', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    await skipOnboarding(page);

    // Navigate to goals
    const goalsFound = await navigateToGoals(page);

    await page.screenshot({
      path: 'tests/screenshots/03-goals-step1.png',
      fullPage: true
    });

    console.log('Screenshot 03: Goals Step 1 captured, Goals found:', goalsFound);

    // Analyze the page for liquid glass elements
    const glassAnalysis = await page.evaluate(() => {
      const results: any[] = [];
      const allElements = document.querySelectorAll('*');

      allElements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const backdropFilter = computed.backdropFilter || (computed as any).webkitBackdropFilter;
        const background = computed.background;
        const borderRadius = computed.borderRadius;
        const borderWidth = computed.borderWidth;
        const opacity = computed.opacity;

        // Check for liquid glass indicators
        const hasBlur = backdropFilter && backdropFilter !== 'none';
        const hasTransparentBg = background && (background.includes('rgba') || background.includes('transparent'));
        const hasRoundedCorners = borderRadius && parseFloat(borderRadius) > 10;

        if (hasBlur || (hasTransparentBg && hasRoundedCorners)) {
          results.push({
            tagName: el.tagName,
            className: el.className.toString().substring(0, 100),
            backdropFilter: backdropFilter || 'none',
            background: background.substring(0, 80),
            borderRadius,
            borderWidth,
          });
        }
      });

      return results;
    });

    console.log(`Found ${glassAnalysis.length} potential liquid glass elements`);
  });

  test('Goals Step 2: Body Metrics', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    await skipOnboarding(page);
    await navigateToGoals(page);

    // Try to click on a goal option to proceed
    try {
      const loseWeight = page.locator('text=Lose Weight, text=Lose').first();
      if (await loseWeight.isVisible({ timeout: 2000 })) {
        await loseWeight.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('Could not find goal option');
    }

    // Click Continue
    try {
      const continueBtn = page.locator('text=CONTINUE').first();
      if (await continueBtn.isVisible({ timeout: 2000 })) {
        await continueBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Could not find continue button');
    }

    await page.screenshot({
      path: 'tests/screenshots/04-goals-step2-body-metrics.png',
      fullPage: true
    });

    console.log('Screenshot 04: Goals Step 2 (Body Metrics) captured');
  });

  test('Goals Step 3: Activity Level', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    await skipOnboarding(page);
    await navigateToGoals(page);

    // Navigate through steps
    for (let i = 0; i < 2; i++) {
      try {
        // Select first option if available
        const firstOption = page.locator('[class*="card"], [class*="Card"]').first();
        if (await firstOption.isVisible({ timeout: 1000 })) {
          await firstOption.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {}

      try {
        const continueBtn = page.locator('text=CONTINUE').first();
        if (await continueBtn.isVisible({ timeout: 2000 })) {
          await continueBtn.click();
          await page.waitForTimeout(1500);
        }
      } catch (e) {}
    }

    await page.screenshot({
      path: 'tests/screenshots/05-goals-step3-activity.png',
      fullPage: true
    });

    console.log('Screenshot 05: Goals Step 3 (Activity) captured');
  });

  test('Goals Step 4: Nutrition Preferences', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    await skipOnboarding(page);
    await navigateToGoals(page);

    // Navigate through steps
    for (let i = 0; i < 3; i++) {
      try {
        const firstOption = page.locator('[class*="card"], [class*="Card"]').first();
        if (await firstOption.isVisible({ timeout: 1000 })) {
          await firstOption.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {}

      try {
        const continueBtn = page.locator('text=CONTINUE').first();
        if (await continueBtn.isVisible({ timeout: 2000 })) {
          await continueBtn.click();
          await page.waitForTimeout(1500);
        }
      } catch (e) {}
    }

    await page.screenshot({
      path: 'tests/screenshots/06-goals-step4-nutrition.png',
      fullPage: true
    });

    console.log('Screenshot 06: Goals Step 4 (Nutrition) captured');
  });

  test('Goals Step 5: Plan Preview', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    await skipOnboarding(page);
    await navigateToGoals(page);

    // Navigate through all steps
    for (let i = 0; i < 4; i++) {
      try {
        const firstOption = page.locator('[class*="card"], [class*="Card"]').first();
        if (await firstOption.isVisible({ timeout: 1000 })) {
          await firstOption.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {}

      try {
        const continueBtn = page.locator('text=CONTINUE').first();
        if (await continueBtn.isVisible({ timeout: 2000 })) {
          await continueBtn.click();
          await page.waitForTimeout(1500);
        }
      } catch (e) {}
    }

    await page.screenshot({
      path: 'tests/screenshots/07-goals-step5-preview.png',
      fullPage: true
    });

    console.log('Screenshot 07: Goals Step 5 (Plan Preview) captured');
  });

  test('Inspect CSS for Liquid Glass Elements', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    await skipOnboarding(page);
    await navigateToGoals(page);

    // Get comprehensive CSS analysis
    const cssReport = await page.evaluate(() => {
      const report = {
        blurElements: 0,
        transparentBgElements: 0,
        roundedElements: 0,
        subtleBorderElements: 0,
        potentialGlassCards: [] as any[],
      };

      const allElements = document.querySelectorAll('*');

      allElements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // Skip elements that are too small or not visible
        if (rect.width < 40 || rect.height < 30) return;

        const backdropFilter = computed.backdropFilter || (computed as any).webkitBackdropFilter;
        const background = computed.background;
        const borderRadius = parseFloat(computed.borderRadius) || 0;
        const borderWidth = parseFloat(computed.borderWidth) || 0;
        const borderColor = computed.borderColor;

        const hasBlur = backdropFilter && backdropFilter !== 'none' && backdropFilter.includes('blur');
        const hasTransparentBg = background && background.includes('rgba');
        const hasRoundedCorners = borderRadius > 10;
        const hasSubtleBorder = borderWidth > 0 && borderWidth <= 1.5;

        if (hasBlur) report.blurElements++;
        if (hasTransparentBg) report.transparentBgElements++;
        if (hasRoundedCorners) report.roundedElements++;
        if (hasSubtleBorder) report.subtleBorderElements++;

        // Identify potential glass cards
        if (hasBlur && hasRoundedCorners) {
          report.potentialGlassCards.push({
            tagName: el.tagName,
            className: el.className.toString().substring(0, 60),
            size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
            borderRadius: `${borderRadius}px`,
            borderWidth: `${borderWidth}px`,
            backdropFilter,
          });
        }
      });

      return report;
    });

    console.log('\n=== LIQUID GLASS CSS REPORT ===');
    console.log(`Blur elements found: ${cssReport.blurElements}`);
    console.log(`Transparent background elements: ${cssReport.transparentBgElements}`);
    console.log(`Rounded corner elements: ${cssReport.roundedElements}`);
    console.log(`Subtle border elements: ${cssReport.subtleBorderElements}`);
    console.log(`\nPotential Glass Cards: ${cssReport.potentialGlassCards.length}`);
    cssReport.potentialGlassCards.forEach((card, i) => {
      console.log(`  ${i + 1}. ${card.tagName} (${card.size}) - radius: ${card.borderRadius}, border: ${card.borderWidth}`);
    });

    await page.screenshot({
      path: 'tests/screenshots/08-css-analysis.png',
      fullPage: true
    });
  });
});

test.describe('Component Visual Inspection', () => {

  test('Button Styling Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const buttonAnalysis = await page.evaluate(() => {
      const buttons: any[] = [];
      const elements = document.querySelectorAll('button, [role="button"], [class*="button" i], [class*="btn" i]');

      elements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        if (rect.width > 30 && rect.height > 20) {
          buttons.push({
            index,
            text: el.textContent?.trim().substring(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            borderRadius: computed.borderRadius,
            borderWidth: computed.borderWidth,
            borderColor: computed.borderColor,
            backgroundColor: computed.backgroundColor,
            backdropFilter: computed.backdropFilter || 'none',
          });
        }
      });

      return buttons;
    });

    console.log('\n=== BUTTON ANALYSIS ===');
    console.log(`Found ${buttonAnalysis.length} buttons`);
    buttonAnalysis.forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn.text}" (${btn.width}x${btn.height})`);
      console.log(`     Border: ${btn.borderWidth} ${btn.borderColor}`);
      console.log(`     Radius: ${btn.borderRadius}`);
      console.log(`     Blur: ${btn.backdropFilter}`);
    });

    await page.screenshot({
      path: 'tests/screenshots/09-button-analysis.png',
      fullPage: true
    });
  });

  test('Input Field Styling Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const inputAnalysis = await page.evaluate(() => {
      const inputs: any[] = [];
      const elements = document.querySelectorAll('input, textarea, [class*="input" i]');

      elements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        if (rect.width > 40) {
          inputs.push({
            index,
            type: (el as HTMLInputElement).type || 'text',
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            borderRadius: computed.borderRadius,
            borderWidth: computed.borderWidth,
            borderColor: computed.borderColor,
            backgroundColor: computed.backgroundColor,
            backdropFilter: computed.backdropFilter || 'none',
          });
        }
      });

      return inputs;
    });

    console.log('\n=== INPUT ANALYSIS ===');
    console.log(`Found ${inputAnalysis.length} inputs`);
    inputAnalysis.forEach((input, i) => {
      console.log(`  ${i + 1}. Type: ${input.type} (${input.width}x${input.height})`);
      console.log(`     Border: ${input.borderWidth} ${input.borderColor}`);
      console.log(`     Radius: ${input.borderRadius}`);
      console.log(`     Blur: ${input.backdropFilter}`);
    });

    await page.screenshot({
      path: 'tests/screenshots/10-input-analysis.png',
      fullPage: true
    });
  });
});
