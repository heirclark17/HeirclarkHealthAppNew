// Adaptive TDEE Context
// Provides state management for the Adaptive TDEE Agent

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  AdaptiveTDEEState,
  AdaptiveTDEEResult,
  BodyWeightLog,
  DailyCalorieLog,
  TDEE_CONSTANTS,
} from '../types/adaptiveTDEE';
import { adaptiveTDEEStorage } from '../services/adaptiveTDEEStorage';
import { calculateAdaptiveTDEE, recalculateTDEEIfNeeded } from '../services/adaptiveTDEEService';
import { useGoalWizard } from './GoalWizardContext';

interface AdaptiveTDEEContextType {
  // State
  state: AdaptiveTDEEState;

  // Weight logging
  logWeight: (weight: number, unit: 'lb' | 'kg', source?: BodyWeightLog['source']) => Promise<void>;
  getLatestWeight: () => Promise<BodyWeightLog | null>;

  // Calorie logging
  logCalories: (calories: number, caloriesBurned?: number, mealsLogged?: number) => Promise<void>;
  updateCalories: (updates: Partial<DailyCalorieLog>) => Promise<void>;
  markDayComplete: () => Promise<void>;

  // TDEE calculation
  recalculateTDEE: () => Promise<void>;
  getRecommendedCalories: () => number;

  // Data access
  getWeightHistory: (days?: number) => Promise<BodyWeightLog[]>;
  getCalorieHistory: (days?: number) => Promise<DailyCalorieLog[]>;
  getDataQualityMetrics: () => Promise<{
    totalWeightLogs: number;
    totalCalorieLogs: number;
    daysWithBothLogs: number;
    isReadyForCalculation: boolean;
    daysUntilReady: number;
  }>;

  // Utilities
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const initialState: AdaptiveTDEEState = {
  result: null,
  weightHistory: [],
  calorieHistory: [],
  isCalculating: false,
  isEnabled: false,
  daysUntilReady: TDEE_CONSTANTS.MIN_DAYS_FOR_CALCULATION,
  lastSyncDate: null,
};

const AdaptiveTDEEContext = createContext<AdaptiveTDEEContextType | undefined>(undefined);

export function AdaptiveTDEEProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdaptiveTDEEState>(initialState);
  const { state: goalState } = useGoalWizard();
  const initRef = useRef(false);

