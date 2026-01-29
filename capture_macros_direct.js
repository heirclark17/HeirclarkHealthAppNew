const { chromium } = require('playwright');

async function captureMacros() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 }  // Taller viewport
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:19006', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Skip onboarding
    const skipButton = await page.getByText('Skip');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    await page.waitForTimeout(2000);

    // Take a very tall full-page screenshot
    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\full_dashboard.png',
      fullPage: true
    });
    console.log('Full dashboard screenshot saved');

    // Find and click somewhere to ensure we can scroll
    await page.mouse.move(195, 400);

    // Try dragging to scroll
    await page.mouse.down();
    await page.mouse.move(195, 100, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\after_drag_1.png',
      fullPage: false
    });

    // Drag again
    await page.mouse.move(195, 400);
    await page.mouse.down();
    await page.mouse.move(195, 50, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\after_drag_2.png',
      fullPage: false
    });

    // Drag again
    await page.mouse.move(195, 400);
    await page.mouse.down();
    await page.mouse.move(195, 50, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\after_drag_3.png',
      fullPage: false
    });

    console.log('All screenshots captured');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureMacros();
