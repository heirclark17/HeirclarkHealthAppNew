/**
 * Workout Form Coach Context
 * Provides state management for exercise form coaching
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  WorkoutFormCoachState,
  Exercise,
  ExerciseHistory,
  FormCheckResult,
  DailyFormTip,
  CoachingSession,
  ExerciseCategory,
  DEFAULT_EXERCISES,
} from '../types/workoutFormCoach';
import {
  getExerciseHistory,
  updateExerciseHistory,
  getFormChecks,
  saveFormCheck,
  getDailyTip,
  saveDailyTip,
  markDailyTipSeen,
  getCoachingSessions,
  saveCoachingSession,
  getFavoriteExercises,
  toggleFavoriteExercise,
} from '../services/workoutFormCoachStorage';
import {
  getAllExercises,
  getExerciseById,
  getExercisesByCategory,
  searchExercises,
  createFormCheck,
  generateDailyTip,
  createCoachingSession,
  getImprovementSuggestions,
  getMuscleActivationCues,
  getBreathingPattern,
  calculateAverageFormScore,
  getExerciseRecommendations,
} from '../services/workoutFormCoachService';

// Context interface
interface WorkoutFormCoachContextType {
  state: WorkoutFormCoachState;

  // Exercise lookup
  getExercise: (id: string) => Exercise | undefined;
  getExercisesByCategory: (category: ExerciseCategory) => Exercise[];
  searchExercises: (query: string) => Exercise[];

  // Form tracking
  recordFormCheck: (exerciseId: string, cuesFollowed: string[], mistakesIdentified: string[]) => Promise<FormCheckResult>;
  getFormHistory: (exerciseId: string) => FormCheckResult[];
  getAverageScore: (exerciseId: string) => number | null;

  // Exercise history
  logExercisePerformed: (exerciseId: string, personalBest?: { weight?: number; reps?: number }) => Promise<void>;
  getExerciseStats: (exerciseId: string) => ExerciseHistory | undefined;

  // Coaching
  getPersonalizedTips: (exerciseId: string) => string[];
  getMuscleActivation: (exerciseId: string) => string[];
  getBreathing: (exerciseId: string) => string[];
  getRecommendations: () => Exercise[];

  // Favorites
  isFavorite: (exerciseId: string) => boolean;
  toggleFavorite: (exerciseId: string) => Promise<void>;

  // Daily tip
  refreshDailyTip: () => Promise<void>;
  markTipSeen: () => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

// Create context
const WorkoutFormCoachContext = createContext<WorkoutFormCoachContextType | undefined>(undefined);

// Provider props
interface WorkoutFormCoachProviderProps {
  children: ReactNode;
}

// Default state
const defaultState: WorkoutFormCoachState = {
  exercises: DEFAULT_EXERCISES,
  exerciseHistory: [],
  recentFormChecks: [],
  dailyTip: null,
  coachingSessions: [],
  favoriteExercises: [],
  isLoading: true,
  lastUpdated: 0,
};

// Provider component
export function WorkoutFormCoachProvider({ children }: WorkoutFormCoachProviderProps) {
  const [state, setState] = useState<WorkoutFormCoachState>(defaultState);

  // Load data on mount
  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const [exerciseHistory, formChecks, dailyTip, coachingSessions, favorites] = await Promise.all([
        getExerciseHistory(),
        getFormChecks(),
        getDailyTip(),
        getCoachingSessions(20),
        getFavoriteExercises(),
      ]);

      // Check if daily tip needs refresh
      const today = new Date().toISOString().split('T')[0];
      let currentTip = dailyTip;
      if (!dailyTip || dailyTip.date !== today) {
        currentTip = generateDailyTip(exerciseHistory, favorites);
        await saveDailyTip(currentTip);
      }

      setState({
        exercises: DEFAULT_EXERCISES,
        exerciseHistory,
        recentFormChecks: formChecks,
        dailyTip: currentTip,
        coachingSessions,
        favoriteExercises: favorites,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error loading form coach data:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get exercise by ID
  const getExercise = useCallback((id: string): Exercise | undefined => {
    return getExerciseById(id);
  }, []);

  // Record a form check
  const recordFormCheck = useCallback(
    async (
      exerciseId: string,
      cuesFollowed: string[],
      mistakesIdentified: string[]
    ): Promise<FormCheckResult> => {
      const exercise = getExerciseById(exerciseId);
      if (!exercise) {
        throw new Error(`Exercise not found: ${exerciseId}`);
      }

      const history = state.exerciseHistory.find((h) => h.exerciseId === exerciseId);
      const result = createFormCheck(exercise, cuesFollowed, mistakesIdentified, history);

      const updatedChecks = await saveFormCheck(result);

      // Update history with any identified form issues
      if (mistakesIdentified.length > 0) {
        await updateExerciseHistory(
          exerciseId,
          exercise.name,
          undefined,
          undefined,
          mistakesIdentified[0]
        );
      }

      setState((prev) => ({
        ...prev,
        recentFormChecks: updatedChecks,
        lastUpdated: Date.now(),
      }));

      return result;
    },
    [state.exerciseHistory]
  );

  // Get form check history for an exercise
  const getFormHistory = useCallback(
    (exerciseId: string): FormCheckResult[] => {
      return state.recentFormChecks.filter((c) => c.exerciseId === exerciseId);
    },
    [state.recentFormChecks]
  );

  // Get average form score
  const getAverageScore = useCallback(
    (exerciseId: string): number | null => {
      return calculateAverageFormScore(exerciseId, state.recentFormChecks);
    },
    [state.recentFormChecks]
  );

  // Log exercise performed
  const logExercisePerformed = useCallback(
    async (
      exerciseId: string,
      personalBest?: { weight?: number; reps?: number }
    ): Promise<void> => {
      const exercise = getExerciseById(exerciseId);
      if (!exercise) return;

      const updatedHistory = await updateExerciseHistory(
        exerciseId,
        exercise.name,
        personalBest
      );

      setState((prev) => ({
        ...prev,
        exerciseHistory: updatedHistory,
        lastUpdated: Date.now(),
      }));
    },
    []
  );

  // Get exercise stats
  const getExerciseStats = useCallback(
    (exerciseId: string): ExerciseHistory | undefined => {
      return state.exerciseHistory.find((h) => h.exerciseId === exerciseId);
    },
    [state.exerciseHistory]
  );

  // Get personalized tips
  const getPersonalizedTips = useCallback(
    (exerciseId: string): string[] => {
      const exercise = getExerciseById(exerciseId);
      if (!exercise) return [];
      return getImprovementSuggestions(exercise, state.recentFormChecks);
    },
    [state.recentFormChecks]
  );

  // Get muscle activation cues
  const getMuscleActivation = useCallback((exerciseId: string): string[] => {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) return [];
    return getMuscleActivationCues(exercise);
  }, []);

  // Get breathing tips
  const getBreathing = useCallback((exerciseId: string): string[] => {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) return [];
    return getBreathingPattern(exercise);
  }, []);

  // Get recommendations
  const getRecommendations = useCallback((): Exercise[] => {
    return getExerciseRecommendations(state.exerciseHistory, state.favoriteExercises);
  }, [state.exerciseHistory, state.favoriteExercises]);

  // Check if exercise is favorite
  const isFavorite = useCallback(
    (exerciseId: string): boolean => {
      return state.favoriteExercises.includes(exerciseId);
    },
    [state.favoriteExercises]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(async (exerciseId: string): Promise<void> => {
    const updated = await toggleFavoriteExercise(exerciseId);
    setState((prev) => ({
      ...prev,
      favoriteExercises: updated,
    }));
  }, []);

  // Refresh daily tip
  const refreshDailyTip = useCallback(async (): Promise<void> => {
    const tip = generateDailyTip(state.exerciseHistory, state.favoriteExercises);
    await saveDailyTip(tip);
    setState((prev) => ({
      ...prev,
      dailyTip: tip,
    }));
  }, [state.exerciseHistory, state.favoriteExercises]);

  // Mark tip as seen
  const markTipSeen = useCallback(async (): Promise<void> => {
    await markDailyTipSeen();
    setState((prev) => ({
      ...prev,
      dailyTip: prev.dailyTip ? { ...prev.dailyTip, seen: true } : null,
    }));
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const value = useMemo<WorkoutFormCoachContextType>(() => ({
    state,
    getExercise,
    getExercisesByCategory,
    searchExercises,
    recordFormCheck,
    getFormHistory,
    getAverageScore,
    logExercisePerformed,
    getExerciseStats,
    getPersonalizedTips,
    getMuscleActivation,
    getBreathing,
    getRecommendations,
    isFavorite,
    toggleFavorite,
    refreshDailyTip,
    markTipSeen,
    refresh,
  }), [
    state,
    getExercise,
    getExercisesByCategory,
    searchExercises,
    recordFormCheck,
    getFormHistory,
    getAverageScore,
    logExercisePerformed,
    getExerciseStats,
    getPersonalizedTips,
    getMuscleActivation,
    getBreathing,
    getRecommendations,
    isFavorite,
    toggleFavorite,
    refreshDailyTip,
    markTipSeen,
    refresh,
  ]);

  return (
    <WorkoutFormCoachContext.Provider value={value}>
      {children}
    </WorkoutFormCoachContext.Provider>
  );
}

// Hook
export function useWorkoutFormCoach(): WorkoutFormCoachContextType {
  const context = useContext(WorkoutFormCoachContext);
  if (!context) {
    throw new Error('useWorkoutFormCoach must be used within a WorkoutFormCoachProvider');
  }
  return context;
}
