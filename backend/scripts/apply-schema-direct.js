#!/usr/bin/env node
/**
 * Apply database schema with direct URL
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = process.argv[2];

if (!DATABASE_URL) {
  console.error('Usage: node apply-schema-direct.js <DATABASE_URL>');
  process.exit(1);
}

async function applySchema() {
  console.log('🔍 Connecting to Railway PostgreSQL...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Applying schema (589 lines)...\n');

    // Execute schema
    await client.query(schemaSql);

    console.log('✅ Schema applied successfully!\n');

    // Verify tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📊 Database now contains ${result.rows.length} tables:\n`);
    result.rows.forEach((row, index) => {
      console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${row.table_name}`);
    });

    console.log('\n🎉 All done! Your database is ready.\n');
    console.log('Next step: Restart your Railway backend service\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
