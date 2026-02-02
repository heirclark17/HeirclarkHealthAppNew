// Check which tables exist in Railway database
const { Pool } = require('pg');

async function checkTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking database tables...\n');

    // Get all tables in public schema
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`Found ${result.rows.length} tables:\n`);
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check critical auth tables
    const criticalAuthTables = ['users', 'user_sessions'];
    console.log('\n🔐 Auth Tables Status:');

    for (const table of criticalAuthTables) {
      const exists = result.rows.some(row => row.table_name === table);
      if (exists) {
        console.log(`  ✓ ${table} exists`);
      } else {
        console.log(`  ✗ ${table} MISSING`);
      }
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTables();
