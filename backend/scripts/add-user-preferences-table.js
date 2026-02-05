// Migration: Add user_preferences table
// Run this to add the user preferences table for storing workout/diet preferences

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting migration: Add user_preferences table...\n');

    // Check if table already exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_preferences'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('Table user_preferences already exists. Checking for missing columns...');

      // Add any missing columns
      const addColumnsSql = `
        ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS cardio_preference VARCHAR(20) DEFAULT 'walking',
        ADD COLUMN IF NOT EXISTS fitness_level VARCHAR(20) DEFAULT 'intermediate',
        ADD COLUMN IF NOT EXISTS workout_duration INTEGER DEFAULT 30,
        ADD COLUMN IF NOT EXISTS workouts_per_week INTEGER DEFAULT 3,
        ADD COLUMN IF NOT EXISTS diet_style VARCHAR(20) DEFAULT 'standard',
        ADD COLUMN IF NOT EXISTS meals_per_day INTEGER DEFAULT 3,
        ADD COLUMN IF NOT EXISTS intermittent_fasting BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS fasting_start VARCHAR(5) DEFAULT '12:00',
        ADD COLUMN IF NOT EXISTS fasting_end VARCHAR(5) DEFAULT '20:00',
        ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS water_goal_oz INTEGER DEFAULT 64,
        ADD COLUMN IF NOT EXISTS sleep_goal_hours DECIMAL(3,1) DEFAULT 8.0,
        ADD COLUMN IF NOT EXISTS step_goal INTEGER DEFAULT 10000;
      `;

      await client.query(addColumnsSql);
      console.log('Added any missing columns to user_preferences');
    } else {
      // Create the table
      const createTableSql = `
        CREATE TABLE user_preferences (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          -- Workout preferences
          cardio_preference VARCHAR(20) DEFAULT 'walking',
          fitness_level VARCHAR(20) DEFAULT 'intermediate',
          workout_duration INTEGER DEFAULT 30,
          workouts_per_week INTEGER DEFAULT 3,
          -- Diet preferences
          diet_style VARCHAR(20) DEFAULT 'standard',
          meals_per_day INTEGER DEFAULT 3,
          intermittent_fasting BOOLEAN DEFAULT false,
          fasting_start VARCHAR(5) DEFAULT '12:00',
          fasting_end VARCHAR(5) DEFAULT '20:00',
          allergies TEXT[] DEFAULT '{}',
          -- Customizable daily goals
          water_goal_oz INTEGER DEFAULT 64,
          sleep_goal_hours DECIMAL(3,1) DEFAULT 8.0,
          step_goal INTEGER DEFAULT 10000,
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      await client.query(createTableSql);
      console.log('Created user_preferences table');

      // Create trigger for updated_at
      const triggerSql = `
        CREATE TRIGGER update_user_preferences_updated_at
          BEFORE UPDATE ON user_preferences
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;

      try {
        await client.query(triggerSql);
        console.log('Created updated_at trigger');
      } catch (triggerErr) {
        if (triggerErr.code === '42710') {
          console.log('Trigger already exists');
        } else {
          throw triggerErr;
        }
      }
    }

    // Create default preferences for guest user
    const insertGuestSql = `
      INSERT INTO user_preferences (user_id)
      VALUES ('00000000-0000-0000-0000-000000000001')
      ON CONFLICT (user_id) DO NOTHING;
    `;
    await client.query(insertGuestSql);
    console.log('Created default preferences for guest user');

    // Verify the table
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_preferences'
      ORDER BY ordinal_position;
    `);

    console.log('\nuser_preferences table columns:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
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
