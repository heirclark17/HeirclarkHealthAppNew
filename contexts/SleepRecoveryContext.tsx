/**
 * Sleep & Recovery Context
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import {
  SleepEntry,
  RecoveryScore,
  SleepGoal,
  SleepRecoveryState,
  DEFAULT_SLEEP_GOAL,
  SLEEP_TIPS,
  RECOVERY_TIPS,
} from '../types/sleepRecovery';
import * as SleepStorage from '../services/sleepRecoveryStorage';

interface SleepRecoveryContextType {
  state: SleepRecoveryState;
  logSleep: (entry: Omit<SleepEntry, 'id'>) => Promise<void>;
  updateSleepEntry: (entry: SleepEntry) => Promise<void>;
  deleteSleepEntry: (entryId: string) => Promise<void>;
  updateSleepGoal: (goal: SleepGoal) => Promise<void>;
  calculateRecoveryScore: () => Promise<RecoveryScore>;
  getSleepTip: () => string;
  getRecoveryTip: () => string;
  getWeeklyStats: () => Promise<{
    avgDuration: number;
    avgQuality: number;
    consistency: number;
    sleepDebt: number;
  }>;
  getTodaySleep: () => SleepEntry | null;
  refreshData: () => Promise<void>;
}

const SleepRecoveryContext = createContext<SleepRecoveryContextType | undefined>(undefined);

const defaultState: SleepRecoveryState = {
  sleepEntries: [],
  recoveryScores: [],
  sleepGoal: DEFAULT_SLEEP_GOAL,
  averageSleepDuration: 0,
  sleepDebt: 0,
  isLoading: true,
};

export function SleepRecoveryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SleepRecoveryState>(defaultState);

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const [entries, scores, goal, avgDuration, debt] = await Promise.all([
        SleepStorage.getSleepEntries(),
        SleepStorage.getRecoveryScores(),
        SleepStorage.getSleepGoal(),
        SleepStorage.getAverageSleepDuration(),
        SleepStorage.calculateSleepDebt(),
      ]);

      setState({
        sleepEntries: entries,
        recoveryScores: scores,
        sleepGoal: goal,
        averageSleepDuration: avgDuration,
        sleepDebt: debt,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading sleep data:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const logSleep = useCallback(async (entryData: Omit<SleepEntry, 'id'>) => {
    const entry: SleepEntry = {
      ...entryData,
      id: `sleep_${Date.now()}`,
    };

    await SleepStorage.saveSleepEntry(entry);

    // Update state
    setState((prev) => ({
      ...prev,
      sleepEntries: [entry, ...prev.sleepEntries.filter((e) => e.date !== entry.date)],
    }));

    // Recalculate averages
    const [avgDuration, debt] = await Promise.all([
      SleepStorage.getAverageSleepDuration(),
      SleepStorage.calculateSleepDebt(),
    ]);

    setState((prev) => ({
      ...prev,
      averageSleepDuration: avgDuration,
      sleepDebt: debt,
    }));
  }, []);

  const updateSleepEntry = useCallback(async (entry: SleepEntry) => {
    await SleepStorage.saveSleepEntry(entry);

    setState((prev) => ({
      ...prev,
      sleepEntries: prev.sleepEntries.map((e) => (e.id === entry.id ? entry : e)),
    }));
  }, []);

  const deleteSleepEntry = useCallback(async (entryId: string) => {
    await SleepStorage.deleteSleepEntry(entryId);

    setState((prev) => ({
      ...prev,
      sleepEntries: prev.sleepEntries.filter((e) => e.id !== entryId),
    }));
  }, []);

  const updateSleepGoal = useCallback(async (goal: SleepGoal) => {
    await SleepStorage.saveSleepGoal(goal);

    setState((prev) => ({
      ...prev,
      sleepGoal: goal,
    }));

    // Recalculate sleep debt with new goal
    const debt = await SleepStorage.calculateSleepDebt();
    setState((prev) => ({ ...prev, sleepDebt: debt }));
  }, []);

  const calculateRecoveryScore = useCallback(async (): Promise<RecoveryScore> => {
    const today = new Date().toISOString().split('T')[0];
    const todaySleep = state.sleepEntries.find((e) => e.date === today);

    // Calculate factors (0-100 each)
    const sleepFactor = todaySleep
      ? Math.min(100, Math.round((todaySleep.duration / state.sleepGoal.targetDuration) * 100))
      : 50;

    const qualityFactor = todaySleep ? todaySleep.quality * 20 : 50;

    // For now, use reasonable defaults for other factors
    // In a real app, these would come from other contexts
    const nutritionFactor = 70;
    const activityFactor = 65;
    const stressFactor = 60;

    // Weighted average
    const score = Math.round(
      sleepFactor * 0.35 + qualityFactor * 0.25 + nutritionFactor * 0.15 + activityFactor * 0.15 + stressFactor * 0.1
    );

    const recoveryScore: RecoveryScore = {
      date: today,
      score,
      factors: {
        sleep: sleepFactor,
        nutrition: nutritionFactor,
        activity: activityFactor,
        stress: stressFactor,
      },
    };

    await SleepStorage.saveRecoveryScore(recoveryScore);

    setState((prev) => ({
      ...prev,
      recoveryScores: [recoveryScore, ...prev.recoveryScores.filter((s) => s.date !== today)],
    }));

    return recoveryScore;
  }, [state.sleepEntries, state.sleepGoal]);

  const getSleepTip = useCallback((): string => {
    const index = Math.floor(Math.random() * SLEEP_TIPS.length);
    return SLEEP_TIPS[index];
  }, []);

  const getRecoveryTip = useCallback((): string => {
    const index = Math.floor(Math.random() * RECOVERY_TIPS.length);
    return RECOVERY_TIPS[index];
  }, []);

  const getWeeklyStats = useCallback(async () => {
    const [avgDuration, avgQuality, consistency, sleepDebt] = await Promise.all([
      SleepStorage.getAverageSleepDuration(),
      SleepStorage.getAverageSleepQuality(),
      SleepStorage.getSleepConsistencyScore(),
      SleepStorage.calculateSleepDebt(),
    ]);

    return { avgDuration, avgQuality, consistency, sleepDebt };
  }, []);

  const getTodaySleep = useCallback((): SleepEntry | null => {
    const today = new Date().toISOString().split('T')[0];
    return state.sleepEntries.find((e) => e.date === today) || null;
  }, [state.sleepEntries]);

  const value = useMemo<SleepRecoveryContextType>(() => ({
    state,
    logSleep,
    updateSleepEntry,
    deleteSleepEntry,
    updateSleepGoal,
    calculateRecoveryScore,
    getSleepTip,
    getRecoveryTip,
    getWeeklyStats,
    getTodaySleep,
    refreshData,
  }), [
    state,
    logSleep,
    updateSleepEntry,
    deleteSleepEntry,
    updateSleepGoal,
    calculateRecoveryScore,
    getSleepTip,
    getRecoveryTip,
    getWeeklyStats,
    getTodaySleep,
    refreshData,
  ]);

  return <SleepRecoveryContext.Provider value={value}>{children}</SleepRecoveryContext.Provider>;
}

export function useSleepRecovery(): SleepRecoveryContextType {
  const context = useContext(SleepRecoveryContext);
  if (!context) {
    throw new Error('useSleepRecovery must be used within a SleepRecoveryProvider');
  }
  return context;
}
