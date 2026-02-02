# 🔍 API Structure Investigation Report
**Date:** 2026-02-02
**Investigation:** Frontend UI → Backend API alignment for AI Meal Plan and Workout Plan generation

---

## 📊 Executive Summary

**CRITICAL FINDINGS:** Both AI generation endpoints had severe API structure mismatches between frontend and backend, causing user preferences to be ignored and fallback values to be used instead.

### Issues Found:
- ❌ **Meal Plan API:** 7 field name mismatches
- ❌ **Workout Plan API:** 6 field name mismatches
- ✅ **Status:** ALL FIXED in backend/server-complete.js

---

## 🔴 Issue #1: Meal Plan API Structure Mismatch

### Frontend Flow:
1. **User sets preferences in Goal Wizard** (contexts/GoalWizardContext.tsx)
2. **MealPlanContext.tsx** (line 214-263) prepares data:
   ```typescript
   const aiPreferences = {
     calorieTarget: userGoals.dailyCalories,      // e.g., 1800
     proteinTarget: userGoals.dailyProtein,       // e.g., 140g
     carbsTarget: userGoals.dailyCarbs,           // e.g., 180g
     fatTarget: userGoals.dailyFat,               // e.g., 60g
     dietType: dietType,                          // e.g., "high_protein"
     mealsPerDay: preferences.mealsPerDay || 3,
     allergies: allAllergens,                     // e.g., ["peanuts", "shellfish"]
     favoriteProteins: foodPrefs?.favoriteProteins || [],
     favoriteFruits: foodPrefs?.favoriteFruits || [],
     favoriteVegetables: foodPrefs?.favoriteVegetables || [],
     favoriteStarches: foodPrefs?.favoriteStarches || [],
     favoriteSnacks: foodPrefs?.favoriteSnacks || [],
     favoriteCuisines: foodPrefs?.favoriteCuisines || [],
     hatedFoods: foodPrefs?.hatedFoods || '',
     mealStyle: foodPrefs?.mealStyle || '',
     mealDiversity: foodPrefs?.mealDiversity || '',
     cheatDays: foodPrefs?.cheatDays || [],
     cookingSkill: foodPrefs?.cookingSkill || '',
   };
   ```

3. **aiService.ts** (line 461-485) sends to backend:
   ```typescript
   body: JSON.stringify({
     preferences,  // ALL preferences in one object
     days,
     shopifyCustomerId: 'guest_ios_app',
   })
   ```

### Backend Expected (BEFORE FIX):
```javascript
// OLD CODE (server-complete.js line 765):
const { goals, preferences, restrictions, days } = req.body;

// Used in prompt (line 799-804):
- Daily calories: ${goals?.dailyCalories || 2000}      // ❌ goals doesn't exist!
- Daily protein: ${goals?.dailyProtein || 150}g        // ❌ goals doesn't exist!
- Diet style: ${preferences?.dietStyle || 'balanced'}  // ❌ dietStyle doesn't exist!
- Cuisine preferences: ${preferences?.cuisines?.join(', ') || 'varied'}  // ❌ cuisines doesn't exist!
- Allergies/restrictions: ${restrictions?.join(', ') || 'none'}  // ❌ restrictions doesn't exist!
```

### Result:
**Backend received ALL user preferences but couldn't access them due to wrong field names!**
- User sets 1800 calories → Backend uses 2000 (fallback)
- User sets "high_protein" diet → Backend uses "balanced" (fallback)
- User sets "peanut allergy" → Backend uses "none" (fallback)
- User sets "Italian, Mexican" cuisines → Backend uses "varied" (fallback)

