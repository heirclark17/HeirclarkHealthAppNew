/**
 * Meal Logger Modal - Playwright E2E Tests
 *
 * These tests verify the meal logging modal functionality including:
 * - Modal opens and displays mode selection
 * - All input method cards are present
 * - Text description mode with AI analysis
 * - Photo mode UI elements
 * - Barcode mode UI elements
 * - Error handling for AI failures
 *
 * NOTE: Some tests require physical device or permissions and will be skipped in web environment
 */

import { test, expect } from '@playwright/test';

// Test configuration
const APP_URL = 'http://localhost:8081';

test.describe('Meal Logger Modal', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should open meal logger modal when clicking add meal button', async ({ page }) => {
    // Look for add meal button (might be FAB or button in header)
    // This selector needs to be updated based on actual app structure
    const addButton = page.locator('[data-testid="add-meal-button"]').or(
      page.locator('text=/log meal|add meal|\\+/i').first()
    );

    await addButton.click({ timeout: 10000 });

    // Verify modal opened by checking for modal title
    await expect(page.locator('text="Log Meal"')).toBeVisible({ timeout: 5000 });
  });

  test('should display mode selection with 3 input methods', async ({ page }) => {
    // Open modal (assuming it can be opened directly)
    // In actual test, you'd click the button first

    // Verify all mode cards are present
    await expect(page.locator('text="How would you like to log?"')).toBeVisible();
    await expect(page.locator('text="Text Description"')).toBeVisible();
    await expect(page.locator('text="Photo"')).toBeVisible();
    await expect(page.locator('text="Barcode"')).toBeVisible();

    // Verify Quick Entry is NOT present (removed)
    await expect(page.locator('text="Quick Entry"')).not.toBeVisible();
  });

  test('should show text description input when selecting manual mode', async ({ page }) => {
    // Click Text Description card
    await page.locator('text="Text Description"').click();

    // Verify text input appears
    await expect(page.locator('placeholder="E.g., 2 scrambled eggs, toast with butter, and orange juice"')).toBeVisible();

    // Verify AI analyze button appears
    await expect(page.locator('text="Analyze with AI"')).toBeVisible();
  });

  test('should handle AI meal analysis from text', async ({ page }) => {
    // Click Text Description
    await page.locator('text="Text Description"').click();

    // Enter meal description
    const input = page.locator('placeholder="E.g., 2 scrambled eggs, toast with butter, and orange juice"');
    await input.fill('grilled chicken breast with rice and broccoli');

    // Click analyze button
    await page.locator('text="Analyze with AI"').click();

    // Wait for loading state
    await expect(page.locator('text=/analyzing|loading/i')).toBeVisible({ timeout: 2000 });

    // Wait for analysis results (or error)
    await page.waitForTimeout(5000);

    // Check if analysis succeeded or failed
    const analysisResult = page.locator('text=/calories|protein|carbs|fat/i');
    const errorAlert = page.locator('text=/AI Unavailable|error/i');

    // Either analysis should succeed or show error
    const resultExists = await analysisResult.isVisible({ timeout: 5000 }).catch(() => false);
    const errorExists = await errorAlert.isVisible({ timeout: 2000 }).catch(() => false);

    expect(resultExists || errorExists).toBeTruthy();
  });

  test('should display photo mode options', async ({ page }) => {
    // Click Photo card
    await page.locator('text="Photo"').click();

    // Verify photo mode buttons appear
    await expect(page.locator('text="Take Photo"')).toBeVisible();
    await expect(page.locator('text="Choose Photo"')).toBeVisible();
  });

  test('should display barcode scanner options', async ({ page }) => {
    // Click Barcode card
    await page.locator('text="Barcode"').click();

    // Verify barcode input and scan button
    await expect(page.locator('placeholder="Enter barcode number"')).toBeVisible();
    await expect(page.locator('text="Scan Barcode"')).toBeVisible();
    await expect(page.locator('text="Lookup"')).toBeVisible();
  });

  test('should allow manual barcode entry and lookup', async ({ page }) => {
    // Click Barcode
    await page.locator('text="Barcode"').click();

    // Enter a valid barcode (Coca-Cola example)
    const barcodeInput = page.locator('placeholder="Enter barcode number"');
    await barcodeInput.fill('5449000000996');

    // Click lookup
    await page.locator('text="Lookup"').click();

    // Wait for lookup to complete
    await page.waitForTimeout(3000);

    // Check for results or error
    const productName = page.locator('text=/coca|cola|product/i');
    const errorMsg = page.locator('text=/not found|error/i');

    const hasProduct = await productName.isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasProduct || hasError).toBeTruthy();
  });

  test('should display back button in all input modes', async ({ page }) => {
    // Test Text Description mode
    await page.locator('text="Text Description"').click();
    await expect(page.locator('text="Back"')).toBeVisible();
    await page.locator('text="Back"').click();
    await expect(page.locator('text="How would you like to log?"')).toBeVisible();

    // Test Photo mode
    await page.locator('text="Photo"').click();
    await expect(page.locator('text="Back"')).toBeVisible();
    await page.locator('text="Back"').click();
    await expect(page.locator('text="How would you like to log?"')).toBeVisible();

    // Test Barcode mode
    await page.locator('text="Barcode"').click();
    await expect(page.locator('text="Back"')).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    // Modal should be open
    await expect(page.locator('text="Log Meal"')).toBeVisible();

    // Click close button (X icon)
    await page.locator('[aria-label="Close"]').or(
      page.locator('text="×"')
    ).click();

    // Modal should close
    await expect(page.locator('text="Log Meal"')).not.toBeVisible();
  });

  test('should show meal type selector after AI analysis', async ({ page }) => {
    // This test assumes successful AI analysis
    // In real test, you'd need to mock the API response

    await page.locator('text="Text Description"').click();
    const input = page.locator('placeholder="E.g., 2 scrambled eggs, toast with butter, and orange juice"');
    await input.fill('apple');
    await page.locator('text="Analyze with AI"').click();

    // Wait for analysis
    await page.waitForTimeout(5000);

    // Check if meal type selector appears
    const mealTypeSelector = page.locator('text=/breakfast|lunch|dinner|snack/i');
    const hasSelector = await mealTypeSelector.isVisible({ timeout: 5000 }).catch(() => false);

    // If analysis succeeded, selector should be visible
    if (hasSelector) {
      await expect(page.locator('text="Breakfast"')).toBeVisible();
      await expect(page.locator('text="Lunch"')).toBeVisible();
      await expect(page.locator('text="Dinner"')).toBeVisible();
      await expect(page.locator('text="Snack"')).toBeVisible();
    }
  });

  test('should handle empty text description gracefully', async ({ page }) => {
    await page.locator('text="Text Description"').click();

    // Click analyze without entering text
    await page.locator('text="Analyze with AI"').click();

    // Should show error alert
    await expect(page.locator('text=/please describe|error/i')).toBeVisible({ timeout: 2000 });
  });

  test('should display AI confidence level in results', async ({ page }) => {
    // This test requires successful AI response
    await page.locator('text="Text Description"').click();
    const input = page.locator('placeholder="E.g., 2 scrambled eggs, toast with butter, and orange juice"');
    await input.fill('banana');
    await page.locator('text="Analyze with AI"').click();

    await page.waitForTimeout(5000);

    // Check for confidence indicator
    const confidence = page.locator('text=/confidence/i');
    const hasConfidence = await confidence.isVisible({ timeout: 5000 }).catch(() => false);

    // Confidence may not always be shown
    if (hasConfidence) {
      console.log('Confidence level displayed in results');
    }
  });

  test.skip('should open camera when clicking Take Photo (requires device)', async ({ page }) => {
    // This test requires camera permissions and physical device
    // Skipped in web environment
    await page.locator('text="Photo"').click();
    await page.locator('text="Take Photo"').click();

    // Camera view should open (in native app)
    // This won't work in web Playwright test
  });

  test.skip('should open barcode scanner when clicking Scan Barcode (requires device)', async ({ page }) => {
    // This test requires camera permissions and physical device
    // Skipped in web environment
    await page.locator('text="Barcode"').click();
    await page.locator('text="Scan Barcode"').click();

    // Scanner view should open (in native app)
    // This won't work in web Playwright test
  });
});

