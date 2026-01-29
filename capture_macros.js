const { chromium } = require('playwright');

async function captureMacros() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
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

    // Take initial screenshot
    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\macro_view_1.png',
      fullPage: false
    });

    // Use keyboard to scroll or simulate touch scroll
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\macro_view_2.png',
      fullPage: false
    });

    // Scroll more
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\macro_view_3.png',
      fullPage: false
    });

    // Scroll more
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\macro_view_4.png',
      fullPage: false
    });

    console.log('Screenshots captured successfully');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureMacros();
