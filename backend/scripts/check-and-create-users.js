// Check and Create Users Table
// Usage: DATABASE_URL=... node backend/scripts/check-and-create-users.js

const { Pool } = require('pg');
require('dotenv').config();

async function checkAndCreateUsers() {
  console.log('='.repeat(60));
  console.log('Heirclark Health App - Users Table Check/Create');
  console.log('='.repeat(60));

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('\n❌ ERROR: DATABASE_URL not found!');
    process.exit(1);
  }

  console.log('\n📡 Connecting to database...');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected');

    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table already exists');
    } else {
      console.log('📝 Creating users table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE,
          full_name VARCHAR(255),
          avatar_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Users table created');
    }

    // Check if user_goals table exists
    const goalsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_goals'
      );
    `);

    if (goalsCheck.rows[0].exists) {
      console.log('✅ User_goals table already exists');
    } else {
      console.log('📝 Creating user_goals table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_goals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          daily_calories INTEGER DEFAULT 2000,
          daily_protein INTEGER DEFAULT 150,
          daily_carbs INTEGER DEFAULT 200,
          daily_fat INTEGER DEFAULT 65,
          daily_water_oz INTEGER DEFAULT 64,
          daily_steps INTEGER DEFAULT 10000,
          sleep_hours DECIMAL(3,1) DEFAULT 8.0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ User_goals table created');
    }

    // Check if user_profiles table exists
    const profilesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
      );
    `);

    if (profilesCheck.rows[0].exists) {
      console.log('✅ User_profiles table already exists');
    } else {
      console.log('📝 Creating user_profiles table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          height_cm DECIMAL(5,2),
          weight_kg DECIMAL(5,2),
          age INTEGER,
          sex VARCHAR(20),
          activity_level VARCHAR(50),
          goal_type VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ User_profiles table created');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All required tables exist!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Database error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkAndCreateUsers();
