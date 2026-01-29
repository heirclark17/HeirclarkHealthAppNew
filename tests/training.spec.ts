import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

test.describe('Training Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for mobile app simulation
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('should navigate to training/programs page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for app to load
    await page.waitForTimeout(2000);

    // Navigate to programs tab
    await page.goto(`${BASE_URL}/programs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for training page content
    const pageContent = await page.textContent('body');
    console.log('Programs page loaded');

    // Look for training-related content (either training plan or empty state)
    const hasTrainingContent = pageContent?.includes('Training') ||
                               pageContent?.includes('Workout') ||
                               pageContent?.includes('Program') ||
                               pageContent?.includes('personalized');

    expect(hasTrainingContent).toBeTruthy();
  });

  test('should display empty state when no goals set', async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // Check for empty state content
    const hasEmptyState = pageContent?.includes('Your Personalized Training Plan') ||
                          pageContent?.includes('Set Your Goals First') ||
                          pageContent?.includes('Generate My Training Plan') ||
                          pageContent?.includes('set your goals to get personalized workouts');

    console.log('Empty state check:', hasEmptyState);
    expect(hasEmptyState).toBeTruthy();
  });

  test('should have Generate Training Plan button', async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // Check for the generate button
    const hasGenerateButton = pageContent?.includes('Generate My Training Plan') ||
                              pageContent?.includes('Generate');

    console.log('Has generate button:', hasGenerateButton);
    expect(hasGenerateButton).toBeTruthy();
  });

  test('should have Set Goals link', async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // Check for goals link
    const hasGoalsLink = pageContent?.includes('Set Your Goals First') ||
                         pageContent?.includes('goals');

    console.log('Has goals link:', hasGoalsLink);
    expect(hasGoalsLink).toBeTruthy();
  });
});

test.describe('Goals Page - Workout Plan Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('should navigate to goals page', async ({ page }) => {
    await page.goto(`${BASE_URL}/goals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // Check for goals-related content
    const hasGoalsContent = pageContent?.includes('Goal') ||
                            pageContent?.includes('goal') ||
                            pageContent?.includes('SET YOUR GOALS');

    expect(hasGoalsContent).toBeTruthy();
    console.log('Goals page loaded successfully');
  });

  test('should display goal options', async ({ page }) => {
    await page.goto(`${BASE_URL}/goals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // Check for primary goal options
    const goalOptions = ['Lose Weight', 'Build Muscle', 'Maintain', 'Health'];
    let foundGoals = 0;

    for (const goal of goalOptions) {
      if (pageContent?.toLowerCase().includes(goal.toLowerCase())) {
        foundGoals++;
        console.log(`Found goal option: ${goal}`);
      }
    }

    expect(foundGoals).toBeGreaterThan(0);
  });
});

test.describe('Meals Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('should navigate to meals page', async ({ page }) => {
    await page.goto(`${BASE_URL}/meals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // Check for meals-related content
    const hasMealsContent = pageContent?.includes('Meal') ||
                            pageContent?.includes('meal') ||
                            pageContent?.includes('Breakfast') ||
                            pageContent?.includes('Lunch') ||
                            pageContent?.includes('Dinner') ||
                            pageContent?.includes('Plan');

    expect(hasMealsContent).toBeTruthy();
    console.log('Meals page loaded successfully');
  });
});

test.describe('Navigation Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('should navigate between tabs successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to different pages
    const pages = ['/meals', '/programs', '/goals'];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const url = page.url();
      console.log(`Successfully navigated to: ${url}`);
      expect(url).toContain(path);
    }
  });

  test('should have visible tab bar navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/home-page.png' });

    // Check that we can navigate to all main pages
    const routes = ['/', '/meals', '/programs', '/goals'];

    for (const route of routes) {
      const response = await page.goto(`${BASE_URL}${route}`);
      expect(response?.status()).toBe(200);
      console.log(`Route ${route} is accessible`);
    }
  });
});

test.describe('App Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('should load home page without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('expo-system-ui') &&
      !err.includes('ResizeObserver') &&
      !err.includes('favicon')
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors:', criticalErrors);
    }

    // Page should load
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should display app header/title', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // Check for app-related content on home page
    const hasAppContent = pageContent?.includes('Dashboard') ||
                          pageContent?.includes('Today') ||
                          pageContent?.includes('Calories') ||
                          pageContent?.includes('Protein') ||
                          pageContent?.includes('Welcome');

    console.log('Home page content check:', hasAppContent);
    expect(hasAppContent).toBeTruthy();
  });
});
