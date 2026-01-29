/**
 * Hydration Context
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import {
  WaterEntry,
  DailyHydration,
  HydrationGoal,
  HydrationStreak,
  HydrationState,
  DEFAULT_HYDRATION_GOAL,
  HYDRATION_TIPS,
} from '../types/hydration';
import * as HydrationStorage from '../services/hydrationStorage';

interface HydrationContextType {
  state: HydrationState;
  addWater: (amount: number, source?: WaterEntry['source']) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
  updateGoal: (goal: HydrationGoal) => Promise<void>;
  getHydrationTip: () => string;
  getProgressPercent: () => number;
  getRemainingAmount: () => number;
  getAverageIntake: () => number;
  refreshData: () => Promise<void>;
}

const HydrationContext = createContext<HydrationContextType | undefined>(undefined);

const defaultState: HydrationState = {
  todayIntake: 0,
  todayGoal: DEFAULT_HYDRATION_GOAL.dailyGoal,
  todayEntries: [],
  hydrationGoal: DEFAULT_HYDRATION_GOAL,
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastGoalMetDate: null,
  },
  weeklyHistory: [],
  isLoading: true,
};

export function HydrationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HydrationState>(defaultState);

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const [todayEntries, goal, streak, weeklyHistory] = await Promise.all([
        HydrationStorage.getTodayEntries(),
        HydrationStorage.getHydrationGoal(),
        HydrationStorage.getHydrationStreak(),
        HydrationStorage.getDailyHistory(7),
      ]);

      const todayIntake = HydrationStorage.calculateTotalIntake(todayEntries);

      setState({
        todayIntake,
        todayGoal: goal.dailyGoal,
        todayEntries,
        hydrationGoal: goal,
        streak,
        weeklyHistory,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading hydration data:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const addWater = useCallback(
    async (amount: number, source: WaterEntry['source'] = 'water') => {
      const now = new Date();
      const entry: WaterEntry = {
        id: `water_${Date.now()}`,
        date: now.toISOString().split('T')[0],
        amount,
        timestamp: now.toISOString(),
        source,
      };

      await HydrationStorage.saveWaterEntry(entry);

      // Update state immediately
      const newEntries = [entry, ...state.todayEntries];
      const newIntake = HydrationStorage.calculateTotalIntake(newEntries);

      setState((prev) => ({
        ...prev,
        todayIntake: newIntake,
        todayEntries: newEntries,
      }));

      // Check if goal met and update streak
      if (newIntake >= state.todayGoal) {
        const updatedStreak = await HydrationStorage.updateHydrationStreak(true);
        setState((prev) => ({
          ...prev,
          streak: updatedStreak,
        }));
      }
    },
    [state.todayEntries, state.todayGoal]
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      await HydrationStorage.deleteWaterEntry(entryId);

      const newEntries = state.todayEntries.filter((e) => e.id !== entryId);
      const newIntake = HydrationStorage.calculateTotalIntake(newEntries);

      setState((prev) => ({
        ...prev,
        todayIntake: newIntake,
        todayEntries: newEntries,
      }));
    },
    [state.todayEntries]
  );

  const updateGoal = useCallback(async (goal: HydrationGoal) => {
    await HydrationStorage.saveHydrationGoal(goal);

    setState((prev) => ({
      ...prev,
      hydrationGoal: goal,
      todayGoal: goal.dailyGoal,
    }));
  }, []);

  const getHydrationTip = useCallback((): string => {
    const index = Math.floor(Math.random() * HYDRATION_TIPS.length);
    return HYDRATION_TIPS[index];
  }, []);

  const getProgressPercent = useCallback((): number => {
    if (state.todayGoal === 0) return 0;
    return Math.min(100, Math.round((state.todayIntake / state.todayGoal) * 100));
  }, [state.todayIntake, state.todayGoal]);

  const getRemainingAmount = useCallback((): number => {
    return Math.max(0, state.todayGoal - state.todayIntake);
  }, [state.todayIntake, state.todayGoal]);

  const getAverageIntake = useCallback((): number => {
    if (state.weeklyHistory.length === 0) return 0;
    const total = state.weeklyHistory.reduce((sum, day) => sum + day.totalIntake, 0);
    return Math.round(total / state.weeklyHistory.length);
  }, [state.weeklyHistory]);

  const value = useMemo<HydrationContextType>(() => ({
    state,
    addWater,
    removeEntry,
    updateGoal,
    getHydrationTip,
    getProgressPercent,
    getRemainingAmount,
    getAverageIntake,
    refreshData,
  }), [
    state,
    addWater,
    removeEntry,
    updateGoal,
    getHydrationTip,
    getProgressPercent,
    getRemainingAmount,
    getAverageIntake,
    refreshData,
  ]);

  return <HydrationContext.Provider value={value}>{children}</HydrationContext.Provider>;
}

export function useHydration(): HydrationContextType {
  const context = useContext(HydrationContext);
  if (!context) {
    throw new Error('useHydration must be used within a HydrationProvider');
  }
  return context;
}