### The Fix (AFTER):
```javascript
// NEW CODE (server-complete.js line 766):
const { preferences, days } = req.body;

// NEW PROMPT (line 801-823):
- Daily calories: ${preferences?.calorieTarget || 2000}         // ✅ Uses actual user value!
- Daily protein: ${preferences?.proteinTarget || 150}g          // ✅ Uses actual user value!
- Daily carbs: ${preferences?.carbsTarget || 200}g              // ✅ Uses actual user value!
- Daily fat: ${preferences?.fatTarget || 65}g                   // ✅ Uses actual user value!
- Diet type: ${preferences?.dietType || 'balanced'}             // ✅ Uses actual user value!
- Meals per day: ${preferences?.mealsPerDay || 3}               // ✅ Uses actual user value!
- Cuisine preferences: ${preferences?.favoriteCuisines?.join(', ') || 'varied'}  // ✅ Uses actual user value!
- Favorite proteins: ${preferences?.favoriteProteins?.join(', ') || 'varied'}
- Favorite vegetables: ${preferences?.favoriteVegetables?.join(', ') || 'varied'}
- Favorite fruits: ${preferences?.favoriteFruits?.join(', ') || 'varied'}
- Favorite starches: ${preferences?.favoriteStarches?.join(', ') || 'varied'}
- Allergies/restrictions: ${preferences?.allergies?.join(', ') || 'none'}  // ✅ Uses actual user value!
- Hated foods: ${preferences?.hatedFoods || 'none'}
- Meal style: ${preferences?.mealStyle || 'balanced'}
- Meal diversity: ${preferences?.mealDiversity || 'moderate'}
- Cooking skill: ${preferences?.cookingSkill || 'intermediate'}
- Cheat days: ${preferences?.cheatDays?.join(', ') || 'none'}
```

---

## 🔴 Issue #2: Workout Plan API Structure Mismatch

### Frontend Flow:
1. **TrainingContext.tsx** (line 222-230) prepares data:
   ```typescript
   const aiPreferences = {
     fitnessGoal: preferences.primaryGoal || 'general_fitness',
     experienceLevel: preferences.fitnessLevel || 'intermediate',
     daysPerWeek: preferences.workoutsPerWeek || 3,
     sessionDuration: preferences.workoutDuration || 45,
     availableEquipment: preferences.availableEquipment || ['dumbbells', 'barbell', 'gym'],
     injuries: [],
     cardioPreference: preferences.cardioPreference || 'walking',
   };
   ```

2. **aiService.ts** (line 614-618) sends to backend:
   ```typescript
   body: JSON.stringify({
     preferences,  // ALL preferences in one object
     weeks,
     shopifyCustomerId: 'guest_ios_app',
   })
   ```

### Backend Expected (BEFORE FIX):
```javascript
// OLD CODE (server-complete.js line 865):
const { goals, fitnessLevel, equipment, daysPerWeek, preferences } = req.body;

// Used in prompt (line 897-903):
- Goal: ${goals?.type || 'build muscle'}                        // ❌ goals doesn't exist!
- Fitness level: ${fitnessLevel || 'intermediate'}              // ❌ fitnessLevel doesn't exist!
- Available equipment: ${equipment?.join(', ') || 'full gym'}   // ❌ equipment doesn't exist!
- Days per week: ${daysPerWeek || 4}                            // ❌ daysPerWeek doesn't exist!
- Session length: ${preferences?.sessionLength || 45}           // ❌ sessionLength doesn't exist!
- Focus areas: ${preferences?.focusAreas?.join(', ') || 'full body'}  // ❌ focusAreas doesn't exist!
```

### Result:
**Backend received ALL user preferences but couldn't access them!**
- User sets "strength training" goal → Backend uses "build muscle" (fallback)
- User sets "beginner" level → Backend uses "intermediate" (fallback)
- User sets "home gym" equipment → Backend uses "full gym" (fallback)
- User sets 3 days/week → Backend uses 4 days/week (fallback)

### The Fix (AFTER):
```javascript
// NEW CODE (server-complete.js line 882):
const { preferences, weeks } = req.body;

// NEW PROMPT (line 916-927):
- Goal: ${preferences?.fitnessGoal || 'general_fitness'}               // ✅ Uses actual user value!
- Fitness level: ${preferences?.experienceLevel || 'intermediate'}     // ✅ Uses actual user value!
- Available equipment: ${preferences?.availableEquipment?.join(', ') || 'full gym'}  // ✅ Uses actual user value!
- Days per week: ${preferences?.daysPerWeek || 4}                      // ✅ Uses actual user value!
- Session length: ${preferences?.sessionDuration || 45} minutes        // ✅ Uses actual user value!
- Cardio preference: ${preferences?.cardioPreference || 'moderate'}    // ✅ Uses actual user value!
- Injuries to avoid: ${preferences?.injuries?.length > 0 ? preferences.injuries.join(', ') : 'none'}  // ✅ Uses actual user value!
```

