import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { mealPlanService } from '../services/mealPlanService';
import { instacartService } from '../services/instacartService';
import { aiService } from '../services/aiService';
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
  openInstacart: () => Promise<boolean>;
  loadCachedPlan: () => Promise<void>;
}

const initialState: MealPlanState = {
  weeklyPlan: null,
  groceryList: null,
  weekSummary: null,
  isGenerating: false,
  isSwapping: false,
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
    // First try context
    if (foodPrefsContext?.preferences) {
      return foodPrefsContext.preferences;
    }
    // Fallback to direct storage read
    try {
      const stored = await AsyncStorage.getItem(FOOD_PREFS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[MealPlanContext] Error loading food preferences:', error);
    }
    return null;
  }, [foodPrefsContext]);

  // Get preferences from GoalWizard context or use defaults
  const getPreferences = useCallback((): MealPlanPreferences => {
    if (goalWizardContext?.state) {
      const { dietStyle, allergies, mealsPerDay, intermittentFasting, fastingStart, fastingEnd } = goalWizardContext.state;

      // Map diet style to dietary restrictions
      const dietaryRestrictions: string[] = [];
      if (dietStyle === 'vegetarian') dietaryRestrictions.push('vegetarian');
      if (dietStyle === 'vegan') dietaryRestrictions.push('vegan');
      if (dietStyle === 'keto') dietaryRestrictions.push('low-carb');

      return {
        dietaryRestrictions,
        cuisinePreferences: [],
        allergies: allergies || [],
        mealsPerDay: mealsPerDay || 3,
        dietStyle: dietStyle || 'standard',
        intermittentFasting: intermittentFasting || false,
        fastingStart: fastingStart || '12:00',
        fastingEnd: fastingEnd || '20:00',
      };
    }

    // Default preferences
    return {
      dietaryRestrictions: [],
      cuisinePreferences: [],
      allergies: [],
      mealsPerDay: 3,
      dietStyle: 'standard',
      intermittentFasting: false,
      fastingStart: '12:00',
      fastingEnd: '20:00',
    };
  }, [goalWizardContext]);

  // Get user goals from API
  const getUserGoals = useCallback(async (): Promise<UserGoalsForMealPlan> => {
    try {
      const goals = await api.getGoals();
      if (goals) {
        return {
          dailyCalories: goals.dailyCalories || 2000,
          dailyProtein: goals.dailyProtein || 150,
          dailyCarbs: goals.dailyCarbs || 200,
          dailyFat: goals.dailyFat || 65,
        };
      }
    } catch (error) {
      console.error('[MealPlanContext] Failed to get goals:', error);
    }

    // Default goals
    return {
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyCarbs: 200,
      dailyFat: 65,
    };
  }, []);

  // Generate a new 7-day meal plan
  const generateMealPlan = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const userGoals = await getUserGoals();
      const preferences = getPreferences();

      // Get start date (today)
      const startDate = new Date().toISOString().split('T')[0];

      console.log('[MealPlanContext] Generating meal plan with:');
      console.log('Goals:', userGoals);
      console.log('Preferences:', preferences);

      const response = await mealPlanService.generateMealPlan(userGoals, preferences, startDate);

      if (response.success) {
        const now = new Date().toISOString();

        setState(prev => ({
          ...prev,
          weeklyPlan: response.weeklyPlan,
          groceryList: response.groceryList,
          weekSummary: response.weekSummary,
          isGenerating: false,
          error: null,
          lastGeneratedAt: now,
        }));

        // Cache the plan
        const cacheData = {
          weeklyPlan: response.weeklyPlan,
          groceryList: response.groceryList,
          weekSummary: response.weekSummary,
          lastGeneratedAt: now,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: response.error || 'Failed to generate meal plan',
        }));
        return false;
      }
    } catch (error) {
      console.error('[MealPlanContext] Generate error:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
      return false;
    }
  }, [getUserGoals, getPreferences]);

  // Generate AI-powered meal plan using OpenAI
  const generateAIMealPlan = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const userGoals = await getUserGoals();
      const preferences = getPreferences();
      const foodPrefs = await getFoodPreferences();

      console.log('[MealPlanContext] Generating AI meal plan with:');
      console.log('Goals:', userGoals);
      console.log('Preferences:', preferences);
      console.log('Food Preferences:', foodPrefs);

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

      const aiPlan = await aiService.generateAIMealPlan(aiPreferences, 7);

      if (aiPlan) {
        // Convert AI plan to app format - always start from Sunday of current week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Calculate Sunday of the current week
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
            date: planDate.toISOString().split('T')[0],
            dayName: dayNames[index], // Use index directly since we start from Sunday
            meals: day.meals.map((meal: any) => ({
            id: `ai-meal-${Date.now()}-${Math.random()}`,
            mealType: meal.mealType.toLowerCase(),
            name: meal.dishName,
            description: meal.description,
            calories: meal.calories,
            protein: meal.macros.protein,
            carbs: meal.macros.carbs,
            fat: meal.macros.fat,
            servings: meal.servings,
            prepTime: 15,
            cookTime: 20,
            imageUrl: meal.imageUrl,
            ingredients: [],
            instructions: [],
          })),
          dailyTotals: {
            calories: day.meals.reduce((sum: number, m: any) => sum + m.calories, 0),
            protein: day.meals.reduce((sum: number, m: any) => sum + m.macros.protein, 0),
            carbs: day.meals.reduce((sum: number, m: any) => sum + m.macros.carbs, 0),
            fat: day.meals.reduce((sum: number, m: any) => sum + m.macros.fat, 0),
          },
        };
        });

        const now = new Date().toISOString();

        setState(prev => ({
          ...prev,
          weeklyPlan,
          groceryList: [], // AI plan doesn't include grocery list yet
          weekSummary: {
            avgDailyCalories: userGoals.dailyCalories,
            avgDailyProtein: userGoals.dailyProtein,
            avgDailyCarbs: userGoals.dailyCarbs,
            avgDailyFat: userGoals.dailyFat,
            totalMeals: weeklyPlan.reduce((sum, day) => sum + day.meals.length, 0),
          },
          isGenerating: false,
          error: null,
          lastGeneratedAt: now,
        }));

        // Cache the plan
        const cacheData = {
          weeklyPlan,
          groceryList: [],
          weekSummary: {
            avgDailyCalories: userGoals.dailyCalories,
            avgDailyProtein: userGoals.dailyProtein,
            avgDailyCarbs: userGoals.dailyCarbs,
            avgDailyFat: userGoals.dailyFat,
            totalMeals: weeklyPlan.reduce((sum, day) => sum + day.meals.length, 0),
          },
          lastGeneratedAt: now,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

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

          // Update cache
          const cacheData = {
            weeklyPlan: updatedWeeklyPlan,
            groceryList: state.groceryList,
            weekSummary: state.weekSummary,
            lastGeneratedAt: state.lastGeneratedAt,
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

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

  // Open Instacart
  const openInstacart = useCallback(async (): Promise<boolean> => {
    if (!state.groceryList) return false;

    try {
      // Create list name from current date
      const now = new Date();
      const listName = `Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      // Try to create Instacart list through API
      const response = await mealPlanService.createInstacartList(state.groceryList, listName);

      if (response.success && response.instacartUrl) {
        return await instacartService.openInstacart(response.instacartUrl);
      }

      // Fallback: just open Instacart
      return await instacartService.openInstacart();
    } catch (error) {
      console.error('[MealPlanContext] Instacart error:', error);
      // Try to open Instacart anyway
      return await instacartService.openInstacart();
    }
  }, [state.groceryList]);

  // Load cached plan on mount
  const loadCachedPlan = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);

        // Check if cached plan is still valid (generated within last 7 days)
        if (parsed.lastGeneratedAt) {
          const generatedDate = new Date(parsed.lastGeneratedAt);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - generatedDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff < 7) {
            setState(prev => ({
              ...prev,
              weeklyPlan: parsed.weeklyPlan,
              groceryList: parsed.groceryList,
              weekSummary: parsed.weekSummary,
              lastGeneratedAt: parsed.lastGeneratedAt,
            }));
          } else {
            // Clear old cache
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.error('[MealPlanContext] Failed to load cache:', error);
    }
  }, []);

  // Load cached plan on mount
  useEffect(() => {
    loadCachedPlan();
  }, [loadCachedPlan]);

  const value = useMemo<MealPlanContextType>(() => ({
    state,
    generateMealPlan,
    swapMeal,
    setSelectedDay,
    clearPlan,
    toggleGroceryItem,
    openInstacart,
    loadCachedPlan,
    generateAIMealPlan,
  }), [
    state,
    generateMealPlan,
    generateAIMealPlan,
    swapMeal,
    setSelectedDay,
    clearPlan,
    toggleGroceryItem,
    openInstacart,
    loadCachedPlan,
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
