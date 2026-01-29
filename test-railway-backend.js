// Test Railway Backend Deployment
const { chromium } = require('playwright');

const RAILWAY_URL = 'https://heirclarkinstacartbackend-production.up.railway.app';

async function testBackend() {
  console.log('🔍 Testing Railway Backend...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check Endpoint');
  try {
    const response = await page.goto(`${RAILWAY_URL}/api/v1/health`, { waitUntil: 'networkidle' });
    console.log(`   Status: ${response.status()}`);

    if (response.status() === 200) {
      const body = await response.json();
      console.log(`   Response:`, JSON.stringify(body, null, 2));
    } else {
      const text = await response.text();
      console.log(`   Error Response:`, text.substring(0, 200));
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }

  // Test 2: Text Analysis Endpoint
  console.log('\n2️⃣ Testing Text Analysis Endpoint');
  try {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/v1/nutrition/ai/meal-from-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'grilled chicken with rice',
          shopifyCustomerId: 'test_user'
        })
      });

      return {
        status: res.status,
        body: await res.text()
      };
    }, RAILWAY_URL);

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.body.substring(0, 200));
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }

  // Test 3: Check what endpoints exist
  console.log('\n3️⃣ Checking Available Endpoints');
  const endpoints = [
    '/api/v1/health',
    '/api/v1/nutrition/ai/meal-from-text',
    '/api/v1/nutrition/ai/meal-from-photo',
    '/api/v1/nutrition/ai/transcribe-voice',
    '/health',
    '/'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await page.goto(`${RAILWAY_URL}${endpoint}`, {
        waitUntil: 'networkidle',
        timeout: 5000
      });
      console.log(`   ${endpoint}: ${response.status()}`);
    } catch (error) {
      console.log(`   ${endpoint}: ❌ ${error.message}`);
    }
  }

  await browser.close();
  console.log('\n✅ Testing Complete');
}

testBackend().catch(console.error);
