import { test, expect } from '@playwright/test';

test.describe('Full Error Capture', () => {
  test('Capture ALL console output including uncaught errors', async ({ page }) => {
    console.log('=== Full Error Capture Test ===\n');
    test.setTimeout(120000);

    const allMessages: { type: string; text: string }[] = [];

    // Capture ALL console messages
    page.on('console', (msg) => {
      allMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      allMessages.push({ type: 'PAGEERROR', text: `${error.name}: ${error.message}\n${error.stack}` });
    });

    // Capture request failures
    page.on('requestfailed', (request) => {
      allMessages.push({ type: 'REQUESTFAILED', text: `${request.url()} - ${request.failure()?.errorText}` });
    });

    // Navigate to the app
    console.log('Loading app...');
    await page.goto('http://localhost:8081/', {
      waitUntil: 'networkidle',
      timeout: 90000,
    });
    await page.waitForTimeout(5000);

    // Try navigating to different routes
    const routes = ['/goals', '/dashboard', '/profile', '/training', '/meal-plan'];

    for (const route of routes) {
      console.log(`Navigating to ${route}...`);
      try {
        await page.goto(`http://localhost:8081${route}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log(`Failed to navigate to ${route}: ${e}`);
      }
    }

    // Print ALL messages
    console.log('\n========================================');
    console.log('ALL CONSOLE OUTPUT:');
    console.log('========================================\n');

    // Filter for errors and important messages
    const errors = allMessages.filter(m =>
      m.type === 'error' ||
      m.type === 'PAGEERROR' ||
      m.type === 'REQUESTFAILED' ||
      m.text.toLowerCase().includes('error') ||
      m.text.toLowerCase().includes('exception') ||
      m.text.toLowerCase().includes('uncaught') ||
      m.text.toLowerCase().includes('hostfunction')
    );

    if (errors.length === 0) {
      console.log('No errors found!');
    } else {
      console.log(`Found ${errors.length} error-related messages:\n`);
      errors.forEach((msg, i) => {
        console.log(`--- [${msg.type.toUpperCase()}] ${i + 1} ---`);
        console.log(msg.text.substring(0, 3000));
        console.log('');
      });
    }

    // Also print warnings
    const warnings = allMessages.filter(m => m.type === 'warning');
    console.log('\n========================================');
    console.log(`WARNINGS (${warnings.length} total, showing first 10):`);
    console.log('========================================\n');

    const uniqueWarnings = [...new Set(warnings.map(w => w.text))];
    uniqueWarnings.slice(0, 10).forEach((text, i) => {
      console.log(`${i + 1}. ${text.substring(0, 500)}`);
    });

    console.log('\n========================================');
    console.log(`SUMMARY: ${errors.length} errors, ${warnings.length} warnings`);
    console.log('========================================\n');
  });
});
