-- Heirclark Health App - PostgreSQL Database Schema
-- Run this against your Railway PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    apple_id VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);

-- ============================================
-- USER PROFILE & GOALS
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    age INTEGER,
    sex VARCHAR(10),
    activity_level VARCHAR(20) DEFAULT 'moderate',
    goal_type VARCHAR(20) DEFAULT 'maintain',
    target_weight_kg DECIMAL(5,2),
    target_date DATE,
    timezone VARCHAR(50) DEFAULT 'America/Chicago',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    daily_calories INTEGER DEFAULT 2000,
    daily_protein INTEGER DEFAULT 150,
    daily_carbs INTEGER DEFAULT 200,
    daily_fat INTEGER DEFAULT 65,
    daily_water_oz INTEGER DEFAULT 64,
    daily_steps INTEGER DEFAULT 10000,
    sleep_hours DECIMAL(3,1) DEFAULT 8.0,
    workout_days_per_week INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_goals_user ON user_goals(user_id);

-- ============================================
-- MEALS & NUTRITION
-- ============================================

CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(20) NOT NULL, -- breakfast, lunch, dinner, snack
    calories INTEGER DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    fiber DECIMAL(6,2) DEFAULT 0,
    sodium DECIMAL(8,2) DEFAULT 0,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    photo_url TEXT,
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual', -- manual, photo, voice, barcode
    confidence VARCHAR(10) DEFAULT 'medium',
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meals_user ON meals(user_id);
CREATE INDEX idx_meals_date ON meals(logged_at);
CREATE INDEX idx_meals_type ON meals(meal_type);
CREATE INDEX idx_meals_favorite ON meals(user_id, is_favorite) WHERE is_favorite = true;

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

CREATE INDEX idx_meal_foods_meal ON meal_foods(meal_id);

-- ============================================
-- SAVED MEALS (Favorites/Templates)
-- ============================================

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

CREATE INDEX idx_saved_meals_user ON saved_meals(user_id);
CREATE INDEX idx_saved_meals_tags ON saved_meals USING GIN(tags);

-- ============================================
-- MEAL PLANS
-- ============================================

CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    daily_plans JSONB NOT NULL, -- Array of 7 days with meals
    generated_by VARCHAR(20) DEFAULT 'ai', -- ai, manual
    total_calories INTEGER,
    total_protein INTEGER,
    diet_style VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_week ON meal_plans(week_start_date);

-- ============================================
-- WORKOUTS & TRAINING
-- ============================================

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

CREATE INDEX idx_workout_plans_user ON workout_plans(user_id);

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

CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(started_at);

-- ============================================
-- HEALTH METRICS
-- ============================================

CREATE TABLE IF NOT EXISTS weight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    unit VARCHAR(5) DEFAULT 'lbs',
    body_fat_percent DECIMAL(4,1),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(20) DEFAULT 'manual',
    notes TEXT
);

CREATE INDEX idx_weight_user ON weight_logs(user_id);
CREATE INDEX idx_weight_date ON weight_logs(logged_at);

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

CREATE INDEX idx_calorie_user ON calorie_logs(user_id);
CREATE INDEX idx_calorie_date ON calorie_logs(date);

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
);

CREATE INDEX idx_steps_user ON step_logs(user_id);
CREATE INDEX idx_steps_date ON step_logs(date);

-- ============================================
-- HYDRATION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount_oz DECIMAL(6,2) NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(20) DEFAULT 'manual'
);

CREATE INDEX idx_hydration_user ON hydration_logs(user_id);
CREATE INDEX idx_hydration_date ON hydration_logs(date);

-- ============================================
-- SLEEP TRACKING
-- ============================================

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

CREATE INDEX idx_sleep_user ON sleep_logs(user_id);
CREATE INDEX idx_sleep_date ON sleep_logs(date);

-- ============================================
-- HABIT TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    habit_name VARCHAR(255) NOT NULL,
    habit_type VARCHAR(50),
    frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly
    target_value INTEGER DEFAULT 1,
    unit VARCHAR(50),
    reminder_time TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_habits_user ON habits(user_id);

CREATE TABLE IF NOT EXISTS habit_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value INTEGER DEFAULT 1,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, date)
);

CREATE INDEX idx_habit_completions_habit ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(date);

-- ============================================
-- CALORIE BANKING
-- ============================================

CREATE TABLE IF NOT EXISTS calorie_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    banked_calories INTEGER DEFAULT 0, -- positive = surplus saved, negative = borrowed
    running_balance INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_calorie_bank_user ON calorie_bank(user_id);
