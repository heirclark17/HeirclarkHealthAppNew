// Test ExerciseDB API response format
const fetch = require('node-fetch');

const API_KEY = 'b3c3790038mshcfc571cd8cae3ccp13abefjsn6fb2f32a654d';

async function testAPI() {
  try {
    console.log('Fetching single exercise from ExerciseDB API...\n');
    
    const response = await fetch('https://exercisedb.p.rapidapi.com/exercises?limit=1&offset=0', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }

    const exercises = await response.json();
    
    if (exercises && exercises.length > 0) {
      const ex = exercises[0];
      console.log('Exercise object from API:');
      console.log(JSON.stringify(ex, null, 2));
      
      console.log('\n\nField mapping check:');
      console.log('  id:', ex.id || ex.ID || 'NOT FOUND');
      console.log('  name:', ex.name || 'NOT FOUND');
      console.log('  bodyPart:', ex.bodyPart || 'NOT FOUND');
      console.log('  gifUrl:', ex.gifUrl || ex.gifURL || ex.gif || 'NOT FOUND ❌');
      console.log('  instructions:', ex.instructions ? 'EXISTS' : 'NOT FOUND');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
