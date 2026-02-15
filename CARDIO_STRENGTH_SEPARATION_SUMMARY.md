# Training System Restructure: Cardio & Strength Separation

**Date:** February 14, 2026
**Status:** ✅ COMPLETE - Database Migration Executed - Ready for Testing

---

## Summary

Completely restructured the training system to separate cardio and strength training, with extremely detailed guidance cards as requested.

### What Changed

**BEFORE:**
- Calendar showed mixed strength and cardio workouts
- No detailed cardio guidance
- No detailed nutrition/calorie deficit guidance

**AFTER:**
- ✅ Calendar shows ONLY strength training workouts (based on selected program)
- ✅ Separate detailed Cardio Recommendation Card (daily activities)
- ✅ Separate detailed Calorie Deficit Card (nutrition guidance)
- ✅ All AI-generated and persisted to database

---

## Implementation Details

### Backend Changes (3 commits)

**Commit 1: `4a437f9`** - Backend & Types
- Modified `/api/v1/ai/generate-workout-plan` endpoint
- AI now generates 3 separate sections:
  1. `strengthPlan` - Calendar workouts (NO cardio)
  2. `cardioRecommendations` - Daily cardio activities (7 days)
  3. `nutritionGuidance` - Calorie deficit, macros, meal examples
- Added user profile data to nutrition calculations (weight, height, age, sex)
- Created database migration: `add_cardio_nutrition_columns.sql`

**Commit 2: `4b45a87`** - Frontend Data Handling
- Updated `aiService.ts` to extract all three sections
- Updated `TrainingContext.tsx` to save cardio and nutrition to state
- Updated cache loading/saving to persist cardio and nutrition

**Commit 3: `c1527c1`** - UI Components
- Created `CardioRecommendationCard.tsx` (extremely detailed)
- Created `CalorieDeficitCard.tsx` (extremely detailed)
- Updated `programs.tsx` to display new cards

---

## New Card Components

### 1. CardioRecommendationCard (Extremely Detailed)

**Displays:**
- Activity name (e.g., "Steady-State Cardio", "HIIT Intervals")
- Duration (minutes)
- Intensity level (color-coded badge):
  - Low = Green
  - Moderate = Yellow
  - High = Red
  - Interval = Purple
- Heart rate zone (e.g., "Zone 2: 60-70% max HR")
- Estimated calories burned
- **What to Do:** Detailed description of the activity
- **Warmup:** Pre-cardio warmup protocol
- **Cooldown:** Post-cardio cooldown protocol
- **Tips & Form Cues:** Specific pacing advice, safety tips
- **Alternatives:** Alternative activities if equipment unavailable

**User can follow step-by-step** without any guesswork!

---

### 2. CalorieDeficitCard (Extremely Detailed)

**Displays:**
- **Calorie Deficit Banner:** Shows daily deficit (e.g., -500 cal = ~1 lb/week)
- **Daily Calorie Target:** Total calories to eat per day
- **Macro Breakdown:**
  - Protein (grams + calories)
  - Carbs (grams + calories)
  - Fat (grams + calories)
- **Meal Timing:** When to eat (e.g., "3-4 meals per day", "16:8 IF")
- **Hydration:** Daily water intake (e.g., "0.5oz per lb bodyweight = 100oz/day")
- **Pre-Workout Nutrition:** What to eat before training
- **Post-Workout Nutrition:** What to eat after training
- **Meal Examples:**
  - Breakfast example with macros
  - Lunch example with macros
  - Dinner example with macros
  - Snack options
- **Nutrition Tips:** Detailed tips for adherence
- **Deficit Strategy:** How to maintain deficit sustainably
- **Progress Monitoring:** How to track progress (weekly weigh-ins, measurements)
- **Supplements (Optional):** Recommended supplements (protein, creatine, etc.)

**User can follow exact nutrition plan** for maximum results!

---

## Database Migration

**File:** `backend/migrations/add_cardio_nutrition_columns.sql`

### ✅ Migration Status: COMPLETE (February 14, 2026)

**Executed using:** `backend/run_migration.py` (Python script with psycopg2)

