// Check user_profiles table schema
const { Pool } = require('pg');

async function checkProfileSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking user_profiles table schema...\n');

    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);

    console.log('user_profiles table columns:');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type}`);
    });

    // Check for required columns
    const requiredCols = [
      'user_id',
      'height_cm',
      'weight_kg',
      'age',
      'sex',
      'activity_level',
      'goal_type',
      'target_weight_kg',
      'target_date',
      'timezone'
    ];

    console.log('\n✅ Required columns for profile update:');
    const missing = [];

    requiredCols.forEach(col => {
      const exists = result.rows.some(row => row.column_name === col);
      console.log(`  ${exists ? '✓' : '✗'} ${col}`);
      if (!exists) missing.push(col);
    });

    if (missing.length > 0) {
      console.log(`\n⚠️  Missing columns: ${missing.join(', ')}`);
    } else {
      console.log('\n✅ All required columns exist!');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkProfileSchema();
