import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { mealPlanService } from '../services/mealPlanService';
import { instacartService } from '../services/instacartService';
import { aiService } from '../services/aiService';
import { pexelsService } from '../services/pexelsService';
import { generateGroceryList } from '../utils/groceryListGenerator';
import { Linking } from 'react-native';
import {
  DayPlan,
  GroceryCategory,
  GroceryItem,
  WeekSummary,
  Meal,
  MealPlanPreferences,
  UserGoalsForMealPlan,
} from '../types/mealPlan';
import { MealPlanPreferences as AIMealPlanPreferences } from '../types/ai';
import { useGoalWizard } from './GoalWizardContext';
import { useFoodPreferencesSafe, FoodPreferences } from './FoodPreferencesContext';

const FOOD_PREFS_STORAGE_KEY = 'hc_food_preferences';

const STORAGE_KEY = 'hc_meal_plan_cache';

export interface MealPlanState {
  weeklyPlan: DayPlan[] | null;
  groceryList: GroceryCategory[] | null;
  weekSummary: WeekSummary | null;
  isGenerating: boolean;
  isSwapping: boolean;
  isGeneratingGroceryList: boolean; // NEW: Loading state for grocery list generation
  groceryListProgress: { current: number; total: number } | null; // NEW: Batch progress tracking
  error: string | null;
  selectedDayIndex: number; // 0-6
  lastGeneratedAt: string | null;
}

interface MealPlanContextType {
  state: MealPlanState;

  // Actions
  generateMealPlan: () => Promise<boolean>;
  generateAIMealPlan: () => Promise<boolean>;
  swapMeal: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', reason?: string) => Promise<boolean>;
  setSelectedDay: (index: number) => void;
  clearPlan: () => void;
  toggleGroceryItem: (categoryIndex: number, itemIndex: number) => void;
  deleteGroceryItem: (categoryIndex: number, itemIndex: number) => void;
  openInstacart: () => Promise<boolean>;
  loadCachedPlan: () => Promise<void>;
  generateGroceryListOnDemand: (budgetTier?: 'low' | 'medium' | 'high') => Promise<void>; // NEW - with budget awareness
  orderWithInstacart: (filters?: { budgetTier?: 'low' | 'medium' | 'high'; dietary?: string[] }) => Promise<void>; // UPDATED
  updateMealRecipe: (dayIndex: number, mealIndex: number, ingredients: any[], instructions: string[]) => void;
}

const initialState: MealPlanState = {
  weeklyPlan: null,
  groceryList: null,
  weekSummary: null,
  isGenerating: false,
  isSwapping: false,
  isGeneratingGroceryList: false,
  groceryListProgress: null,
  error: null,
  selectedDayIndex: 0,
  lastGeneratedAt: null,
};

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined);

