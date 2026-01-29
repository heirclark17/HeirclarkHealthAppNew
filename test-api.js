// Quick API Test
const API_BASE = 'https://heirclarkinstacartbackend-production.up.railway.app';

async function testAPI() {
  console.log('\n🔍 Testing Backend API Endpoints...\n');
  
  // Test 1: Health check
  try {
    const res = await fetch(`${API_BASE}/`);
    const data = await res.json();
    console.log('✅ Backend Health:', data);
  } catch (err) {
    console.log('❌ Backend Health:', err.message);
  }
  
  // Test 2: Metrics
  try {
    const res = await fetch(`${API_BASE}/api/v1/health/metrics?shopifyCustomerId=guest_ios_app`, {
      headers: { 'X-Shopify-Customer-Id': 'guest_ios_app' }
    });
    const data = await res.json();
    console.log('✅ Metrics:', data);
  } catch (err) {
    console.log('❌ Metrics:', err.message);
  }
  
  // Test 3: History
  try {
    const res = await fetch(`${API_BASE}/api/v1/health/history?shopifyCustomerId=guest_ios_app&startDate=2026-01-12&endDate=2026-01-19`, {
      headers: { 'X-Shopify-Customer-Id': 'guest_ios_app' }
    });
    const data = await res.json();
    console.log('✅ History:', data);
  } catch (err) {
    console.log('❌ History:', err.message);
  }
  
  // Test 4: Meals
  try {
    const res = await fetch(`${API_BASE}/api/v1/meals?shopifyCustomerId=guest_ios_app&date=2026-01-19`, {
      headers: { 'X-Shopify-Customer-Id': 'guest_ios_app' }
    });
    const data = await res.json();
    console.log('✅ Meals:', data);
  } catch (err) {
    console.log('❌ Meals:', err.message);
  }
  
  console.log('\n✅ All API tests complete!\n');
}

testAPI();
