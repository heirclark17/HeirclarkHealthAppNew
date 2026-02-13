const { chromium } = require('playwright');

async function testExerciseGIFs() {
  console.log('[Exercise GIF Test] Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to exercises page
    console.log('[Exercise GIF Test] Navigating to exercises page...');
    await page.goto('https://www.heirclark.com/exercises', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for "Load All" button
    console.log('[Exercise GIF Test] Looking for Load All button...');
    const loadAllButton = await page.locator('text=/Load All/i').first();

    if (await loadAllButton.isVisible()) {
      console.log('[Exercise GIF Test] ✅ Load All button found - clicking...');
      await loadAllButton.click();
      await page.waitForTimeout(5000); // Wait for exercises to load
    } else {
      console.log('[Exercise GIF Test] Load All button not found - checking if exercises already loaded');
    }

    // Check for exercise cards
    console.log('[Exercise GIF Test] Checking for exercise cards...');
    const exerciseCards = await page.locator('[data-testid="exercise-card"], .exercise-card, div:has-text("Push-Up"), div:has-text("Squat")').all();
    console.log(`[Exercise GIF Test] Found ${exerciseCards.length} exercise cards`);

    if (exerciseCards.length === 0) {
      // Try scrolling to trigger loading
      console.log('[Exercise GIF Test] No cards found, scrolling to trigger loading...');
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(2000);
    }

    // Check for images with exercise GIF URLs
    console.log('[Exercise GIF Test] Checking for GIF images...');
    const allImages = await page.locator('img').all();
    console.log(`[Exercise GIF Test] Total images on page: ${allImages.length}`);

    let gifCount = 0;
    let loadedGifCount = 0;

    for (let i = 0; i < allImages.length; i++) {
      const img = allImages[i];
      const src = await img.getAttribute('src');

      if (src && src.includes('exercise-gif')) {
        gifCount++;
        console.log(`[Exercise GIF Test] Found exercise GIF #${gifCount}: ${src}`);

        // Check if image is loaded (naturalWidth > 0)
        const isLoaded = await img.evaluate((el) => {
          return el.complete && el.naturalWidth > 0;
        });

        if (isLoaded) {
          loadedGifCount++;
          console.log(`[Exercise GIF Test] ✅ GIF #${gifCount} is loaded and visible`);
        } else {
          console.log(`[Exercise GIF Test] ❌ GIF #${gifCount} failed to load`);
        }
      }
    }

    // Take screenshot
    console.log('[Exercise GIF Test] Taking screenshot...');
    await page.screenshot({ path: 'C:/Users/derri/exercise-gifs-test.png', fullPage: true });

    // Print summary
    console.log('\n========================================');
    console.log('EXERCISE GIF TEST SUMMARY');
    console.log('========================================');
    console.log(`Total images found: ${allImages.length}`);
    console.log(`Exercise GIFs found: ${gifCount}`);
    console.log(`GIFs successfully loaded: ${loadedGifCount}`);
    console.log(`Success rate: ${gifCount > 0 ? ((loadedGifCount / gifCount) * 100).toFixed(1) : 0}%`);
    console.log('========================================\n');

    if (loadedGifCount > 0) {
      console.log('✅ SUCCESS! Exercise GIFs are displaying correctly!');
    } else if (gifCount > 0) {
      console.log('⚠️  WARNING: GIF URLs found but images not loading');
    } else {
      console.log('❌ FAILED: No exercise GIF URLs found on page');
    }

  } catch (error) {
    console.error('[Exercise GIF Test] Error:', error.message);
    await page.screenshot({ path: 'C:/Users/derri/exercise-gifs-error.png' });
  } finally {
    console.log('[Exercise GIF Test] Closing browser...');
    await browser.close();
  }
}

testExerciseGIFs();
