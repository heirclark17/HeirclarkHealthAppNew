// Check Railway Root Endpoint
const { chromium } = require('playwright');

async function checkRoot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Checking Railway backend root...\n');

  // Check root
  const response = await page.goto('https://heirclarkinstacartbackend-production.up.railway.app/', {
    waitUntil: 'networkidle'
  });

  console.log('Status:', response.status());
  console.log('Response:', await response.text());

  // Check /health
  const healthResponse = await page.goto('https://heirclarkinstacartbackend-production.up.railway.app/health', {
    waitUntil: 'networkidle'
  });

  console.log('\n/health Status:', healthResponse.status());
  console.log('/health Response:', await healthResponse.text());

  await browser.close();
}

checkRoot().catch(console.error);
