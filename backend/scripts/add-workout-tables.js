// Migration: Update workout_plans table and add personal_records table
// Run this to add the necessary columns for workout plan sync and personal records

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting migration: Update workout tables...\n');

    // 1. Update workout_plans table to support plan_data JSON storage
    console.log('1. Updating workout_plans table...');

    // Add new columns if they don't exist
    const alterWorkoutPlans = `
      ALTER TABLE workout_plans
      ADD COLUMN IF NOT EXISTS plan_data JSONB,
      ADD COLUMN IF NOT EXISTS program_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS program_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `;
    await client.query(alterWorkoutPlans);
    console.log('   Added plan_data, program_id, program_name, updated_at columns');

    // Clean up duplicates before adding unique constraint
    try {
      // Delete duplicates, keeping only the most recent one per user
      await client.query(`
        DELETE FROM workout_plans a USING workout_plans b
        WHERE a.user_id = b.user_id
        AND a.created_at < b.created_at;
      `);
      console.log('   Cleaned up duplicate plans');

      // Now add unique constraint
      await client.query(`
        ALTER TABLE workout_plans
        ADD CONSTRAINT workout_plans_user_id_unique UNIQUE (user_id);
      `);
      console.log('   Added unique constraint on user_id');
    } catch (e) {
      if (e.code === '42710') {
        console.log('   Unique constraint already exists');
      } else if (e.code === '23505') {
        console.log('   Warning: Could not add unique constraint (duplicates exist)');
      } else {
        throw e;
      }
    }

    // 2. Create personal_records table
    console.log('\n2. Creating personal_records table...');

    const createPersonalRecords = `
      CREATE TABLE IF NOT EXISTS personal_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        exercise_name VARCHAR(100) NOT NULL,
        weight DECIMAL(6,2) NOT NULL,
        reps INTEGER DEFAULT 1,
        notes TEXT,
        achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, exercise_name)
      );
    `;
    await client.query(createPersonalRecords);
    console.log('   Created personal_records table');

    // Create indexes
    try {
      await client.query(`
        CREATE INDEX idx_personal_records_user ON personal_records(user_id);
      `);
      console.log('   Created index on user_id');
    } catch (e) {
      if (e.code === '42P07') {
        console.log('   Index already exists');
      } else {
        throw e;
      }
    }

    // 3. Add default record for guest user if needed
    console.log('\n3. Setting up guest user defaults...');

    // Insert default workout plan for guest user
    await client.query(`
      INSERT INTO workout_plans (id, user_id, plan_name, weekly_schedule, plan_data, program_name)
      VALUES (
        uuid_generate_v4(),
        '00000000-0000-0000-0000-000000000001',
        'Default Plan',
        '{}',
        '{}',
        'None'
      )
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log('   Guest user workout plan initialized');

    // 4. Verify tables
    console.log('\n4. Verifying tables...');

    const workoutPlansColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'workout_plans'
      ORDER BY ordinal_position;
    `);

    console.log('\nworkout_plans table columns:');
    workoutPlansColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    const personalRecordsColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'personal_records'
      ORDER BY ordinal_position;
    `);

    console.log('\npersonal_records table columns:');
    personalRecordsColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

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
