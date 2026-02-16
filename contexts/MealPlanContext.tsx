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
}

const initialState: MealPlanState = {
  weeklyPlan: null,
  groceryList: null,
  weekSummary: null,
  isGenerating: false,
  isSwapping: false,
  isGeneratingGroceryList: false,
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
      const aiPreferences = {
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

        setState(prev => ({
          ...prev,
          weeklyPlan,
          groceryList: [], // AI plan doesn't include grocery list yet
          weekSummary: calculatedWeekSummary,
          isGenerating: false,
          error: null,
          lastGeneratedAt: now,
        }));

        // Cache the plan locally
        const cacheData = {
          weeklyPlan,
          groceryList: [],
          weekSummary: calculatedWeekSummary,
          lastGeneratedAt: now,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

        // *** Sync AI meal plan to backend ***
        try {
          console.log('[MealPlanContext] 🔄 Syncing AI meal plan to backend...');
          const weekStart = weeklyPlan[0]?.date || new Date().toISOString().split('T')[0];
          const syncSuccess = await api.saveMealPlan(
            { weeklyPlan, groceryList: [], weekSummary: calculatedWeekSummary },
            weekStart,
            preferences.dietStyle
          );
          if (syncSuccess) {
            console.log('[MealPlanContext] ✅ AI meal plan synced to backend');
          } else {
            console.warn('[MealPlanContext] ⚠️ Backend sync failed - plan saved locally');
          }
        } catch (syncError) {
          console.error('[MealPlanContext] ❌ Backend sync error:', syncError);
        }

        // *** Background: Auto-save meals FIRST, then generate images ***
        (async () => {
          try {
            // STEP 1: Save all meals to saved_meals IMMEDIATELY (no images yet)
            console.log('[MealPlanContext] 💾 Auto-saving all meals to saved meals...');
            let savedCount = 0;
            for (const day of weeklyPlan) {
              for (const meal of day.meals) {
                try {
                  // Save directly to backend (skip aiService.saveMeal which reads ALL saved meals each time)
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
                    photoUrl: '',
                    tags: [],
                  });
                  savedCount++;
                } catch (saveErr) {
                  // Skip errors (e.g. duplicates)
                }
              }
            }
            console.log(`[MealPlanContext] ✅ Saved ${savedCount} meals to saved_meals`);

            // STEP 2: Generate images for all meals (this takes a while)
            console.log('[MealPlanContext] 🖼️ Starting background image generation...');
            const updatedPlan = [...weeklyPlan];
            let imagesGenerated = 0;

            for (let dayIdx = 0; dayIdx < updatedPlan.length; dayIdx++) {
              const day = updatedPlan[dayIdx];
              for (let mealIdx = 0; mealIdx < day.meals.length; mealIdx++) {
                const meal = day.meals[mealIdx];
                if (meal.imageUrl) {
                  imagesGenerated++;
                  continue;
                }
                try {
                  const imageUrl = await pexelsService.searchFoodPhoto(meal.name, 'card');
                  if (imageUrl) {
                    updatedPlan[dayIdx] = {
                      ...updatedPlan[dayIdx],
                      meals: updatedPlan[dayIdx].meals.map((m, idx) =>
                        idx === mealIdx ? { ...m, imageUrl } : m
                      ),
                    };
                    imagesGenerated++;
                    console.log(`[MealPlanContext] 🖼️ Image ${imagesGenerated}: ${meal.name}`);

                    // Update state progressively so MealCards show images as they arrive
                    setState(prev => {
                      if (!prev.weeklyPlan) return prev;
                      const newPlan = [...prev.weeklyPlan];
                      newPlan[dayIdx] = {
                        ...newPlan[dayIdx],
                        meals: newPlan[dayIdx].meals.map((m, idx) =>
                          idx === mealIdx ? { ...m, imageUrl } : m
                        ),
                      };
                      return { ...prev, weeklyPlan: newPlan };
                    });
                  }
                } catch (imgErr) {
                  console.error(`[MealPlanContext] ❌ Image error for ${meal.name}:`, imgErr);
                }
              }
            }

            // STEP 3: Re-cache locally with images
            const updatedCache = {
              weeklyPlan: updatedPlan,
              groceryList: [],
              weekSummary: calculatedWeekSummary,
              lastGeneratedAt: now,
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCache));

            // Re-sync plan with images to backend
            try {
              const weekStart = updatedPlan[0]?.date || new Date().toISOString().split('T')[0];
              await api.saveMealPlan(
                { weeklyPlan: updatedPlan, groceryList: [], weekSummary: calculatedWeekSummary },
                weekStart,
                preferences.dietStyle
              );
            } catch {}

            // STEP 4: Update saved_meals with photo URLs
            console.log('[MealPlanContext] 🖼️ Updating saved meals with photo URLs...');
            for (const day of updatedPlan) {
              for (const meal of day.meals) {
                if (meal.imageUrl) {
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
                      photoUrl: meal.imageUrl,
                      tags: [],
                    });
                  } catch {}
                }
              }
            }

            console.log(`[MealPlanContext] ✅ Background complete: ${imagesGenerated} images generated`);
          } catch (bgError) {
            console.error('[MealPlanContext] ❌ Background task error:', bgError);
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
    if (!state.groceryList) return;

    const updatedGroceryList = [...state.groceryList];
    const category = { ...updatedGroceryList[categoryIndex] };
    const items = [...category.items];

    items[itemIndex] = {
      ...items[itemIndex],
      checked: !items[itemIndex].checked,
    };

    category.items = items;
    updatedGroceryList[categoryIndex] = category;

    setState(prev => ({ ...prev, groceryList: updatedGroceryList }));

    // Update cache
    const cacheData = {
      weeklyPlan: state.weeklyPlan,
      groceryList: updatedGroceryList,
      weekSummary: state.weekSummary,
      lastGeneratedAt: state.lastGeneratedAt,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
  }, [state.groceryList, state.weeklyPlan, state.weekSummary, state.lastGeneratedAt]);

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

    console.log('[MealPlanContext] 🗑️ Deleted grocery item');
  }, [state.groceryList, state.weeklyPlan, state.weekSummary, state.lastGeneratedAt]);

  // NEW: Fetch ALL recipes for entire week and generate grocery list with budget awareness
  const generateGroceryListOnDemand = useCallback(async (budgetTier?: 'low' | 'medium' | 'high') => {
    if (!state.weeklyPlan || state.weeklyPlan.length === 0) {
      console.warn('[MealPlanContext] No meal plan available for grocery list generation');
      return;
    }

    setState(prev => ({ ...prev, isGeneratingGroceryList: true }));

    try {
      console.log('[MealPlanContext] 🛒 Fetching ALL recipes for 7-day meal plan with budget:', budgetTier || 'none');

      // Step 1: Fetch recipe details for ALL meals across all 7 days
      const updatedWeeklyPlan = [...state.weeklyPlan];
      let totalMealsFetched = 0;
      let totalIngredientsAdded = 0;

      for (let dayIndex = 0; dayIndex < updatedWeeklyPlan.length; dayIndex++) {
        const day = updatedWeeklyPlan[dayIndex];
        if (!day.meals || day.meals.length === 0) continue;

        for (let mealIndex = 0; mealIndex < day.meals.length; mealIndex++) {
          const meal = day.meals[mealIndex];

          // Skip if meal already has ingredients
          if (meal.ingredients && meal.ingredients.length > 0) {
            console.log(`[MealPlanContext] ✓ ${day.dayName} ${meal.mealType}: Already has ${meal.ingredients.length} ingredients`);
            totalIngredientsAdded += meal.ingredients.length;
            continue;
          }

          // Fetch recipe details from AI with budget tier
          console.log(`[MealPlanContext] 🔄 Fetching recipe for: ${day.dayName} ${meal.mealType} - ${meal.name}`);
          const recipeDetails = await api.getRecipeDetails(meal.name, {
            ...meal,
            budgetTier: budgetTier || 'medium',
          });

          if (recipeDetails && recipeDetails.ingredients) {
            updatedWeeklyPlan[dayIndex].meals[mealIndex] = {
              ...meal,
              ingredients: recipeDetails.ingredients,
              instructions: recipeDetails.instructions || meal.instructions,
            };
            totalMealsFetched++;
            totalIngredientsAdded += recipeDetails.ingredients.length;
            console.log(`[MealPlanContext] ✅ Fetched ${recipeDetails.ingredients.length} ingredients for ${meal.name}`);
          } else {
            console.warn(`[MealPlanContext] ⚠️ Failed to fetch recipe for ${meal.name}`);
          }
        }
      }

      console.log('[MealPlanContext] 📦 Recipe fetch complete:', {
        totalMealsFetched,
        totalIngredientsAdded,
        budgetTier: budgetTier || 'medium',
      });

      // Step 2: Generate grocery list from updated meal plan
      const groceryList = generateGroceryList(updatedWeeklyPlan);

      setState(prev => ({
        ...prev,
        weeklyPlan: updatedWeeklyPlan,
        groceryList,
        isGeneratingGroceryList: false,
      }));

      console.log('[MealPlanContext] ✅ Generated grocery list:', {
        categories: groceryList.length,
        totalItems: groceryList.reduce((sum, cat) => sum + cat.items.length, 0),
      });

      // Step 3: Update cache with new grocery list and updated meal plan
      const cacheData = {
        weeklyPlan: updatedWeeklyPlan,
        groceryList,
        weekSummary: state.weekSummary,
        lastGeneratedAt: state.lastGeneratedAt,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[MealPlanContext] Grocery list generation error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate grocery list',
        isGeneratingGroceryList: false,
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