CREATE INDEX idx_calorie_bank_date ON calorie_bank(date);

-- ============================================
-- FASTING TRACKING
-- ============================================

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

CREATE INDEX idx_fasting_user ON fasting_sessions(user_id);
CREATE INDEX idx_fasting_date ON fasting_sessions(started_at);

-- ============================================
-- ADAPTIVE TDEE DATA
-- ============================================

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

CREATE INDEX idx_tdee_user ON tdee_calculations(user_id);
CREATE INDEX idx_tdee_date ON tdee_calculations(calculated_at);

-- ============================================
-- AI COACH CONVERSATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS coach_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_type VARCHAR(50), -- meal_plan, workout, general, accountability
    messages JSONB DEFAULT '[]',
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coach_user ON coach_conversations(user_id);
CREATE INDEX idx_coach_type ON coach_conversations(conversation_type);

-- ============================================
-- ACCOUNTABILITY PARTNERS
-- ============================================

CREATE TABLE IF NOT EXISTS accountability_partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    partner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, declined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, partner_user_id)
);

CREATE INDEX idx_partnerships_user ON accountability_partnerships(user_id);
CREATE INDEX idx_partnerships_partner ON accountability_partnerships(partner_user_id);

-- ============================================
-- PROGRESS PREDICTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS progress_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50), -- weight, strength, habit
    target_metric VARCHAR(100),
    current_value DECIMAL(10,2),
    target_value DECIMAL(10,2),
    predicted_date DATE,
    confidence DECIMAL(4,2),
    factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_predictions_user ON progress_predictions(user_id);

-- ============================================
-- RESTAURANT ANALYSIS
-- ============================================

CREATE TABLE IF NOT EXISTS restaurant_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    restaurant_name VARCHAR(255),
    menu_items JSONB,
    recommendations JSONB,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_restaurant_user ON restaurant_analyses(user_id);

-- ============================================
-- DEVICE CONNECTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS connected_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- apple_health, fitbit, google_fit, garmin
    provider_user_id VARCHAR(255),
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active',
    data_types TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_devices_user ON connected_devices(user_id);
CREATE INDEX idx_devices_provider ON connected_devices(provider);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_conversations_updated_at
    BEFORE UPDATE ON coach_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Daily nutrition summary view
CREATE OR REPLACE VIEW daily_nutrition_summary AS
SELECT
    user_id,
    DATE(logged_at) as date,
    COUNT(*) as meal_count,
    SUM(calories) as total_calories,
    SUM(protein) as total_protein,
    SUM(carbs) as total_carbs,
    SUM(fat) as total_fat
FROM meals
GROUP BY user_id, DATE(logged_at);

-- Weekly progress view
CREATE OR REPLACE VIEW weekly_progress AS
SELECT
    w.user_id,
    DATE_TRUNC('week', w.logged_at) as week_start,
    AVG(w.weight) as avg_weight,
    MIN(w.weight) as min_weight,
    MAX(w.weight) as max_weight,
    COUNT(w.*) as weigh_ins
FROM weight_logs w
GROUP BY w.user_id, DATE_TRUNC('week', w.logged_at);

-- Habit streaks view
CREATE OR REPLACE VIEW habit_streaks AS
WITH consecutive_days AS (
    SELECT
        habit_id,
        date,
        date - ROW_NUMBER() OVER (PARTITION BY habit_id ORDER BY date)::INTEGER AS streak_group
    FROM habit_completions
)
SELECT
    habit_id,
    MAX(streak_group) as current_streak_start,
    COUNT(*) as streak_length
FROM consecutive_days
GROUP BY habit_id, streak_group
ORDER BY habit_id, streak_group DESC;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert test guest user
INSERT INTO users (id, email, full_name, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'guest@heirclark.app',
    'Guest User',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert default goals for guest
INSERT INTO user_goals (user_id, daily_calories, daily_protein, daily_carbs, daily_fat)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    2000, 150, 200, 65
) ON CONFLICT DO NOTHING;

-- Grant SELECT to readonly role if exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'readonly') THEN
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
    END IF;
END
$$;

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Heirclark Health App database schema created successfully!';
    RAISE NOTICE 'Tables created: 23';
    RAISE NOTICE 'Indexes created: 30+';
    RAISE NOTICE 'Views created: 3';
    RAISE NOTICE 'Triggers created: 5';
END
$$;