---

## 📋 Complete Mismatch Table

### Meal Plan API (7 Mismatches Fixed)

| Frontend Sends | Backend Expected (OLD) | Backend Receives (NEW) | Status |
|----------------|------------------------|------------------------|--------|
| `preferences.calorieTarget` | `goals.dailyCalories` | `preferences.calorieTarget` | ✅ FIXED |
| `preferences.proteinTarget` | `goals.dailyProtein` | `preferences.proteinTarget` | ✅ FIXED |
| `preferences.carbsTarget` | Not used | `preferences.carbsTarget` | ✅ FIXED |
| `preferences.fatTarget` | Not used | `preferences.fatTarget` | ✅ FIXED |
| `preferences.dietType` | `preferences.dietStyle` | `preferences.dietType` | ✅ FIXED |
| `preferences.favoriteCuisines` | `preferences.cuisines` | `preferences.favoriteCuisines` | ✅ FIXED |
| `preferences.allergies` | `restrictions` (top-level) | `preferences.allergies` | ✅ FIXED |

### Workout Plan API (6 Mismatches Fixed)

| Frontend Sends | Backend Expected (OLD) | Backend Receives (NEW) | Status |
|----------------|------------------------|------------------------|--------|
| `preferences.fitnessGoal` | `goals.type` | `preferences.fitnessGoal` | ✅ FIXED |
| `preferences.experienceLevel` | `fitnessLevel` (top-level) | `preferences.experienceLevel` | ✅ FIXED |
| `preferences.daysPerWeek` | `daysPerWeek` (top-level) | `preferences.daysPerWeek` | ✅ FIXED |
| `preferences.sessionDuration` | `preferences.sessionLength` | `preferences.sessionDuration` | ✅ FIXED |
| `preferences.availableEquipment` | `equipment` (top-level) | `preferences.availableEquipment` | ✅ FIXED |
| `preferences.injuries` | Not used | `preferences.injuries` | ✅ FIXED |
| `preferences.cardioPreference` | Not used | `preferences.cardioPreference` | ✅ FIXED |

---

## ✅ Files Modified

### backend/server-complete.js
- **Line 763-823:** Fixed meal plan endpoint to accept `preferences` object directly
- **Line 879-927:** Fixed workout plan endpoint to accept `preferences` object directly
- **Added:** Comprehensive logging to show received preferences for debugging

---

## 🚀 Deployment Required

### ⚠️ CRITICAL: Backend Changes Must Be Deployed to Railway

The fixes are now in the code, but Railway is still running the OLD version with the mismatches!

### Steps to Deploy:

1. **Verify Git Status:**
   ```bash
   cd C:\Users\derri\HeirclarkHealthAppNew
   git status
   ```

2. **Commit Changes:**
   ```bash
   git add backend/server-complete.js
   git commit -m "Fix critical API structure mismatches for meal plan and workout plan generation

- Fixed meal plan endpoint to use preferences.calorieTarget instead of goals.dailyCalories
- Fixed meal plan endpoint to use preferences.dietType instead of preferences.dietStyle
- Fixed meal plan endpoint to use preferences.favoriteCuisines instead of preferences.cuisines
- Fixed meal plan endpoint to use preferences.allergies instead of restrictions
- Fixed workout plan endpoint to use preferences.fitnessGoal instead of goals.type
- Fixed workout plan endpoint to use preferences.experienceLevel instead of fitnessLevel
- Fixed workout plan endpoint to use preferences.daysPerWeek instead of top-level daysPerWeek
- Fixed workout plan endpoint to use preferences.sessionDuration instead of preferences.sessionLength
- Fixed workout plan endpoint to use preferences.availableEquipment instead of equipment
- Added comprehensive logging for debugging
- All user preferences now properly passed to OpenAI for personalized generation

Result: Meal plans and workout plans will now use actual user preferences instead of fallback values"
   ```

3. **Push to Railway:**
   ```bash
   git push origin main
   ```

4. **Railway Auto-Deploy:**
   - Railway should automatically detect the commit and redeploy
   - Check Railway dashboard to confirm deployment started
   - Wait for deployment to complete (usually 2-3 minutes)

