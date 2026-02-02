#!/usr/bin/env node
/**
 * Check which tables are missing in Railway PostgreSQL
 * Run: node backend/scripts/check-missing-tables.js
 */

const { Pool } = require('pg');

// Expected tables from schema.sql
const EXPECTED_TABLES = [
  'users',
  'user_sessions',
  'user_profiles',
  'user_goals',
  'meals',
  'meal_foods',
  'saved_meals',
  'meal_plans',
  'workout_plans',
  'workout_sessions',
  'weight_logs',
  'calorie_logs',
  'step_logs',
  'hydration_logs',
  'sleep_logs',
  'habits',
  'habit_completions',
  'calorie_bank',
  'fasting_sessions',
  'tdee_calculations',
  'coach_conversations',
  'accountability_partnerships',
  'progress_predictions',
  'restaurant_analyses',
  'connected_devices',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkMissingTables() {
  console.log('🔍 Checking Railway PostgreSQL database...\n');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    // Get existing tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `);

    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = EXPECTED_TABLES.filter(table => !existingTables.includes(table));

    console.log(`📊 Expected tables: ${EXPECTED_TABLES.length}`);
    console.log(`✅ Existing tables: ${existingTables.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}\n`);

    if (missingTables.length > 0) {
      console.log('🚨 MISSING TABLES:\n');
      missingTables.forEach((table, index) => {
        console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${table}`);
      });
      console.log('\n💡 Run: node backend/scripts/apply-schema-to-railway.js\n');
      process.exit(1);
    } else {
      console.log('✅ All tables exist! Database is ready.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkMissingTables();
