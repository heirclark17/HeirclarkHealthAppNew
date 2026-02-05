/**
 * Migration: Add available_equipment and injuries columns to user_preferences table
 *
 * Run with: node backend/scripts/add-equipment-injuries-columns.js
 * Or with Railway: DATABASE_URL="postgresql://..." node backend/scripts/add-equipment-injuries-columns.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function migrate() {
  // Use DATABASE_URL from environment or .env file
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: DATABASE_URL not set. Please provide it as an environment variable.');
    console.log('Usage: DATABASE_URL="postgresql://..." node backend/scripts/add-equipment-injuries-columns.js');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('railway') || connectionString.includes('neon')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    console.log('Connecting to database...');

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Connected successfully!');

    // Check if columns already exist
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_preferences'
      AND column_name IN ('available_equipment', 'injuries')
    `);

    const existingColumns = checkResult.rows.map(r => r.column_name);
    console.log('Existing columns:', existingColumns);

    // Add available_equipment column if it doesn't exist
    if (!existingColumns.includes('available_equipment')) {
      console.log('Adding available_equipment column...');
      await pool.query(`
        ALTER TABLE user_preferences
        ADD COLUMN available_equipment TEXT[] DEFAULT ARRAY['bodyweight']
      `);
      console.log('✅ Added available_equipment column');
    } else {
      console.log('⏩ available_equipment column already exists');
    }

    // Add injuries column if it doesn't exist
    if (!existingColumns.includes('injuries')) {
      console.log('Adding injuries column...');
      await pool.query(`
        ALTER TABLE user_preferences
        ADD COLUMN injuries TEXT[] DEFAULT ARRAY[]::TEXT[]
      `);
      console.log('✅ Added injuries column');
    } else {
      console.log('⏩ injuries column already exists');
    }

    // Verify columns were added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_preferences'
      AND column_name IN ('available_equipment', 'injuries')
    `);

    console.log('\nFinal column state:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
