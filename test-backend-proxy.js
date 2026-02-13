// Test backend GIF proxy endpoint
const fetch = require('node-fetch');

async function testProxy() {
  const proxyUrl = 'https://heirclarkinstacartbackend-production.up.railway.app/api/v1/exercise-gif/0001?resolution=180';
  
  console.log('Testing backend GIF proxy...\n');
  console.log(`URL: ${proxyUrl}\n`);
  
  try {
    const response = await fetch(proxyUrl, { method: 'HEAD' });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Cache-Control: ${response.headers.get('cache-control')}`);
    
    if (response.ok && response.headers.get('content-type') === 'image/gif') {
      console.log('\n✅ Backend proxy works! GIFs will now display.');
    } else {
      console.log('\n❌ Proxy not working yet - backend needs to be deployed');
    }
  } catch (error) {
    console.log('\n❌ Proxy endpoint error:', error.message);
    console.log('Backend needs to be deployed to Railway');
  }
}

testProxy();
