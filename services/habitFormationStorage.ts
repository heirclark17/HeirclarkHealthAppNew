/**
 * Habit Formation Storage Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Habit,
  HabitCompletion,
  HabitStreak,
  HabitStack,
  HABIT_CONSTANTS,
} from '../types/habitFormation';

const STORAGE_KEYS = {
  HABITS: '@habits_list',
  COMPLETIONS: '@habits_completions',
  STREAKS: '@habits_streaks',
  STACKS: '@habits_stacks',
};

// ============ Habits Storage ============

export async function getHabits(): Promise<Habit[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting habits:', error);
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
}

export async function addHabit(habit: Habit): Promise<Habit[]> {
  const habits = await getHabits();
  habits.push(habit);
  await saveHabits(habits);
  return habits;
}

export async function updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit[]> {
  const habits = await getHabits();
  const index = habits.findIndex((h) => h.id === habitId);
  if (index >= 0) {
    habits[index] = { ...habits[index], ...updates };
    await saveHabits(habits);
  }
  return habits;
}

export async function deleteHabit(habitId: string): Promise<Habit[]> {
  const habits = await getHabits();
  const filtered = habits.filter((h) => h.id !== habitId);
  await saveHabits(filtered);
  return filtered;
}

// ============ Completions Storage ============

export async function getCompletions(days: number = 30): Promise<HabitCompletion[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETIONS);
    if (!data) return [];

    const completions: HabitCompletion[] = JSON.parse(data);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return completions.filter((c) => c.date >= cutoffStr);
  } catch (error) {
    console.error('Error getting completions:', error);
    return [];
  }
}

export async function saveCompletion(completion: HabitCompletion): Promise<HabitCompletion[]> {
  const completions = await getCompletions(HABIT_CONSTANTS.MAX_COMPLETIONS_DAYS);

  // Update existing or add new
  const existingIndex = completions.findIndex(
    (c) => c.habitId === completion.habitId && c.date === completion.date
  );

  if (existingIndex >= 0) {
    completions[existingIndex] = completion;
  } else {
    completions.push(completion);
  }

  await AsyncStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
  return completions;
}

export async function getTodayCompletions(): Promise<HabitCompletion[]> {
  const today = new Date().toISOString().split('T')[0];
  const completions = await getCompletions(1);
  return completions.filter((c) => c.date === today);
}

// ============ Streaks Storage ============

export async function getStreaks(): Promise<HabitStreak[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting streaks:', error);
    return [];
  }
}

export async function saveStreaks(streaks: HabitStreak[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(streaks));
}

export async function updateStreak(habitId: string, completed: boolean): Promise<HabitStreak[]> {
  const streaks = await getStreaks();
  const today = new Date().toISOString().split('T')[0];

  let streak = streaks.find((s) => s.habitId === habitId);

  if (!streak) {
    streak = {
      habitId,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0,
      lastCompletedDate: null,
    };
    streaks.push(streak);
  }

  if (completed) {
    // Check if continuing streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastCompletedDate === today) {
      // Already completed today
    } else if (streak.lastCompletedDate === yesterdayStr || !streak.lastCompletedDate) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }

    streak.totalCompletions += 1;
    streak.lastCompletedDate = today;

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
  }

  await saveStreaks(streaks);
  return streaks;
}

// ============ Stacks Storage ============

export async function getStacks(): Promise<HabitStack[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STACKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting stacks:', error);
    return [];
  }
}

export async function saveStack(stack: HabitStack): Promise<HabitStack[]> {
  const stacks = await getStacks();
  stacks.push(stack);
  await AsyncStorage.setItem(STORAGE_KEYS.STACKS, JSON.stringify(stacks));
  return stacks;
}

// ============ Clear All ============

export async function clearAllHabitData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.HABITS),
    AsyncStorage.removeItem(STORAGE_KEYS.COMPLETIONS),
    AsyncStorage.removeItem(STORAGE_KEYS.STREAKS),
    AsyncStorage.removeItem(STORAGE_KEYS.STACKS),
  ]);
}
