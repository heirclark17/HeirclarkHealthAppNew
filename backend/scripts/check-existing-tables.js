#!/usr/bin/env node
const { Client } = require('pg');

const DATABASE_URL = process.argv[2];

async function checkTables() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Get existing tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📊 Existing tables (${tables.rows.length}):\n`);
    tables.rows.forEach((row, i) => {
      console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${row.table_name}`);
    });

    // Expected tables
    const expected = [
      'users', 'user_sessions', 'user_profiles', 'user_goals',
      'meals', 'meal_foods', 'saved_meals', 'meal_plans',
      'workout_plans', 'workout_sessions',
      'weight_logs', 'calorie_logs', 'step_logs', 'hydration_logs', 'sleep_logs',
      'habits', 'habit_completions', 'calorie_bank', 'fasting_sessions',
      'tdee_calculations', 'coach_conversations', 'accountability_partnerships',
      'progress_predictions', 'restaurant_analyses', 'connected_devices'
    ];

    const existing = tables.rows.map(r => r.table_name);
    const missing = expected.filter(t => !existing.includes(t));

    if (missing.length > 0) {
      console.log(`\n❌ Missing tables (${missing.length}):\n`);
      missing.forEach((table, i) => {
        console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${table}`);
      });
    } else {
      console.log('\n✅ All expected tables exist!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
