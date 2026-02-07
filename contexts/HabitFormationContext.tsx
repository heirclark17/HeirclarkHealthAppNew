/**
 * Habit Formation Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  HabitFormationState,
  Habit,
  HabitCompletion,
  HabitStreak,
  DailyHabitSummary,
  HabitInsight,
  HabitCategory,
  HabitFrequency,
  HABIT_CONSTANTS,
} from '../types/habitFormation';
import {
  getHabits,
  addHabit as addHabitStorage,
  updateHabit as updateHabitStorage,
  deleteHabit as deleteHabitStorage,
  getCompletions,
  saveCompletion,
  getTodayCompletions,
  getStreaks,
  updateStreak,
} from '../services/habitFormationStorage';
import { api } from '../services/api';

interface HabitFormationContextType {
  state: HabitFormationState;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string, notes?: string) => Promise<void>;
  skipHabit: (habitId: string) => Promise<void>;
  getHabitStreak: (habitId: string) => HabitStreak | undefined;
  getTodayHabits: () => { habit: Habit; completion: HabitCompletion | null }[];
  refresh: () => Promise<void>;
}

const HabitFormationContext = createContext<HabitFormationContextType | undefined>(undefined);

const defaultState: HabitFormationState = {
  habits: [],
  completions: [],
  streaks: [],
  stacks: [],
  todaySummary: null,
  insights: [],
  isLoading: true,
  lastUpdated: 0,
};

export function HabitFormationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HabitFormationState>(defaultState);

  const calculateTodaySummary = useCallback((habits: Habit[], completions: HabitCompletion[]): DailyHabitSummary => {
    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = completions.filter((c) => c.date === today);
    const activeHabits = habits.filter((h) => h.isActive && isHabitDueToday(h));

    let completed = 0;
    let skipped = 0;
    let pending = 0;

    for (const habit of activeHabits) {
      const completion = todayCompletions.find((c) => c.habitId === habit.id);
      if (completion?.status === 'completed') completed++;
      else if (completion?.status === 'skipped') skipped++;
      else pending++;
    }

    return {
      date: today,
      totalHabits: activeHabits.length,
      completedHabits: completed,
      skippedHabits: skipped,
      pendingHabits: pending,
      completionRate: activeHabits.length > 0 ? Math.round((completed / activeHabits.length) * 100) : 0,
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Try backend first for habits, fall back to local storage
      let habits;
      try {
        const backendHabits = await api.getHabits();
        if (backendHabits && backendHabits.length > 0) {
          console.log('[HabitFormation] Loaded habits from backend:', backendHabits.length);
          habits = backendHabits.map((h: any) => ({
            id: h.id,
            name: h.habitName || h.name,
            category: h.habitType || h.category || 'health',
            frequency: h.frequency || 'daily',
            targetValue: h.targetValue || 1,
            unit: h.unit || 'times',
            reminderTime: h.reminderTime,
            isActive: true,
            createdAt: Date.now(),
            ...h,
          }));
        } else {
          habits = await getHabits();
        }
      } catch (apiError) {
        console.error('[HabitFormation] API fetch error, falling back to local:', apiError);
        habits = await getHabits();
      }

      const [completions, streaks] = await Promise.all([
        getCompletions(30),
        getStreaks(),
      ]);

      const todaySummary = calculateTodaySummary(habits, completions);
      const insights = generateInsights(habits, streaks, todaySummary);

      setState({
        habits,
        completions,
        streaks,
        stacks: [],
        todaySummary,
        insights,
        isLoading: false,
        lastUpdated: Date.now(),
      });

      // Request AI habit analysis from backend
      try {
        const aiAnalysis = await api.analyzeHabits(habits, completions);
        if (aiAnalysis) {
          console.log('[HabitFormation] AI analysis synced successfully');
        }
      } catch (error) {
        console.error('[HabitFormation] API analyze error:', error);
      }
    } catch (error) {
      console.error('Error loading habit data:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [calculateTodaySummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'createdAt' | 'isActive'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      isActive: true,
    };

    const habits = await addHabitStorage(newHabit);
    const todaySummary = calculateTodaySummary(habits, state.completions);

    setState((prev) => ({
      ...prev,
      habits,
      todaySummary,
      lastUpdated: Date.now(),
    }));

    // Fire-and-forget: sync new habit to backend
    try {
      await api.createHabit({
        habitName: newHabit.name,
        habitType: (newHabit as any).category,
        frequency: newHabit.frequency,
        targetValue: (newHabit as any).targetValue || 1,
        unit: (newHabit as any).unit,
        reminderTime: (newHabit as any).reminderTime,
      });
    } catch (error) {
      console.error('[HabitFormation] API sync error:', error);
    }
  }, [calculateTodaySummary, state.completions]);

  const updateHabitHandler = useCallback(async (habitId: string, updates: Partial<Habit>) => {
    const habits = await updateHabitStorage(habitId, updates);
    const todaySummary = calculateTodaySummary(habits, state.completions);

    setState((prev) => ({
      ...prev,
      habits,
      todaySummary,
      lastUpdated: Date.now(),
    }));
  }, [calculateTodaySummary, state.completions]);

  const deleteHabitHandler = useCallback(async (habitId: string) => {
    const habits = await deleteHabitStorage(habitId);
    const todaySummary = calculateTodaySummary(habits, state.completions);

    setState((prev) => ({
      ...prev,
      habits,
      todaySummary,
      lastUpdated: Date.now(),
    }));
  }, [calculateTodaySummary, state.completions]);

  const completeHabit = useCallback(async (habitId: string, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const completion: HabitCompletion = {
      habitId,
      date: today,
      status: 'completed',
      completedAt: Date.now(),
      notes,
    };

    const [completions, streaks] = await Promise.all([
      saveCompletion(completion),
      updateStreak(habitId, true),
    ]);

    const todaySummary = calculateTodaySummary(state.habits, completions);
    const insights = generateInsights(state.habits, streaks, todaySummary);

    setState((prev) => ({
      ...prev,
      completions,
      streaks,
      todaySummary,
      insights,
      lastUpdated: Date.now(),
    }));

    // Fire-and-forget: sync completion to backend
    try {
      await api.completeHabit(habitId, today, 1);
    } catch (error) {
      console.error('[HabitFormation] API sync error:', error);
    }
  }, [calculateTodaySummary, state.habits]);

  const skipHabit = useCallback(async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const completion: HabitCompletion = {
      habitId,
      date: today,
      status: 'skipped',
    };

    const completions = await saveCompletion(completion);
    const todaySummary = calculateTodaySummary(state.habits, completions);

    setState((prev) => ({
      ...prev,
      completions,
      todaySummary,
      lastUpdated: Date.now(),
    }));
  }, [calculateTodaySummary, state.habits]);

  const getHabitStreak = useCallback((habitId: string): HabitStreak | undefined => {
    return state.streaks.find((s) => s.habitId === habitId);
  }, [state.streaks]);

  const getTodayHabits = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = state.completions.filter((c) => c.date === today);

    return state.habits
      .filter((h) => h.isActive && isHabitDueToday(h))
      .map((habit) => ({
        habit,
        completion: todayCompletions.find((c) => c.habitId === habit.id) || null,
      }));
  }, [state.habits, state.completions]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const value = useMemo<HabitFormationContextType>(() => ({
    state,
    addHabit,
    updateHabit: updateHabitHandler,
    deleteHabit: deleteHabitHandler,
    completeHabit,
    skipHabit,
    getHabitStreak,
    getTodayHabits,
    refresh,
  }), [
    state,
    addHabit,
    updateHabitHandler,
    deleteHabitHandler,
    completeHabit,
    skipHabit,
    getHabitStreak,
    getTodayHabits,
    refresh,
  ]);

  return (
    <HabitFormationContext.Provider value={value}>
      {children}
    </HabitFormationContext.Provider>
  );
}

export function useHabitFormation(): HabitFormationContextType {
  const context = useContext(HabitFormationContext);
  if (!context) {
    throw new Error('useHabitFormation must be used within a HabitFormationProvider');
  }
  return context;
}

// Helper functions
function isHabitDueToday(habit: Habit): boolean {
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'specific_days' && habit.specificDays) {
    const today = new Date().getDay();
    return habit.specificDays.includes(today);
  }
  return true;
}

function generateInsights(
  habits: Habit[],
  streaks: HabitStreak[],
  summary: DailyHabitSummary
): HabitInsight[] {
  const insights: HabitInsight[] = [];

  // Check for streak milestones
  for (const streak of streaks) {
    if (HABIT_CONSTANTS.STREAK_MILESTONES.includes(streak.currentStreak)) {
      const habit = habits.find((h) => h.id === streak.habitId);
      if (habit) {
        insights.push({
          type: 'streak',
          message: `${habit.name}: ${streak.currentStreak} day streak!`,
          habitId: streak.habitId,
          timestamp: Date.now(),
        });
      }
    }
  }

  // Check for good completion rate
  if (summary.completionRate >= 80 && summary.totalHabits >= 3) {
    insights.push({
      type: 'improvement',
      message: "You're crushing it today! Keep up the great work!",
      timestamp: Date.now(),
    });
  }

  // Suggestions
  if (summary.pendingHabits > 0) {
    insights.push({
      type: 'suggestion',
      message: `${summary.pendingHabits} habit${summary.pendingHabits > 1 ? 's' : ''} left for today`,
      timestamp: Date.now(),
    });
  }

  return insights.slice(0, 5);
}
