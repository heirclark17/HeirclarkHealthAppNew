// Create user_sessions table for authentication
const { Pool } = require('pg');

async function createUserSessions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔐 Creating user_sessions table...\n');

    // Enable UUID extension if not already enabled
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(255) NOT NULL,
          device_info JSONB,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ user_sessions table created');

    // Create indexes for performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash)`);
    console.log('✅ Indexes created');

    console.log('\n🎉 Authentication tables ready!');
    console.log('   You can now sign in with Apple');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createUserSessions();
