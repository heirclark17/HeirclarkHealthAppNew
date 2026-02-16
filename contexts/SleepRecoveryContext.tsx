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
import { RecoveryContext as PlannerRecoveryContext } from '../types/planner';
import * as SleepStorage from '../services/sleepRecoveryStorage';
import { api } from '../services/api';
import { useGoalWizard } from './GoalWizardContext';
import { appleHealthService } from '../services/appleHealthService';

interface SleepRecoveryContextType {
  state: SleepRecoveryState;
  logSleep: (entry: Omit<SleepEntry, 'id'>) => Promise<void>;
  updateSleepEntry: (entry: SleepEntry) => Promise<void>;
  deleteSleepEntry: (entryId: string) => Promise<void>;
  updateSleepGoal: (goal: SleepGoal) => Promise<void>;
  calculateRecoveryScore: () => Promise<RecoveryScore>;
  getRecoveryContext: () => Promise<PlannerRecoveryContext>;
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
  const { state: goalState } = useGoalWizard();

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Try backend first for sleep history, fall back to local storage
      let entries;
      try {
        const backendSleep = await api.getSleepHistory(14);
        if (backendSleep && backendSleep.length > 0) {
          console.log('[SleepRecovery] Loaded sleep history from backend:', backendSleep.length);
          entries = backendSleep.map((s: any) => ({
            id: s.id || `sleep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            date: s.date,
            bedTime: s.bedTime || s.bed_time,
            wakeTime: s.wakeTime || s.wake_time,
            duration: s.totalHours || s.total_hours || s.duration || 0,
            quality: s.qualityScore || s.quality_score || s.quality || 3,
            ...s,
          }));
        } else {
          entries = await SleepStorage.getSleepEntries();
        }
      } catch (apiError) {
        console.error('[SleepRecovery] API fetch error, falling back to local:', apiError);
        entries = await SleepStorage.getSleepEntries();
      }

      const [scores, storedGoal, avgDuration, debt] = await Promise.all([
        SleepStorage.getRecoveryScores(),
        SleepStorage.getSleepGoal(),
        SleepStorage.getAverageSleepDuration(),
        SleepStorage.calculateSleepDebt(),
      ]);

      // Use sleep goal from GoalWizard if available, otherwise use stored goal
      const targetDuration = goalState.sleepGoalHours || storedGoal.targetDuration;
      const goal: SleepGoal = {
        ...storedGoal,
        targetDuration,
      };

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
  }, [goalState.sleepGoalHours]);

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

    // Fire-and-forget: sync sleep log to backend
    try {
      await api.logSleep({
        date: entry.date,
        bedTime: (entry as any).bedTime,
        wakeTime: (entry as any).wakeTime,
        totalHours: (entry as any).duration,
        qualityScore: (entry as any).quality,
      });
    } catch (error) {
      console.error('[SleepRecovery] API sync error:', error);
    }
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
    const goalSleepMinutes = state.sleepGoal.targetDuration; // in minutes
    const goalSleepHours = goalSleepMinutes / 60;

    // --- Factor 1: Sleep Duration (35%) ---
    // Try Apple Health first, fall back to manual entry
    let actualSleepHours = 0;
    try {
      const lastNightStart = new Date();
      lastNightStart.setDate(lastNightStart.getDate() - 1);
      lastNightStart.setHours(18, 0, 0, 0); // 6 PM yesterday
      const thismorning = new Date();
      thismorning.setHours(12, 0, 0, 0); // noon today
      const sleepData = await appleHealthService.getSleepData(lastNightStart, thismorning);
      if (sleepData.totalSleepMinutes > 0) {
        actualSleepHours = sleepData.totalSleepMinutes / 60;
      }
    } catch (e) {
      console.warn('[SleepRecovery] Apple Health sleep fetch failed:', e);
    }
    // Fall back to manual entry if no Apple Health data
    if (actualSleepHours === 0 && todaySleep) {
      actualSleepHours = todaySleep.duration / 60;
    }
    const sleepFactor = actualSleepHours > 0
      ? Math.min(100, Math.round((actualSleepHours / goalSleepHours) * 100))
      : 50;

    // --- Factor 2: Sleep Quality (25%) - manual rating ---
    const qualityFactor = todaySleep ? todaySleep.quality * 20 : 50;

    // --- Factor 3: HRV (15%) ---
    let hrvMs: number | null = null;
    let hrvFactor = 50; // default
    try {
      const hrvStart = new Date();
      hrvStart.setHours(0, 0, 0, 0);
      const hrvEnd = new Date();
      hrvMs = await appleHealthService.getHRVData(hrvStart, hrvEnd);
      if (hrvMs !== null) {
        // 20ms = poor (0), 100ms = excellent (100), linear scale
        hrvFactor = Math.max(0, Math.min(100, Math.round(((hrvMs - 20) / 80) * 100)));
      }
    } catch (e) {
      console.warn('[SleepRecovery] Apple Health HRV fetch failed:', e);
    }

    // --- Factor 4: Activity / Steps (15%) ---
    let activityFactor = 65; // default
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdaySteps = await appleHealthService.getStepCount(yesterday);
      const stepGoal = goalState.stepGoal || 10000;
      if (yesterdaySteps > 0) {
        activityFactor = Math.max(0, Math.min(100, Math.round((yesterdaySteps / stepGoal) * 100)));
      }
    } catch (e) {
      console.warn('[SleepRecovery] Apple Health steps fetch failed:', e);
    }

    // --- Factor 5: Sleep Streak (10%) ---
    // Count consecutive days with sleep >= 85% of goal
    let consecutiveGoodDays = 0;
    const sortedEntries = [...state.sleepEntries].sort((a, b) => b.date.localeCompare(a.date));
    for (const entry of sortedEntries) {
      const entryHours = entry.duration / 60;
      if (entryHours >= goalSleepHours * 0.85) {
        consecutiveGoodDays++;
      } else {
        break;
      }
    }
    const streakFactor = Math.min(100, Math.round((consecutiveGoodDays / 7) * 100));

    // --- Weighted composite score ---
    const score = Math.round(
      sleepFactor * 0.35 +
      qualityFactor * 0.25 +
      hrvFactor * 0.15 +
      activityFactor * 0.15 +
      streakFactor * 0.10
    );

    const recoveryScore: RecoveryScore = {
      date: today,
      score,
      factors: {
        sleep: sleepFactor,
        quality: qualityFactor,
        hrv: hrvFactor,
        activity: activityFactor,
        streak: streakFactor,
      },
    };

    await SleepStorage.saveRecoveryScore(recoveryScore);

    setState((prev) => ({
      ...prev,
      recoveryScores: [recoveryScore, ...prev.recoveryScores.filter((s) => s.date !== today)],
    }));

    // Request AI sleep analysis from backend (fire-and-forget)
    try {
      const recentSleep = state.sleepEntries.slice(0, 7);
      const goals = {
        targetDuration: state.sleepGoal.targetDuration,
        targetBedTime: (state.sleepGoal as any).targetBedTime,
        targetWakeTime: (state.sleepGoal as any).targetWakeTime,
      };
      const aiAnalysis = await api.analyzeSleep(recentSleep, goals);
      if (aiAnalysis) {
        console.log('[SleepRecovery] AI sleep analysis received');
      }
    } catch (error) {
      console.error('[SleepRecovery] API analyze error:', error);
    }

    return recoveryScore;
  }, [state.sleepEntries, state.sleepGoal, goalState.stepGoal]);

  /**
   * Get a full recovery context for the planner scheduling engine.
   * Returns real Apple Health data where available.
   */
  const getRecoveryContext = useCallback(async (): Promise<PlannerRecoveryContext> => {
    const recoveryScore = await calculateRecoveryScore();
    const today = new Date().toISOString().split('T')[0];
    const todaySleep = state.sleepEntries.find((e) => e.date === today);
    const goalSleepHours = state.sleepGoal.targetDuration / 60;

    // Get actual sleep hours from Apple Health
    let sleepHours = todaySleep ? todaySleep.duration / 60 : 0;
    try {
      const lastNightStart = new Date();
      lastNightStart.setDate(lastNightStart.getDate() - 1);
      lastNightStart.setHours(18, 0, 0, 0);
      const thismorning = new Date();
      thismorning.setHours(12, 0, 0, 0);
      const sleepData = await appleHealthService.getSleepData(lastNightStart, thismorning);
      if (sleepData.totalSleepMinutes > 0) {
        sleepHours = sleepData.totalSleepMinutes / 60;
      }
    } catch (e) {
      // Use manual entry fallback
    }

    // Get HRV
    let hrvMs: number | null = null;
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      hrvMs = await appleHealthService.getHRVData(start, new Date());
    } catch (e) {
      // HRV unavailable
    }

    return {
      score: recoveryScore.score,
      sleepHours,
      hrvMs,
      isLowRecovery: recoveryScore.score < 50,
      isHighRecovery: recoveryScore.score >= 80,
      factors: recoveryScore.factors as PlannerRecoveryContext['factors'],
    };
  }, [calculateRecoveryScore, state.sleepEntries, state.sleepGoal]);

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
    getRecoveryContext,
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
    getRecoveryContext,
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
