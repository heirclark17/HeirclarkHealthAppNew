import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export interface WorkoutLog {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  workoutType: string; // e.g., 'Leg Day', 'Upper Body', 'Walking Session', 'HIIT'
  workoutName: string; // Full workout name
  duration: number; // minutes
  caloriesBurned: number;
  exercisesCompleted: number;
  totalExercises: number;
  completedAt: string; // ISO timestamp
}

export interface WorkoutTrackingState {
  // Current week tracking
  weekStartDate: string; // ISO date of current week start (Sunday)
  workoutsThisWeek: WorkoutLog[];

  // Today's workout (from training plan)
  todaysWorkout: {
    type: string;
    name: string;
    isCompleted: boolean;
    isRestDay: boolean;
  } | null;

  // Stats
  totalWorkoutsAllTime: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}

interface WorkoutTrackingContextType {
  state: WorkoutTrackingState;

  // Actions
  logWorkout: (workout: Omit<WorkoutLog, 'id' | 'completedAt'>) => void;
  setTodaysWorkout: (workout: { type: string; name: string; isRestDay: boolean }) => void;
  markTodaysWorkoutComplete: () => void;

  // Computed values
  getWeeklyWorkoutCount: () => number;
  getWorkoutsForDay: (date: string) => WorkoutLog[];
  getTodaysWorkoutDisplay: () => string;
}

const STORAGE_KEY = 'hc_workout_tracking_state';

const getWeekStartDate = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().split('T')[0];
};

const initialState: WorkoutTrackingState = {
  weekStartDate: getWeekStartDate(),
  workoutsThisWeek: [],
  todaysWorkout: null,
  totalWorkoutsAllTime: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastWorkoutDate: null,
};

const WorkoutTrackingContext = createContext<WorkoutTrackingContextType | undefined>(undefined);