  // Get user profile from goal wizard
  const getUserProfile = useCallback(() => {
    const weightLbs = goalState.weightUnit === 'kg'
      ? goalState.currentWeight * 2.20462
      : goalState.currentWeight;

    const heightCm = goalState.heightUnit === 'cm'
      ? goalState.heightCm
      : (goalState.heightFt * 12 + goalState.heightIn) * 2.54;

    let goalType: 'lose' | 'maintain' | 'gain' = 'maintain';
    if (goalState.primaryGoal === 'lose_weight') goalType = 'lose';
    else if (goalState.primaryGoal === 'build_muscle') goalType = 'gain';

    // Calculate target weekly change based on goal
    let targetWeeklyChange = 0;
    if (goalType === 'lose') {
      targetWeeklyChange = -1; // Default to 1 lb/week loss
    } else if (goalType === 'gain') {
      targetWeeklyChange = 0.5; // Default to 0.5 lb/week gain
    }

    return {
      age: goalState.age || 30,
      sex: goalState.sex || 'male',
      heightCm,
      activityLevel: goalState.activityLevel || 'moderate',
      goalType,
      targetWeeklyChange,
    };
  }, [goalState]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      console.log('[AdaptiveTDEE] Loading initial data...');

      const [weightHistory, calorieHistory, existingResult, metrics] = await Promise.all([
        adaptiveTDEEStorage.getWeightHistory(),
        adaptiveTDEEStorage.getCalorieHistory(),
        adaptiveTDEEStorage.getTDEEResult(),
        adaptiveTDEEStorage.getDataQualityMetrics(),
      ]);

      setState((prev) => ({
        ...prev,
        weightHistory,
        calorieHistory,
        result: existingResult,
        isEnabled: metrics.isReadyForCalculation,
        daysUntilReady: metrics.daysUntilReady,
        lastSyncDate: new Date().toISOString(),
      }));

      console.log('[AdaptiveTDEE] Initial data loaded:', {
        weightLogs: weightHistory.length,
        calorieLogs: calorieHistory.length,
        hasExistingResult: !!existingResult,
        isReady: metrics.isReadyForCalculation,
      });
    } catch (error) {
      console.error('[AdaptiveTDEE] Error loading initial data:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      loadInitialData();
    }
  }, [loadInitialData]);

  // Log weight
  const logWeight = useCallback(
    async (weight: number, unit: 'lb' | 'kg', source: BodyWeightLog['source'] = 'manual') => {
      try {
        console.log('[AdaptiveTDEE] Logging weight:', { weight, unit, source });

        const newLog = await adaptiveTDEEStorage.logWeight(weight, unit, source);

        setState((prev) => {
          const updatedHistory = [newLog, ...prev.weightHistory.filter((l) => l.id !== newLog.id)];
          return {
            ...prev,
            weightHistory: updatedHistory.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
          };
        });

        // Trigger recalculation if we have enough data
        const metrics = await adaptiveTDEEStorage.getDataQualityMetrics();
        if (metrics.isReadyForCalculation) {
          await recalculateTDEE();
        } else {
          setState((prev) => ({
            ...prev,
            isEnabled: false,
            daysUntilReady: metrics.daysUntilReady,
          }));
        }
      } catch (error) {
        console.error('[AdaptiveTDEE] Error logging weight:', error);
        throw error;
      }
    },
    []
  );

  // Get latest weight
  const getLatestWeight = useCallback(async (): Promise<BodyWeightLog | null> => {
    return adaptiveTDEEStorage.getLatestWeight();
  }, []);

  // Log calories
  const logCalories = useCallback(
    async (calories: number, caloriesBurned: number = 0, mealsLogged: number = 1) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        console.log('[AdaptiveTDEE] Logging calories:', { calories, caloriesBurned, mealsLogged });

        // Get existing log for today
        const existingLog = await adaptiveTDEEStorage.getCaloriesForDate(today);

        if (existingLog) {
          // Add to existing calories
          const newCalories = existingLog.caloriesConsumed + calories;
          const newBurned = existingLog.caloriesBurned + caloriesBurned;
          const newMeals = existingLog.mealsLogged + mealsLogged;

          await adaptiveTDEEStorage.updateDailyCalories(today, {
            caloriesConsumed: newCalories,
            caloriesBurned: newBurned,
            mealsLogged: newMeals,
          });
        } else {
          await adaptiveTDEEStorage.logDailyCalories(today, calories, caloriesBurned, mealsLogged, false);
        }

        // Refresh calorie history
        const updatedHistory = await adaptiveTDEEStorage.getCalorieHistory();
        setState((prev) => ({
          ...prev,
          calorieHistory: updatedHistory,
        }));

        // Check if ready for calculation
        const metrics = await adaptiveTDEEStorage.getDataQualityMetrics();
        if (metrics.isReadyForCalculation && !state.isEnabled) {
          await recalculateTDEE();
        }
      } catch (error) {
        console.error('[AdaptiveTDEE] Error logging calories:', error);
        throw error;
      }
    },
    [state.isEnabled]
  );

  // Update calories for today
  const updateCalories = useCallback(async (updates: Partial<DailyCalorieLog>) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await adaptiveTDEEStorage.updateDailyCalories(today, updates);

      const updatedHistory = await adaptiveTDEEStorage.getCalorieHistory();
      setState((prev) => ({
        ...prev,
        calorieHistory: updatedHistory,
      }));
    } catch (error) {
      console.error('[AdaptiveTDEE] Error updating calories:', error);
      throw error;
    }
  }, []);

  // Mark today as complete
  const markDayComplete = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await adaptiveTDEEStorage.updateDailyCalories(today, { isComplete: true });

      const updatedHistory = await adaptiveTDEEStorage.getCalorieHistory();
      setState((prev) => ({
        ...prev,
        calorieHistory: updatedHistory,
      }));
    } catch (error) {
      console.error('[AdaptiveTDEE] Error marking day complete:', error);
    }
  }, []);

  // Recalculate TDEE
  const recalculateTDEE = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isCalculating: true }));
      console.log('[AdaptiveTDEE] Recalculating TDEE...');

      const userProfile = getUserProfile();
      const weightHistory = await adaptiveTDEEStorage.getWeightHistory();
      const calorieHistory = await adaptiveTDEEStorage.getCalorieHistory();

      const result = await calculateAdaptiveTDEE({
        weightHistory,
        calorieHistory,
        userProfile,
      });

      const metrics = await adaptiveTDEEStorage.getDataQualityMetrics();

      setState((prev) => ({
        ...prev,
        result,
        isCalculating: false,
        isEnabled: metrics.isReadyForCalculation,
        daysUntilReady: metrics.daysUntilReady,
        lastSyncDate: new Date().toISOString(),
      }));

      console.log('[AdaptiveTDEE] TDEE calculated:', {
        adaptiveTDEE: result.adaptiveTDEE,
        formulaTDEE: result.formulaTDEE,
        confidence: result.confidence,
        dataPoints: result.dataPoints,
      });
    } catch (error) {
      console.error('[AdaptiveTDEE] Error calculating TDEE:', error);
      setState((prev) => ({ ...prev, isCalculating: false }));
    }
  }, [getUserProfile]);

  // Get recommended calories
  const getRecommendedCalories = useCallback((): number => {
    if (state.result) {
      return state.result.recommendedCalories;
    }

    // Fall back to goal wizard results
    if (goalState.results) {
      return goalState.results.calories;
    }

    return 2000; // Default
  }, [state.result, goalState.results]);

  // Get weight history
  const getWeightHistory = useCallback(async (days?: number): Promise<BodyWeightLog[]> => {
    const history = await adaptiveTDEEStorage.getWeightHistory();

    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return history.filter((log) => new Date(log.date) >= cutoffDate);
    }

    return history;
  }, []);

  // Get calorie history
  const getCalorieHistory = useCallback(async (days?: number): Promise<DailyCalorieLog[]> => {
    const history = await adaptiveTDEEStorage.getCalorieHistory();

    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return history.filter((log) => new Date(log.date) >= cutoffDate);
    }

    return history;
  }, []);

  // Get data quality metrics
  const getDataQualityMetrics = useCallback(async () => {
    const metrics = await adaptiveTDEEStorage.getDataQualityMetrics();
    return {
      totalWeightLogs: metrics.totalWeightLogs,
      totalCalorieLogs: metrics.totalCalorieLogs,
      daysWithBothLogs: metrics.daysWithBothLogs,
      isReadyForCalculation: metrics.isReadyForCalculation,
      daysUntilReady: metrics.daysUntilReady,
    };
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadInitialData();
    await recalculateTDEE();
  }, [loadInitialData, recalculateTDEE]);

  // Clear all data
  const clearAllData = useCallback(async () => {
    await adaptiveTDEEStorage.clearAllData();
    setState(initialState);
    console.log('[AdaptiveTDEE] All data cleared');
  }, []);

  const value = useMemo<AdaptiveTDEEContextType>(() => ({
    state,
    logWeight,
    getLatestWeight,
    logCalories,
    updateCalories,
    markDayComplete,
    recalculateTDEE,
    getRecommendedCalories,
    getWeightHistory,
    getCalorieHistory,
    getDataQualityMetrics,
    refreshData,
    clearAllData,
  }), [
    state,
    logWeight,
    getLatestWeight,
    logCalories,
    updateCalories,
    markDayComplete,
    recalculateTDEE,
    getRecommendedCalories,
    getWeightHistory,
    getCalorieHistory,
    getDataQualityMetrics,
    refreshData,
    clearAllData,
  ]);

  return (
    <AdaptiveTDEEContext.Provider value={value}>
      {children}
    </AdaptiveTDEEContext.Provider>
  );
}

export function useAdaptiveTDEE() {
  const context = useContext(AdaptiveTDEEContext);
  if (!context) {
    throw new Error('useAdaptiveTDEE must be used within an AdaptiveTDEEProvider');
  }
  return context;
}

export default AdaptiveTDEEContext;
