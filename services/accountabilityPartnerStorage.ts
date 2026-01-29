/**
 * Accountability Partner Storage Service
 * Handles AsyncStorage persistence for streaks, check-ins, messages, and settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityStreaks,
  DailyCheckIn,
  MotivationalMessage,
  ReminderSettings,
  WeeklySummary,
  EngagementMetrics,
  DEFAULT_STREAK_DATA,
  DEFAULT_REMINDER_SETTINGS,
  DEFAULT_ENGAGEMENT_METRICS,
  ACCOUNTABILITY_CONSTANTS,
} from '../types/accountabilityPartner';

// Storage keys
const STORAGE_KEYS = {
  STREAKS: '@accountability_streaks',
  CHECK_INS: '@accountability_check_ins',
  MESSAGES: '@accountability_messages',
  REMINDER_SETTINGS: '@accountability_reminder_settings',
  WEEKLY_SUMMARIES: '@accountability_weekly_summaries',
  ENGAGEMENT: '@accountability_engagement',
};

// ============ Streak Storage ============

/**
 * Get all activity streaks
 */
export async function getStreaks(): Promise<ActivityStreaks> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAKS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting streaks:', error);
  }

  // Return default streaks
  return {
    mealLogging: { ...DEFAULT_STREAK_DATA },
    weightLogging: { ...DEFAULT_STREAK_DATA },
    workoutCompletion: { ...DEFAULT_STREAK_DATA },
    waterIntake: { ...DEFAULT_STREAK_DATA },
    calorieGoalMet: { ...DEFAULT_STREAK_DATA },
  };
}

/**
 * Save activity streaks
 */
export async function saveStreaks(streaks: ActivityStreaks): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(streaks));
  } catch (error) {
    console.error('Error saving streaks:', error);
    throw error;
  }
}

/**
 * Update a specific activity streak
 */
export async function updateActivityStreak(
  activity: keyof ActivityStreaks,
  logged: boolean
): Promise<ActivityStreaks> {
  const streaks = await getStreaks();
  const today = new Date().toISOString().split('T')[0];
  const activityStreak = streaks[activity];

  if (logged) {
    // Check if this is the same day
    if (activityStreak.lastLoggedDate === today) {
      return streaks; // Already logged today, no change
    }

    // Check if this continues the streak (yesterday or first log)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (
      activityStreak.lastLoggedDate === yesterdayStr ||
      activityStreak.lastLoggedDate === null
    ) {
      // Continue streak
      activityStreak.currentStreak += 1;
    } else {
      // Streak broken, start new
      activityStreak.currentStreak = 1;
    }

    activityStreak.totalDaysLogged += 1;
    activityStreak.lastLoggedDate = today;

    // Update longest streak if needed
    if (activityStreak.currentStreak > activityStreak.longestStreak) {
      activityStreak.longestStreak = activityStreak.currentStreak;
    }
  }

  streaks[activity] = activityStreak;
  await saveStreaks(streaks);
  return streaks;
}

// ============ Check-In Storage ============

/**
 * Get check-ins for a date range
 */
export async function getCheckIns(days: number = 30): Promise<DailyCheckIn[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHECK_INS);
    if (data) {
      const allCheckIns: DailyCheckIn[] = JSON.parse(data);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      return allCheckIns.filter((c) => c.date >= cutoffStr).sort((a, b) => b.date.localeCompare(a.date));
    }
  } catch (error) {
    console.error('Error getting check-ins:', error);
  }
  return [];
}

/**
 * Get today's check-in
 */
export async function getTodayCheckIn(): Promise<DailyCheckIn | null> {
  const today = new Date().toISOString().split('T')[0];
  const checkIns = await getCheckIns(1);
  return checkIns.find((c) => c.date === today) || null;
}

/**
 * Save or update a check-in
 */
export async function saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
  try {
    const allCheckIns = await getCheckIns(90); // Keep 90 days of history
    const existingIndex = allCheckIns.findIndex((c) => c.date === checkIn.date);

    if (existingIndex >= 0) {
      allCheckIns[existingIndex] = checkIn;
    } else {
      allCheckIns.unshift(checkIn);
    }

    // Limit to 90 days
    const limitedCheckIns = allCheckIns.slice(0, 90);
    await AsyncStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(limitedCheckIns));
  } catch (error) {
    console.error('Error saving check-in:', error);
    throw error;
  }
}

// ============ Messages Storage ============

/**
 * Get recent motivational messages
 */
export async function getMessages(): Promise<MotivationalMessage[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting messages:', error);
  }
  return [];
}

/**
 * Add a new motivational message
 */
