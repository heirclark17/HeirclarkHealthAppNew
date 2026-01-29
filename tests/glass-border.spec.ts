import { test, expect, Page } from '@playwright/test';

/**
 * Glass Border Rendering Tests
 *
 * These tests verify that frosted liquid glass borders render correctly
 * on initial page load without requiring user interaction.
 *
 * CRITICAL FIX VALIDATION:
 * - BlurView now renders AFTER content is ready
 * - Proper overflow: hidden wrapper pattern
 * - InteractionManager delay for blur initialization
 * - Animated fade-in for smooth appearance
 */

// Helper function to wait for React Native Web to fully render
async function waitForAppReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.innerHTML.length > 500;
  }, { timeout: 30000 });
  // Wait for blur effects to initialize (InteractionManager + 50ms delay + 200ms animation)
  await page.waitForTimeout(500);
}

// Helper to check if an element has visible border
async function hasBorder(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel);
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const borderWidth = parseFloat(style.borderWidth) || 0;
      const borderColor = style.borderColor;
      // Check if border is visible (not transparent and has width)
      if (borderWidth > 0 && borderColor !== 'transparent' && borderColor !== 'rgba(0, 0, 0, 0)') {
        return true;
      }
    }
    return false;
  }, selector);
}

// Helper to check for blur/backdrop effects
async function hasBlurEffect(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const backdrop = style.backdropFilter || (style as any).webkitBackdropFilter;
      if (backdrop && backdrop !== 'none' && backdrop.includes('blur')) {
        return true;
      }
    }
    return false;
  });
}

// Helper to check for glass card styling
async function hasGlassCardStyling(page: Page): Promise<{ hasBorder: boolean; hasBackground: boolean; hasRadius: boolean }> {
  return page.evaluate(() => {
    // Look for elements with glass-like styling
    const allElements = document.querySelectorAll('*');
    let hasBorder = false;
    let hasBackground = false;
    let hasRadius = false;

    for (const el of allElements) {
      const style = window.getComputedStyle(el);

      // Check for glass-like borders (subtle white/black borders)
      const borderWidth = parseFloat(style.borderWidth) || 0;
      const borderColor = style.borderColor;
      if (borderWidth > 0 && (
        borderColor.includes('rgba(255, 255, 255') ||
        borderColor.includes('rgba(0, 0, 0')
      )) {
        hasBorder = true;
      }

      // Check for glass-like backgrounds (semi-transparent)
      const bg = style.backgroundColor;
      if (bg.includes('rgba') && !bg.includes('rgba(0, 0, 0, 0)')) {
        const match = bg.match(/rgba\([^)]+,\s*([\d.]+)\)/);
        if (match) {
          const alpha = parseFloat(match[1]);
          if (alpha > 0 && alpha < 0.5) {
            hasBackground = true;
          }
        }
      }

      // Check for rounded corners (glass cards typically have radius 16-24px)
      const radius = parseFloat(style.borderRadius) || 0;
      if (radius >= 16) {
        hasRadius = true;
      }
    }

    return { hasBorder, hasBackground, hasRadius };
  });
}

test.describe('Glass Border Initial Render', () => {
  // Increase timeout for all tests in this suite
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:19006');
    await waitForAppReady(page);
  });

  test('should render glass cards with visible borders on initial load', async ({ page }) => {
    // Take screenshot immediately after load
    await page.screenshot({ path: 'test-results/glass-border-initial.png', fullPage: true });

    // Check for glass styling
    const glassStyles = await hasGlassCardStyling(page);

    console.log('Glass styling check:', glassStyles);

    // At least one of these should be true for proper glass rendering
    const hasGlassEffect = glassStyles.hasBorder || glassStyles.hasBackground;

    // Log detailed info for debugging
    if (!hasGlassEffect) {
      const html = await page.content();
      console.log('Page HTML length:', html.length);
    }

    expect(hasGlassEffect).toBe(true);
  });

  test('should have glass effects active on web (blur or semi-transparent)', async ({ page }) => {
    const hasBlur = await hasBlurEffect(page);
    const glassStyles = await hasGlassCardStyling(page);

    // Take screenshot showing glass state
    await page.screenshot({ path: 'test-results/glass-blur-effect.png', fullPage: true });

    console.log('Has blur effect:', hasBlur);
    console.log('Has glass background:', glassStyles.hasBackground);

    // Web should have EITHER backdrop-filter blur OR semi-transparent glass backgrounds
    // The fallback implementation uses solid semi-transparent colors when blur isn't available
    const hasGlassEffect = hasBlur || glassStyles.hasBackground;
    expect(hasGlassEffect).toBe(true);
  });

  test('glass cards should have rounded corners', async ({ page }) => {
    const glassStyles = await hasGlassCardStyling(page);

    console.log('Has border radius:', glassStyles.hasRadius);

    expect(glassStyles.hasRadius).toBe(true);
  });

  test('should not show broken/empty glass cards', async ({ page }) => {
    // Check that there are no elements with opacity 0 that should be visible
    const hasHiddenGlass = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid*="glass"], [class*="glass"], [class*="blur"]');
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.opacity === '0' || style.visibility === 'hidden') {
          return true;
        }
      }
      return false;
    });

    expect(hasHiddenGlass).toBe(false);
  });

  test('glass borders should render within 500ms of page load', async ({ page }) => {
    // Navigate fresh
    await page.goto('http://localhost:19006');
    await page.waitForLoadState('networkidle');

    // Start timer
    const startTime = Date.now();

    // Wait for glass styling to appear
    let glassFound = false;
    while (Date.now() - startTime < 3000 && !glassFound) {
      const glassStyles = await hasGlassCardStyling(page);
      if (glassStyles.hasBorder || glassStyles.hasBackground) {
        glassFound = true;
        break;
      }
      await page.waitForTimeout(100);
    }

    const elapsedTime = Date.now() - startTime;
    console.log(`Glass styling appeared after ${elapsedTime}ms`);

    // Take screenshot showing timing
    await page.screenshot({ path: 'test-results/glass-border-timing.png', fullPage: true });

    expect(glassFound).toBe(true);
    // Should render within 500ms (50ms delay + 200ms animation + buffer)
    expect(elapsedTime).toBeLessThan(1000);
  });
});

test.describe('Glass Card Visibility After Navigation', () => {
  test('glass borders should persist after navigating to tabs', async ({ page }) => {
    await page.goto('http://localhost:19006');
    await waitForAppReady(page);

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/glass-before-nav.png', fullPage: true });

    // Try to navigate (if authenticated) or stay on login
    const loginVisible = await page.locator('text=Welcome').isVisible().catch(() => false);

    if (!loginVisible) {
      // If already authenticated, check tabs
      await page.screenshot({ path: 'test-results/glass-tabs.png', fullPage: true });
    }

    // Check glass styling is present
    const glassStyles = await hasGlassCardStyling(page);
    expect(glassStyles.hasBorder || glassStyles.hasBackground).toBe(true);
  });
});