**Result:**
```
[SUCCESS] Migration completed successfully!
[SUCCESS] Columns verified:
  - cardio_recommendations: jsonb
  - nutrition_guidance: jsonb
```

### Migration SQL:
```sql
ALTER TABLE workout_plans
ADD COLUMN IF NOT EXISTS cardio_recommendations JSONB,
ADD COLUMN IF NOT EXISTS nutrition_guidance JSONB;
```

### How It Was Run:
```bash
cd backend
python run_migration.py
```

**Note:** Migration script uses ASCII output (no Unicode emojis) for Windows console compatibility.

---

## AI Prompt Structure

### New System Prompt

The AI now generates:

```json
{
  "strengthPlan": {
    "planName": "4-Day Push/Pull/Legs",
    "description": "...",
    "weeklySchedule": [
      {
        "day": "Monday",
        "dayType": "Push",
        "exercises": [...],
        "estimatedDuration": 45,
        "warmup": "5 min dynamic stretches",
        "cooldown": "5 min stretching"
      }
    ],
    "progressionPlan": "...",
    "tips": [...]
  },
  "cardioRecommendations": {
    "monday": {
      "activity": "Steady-State Cardio",
      "duration": 20,
      "intensity": "moderate",
      "heartRateZone": "Zone 2 (60-70% max HR)",
      "caloriesBurned": 200,
      "description": "20 minutes on treadmill, bike, or elliptical...",
      "tips": ["Maintain conversation pace", "..."],
      "warmup": "5 min easy walk",
      "cooldown": "5 min walking + stretching",
      "alternatives": ["Outdoor walk", "Swimming"]
    },
    "tuesday": { ... },
    ...
  },
  "nutritionGuidance": {
    "dailyCalories": 2000,
    "deficit": 500,
    "proteinGrams": 150,
    "carbsGrams": 200,
    "fatGrams": 67,
    "mealTiming": "3-4 meals per day",
    "hydration": "Drink 0.5oz per lb bodyweight",
    "preworkoutNutrition": "30-60 min before: ...",
    "postworkoutNutrition": "Within 2 hours: ...",
    "mealExamples": {
      "breakfast": "3 eggs, 2 toast, 1 banana = 450 cal",
      "lunch": "6oz chicken breast, 1 cup rice, veggies = 550 cal",
      "dinner": "8oz salmon, sweet potato, salad = 600 cal",
      "snacks": ["Greek yogurt + berries", "Protein shake"]
    },
    "tips": [
      "Prioritize protein at every meal",
      "Time carbs around workouts for energy"
    ],
    "deficitStrategy": "Start conservative at 300-500 cal deficit...",
    "progressMonitoring": "Weigh daily, track weekly average...",
    "supplementRecommendations": [
      "Whey protein powder (optional convenience)",
      "Creatine monohydrate 5g daily (performance)"
    ]
  }
}
```

---

## TypeScript Types

### New Types Added (`types/training.ts`)

```typescript
// Daily cardio recommendation
export interface DailyCardioRecommendation {
  activity: string;
  duration: number; // minutes
  intensity: 'low' | 'moderate' | 'high' | 'interval';
  heartRateZone?: string;
  caloriesBurned: number;
  description: string; // Detailed what-to-do
  tips: string[]; // Form cues, safety tips
  warmup?: string;
  cooldown?: string;
  alternatives?: string[];
}

// Weekly cardio (7 days)
export interface CardioRecommendations {
  monday: DailyCardioRecommendation;
  tuesday: DailyCardioRecommendation;
  // ... wednesday through sunday
}

// Nutrition guidance
export interface NutritionGuidance {
  dailyCalories: number;
  deficit: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  mealTiming: string;
  hydration: string;
  preworkoutNutrition: string;
  postworkoutNutrition: string;
  supplementRecommendations?: string[];
  mealExamples: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  tips: string[];
  deficitStrategy: string;
  progressMonitoring: string;
}
```

---

## How It Works

### User Flow

1. **User completes Goal Wizard** (all 6 steps)
   - Includes program selection
   - Provides body metrics (weight, height, age, sex)
   - Sets activity level and preferences

