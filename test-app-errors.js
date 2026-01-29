const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const consoleMessages = [];

  // Capture console errors
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  console.log('Opening app at http://localhost:8083...');

  try {
    await page.goto('http://localhost:8083', { timeout: 60000, waitUntil: 'networkidle' });

    // Wait a bit for the app to fully load
    await page.waitForTimeout(10000);

    console.log('\n=== CONSOLE ERRORS ===');
    if (errors.length === 0) {
      console.log('No errors found!');
    } else {
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }

    console.log('\n=== ALL CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg, i) => {
      console.log(`[${msg.type}] ${msg.text}`);
    });

    // Take a screenshot
    await page.screenshot({ path: 'app-screenshot.png' });
    console.log('\nScreenshot saved to app-screenshot.png');

  } catch (error) {
    console.log('Error loading page:', error.message);
  }

  await browser.close();
})();
