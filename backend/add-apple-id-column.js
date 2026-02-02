// Add apple_id column to users table
const { Pool } = require('pg');

async function addAppleIdColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Adding apple_id column to users table...\n');

    // Add apple_id column if it doesn't exist
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255) UNIQUE
    `);
    console.log('✅ apple_id column added');

    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'apple_id'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verified: apple_id column exists');
      console.log(`   Type: ${result.rows[0].data_type}(${result.rows[0].character_maximum_length})`);
    }

    console.log('\n🎉 Apple Sign In is now ready to use!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addAppleIdColumn();
