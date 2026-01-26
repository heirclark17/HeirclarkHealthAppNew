// Weight Tracking Storage Service
// Handles persistence for progressive overload weight tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WeightLog,
  WeightUnit,
  SetLog,
  ExerciseProgress,
  ProgressiveOverloadRecommendation,
  WeightTrackingSettings,
} from '../types/training';

const STORAGE_KEYS = {
  WEIGHT_LOGS: 'hc_weight_logs',
  SETTINGS: 'hc_weight_tracking_settings',
};

// Generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Convert weight between units
export function convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === 'lb' && toUnit === 'kg') return Math.round(weight * 0.453592 * 10) / 10;
  if (fromUnit === 'kg' && toUnit === 'lb') return Math.round(weight * 2.20462 * 10) / 10;
  return weight;
}

// Default settings
const defaultSettings: WeightTrackingSettings = {
  preferredUnit: 'lb',
  autoConvert: true,
  trackRPE: false,
  showProgressChart: true,
  progressionStrategy: 'linear',
  minimumWeightIncrement: {
    lb: 5,
    kg: 2.5,
  },
};

export const weightTrackingStorage = {
  // ==========================================
  // Settings Management
  // ==========================================

  async getSettings(): Promise<WeightTrackingSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...defaultSettings, ...JSON.parse(data) };
      }
      return defaultSettings;
    } catch (error) {
      console.error('[WeightTracking] Error loading settings:', error);
      return defaultSettings;
    }
  },

  async saveSettings(settings: Partial<WeightTrackingSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      console.log('[WeightTracking] Settings saved');
    } catch (error) {
      console.error('[WeightTracking] Error saving settings:', error);
    }
  },

  // ==========================================
  // Weight Log Management
  // ==========================================

  async getAllWeightLogs(): Promise<WeightLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('[WeightTracking] Error loading weight logs:', error);
      return [];
    }
  },

  async saveWeightLog(log: Omit<WeightLog, 'id' | 'totalVolume' | 'maxWeight' | 'averageWeight'>): Promise<WeightLog> {
    try {
      const logs = await this.getAllWeightLogs();

      // Calculate derived fields
      const totalVolume = log.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      const maxWeight = Math.max(...log.sets.filter(s => !s.isWarmup).map(s => s.weight), 0);
      const workingSets = log.sets.filter(s => !s.isWarmup);
      const averageWeight = workingSets.length > 0
        ? Math.round(workingSets.reduce((sum, s) => sum + s.weight, 0) / workingSets.length * 10) / 10
        : 0;

      // Check for personal record
      const previousLogs = logs.filter(l => l.exerciseId === log.exerciseId);
      const previousMax = previousLogs.length > 0
        ? Math.max(...previousLogs.map(l => l.maxWeight))
        : 0;
      const personalRecord = maxWeight > previousMax;

      const newLog: WeightLog = {
        id: generateUUID(),
        ...log,
        totalVolume,
        maxWeight,
        averageWeight,
        personalRecord,
      };

      logs.push(newLog);
      await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(logs));

      console.log('[WeightTracking] Weight log saved:', {
        exercise: log.exerciseName,
        maxWeight,
        personalRecord,
      });

      return newLog;
    } catch (error) {
      console.error('[WeightTracking] Error saving weight log:', error);
      throw error;
    }
  },

  async getLogsForExercise(exerciseId: string): Promise<WeightLog[]> {
    const logs = await this.getAllWeightLogs();
    return logs
      .filter(l => l.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getLastLogForExercise(exerciseId: string): Promise<WeightLog | null> {
    const logs = await this.getLogsForExercise(exerciseId);
    return logs.length > 0 ? logs[0] : null;
  },

  // ==========================================
  // Progress Calculation
  // ==========================================

  async getExerciseProgress(exerciseId: string, exerciseName: string): Promise<ExerciseProgress | null> {
    const logs = await this.getLogsForExercise(exerciseId);

    if (logs.length === 0) return null;

    const settings = await this.getSettings();
    const unit = settings.preferredUnit;

    // Sort by date ascending for calculations
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const firstLog = sortedLogs[0];
    const lastLog = sortedLogs[sortedLogs.length - 1];
    const allTimeMax = Math.max(...sortedLogs.map(l => l.maxWeight));
    const allTimeMaxLog = sortedLogs.find(l => l.maxWeight === allTimeMax);

    // Calculate progress percentage
    const progressPercentage = firstLog.maxWeight > 0
      ? Math.round(((lastLog.maxWeight - firstLog.maxWeight) / firstLog.maxWeight) * 100)
      : 0;

    // Determine trend (last 3 sessions)
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (sortedLogs.length >= 3) {
      const recent = sortedLogs.slice(-3);
      const recentChanges = [];
      for (let i = 1; i < recent.length; i++) {
        recentChanges.push(recent[i].maxWeight - recent[i - 1].maxWeight);
      }
      const avgChange = recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length;
      if (avgChange > 0) trend = 'increasing';
      else if (avgChange < 0) trend = 'decreasing';
    }

    // Weekly history
    const weeklyHistory = sortedLogs.map(log => ({
      weekNumber: log.weekNumber,
      date: log.date,
      maxWeight: log.maxWeight,
      totalVolume: log.totalVolume,
      avgReps: log.sets.length > 0
        ? Math.round(log.sets.reduce((sum, s) => sum + s.reps, 0) / log.sets.length)
        : 0,
    }));

    // Suggest next weight (linear progression)
    const increment = settings.minimumWeightIncrement[unit];
    let suggestedNextWeight = lastLog.maxWeight;

    // If last session was successful (hit target reps), suggest increase
    const lastWorkingSets = lastLog.sets.filter(s => !s.isWarmup);
    const avgReps = lastWorkingSets.length > 0
      ? lastWorkingSets.reduce((sum, s) => sum + s.reps, 0) / lastWorkingSets.length
      : 0;

    if (avgReps >= 8 && trend !== 'decreasing') {
      suggestedNextWeight = lastLog.maxWeight + increment;
    }

    const previousLog = sortedLogs.length >= 2 ? sortedLogs[sortedLogs.length - 2] : null;

    return {
      exerciseId,
      exerciseName,
      totalSessions: logs.length,
      currentMax: lastLog.maxWeight,
      currentMaxUnit: unit,
      previousMax: previousLog?.maxWeight || 0,
      allTimeMax,
      allTimeMaxDate: allTimeMaxLog?.date || lastLog.date,
      lastSessionDate: lastLog.date,
      progressPercentage,
      trend,
      weeklyHistory,
      suggestedNextWeight,
    };
  },

  // ==========================================
  // Progressive Overload Recommendations
  // ==========================================

  async getProgressiveOverloadRecommendation(
    exerciseId: string,
    exerciseName: string
  ): Promise<ProgressiveOverloadRecommendation | null> {
    const settings = await this.getSettings();
    const progress = await this.getExerciseProgress(exerciseId, exerciseName);

    if (!progress || progress.totalSessions === 0) {
      return null;
    }

    const unit = settings.preferredUnit;
    const increment = settings.minimumWeightIncrement[unit];

    // Get last session details
    const lastLog = await this.getLastLogForExercise(exerciseId);
    if (!lastLog) return null;

    const workingSets = lastLog.sets.filter(s => !s.isWarmup);
    const avgReps = workingSets.length > 0
      ? workingSets.reduce((sum, s) => sum + s.reps, 0) / workingSets.length
      : 0;

    let suggestedWeight = progress.currentMax;
    let reason = '';
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let readyToProgress = false;

    // Double progression logic
    if (settings.progressionStrategy === 'double_progression') {
      // If hitting top of rep range (e.g., 12 reps), increase weight
      if (avgReps >= 12) {
        suggestedWeight = progress.currentMax + increment;
        reason = `Hit ${Math.round(avgReps)} reps last session. Ready to increase weight and reset to 8 reps.`;
        confidence = 'high';
        readyToProgress = true;
      } else if (avgReps >= 8) {
        reason = `Currently at ${Math.round(avgReps)} reps. Add 1-2 reps next session before increasing weight.`;
        confidence = 'medium';
        readyToProgress = false;
      } else {
        reason = `Only hit ${Math.round(avgReps)} reps. Focus on getting stronger at current weight.`;
        confidence = 'low';
        readyToProgress = false;
      }
    } else {
      // Linear progression
      if (progress.trend === 'increasing' && avgReps >= 8) {
        suggestedWeight = progress.currentMax + increment;
        reason = `Consistent progress. Add ${increment}${unit} for progressive overload.`;
        confidence = 'high';
        readyToProgress = true;
      } else if (progress.trend === 'stable' && avgReps >= 10) {
        suggestedWeight = progress.currentMax + increment;
        reason = `Plateau detected. Try adding ${increment}${unit} to break through.`;
        confidence = 'medium';
        readyToProgress = true;
      } else if (progress.trend === 'decreasing') {
        reason = 'Performance declining. Consider a deload week or reviewing recovery.';
        confidence = 'low';
        readyToProgress = false;
      } else {
        reason = 'Keep working at current weight until you can complete all reps with good form.';
        confidence = 'medium';
        readyToProgress = false;
      }
    }

    return {
      exerciseId,
      exerciseName,
      currentWeight: progress.currentMax,
      suggestedWeight,
      unit,
      reason,
      confidence,
      readyToProgress,
      suggestedReps: readyToProgress ? 8 : undefined,
    };
  },

  // ==========================================
  // Utility Functions
  // ==========================================

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.WEIGHT_LOGS, STORAGE_KEYS.SETTINGS]);
      console.log('[WeightTracking] All data cleared');
    } catch (error) {
      console.error('[WeightTracking] Error clearing data:', error);
    }
  },

  async getExercisesWithHistory(): Promise<string[]> {
    const logs = await this.getAllWeightLogs();
    const exerciseIds = new Set(logs.map(l => l.exerciseId));
    return Array.from(exerciseIds);
  },
};

export default weightTrackingStorage;
