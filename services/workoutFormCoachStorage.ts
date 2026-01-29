/**
 * Workout Form Coach Storage Service
 * Handles AsyncStorage persistence for exercise history and form checks
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExerciseHistory,
  FormCheckResult,
  DailyFormTip,
  CoachingSession,
  FORM_COACH_CONSTANTS,
} from '../types/workoutFormCoach';

// Storage keys
const STORAGE_KEYS = {
  EXERCISE_HISTORY: '@form_coach_exercise_history',
  FORM_CHECKS: '@form_coach_form_checks',
  DAILY_TIP: '@form_coach_daily_tip',
  COACHING_SESSIONS: '@form_coach_coaching_sessions',
  FAVORITE_EXERCISES: '@form_coach_favorite_exercises',
};

// ============ Exercise History Storage ============

/**
 * Get exercise history
 */
export async function getExerciseHistory(): Promise<ExerciseHistory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_HISTORY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting exercise history:', error);
  }
  return [];
}

/**
 * Save exercise history
 */
export async function saveExerciseHistory(history: ExerciseHistory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving exercise history:', error);
    throw error;
  }
}

/**
 * Update exercise history for a specific exercise
 */
export async function updateExerciseHistory(
  exerciseId: string,
  exerciseName: string,
  personalBest?: { weight?: number; reps?: number; time?: number },
  note?: string,
  formIssue?: string
): Promise<ExerciseHistory[]> {
  const history = await getExerciseHistory();
  const today = new Date().toISOString().split('T')[0];

  const existingIndex = history.findIndex((h) => h.exerciseId === exerciseId);

  if (existingIndex >= 0) {
    // Update existing
    const existing = history[existingIndex];
    existing.lastPerformed = today;
    existing.timesPerformed += 1;

    // Update personal best if provided and better
    if (personalBest) {
      if (personalBest.weight && personalBest.weight > (existing.personalBest.weight || 0)) {
        existing.personalBest.weight = personalBest.weight;
      }
      if (personalBest.reps && personalBest.reps > (existing.personalBest.reps || 0)) {
        existing.personalBest.reps = personalBest.reps;
      }
      if (personalBest.time && personalBest.time > (existing.personalBest.time || 0)) {
        existing.personalBest.time = personalBest.time;
      }
    }

    if (note) {
      existing.notes = [note, ...existing.notes.slice(0, 9)]; // Keep last 10 notes
    }

    if (formIssue) {
      existing.formIssuesNoted = [formIssue, ...existing.formIssuesNoted.slice(0, 9)];
    }

    history[existingIndex] = existing;
  } else {
    // Create new entry
    history.push({
      exerciseId,
      exerciseName,
      lastPerformed: today,
      timesPerformed: 1,
      personalBest: personalBest || {},
      notes: note ? [note] : [],
      formIssuesNoted: formIssue ? [formIssue] : [],
    });
  }

  await saveExerciseHistory(history);
  return history;
}

/**
 * Get history for a specific exercise
 */
export async function getExerciseHistoryById(exerciseId: string): Promise<ExerciseHistory | null> {
  const history = await getExerciseHistory();
  return history.find((h) => h.exerciseId === exerciseId) || null;
}

// ============ Form Checks Storage ============

/**
 * Get form check results
 */
export async function getFormChecks(): Promise<FormCheckResult[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FORM_CHECKS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting form checks:', error);
  }
  return [];
}

/**
 * Save a form check result
 */
export async function saveFormCheck(result: FormCheckResult): Promise<FormCheckResult[]> {
  try {
    const checks = await getFormChecks();
    checks.unshift(result);

    // Limit to max checks
    const limited = checks.slice(0, FORM_COACH_CONSTANTS.MAX_FORM_CHECKS);
    await AsyncStorage.setItem(STORAGE_KEYS.FORM_CHECKS, JSON.stringify(limited));
    return limited;
  } catch (error) {
    console.error('Error saving form check:', error);
    throw error;
  }
}

/**
 * Get form checks for a specific exercise
 */
export async function getFormChecksForExercise(exerciseId: string): Promise<FormCheckResult[]> {
  const checks = await getFormChecks();
  return checks.filter((c) => c.exerciseId === exerciseId);
}

// ============ Daily Tip Storage ============

/**
 * Get daily form tip
 */
export async function getDailyTip(): Promise<DailyFormTip | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_TIP);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting daily tip:', error);
  }
  return null;
}

/**
 * Save daily form tip
 */
export async function saveDailyTip(tip: DailyFormTip): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TIP, JSON.stringify(tip));
  } catch (error) {
    console.error('Error saving daily tip:', error);
    throw error;
  }
}

/**
 * Mark daily tip as seen
 */
export async function markDailyTipSeen(): Promise<void> {
  const tip = await getDailyTip();
  if (tip) {
    tip.seen = true;
    await saveDailyTip(tip);
  }
}

// ============ Coaching Sessions Storage ============

/**
 * Get coaching sessions
 */
export async function getCoachingSessions(limit?: number): Promise<CoachingSession[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.COACHING_SESSIONS);
    if (data) {
      const sessions: CoachingSession[] = JSON.parse(data);
      return limit ? sessions.slice(0, limit) : sessions;
    }
  } catch (error) {
    console.error('Error getting coaching sessions:', error);
  }
  return [];
}

/**
 * Save a coaching session
 */
export async function saveCoachingSession(session: CoachingSession): Promise<CoachingSession[]> {
  try {
    const sessions = await getCoachingSessions();
    sessions.unshift(session);

    // Limit to max sessions
    const limited = sessions.slice(0, FORM_COACH_CONSTANTS.MAX_COACHING_SESSIONS);
    await AsyncStorage.setItem(STORAGE_KEYS.COACHING_SESSIONS, JSON.stringify(limited));
    return limited;
  } catch (error) {
    console.error('Error saving coaching session:', error);
    throw error;
  }
}

// ============ Favorite Exercises Storage ============

/**
 * Get favorite exercise IDs
 */
export async function getFavoriteExercises(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_EXERCISES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting favorite exercises:', error);
  }
  return [];
}

/**
 * Toggle favorite status for an exercise
 */
export async function toggleFavoriteExercise(exerciseId: string): Promise<string[]> {
  try {
    const favorites = await getFavoriteExercises();
    const index = favorites.indexOf(exerciseId);

    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(exerciseId);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_EXERCISES, JSON.stringify(favorites));
    return favorites;
  } catch (error) {
    console.error('Error toggling favorite exercise:', error);
    throw error;
  }
}

// ============ Clear All Data ============

/**
 * Clear all form coach data
 */
export async function clearAllFormCoachData(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.EXERCISE_HISTORY),
      AsyncStorage.removeItem(STORAGE_KEYS.FORM_CHECKS),
      AsyncStorage.removeItem(STORAGE_KEYS.DAILY_TIP),
      AsyncStorage.removeItem(STORAGE_KEYS.COACHING_SESSIONS),
      AsyncStorage.removeItem(STORAGE_KEYS.FAVORITE_EXERCISES),
    ]);
  } catch (error) {
    console.error('Error clearing form coach data:', error);
    throw error;
  }
}