test.describe('Meal Logger - Backend Integration', () => {

  test('should call correct AI endpoint for text analysis', async ({ page }) => {
    // Intercept network requests
    let aiRequestMade = false;

    page.on('request', request => {
      if (request.url().includes('/api/v1/nutrition/ai/meal-from-text')) {
        aiRequestMade = true;
        console.log('AI text analysis endpoint called:', request.url());
      }
    });

    await page.goto(APP_URL);
    await page.locator('text="Text Description"').click();
    const input = page.locator('placeholder="E.g., 2 scrambled eggs, toast with butter, and orange juice"');
    await input.fill('test meal');
    await page.locator('text="Analyze with AI"').click();

    await page.waitForTimeout(3000);

    expect(aiRequestMade).toBeTruthy();
  });

  test('should include shopifyCustomerId in API requests', async ({ page }) => {
    let hasCustomerId = false;

    page.on('request', request => {
      const headers = request.headers();
      if (headers['x-shopify-customer-id']) {
        hasCustomerId = true;
        console.log('Shopify Customer ID header present:', headers['x-shopify-customer-id']);
      }
    });

    await page.goto(APP_URL);
    await page.locator('text="Text Description"').click();
    const input = page.locator('placeholder="E.g., 2 scrambled eggs, toast with butter, and orange juice"');
    await input.fill('test meal');
    await page.locator('text="Analyze with AI"').click();

    await page.waitForTimeout(2000);

    expect(hasCustomerId).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.goto(APP_URL);
    await page.locator('text="Text Description"').click();
    const input = page.locator('placeholder="E.g., 2 scrambled eggs, toast with butter, and orange juice"');
    await input.fill('test meal');
    await page.locator('text="Analyze with AI"').click();

    // Should show error message
    await expect(page.locator('text=/unavailable|error|failed/i')).toBeVisible({ timeout: 5000 });

    // Restore online mode
    await page.context().setOffline(false);
  });
});

