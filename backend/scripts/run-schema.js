// Run Schema Script
// Usage: DATABASE_URL=... node backend/scripts/run-schema.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSchema() {
  console.log('='.repeat(60));
  console.log('Heirclark Health App - Schema Runner');
  console.log('='.repeat(60));

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('\n❌ ERROR: DATABASE_URL not found!');
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

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    console.log('\n📄 Reading schema from:', schemaPath);

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('   Schema size:', Math.round(schema.length / 1024), 'KB');

    // Run schema
    console.log('\n🚀 Running schema...');
    await pool.query(schema);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Schema executed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Database error:', error.message);
    if (error.position) {
      console.error('   Error at position:', error.position);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSchema();
