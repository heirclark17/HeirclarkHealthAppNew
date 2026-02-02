#!/usr/bin/env node
/**
 * Apply database schema to Railway PostgreSQL
 * Run: node backend/scripts/apply-schema-to-railway.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Railway database connection (from environment variables)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applySchema() {
  console.log('🔍 Connecting to Railway PostgreSQL database...\n');

  try {
    // Test connection
    const testQuery = await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully at:', testQuery.rows[0].now);
    console.log('');

    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Found schema.sql with', schemaSql.split('\n').length, 'lines\n');
    console.log('🚀 Applying schema to database...\n');

    // Execute schema
    await pool.query(schemaSql);

    console.log('✅ Schema applied successfully!\n');

    // Verify tables exist
    const tablesQuery = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📊 Database now contains ${tablesQuery.rows.length} tables:\n`);
    tablesQuery.rows.forEach((row, index) => {
      console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${row.table_name}`);
    });

    console.log('\n✅ All done! Your database is ready.\n');
  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  applySchema();
}

module.exports = { applySchema };
