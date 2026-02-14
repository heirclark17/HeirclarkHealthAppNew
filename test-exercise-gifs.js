const fetch = require('node-fetch');

async function testExerciseGifs() {
  console.log('Testing exercise GIF URLs...\n');

  try {
    // Fetch exercises from backend
    const response = await fetch('https://heirclarkinstacartbackend-production.up.railway.app/api/v1/exercises?limit=10');
    const data = await response.json();

    if (!data.success || !data.exercises) {
      console.error('Failed to fetch exercises:', data);
      return;
    }

    console.log(`Fetched ${data.exercises.length} exercises\n`);

    // Check each exercise's gifUrl
    data.exercises.forEach((ex, index) => {
      console.log(`${index + 1}. ${ex.name}`);
      console.log(`   ID: ${ex.id}`);
      console.log(`   gifUrl: ${ex.gifUrl || 'NULL'}`);
      console.log(`   Status: ${ex.gifUrl ? 'HAS URL' : 'MISSING'}`);
      console.log('');
    });

    // Test if GIF proxy works
    const firstExercise = data.exercises[0];
    if (firstExercise.gifUrl) {
      console.log('\nTesting GIF proxy endpoint...');
      console.log(`URL: ${firstExercise.gifUrl}`);
      
      const gifResponse = await fetch(firstExercise.gifUrl);
      console.log(`Status: ${gifResponse.status} ${gifResponse.statusText}`);
      console.log(`Content-Type: ${gifResponse.headers.get('content-type')}`);
      console.log(`Content-Length: ${gifResponse.headers.get('content-length')} bytes`);
      console.log(`X-Cache: ${gifResponse.headers.get('X-Cache') || 'Not set'}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testExerciseGifs();
