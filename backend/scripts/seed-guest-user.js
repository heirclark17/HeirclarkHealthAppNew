// Seed Guest User Script
// Run this script to ensure the guest user exists in the Railway PostgreSQL database
// Usage: node backend/scripts/seed-guest-user.js

const { Pool } = require('pg');
require('dotenv').config();

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001';

async function seedGuestUser() {
  console.log('='.repeat(60));
  console.log('Heirclark Health App - Guest User Seeder');
  console.log('='.repeat(60));

  // Use DATABASE_URL from environment or .env file
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('\n❌ ERROR: DATABASE_URL not found!');
    console.error('Set the DATABASE_URL environment variable or add it to .env');
    console.error('\nExample: DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require');
    process.exit(1);
  }

  console.log('\n📡 Connecting to database...');
  console.log('   Host:', connectionString.split('@')[1]?.split('/')[0] || 'hidden');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Test connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Connected at:', testResult.rows[0].now);

    // Check if guest user exists
    console.log('\n🔍 Checking for guest user...');
    const existingUser = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [GUEST_USER_ID]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Guest user already exists:');
      console.log('   ID:', existingUser.rows[0].id);
      console.log('   Email:', existingUser.rows[0].email);
      console.log('   Name:', existingUser.rows[0].full_name);
    } else {
      // Create guest user
      console.log('📝 Creating guest user...');
      await pool.query(`
        INSERT INTO users (id, email, full_name, is_active)
        VALUES ($1, 'guest@heirclark.app', 'Guest User', true)
        ON CONFLICT (id) DO NOTHING
      `, [GUEST_USER_ID]);
      console.log('✅ Guest user created!');
    }

    // Check/create default goals
    console.log('\n🔍 Checking for default goals...');
    const existingGoals = await pool.query(
      'SELECT * FROM user_goals WHERE user_id = $1 AND is_active = true',
      [GUEST_USER_ID]
    );

    if (existingGoals.rows.length > 0) {
      console.log('✅ Default goals exist:');
      console.log('   Calories:', existingGoals.rows[0].daily_calories);
      console.log('   Protein:', existingGoals.rows[0].daily_protein, 'g');
      console.log('   Carbs:', existingGoals.rows[0].daily_carbs, 'g');
      console.log('   Fat:', existingGoals.rows[0].daily_fat, 'g');
    } else {
      // Create default goals
      console.log('📝 Creating default goals...');
      await pool.query(`
        INSERT INTO user_goals (user_id, daily_calories, daily_protein, daily_carbs, daily_fat, daily_water_oz, daily_steps, sleep_hours, is_active)
        VALUES ($1, 2000, 150, 200, 65, 64, 10000, 8, true)
      `, [GUEST_USER_ID]);
      console.log('✅ Default goals created!');
    }

    // Check/create user profile
    console.log('\n🔍 Checking for user profile...');
    const existingProfile = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [GUEST_USER_ID]
    );

    if (existingProfile.rows.length > 0) {
      console.log('✅ User profile exists');
    } else {
      console.log('📝 Creating default profile...');
      await pool.query(`
        INSERT INTO user_profiles (user_id, height_cm, weight_kg, age, sex, activity_level, goal_type)
        VALUES ($1, 175, 80, 30, 'male', 'moderate', 'maintain')
        ON CONFLICT (user_id) DO NOTHING
      `, [GUEST_USER_ID]);
      console.log('✅ Default profile created!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Guest user setup complete!');
    console.log('='.repeat(60));
    console.log('\nThe following API endpoints should now work:');
    console.log('  - POST /api/v1/user/goals');
    console.log('  - GET  /api/v1/user/goals');
    console.log('  - POST /api/v1/meals');
    console.log('  - POST /api/v1/ai/generate-meal-plan');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Database error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Cannot connect to database. Check your DATABASE_URL.');
    }
    if (error.code === '42P01') {
      console.error('   Table does not exist. Run schema.sql first.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeder
seedGuestUser();
