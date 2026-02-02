#!/usr/bin/env node
/**
 * Apply database schema to Railway PostgreSQL
 * This version reads the full DATABASE_URL from process.env
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function applySchema() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.error('Run with: railway run node backend/scripts/apply-schema-railway-direct.js');
    process.exit(1);
  }

  console.log('🔍 Connecting to Railway PostgreSQL...');
  console.log('📍 Using DATABASE_URL from Railway environment\n');

  const client = new Client({
    connectionString: dbUrl,
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

    console.log('📄 Applying schema...\n');

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

    console.log(`📊 Created ${result.rows.length} tables:\n`);
    result.rows.forEach((row, index) => {
      console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${row.table_name}`);
    });

    console.log('\n✅ All done! Database is ready.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
