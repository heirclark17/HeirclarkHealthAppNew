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
  ProgressiveOverloadEntry,
  OverloadStatus,
  UserProgressionProfile,
  AIWeeklyAnalysis,
  OverloadTrend,
  MuscleGroup,
} from '../types/training';
import { api } from './api';

const STORAGE_KEYS = {
  WEIGHT_LOGS: 'hc_weight_logs',
  SETTINGS: 'hc_weight_tracking_settings',
  PROGRESSION_PROFILE: 'hc_progression_profile',
  AI_ANALYSIS_CACHE: 'hc_ai_analysis_cache',
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

  // Sync PRs from backend and merge with local data
  async syncPersonalRecordsFromBackend(): Promise<void> {
    try {
      console.log('[WeightTracking] 🔄 Syncing PRs from backend...');
      const backendPRs = await api.getPersonalRecords();

      if (backendPRs && Object.keys(backendPRs).length > 0) {
        const logs = await this.getAllWeightLogs();
        const settings = await this.getSettings();

        // For each backend PR, check if we have it locally
        for (const [exerciseName, prData] of Object.entries(backendPRs)) {
          const localLogs = logs.filter(l => l.exerciseName === exerciseName);
          const localMax = localLogs.length > 0 ? Math.max(...localLogs.map(l => l.maxWeight)) : 0;

          // If backend PR is higher than local max, create a log entry for it
          if (prData.weight > localMax) {
            console.log(`[WeightTracking] Found higher PR from backend: ${exerciseName} = ${prData.weight}`);
            const newLog: WeightLog = {
              id: generateUUID(),
              exerciseId: `backend-pr-${exerciseName.toLowerCase().replace(/\s+/g, '-')}`,
              exerciseName,
              date: prData.achievedAt || new Date().toISOString(),
              weekNumber: 0,
              sets: [{
                setNumber: 1,
                weight: prData.weight,
                unit: settings.preferredUnit,
                reps: prData.reps || 1,
                isWarmup: false,
              }],
              totalVolume: prData.weight * (prData.reps || 1),
              maxWeight: prData.weight,
              averageWeight: prData.weight,
              personalRecord: true,
            };
            logs.push(newLog);
          }
        }

        await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(logs));
        console.log('[WeightTracking] ✅ PRs synced from backend');
      }
    } catch (error) {
      console.error('[WeightTracking] Error syncing PRs from backend:', error);
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

      // *** Sync PR to backend if this is a personal record ***
      if (personalRecord && maxWeight > 0) {
        try {
          console.log('[WeightTracking] 🏆 New PR detected! Syncing to backend...');
          const reps = workingSets.length > 0 ? workingSets[0].reps : 1;
          const success = await api.savePersonalRecord(
            log.exerciseName,
            maxWeight,
            reps,
            log.notes
          );
          if (success) {
            console.log('[WeightTracking] ✅ PR synced to backend');
          } else {
            console.warn('[WeightTracking] ⚠️ PR sync failed - saved locally');
          }
        } catch (syncError) {
          console.error('[WeightTracking] ❌ PR sync error:', syncError);
        }
      }

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

  // ==========================================
  // Progressive Overload Tracking
  // ==========================================

  /** Brzycki formula: weight × (36 / (37 - reps)) */
  getEstimated1RM(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (reps >= 37) return weight * 2; // cap at extreme reps
    return Math.round(weight * (36 / (37 - reps)));
  },

  /** Get the ISO week start date (Monday) for a given date */
  _getWeekStart(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  },

  /** Aggregate logs into weekly overload entries for a given exercise */
  async getWeeklyOverloadEntries(
    exerciseId: string,
    weekCount: number = 8
  ): Promise<ProgressiveOverloadEntry[]> {
    const logs = await this.getLogsForExercise(exerciseId);
    if (logs.length === 0) return [];

    // Group logs by week
    const weekMap = new Map<string, WeightLog[]>();
    for (const log of logs) {
      const weekStart = this._getWeekStart(log.date);
      if (!weekMap.has(weekStart)) weekMap.set(weekStart, []);
      weekMap.get(weekStart)!.push(log);
    }

    // Sort weeks chronologically and take the last N
    const sortedWeeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-weekCount);

    const entries: ProgressiveOverloadEntry[] = [];

    for (let i = 0; i < sortedWeeks.length; i++) {
      const [weekStart, weekLogs] = sortedWeeks[i];
      const allSets = weekLogs.flatMap(l => l.sets.filter(s => !s.isWarmup));
      const totalSets = allSets.length;
      const totalReps = allSets.reduce((sum, s) => sum + s.reps, 0);
      const totalVolume = allSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      const maxWeight = allSets.length > 0 ? Math.max(...allSets.map(s => s.weight)) : 0;
      const bestSet = allSets.reduce((best, s) => {
        const e1rm = this.getEstimated1RM(s.weight, s.reps);
        return e1rm > best.e1rm ? { e1rm, weight: s.weight, reps: s.reps } : best;
      }, { e1rm: 0, weight: 0, reps: 0 });
      const averageRPE = allSets.filter(s => s.rpe).length > 0
        ? allSets.filter(s => s.rpe).reduce((sum, s) => sum + (s.rpe || 0), 0) / allSets.filter(s => s.rpe).length
        : 0;

      const prev = i > 0 ? entries[i - 1] : null;
      const volumeChangePercent = prev && prev.totalVolume > 0
        ? Math.round(((totalVolume - prev.totalVolume) / prev.totalVolume) * 100)
        : 0;
      const e1rmChangePercent = prev && prev.estimated1RM > 0
        ? Math.round(((bestSet.e1rm - prev.estimated1RM) / prev.estimated1RM) * 100)
        : 0;

      const overloadStatus = this.calculateOverloadStatus(
        { totalVolume, estimated1RM: bestSet.e1rm, totalSets },
        prev ? { totalVolume: prev.totalVolume, estimated1RM: prev.estimated1RM, totalSets: prev.totalSets } : null
      );

      entries.push({
        exerciseId,
        exerciseName: weekLogs[0].exerciseName,
        weekNumber: i + 1,
        weekStartDate: weekStart,
        totalSets,
        totalReps,
        totalVolume,
        maxWeight,
        estimated1RM: bestSet.e1rm,
        averageRPE: Math.round(averageRPE * 10) / 10,
        volumeChangePercent,
        estimated1RMChangePercent: e1rmChangePercent,
        overloadStatus,
        sessions: weekLogs.length,
      });
    }

    return entries;
  },

  /** Determine overload status based on current vs previous week */
  calculateOverloadStatus(
    current: { totalVolume: number; estimated1RM: number; totalSets: number },
    previous: { totalVolume: number; estimated1RM: number; totalSets: number } | null
  ): OverloadStatus {
    if (!previous) return 'new_exercise';

    const volumeChange = previous.totalVolume > 0
      ? ((current.totalVolume - previous.totalVolume) / previous.totalVolume) * 100
      : 0;
    const e1rmChange = previous.estimated1RM > 0
      ? ((current.estimated1RM - previous.estimated1RM) / previous.estimated1RM) * 100
      : 0;

    if (e1rmChange > 5) return 'pr_set';
    if (volumeChange > 3 || e1rmChange > 1) return 'progressing';
    if (volumeChange >= -3 && volumeChange <= 3) return 'maintaining';
    if (volumeChange < -10 || e1rmChange < -5) return 'regressing';
    return 'stalling';
  },

  /** Map exercise names to muscle groups */
  _exerciseToMuscleGroup(exerciseName: string): MuscleGroup {
    const name = exerciseName.toLowerCase();
    if (name.includes('bench') || name.includes('chest') || name.includes('fly') || name.includes('push-up') || name.includes('pushup')) return 'chest';
    if (name.includes('squat') || name.includes('leg press') || name.includes('lunge') || name.includes('quad')) return 'quads';
    if (name.includes('deadlift') || name.includes('row') || name.includes('pull-up') || name.includes('pullup') || name.includes('lat') || name.includes('back')) return 'back';
    if (name.includes('shoulder') || name.includes('press') || name.includes('delt') || name.includes('lateral raise') || name.includes('overhead')) return 'shoulders';
    if (name.includes('curl') || name.includes('bicep')) return 'biceps';
    if (name.includes('tricep') || name.includes('pushdown') || name.includes('extension') || name.includes('dip') || name.includes('skullcrusher')) return 'triceps';
    if (name.includes('hamstring') || name.includes('leg curl') || name.includes('romanian') || name.includes('rdl')) return 'hamstrings';
    if (name.includes('glute') || name.includes('hip thrust') || name.includes('bridge')) return 'glutes';
    if (name.includes('calf') || name.includes('calves')) return 'calves';
    if (name.includes('ab') || name.includes('core') || name.includes('crunch') || name.includes('plank')) return 'core';
    if (name.includes('forearm') || name.includes('wrist') || name.includes('grip')) return 'forearms';
    return 'full_body';
  },

  /** Get weekly set counts per muscle group */
  async getMuscleGroupVolume(weekStartDate?: string): Promise<{ muscleGroup: MuscleGroup; weeklySets: number }[]> {
    const logs = await this.getAllWeightLogs();
    const targetWeekStart = weekStartDate || this._getWeekStart(new Date().toISOString());

    const weekLogs = logs.filter(l => this._getWeekStart(l.date) === targetWeekStart);
    const muscleMap = new Map<MuscleGroup, number>();

    for (const log of weekLogs) {
      const muscleGroup = this._exerciseToMuscleGroup(log.exerciseName);
      const workingSets = log.sets.filter(s => !s.isWarmup).length;
      muscleMap.set(muscleGroup, (muscleMap.get(muscleGroup) || 0) + workingSets);
    }

    const allGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'calves', 'core'];
    return allGroups.map(mg => ({
      muscleGroup: mg,
      weeklySets: muscleMap.get(mg) || 0,
    }));
  },

  /** Get overload trends for chart rendering */
  async getOverloadTrends(exerciseId: string, weekCount: number = 12): Promise<OverloadTrend | null> {
    const entries = await this.getWeeklyOverloadEntries(exerciseId, weekCount);
    if (entries.length === 0) return null;

    return {
      exerciseId,
      exerciseName: entries[0].exerciseName,
      dataPoints: entries.map(e => ({
        weekNumber: e.weekNumber,
        weekStartDate: e.weekStartDate,
        estimated1RM: e.estimated1RM,
        totalVolume: e.totalVolume,
        maxWeight: e.maxWeight,
        averageReps: e.totalReps > 0 && e.totalSets > 0 ? Math.round(e.totalReps / e.totalSets) : 0,
      })),
    };
  },

  // ==========================================
  // User Progression Profile
  // ==========================================

  async getUserProgressionProfile(): Promise<UserProgressionProfile> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESSION_PROFILE);
      if (data) return JSON.parse(data);
    } catch (error) {
      console.error('[WeightTracking] Error loading progression profile:', error);
    }
    return {
      fitnessLevel: 'intermediate',
      progressionModel: 'double_progression',
      weightIncrements: { upper: 5, lower: 10 },
      preferredUnit: 'lb',
      deloadFrequency: 4,
      targetRPE: 8,
      repRanges: {
        strength: [3, 5],
        hypertrophy: [8, 12],
        endurance: [12, 20],
      },
    };
  },

  async saveUserProgressionProfile(profile: UserProgressionProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESSION_PROFILE, JSON.stringify(profile));
      console.log('[WeightTracking] Progression profile saved');
    } catch (error) {
      console.error('[WeightTracking] Error saving progression profile:', error);
    }
  },

  // ==========================================
  // AI Analysis Cache
  // ==========================================

  async getAIAnalysisCache(weekStart: string): Promise<AIWeeklyAnalysis | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AI_ANALYSIS_CACHE);
      if (data) {
        const cache: Record<string, AIWeeklyAnalysis> = JSON.parse(data);
        return cache[weekStart] || null;
      }
    } catch (error) {
      console.error('[WeightTracking] Error loading AI analysis cache:', error);
    }
    return null;
  },

  async saveAIAnalysisCache(weekStart: string, analysis: AIWeeklyAnalysis): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AI_ANALYSIS_CACHE);
      const cache: Record<string, AIWeeklyAnalysis> = data ? JSON.parse(data) : {};
      cache[weekStart] = analysis;
      // Keep only last 8 weeks
      const keys = Object.keys(cache).sort();
      if (keys.length > 8) {
        for (const old of keys.slice(0, keys.length - 8)) delete cache[old];
      }
      await AsyncStorage.setItem(STORAGE_KEYS.AI_ANALYSIS_CACHE, JSON.stringify(cache));
    } catch (error) {
      console.error('[WeightTracking] Error saving AI analysis cache:', error);
    }
  },

  /** Get all exercises with logs in a specific week */
  async getExercisesForWeek(weekStartDate?: string): Promise<{ exerciseId: string; exerciseName: string }[]> {
    const logs = await this.getAllWeightLogs();
    const targetWeekStart = weekStartDate || this._getWeekStart(new Date().toISOString());
    const weekLogs = logs.filter(l => this._getWeekStart(l.date) === targetWeekStart);
    const seen = new Set<string>();
    const exercises: { exerciseId: string; exerciseName: string }[] = [];
    for (const log of weekLogs) {
      if (!seen.has(log.exerciseId)) {
        seen.add(log.exerciseId);
        exercises.push({ exerciseId: log.exerciseId, exerciseName: log.exerciseName });
      }
    }
    return exercises;
  },

  /** Get count of sessions in a week */
  async getWeekSessionCount(weekStartDate?: string): Promise<number> {
    const logs = await this.getAllWeightLogs();
    const targetWeekStart = weekStartDate || this._getWeekStart(new Date().toISOString());
    const weekLogs = logs.filter(l => this._getWeekStart(l.date) === targetWeekStart);
    const uniqueDates = new Set(weekLogs.map(l => l.date.split('T')[0]));
    return uniqueDates.size;
  },
};

export default weightTrackingStorage;
