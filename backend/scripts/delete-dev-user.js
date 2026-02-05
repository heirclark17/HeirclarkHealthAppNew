/**
 * Delete Dev User Script
 * This script deletes the development user account so you can sign in fresh with production Apple ID
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function deleteDevUser() {
  try {
    console.log('[Delete Dev User] Connecting to database...');

    // Find all users with dev email
    const devUsers = await pool.query(
      `SELECT id, apple_id, email, full_name, created_at
       FROM users
       WHERE email LIKE '%dev%heirclark%' OR email = 'dev@heirclark.com'`
    );

    if (devUsers.rows.length === 0) {
      console.log('[Delete Dev User] No dev users found');
      return;
    }

    console.log(`[Delete Dev User] Found ${devUsers.rows.length} dev user(s):`);
    devUsers.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Apple ID: ${user.apple_id || 'None'}`);
      console.log(`     Full Name: ${user.full_name || 'None'}`);
      console.log(`     Created: ${user.created_at}`);
      console.log('');
    });

    console.log('[Delete Dev User] Deleting users and all related data...');

    for (const user of devUsers.rows) {
      // Delete in correct order due to foreign keys
      await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [user.id]);
      await pool.query('DELETE FROM user_goals WHERE user_id = $1', [user.id]);
      await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [user.id]);
      await pool.query('DELETE FROM meals WHERE user_id = $1', [user.id]);
      await pool.query('DELETE FROM health_metrics WHERE user_id = $1', [user.id]);
      await pool.query('DELETE FROM habits WHERE user_id = $1', [user.id]);
      await pool.query('DELETE FROM fasting_sessions WHERE user_id = $1', [user.id]);
      await pool.query('DELETE FROM users WHERE id = $1', [user.id]);

      console.log(`✅ Deleted user ${user.email} (ID: ${user.id})`);
    }

    console.log('[Delete Dev User] ✅ All dev users deleted successfully!');
    console.log('[Delete Dev User] You can now sign in with your production Apple ID to create a fresh account');

  } catch (error) {
    console.error('[Delete Dev User] Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
deleteDevUser()
  .then(() => {
    console.log('[Delete Dev User] Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('[Delete Dev User] Script failed:', error);
    process.exit(1);
  });
