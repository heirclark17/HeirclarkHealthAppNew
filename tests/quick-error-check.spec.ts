import { test, expect } from '@playwright/test';

test('Quick console error check', async ({ page }) => {
  console.log('=== Quick Error Check ===\n');
  test.setTimeout(60000);

  const errors: { type: string; text: string }[] = [];

  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console.error', text: msg.text() });
    }
  });

  // Capture page errors (uncaught exceptions)
  page.on('pageerror', (error) => {
    errors.push({ type: 'PAGEERROR', text: `${error.name}: ${error.message}` });
  });

  // Navigate with domcontentloaded (faster than networkidle)
  const port = process.env.EXPO_PORT || '8081';
  await page.goto(`http://localhost:${port}/`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  // Wait for React to render
  await page.waitForTimeout(5000);

  // Print errors
  console.log('\n========================================');
  console.log(`ERRORS FOUND: ${errors.length}`);
  console.log('========================================\n');

  errors.forEach((err, i) => {
    console.log(`${i + 1}. [${err.type}] ${err.text.substring(0, 500)}`);
  });

  // Check page loaded
  const title = await page.title();
  console.log(`\nPage title: ${title}`);

  // Test passes if no PAGEERROR (uncaught exceptions)
  const uncaught = errors.filter(e => e.type === 'PAGEERROR');
  expect(uncaught.length).toBe(0);
});