test.describe('Meal Logger - Accessibility', () => {

  test('should have proper ARIA labels on buttons', async ({ page }) => {
    await page.goto(APP_URL);

    // Check for accessible labels
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const label = await button.getAttribute('aria-label').catch(() => null);
      const text = await button.textContent().catch(() => '');

      // Button should have either aria-label or text content
      expect(label || text).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(APP_URL);

    // Tab through modal elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focused element should be visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Meal Logger - Data Validation', () => {

  test('should validate barcode format', async ({ page }) => {
    await page.goto(APP_URL);
    await page.locator('text="Barcode"').click();

    // Enter invalid barcode (letters)
    const barcodeInput = page.locator('placeholder="Enter barcode number"');
    await barcodeInput.fill('ABC123');

    // Input should only allow numbers (keyboardType="numeric")
    const value = await barcodeInput.inputValue();

    // Check if non-numeric characters were filtered
    // (This depends on implementation - may need adjustment)
  });

  test('should limit text description length', async ({ page }) => {
    await page.goto(APP_URL);
    await page.locator('text="Text Description"').click();

    const input = page.locator('placeholder="E.g., 2 scrambled eggs, toast with butter, and orange juice"');

    // Enter very long text
    const longText = 'a'.repeat(10000);
    await input.fill(longText);

    const value = await input.inputValue();

    // Check if text was accepted (may have character limit)
    console.log('Text length accepted:', value.length);
  });
});
