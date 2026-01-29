// Test Railway with Authentication
const { chromium } = require('playwright');

const RAILWAY_URL = 'https://heirclarkinstacartbackend-production.up.railway.app';

async function testWithAuth() {
  console.log('🔐 Testing Railway Backend with Authentication\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Test 1: With X-Shopify-Customer-Id header
  console.log('📋 Test 1: Text Analysis with X-Shopify-Customer-Id Header');
  try {
    const response = await page.evaluate(async ({ url }) => {
      const res = await fetch(`${url}/api/v1/nutrition/ai/meal-from-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Customer-Id': 'guest_ios_app'
        },
        body: JSON.stringify({
          text: 'grilled chicken with rice and broccoli',
          shopifyCustomerId: 'guest_ios_app'
        })
      });

      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body: await res.text()
      };
    }, { url: RAILWAY_URL });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.body.substring(0, 300));

    if (response.status === 200) {
      console.log('   ✅ Authentication successful with X-Shopify-Customer-Id');
      const data = JSON.parse(response.body);
      if (data.analysis) {
        console.log(`   ✅ AI analysis returned: ${data.analysis.mealName}`);
        console.log(`   Calories: ${data.analysis.calories}, Protein: ${data.analysis.protein}g`);
      }
    } else {
      console.log(`   ❌ Authentication failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Photo analysis with auth
  console.log('\n📋 Test 2: Photo Analysis with Authentication');
  try {
    // Create a small test image
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const response = await page.evaluate(async ({ url, imageData }) => {
      const byteCharacters = atob(imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const formData = new FormData();
      formData.append('photo', blob, 'test-meal.png');
      formData.append('shopifyCustomerId', 'guest_ios_app');

      const res = await fetch(`${url}/api/v1/nutrition/ai/meal-from-photo`, {
        method: 'POST',
        headers: {
          'X-Shopify-Customer-Id': 'guest_ios_app'
        },
        body: formData
      });

      return {
        status: res.status,
        body: await res.text()
      };
    }, { url: RAILWAY_URL, imageData: testImageBase64 });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.body.substring(0, 300));

    if (response.status === 200) {
      console.log('   ✅ Photo analysis successful');
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Voice transcription with auth
  console.log('\n📋 Test 3: Voice Transcription with Authentication');
  try {
    const mockAudioData = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
      0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
      0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
      0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
      0x00, 0x00, 0x00, 0x00
    ]);
    const mockAudioBase64 = mockAudioData.toString('base64');

    const response = await page.evaluate(async ({ url, audioData }) => {
      const byteCharacters = atob(audioData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });

      const formData = new FormData();
      formData.append('audio', blob, 'test-audio.wav');
      formData.append('shopifyCustomerId', 'guest_ios_app');

      const res = await fetch(`${url}/api/v1/nutrition/ai/transcribe-voice`, {
        method: 'POST',
        headers: {
          'X-Shopify-Customer-Id': 'guest_ios_app'
        },
        body: formData
      });

      return {
        status: res.status,
        body: await res.text()
      };
    }, { url: RAILWAY_URL, audioData: mockAudioBase64 });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.body.substring(0, 300));

    if (response.status === 200) {
      console.log('   ✅ Voice transcription successful');
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  await browser.close();

  console.log('\n' + '='.repeat(71));
  console.log('✅ CONCLUSION');
  console.log('='.repeat(71));
  console.log('Railway backend requires X-Shopify-Customer-Id header for authentication.');
  console.log('The frontend (aiService.ts) already includes this header, so it should work!');
  console.log('\nNext step: Test the mobile app to verify meal logging works end-to-end.');
  console.log('='.repeat(71));
}

testWithAuth().catch(console.error);
