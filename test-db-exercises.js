// Test if exercises exist in database
const fetch = require('node-fetch');

async function checkExercises() {
  try {
    const response = await fetch('https://heirclarkinstacartbackend-production.up.railway.app/api/v1/exercises/count');
    const data = await response.json();
    console.log('Exercises in database:', data.count);
    
    if (data.count === 0) {
      console.log('\n⚠️  NO EXERCISES LOADED');
      console.log('👉 You need to tap "Load All" button in the Exercises tab to download exercises from ExerciseDB API');
    } else {
      console.log('\n✅ Exercises loaded. Checking first exercise...');
      
      const exResponse = await fetch('https://heirclarkinstacartbackend-production.up.railway.app/api/v1/exercises?limit=1');
      const exData = await exResponse.json();
      
      if (exData.exercises && exData.exercises[0]) {
        const ex = exData.exercises[0];
        console.log('\nFirst exercise:');
        console.log('  Name:', ex.name);
        console.log('  GIF URL:', ex.gifUrl || '❌ MISSING');
        console.log('  Body Part:', ex.bodyPart);
        
        if (!ex.gifUrl) {
          console.log('\n⚠️  GIF URLs are missing from database');
          console.log('👉 Re-run "Load All" to fetch exercises with GIF URLs');
        }
      }
    }
  } catch (error) {
    console.error('Error checking database:', error.message);
  }
}

checkExercises();
