// Test GIF URL with RapidAPI authentication
const fetch = require('node-fetch');

const API_KEY = 'b3c3790038mshcfc571cd8cae3ccp13abefjsn6fb2f32a654d';
const GIF_URL = 'https://v2.exercisedb.io/image/0001';

async function testWithAuth() {
  console.log('Testing GIF URL with RapidAPI headers...\n');
  
  try {
    const response = await fetch(GIF_URL, {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      console.log('✅ GIF accessible with authentication!');
    } else {
      console.log('❌ Still getting error with auth headers');
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWithAuth();
