// Add last_login column to users table
const { Pool } = require('pg');

async function addLastLogin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Adding last_login column to users table...\n');

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE
    `);
    console.log('✅ last_login column added');

    // Verify
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'last_login'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verified: last_login column exists');
    }

    console.log('\n🎉 Apple Sign In should now work!');
    console.log('   Try signing in again.');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addLastLogin();
