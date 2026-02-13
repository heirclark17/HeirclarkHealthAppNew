// Verify GIF URLs in database and test image loading
const fetch = require('node-fetch');

async function verifyGIFs() {
  try {
    console.log('1. Checking database for GIF URLs...\n');
    
    const response = await fetch('https://heirclarkinstacartbackend-production.up.railway.app/api/v1/exercises?limit=5');
    const data = await response.json();
    
    if (data.exercises && data.exercises.length > 0) {
      console.log(`Found ${data.exercises.length} exercises in database:\n`);
      
      data.exercises.forEach((ex, idx) => {
        console.log(`${idx + 1}. ${ex.name}`);
        console.log(`   ID: ${ex.id}`);
        console.log(`   GIF URL: ${ex.gifUrl || '❌ MISSING'}`);
        console.log('');
      });
      
      // Test if first GIF URL is accessible
      if (data.exercises[0].gifUrl) {
        console.log('\n2. Testing if GIF URL is accessible...\n');
        const gifUrl = data.exercises[0].gifUrl;
        console.log(`Testing: ${gifUrl}`);
        
        try {
          const gifResponse = await fetch(gifUrl);
          console.log(`Status: ${gifResponse.status} ${gifResponse.statusText}`);
          console.log(`Content-Type: ${gifResponse.headers.get('content-type')}`);
          
          if (gifResponse.ok) {
            console.log('✅ GIF URL is accessible!');
          } else {
            console.log('❌ GIF URL returned error status');
          }
        } catch (error) {
          console.log('❌ Failed to fetch GIF:', error.message);
        }
      }
    } else {
      console.log('❌ No exercises found in database');
      console.log('👉 You need to tap "Load All" in the app');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyGIFs();