export async function addMessage(message: MotivationalMessage): Promise<MotivationalMessage[]> {
  try {
    const messages = await getMessages();
    messages.unshift(message);

    // Limit to max messages
    const limitedMessages = messages.slice(0, ACCOUNTABILITY_CONSTANTS.MAX_RECENT_MESSAGES);
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(limitedMessages));
    return limitedMessages;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

/**
 * Mark a message as read
 */
export async function markMessageRead(messageId: string): Promise<MotivationalMessage[]> {
  try {
    const messages = await getMessages();
    const messageIndex = messages.findIndex((m) => m.id === messageId);

    if (messageIndex >= 0) {
      messages[messageIndex].read = true;
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    }

    return messages;
  } catch (error) {
    console.error('Error marking message read:', error);
    throw error;
  }
}

/**
 * Mark all messages as read
 */
export async function markAllMessagesRead(): Promise<MotivationalMessage[]> {
  try {
    const messages = await getMessages();
    const updatedMessages = messages.map((m) => ({ ...m, read: true }));
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updatedMessages));
    return updatedMessages;
  } catch (error) {
    console.error('Error marking all messages read:', error);
    throw error;
  }
}

/**
 * Clear all messages
 */
export async function clearMessages(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES);
  } catch (error) {
    console.error('Error clearing messages:', error);
    throw error;
  }
}

// ============ Reminder Settings Storage ============

/**
 * Get reminder settings
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting reminder settings:', error);
  }
  return DEFAULT_REMINDER_SETTINGS;
}

/**
 * Save reminder settings
 */
export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving reminder settings:', error);
    throw error;
  }
}

// ============ Weekly Summary Storage ============

/**
 * Get weekly summaries
 */
export async function getWeeklySummaries(count: number = 12): Promise<WeeklySummary[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_SUMMARIES);
    if (data) {
      const summaries: WeeklySummary[] = JSON.parse(data);
      return summaries.slice(0, count);
    }
  } catch (error) {
    console.error('Error getting weekly summaries:', error);
  }
  return [];
}

/**
 * Save a weekly summary
 */
export async function saveWeeklySummary(summary: WeeklySummary): Promise<void> {
  try {
    const summaries = await getWeeklySummaries(52); // Keep 1 year
    summaries.unshift(summary);

    // Limit to 52 weeks
    const limitedSummaries = summaries.slice(0, 52);
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_SUMMARIES, JSON.stringify(limitedSummaries));
  } catch (error) {
    console.error('Error saving weekly summary:', error);
    throw error;
  }
}

// ============ Engagement Metrics Storage ============

/**
 * Get engagement metrics
 */
export async function getEngagementMetrics(): Promise<EngagementMetrics> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENGAGEMENT);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting engagement metrics:', error);
  }
  return DEFAULT_ENGAGEMENT_METRICS;
}

/**
 * Save engagement metrics
 */
export async function saveEngagementMetrics(metrics: EngagementMetrics): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ENGAGEMENT, JSON.stringify(metrics));
  } catch (error) {
    console.error('Error saving engagement metrics:', error);
    throw error;
  }
}

/**
 * Record an app open
 */
export async function recordAppOpen(): Promise<EngagementMetrics> {
  const metrics = await getEngagementMetrics();
  const now = Date.now();

  // Check if this is a new week
  const lastOpenDate = new Date(metrics.lastAppOpen);
  const nowDate = new Date(now);
  const lastWeekStart = getWeekStart(lastOpenDate);
  const thisWeekStart = getWeekStart(nowDate);

  if (lastWeekStart !== thisWeekStart) {
    // New week, reset counter
    metrics.appOpensThisWeek = 1;
  } else {
    metrics.appOpensThisWeek += 1;
  }

  metrics.lastAppOpen = now;

  // Update most active day
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  metrics.mostActiveDay = dayNames[nowDate.getDay()];

  await saveEngagementMetrics(metrics);
  return metrics;
}

// ============ Helper Functions ============

/**
 * Get the start of the week (Sunday) for a date
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

/**
 * Clear all accountability data (for testing/reset)
 */
export async function clearAllAccountabilityData(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.STREAKS),
      AsyncStorage.removeItem(STORAGE_KEYS.CHECK_INS),
      AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES),
      AsyncStorage.removeItem(STORAGE_KEYS.REMINDER_SETTINGS),
      AsyncStorage.removeItem(STORAGE_KEYS.WEEKLY_SUMMARIES),
      AsyncStorage.removeItem(STORAGE_KEYS.ENGAGEMENT),
    ]);
  } catch (error) {
    console.error('Error clearing accountability data:', error);
    throw error;
  }
}
