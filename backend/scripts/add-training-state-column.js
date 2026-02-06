// Migration: Add training_state column to workout_plans table
// Run this to enable storing weekly stats, goal alignment, and plan summary

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting migration: Add training_state column...\n');

    // Add training_state JSONB column
    console.log('1. Adding training_state column to workout_plans...');
    await client.query(`
      ALTER TABLE workout_plans
      ADD COLUMN IF NOT EXISTS training_state JSONB DEFAULT '{}';
    `);
    console.log('   ✅ training_state column added');

    // Verify the column was added
    console.log('\n2. Verifying column...');
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'workout_plans' AND column_name = 'training_state';
    `);

    if (result.rows.length > 0) {
      console.log(`   ✅ Column verified: ${result.rows[0].column_name} (${result.rows[0].data_type})`);
    } else {
      console.log('   ⚠️  Column not found - migration may have failed');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
