// Smart Meal Logger Context
// Provides state management for the Smart Meal Logger Agent

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  SmartMealLoggerState,
  FrequentMeal,
  MealSuggestion,
  QuickLogEntry,
} from '../types/smartMealLogger';
import { smartMealLoggerStorage } from '../services/smartMealLoggerStorage';
import {
  generateMealSuggestions,
  logMealAndLearn,
  getFavoriteMeals,
  getRecentMeals,
  searchMeals,
  getMealInsights,
  getMealTypeForCurrentTime,
} from '../services/smartMealLoggerService';
import { useAdaptiveTDEE } from './AdaptiveTDEEContext';
import { api } from '../services/api';

interface SmartMealLoggerContextType {
  // State
  state: SmartMealLoggerState;

  // Suggestions
  refreshSuggestions: (mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack') => Promise<void>;
  getSuggestions: () => MealSuggestion[];

  // Quick logging
  quickLogMeal: (frequentMeal: FrequentMeal, date?: string) => Promise<void>;
  logNewMeal: (meal: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    imageUrl?: string;
    source: 'manual' | 'ai' | 'barcode' | 'photo';
  }) => Promise<FrequentMeal>;

  // Favorites & Recent
  getFavorites: () => Promise<FrequentMeal[]>;
  getRecent: () => Promise<FrequentMeal[]>;
  searchMeals: (query: string) => Promise<FrequentMeal[]>;
  deleteFavorite: (mealId: string) => Promise<void>;

  // Insights
  getInsights: () => Promise<{
    totalMealsLogged: number;
    favoriteMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
    averageCaloriesPerMeal: number;
    mostActiveDayOfWeek: number;
    uniqueMealsLogged: number;
  }>;

  // Utilities
  getCurrentMealType: () => 'breakfast' | 'lunch' | 'dinner' | 'snack';
  refreshData: () => Promise<void>;
}

const initialState: SmartMealLoggerState = {
  frequentMeals: [],
  mealPatterns: [],
  suggestions: [],
  recentQuickLogs: [],
  isLoading: false,
  lastSyncDate: null,
};

const SmartMealLoggerContext = createContext<SmartMealLoggerContextType | undefined>(undefined);

