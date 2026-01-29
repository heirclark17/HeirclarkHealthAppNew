const { chromium } = require('playwright');

async function verifyGaugeFix() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:19006', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Skip onboarding
    const skipButton = await page.getByText('Skip');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    // Wait for dashboard
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\gauge_fix_verify.png',
      fullPage: true
    });
    console.log('Full page screenshot saved');

    // Analyze SVGs
    const svgInfo = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      const results = [];
      svgs.forEach((svg, index) => {
        const rect = svg.getBoundingClientRect();
        const viewBox = svg.getAttribute('viewBox');
        if (rect.width > 50) {
          const parent = svg.parentElement;
          const grandparent = parent?.parentElement;
          const grandparentRect = grandparent?.getBoundingClientRect();

          const fitsInContainer = grandparentRect ? rect.width <= grandparentRect.width : true;

          results.push({
            index,
            svgWidth: rect.width,
            svgHeight: rect.height,
            viewBox,
            grandparentWidth: grandparentRect?.width,
            fitsInContainer
          });
        }
      });
      return results;
    });

    console.log('\nSVG Analysis After Fix:');
    svgInfo.forEach(info => {
      console.log(`\nSVG #${info.index}:`);
      console.log(`  SVG Size: ${info.svgWidth.toFixed(1)} x ${info.svgHeight.toFixed(1)}`);
      console.log(`  ViewBox: ${info.viewBox}`);
      console.log(`  Grandparent Width: ${info.grandparentWidth?.toFixed(1)}`);
      console.log(`  Fits in Container: ${info.fitsInContainer ? 'YES ✓' : 'NO ✗'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
    console.log('\nDone');
  }
}

verifyGaugeFix();
