// Adaptive TDEE Storage Service
// Handles persistence for body weight and calorie history

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BodyWeightLog,
  DailyCalorieLog,
  AdaptiveTDEEResult,
  TDEE_CONSTANTS,
} from '../types/adaptiveTDEE';

const STORAGE_KEYS = {
  WEIGHT_HISTORY: 'hc_adaptive_tdee_weight_history',
  CALORIE_HISTORY: 'hc_adaptive_tdee_calorie_history',
  TDEE_RESULT: 'hc_adaptive_tdee_result',
  SETTINGS: 'hc_adaptive_tdee_settings',
};

// Generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Get today's date as ISO string (YYYY-MM-DD)
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// Convert weight between units
export function convertBodyWeight(weight: number, fromUnit: 'lb' | 'kg', toUnit: 'lb' | 'kg'): number {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === 'lb' && toUnit === 'kg') return Math.round(weight * 0.453592 * 10) / 10;
  if (fromUnit === 'kg' && toUnit === 'lb') return Math.round(weight * 2.20462 * 10) / 10;
  return weight;
}

export const adaptiveTDEEStorage = {
  // ==========================================
  // Body Weight Management
  // ==========================================

  async getWeightHistory(): Promise<BodyWeightLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_HISTORY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('[AdaptiveTDEE] Error loading weight history:', error);
      return [];
    }
  },

  async logWeight(
    weight: number,
    unit: 'lb' | 'kg',
    source: BodyWeightLog['source'] = 'manual'
  ): Promise<BodyWeightLog> {
    try {
      const history = await this.getWeightHistory();
      const today = getTodayISO();
      const now = new Date().toISOString();

      // Check if we already have a log for today from the same source
      const existingIndex = history.findIndex(
        (log) => log.date === today && log.source === source
      );

      const newLog: BodyWeightLog = {
        id: existingIndex >= 0 ? history[existingIndex].id : generateUUID(),
        date: today,
        weight,
        unit,
        source,
        timestamp: now,
      };

      if (existingIndex >= 0) {
        // Update existing log
        history[existingIndex] = newLog;
        console.log('[AdaptiveTDEE] Updated weight log for today:', newLog);
      } else {
        // Add new log
        history.push(newLog);
        console.log('[AdaptiveTDEE] Added new weight log:', newLog);
      }

      // Sort by date descending
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Keep only last 365 days
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const filtered = history.filter(
        (log) => new Date(log.date) >= oneYearAgo
      );

      await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(filtered));
      return newLog;
    } catch (error) {
      console.error('[AdaptiveTDEE] Error logging weight:', error);
      throw error;
    }
  },

  async getWeightForDate(date: string): Promise<BodyWeightLog | null> {
    const history = await this.getWeightHistory();
    return history.find((log) => log.date === date) || null;
  },

  async getWeightForDateRange(startDate: string, endDate: string): Promise<BodyWeightLog[]> {
    const history = await this.getWeightHistory();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return history.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });
  },

  async getLatestWeight(): Promise<BodyWeightLog | null> {
    const history = await this.getWeightHistory();
    return history.length > 0 ? history[0] : null;
  },

  async getWeeklyAverageWeight(weeksAgo: number = 0, unit: 'lb' | 'kg' = 'lb'): Promise<number | null> {
    const history = await this.getWeightHistory();

    // Calculate the week's date range
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - weeksAgo * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekLogs = history.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate < weekEnd;
    });

    if (weekLogs.length === 0) return null;

    // Convert all weights to target unit and calculate average
    const totalWeight = weekLogs.reduce((sum, log) => {
      const convertedWeight = convertBodyWeight(log.weight, log.unit, unit);
      return sum + convertedWeight;
    }, 0);

    return Math.round((totalWeight / weekLogs.length) * 10) / 10;
  },

  // ==========================================
  // Daily Calorie Management
  // ==========================================

  async getCalorieHistory(): Promise<DailyCalorieLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CALORIE_HISTORY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('[AdaptiveTDEE] Error loading calorie history:', error);
      return [];
    }
  },

  async logDailyCalories(
    date: string,
    caloriesConsumed: number,
    caloriesBurned: number = 0,
    mealsLogged: number = 0,
    isComplete: boolean = false
  ): Promise<DailyCalorieLog> {
    try {
      const history = await this.getCalorieHistory();

      const existingIndex = history.findIndex((log) => log.date === date);

      const newLog: DailyCalorieLog = {
        date,
        caloriesConsumed,
        caloriesBurned,
        netCalories: caloriesConsumed - caloriesBurned,
        mealsLogged,
        isComplete,
      };

      if (existingIndex >= 0) {
        history[existingIndex] = newLog;
        console.log('[AdaptiveTDEE] Updated calorie log:', newLog);
      } else {
        history.push(newLog);
        console.log('[AdaptiveTDEE] Added calorie log:', newLog);
      }

      // Sort by date descending
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Keep only last 365 days
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const filtered = history.filter(
        (log) => new Date(log.date) >= oneYearAgo
      );

      await AsyncStorage.setItem(STORAGE_KEYS.CALORIE_HISTORY, JSON.stringify(filtered));
      return newLog;
    } catch (error) {
      console.error('[AdaptiveTDEE] Error logging calories:', error);
      throw error;
    }
  },

  async updateDailyCalories(
    date: string,
    updates: Partial<DailyCalorieLog>
  ): Promise<DailyCalorieLog | null> {
    try {
      const history = await this.getCalorieHistory();
      const existingIndex = history.findIndex((log) => log.date === date);

      if (existingIndex < 0) {
        // Create new log with updates
        return this.logDailyCalories(
          date,
          updates.caloriesConsumed || 0,
          updates.caloriesBurned || 0,
          updates.mealsLogged || 0,
          updates.isComplete || false
        );
      }

      const updatedLog = {
        ...history[existingIndex],
        ...updates,
        netCalories:
          (updates.caloriesConsumed ?? history[existingIndex].caloriesConsumed) -
          (updates.caloriesBurned ?? history[existingIndex].caloriesBurned),
      };

      history[existingIndex] = updatedLog;
      await AsyncStorage.setItem(STORAGE_KEYS.CALORIE_HISTORY, JSON.stringify(history));

      console.log('[AdaptiveTDEE] Updated calorie log:', updatedLog);
      return updatedLog;
    } catch (error) {
      console.error('[AdaptiveTDEE] Error updating calories:', error);
      return null;
    }
  },

  async getCaloriesForDate(date: string): Promise<DailyCalorieLog | null> {
    const history = await this.getCalorieHistory();
    return history.find((log) => log.date === date) || null;
  },

  async getCaloriesForDateRange(startDate: string, endDate: string): Promise<DailyCalorieLog[]> {
    const history = await this.getCalorieHistory();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return history.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });
  },

  async getWeeklyAverageCalories(weeksAgo: number = 0): Promise<number | null> {
    const history = await this.getCalorieHistory();

    // Calculate the week's date range
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - weeksAgo * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekLogs = history.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate < weekEnd;
    });

    if (weekLogs.length === 0) return null;

    const totalCalories = weekLogs.reduce((sum, log) => sum + log.caloriesConsumed, 0);
    return Math.round(totalCalories / weekLogs.length);
  },

  // ==========================================
  // TDEE Result Management
  // ==========================================

  async saveTDEEResult(result: AdaptiveTDEEResult): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TDEE_RESULT, JSON.stringify(result));
      console.log('[AdaptiveTDEE] Saved TDEE result:', {
        adaptiveTDEE: result.adaptiveTDEE,
        confidence: result.confidence,
        dataPoints: result.dataPoints,
      });
    } catch (error) {
      console.error('[AdaptiveTDEE] Error saving TDEE result:', error);
    }
  },

  async getTDEEResult(): Promise<AdaptiveTDEEResult | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TDEE_RESULT);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('[AdaptiveTDEE] Error loading TDEE result:', error);
      return null;
    }
  },

  // ==========================================
  // Data Quality Metrics
  // ==========================================

  async getDataQualityMetrics(): Promise<{
    totalWeightLogs: number;
    totalCalorieLogs: number;
    daysWithBothLogs: number;
    completeDays: number;
    oldestDataDate: string | null;
    dataSpanDays: number;
    isReadyForCalculation: boolean;
    daysUntilReady: number;
  }> {
    const weightHistory = await this.getWeightHistory();
    const calorieHistory = await this.getCalorieHistory();

    // Get unique dates with weight logs
    const weightDates = new Set(weightHistory.map((log) => log.date));
    const calorieDates = new Set(calorieHistory.map((log) => log.date));

    // Find days with both types of logs
    const daysWithBoth = [...weightDates].filter((date) => calorieDates.has(date));

    // Find complete days (where user logged all meals)
    const completeDays = calorieHistory.filter((log) => log.isComplete).length;

    // Calculate data span
    const allDates = [...weightDates, ...calorieDates].sort();
    const oldestDate = allDates.length > 0 ? allDates[0] : null;
    const dataSpanDays = oldestDate
      ? Math.ceil(
          (new Date().getTime() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    const isReady = daysWithBoth.length >= TDEE_CONSTANTS.MIN_DAYS_FOR_CALCULATION;
    const daysUntilReady = isReady
      ? 0
      : TDEE_CONSTANTS.MIN_DAYS_FOR_CALCULATION - daysWithBoth.length;

    return {
      totalWeightLogs: weightHistory.length,
      totalCalorieLogs: calorieHistory.length,
      daysWithBothLogs: daysWithBoth.length,
      completeDays,
      oldestDataDate: oldestDate,
      dataSpanDays,
      isReadyForCalculation: isReady,
      daysUntilReady: Math.max(0, daysUntilReady),
    };
  },

  // ==========================================
  // Utility Functions
  // ==========================================

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.WEIGHT_HISTORY,
        STORAGE_KEYS.CALORIE_HISTORY,
        STORAGE_KEYS.TDEE_RESULT,
        STORAGE_KEYS.SETTINGS,
      ]);
      console.log('[AdaptiveTDEE] All data cleared');
    } catch (error) {
      console.error('[AdaptiveTDEE] Error clearing data:', error);
    }
  },

  async exportData(): Promise<{
    weightHistory: BodyWeightLog[];
    calorieHistory: DailyCalorieLog[];
    tdeeResult: AdaptiveTDEEResult | null;
  }> {
    return {
      weightHistory: await this.getWeightHistory(),
      calorieHistory: await this.getCalorieHistory(),
      tdeeResult: await this.getTDEEResult(),
    };
  },
};

export default adaptiveTDEEStorage;