export function SmartMealLoggerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SmartMealLoggerState>(initialState);
  const initRef = useRef(false);

  // Get Adaptive TDEE context for calorie logging
  let logCalories: ((calories: number) => Promise<void>) | null = null;
  try {
    const tdeeContext = useAdaptiveTDEE();
    logCalories = async (calories: number) => {
      await tdeeContext.logCalories(calories, 0, 1);
    };
  } catch {
    // TDEE context may not be available
  }

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      console.log('[SmartMealLogger] Loading initial data...');

      const [frequentMeals, mealPatterns, lastSync] = await Promise.all([
        smartMealLoggerStorage.getFrequentMeals(),
        smartMealLoggerStorage.getMealPatterns(),
        smartMealLoggerStorage.getLastSyncDate(),
      ]);

      // Generate initial suggestions
      const suggestions = await generateMealSuggestions();

      setState({
        frequentMeals,
        mealPatterns,
        suggestions,
        recentQuickLogs: [],
        isLoading: false,
        lastSyncDate: lastSync,
      });

      console.log('[SmartMealLogger] Initial data loaded:', {
        frequentMeals: frequentMeals.length,
        patterns: mealPatterns.length,
        suggestions: suggestions.length,
      });
    } catch (error) {
      console.error('[SmartMealLogger] Error loading initial data:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      loadInitialData();
    }
  }, [loadInitialData]);

  // Refresh suggestions
  const refreshSuggestions = useCallback(
    async (mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
      try {
        const suggestions = await generateMealSuggestions(mealType);
        setState((prev) => ({ ...prev, suggestions }));
      } catch (error) {
        console.error('[SmartMealLogger] Error refreshing suggestions:', error);
      }
    },
    []
  );

  // Get current suggestions
  const getSuggestions = useCallback(() => {
    return state.suggestions;
  }, [state.suggestions]);

  // Quick log a meal from favorites
  const quickLogMeal = useCallback(
    async (frequentMeal: FrequentMeal, date?: string) => {
      try {
        const logDate = date || new Date().toISOString().split('T')[0];
        const now = new Date();

        // Log to backend
        const mealData = {
          date: logDate,
          mealType: frequentMeal.mealType,
          name: frequentMeal.name,
          calories: frequentMeal.calories,
          protein: frequentMeal.protein,
          carbs: frequentMeal.carbs,
          fat: frequentMeal.fat,
          time: now.toISOString(),
        };

        await api.logMeal(mealData);

        // Update learning
        await logMealAndLearn({
          name: frequentMeal.name,
          calories: frequentMeal.calories,
          protein: frequentMeal.protein,
          carbs: frequentMeal.carbs,
          fat: frequentMeal.fat,
          mealType: frequentMeal.mealType,
          imageUrl: frequentMeal.imageUrl,
          source: frequentMeal.source,
        });

        // Log to TDEE if available
        if (logCalories) {
          try {
            await logCalories(frequentMeal.calories);
          } catch {
            console.warn('[SmartMealLogger] Failed to log to TDEE');
          }
        }

        // Add to recent quick logs
        const quickLog: QuickLogEntry = {
          id: `${Date.now()}`,
          frequentMealId: frequentMeal.id,
          date: logDate,
          time: now.toISOString(),
          mealType: frequentMeal.mealType,
          calories: frequentMeal.calories,
          protein: frequentMeal.protein,
          carbs: frequentMeal.carbs,
          fat: frequentMeal.fat,
        };

        setState((prev) => ({
          ...prev,
          recentQuickLogs: [quickLog, ...prev.recentQuickLogs.slice(0, 9)],
        }));

        // Refresh suggestions after logging
        await refreshSuggestions();

        console.log('[SmartMealLogger] Quick logged meal:', frequentMeal.name);
      } catch (error) {
        console.error('[SmartMealLogger] Error quick logging meal:', error);
        throw error;
      }
    },
    [logCalories, refreshSuggestions]
  );

  // Log a new meal (from AI analysis)
  const logNewMeal = useCallback(
    async (meal: {
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      imageUrl?: string;
      source: 'manual' | 'ai' | 'barcode' | 'photo';
    }): Promise<FrequentMeal> => {
      // Update learning
      const frequentMeal = await logMealAndLearn(meal);

      // Log to TDEE if available
      if (logCalories) {
        try {
          await logCalories(meal.calories);
        } catch {
          console.warn('[SmartMealLogger] Failed to log to TDEE');
        }
      }

      // Refresh frequent meals in state
      const updatedMeals = await smartMealLoggerStorage.getFrequentMeals();
      setState((prev) => ({
        ...prev,
        frequentMeals: updatedMeals,
      }));

      // Refresh suggestions after logging
      await refreshSuggestions();

      return frequentMeal;
    },
    [logCalories, refreshSuggestions]
  );

  // Get favorites
  const getFavorites = useCallback(async () => {
    return getFavoriteMeals(20);
  }, []);

  // Get recent
  const getRecent = useCallback(async () => {
    return getRecentMeals(10);
  }, []);

  // Search meals
  const handleSearchMeals = useCallback(async (query: string) => {
    return searchMeals(query);
  }, []);

  // Delete favorite
  const deleteFavorite = useCallback(async (mealId: string) => {
    await smartMealLoggerStorage.deleteFrequentMeal(mealId);
    const updatedMeals = await smartMealLoggerStorage.getFrequentMeals();
    setState((prev) => ({
      ...prev,
      frequentMeals: updatedMeals,
    }));
    await refreshSuggestions();
  }, [refreshSuggestions]);

  // Get insights
  const getInsights = useCallback(async () => {
    return getMealInsights();
  }, []);

  // Get current meal type
  const getCurrentMealType = useCallback(() => {
    return getMealTypeForCurrentTime();
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const value = useMemo<SmartMealLoggerContextType>(() => ({
    state,
    refreshSuggestions,
    getSuggestions,
    quickLogMeal,
    logNewMeal,
    getFavorites,
    getRecent,
    searchMeals: handleSearchMeals,
    deleteFavorite,
    getInsights,
    getCurrentMealType,
    refreshData,
  }), [
    state,
    refreshSuggestions,
    getSuggestions,
    quickLogMeal,
    logNewMeal,
    getFavorites,
    getRecent,
    handleSearchMeals,
    deleteFavorite,
    getInsights,
    getCurrentMealType,
    refreshData,
  ]);

  return (
    <SmartMealLoggerContext.Provider value={value}>{children}</SmartMealLoggerContext.Provider>
  );
}

export function useSmartMealLogger() {
  const context = useContext(SmartMealLoggerContext);
  if (!context) {
    throw new Error('useSmartMealLogger must be used within a SmartMealLoggerProvider');
  }
  return context;
}

export default SmartMealLoggerContext;
