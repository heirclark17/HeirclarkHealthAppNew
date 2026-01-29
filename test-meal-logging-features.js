// Comprehensive Meal Logging Feature Tests with Playwright
const { chromium } = require('playwright');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 Starting Meal Logging Feature Tests\n');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  console.log('\n📋 Test 1: Health Check Endpoint');
  console.log('-'.repeat(60));
  try {
    const response = await page.goto(`${BASE_URL}/api/v1/health`, { waitUntil: 'networkidle' });

    if (response.status() === 200) {
      const body = await response.json();
      console.log('✅ PASS - Health check returned 200');
      console.log(`   Status: ${body.status}`);
      console.log(`   Message: ${body.message}`);
      passed++;
    } else {
      console.log(`❌ FAIL - Expected 200, got ${response.status()}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}`);
    failed++;
  }

  // Test 2: Text Analysis
  console.log('\n📋 Test 2: Text-to-Nutrition Analysis');
  console.log('-'.repeat(60));
  try {
    const testMeals = [
      'grilled chicken with brown rice and broccoli',
      'greek yogurt with granola and berries',
      'salmon salad with olive oil dressing'
    ];

    for (const mealText of testMeals) {
      console.log(`\n   Testing: "${mealText}"`);

      const response = await page.evaluate(async ({ url, text }) => {
        const res = await fetch(`${url}/api/v1/nutrition/ai/meal-from-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            shopifyCustomerId: 'test_playwright'
          })
        });

        const status = res.status;
        let body;
        try {
          body = await res.json();
        } catch (e) {
          body = await res.text();
        }

        return { status, body };
      }, { url: BASE_URL, text: mealText });

      if (response.status === 200 && response.body.success) {
        const analysis = response.body.analysis;
        console.log('   ✅ PASS - Text analysis successful');
        console.log(`      Meal: ${analysis.mealName}`);
        console.log(`      Calories: ${analysis.calories}`);
        console.log(`      Protein: ${analysis.protein}g, Carbs: ${analysis.carbs}g, Fat: ${analysis.fat}g`);
        console.log(`      Confidence: ${analysis.confidence}`);
        console.log(`      Foods detected: ${analysis.foods.length}`);

        // Validate response structure
        if (!analysis.calories || !analysis.protein || !analysis.carbs || !analysis.fat) {
          console.log('   ⚠️  WARNING - Missing nutrition values');
        }

        passed++;
      } else {
        console.log(`   ❌ FAIL - Status ${response.status}`);
        console.log(`      Response:`, JSON.stringify(response.body).substring(0, 200));
        failed++;
      }
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}`);
    failed++;
  }

  // Test 3: Photo Analysis (with mock image)
  console.log('\n📋 Test 3: Photo-to-Nutrition Analysis');
  console.log('-'.repeat(60));
  try {
    // Create a small test image (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');

    const response = await page.evaluate(async ({ url, imageData }) => {
      // Convert base64 to blob
      const byteCharacters = atob(imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const formData = new FormData();
      formData.append('photo', blob, 'test-meal.png');
      formData.append('shopifyCustomerId', 'test_playwright');

      const res = await fetch(`${url}/api/v1/nutrition/ai/meal-from-photo`, {
        method: 'POST',
        body: formData
      });

      const status = res.status;
      let body;
      try {
        body = await res.json();
      } catch (e) {
        body = await res.text();
      }

      return { status, body };
    }, { url: BASE_URL, imageData: testImageBase64 });

    if (response.status === 200 && response.body.success) {
      const analysis = response.body.analysis;
      console.log('✅ PASS - Photo analysis successful');
      console.log(`   Meal: ${analysis.mealName}`);
      console.log(`   Calories: ${analysis.calories}`);
      console.log(`   Protein: ${analysis.protein}g, Carbs: ${analysis.carbs}g, Fat: ${analysis.fat}g`);
      console.log(`   Confidence: ${analysis.confidence}`);
      console.log(`   Foods detected: ${analysis.foods.length}`);
      passed++;
    } else {
      console.log(`❌ FAIL - Status ${response.status}`);
      console.log(`   Response:`, JSON.stringify(response.body).substring(0, 200));
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}`);
    console.log(`   Stack:`, error.stack);
    failed++;
  }

  // Test 4: Voice Transcription (with mock audio)
  console.log('\n📋 Test 4: Voice-to-Text Transcription');
  console.log('-'.repeat(60));
  try {
    // Create a tiny mock audio file (minimal WAV header)
    const mockAudioData = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // File size
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // fmt chunk size
      0x01, 0x00,             // Audio format (1 = PCM)
      0x01, 0x00,             // Channels (1)
      0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
      0x88, 0x58, 0x01, 0x00, // Byte rate
      0x02, 0x00,             // Block align
      0x10, 0x00,             // Bits per sample
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x00, 0x00, 0x00  // Data chunk size
    ]);

    const mockAudioBase64 = mockAudioData.toString('base64');

    const response = await page.evaluate(async ({ url, audioData }) => {
      // Convert base64 to blob
      const byteCharacters = atob(audioData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });

      const formData = new FormData();
      formData.append('audio', blob, 'test-audio.wav');
      formData.append('shopifyCustomerId', 'test_playwright');

      const res = await fetch(`${url}/api/v1/nutrition/ai/transcribe-voice`, {
        method: 'POST',
        body: formData
      });

      const status = res.status;
      let body;
      try {
        body = await res.json();
      } catch (e) {
        body = await res.text();
      }

      return { status, body };
    }, { url: BASE_URL, audioData: mockAudioBase64 });

    if (response.status === 200 && response.body.success) {
      console.log('✅ PASS - Voice transcription successful');
      console.log(`   Transcribed text: "${response.body.text}"`);
      passed++;
    } else {
      console.log(`❌ FAIL - Status ${response.status}`);
      console.log(`   Response:`, JSON.stringify(response.body).substring(0, 200));
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}`);
    failed++;
  }

  // Test 5: Error Handling - Missing Data
  console.log('\n📋 Test 5: Error Handling (Missing Data)');
  console.log('-'.repeat(60));
  try {
    // Test text endpoint with missing text
    const response1 = await page.evaluate(async ({ url }) => {
      const res = await fetch(`${url}/api/v1/nutrition/ai/meal-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopifyCustomerId: 'test' })
      });
      return { status: res.status, body: await res.json() };
    }, { url: BASE_URL });

    if (response1.status === 400) {
      console.log('✅ PASS - Correctly rejects missing text (400)');
      passed++;
    } else {
      console.log(`❌ FAIL - Expected 400, got ${response1.status}`);
      failed++;
    }

    // Test photo endpoint with missing photo
    const response2 = await page.evaluate(async ({ url }) => {
      const formData = new FormData();
      formData.append('shopifyCustomerId', 'test');
      const res = await fetch(`${url}/api/v1/nutrition/ai/meal-from-photo`, {
        method: 'POST',
        body: formData
      });
      return { status: res.status, body: await res.json() };
    }, { url: BASE_URL });

    if (response2.status === 400) {
      console.log('✅ PASS - Correctly rejects missing photo (400)');
      passed++;
    } else {
      console.log(`❌ FAIL - Expected 400, got ${response2.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}`);
    failed++;
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Backend is ready for deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Wait for server to be ready
setTimeout(() => {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}, 2000); // Wait 2 seconds for server to start
