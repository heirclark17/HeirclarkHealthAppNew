/**
 * Progress Prediction Storage Service
 * Handles AsyncStorage persistence for weight history, predictions, and milestones
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WeightDataPoint,
  WeightPrediction,
  GoalProjection,
  Milestone,
  WeeklyPredictionSummary,
  ProgressSnapshot,
  PREDICTION_CONSTANTS,
} from '../types/progressPrediction';

// Storage keys
const STORAGE_KEYS = {
  WEIGHT_HISTORY: '@progress_weight_history',
  PREDICTIONS: '@progress_predictions',
  GOAL_PROJECTION: '@progress_goal_projection',
  MILESTONES: '@progress_milestones',
  WEEKLY_SUMMARIES: '@progress_weekly_summaries',
  SNAPSHOT: '@progress_snapshot',
  LAST_CALCULATED: '@progress_last_calculated',
};

// ============ Weight History Storage ============

/**
 * Get weight history
 */
export async function getWeightHistory(days?: number): Promise<WeightDataPoint[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_HISTORY);
    if (data) {
      let history: WeightDataPoint[] = JSON.parse(data);

      // Sort by date descending (newest first)
      history.sort((a, b) => b.date.localeCompare(a.date));

      // Filter by days if specified
      if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];
        history = history.filter((h) => h.date >= cutoffStr);
      }

      return history;
    }
  } catch (error) {
    console.error('Error getting weight history:', error);
  }
  return [];
}

/**
 * Add or update a weight data point
 */
export async function addWeightDataPoint(dataPoint: WeightDataPoint): Promise<WeightDataPoint[]> {
  try {
    const history = await getWeightHistory();

    // Check if we already have data for this date
    const existingIndex = history.findIndex((h) => h.date === dataPoint.date);
    if (existingIndex >= 0) {
      // Update existing
      history[existingIndex] = dataPoint;
    } else {
      // Add new
      history.push(dataPoint);
    }

    // Sort by date descending
    history.sort((a, b) => b.date.localeCompare(a.date));

    // Limit to max history days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - PREDICTION_CONSTANTS.MAX_HISTORY_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    const limitedHistory = history.filter((h) => h.date >= cutoffStr);

    await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(limitedHistory));
    return limitedHistory;
  } catch (error) {
    console.error('Error adding weight data point:', error);
    throw error;
  }
}

/**
 * Get latest weight data point
 */
export async function getLatestWeight(): Promise<WeightDataPoint | null> {
  const history = await getWeightHistory(30);
  return history.length > 0 ? history[0] : null;
}

/**
 * Import weight history (for initial setup or sync)
 */
export async function importWeightHistory(dataPoints: WeightDataPoint[]): Promise<void> {
  try {
    const existing = await getWeightHistory();
    const merged = [...existing];

    // Add new data points without duplicating dates
    for (const dp of dataPoints) {
      const existingIndex = merged.findIndex((m) => m.date === dp.date);
      if (existingIndex >= 0) {
        merged[existingIndex] = dp;
      } else {
        merged.push(dp);
      }
    }

    // Sort and limit
    merged.sort((a, b) => b.date.localeCompare(a.date));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - PREDICTION_CONSTANTS.MAX_HISTORY_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    const limited = merged.filter((h) => h.date >= cutoffStr);

    await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error importing weight history:', error);
    throw error;
  }
}

// ============ Predictions Storage ============

/**
 * Get cached predictions
 */
export async function getPredictions(): Promise<WeightPrediction[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PREDICTIONS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting predictions:', error);
  }
  return [];
}

/**
 * Save predictions
 */
export async function savePredictions(predictions: WeightPrediction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(predictions));
  } catch (error) {
    console.error('Error saving predictions:', error);
    throw error;
  }
}

// ============ Goal Projection Storage ============

/**
 * Get goal projection
 */
export async function getGoalProjection(): Promise<GoalProjection | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOAL_PROJECTION);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting goal projection:', error);
  }
  return null;
}

