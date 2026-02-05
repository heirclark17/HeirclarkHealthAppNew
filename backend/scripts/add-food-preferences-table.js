// Migration: Add Food Preferences Table
// Run this script to create the food_preferences table for backend sync

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createFoodPreferencesTable() {
  console.log('Creating food_preferences table...');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS food_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        -- Dietary preferences
        dietary_preferences TEXT[] DEFAULT '{}',
        -- Allergens
        allergens TEXT[] DEFAULT '{}',
        -- Favorite foods by category
        favorite_cuisines TEXT[] DEFAULT '{}',
        favorite_proteins TEXT[] DEFAULT '{}',
        favorite_vegetables TEXT[] DEFAULT '{}',
        favorite_fruits TEXT[] DEFAULT '{}',
        favorite_starches TEXT[] DEFAULT '{}',
        favorite_snacks TEXT[] DEFAULT '{}',
        -- Disliked/hated foods (critical for meal generation)
        hated_foods TEXT DEFAULT '',
        -- Meal structure preferences
        meal_style VARCHAR(20) DEFAULT '', -- threePlusSnacks, fewerLarger
        meal_diversity VARCHAR(20) DEFAULT '', -- diverse, sameDaily
        cheat_days TEXT[] DEFAULT '{}',
        -- Cooking preferences
        cooking_skill VARCHAR(20) DEFAULT '', -- beginner, intermediate, advanced
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ food_preferences table created');

    // Create trigger for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_food_preferences_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_food_preferences_updated_at ON food_preferences;
      CREATE TRIGGER update_food_preferences_updated_at
        BEFORE UPDATE ON food_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_food_preferences_updated_at();
    `);
    console.log('✅ Updated_at trigger created');

    // Create index for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_food_preferences_user ON food_preferences(user_id);
    `);
    console.log('✅ Index created');

    console.log('\n✅ Food preferences table migration complete!');
  } catch (error) {
    console.error('❌ Error creating food_preferences table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createFoodPreferencesTable();