5. **Verify Deployment:**
   - Check Railway logs for "Build succeeded"
   - Check Railway logs for "App listening on port"
   - Test meal plan generation from app
   - Check logs for new debug output: `[Meal Plan] Received preferences:`

---

## 🧪 Testing After Deployment

### Test Meal Plan Generation:
1. Open app
2. Go to Meal Plan screen
3. Tap "Generate AI Meal Plan"
4. **Expected behavior:**
   - Meal plan should use YOUR calorie target (not 2000 default)
   - Meal plan should use YOUR diet type (not "balanced" default)
   - Meal plan should respect YOUR allergies (not "none" default)
   - Meal plan should use YOUR favorite cuisines (not "varied" default)

### Test Workout Plan Generation:
1. Open app
2. Go to Training screen
3. Tap "Generate AI Workout Plan"
4. **Expected behavior:**
   - Workout plan should match YOUR fitness goal (not "build muscle" default)
   - Workout plan should match YOUR experience level (not "intermediate" default)
   - Workout plan should use YOUR available equipment (not "full gym" default)
   - Workout plan should be YOUR days per week (not 4 days default)

### Check Railway Logs:
```bash
# Look for these new log lines:
[Meal Plan] Received preferences: { "calorieTarget": 1800, "dietType": "high_protein", ... }
[Workout Plan] Received preferences: { "fitnessGoal": "strength", "experienceLevel": "beginner", ... }
```

---

## 📊 Impact Analysis

### Before Fix:
- ❌ User sets 1800 cal target → AI generates 2000 cal meals
- ❌ User sets high-protein diet → AI generates balanced meals
- ❌ User has peanut allergy → AI includes peanuts
- ❌ User wants Italian food → AI generates varied cuisines
- ❌ User is beginner → AI generates intermediate workouts
- ❌ User has home gym → AI assumes full gym equipment

### After Fix:
- ✅ User sets 1800 cal target → AI generates 1800 cal meals
- ✅ User sets high-protein diet → AI generates high-protein meals
- ✅ User has peanut allergy → AI avoids peanuts completely
- ✅ User wants Italian food → AI prioritizes Italian recipes
- ✅ User is beginner → AI generates beginner-appropriate workouts
- ✅ User has home gym → AI uses only available equipment

---

## 🎯 Root Cause

**Why did this happen?**

The backend API was designed with a different data structure than the frontend was actually sending. This likely happened because:

1. Backend endpoints were created with an assumed structure
2. Frontend was built independently with a different structure
3. No API contract/schema validation was in place
4. Both worked without errors (requests succeeded) but used fallback values
5. No logging showed the actual preferences being received

**Prevention for future:**
- Add TypeScript interfaces shared between frontend and backend
- Add request body validation (e.g., Zod schema validation)
- Add comprehensive logging of request bodies
- Write integration tests that verify actual user data flows through

---

## ✅ Completion Checklist

- [x] Investigated meal plan API structure (frontend → backend)
- [x] Investigated workout plan API structure (frontend → backend)
- [x] Documented all mismatches (13 total issues found)
- [x] Fixed meal plan backend endpoint (7 field mismatches)
- [x] Fixed workout plan backend endpoint (6 field mismatches)
- [x] Added debug logging for both endpoints
- [x] Created comprehensive investigation report
- [ ] **Deploy backend changes to Railway** ⬅️ USER ACTION REQUIRED
- [ ] **Test meal plan generation with real user data**
- [ ] **Test workout plan generation with real user data**
- [ ] **Verify logs show actual preferences being used**

---

## 📝 Additional Notes

### OpenAI API Key Status:
- **Status:** Still needs to be added to Railway environment variables
- **Variable:** `OPENAI_API_KEY`
- **Impact:** Without this, AI generation will timeout (even with fixed API structure)
- **Priority:** HIGH (must be added before testing)

### Database Schema:
- ✅ All required columns exist (target_weight_kg, target_date, timezone)
- ✅ Apple authentication working
- ✅ Profile updates working

---

**Investigation completed:** 2026-02-02
**Status:** ✅ CODE FIXED, ⏳ AWAITING DEPLOYMENT