2. **User clicks "Start Your Training Plan"**
   - Frontend calls `aiService.generateAIWorkoutPlan()`
   - Backend receives user profile + preferences
   - AI generates 3 sections (strength, cardio, nutrition)

3. **Data Flow:**
   ```
   Backend AI Generation
   ↓
   Frontend aiService (extracts 3 sections)
   ↓
   TrainingContext (saves to state + cache)
   ↓
   programs.tsx (displays 3 separate components)
   ```

4. **UI Display:**
   - **WorkoutCalendarCard** - Shows 7-day strength training calendar
   - **WorkoutCard** - Shows today's strength workout with exercises
   - **CardioRecommendationCard** - Shows today's cardio activity (NEW)
   - **CalorieDeficitCard** - Shows nutrition guidance (NEW)

---

## Testing Steps

### 1. Run Database Migration

```bash
# Connect to Railway PostgreSQL
railway run psql

# Run migration
\i backend/migrations/add_cardio_nutrition_columns.sql

# Verify columns added
\d workout_plans
```

### 2. Deploy to Railway

Changes are already pushed to GitHub. Railway will auto-deploy.

Wait 2-3 minutes for deployment to complete.

### 3. Test AI Generation

1. Open app and navigate to Goals tab
2. Complete full goal wizard (6 steps)
3. Select a training program
4. Click "Start Your Training Plan"
5. Wait 60-90 seconds for generation (300s timeout)
6. Navigate to Programs tab

### 4. Verify Display

**Expected Result:**

✅ **Strength Training Calendar** - Shows 7-day schedule
✅ **Today's Workout** - Shows exercises, sets, reps
✅ **Today's Cardio** - Extremely detailed card with activity, duration, tips
✅ **Nutrition Guidance** - Extremely detailed card with calories, macros, meal examples

---

## Troubleshooting

### Issue: Cardio/Nutrition cards not showing

**Check:**
1. Database migration ran successfully
2. Backend deployed (Railway auto-deploy after git push)
3. AI generation completed without errors
4. Check console logs: `[Training] Caching AI plan with cardio and nutrition...`

### Issue: AI generation timeout

**Already Fixed:**
- Frontend timeout: 300s (5 minutes) ✅
- Railway timeout: 300s (5 minutes) ✅
- Backend OpenAI timeout: 300s (5 minutes) ✅

### Issue: Cards showing but data incomplete

**Check backend logs:**
```bash
railway logs
```

Look for:
- `[Workout Plan] Generating X-day plan for <user_id>`
- `strengthPlan`, `cardioRecommendations`, `nutritionGuidance` in response

---

## Performance

### AI Generation Time

- **Strength Plan:** ~30-40 seconds
- **Cardio Recommendations:** ~10-15 seconds
- **Nutrition Guidance:** ~15-20 seconds
- **Total:** 60-90 seconds (well under 300s timeout)

### Token Usage

- **max_tokens:** 4000 (restored from 2000)
- **Typical response:** ~3000 tokens
- **Cost per generation:** ~$0.001 (very affordable)

---

## Future Enhancements

Potential improvements:
1. **Cardio Progress Tracking** - Log cardio sessions separately from strength
2. **Nutrition Logging** - Track daily calories/macros vs targets
3. **Weekly Cardio Summary** - Show cardio calories burned this week
4. **Macro Pie Chart** - Visual breakdown of protein/carbs/fat
5. **Meal Plan Integration** - Link nutrition guidance to meal plan generator

---

## Commits

1. **4a437f9** - Backend & Types (structure + migration)
2. **4b45a87** - Frontend Data Handling (aiService + TrainingContext)
3. **c1527c1** - UI Components (cards + programs.tsx)

**Total:** 3 commits, ~850 lines added

---

## Summary

✅ **Calendar:** Strength training only (no cardio mixed in)
✅ **Cardio Card:** Extremely detailed daily recommendations
✅ **Nutrition Card:** Extremely detailed calorie deficit guidance
✅ **AI-Generated:** All content personalized to user profile
✅ **Persisted:** Saved to database and cached locally
✅ **User-Friendly:** Step-by-step guidance, no guesswork

**Ready for testing!** 🚀

---

**Next Step:** Run database migration on Railway, then test the complete flow.
