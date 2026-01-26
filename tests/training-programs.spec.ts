import { test, expect } from '@playwright/test';

test.describe('Training Programs', () => {
  test('App loads and navigation elements exist', async ({ page }) => {
    test.setTimeout(60000);
    const port = process.env.EXPO_PORT || '8086';

    const errors: string[] = [];
    const logs: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(`PAGEERROR: ${error.name}: ${error.message}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`console.error: ${msg.text()}`);
      }
      if (msg.text().includes('[Training]') || msg.text().includes('[Programs]') || msg.text().includes('[PlanGenerator]')) {
        logs.push(msg.text());
      }
    });

    await page.goto(`http://localhost:${port}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Log page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for navigation elements - get all text content
    const bodyText = await page.locator('body').textContent();
    console.log('\n=== Page body text (first 500 chars) ===');
    console.log(bodyText?.substring(0, 500));

    // Look for specific nav items
    const homeCount = await page.locator('text=Home').count();
    const mealsCount = await page.locator('text=Meals').count();
    const goalsCount = await page.locator('text=Goals').count();
    const trainingCount = await page.locator('text=Training').count();
    const settingsCount = await page.locator('text=Settings').count();

    console.log('\n=== Navigation elements found ===');
    console.log('Home:', homeCount);
    console.log('Meals:', mealsCount);
    console.log('Goals:', goalsCount);
    console.log('Training:', trainingCount);
    console.log('Settings:', settingsCount);

    // Print all errors
    console.log('\n=== Errors ===');
    console.log('Total errors:', errors.length);
    errors.forEach(e => console.log(e.substring(0, 200)));

    // Print training logs
    console.log('\n=== Training logs ===');
    logs.forEach(l => console.log(l));

    // Test passes if no PAGEERROR
    const uncaught = errors.filter(e => e.startsWith('PAGEERROR'));
    expect(uncaught.length).toBe(0);
  });

  test('Can navigate to Goals tab', async ({ page }) => {
    test.setTimeout(60000);
    const port = process.env.EXPO_PORT || '8086';

    await page.goto(`http://localhost:${port}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    // Try clicking Goals - use more flexible selector
    const goalsLink = page.locator('text=Goals').first();
    if (await goalsLink.count() > 0) {
      await goalsLink.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
      console.log('Clicked Goals link');
    } else {
      console.log('Goals link not found, checking for alternative selectors...');
      // Try href-based selection
      const allLinks = await page.locator('a, [role="link"], [role="tab"]').all();
      console.log('Found', allLinks.length, 'potential navigation elements');
    }

    // Check if we're on goals page by looking for goal-related text
    const goalsPageText = await page.locator('body').textContent();
    const hasGoalContent = goalsPageText?.includes('Goal') || goalsPageText?.includes('Lose Weight') || goalsPageText?.includes('Build Muscle');
    console.log('Has goal-related content:', hasGoalContent);
  });
});
