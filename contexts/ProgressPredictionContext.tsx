/**
 * Progress Prediction Context
 * Provides state management for weight predictions, trends, and goal projections
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  ProgressPredictionState,
  WeightDataPoint,
  WeightPrediction,
  GoalProjection,
  TrendAnalysis,
  PlateauInfo,
  Milestone,
  ProgressSnapshot,
  WeeklyPredictionSummary,
  DEFAULT_PLATEAU_INFO,
  DEFAULT_TREND_ANALYSIS,
  PREDICTION_CONSTANTS,
} from '../types/progressPrediction';
import {
  getWeightHistory,
  addWeightDataPoint,
  getPredictions,
  savePredictions,
  getGoalProjection,
  saveGoalProjection,
  getMilestones,
  saveMilestones,
  getWeeklySummaries,
  getProgressSnapshot,
  saveProgressSnapshot,
  getLastCalculated,
  saveLastCalculated,
} from '../services/progressPredictionStorage';
import {
  calculateEMA,
  analyzeTrends,
  detectPlateau,
  generatePredictions,
  projectGoalCompletion,
  createProgressSnapshot,
  createDefaultMilestones,
  updateMilestones,
} from '../services/progressPredictionService';

// Context interface
interface ProgressPredictionContextType {
  state: ProgressPredictionState;

  // Weight logging
  logWeight: (weight: number, date?: string) => Promise<void>;
  getWeightTrend: (days?: number) => WeightDataPoint[];

  // Predictions
  getPrediction: (daysFromNow: number) => WeightPrediction | null;
  getGoalDate: () => string | null;

  // Trends
  getTrendDirection: () => 'losing' | 'gaining' | 'maintaining';
  getWeeklyRate: () => number;
  isInPlateau: () => boolean;
  getPlateauSuggestions: () => string[];

  // Milestones
  getNextMilestone: () => Milestone | null;
  getAchievedMilestones: () => Milestone[];

  // Progress
  getPercentComplete: () => number;
  getTotalLost: () => number;

  // Configuration
  setGoalWeight: (weight: number) => Promise<void>;
  setStartingWeight: (weight: number) => Promise<void>;
  setHeight: (heightCm: number) => Promise<void>;

  // Refresh
  recalculate: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Create context
const ProgressPredictionContext = createContext<ProgressPredictionContextType | undefined>(undefined);

// Provider props
interface ProgressPredictionProviderProps {
  children: ReactNode;
}

// Default state
const defaultState: ProgressPredictionState = {
  weightHistory: [],
  predictions: [],
  goalProjection: null,
  trendAnalysis: null,
  plateauInfo: DEFAULT_PLATEAU_INFO,
  milestones: [],
  snapshot: null,
  weeklySummaries: [],
  isLoading: true,
  lastCalculated: 0,
};

// Provider component
export function ProgressPredictionProvider({ children }: ProgressPredictionProviderProps) {
  const [state, setState] = useState<ProgressPredictionState>(defaultState);
  const [goalWeight, setGoalWeightState] = useState<number>(0);
  const [startingWeight, setStartingWeightState] = useState<number>(0);
  const [heightCm, setHeightCmState] = useState<number>(170);

  // Load data on mount
  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const [
        weightHistory,
        predictions,
        goalProjection,
        milestones,
        weeklySummaries,
        snapshot,
        lastCalculated,
      ] = await Promise.all([
        getWeightHistory(PREDICTION_CONSTANTS.MAX_HISTORY_DAYS),
        getPredictions(),
        getGoalProjection(),
        getMilestones(),
        getWeeklySummaries(12),
        getProgressSnapshot(),
        getLastCalculated(),
      ]);

      // Set state values from snapshot
      if (snapshot) {
        setGoalWeightState(snapshot.goalWeight);
        setStartingWeightState(snapshot.startingWeight);
        setHeightCmState(snapshot.heightCm);
      }

      // Apply trend smoothing
      const smoothedHistory = calculateEMA(weightHistory);

      // Analyze trends if we have enough data
      let trendAnalysis: TrendAnalysis | null = null;
      let plateauInfo: PlateauInfo = DEFAULT_PLATEAU_INFO;

      if (smoothedHistory.length >= PREDICTION_CONSTANTS.MIN_DATA_POINTS_TREND) {
        trendAnalysis = analyzeTrends(smoothedHistory);
        plateauInfo = detectPlateau(smoothedHistory);
      }

      setState({
        weightHistory: smoothedHistory,
        predictions,
        goalProjection,
        trendAnalysis,
        plateauInfo,
        milestones,
        snapshot,
        weeklySummaries,
        isLoading: false,
        lastCalculated,
      });
    } catch (error) {
      console.error('Error loading progress prediction data:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate all predictions and projections
  const recalculate = useCallback(async () => {
    if (state.weightHistory.length < PREDICTION_CONSTANTS.MIN_DATA_POINTS_TREND) {
      return;
    }

    try {
      // Analyze trends
      const trendAnalysis = analyzeTrends(state.weightHistory);
      const plateauInfo = detectPlateau(state.weightHistory);

      // Generate predictions
      const predictions = generatePredictions(state.weightHistory);
      await savePredictions(predictions);

      // Project goal completion
      let goalProjection: GoalProjection | null = null;
      if (goalWeight > 0) {
        goalProjection = projectGoalCompletion(state.weightHistory, goalWeight);
        await saveGoalProjection(goalProjection);
      }

      // Update milestones
      let updatedMilestones = state.milestones;
      if (goalWeight > 0 && startingWeight > 0) {
        const currentWeight = state.weightHistory[0]?.weight || startingWeight;
        if (updatedMilestones.length === 0) {
          updatedMilestones = createDefaultMilestones(startingWeight, goalWeight, currentWeight);
        } else {
          updatedMilestones = updateMilestones(
            updatedMilestones,
            currentWeight,
            startingWeight,
            goalWeight,
            trendAnalysis.weeklyChange
          );
        }
        await saveMilestones(updatedMilestones);
      }

      // Update snapshot
      let snapshot = state.snapshot;
      if (goalWeight > 0 && startingWeight > 0 && state.weightHistory.length > 0) {
        const currentWeight = state.weightHistory[0].weight;
        snapshot = createProgressSnapshot(
          currentWeight,
          startingWeight,
          goalWeight,
          heightCm
        );
        await saveProgressSnapshot(snapshot);
      }

      const now = Date.now();
      await saveLastCalculated(now);

      setState((prev) => ({
        ...prev,
        predictions,
        goalProjection,
        trendAnalysis,
        plateauInfo,
        milestones: updatedMilestones,
        snapshot,
        lastCalculated: now,
      }));
    } catch (error) {
      console.error('Error recalculating predictions:', error);
    }
  }, [state.weightHistory, state.milestones, state.snapshot, goalWeight, startingWeight, heightCm]);

  // Log weight
  const logWeight = useCallback(
    async (weight: number, date?: string) => {
      const dateStr = date || new Date().toISOString().split('T')[0];

      const dataPoint: WeightDataPoint = {
        date: dateStr,
        weight,
        trend: weight, // Will be recalculated
        timestamp: Date.now(),
      };

      const updatedHistory = await addWeightDataPoint(dataPoint);
      const smoothedHistory = calculateEMA(updatedHistory);

      setState((prev) => ({
        ...prev,
        weightHistory: smoothedHistory,
      }));

      // Recalculate after adding new data
      setTimeout(() => recalculate(), 100);
    },
    [recalculate]
  );

  // Get weight trend
  const getWeightTrend = useCallback(
    (days: number = 30): WeightDataPoint[] => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];
      return state.weightHistory.filter((w) => w.date >= cutoffStr);
    },
    [state.weightHistory]
  );

  // Get prediction for specific days
  const getPrediction = useCallback(
    (daysFromNow: number): WeightPrediction | null => {
      const prediction = state.predictions.find(
        (p) => Math.abs(p.daysFromNow - daysFromNow) < 4
      );
      return prediction || null;
    },
    [state.predictions]
  );

  // Get goal date
  const getGoalDate = useCallback((): string | null => {
    return state.goalProjection?.projectedDate || null;
  }, [state.goalProjection]);

  // Get trend direction
  const getTrendDirection = useCallback((): 'losing' | 'gaining' | 'maintaining' => {
    return state.trendAnalysis?.direction || 'maintaining';
  }, [state.trendAnalysis]);

  // Get weekly rate
  const getWeeklyRate = useCallback((): number => {
    return state.trendAnalysis?.weeklyChange || 0;
  }, [state.trendAnalysis]);

  // Check if in plateau
  const isInPlateau = useCallback((): boolean => {
    return state.plateauInfo.isInPlateau;
  }, [state.plateauInfo]);

  // Get plateau suggestions
  const getPlateauSuggestions = useCallback((): string[] => {
    return state.plateauInfo.suggestedActions;
  }, [state.plateauInfo]);

  // Get next milestone
  const getNextMilestone = useCallback((): Milestone | null => {
    const unachieved = state.milestones.filter((m) => !m.achieved);
    if (unachieved.length === 0) return null;
    return unachieved.sort((a, b) => b.currentProgress - a.currentProgress)[0];
  }, [state.milestones]);

  // Get achieved milestones
  const getAchievedMilestones = useCallback((): Milestone[] => {
    return state.milestones.filter((m) => m.achieved);
  }, [state.milestones]);

  // Get percent complete
  const getPercentComplete = useCallback((): number => {
    return state.snapshot?.percentComplete || 0;
  }, [state.snapshot]);

  // Get total lost
  const getTotalLost = useCallback((): number => {
    return state.snapshot?.totalLost || 0;
  }, [state.snapshot]);

  // Set goal weight
  const setGoalWeight = useCallback(
    async (weight: number) => {
      setGoalWeightState(weight);

      // Update snapshot and recalculate
      if (state.weightHistory.length > 0 && startingWeight > 0) {
        const currentWeight = state.weightHistory[0].weight;
        const snapshot = createProgressSnapshot(currentWeight, startingWeight, weight, heightCm);
        await saveProgressSnapshot(snapshot);

        const milestones = createDefaultMilestones(startingWeight, weight, currentWeight);
        await saveMilestones(milestones);

        setState((prev) => ({
          ...prev,
          snapshot,
          milestones,
        }));
      }

      setTimeout(() => recalculate(), 100);
    },
    [state.weightHistory, startingWeight, heightCm, recalculate]
  );

  // Set starting weight
  const setStartingWeight = useCallback(
    async (weight: number) => {
      setStartingWeightState(weight);
      setTimeout(() => recalculate(), 100);
    },
    [recalculate]
  );

  // Set height
  const setHeight = useCallback(
    async (height: number) => {
      setHeightCmState(height);
      setTimeout(() => recalculate(), 100);
    },
    [recalculate]
  );

  // Refresh
  const refresh = useCallback(async () => {
    await loadData();
    await recalculate();
  }, [loadData, recalculate]);

  // Context value
  const value = useMemo<ProgressPredictionContextType>(() => ({
    state,
    logWeight,
    getWeightTrend,
    getPrediction,
    getGoalDate,
    getTrendDirection,
    getWeeklyRate,
    isInPlateau,
    getPlateauSuggestions,
    getNextMilestone,
    getAchievedMilestones,
    getPercentComplete,
    getTotalLost,
    setGoalWeight,
    setStartingWeight,
    setHeight,
    recalculate,
    refresh,
  }), [
    state,
    logWeight,
    getWeightTrend,
    getPrediction,
    getGoalDate,
    getTrendDirection,
    getWeeklyRate,
    isInPlateau,
    getPlateauSuggestions,
    getNextMilestone,
    getAchievedMilestones,
    getPercentComplete,
    getTotalLost,
    setGoalWeight,
    setStartingWeight,
    setHeight,
    recalculate,
    refresh,
  ]);

  return (
    <ProgressPredictionContext.Provider value={value}>
      {children}
    </ProgressPredictionContext.Provider>
  );
}

// Hook to use the context
export function useProgressPrediction(): ProgressPredictionContextType {
  const context = useContext(ProgressPredictionContext);
  if (!context) {
    throw new Error('useProgressPrediction must be used within a ProgressPredictionProvider');
  }
  return context;
}
