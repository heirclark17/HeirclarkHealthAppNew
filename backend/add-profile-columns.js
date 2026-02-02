// Add missing columns to user_profiles table
const { Pool } = require('pg');

async function addProfileColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Adding missing columns to user_profiles table...\n');

    // Add target_weight_kg column
    await pool.query(`
      ALTER TABLE user_profiles
      ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(5,2)
    `);
    console.log('✅ target_weight_kg column added');

    // Add target_date column
    await pool.query(`
      ALTER TABLE user_profiles
      ADD COLUMN IF NOT EXISTS target_date DATE
    `);
    console.log('✅ target_date column added');

    // Add timezone column
    await pool.query(`
      ALTER TABLE user_profiles
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Chicago'
    `);
    console.log('✅ timezone column added');

    // Verify all columns exist
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_profiles'
      AND column_name IN ('target_weight_kg', 'target_date', 'timezone')
      ORDER BY column_name
    `);

    console.log('\n✅ Verification:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} exists`);
    });

    console.log('\n🎉 Profile updates will now work!');
    console.log('   Weight goal data can be saved.');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addProfileColumns();