/**
 * Save goal projection
 */
export async function saveGoalProjection(projection: GoalProjection): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GOAL_PROJECTION, JSON.stringify(projection));
  } catch (error) {
    console.error('Error saving goal projection:', error);
    throw error;
  }
}

// ============ Milestones Storage ============

/**
 * Get milestones
 */
export async function getMilestones(): Promise<Milestone[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MILESTONES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting milestones:', error);
  }
  return [];
}

/**
 * Save milestones
 */
export async function saveMilestones(milestones: Milestone[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
  } catch (error) {
    console.error('Error saving milestones:', error);
    throw error;
  }
}

/**
 * Update a single milestone
 */
export async function updateMilestone(milestoneId: string, updates: Partial<Milestone>): Promise<Milestone[]> {
  try {
    const milestones = await getMilestones();
    const index = milestones.findIndex((m) => m.id === milestoneId);

    if (index >= 0) {
      milestones[index] = { ...milestones[index], ...updates };
      await saveMilestones(milestones);
    }

    return milestones;
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }
}

// ============ Weekly Summaries Storage ============

/**
 * Get weekly summaries
 */
export async function getWeeklySummaries(count?: number): Promise<WeeklyPredictionSummary[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_SUMMARIES);
    if (data) {
      const summaries: WeeklyPredictionSummary[] = JSON.parse(data);
      return count ? summaries.slice(0, count) : summaries;
    }
  } catch (error) {
    console.error('Error getting weekly summaries:', error);
  }
  return [];
}

/**
 * Save a weekly summary
 */
export async function saveWeeklySummary(summary: WeeklyPredictionSummary): Promise<void> {
  try {
    const summaries = await getWeeklySummaries();

    // Check if we already have a summary for this week
    const existingIndex = summaries.findIndex((s) => s.weekStart === summary.weekStart);
    if (existingIndex >= 0) {
      summaries[existingIndex] = summary;
    } else {
      summaries.unshift(summary);
    }

    // Keep last 52 weeks
    const limited = summaries.slice(0, 52);
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_SUMMARIES, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving weekly summary:', error);
    throw error;
  }
}

// ============ Progress Snapshot Storage ============

/**
 * Get progress snapshot
 */
export async function getProgressSnapshot(): Promise<ProgressSnapshot | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SNAPSHOT);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting progress snapshot:', error);
  }
  return null;
}

/**
 * Save progress snapshot
 */
export async function saveProgressSnapshot(snapshot: ProgressSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SNAPSHOT, JSON.stringify(snapshot));
  } catch (error) {
    console.error('Error saving progress snapshot:', error);
    throw error;
  }
}

// ============ Calculation Timestamp Storage ============

/**
 * Get last calculation timestamp
 */
export async function getLastCalculated(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CALCULATED);
    if (data) {
      return parseInt(data, 10);
    }
  } catch (error) {
    console.error('Error getting last calculated:', error);
  }
  return 0;
}

/**
 * Save last calculation timestamp
 */
export async function saveLastCalculated(timestamp: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_CALCULATED, timestamp.toString());
  } catch (error) {
    console.error('Error saving last calculated:', error);
    throw error;
  }
}

// ============ Clear All Data ============

/**
 * Clear all progress prediction data
 */
export async function clearAllProgressData(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.WEIGHT_HISTORY),
      AsyncStorage.removeItem(STORAGE_KEYS.PREDICTIONS),
      AsyncStorage.removeItem(STORAGE_KEYS.GOAL_PROJECTION),
      AsyncStorage.removeItem(STORAGE_KEYS.MILESTONES),
      AsyncStorage.removeItem(STORAGE_KEYS.WEEKLY_SUMMARIES),
      AsyncStorage.removeItem(STORAGE_KEYS.SNAPSHOT),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_CALCULATED),
    ]);
  } catch (error) {
    console.error('Error clearing progress data:', error);
    throw error;
  }
}
