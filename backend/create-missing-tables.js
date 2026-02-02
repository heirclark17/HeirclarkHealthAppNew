// Create missing critical tables
const { Pool } = require('pg');

async function createMissingTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connecting to Railway database...\n');

    // Enable UUID extension
    console.log('📦 Enabling UUID extension...');
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('   ✓ UUID extension enabled\n');

    // Create meals table
    console.log('📋 Creating meals table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          meal_name VARCHAR(255) NOT NULL,
          meal_type VARCHAR(20) NOT NULL,
          calories INTEGER DEFAULT 0,
          protein DECIMAL(6,2) DEFAULT 0,
          carbs DECIMAL(6,2) DEFAULT 0,
          fat DECIMAL(6,2) DEFAULT 0,
          fiber DECIMAL(6,2) DEFAULT 0,
          sodium DECIMAL(8,2) DEFAULT 0,
          logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          photo_url TEXT,
          notes TEXT,
          source VARCHAR(20) DEFAULT 'manual',
          confidence VARCHAR(10) DEFAULT 'medium',
          is_favorite BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('   ✓ meals table created');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_meals_user ON meals(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(logged_at)`);
    console.log('   ✓ meals indexes created\n');

    // Create weight_logs table
    console.log('⚖️  Creating weight_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weight_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          weight DECIMAL(5,2) NOT NULL,
          unit VARCHAR(5) DEFAULT 'lbs',
          body_fat_percent DECIMAL(4,1),
          logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          source VARCHAR(20) DEFAULT 'manual',
          notes TEXT
      )
    `);
    console.log('   ✓ weight_logs table created');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_weight_user ON weight_logs(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_logs(logged_at)`);
    console.log('   ✓ weight_logs indexes created\n');

    // Create step_logs table
    console.log('👟 Creating step_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS step_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          steps INTEGER DEFAULT 0,
          distance_km DECIMAL(6,2),
          active_minutes INTEGER,
          source VARCHAR(20) DEFAULT 'manual',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, date)
      )
    `);
    console.log('   ✓ step_logs table created');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_steps_user ON step_logs(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_steps_date ON step_logs(date)`);
    console.log('   ✓ step_logs indexes created\n');

    console.log('✅ All missing tables created successfully!');
    console.log('\n🎉 Your Railway backend should now work properly!');
    console.log('   - Meals can be saved');
    console.log('   - Weight logs can be tracked');
    console.log('   - Steps can be synced');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createMissingTables();
