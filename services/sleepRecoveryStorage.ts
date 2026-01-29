/**
 * Sleep & Recovery Storage Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SleepEntry, RecoveryScore, SleepGoal, DEFAULT_SLEEP_GOAL } from '../types/sleepRecovery';

const STORAGE_KEYS = {
  SLEEP_ENTRIES: '@sleep_entries',
  RECOVERY_SCORES: '@recovery_scores',
  SLEEP_GOAL: '@sleep_goal',
};

// Sleep Entries
export async function getSleepEntries(): Promise<SleepEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP_ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sleep entries:', error);
    return [];
  }
}

export async function saveSleepEntry(entry: SleepEntry): Promise<void> {
  try {
    const entries = await getSleepEntries();
    const existingIndex = entries.findIndex((e) => e.id === entry.id);

    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.unshift(entry);
    }

    // Keep last 90 days of entries
    const trimmed = entries.slice(0, 90);
    await AsyncStorage.setItem(STORAGE_KEYS.SLEEP_ENTRIES, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving sleep entry:', error);
    throw error;
  }
}

export async function deleteSleepEntry(entryId: string): Promise<void> {
  try {
    const entries = await getSleepEntries();
    const filtered = entries.filter((e) => e.id !== entryId);
    await AsyncStorage.setItem(STORAGE_KEYS.SLEEP_ENTRIES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting sleep entry:', error);
    throw error;
  }
}

export async function getSleepEntriesForDateRange(startDate: string, endDate: string): Promise<SleepEntry[]> {
  try {
    const entries = await getSleepEntries();
    return entries.filter((e) => e.date >= startDate && e.date <= endDate);
  } catch (error) {
    console.error('Error getting sleep entries for date range:', error);
    return [];
  }
}

// Recovery Scores
export async function getRecoveryScores(): Promise<RecoveryScore[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECOVERY_SCORES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting recovery scores:', error);
    return [];
  }
}

export async function saveRecoveryScore(score: RecoveryScore): Promise<void> {
  try {
    const scores = await getRecoveryScores();
    const existingIndex = scores.findIndex((s) => s.date === score.date);

    if (existingIndex >= 0) {
      scores[existingIndex] = score;
    } else {
      scores.unshift(score);
    }

    // Keep last 30 days
    const trimmed = scores.slice(0, 30);
    await AsyncStorage.setItem(STORAGE_KEYS.RECOVERY_SCORES, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving recovery score:', error);
    throw error;
  }
}

export async function getTodayRecoveryScore(): Promise<RecoveryScore | null> {
  try {
    const scores = await getRecoveryScores();
    const today = new Date().toISOString().split('T')[0];
    return scores.find((s) => s.date === today) || null;
  } catch (error) {
    console.error('Error getting today recovery score:', error);
    return null;
  }
}

// Sleep Goal
export async function getSleepGoal(): Promise<SleepGoal> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP_GOAL);
    return data ? JSON.parse(data) : DEFAULT_SLEEP_GOAL;
  } catch (error) {
    console.error('Error getting sleep goal:', error);
    return DEFAULT_SLEEP_GOAL;
  }
}

export async function saveSleepGoal(goal: SleepGoal): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SLEEP_GOAL, JSON.stringify(goal));
  } catch (error) {
    console.error('Error saving sleep goal:', error);
    throw error;
  }
}

// Analytics helpers
export async function getAverageSleepDuration(days: number = 7): Promise<number> {
  try {
    const entries = await getSleepEntries();
    const recent = entries.slice(0, days);

    if (recent.length === 0) return 0;

    const total = recent.reduce((sum, e) => sum + e.duration, 0);
    return Math.round(total / recent.length);
  } catch (error) {
    console.error('Error calculating average sleep duration:', error);
    return 0;
  }
}

export async function getAverageSleepQuality(days: number = 7): Promise<number> {
  try {
    const entries = await getSleepEntries();
    const recent = entries.slice(0, days);

    if (recent.length === 0) return 0;

    const total = recent.reduce((sum, e) => sum + e.quality, 0);
    return Math.round((total / recent.length) * 10) / 10;
  } catch (error) {
    console.error('Error calculating average sleep quality:', error);
    return 0;
  }
}

export async function calculateSleepDebt(): Promise<number> {
  try {
    const goal = await getSleepGoal();
    const entries = await getSleepEntries();
    const recent = entries.slice(0, 7);

    if (recent.length === 0) return 0;

    const totalActual = recent.reduce((sum, e) => sum + e.duration, 0);
    const totalTarget = goal.targetDuration * recent.length;
    const debt = totalTarget - totalActual;

    return Math.max(0, debt); // Only return positive debt
  } catch (error) {
    console.error('Error calculating sleep debt:', error);
    return 0;
  }
}

export async function getSleepConsistencyScore(): Promise<number> {
  try {
    const entries = await getSleepEntries();
    const recent = entries.slice(0, 7);

    if (recent.length < 2) return 100;

    // Calculate standard deviation of bedtime
    const bedtimes = recent.map((e) => {
      const [hours, minutes] = e.bedtime.split(':').map(Number);
      return hours * 60 + minutes;
    });

    const mean = bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length;
    const variance = bedtimes.reduce((sum, bt) => sum + Math.pow(bt - mean, 2), 0) / bedtimes.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = more consistent = higher score
    // 30 min std dev = 100 score, 120 min std dev = 0 score
    const score = Math.max(0, Math.min(100, 100 - ((stdDev - 30) / 90) * 100));
    return Math.round(score);
  } catch (error) {
    console.error('Error calculating sleep consistency:', error);
    return 0;
  }
}
