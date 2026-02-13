// Test different public GIF URL formats
const fetch = require('node-fetch');

const formats = [
  'https://v2.exercisedb.io/image/0001.gif',
  'https://api.exercisedb.io/image/0001',
  'https://api.exercisedb.io/image/0001.gif',
  'https://exercisedb.io/image/0001',
  'https://exercisedb.io/image/0001.gif',
  'https://raw.exercisedb.io/0001.gif'
];

async function testFormats() {
  console.log('Testing different public GIF URL formats...\n');
  
  for (const url of formats) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`${url}`);
      console.log(`  Status: ${response.status}`);
      
      if (response.ok) {
        console.log(`  ✅ WORKS! Content-Type: ${response.headers.get('content-type')}`);
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    console.log('');
  }
}

testFormats();
