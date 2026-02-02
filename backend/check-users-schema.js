// Check users table schema
const { Pool } = require('pg');

async function checkUsersSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking users table schema...\n');

    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('Users table columns:');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(30)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check for required columns
    const requiredCols = ['id', 'email', 'apple_id', 'full_name', 'avatar_url', 'created_at', 'updated_at'];
    console.log('\n✅ Required columns:');

    requiredCols.forEach(col => {
      const exists = result.rows.some(row => row.column_name === col);
      console.log(`  ${exists ? '✓' : '✗'} ${col}`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkUsersSchema();
