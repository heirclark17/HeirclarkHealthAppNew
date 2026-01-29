/**
 * Hydration Storage Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WaterEntry,
  DailyHydration,
  HydrationGoal,
  HydrationStreak,
  DEFAULT_HYDRATION_GOAL,
  HYDRATION_MULTIPLIERS,
} from '../types/hydration';

const STORAGE_KEYS = {
  WATER_ENTRIES: '@hydration_entries',
  HYDRATION_GOAL: '@hydration_goal',
  HYDRATION_STREAK: '@hydration_streak',
  DAILY_HISTORY: '@hydration_daily_history',
};

// Water Entries
export async function getWaterEntries(): Promise<WaterEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WATER_ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting water entries:', error);
    return [];
  }
}

export async function getTodayEntries(): Promise<WaterEntry[]> {
  try {
    const entries = await getWaterEntries();
    const today = new Date().toISOString().split('T')[0];
    return entries.filter((e) => e.date === today);
  } catch (error) {
    console.error('Error getting today entries:', error);
    return [];
  }
}

export async function saveWaterEntry(entry: WaterEntry): Promise<void> {
  try {
    const entries = await getWaterEntries();
    entries.unshift(entry);

    // Keep last 30 days of entries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    const filtered = entries.filter((e) => e.date >= cutoffDate);

    await AsyncStorage.setItem(STORAGE_KEYS.WATER_ENTRIES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error saving water entry:', error);
    throw error;
  }
}

export async function deleteWaterEntry(entryId: string): Promise<void> {
  try {
    const entries = await getWaterEntries();
    const filtered = entries.filter((e) => e.id !== entryId);
    await AsyncStorage.setItem(STORAGE_KEYS.WATER_ENTRIES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting water entry:', error);
    throw error;
  }
}

// Hydration Goal
export async function getHydrationGoal(): Promise<HydrationGoal> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HYDRATION_GOAL);
    return data ? JSON.parse(data) : DEFAULT_HYDRATION_GOAL;
  } catch (error) {
    console.error('Error getting hydration goal:', error);
    return DEFAULT_HYDRATION_GOAL;
  }
}

export async function saveHydrationGoal(goal: HydrationGoal): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HYDRATION_GOAL, JSON.stringify(goal));
  } catch (error) {
    console.error('Error saving hydration goal:', error);
    throw error;
  }
}

// Hydration Streak
export async function getHydrationStreak(): Promise<HydrationStreak> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HYDRATION_STREAK);
    return data
      ? JSON.parse(data)
      : {
          currentStreak: 0,
          longestStreak: 0,
          lastGoalMetDate: null,
        };
  } catch (error) {
    console.error('Error getting hydration streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastGoalMetDate: null,
    };
  }
}

export async function updateHydrationStreak(goalMet: boolean): Promise<HydrationStreak> {
  try {
    const streak = await getHydrationStreak();
    const today = new Date().toISOString().split('T')[0];

    if (goalMet) {
      // Check if this is consecutive
      if (streak.lastGoalMetDate) {
        const lastDate = new Date(streak.lastGoalMetDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          streak.currentStreak += 1;
        } else if (diffDays > 1) {
          // Streak broken
          streak.currentStreak = 1;
        }
        // diffDays === 0 means same day, don't change streak
      } else {
        // First time meeting goal
        streak.currentStreak = 1;
      }

      streak.lastGoalMetDate = today;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    } else {
      // Goal not met today
      if (streak.lastGoalMetDate) {
        const lastDate = new Date(streak.lastGoalMetDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          // Streak broken
          streak.currentStreak = 0;
        }
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.HYDRATION_STREAK, JSON.stringify(streak));
    return streak;
  } catch (error) {
    console.error('Error updating hydration streak:', error);
    throw error;
  }
}

// Daily History
export async function getDailyHistory(days: number = 7): Promise<DailyHydration[]> {
  try {
    const entries = await getWaterEntries();
    const goal = await getHydrationGoal();
    const history: DailyHydration[] = [];

    // Generate history for last N days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEntries = entries.filter((e) => e.date === dateStr);
      const totalIntake = calculateTotalIntake(dayEntries);
      const percentComplete = Math.round((totalIntake / goal.dailyGoal) * 100);

      history.push({
        date: dateStr,
        totalIntake,
        goal: goal.dailyGoal,
        entries: dayEntries,
        percentComplete,
        goalMet: totalIntake >= goal.dailyGoal,
      });
    }

    return history;
  } catch (error) {
    console.error('Error getting daily history:', error);
    return [];
  }
}

// Helper: Calculate total intake with hydration multipliers
export function calculateTotalIntake(entries: WaterEntry[]): number {
  return entries.reduce((total, entry) => {
    const multiplier = HYDRATION_MULTIPLIERS[entry.source] || 1;
    return total + Math.round(entry.amount * multiplier);
  }, 0);
}

// Helper: Get today's total intake
export async function getTodayTotalIntake(): Promise<number> {
  try {
    const todayEntries = await getTodayEntries();
    return calculateTotalIntake(todayEntries);
  } catch (error) {
    console.error('Error getting today total intake:', error);
    return 0;
  }
}

// Helper: Check if today's goal is met
export async function checkTodayGoalMet(): Promise<boolean> {
  try {
    const [intake, goal] = await Promise.all([getTodayTotalIntake(), getHydrationGoal()]);
    return intake >= goal.dailyGoal;
  } catch (error) {
    console.error('Error checking today goal:', error);
    return false;
  }
}

// Helper: Get hydration stats
export async function getHydrationStats(): Promise<{
  avgIntake: number;
  goalMetDays: number;
  totalDays: number;
}> {
  try {
    const history = await getDailyHistory(7);
    const totalIntake = history.reduce((sum, day) => sum + day.totalIntake, 0);
    const goalMetDays = history.filter((day) => day.goalMet).length;

    return {
      avgIntake: history.length > 0 ? Math.round(totalIntake / history.length) : 0,
      goalMetDays,
      totalDays: history.length,
    };
  } catch (error) {
    console.error('Error getting hydration stats:', error);
    return { avgIntake: 0, goalMetDays: 0, totalDays: 0 };
  }
}
