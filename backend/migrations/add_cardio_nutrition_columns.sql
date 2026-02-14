-- Add columns for separate cardio and nutrition guidance
-- Migration: add_cardio_nutrition_columns
-- Date: 2026-02-14

ALTER TABLE workout_plans
ADD COLUMN IF NOT EXISTS cardio_recommendations JSONB,
ADD COLUMN IF NOT EXISTS nutrition_guidance JSONB;

-- Add comment for documentation
COMMENT ON COLUMN workout_plans.cardio_recommendations IS 'Separate daily cardio recommendations (not included in strength training calendar)';
COMMENT ON COLUMN workout_plans.nutrition_guidance IS 'AI-generated nutrition guidance for calorie deficit and macro targets';
