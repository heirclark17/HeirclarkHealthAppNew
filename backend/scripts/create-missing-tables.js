#!/usr/bin/env node
/**
 * Create only the missing tables
 */

const { Client } = require('pg');

const DATABASE_URL = process.argv[2];

const MISSING_TABLES_SQL = `
-- Create missing tables only

-- Meal Foods (component foods in a meal)
CREATE TABLE IF NOT EXISTS meal_foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
    food_name VARCHAR(255) NOT NULL,
    portion VARCHAR(100),
    calories INTEGER DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_meal_foods_meal ON meal_foods(meal_id);

-- Saved Meals (favorites/templates)
CREATE TABLE IF NOT EXISTS saved_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(20),
    calories INTEGER DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    ingredients JSONB DEFAULT '[]',
    recipe TEXT,
    prep_time_minutes INTEGER,
    photo_url TEXT,
    tags TEXT[],
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_meals_user ON saved_meals(user_id);

-- Meal Plans (AI-generated weekly plans)
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    daily_plans JSONB NOT NULL,
    generated_by VARCHAR(20) DEFAULT 'ai',
    total_calories INTEGER,
    total_protein INTEGER,
    diet_style VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week ON meal_plans(week_start_date);

-- Workout Plans (AI-generated training programs)
CREATE TABLE IF NOT EXISTS workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(255) NOT NULL,
    description TEXT,
    weekly_schedule JSONB NOT NULL,
    goal_type VARCHAR(50),
    difficulty_level VARCHAR(20),
    duration_weeks INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id);

-- Workout Sessions (completed workouts)
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    session_name VARCHAR(255),
    exercises JSONB NOT NULL,
    duration_minutes INTEGER,
    calories_burned INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(started_at);

-- Calorie Logs
CREATE TABLE IF NOT EXISTS calorie_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    calories_consumed INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    net_calories INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_calorie_user ON calorie_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_calorie_date ON calorie_logs(date);

-- Hydration Logs
CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount_oz DECIMAL(6,2) NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(20) DEFAULT 'manual'
);
CREATE INDEX IF NOT EXISTS idx_hydration_user ON hydration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_hydration_date ON hydration_logs(date);

-- Sleep Logs
CREATE TABLE IF NOT EXISTS sleep_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    bed_time TIMESTAMP WITH TIME ZONE,
    wake_time TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(4,2),
    deep_sleep_hours DECIMAL(4,2),
    rem_sleep_hours DECIMAL(4,2),
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 100),
    source VARCHAR(20) DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_sleep_user ON sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_date ON sleep_logs(date);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    habit_name VARCHAR(255) NOT NULL,
    habit_type VARCHAR(50),
    frequency VARCHAR(20) DEFAULT 'daily',
    target_value INTEGER DEFAULT 1,
    unit VARCHAR(50),
    reminder_time TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);

-- Habit Completions
CREATE TABLE IF NOT EXISTS habit_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value INTEGER DEFAULT 1,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, date)
);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(date);

-- Calorie Bank
CREATE TABLE IF NOT EXISTS calorie_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    banked_calories INTEGER DEFAULT 0,
    running_balance INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_calorie_bank_user ON calorie_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_calorie_bank_date ON calorie_bank(date);

-- Fasting Sessions
CREATE TABLE IF NOT EXISTS fasting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fasting_type VARCHAR(20) DEFAULT '16:8',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    target_end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_end_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fasting_user ON fasting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_date ON fasting_sessions(started_at);

-- TDEE Calculations
CREATE TABLE IF NOT EXISTS tdee_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    adaptive_tdee INTEGER NOT NULL,
    formula_tdee INTEGER NOT NULL,
    difference INTEGER,
    difference_percent DECIMAL(5,2),
    confidence VARCHAR(10),
    confidence_score INTEGER,
    data_points INTEGER,
    recommended_calories INTEGER,
    metabolism_trend VARCHAR(20),
    weekly_history JSONB,
    insights TEXT[]
);
CREATE INDEX IF NOT EXISTS idx_tdee_user ON tdee_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_tdee_date ON tdee_calculations(calculated_at);

-- Coach Conversations
CREATE TABLE IF NOT EXISTS coach_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_type VARCHAR(50),
    messages JSONB DEFAULT '[]',
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coach_user ON coach_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_type ON coach_conversations(conversation_type);

-- Accountability Partnerships
CREATE TABLE IF NOT EXISTS accountability_partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    partner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, partner_user_id)
);
CREATE INDEX IF NOT EXISTS idx_partnerships_user ON accountability_partnerships(user_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_partner ON accountability_partnerships(partner_user_id);

-- Progress Predictions
CREATE TABLE IF NOT EXISTS progress_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50),
    target_metric VARCHAR(100),
    current_value DECIMAL(10,2),
    target_value DECIMAL(10,2),
    predicted_date DATE,
    confidence DECIMAL(4,2),
    factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON progress_predictions(user_id);

-- Restaurant Analyses
CREATE TABLE IF NOT EXISTS restaurant_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    restaurant_name VARCHAR(255),
    menu_items JSONB,
    recommendations JSONB,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_restaurant_user ON restaurant_analyses(user_id);

-- Connected Devices
CREATE TABLE IF NOT EXISTS connected_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255),
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active',
    data_types TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_devices_user ON connected_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_provider ON connected_devices(provider);

-- Update triggers for tables with updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coach_conversations_updated_at ON coach_conversations;
CREATE TRIGGER update_coach_conversations_updated_at
    BEFORE UPDATE ON coach_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function createMissingTables() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL\n');
    console.log('📄 Creating 18 missing tables...\n');

    await client.query(MISSING_TABLES_SQL);

    console.log('✅ All missing tables created successfully!\n');

    // Verify
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name IN (
          'meal_foods', 'saved_meals', 'meal_plans', 'workout_plans', 'workout_sessions',
          'calorie_logs', 'hydration_logs', 'sleep_logs', 'habits', 'habit_completions',
          'calorie_bank', 'fasting_sessions', 'tdee_calculations', 'coach_conversations',
          'accountability_partnerships', 'progress_predictions', 'restaurant_analyses', 'connected_devices'
        )
      ORDER BY table_name;
    `);

    console.log(`✅ Verified ${result.rows.length}/18 tables created:\n`);
    result.rows.forEach((row, i) => {
      console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${row.table_name}`);
    });

    console.log('\n🎉 Database is now complete!\n');
    console.log('Next step: Restart your Railway backend\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createMissingTables();
