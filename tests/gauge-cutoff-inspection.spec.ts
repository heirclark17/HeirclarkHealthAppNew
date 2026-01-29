import { test, expect } from '@playwright/test';

test.describe('SemiCircularGauge Text Cutoff Investigation', () => {
  test.beforeEach(async ({ page }) => {
    // Note: Make sure Expo dev server is running on port 8081
    await page.goto('http://localhost:8081');

    // Wait for the app to load
    await page.waitForTimeout(5000);
  });

  test('inspect large gauge (main calorie gauge) dimensions and text positioning', async ({ page }) => {
    console.log('\n========================================');
    console.log('INSPECTING LARGE CALORIE GAUGE (340px)');
    console.log('========================================\n');

    // Find the main calorie gauge container
    // The large gauge is in the "Daily Balance" card with size=340
    const gaugeContainer = page.locator('text=DAILY BALANCE').locator('..').locator('svg').first();

    // Wait for gauge to be visible
    await gaugeContainer.waitFor({ state: 'visible', timeout: 10000 });

    // Get SVG dimensions and viewBox
    const svgBoundingBox = await gaugeContainer.boundingBox();
    const svgViewBox = await gaugeContainer.getAttribute('viewBox');
    const svgWidth = await gaugeContainer.getAttribute('width');
    const svgHeight = await gaugeContainer.getAttribute('height');

    console.log('SVG Element Properties:');
    console.log('  - viewBox:', svgViewBox);
    console.log('  - width attr:', svgWidth);
    console.log('  - height attr:', svgHeight);
    console.log('  - Bounding box:', svgBoundingBox);
    console.log('  - Calculated height:', svgBoundingBox?.height);
    console.log('  - Calculated width:', svgBoundingBox?.width);

    // Find the parent container (should have paddingTop: 20)
    const parentContainer = gaugeContainer.locator('xpath=..');
    const parentBoundingBox = await parentContainer.boundingBox();
    const parentStyles = await parentContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        paddingTop: computed.paddingTop,
        paddingBottom: computed.paddingBottom,
        overflow: computed.overflow,
        position: computed.position,
      };
    });

    console.log('\nParent Container Styles:');
    console.log('  - Height:', parentStyles.height);
    console.log('  - Padding top:', parentStyles.paddingTop);
    console.log('  - Padding bottom:', parentStyles.paddingBottom);
    console.log('  - Overflow:', parentStyles.overflow);
    console.log('  - Position:', parentStyles.position);
    console.log('  - Bounding box:', parentBoundingBox);

    // Find the text element displaying the calorie value
    // Look for the large number (e.g., "-044") with 72px font
    const calorieText = page.locator('text=/^-?\\d+$/', { hasText: /kcal/ }).first();

    try {
      await calorieText.waitFor({ state: 'visible', timeout: 5000 });
      const textBoundingBox = await calorieText.boundingBox();
      const textStyles = await calorieText.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          bottom: el.style.bottom || 'not set',
          position: computed.position,
          top: computed.top,
          transform: computed.transform,
        };
      });

      console.log('\nCalorie Text Element Styles:');
      console.log('  - Font size:', textStyles.fontSize);
      console.log('  - Line height:', textStyles.lineHeight);
      console.log('  - Bottom position:', textStyles.bottom);
      console.log('  - Position:', textStyles.position);
      console.log('  - Top:', textStyles.top);
      console.log('  - Transform:', textStyles.transform);
      console.log('  - Bounding box:', textBoundingBox);

      if (textBoundingBox && parentBoundingBox) {
        const textTop = textBoundingBox.y;
        const containerTop = parentBoundingBox.y;
        const textHeight = textBoundingBox.height;
        const spaceAboveText = textTop - containerTop;

        console.log('\nSpatial Analysis:');
        console.log('  - Text top position:', textTop);
        console.log('  - Container top position:', containerTop);
        console.log('  - Space above text:', spaceAboveText, 'px');
        console.log('  - Text height:', textHeight, 'px');
        console.log('  - Is text clipped at top?', spaceAboveText < 0 ? 'YES ❌' : 'NO ✅');

        if (spaceAboveText < 10) {
          console.log('\n⚠️  WARNING: Text is very close to or beyond container top!');
          console.log('   This could cause cutoff on actual devices.');
        }
      }
    } catch (error) {
      console.log('\n⚠️  Could not find calorie text element');
      console.log('   Error:', error.message);
    }

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'tests/screenshots/gauge-cutoff-large.png',
      fullPage: false
    });
    console.log('\n📸 Screenshot saved to: tests/screenshots/gauge-cutoff-large.png');
  });

  test('inspect small macro gauges (100px) dimensions and text positioning', async ({ page }) => {
    console.log('\n========================================');
    console.log('INSPECTING SMALL MACRO GAUGES (100px)');
    console.log('========================================\n');

    // Find one of the macro gauges (Protein, Fat, or Carbs)
    const proteinGauge = page.locator('text=PROTEIN').locator('..').locator('svg').first();

    await proteinGauge.waitFor({ state: 'visible', timeout: 10000 });

    const svgBoundingBox = await proteinGauge.boundingBox();
    const svgViewBox = await proteinGauge.getAttribute('viewBox');
    const svgWidth = await proteinGauge.getAttribute('width');
    const svgHeight = await proteinGauge.getAttribute('height');

    console.log('SVG Element Properties (Small Gauge):');
    console.log('  - viewBox:', svgViewBox);
    console.log('  - width attr:', svgWidth);
    console.log('  - height attr:', svgHeight);
    console.log('  - Bounding box:', svgBoundingBox);

    // Take screenshot of macro gauges
    await page.screenshot({
      path: 'tests/screenshots/gauge-cutoff-small.png',
      fullPage: false
    });
    console.log('\n📸 Screenshot saved to: tests/screenshots/gauge-cutoff-small.png');
  });

  test('calculate expected vs actual container height', async ({ page }) => {
    console.log('\n========================================');
    console.log('HEIGHT CALCULATION ANALYSIS');
    console.log('========================================\n');

    // Expected values from component code
    const size = 340;
    const strokeWidth = 36;
    const expectedContainerHeight = size / 2 + strokeWidth / 2 + 80;
    const expectedSvgHeight = size / 2 + strokeWidth / 2;

    console.log('Expected Dimensions (from component code):');
    console.log('  - size:', size);
    console.log('  - strokeWidth:', strokeWidth);
    console.log('  - Container height formula: size/2 + strokeWidth/2 + 80');
    console.log('  - Expected container height:', expectedContainerHeight, 'px');
    console.log('  - Expected SVG height:', expectedSvgHeight, 'px');
    console.log('  - Extra space below SVG:', 80, 'px');
    console.log('  - centerContentBottom:', 50, 'px (for large gauge)');
    console.log('  - paddingTop:', 20, 'px');

    // Get actual dimensions from rendered component
    const gaugeContainer = page.locator('text=DAILY BALANCE').locator('..').locator('svg').first();
    await gaugeContainer.waitFor({ state: 'visible', timeout: 10000 });

    const parentContainer = gaugeContainer.locator('xpath=..');
    const parentHeight = await parentContainer.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).height);
    });

    const svgHeight = await gaugeContainer.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).height);
    });

    console.log('\nActual Dimensions (from rendered component):');
    console.log('  - Actual container height:', parentHeight, 'px');
    console.log('  - Actual SVG height:', svgHeight, 'px');
    console.log('  - Difference (container - SVG):', parentHeight - svgHeight, 'px');

    console.log('\nAnalysis:');
    const heightDiff = Math.abs(expectedContainerHeight - parentHeight);
    if (heightDiff > 5) {
      console.log('  ⚠️  WARNING: Container height mismatch!');
      console.log('     Expected:', expectedContainerHeight);
      console.log('     Actual:', parentHeight);
      console.log('     Difference:', heightDiff, 'px');
    } else {
      console.log('  ✅ Container height matches expected value');
    }

    // Calculate where text should be positioned
    const radius = (size - strokeWidth) / 2;
    const centerY = radius + strokeWidth / 2;

    console.log('\nText Positioning Calculations:');
    console.log('  - Gauge radius:', radius, 'px');
    console.log('  - SVG centerY (arc center):', centerY, 'px');
    console.log('  - Text bottom position: 50px from container bottom');
    console.log('  - Text actual position from top:', expectedContainerHeight - 50, 'px');
    console.log('  - Space available for text from container top:', expectedContainerHeight - 50, 'px');
  });

  test('research React Native View and SVG layout behavior', async ({ page }) => {
    console.log('\n========================================');
    console.log('REACT NATIVE LAYOUT BEHAVIOR ANALYSIS');
    console.log('========================================\n');

    console.log('Key findings about React Native Web rendering:\n');

    console.log('1. ABSOLUTE POSITIONING IN REACT NATIVE:');
    console.log('   - In React Native, absolute positioning with `bottom` property');
    console.log('   - positions elements relative to the parent container');
    console.log('   - `bottom: 50` means 50px from the bottom of the parent');
    console.log('   - The element can still overflow if its height exceeds available space\n');

    console.log('2. SVG VIEWBOX AND CLIPPING:');
    console.log('   - SVG viewBox defines the coordinate system and visible area');
    console.log('   - Content outside viewBox bounds may be clipped');
    console.log('   - React Native SVG components render on top of the SVG element');
    console.log('   - Text positioned with `bottom` is outside the SVG viewBox\n');

    console.log('3. CONTAINER HEIGHT CALCULATION:');
    console.log('   - Current: height = size/2 + strokeWidth/2 + 80');
    console.log('   - For 340px gauge: 170 + 18 + 80 = 268px');
    console.log('   - SVG takes up: 170 + 18 = 188px');
    console.log('   - Remaining space: 80px');
    console.log('   - Text positioned 50px from bottom = 218px from top');
    console.log('   - With 72px font, text extends to ~146px from top');
    console.log('   - paddingTop: 20px should provide cushion\n');

    console.log('4. POTENTIAL ISSUES:');
    console.log('   - Font rendering may have additional ascenders/descenders');
    console.log('   - Line height can be larger than font size');
    console.log('   - Different devices may render fonts differently');
    console.log('   - React Native Web vs native may have differences');
    console.log('   - Negative numbers with minus sign may have different width\n');

    console.log('5. RECOMMENDED FIXES:');
    console.log('   a) Increase container height (add more space at top)');
    console.log('      - Change: size/2 + strokeWidth/2 + 80 → + 100 or + 120');
    console.log('   b) Increase centerContentBottom (move text down)');
    console.log('      - Change: centerContentBottom from 50 → 60 or 70');
    console.log('   c) Reduce font size slightly (if acceptable)');
    console.log('      - Change: valueFontSize from 72 → 64 or 68');
    console.log('   d) Increase paddingTop');
    console.log('      - Change: paddingTop from 20 → 30 or 40');
    console.log('   e) Use flexbox centering instead of absolute positioning');
    console.log('      - Remove `bottom` property, use justifyContent: center\n');
  });

  test('compare text positioning between large and small gauges', async ({ page }) => {
    console.log('\n========================================');
    console.log('COMPARING LARGE VS SMALL GAUGE POSITIONING');
    console.log('========================================\n');

    const largeSize = 340;
    const largeStroke = 36;
    const smallSize = 100;
    const smallStroke = 14;

    console.log('LARGE GAUGE (340px):');
    console.log('  - centerContentBottom:', 50);
    console.log('  - valueFontSize:', 72);
    console.log('  - Container height:', largeSize / 2 + largeStroke / 2 + 80);
    console.log('  - Text position from top:', (largeSize / 2 + largeStroke / 2 + 80) - 50);
    console.log('  - Available space above text:', (largeSize / 2 + largeStroke / 2 + 80) - 50 - 72);
    console.log('  - Status:', ((largeSize / 2 + largeStroke / 2 + 80) - 50 - 72) > 20 ? '✅ Should be OK' : '❌ May clip');

    console.log('\nSMALL GAUGE (100px):');
    console.log('  - centerContentBottom:', smallSize * 0.25, '(25% of size)');
    console.log('  - valueFontSize:', 24);
    console.log('  - Container height:', smallSize / 2 + smallStroke / 2 + 80);
    console.log('  - Text position from top:', (smallSize / 2 + smallStroke / 2 + 80) - (smallSize * 0.25));
    console.log('  - Available space above text:', (smallSize / 2 + smallStroke / 2 + 80) - (smallSize * 0.25) - 24);
    console.log('  - Status:', ((smallSize / 2 + smallStroke / 2 + 80) - (smallSize * 0.25) - 24) > 10 ? '✅ Should be OK' : '❌ May clip');

    console.log('\nKEY INSIGHT:');
    console.log('  The large gauge has less proportional space above the text.');
    console.log('  With 72px font at 218px from top (268 - 50), the text top');
    console.log('  is at ~146px from container top. With 20px padding, that');
    console.log('  leaves only ~126px clearance, which may be tight when');
    console.log('  considering line-height and font ascenders.');
  });
});

test.describe('Visual Regression Tests', () => {
  test('capture full dashboard view for manual inspection', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(5000);

    // Scroll to ensure calorie gauge is visible
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Take full page screenshot
    await page.screenshot({
      path: 'tests/screenshots/full-dashboard.png',
      fullPage: true
    });

    console.log('\n📸 Full dashboard screenshot saved');
    console.log('   Check: tests/screenshots/full-dashboard.png');
    console.log('   Look for any text cutoff at the top of gauges');
  });

  test('capture zoomed view of calorie gauge', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(5000);

    // Find and screenshot just the gauge area
    const gaugeContainer = page.locator('text=DAILY BALANCE').locator('..');
    await gaugeContainer.waitFor({ state: 'visible' });

    await gaugeContainer.screenshot({
      path: 'tests/screenshots/gauge-only.png',
    });

    console.log('\n📸 Gauge-only screenshot saved');
    console.log('   Check: tests/screenshots/gauge-only.png');
    console.log('   Examine if the top of the number is cut off');
  });
});
