const { chromium } = require('playwright');

async function testExpoExerciseGIFs() {
  console.log('[Expo Exercise GIF Test] Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();

  try {
    // Navigate to Expo web build
    console.log('[Expo Exercise GIF Test] Navigating to Expo app...');
    await page.goto('http://localhost:8081', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Try to navigate to exercises tab
    console.log('[Expo Exercise GIF Test] Looking for exercises navigation...');

    // Wait a bit for app to load
    await page.waitForTimeout(5000);

    // Look for tab bar or exercises link
    const exercisesLink = await page.locator('text=/exercises/i, [href*="exercises"], button:has-text("Exercises")').first();

    if (await exercisesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('[Expo Exercise GIF Test] Found exercises link - clicking...');
      await exercisesLink.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('[Expo Exercise GIF Test] No exercises link found - trying direct URL...');
      await page.goto('http://localhost:8081/exercises', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }

    // Check for images
    console.log('[Expo Exercise GIF Test] Checking for exercise images...');

    // Listen for network requests to see if GIF URLs are being requested
    let gifRequests = [];
    page.on('request', request => {
      if (request.url().includes('exercise-gif')) {
        gifRequests.push(request.url());
        console.log(`[Expo Exercise GIF Test] 🔍 GIF request: ${request.url()}`);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('exercise-gif')) {
        const status = response.status();
        const contentType = response.headers()['content-type'];
        console.log(`[Expo Exercise GIF Test] 📥 GIF response: ${response.url()} - Status: ${status}, Type: ${contentType}`);
      }
    });

    // Scroll to trigger loading
    console.log('[Expo Exercise GIF Test] Scrolling to trigger exercise loading...');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(2000);
    }

    // Check all images
    const allImages = await page.locator('img').all();
    console.log(`[Expo Exercise GIF Test] Total images on page: ${allImages.length}`);

    let exerciseGifImages = 0;
    for (const img of allImages) {
      const src = await img.getAttribute('src');
      if (src && src.includes('exercise-gif')) {
        exerciseGifImages++;
        const isVisible = await img.isVisible();
        const isLoaded = await img.evaluate(el => el.complete && el.naturalWidth > 0);
        console.log(`[Expo Exercise GIF Test] GIF #${exerciseGifImages}: ${src.substring(0, 80)}... Visible: ${isVisible}, Loaded: ${isLoaded}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'C:/Users/derri/expo-exercise-gifs-test.png', fullPage: true });

    // Summary
    console.log('\n========================================');
    console.log('EXPO EXERCISE GIF TEST SUMMARY');
    console.log('========================================');
    console.log(`Total images: ${allImages.length}`);
    console.log(`Exercise GIF images: ${exerciseGifImages}`);
    console.log(`GIF requests made: ${gifRequests.length}`);
    console.log('========================================\n');

    if (exerciseGifImages > 0) {
      console.log('✅ SUCCESS! Exercise GIF images are being rendered!');
    } else if (gifRequests.length > 0) {
      console.log('⚠️  GIF requests made but no images rendered');
    } else {
      console.log('❌ No exercise GIFs found or requested');
    }

  } catch (error) {
    console.error('[Expo Exercise GIF Test] Error:', error.message);
    await page.screenshot({ path: 'C:/Users/derri/expo-exercise-gifs-error.png' });
  } finally {
    console.log('[Expo Exercise GIF Test] Closing browser...');
    await browser.close();
  }
}

testExpoExerciseGIFs();
