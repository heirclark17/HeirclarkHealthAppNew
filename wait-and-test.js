// Wait and test backend proxy after deployment
const fetch = require('node-fetch');

async function waitAndTest() {
  console.log('Waiting 30 seconds for Railway deployment...\n');
  
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  console.log('Testing backend GIF proxy...\n');
  const proxyUrl = 'https://heirclarkinstacartbackend-production.up.railway.app/api/v1/exercise-gif/0001?resolution=180';
  
  try {
    const response = await fetch(proxyUrl, { method: 'HEAD' });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok && response.headers.get('content-type') === 'image/gif') {
      console.log('\n✅ BACKEND DEPLOYED! GIFs are now working!');
      console.log('\n👉 Restart Expo and tap "Load All" to see GIFs');
    } else {
      console.log('\n⏳ Backend still deploying... Try again in 1 minute');
    }
  } catch (error) {
    console.log('\n⏳ Backend still deploying... Try again in 1 minute');
  }
}

waitAndTest();
