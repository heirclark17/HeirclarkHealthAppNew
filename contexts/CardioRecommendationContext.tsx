/**
 * CardioRecommendationContext
 *
 * Provides dynamic cardio recommendations based on:
 * - Daily calorie target (from GoalWizardContext)
 * - Calorie deficit goal (from GoalWizardContext)
 * - Calories consumed today (from NutritionContext)
 * - Calories burned from strength training (from TrainingContext)
 *
 * Automatically recalculates when any input changes.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CardioRecommendationContextValue,
  CardioRecommendation,
  CardioCalculationInputs,
  CardioState
} from '../types/cardio';
import {
  calculateCardioRecommendation,
  validateCardioInputs,
  isToday,
  getTodayString
} from '../utils/cardioCalculations';
import { useGoalWizard } from './GoalWizardContext';
import { useAdaptiveTDEE } from './AdaptiveTDEEContext';
import { useTraining } from './TrainingContext';

const STORAGE_KEY = '@cardio_recommendation_state';

const CardioRecommendationContext = createContext<
  CardioRecommendationContextValue | undefined
>(undefined);

export function CardioRecommendationProvider({
  children
}: {
  children: React.ReactNode
}) {
  // ===== STATE =====
  const [recommendation, setRecommendation] =
    useState<CardioRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(false);

  // ===== CONTEXT DEPENDENCIES =====
  const goalWizard = useGoalWizard();
  const adaptiveTDEE = useAdaptiveTDEE();
  const training = useTraining();

  // ===== STORAGE HELPERS =====
  const loadState = useCallback(async (): Promise<CardioState | null> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return null;
      const state: CardioState = JSON.parse(json);

      // Validate loaded data
      if (!state.lastCalculation || typeof state.completedToday !== 'boolean') {
        console.warn('[CardioRecommendation] Corrupted state, resetting');
        await AsyncStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Reset completed flag if not today
      if (!isToday(state.lastCompletedDate)) {
        state.completedToday = false;
      }

      return state;
    } catch (error) {
      console.error('[CardioRecommendation] Load error:', error);
      await AsyncStorage.removeItem(STORAGE_KEY); // Clear corrupted data
      return null;
    }
  }, []);

  const saveState = useCallback(async (state: CardioState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[CardioRecommendation] Save error:', error);
    }
  }, []);

  // ===== CALCULATION =====
  const inputs = useMemo((): CardioCalculationInputs | null => {
    // Check for goals
    if (!goalWizard.state?.results) {
      console.log('[CardioRecommendation] No goals set');
      return null;
    }

    // Get today's date
    const today = getTodayString();

    // Get consumed calories from today's calorie log
    const todayLog = adaptiveTDEE.state.calorieHistory.find(log => log.date === today);
    const consumed = todayLog?.caloriesConsumed || 0;

    // Get strength training calories burned (exclude cardio workouts)
    // Conservative estimate: 300 calories per strength workout
    const burnedStrength = todayLog?.caloriesBurned || 0;

    const rawInputs: Partial<CardioCalculationInputs> = {
      dailyTarget: goalWizard.state.results.calories,
      deficit: Math.abs(goalWizard.state.results.dailyDelta || 0),
      consumed,
      burnedStrength
    };

    // Validate before returning
    if (!validateCardioInputs(rawInputs)) {
      console.warn('[CardioRecommendation] Invalid inputs:', rawInputs);
      return null;
    }

    return rawInputs;
  }, [
    goalWizard.state?.results,
    adaptiveTDEE.state.calorieHistory,
    training.weeklyPlan
  ]);

  const calculate = useCallback((): CardioRecommendation | null => {
    if (!inputs) {
      // Return special "no data" recommendation
      return {
        cardioMinutes: 0,
        status: goalWizard.state?.results ? 'no_data' : 'no_goals',
        netCalories: 0,
        targetCalories: 0,
        deficitNeeded: 0,
        message: goalWizard.state?.results
          ? "Log your meals to see cardio recommendations."
          : "Complete your goal setup to get cardio recommendations."
      };
    }

    return calculateCardioRecommendation(inputs);
  }, [inputs, goalWizard.state?.results]);

  // ===== EFFECTS =====

  // Initialize on mount
  useEffect(() => {
    (async () => {
      setIsLoading(true);

      // Load persisted state
      const state = await loadState();
      if (state) {
        setCompletedToday(state.completedToday);
      }

      // Calculate initial recommendation
      const rec = calculate();
      setRecommendation(rec);

      setIsLoading(false);
    })();
  }, [loadState, calculate]);

  // Recalculate when inputs change
  useEffect(() => {
    if (isLoading) return; // Skip during initial load

    const rec = calculate();
    setRecommendation(rec);

    // Auto-save calculation to storage
    saveState({
      lastCalculation: rec,
      completedToday,
      lastCompletedDate: completedToday ? getTodayString() : null
    });
  }, [inputs, calculate, isLoading, completedToday, saveState]);

  // ===== ACTIONS =====

  const markCardioComplete = useCallback(async (minutes: number) => {
    setCompletedToday(true);

    // Update recommendation status
    if (recommendation) {
      const updated: CardioRecommendation = {
        ...recommendation,
        status: 'completed',
        message: `Great work! You completed ${minutes} minutes of cardio.`
      };
      setRecommendation(updated);

      // Persist
      await saveState({
        lastCalculation: updated,
        completedToday: true,
        lastCompletedDate: getTodayString()
      });
    }

    // Optional: Log cardio workout to TrainingContext
    // await training.logCardioWorkout({ minutes, caloriesBurned: minutes * 8 });
  }, [recommendation, saveState]);

  const refreshRecommendation = useCallback(async () => {
    setIsLoading(true);
    const rec = calculate();
    setRecommendation(rec);
    await saveState({
      lastCalculation: rec,
      completedToday,
      lastCompletedDate: completedToday ? getTodayString() : null
    });
    setIsLoading(false);
  }, [calculate, completedToday, saveState]);

  // ===== CONTEXT VALUE =====
  const value: CardioRecommendationContextValue = useMemo(() => ({
    recommendation,
    isLoading,
    completedToday,
    markCardioComplete,
    refreshRecommendation,
    inputs
  }), [
    recommendation,
    isLoading,
    completedToday,
    markCardioComplete,
    refreshRecommendation,
    inputs
  ]);

  return (
    <CardioRecommendationContext.Provider value={value}>
      {children}
    </CardioRecommendationContext.Provider>
  );
}

/**
 * Hook to access CardioRecommendationContext
 */
export function useCardioRecommendation() {
  const context = useContext(CardioRecommendationContext);
  if (!context) {
    throw new Error(
      'useCardioRecommendation must be used within CardioRecommendationProvider'
    );
  }
  return context;
}