export function MealPlanProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MealPlanState>(initialState);

  // Try to get GoalWizard context, but don't require it
  let goalWizardContext: any = null;
  try {
    goalWizardContext = useGoalWizard();
  } catch {
    // GoalWizardContext not available - we'll use default preferences
  }

  // Get food preferences context
  const foodPrefsContext = useFoodPreferencesSafe();

  // Load food preferences from storage (fallback if context not available)
  const getFoodPreferences = useCallback(async (): Promise<FoodPreferences | null> => {
    // ✅ FIX: Read from AsyncStorage FIRST to avoid stale context closures
    // AsyncStorage is always up-to-date, context may lag behind React re-renders
    try {
      const stored = await AsyncStorage.getItem(FOOD_PREFS_STORAGE_KEY);
      if (stored) {
        console.log('[MealPlanContext] ✅ Loaded food prefs from AsyncStorage (source of truth)');
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[MealPlanContext] Error loading food preferences from AsyncStorage:', error);
    }

    // Fallback to context (for offline resilience or if AsyncStorage fails)
    if (foodPrefsContext?.preferences) {
      console.log('[MealPlanContext] ⚠️ Fallback to context food prefs');
      return foodPrefsContext.preferences;
    }

    return null;
  }, [foodPrefsContext]);

  // Get preferences from GoalWizard context, backend, or use defaults
  // Now also includes food preferences from FoodPreferencesContext
  const getPreferences = useCallback(async (): Promise<MealPlanPreferences> => {
    // Get detailed food preferences
    const foodPrefs = await getFoodPreferences();

    // First try to get from GoalWizard context (local state)
    if (goalWizardContext?.state) {
      const { dietStyle, allergies, mealsPerDay, intermittentFasting, fastingStart, fastingEnd } = goalWizardContext.state;

      // Map diet style to dietary restrictions
      const dietaryRestrictions: string[] = [];
      if (dietStyle === 'vegetarian') dietaryRestrictions.push('vegetarian');
      if (dietStyle === 'vegan') dietaryRestrictions.push('vegan');
      if (dietStyle === 'keto') dietaryRestrictions.push('low-carb');

      // Combine allergies from both sources
      const combinedAllergies = [
        ...(allergies || []),
        ...(foodPrefs?.allergens || []),
      ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

      return {
        dietaryRestrictions,
        cuisinePreferences: foodPrefs?.favoriteCuisines || [],
        allergies: combinedAllergies,
        mealsPerDay: mealsPerDay || 3,
        dietStyle: dietStyle || 'standard',
        intermittentFasting: intermittentFasting || false,
        fastingStart: fastingStart || '12:00',
        fastingEnd: fastingEnd || '20:00',
        // Include detailed food preferences
        favoriteProteins: foodPrefs?.favoriteProteins || [],
        favoriteVegetables: foodPrefs?.favoriteVegetables || [],
        favoriteFruits: foodPrefs?.favoriteFruits || [],
        favoriteStarches: foodPrefs?.favoriteStarches || [],
        favoriteSnacks: foodPrefs?.favoriteSnacks || [],
        favoriteCuisines: foodPrefs?.favoriteCuisines || [],
        hatedFoods: foodPrefs?.hatedFoods || '',
        cookingSkill: foodPrefs?.cookingSkill || '',
        mealStyle: foodPrefs?.mealStyle || '',
        mealDiversity: foodPrefs?.mealDiversity || '',
        cheatDays: foodPrefs?.cheatDays || [],
      };
    }

    // Fallback: Try to get from backend preferences
    try {
      console.log('[MealPlanContext] 🔄 Fetching preferences from backend...');
      const backendPrefs = await api.getPreferences();
      if (backendPrefs) {
        const dietaryRestrictions: string[] = [];
        if (backendPrefs.dietStyle === 'vegetarian') dietaryRestrictions.push('vegetarian');
        if (backendPrefs.dietStyle === 'vegan') dietaryRestrictions.push('vegan');
        if (backendPrefs.dietStyle === 'keto') dietaryRestrictions.push('low-carb');

        // Combine allergies from both sources
        const combinedAllergies = [
          ...(backendPrefs.allergies || []),
          ...(foodPrefs?.allergens || []),
        ].filter((v, i, a) => a.indexOf(v) === i);

        console.log('[MealPlanContext] ✅ Using backend preferences:', {
          dietStyle: backendPrefs.dietStyle,
          allergies: combinedAllergies,
          favoriteProteins: foodPrefs?.favoriteProteins,
        });

        return {
          dietaryRestrictions,
          cuisinePreferences: foodPrefs?.favoriteCuisines || [],
          allergies: combinedAllergies,
          mealsPerDay: backendPrefs.mealsPerDay || 3,
          dietStyle: backendPrefs.dietStyle || 'standard',
          intermittentFasting: backendPrefs.intermittentFasting || false,
          fastingStart: backendPrefs.fastingStart || '12:00',
          fastingEnd: backendPrefs.fastingEnd || '20:00',
          // Include detailed food preferences
          favoriteProteins: foodPrefs?.favoriteProteins || [],
          favoriteVegetables: foodPrefs?.favoriteVegetables || [],
          favoriteFruits: foodPrefs?.favoriteFruits || [],
          favoriteStarches: foodPrefs?.favoriteStarches || [],
          favoriteSnacks: foodPrefs?.favoriteSnacks || [],
          favoriteCuisines: foodPrefs?.favoriteCuisines || [],
          hatedFoods: foodPrefs?.hatedFoods || '',
          cookingSkill: foodPrefs?.cookingSkill || '',
          mealStyle: foodPrefs?.mealStyle || '',
          mealDiversity: foodPrefs?.mealDiversity || '',
          cheatDays: foodPrefs?.cheatDays || [],
        };
      }
    } catch (error) {
      console.warn('[MealPlanContext] Could not fetch backend preferences:', error);
    }

    // Default preferences (still include food preferences if available)
    console.log('[MealPlanContext] Using default preferences with food preferences');
    return {
      dietaryRestrictions: [],
      cuisinePreferences: foodPrefs?.favoriteCuisines || [],
      allergies: foodPrefs?.allergens || [],
      mealsPerDay: 3,
      dietStyle: 'standard',
      intermittentFasting: false,
      fastingStart: '12:00',
      fastingEnd: '20:00',
      // Include detailed food preferences
      favoriteProteins: foodPrefs?.favoriteProteins || [],
      favoriteVegetables: foodPrefs?.favoriteVegetables || [],
      favoriteFruits: foodPrefs?.favoriteFruits || [],
      favoriteStarches: foodPrefs?.favoriteStarches || [],
      favoriteSnacks: foodPrefs?.favoriteSnacks || [],
      favoriteCuisines: foodPrefs?.favoriteCuisines || [],
      hatedFoods: foodPrefs?.hatedFoods || '',
      cookingSkill: foodPrefs?.cookingSkill || '',
      mealStyle: foodPrefs?.mealStyle || '',
      mealDiversity: foodPrefs?.mealDiversity || '',
      cheatDays: foodPrefs?.cheatDays || [],
    };
  }, [goalWizardContext, getFoodPreferences]);

  // Get user goals from API
  const getUserGoals = useCallback(async (): Promise<UserGoalsForMealPlan> => {
    try {
      console.log('[MealPlanContext] 🔍 Fetching goals from backend...');
      const goals = await api.getGoals();
      console.log('[MealPlanContext] 📥 Backend returned:', goals);

      if (goals) {
        const finalGoals = {
          dailyCalories: goals.dailyCalories || 2000,
          dailyProtein: goals.dailyProtein || 150,
          dailyCarbs: goals.dailyCarbs || 200,
          dailyFat: goals.dailyFat || 65,
        };
        console.log('[MealPlanContext] ✅ Using goals from backend:', finalGoals);
        return finalGoals;
      } else {
        console.warn('[MealPlanContext] ⚠️ Backend returned NULL - using defaults');
      }
    } catch (error) {
      console.error('[MealPlanContext] ❌ Failed to get goals:', error);
    }

    // Default goals
    console.warn('[MealPlanContext] 🔧 Using HARDCODED DEFAULTS:', {
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyCarbs: 200,
      dailyFat: 65,
    });
    console.warn('[MealPlanContext] 💡 This means your calculated goals were NOT saved to the database!');

    return {
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyCarbs: 200,
      dailyFat: 65,
    };
  }, []);

  // Generate AI-powered meal plan using OpenAI
  const generateAIMealPlan = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const userGoals = await getUserGoals();
      const preferences = await getPreferences();
      const foodPrefs = await getFoodPreferences();

      console.log('[MealPlanContext] 🍽️ Generating AI meal plan with:');
      console.log('[MealPlanContext] 📊 Goals:', userGoals);
      console.log('[MealPlanContext] 📊 Preferences:', preferences);
      console.log('[MealPlanContext] 📊 Food Preferences:', foodPrefs);
      console.log('[MealPlanContext] 🔍 Meal Diversity from foodPrefs:', foodPrefs?.mealDiversity);

      // Combine allergens from both sources
      const allAllergens = [
        ...(preferences.allergies || []),
        ...(foodPrefs?.allergens || []),
      ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

      // Get diet type from food preferences or goal wizard
      const dietType = foodPrefs?.dietaryPreferences?.length
        ? foodPrefs.dietaryPreferences[0].toLowerCase().replace(' ', '-')
        : preferences.dietStyle || 'balanced';

      // Convert to AI service format with full food preferences
      const aiPreferences: AIMealPlanPreferences = {
        calorieTarget: userGoals.dailyCalories,
        proteinTarget: userGoals.dailyProtein,
        carbsTarget: userGoals.dailyCarbs,
        fatTarget: userGoals.dailyFat,
        dietType: dietType,
        mealsPerDay: preferences.mealsPerDay || 3,
        allergies: allAllergens,
        // Food preferences from dedicated preferences screen
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

      console.log('[MealPlanContext] 🍽️ Meal diversity preference being sent:', foodPrefs?.mealDiversity);
      console.log('[MealPlanContext] 🍽️ aiPreferences.mealDiversity:', aiPreferences.mealDiversity);
      console.log('[MealPlanContext] 📊 Full aiPreferences object:', JSON.stringify(aiPreferences, null, 2));

      const aiPlan = await aiService.generateAIMealPlan(aiPreferences, 7);

      if (aiPlan) {
        // Convert AI plan to app format - always start from Sunday of current week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Helper: Format date in user's LOCAL timezone (not UTC)
        const formatLocalDate = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Calculate Sunday of the current week in USER'S LOCAL TIMEZONE
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - dayOfWeek); // Go back to Sunday
        sunday.setHours(0, 0, 0, 0);

        const weeklyPlan: DayPlan[] = aiPlan.days.map((day, index) => {
          // Start from Sunday and add index days
          const planDate = new Date(sunday);
          planDate.setDate(sunday.getDate() + index);
          return {
            dayNumber: index + 1,
            date: formatLocalDate(planDate), // Use local timezone, not UTC
            dayName: dayNames[index], // Use index directly since we start from Sunday
            meals: day.meals.map((meal: any) => ({
            id: `ai-meal-${Date.now()}-${Math.random()}`,
            mealType: meal.mealType.toLowerCase(),
            name: meal.name || meal.dishName,
            description: meal.description || '',
            calories: meal.calories || 0,
            protein: meal.protein || meal.macros?.protein || 0,
            carbs: meal.carbs || meal.macros?.carbs || 0,
            fat: meal.fat || meal.macros?.fat || 0,
            servings: meal.servings || 1,
            prepTime: meal.prepTime || 15,
            cookTime: meal.cookTime || 20,
            imageUrl: meal.imageUrl,
            ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
            instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
          })),
          dailyTotals: {
            calories: day.meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0),
            protein: day.meals.reduce((sum: number, m: any) => sum + (m.protein || m.macros?.protein || 0), 0),
            carbs: day.meals.reduce((sum: number, m: any) => sum + (m.carbs || m.macros?.carbs || 0), 0),
            fat: day.meals.reduce((sum: number, m: any) => sum + (m.fat || m.macros?.fat || 0), 0),
          },
        };
        });

        const now = new Date().toISOString();

        // Calculate ACTUAL averages from the generated meal plan (not just echo goals)
        const daysWithMeals = weeklyPlan.filter(day => day.meals && day.meals.length > 0);
        const numDays = daysWithMeals.length || 1; // Avoid division by zero

        const actualTotals = daysWithMeals.reduce(
          (acc, day) => ({
            calories: acc.calories + (day.dailyTotals?.calories || 0),
            protein: acc.protein + (day.dailyTotals?.protein || 0),
            carbs: acc.carbs + (day.dailyTotals?.carbs || 0),
            fat: acc.fat + (day.dailyTotals?.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        const calculatedWeekSummary = {
          avgDailyCalories: Math.round(actualTotals.calories / numDays),
          avgDailyProtein: Math.round(actualTotals.protein / numDays),
          avgDailyCarbs: Math.round(actualTotals.carbs / numDays),
          avgDailyFat: Math.round(actualTotals.fat / numDays),
          totalMeals: weeklyPlan.reduce((sum, day) => sum + day.meals.length, 0),
        };

        console.log('[MealPlanContext] Calculated week summary from actual meals:', calculatedWeekSummary);

        // *** OPTION 1: Generate ALL images UPFRONT before showing meal plan ***
        console.log('[MealPlanContext] 🖼️ Generating all food photos in parallel...');
        const updatedPlan = [...weeklyPlan];
        const totalMeals = weeklyPlan.reduce((sum, day) => sum + day.meals.length, 0);

        // Show initial loading state
        setState(prev => ({
          ...prev,
          isGenerating: true,
          error: `Generating food photos... 0/${totalMeals}`,
        }));

        // ✅ PARALLEL IMAGE GENERATION - Fetch all images concurrently
        const imagePromises: Array<{
          dayIdx: number;
          mealIdx: number;
          promise: Promise<string | null>;
          mealName: string;
        }> = [];

        // Collect all image fetch promises
        for (let dayIdx = 0; dayIdx < updatedPlan.length; dayIdx++) {
          const day = updatedPlan[dayIdx];
          for (let mealIdx = 0; mealIdx < day.meals.length; mealIdx++) {
            const meal = day.meals[mealIdx];

            // Skip if imageUrl already exists
            if (meal.imageUrl) {
              continue;
            }

            // Create promise for this image
            imagePromises.push({
              dayIdx,
              mealIdx,
              mealName: meal.name,
              promise: pexelsService.searchFoodPhoto(meal.name, 'card').catch(err => {
                console.error(`[MealPlanContext] ❌ Image error for ${meal.name}:`, err);
                return null; // Return null on error so Promise.all doesn't fail
              }),
            });
          }
        }

        console.log(`[MealPlanContext] 🚀 Fetching ${imagePromises.length} images in parallel...`);
        const startTime = Date.now();

        // Fetch all images in parallel
        const imageResults = await Promise.all(imagePromises.map(p => p.promise));

        const fetchTime = Date.now() - startTime;
        console.log(`[MealPlanContext] ⚡ Fetched ${imageResults.length} images in ${fetchTime}ms (${Math.round(fetchTime / imageResults.length)}ms avg per image)`);

        // Apply results to plan
        let imagesGenerated = 0;
        imagePromises.forEach((item, index) => {
          const imageUrl = imageResults[index];
          if (imageUrl) {
            updatedPlan[item.dayIdx] = {
              ...updatedPlan[item.dayIdx],
              meals: updatedPlan[item.dayIdx].meals.map((m, idx) =>
                idx === item.mealIdx ? { ...m, imageUrl } : m
              ),
            };
            imagesGenerated++;
            console.log(`[MealPlanContext] 🖼️ Image ${imagesGenerated}/${imagePromises.length}: ${item.mealName}`);
          }
        });

        console.log(`[MealPlanContext] ✅ Generated ${imagesGenerated}/${totalMeals} food photos in ${fetchTime}ms`);

        // Now set state with COMPLETE plan (includes all images)
        setState(prev => ({
          ...prev,
          weeklyPlan: updatedPlan,
          groceryList: [],
          weekSummary: calculatedWeekSummary,
          isGenerating: false,
          error: null,
          lastGeneratedAt: now,
        }));

        // Cache the COMPLETE plan locally (includes images)
        const cacheData = {
          weeklyPlan: updatedPlan,
          groceryList: [],
          weekSummary: calculatedWeekSummary,
          lastGeneratedAt: now,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

        // *** Sync COMPLETE meal plan to backend (includes images) ***
        try {
          console.log('[MealPlanContext] 🔄 Syncing complete meal plan to backend...');
          const weekStart = updatedPlan[0]?.date || new Date().toISOString().split('T')[0];
          const syncSuccess = await api.saveMealPlan(
            { weeklyPlan: updatedPlan, groceryList: [], weekSummary: calculatedWeekSummary },
            weekStart,
            preferences.dietStyle
          );
          if (syncSuccess) {
            console.log('[MealPlanContext] ✅ Complete meal plan synced to backend');
          } else {
            console.warn('[MealPlanContext] ⚠️ Backend sync failed - plan saved locally');
          }
        } catch (syncError) {
          console.error('[MealPlanContext] ❌ Backend sync error:', syncError);
        }

        // *** Auto-save all meals to saved_meals (fire-and-forget) ***
        (async () => {
          try {
            console.log('[MealPlanContext] 💾 Auto-saving all meals to saved meals...');
            let savedCount = 0;
            for (const day of updatedPlan) {
              for (const meal of day.meals) {
                try {
                  await api.saveMeal({
                    mealName: meal.name,
                    mealType: meal.mealType,
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fat: meal.fat,
                    ingredients: meal.ingredients || [],
                    recipe: meal.description || '',
                    prepTimeMinutes: meal.prepTime || 15,
                    photoUrl: meal.imageUrl || '',
                    tags: [],
                  });
                  savedCount++;
                } catch (saveErr) {
                  // Skip errors (e.g. duplicates)
                }
              }
            }
            console.log(`[MealPlanContext] ✅ Auto-saved ${savedCount} meals to saved_meals`);
          } catch (bgError) {
            console.error('[MealPlanContext] ❌ Auto-save error:', bgError);
          }
        })();

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: 'Failed to generate AI meal plan',
        }));
        return false;
      }
    } catch (error) {
      console.error('[MealPlanContext] AI Generate error:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
      return false;
    }
  }, [getUserGoals, getPreferences, getFoodPreferences]);

  // Generate a new 7-day meal plan (now uses AI by default)
  // This is a wrapper that calls generateAIMealPlan for backward compatibility
  const generateMealPlan = useCallback(async (): Promise<boolean> => {
    console.log('[MealPlanContext] 🔄 generateMealPlan() redirecting to AI generation');
    return await generateAIMealPlan();
  }, [generateAIMealPlan]);

  // Swap a single meal
  const swapMeal = useCallback(async (
    dayIndex: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    reason?: string
  ): Promise<boolean> => {
    if (!state.weeklyPlan || !state.weeklyPlan[dayIndex]) {
      return false;
    }

    const dayPlan = state.weeklyPlan[dayIndex];
    const currentMeal = dayPlan.meals.find(m => m.mealType === mealType);

    if (!currentMeal) {
      return false;
    }

    setState(prev => ({ ...prev, isSwapping: true }));

    try {
      const userGoals = await getUserGoals();

      const response = await mealPlanService.swapMeal(
        dayIndex + 1, // dayNumber is 1-indexed
        mealType,
        currentMeal.name,
        userGoals,
        reason
      );

      if (response.success && response.newMeal) {
        // Update the meal in the plan
        const updatedWeeklyPlan = [...state.weeklyPlan];
        const updatedDayPlan = { ...updatedWeeklyPlan[dayIndex] };
        const mealIndex = updatedDayPlan.meals.findIndex(m => m.mealType === mealType);

        if (mealIndex !== -1) {
          updatedDayPlan.meals[mealIndex] = response.newMeal;

          // Recalculate day totals
          updatedDayPlan.dailyTotals = updatedDayPlan.meals.reduce(
            (acc, meal) => ({
              calories: acc.calories + meal.calories,
              protein: acc.protein + meal.protein,
              carbs: acc.carbs + meal.carbs,
              fat: acc.fat + meal.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );

          updatedWeeklyPlan[dayIndex] = updatedDayPlan;

          setState(prev => ({
            ...prev,
            weeklyPlan: updatedWeeklyPlan,
            isSwapping: false,
          }));

          // Update local cache
          const cacheData = {
            weeklyPlan: updatedWeeklyPlan,
            groceryList: state.groceryList,
            weekSummary: state.weekSummary,
            lastGeneratedAt: state.lastGeneratedAt,
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

          // *** Sync updated meal plan to backend ***
          try {
            console.log('[MealPlanContext] 🔄 Syncing swapped meal plan to backend...');
            const weekStart = updatedWeeklyPlan[0]?.date || new Date().toISOString().split('T')[0];
            const syncSuccess = await api.saveMealPlan(
              { weeklyPlan: updatedWeeklyPlan, groceryList: state.groceryList, weekSummary: state.weekSummary },
              weekStart
            );
            if (syncSuccess) {
              console.log('[MealPlanContext] ✅ Swapped meal plan synced to backend');
            }
          } catch (syncError) {
            console.error('[MealPlanContext] ❌ Backend sync error after swap:', syncError);
          }

          return true;
        }
      }

      setState(prev => ({ ...prev, isSwapping: false }));
      return false;
    } catch (error) {
      console.error('[MealPlanContext] Swap error:', error);
      setState(prev => ({ ...prev, isSwapping: false }));
      return false;
    }
  }, [state.weeklyPlan, state.groceryList, state.weekSummary, state.lastGeneratedAt, getUserGoals]);

  // Set selected day
  const setSelectedDay = useCallback((index: number) => {
    if (index >= 0 && index <= 6) {
      setState(prev => ({ ...prev, selectedDayIndex: index }));
    }
  }, []);

  // Clear the plan
  const clearPlan = useCallback(() => {
    setState(initialState);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  // Toggle grocery item checked state
  const toggleGroceryItem = useCallback((categoryIndex: number, itemIndex: number) => {
    let updatedGroceryList: GroceryCategory[] | null = null;

    setState(prev => {
      if (!prev.groceryList) return prev;

      const newGroceryList = [...prev.groceryList];
      const category = { ...newGroceryList[categoryIndex] };
      const items = [...category.items];

      items[itemIndex] = {
        ...items[itemIndex],
        checked: !items[itemIndex].checked,
      };

      category.items = items;
      newGroceryList[categoryIndex] = category;

      // Capture for cache/sync
      updatedGroceryList = newGroceryList;

      return { ...prev, groceryList: newGroceryList };
    });

    // Update cache with the new grocery list
    if (updatedGroceryList) {
      const cacheData = {
        weeklyPlan: state.weeklyPlan,
        groceryList: updatedGroceryList,
        weekSummary: state.weekSummary,
        lastGeneratedAt: state.lastGeneratedAt,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

      // Sync to backend database
      if (state.weeklyPlan && state.weeklyPlan.length > 0) {
        const weekStart = state.weeklyPlan[0]?.date || new Date().toISOString().split('T')[0];
        api.saveMealPlan(
          { weeklyPlan: state.weeklyPlan, groceryList: updatedGroceryList, weekSummary: state.weekSummary },
          weekStart
        ).catch(err => console.error('[MealPlanContext] Backend sync error after toggle:', err));
      }
    }
  }, [state.weeklyPlan, state.weekSummary, state.lastGeneratedAt]);

  // Delete a grocery item from the list
  const deleteGroceryItem = useCallback((categoryIndex: number, itemIndex: number) => {
    if (!state.groceryList) return;

    const updatedGroceryList = [...state.groceryList];
    const category = { ...updatedGroceryList[categoryIndex] };
    const items = [...category.items];

    // Remove the item from the array
    items.splice(itemIndex, 1);

    // If category is now empty, remove it entirely
    if (items.length === 0) {
      updatedGroceryList.splice(categoryIndex, 1);
    } else {
      category.items = items;
      updatedGroceryList[categoryIndex] = category;
    }

    setState(prev => ({ ...prev, groceryList: updatedGroceryList }));

    // Update cache
    const cacheData = {
      weeklyPlan: state.weeklyPlan,
      groceryList: updatedGroceryList,
      weekSummary: state.weekSummary,
      lastGeneratedAt: state.lastGeneratedAt,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

    // Sync to backend database
    if (state.weeklyPlan && state.weeklyPlan.length > 0) {
      const weekStart = state.weeklyPlan[0]?.date || new Date().toISOString().split('T')[0];
      api.saveMealPlan(
        { weeklyPlan: state.weeklyPlan, groceryList: updatedGroceryList, weekSummary: state.weekSummary },
        weekStart
      ).catch(err => console.error('[MealPlanContext] Backend sync error after delete:', err));
    }

    console.log('[MealPlanContext] 🗑️ Deleted grocery item and synced to database');
  }, [state.groceryList, state.weeklyPlan, state.weekSummary, state.lastGeneratedAt]);

  // NEW: Fetch ALL recipes for entire week in ONE AI call (much faster!)
  const generateGroceryListOnDemand = useCallback(async (budgetTier?: 'low' | 'medium' | 'high') => {
    console.log('[MealPlanContext] 🚀 generateGroceryListOnDemand called with budget:', budgetTier);
    console.log('[MealPlanContext] 📊 Current state:', {
      hasWeeklyPlan: !!state.weeklyPlan,
      planLength: state.weeklyPlan?.length,
      currentlyGenerating: state.isGeneratingGroceryList
    });

    if (!state.weeklyPlan || state.weeklyPlan.length === 0) {
      console.warn('[MealPlanContext] ❌ No meal plan available for grocery list generation');
      return;
    }

    console.log('[MealPlanContext] ✅ Setting isGeneratingGroceryList = true');
    setState(prev => ({ ...prev, isGeneratingGroceryList: true }));

    try {
      console.log('[MealPlanContext] 🛒 Fetching ALL recipes for 7-day meal plan in ONE AI call with budget:', budgetTier || 'medium');

      // Step 1: Collect all meals that need ingredients
      const mealsNeedingIngredients = [];
      const mealIndexMap = []; // Track where each meal is in the plan

      state.weeklyPlan.forEach((day, dayIndex) => {
        if (!day.meals || day.meals.length === 0) return;

        day.meals.forEach((meal, mealIndex) => {
          if (!meal.ingredients || meal.ingredients.length === 0) {
            mealsNeedingIngredients.push({
              dayName: day.dayName,
              mealType: meal.mealType,
              name: meal.name,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
            });
            mealIndexMap.push({ dayIndex, mealIndex });
          }
        });
      });

      if (mealsNeedingIngredients.length === 0) {
        console.log('[MealPlanContext] ✅ All meals already have ingredients, generating grocery list...');
        const groceryList = generateGroceryList(state.weeklyPlan);
        setState(prev => ({
          ...prev,
          groceryList,
          isGeneratingGroceryList: false,
        }));
        return;
      }

      // Step 2: Split meals into batches of 7 to avoid token limits
      const BATCH_SIZE = 7;
      const batches = [];
      for (let i = 0; i < mealsNeedingIngredients.length; i += BATCH_SIZE) {
        batches.push({
          meals: mealsNeedingIngredients.slice(i, i + BATCH_SIZE),
          indices: mealIndexMap.slice(i, i + BATCH_SIZE),
        });
      }

      console.log(`[MealPlanContext] 📋 Fetching ingredients in ${batches.length} batches of ${BATCH_SIZE} meals each...`);

      // Step 3: Fetch each batch sequentially with progress tracking
      const updatedWeeklyPlan = [...state.weeklyPlan];
      let totalIngredientsAdded = 0;
      let totalRecipesFetched = 0;

      for (let batchNum = 0; batchNum < batches.length; batchNum++) {
        const batch = batches[batchNum];

        // Update progress state
        setState(prev => ({
          ...prev,
          groceryListProgress: { current: batchNum + 1, total: batches.length }
        }));

        console.log(`[MealPlanContext] 🔄 Fetching batch ${batchNum + 1}/${batches.length} (${batch.meals.length} meals)...`);

        // Retry logic: try up to 3 times with exponential backoff
        let batchResponse = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !batchResponse) {
          attempts++;

          if (attempts > 1) {
            const waitTime = Math.pow(2, attempts - 1) * 1000; // 2s, 4s
            console.log(`[MealPlanContext] ⏳ Retry attempt ${attempts}/${maxAttempts} for batch ${batchNum + 1} (waiting ${waitTime}ms)...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          batchResponse = await api.getBatchRecipeDetails(batch.meals, budgetTier || 'medium');

          if (!batchResponse || !batchResponse.recipes) {
            if (attempts < maxAttempts) {
              console.warn(`[MealPlanContext] ⚠️ Batch ${batchNum + 1} attempt ${attempts} failed, retrying...`);
            } else {
              console.error(`[MealPlanContext] ❌ Batch ${batchNum + 1} failed after ${maxAttempts} attempts`);
            }
          }
        }

        if (!batchResponse || !batchResponse.recipes) {
          continue; // Skip failed batch but continue with others
        }

        // Update meal plan with this batch's recipes
        batchResponse.recipes.forEach((recipe, index) => {
          if (recipe && recipe.ingredients) {
            const { dayIndex, mealIndex } = batch.indices[index];
            const meal = updatedWeeklyPlan[dayIndex].meals[mealIndex];

            updatedWeeklyPlan[dayIndex].meals[mealIndex] = {
              ...meal,
              ingredients: recipe.ingredients,
              instructions: recipe.instructions || meal.instructions,
            };

            totalIngredientsAdded += recipe.ingredients.length;
            totalRecipesFetched++;
            console.log(`[MealPlanContext] ✅ ${updatedWeeklyPlan[dayIndex].dayName} ${meal.mealType}: ${recipe.ingredients.length} ingredients`);
          }
        });

        console.log(`[MealPlanContext] ✅ Batch ${batchNum + 1}/${batches.length} complete: ${batchResponse.recipes.length} recipes`);
      }

      console.log('[MealPlanContext] 📦 All batches complete:', {
        totalMealsFetched: totalRecipesFetched,
        totalIngredientsAdded,
        budgetTier: budgetTier || 'medium',
      });

      // Step 4: Generate grocery list from updated meal plan
      const groceryList = generateGroceryList(updatedWeeklyPlan);

      setState(prev => ({
        ...prev,
        weeklyPlan: updatedWeeklyPlan,
        groceryList,
        isGeneratingGroceryList: false,
        groceryListProgress: null, // Clear progress when complete
      }));

      console.log('[MealPlanContext] ✅ Generated grocery list:', {
        categories: groceryList.length,
        totalItems: groceryList.reduce((sum, cat) => sum + cat.items.length, 0),
      });

      // Step 5: Update cache
      const cacheData = {
        weeklyPlan: updatedWeeklyPlan,
        groceryList,
        weekSummary: state.weekSummary,
        lastGeneratedAt: state.lastGeneratedAt,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

      // Step 6: Sync grocery list to backend database for persistence
      try {
        console.log('[MealPlanContext] 🔄 Syncing grocery list to backend database...');
        const weekStart = updatedWeeklyPlan[0]?.date || new Date().toISOString().split('T')[0];
        const syncSuccess = await api.saveMealPlan(
          { weeklyPlan: updatedWeeklyPlan, groceryList, weekSummary: state.weekSummary },
          weekStart
        );
        if (syncSuccess) {
          console.log('[MealPlanContext] ✅ Grocery list synced to database');
        } else {
          console.warn('[MealPlanContext] ⚠️ Failed to sync grocery list to database');
        }
      } catch (syncError) {
        console.error('[MealPlanContext] ❌ Backend sync error:', syncError);
        // Don't fail the entire operation if sync fails
      }
    } catch (error) {
      console.error('[MealPlanContext] Grocery list generation error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate grocery list',
        isGeneratingGroceryList: false,
        groceryListProgress: null, // Clear progress on error
      }));
    }
  }, [state.weeklyPlan, state.weekSummary, state.lastGeneratedAt]);

  // UPDATED: Order with Instacart using API integration
  const orderWithInstacart = useCallback(async (filters?: {
    budgetTier?: 'low' | 'medium' | 'high';
    dietary?: string[];
  }) => {
    if (!state.groceryList || state.groceryList.length === 0) {
      console.warn('[MealPlanContext] No grocery list to order');
      return;
    }

    try {
      console.log('[MealPlanContext] 🛒 Creating Instacart cart with filters:', filters);

      // Try API first
      const result = await api.createInstacartCart(state.groceryList, filters);

      if (result && result.cart_url) {
        // Open Instacart URL in browser/app
        console.log('[MealPlanContext] ✅ Opening Instacart cart:', result.cart_url);
        const canOpen = await Linking.canOpenURL(result.cart_url);
        if (canOpen) {
          await Linking.openURL(result.cart_url);
          console.log('[MealPlanContext] ✅ Opened Instacart cart');
        } else {
          console.warn('[MealPlanContext] ⚠️ Cannot open Instacart URL');
          throw new Error('Cannot open Instacart URL');
        }
      } else {
        throw new Error('No cart URL returned from API');
      }
    } catch (error) {
      console.error('[MealPlanContext] Instacart API error:', error);

      // Fallback: Use existing deep link method
      try {
        console.log('[MealPlanContext] ⚠️ Fallback to deep link');
        await instacartService.openInstacart();
        console.log('[MealPlanContext] ✅ Opened Instacart via deep link');
      } catch (fallbackError) {
        console.error('[MealPlanContext] Deep link also failed:', fallbackError);
        throw new Error('Could not open Instacart');
      }
    }
  }, [state.groceryList]);

  // DEPRECATED: Keep for backward compatibility but use orderWithInstacart instead
  const openInstacart = useCallback(async (): Promise<boolean> => {
    await orderWithInstacart();
    return true;
  }, [orderWithInstacart]);

  // Background-save all meals from a loaded plan to saved_meals
  const autoSavePlanMeals = useCallback(async (weeklyPlan: DayPlan[]) => {
    try {
      console.log('[MealPlanContext] 💾 Auto-saving loaded plan meals to saved_meals...');
      let savedCount = 0;
      for (const day of weeklyPlan) {
        for (const meal of day.meals) {
          try {
            await api.saveMeal({
              mealName: meal.name,
              mealType: meal.mealType,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
              ingredients: meal.ingredients || [],
              recipe: meal.description || '',
              prepTimeMinutes: meal.prepTime || 15,
              photoUrl: meal.imageUrl || '',
              tags: [],
            });
            savedCount++;
          } catch {
            // Skip errors (duplicates, etc.)
          }
        }
      }
      console.log(`[MealPlanContext] ✅ Auto-saved ${savedCount} meals from loaded plan`);
    } catch (err) {
      console.error('[MealPlanContext] ❌ Auto-save error:', err);
    }
  }, []);

  // Load cached plan (local first, backend fallback)
  const loadCachedPlan = useCallback(async () => {
    try {
      // First try local cache
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);

        // Check if cached plan is still valid (generated within last 7 days)
        if (parsed.lastGeneratedAt) {
          const generatedDate = new Date(parsed.lastGeneratedAt);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - generatedDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff < 7) {
            console.log('[MealPlanContext] ✅ Loaded meal plan from local cache');
            setState(prev => ({
              ...prev,
              weeklyPlan: parsed.weeklyPlan,
              groceryList: parsed.groceryList,
              weekSummary: parsed.weekSummary,
              lastGeneratedAt: parsed.lastGeneratedAt,
            }));

            // Auto-save these meals to saved_meals in background
            if (parsed.weeklyPlan) {
              autoSavePlanMeals(parsed.weeklyPlan);
            }
            return;
          } else {
            // Clear old cache
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      }

      // No valid local cache - try backend
      console.log('[MealPlanContext] 🔄 No local cache, checking backend...');
      const backendPlan = await api.getMealPlan();
      if (backendPlan && backendPlan.planData) {
        console.log('[MealPlanContext] ✅ Loaded meal plan from backend');
        const { planData } = backendPlan;

        setState(prev => ({
          ...prev,
          weeklyPlan: planData.weeklyPlan || null,
          groceryList: planData.groceryList || [],
          weekSummary: planData.weekSummary || null,
          lastGeneratedAt: new Date().toISOString(),
        }));

        // Cache locally for offline access
        if (planData.weeklyPlan) {
          const cacheData = {
            weeklyPlan: planData.weeklyPlan,
            groceryList: planData.groceryList || [],
            weekSummary: planData.weekSummary,
            lastGeneratedAt: new Date().toISOString(),
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
          console.log('[MealPlanContext] ✅ Cached backend plan locally');

          // Auto-save these meals to saved_meals in background
          autoSavePlanMeals(planData.weeklyPlan);
        }
      } else {
        console.log('[MealPlanContext] No meal plan found (local or backend)');
      }
    } catch (error) {
      console.error('[MealPlanContext] Failed to load cache:', error);
    }
  }, [autoSavePlanMeals]);

  // Load cached plan on mount
  useEffect(() => {
    loadCachedPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Initialize selected day to today's day on mount
  useEffect(() => {
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    setState(prev => ({ ...prev, selectedDayIndex: currentDayIndex }));
  }, []); // Only run once on mount

  // Update a specific meal's recipe (ingredients + instructions) and persist to cache + backend
  const updateMealRecipe = useCallback((dayIndex: number, mealIndex: number, ingredients: any[], instructions: string[]) => {
    if (!state.weeklyPlan) return;

    setState(prev => {
      if (!prev.weeklyPlan) return prev;

      const updatedPlan = [...prev.weeklyPlan];
      const day = { ...updatedPlan[dayIndex] };
      const meals = [...day.meals];
      meals[mealIndex] = { ...meals[mealIndex], ingredients, instructions };
      day.meals = meals;
      updatedPlan[dayIndex] = day;

      // Persist to AsyncStorage
      const cacheData = {
        weeklyPlan: updatedPlan,
        groceryList: prev.groceryList,
        weekSummary: prev.weekSummary,
        lastGeneratedAt: prev.lastGeneratedAt,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData))
        .catch(err => console.error('[MealPlanContext] Cache save error after recipe update:', err));

      // Sync to backend (fire-and-forget)
      const weekStart = updatedPlan[0]?.date || new Date().toISOString().split('T')[0];
      api.saveMealPlan(
        { weeklyPlan: updatedPlan, groceryList: prev.groceryList, weekSummary: prev.weekSummary },
        weekStart
      ).catch(err => console.error('[MealPlanContext] Backend sync error after recipe update:', err));

      console.log(`[MealPlanContext] ✅ Recipe persisted for day ${dayIndex}, meal ${mealIndex}`);
      return { ...prev, weeklyPlan: updatedPlan };
    });
  }, [state.weeklyPlan]);

  const value = useMemo<MealPlanContextType>(() => ({
    state,
    generateMealPlan,
    swapMeal,
    setSelectedDay,
    clearPlan,
    toggleGroceryItem,
    deleteGroceryItem,
    openInstacart,
    loadCachedPlan,
    generateAIMealPlan,
    generateGroceryListOnDemand,
    orderWithInstacart,
    updateMealRecipe,
  }), [
    state,
    generateMealPlan,
    generateAIMealPlan,
    swapMeal,
    setSelectedDay,
    clearPlan,
    toggleGroceryItem,
    deleteGroceryItem,
    openInstacart,
    loadCachedPlan,
    generateGroceryListOnDemand,
    orderWithInstacart,
    updateMealRecipe,
  ]);

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
}