export function WorkoutTrackingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutTrackingState>(initialState);

  // Load saved state on mount
  useEffect(() => {
    loadSavedState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    saveState();
  }, [state]);

  // Check for week reset
  useEffect(() => {
    const currentWeekStart = getWeekStartDate();
    if (state.weekStartDate !== currentWeekStart) {
      // New week - reset weekly stats but keep workouts from this week
      const today = new Date().toISOString().split('T')[0];
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay())); // Saturday
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      // Filter to only keep workouts from the new week
      const newWeekWorkouts = state.workoutsThisWeek.filter(w => {
        return w.date >= currentWeekStart && w.date <= weekEndStr;
      });

      setState(prev => ({
        ...prev,
        weekStartDate: currentWeekStart,
        workoutsThisWeek: newWeekWorkouts,
      }));

      console.log('[WorkoutTracking] Week reset - new week started:', currentWeekStart);
    }
  }, [state.weekStartDate]);

  const loadSavedState = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[WorkoutTracking] Loaded saved state:', {
          workoutsThisWeek: parsed.workoutsThisWeek?.length || 0,
          totalWorkoutsAllTime: parsed.totalWorkoutsAllTime,
        });

        // Check if we need to reset weekly stats
        const currentWeekStart = getWeekStartDate();
        if (parsed.weekStartDate !== currentWeekStart) {
          // New week
          parsed.weekStartDate = currentWeekStart;
          parsed.workoutsThisWeek = [];
        }

        setState(parsed);
      }
    } catch (error) {
      console.error('[WorkoutTracking] Error loading state:', error);
    }
  };

  const saveState = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[WorkoutTracking] Error saving state:', error);
    }
  };

  const logWorkout = useCallback(async (workout: Omit<WorkoutLog, 'id' | 'completedAt'>) => {
    const newLog: WorkoutLog = {
      ...workout,
      id: `workout_${Date.now()}`,
      completedAt: new Date().toISOString(),
    };

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Calculate streak
    let newStreak = state.currentStreak;
    if (state.lastWorkoutDate === yesterdayStr || state.lastWorkoutDate === today) {
      // Continue streak (same day or consecutive day)
      if (state.lastWorkoutDate !== today) {
        newStreak += 1;
      }
    } else if (state.lastWorkoutDate !== today) {
      // Reset streak (missed a day)
      newStreak = 1;
    }

    setState(prev => ({
      ...prev,
      workoutsThisWeek: [...prev.workoutsThisWeek, newLog],
      totalWorkoutsAllTime: prev.totalWorkoutsAllTime + 1,
      currentStreak: newStreak,
      longestStreak: Math.max(prev.longestStreak, newStreak),
      lastWorkoutDate: workout.date,
      todaysWorkout: workout.date === today
        ? { ...prev.todaysWorkout!, isCompleted: true }
        : prev.todaysWorkout,
    }));

    console.log('[WorkoutTracking] Workout logged locally:', {
      type: workout.workoutType,
      date: workout.date,
      weeklyCount: state.workoutsThisWeek.length + 1,
      streak: newStreak,
    });

    // *** NEW: Sync workout to backend ***
    try {
      console.log('[WorkoutTracking] 🔄 Syncing workout to backend...');
      const syncSuccess = await api.logWorkout({
        sessionName: workout.workoutName,
        workoutType: workout.workoutType,
        durationMinutes: workout.duration,
        caloriesBurned: workout.caloriesBurned,
        exercises: [],
        completedAt: newLog.completedAt,
      });

      if (syncSuccess) {
        console.log('[WorkoutTracking] ✅ Workout synced to backend successfully!');
      } else {
        console.warn('[WorkoutTracking] ⚠️ Backend sync failed - workout saved locally only');
      }
    } catch (syncError) {
      console.error('[WorkoutTracking] ❌ Backend sync error:', syncError);
    }
  }, [state.currentStreak, state.lastWorkoutDate, state.workoutsThisWeek.length]);

  const setTodaysWorkout = useCallback((workout: { type: string; name: string; isRestDay: boolean }) => {
    const today = new Date().toISOString().split('T')[0];
    const alreadyCompleted = state.workoutsThisWeek.some(w => w.date === today);

    setState(prev => ({
      ...prev,
      todaysWorkout: {
        type: workout.type,
        name: workout.name,
        isRestDay: workout.isRestDay,
        isCompleted: alreadyCompleted,
      },
    }));

    console.log('[WorkoutTracking] Today\'s workout set:', workout);
  }, [state.workoutsThisWeek]);

  const markTodaysWorkoutComplete = useCallback(() => {
    if (state.todaysWorkout && !state.todaysWorkout.isCompleted) {
      const today = new Date().toISOString().split('T')[0];
      logWorkout({
        date: today,
        workoutType: state.todaysWorkout.type,
        workoutName: state.todaysWorkout.name,
        duration: 0,
        caloriesBurned: 0,
        exercisesCompleted: 0,
        totalExercises: 0,
      });
    }
  }, [state.todaysWorkout, logWorkout]);

  const getWeeklyWorkoutCount = useCallback(() => {
    return state.workoutsThisWeek.length;
  }, [state.workoutsThisWeek]);

  const getWorkoutsForDay = useCallback((date: string) => {
    return state.workoutsThisWeek.filter(w => w.date === date);
  }, [state.workoutsThisWeek]);

  const getTodaysWorkoutDisplay = useCallback(() => {
    if (!state.todaysWorkout) return 'No workout scheduled';
    if (state.todaysWorkout.isRestDay) return 'Rest Day';
    if (state.todaysWorkout.isCompleted) return `${state.todaysWorkout.type} (Done)`;
    return state.todaysWorkout.type;
  }, [state.todaysWorkout]);

  const value = useMemo<WorkoutTrackingContextType>(() => ({
    state,
    logWorkout,
    setTodaysWorkout,
    markTodaysWorkoutComplete,
    getWeeklyWorkoutCount,
    getWorkoutsForDay,
    getTodaysWorkoutDisplay,
  }), [
    state,
    logWorkout,
    setTodaysWorkout,
    markTodaysWorkoutComplete,
    getWeeklyWorkoutCount,
    getWorkoutsForDay,
    getTodaysWorkoutDisplay,
  ]);

  return (
    <WorkoutTrackingContext.Provider value={value}>
      {children}
    </WorkoutTrackingContext.Provider>
  );
}

export function useWorkoutTracking() {
  const context = useContext(WorkoutTrackingContext);
  if (context === undefined) {
    throw new Error('useWorkoutTracking must be used within a WorkoutTrackingProvider');
  }
  return context;
}

export default WorkoutTrackingContext;
