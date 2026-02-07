/**
 * Tests for accountabilityPartnerStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStreaks,
  saveStreaks,
  updateActivityStreak,
  getCheckIns,
  getTodayCheckIn,
  saveCheckIn,
  getMessages,
  addMessage,
  markMessageRead,
  markAllMessagesRead,
  clearMessages,
  getReminderSettings,
  saveReminderSettings,
  getWeeklySummaries,
  saveWeeklySummary,
  getEngagementMetrics,
  saveEngagementMetrics,
  recordAppOpen,
  clearAllAccountabilityData,
} from '../accountabilityPartnerStorage';
import { DEFAULT_STREAK_DATA } from '../../types/accountabilityPartner';

describe('accountabilityPartnerStorage', () => {
  beforeEach(() => {
    AsyncStorage.__resetStore();
    jest.clearAllMocks();
  });

  describe('getStreaks / saveStreaks', () => {
    it('should return default streaks when none saved', async () => {
      const streaks = await getStreaks();
      expect(streaks).toEqual({
        mealLogging: DEFAULT_STREAK_DATA,
        weightLogging: DEFAULT_STREAK_DATA,
        workoutCompletion: DEFAULT_STREAK_DATA,
        waterIntake: DEFAULT_STREAK_DATA,
        calorieGoalMet: DEFAULT_STREAK_DATA,
      });
    });

    it('should save and retrieve streaks', async () => {
      const customStreaks = {
        mealLogging: { currentStreak: 5, longestStreak: 10, totalDaysLogged: 50, lastLoggedDate: '2025-01-15' },
        weightLogging: DEFAULT_STREAK_DATA,
        workoutCompletion: DEFAULT_STREAK_DATA,
        waterIntake: DEFAULT_STREAK_DATA,
        calorieGoalMet: DEFAULT_STREAK_DATA,
      };

      await saveStreaks(customStreaks);
      const loaded = await getStreaks();

      expect(loaded.mealLogging.currentStreak).toBe(5);
    });

    it('should handle corrupted data', async () => {
      await AsyncStorage.setItem('@accountability_streaks', 'invalid json');
      const streaks = await getStreaks();
      expect(streaks.mealLogging).toEqual(DEFAULT_STREAK_DATA);
    });
  });

  describe('updateActivityStreak', () => {
    it('should increment streak for consecutive days', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await saveStreaks({
        mealLogging: { currentStreak: 3, longestStreak: 5, totalDaysLogged: 10, lastLoggedDate: yesterday },
        weightLogging: DEFAULT_STREAK_DATA,
        workoutCompletion: DEFAULT_STREAK_DATA,
        waterIntake: DEFAULT_STREAK_DATA,
        calorieGoalMet: DEFAULT_STREAK_DATA,
      });

      const updated = await updateActivityStreak('mealLogging', true);

      expect(updated.mealLogging.currentStreak).toBe(4);
      expect(updated.mealLogging.lastLoggedDate).toBe(today);
      expect(updated.mealLogging.totalDaysLogged).toBe(11);
    });

    it('should reset streak when day is skipped', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await saveStreaks({
        mealLogging: { currentStreak: 5, longestStreak: 10, totalDaysLogged: 20, lastLoggedDate: twoDaysAgo },
        weightLogging: DEFAULT_STREAK_DATA,
        workoutCompletion: DEFAULT_STREAK_DATA,
        waterIntake: DEFAULT_STREAK_DATA,
        calorieGoalMet: DEFAULT_STREAK_DATA,
      });

      const updated = await updateActivityStreak('mealLogging', true);

      expect(updated.mealLogging.currentStreak).toBe(1); // Reset
    });

    it('should update longest streak if current exceeds it', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await saveStreaks({
        mealLogging: { currentStreak: 9, longestStreak: 9, totalDaysLogged: 50, lastLoggedDate: yesterday },
        weightLogging: DEFAULT_STREAK_DATA,
        workoutCompletion: DEFAULT_STREAK_DATA,
        waterIntake: DEFAULT_STREAK_DATA,
        calorieGoalMet: DEFAULT_STREAK_DATA,
      });

      const updated = await updateActivityStreak('mealLogging', true);

      expect(updated.mealLogging.currentStreak).toBe(10);
      expect(updated.mealLogging.longestStreak).toBe(10);
    });

    it('should not change streak when same day logged again', async () => {
      const today = new Date().toISOString().split('T')[0];

      await saveStreaks({
        mealLogging: { currentStreak: 5, longestStreak: 10, totalDaysLogged: 20, lastLoggedDate: today },
        weightLogging: DEFAULT_STREAK_DATA,
        workoutCompletion: DEFAULT_STREAK_DATA,
        waterIntake: DEFAULT_STREAK_DATA,
        calorieGoalMet: DEFAULT_STREAK_DATA,
      });

      const updated = await updateActivityStreak('mealLogging', true);

      expect(updated.mealLogging.currentStreak).toBe(5); // Unchanged
      expect(updated.mealLogging.totalDaysLogged).toBe(20); // Unchanged
    });

    it('should start streak at 1 for first log', async () => {
      const updated = await updateActivityStreak('waterIntake', true);

      expect(updated.waterIntake.currentStreak).toBe(1);
      expect(updated.waterIntake.totalDaysLogged).toBe(1);
    });
  });

  describe('getCheckIns / saveCheckIn', () => {
    it('should return empty array when no check-ins', async () => {
      const checkIns = await getCheckIns();
      expect(checkIns).toEqual([]);
    });

    it('should save and retrieve check-ins', async () => {
      const checkIn = {
        date: '2025-01-15',
        mood: 'great' as const,
        energy: 4,
        motivation: 5,
        notes: 'Feeling strong!',
      };

      await saveCheckIn(checkIn);
      const checkIns = await getCheckIns();

      expect(checkIns).toHaveLength(1);
      expect(checkIns[0].mood).toBe('great');
    });

    it('should update existing check-in for same date', async () => {
      const checkIn1 = {
        date: '2025-01-15',
        mood: 'good' as const,
        energy: 3,
        motivation: 3,
      };

      const checkIn2 = {
        date: '2025-01-15',
        mood: 'great' as const,
        energy: 5,
        motivation: 5,
      };

      await saveCheckIn(checkIn1);
      await saveCheckIn(checkIn2);

      const checkIns = await getCheckIns();

      expect(checkIns).toHaveLength(1);
      expect(checkIns[0].mood).toBe('great');
    });

    it('should limit to 90 days of history', async () => {
      for (let i = 0; i < 100; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        await saveCheckIn({ date, mood: 'good' as const, energy: 3, motivation: 3 });
      }

      const stored = await AsyncStorage.getItem('@accountability_check_ins');
      const checkIns = JSON.parse(stored!);
      expect(checkIns.length).toBeLessThanOrEqual(90);
    });

    it('should filter check-ins by days parameter', async () => {
      const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await saveCheckIn({ date: recent, mood: 'good' as const, energy: 4, motivation: 4 });
      await saveCheckIn({ date: old, mood: 'okay' as const, energy: 3, motivation: 3 });

      const checkIns = await getCheckIns(30);
      expect(checkIns).toHaveLength(1);
    });

    it('should sort check-ins by date descending', async () => {
      await saveCheckIn({ date: '2025-01-10', mood: 'good' as const, energy: 3, motivation: 3 });
      await saveCheckIn({ date: '2025-01-15', mood: 'great' as const, energy: 5, motivation: 5 });

      const checkIns = await getCheckIns();
      expect(checkIns[0].date).toBe('2025-01-15');
    });
  });

  describe('getTodayCheckIn', () => {
    it('should return null when no check-in for today', async () => {
      const checkIn = await getTodayCheckIn();
      expect(checkIn).toBeNull();
    });

    it('should return today\'s check-in', async () => {
      const today = new Date().toISOString().split('T')[0];
      await saveCheckIn({ date: today, mood: 'great' as const, energy: 5, motivation: 5 });

      const checkIn = await getTodayCheckIn();
      expect(checkIn).not.toBeNull();
      expect(checkIn!.date).toBe(today);
    });
  });

  describe('getMessages / addMessage', () => {
    it('should return empty array when no messages', async () => {
      const messages = await getMessages();
      expect(messages).toEqual([]);
    });

    it('should add and retrieve messages', async () => {
      const message = {
        id: 'msg-1',
        type: 'motivation' as const,
        message: 'Keep going!',
        timestamp: Date.now(),
        read: false,
      };

      await addMessage(message);
      const messages = await getMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe('Keep going!');
    });

    it('should add new messages at beginning', async () => {
      await addMessage({ id: '1', type: 'motivation' as const, message: 'First', timestamp: Date.now(), read: false });
      await addMessage({ id: '2', type: 'streak' as const, message: 'Second', timestamp: Date.now(), read: false });

      const messages = await getMessages();
      expect(messages[0].id).toBe('2');
    });

    it('should limit messages to MAX_RECENT_MESSAGES', async () => {
      for (let i = 0; i < 60; i++) {
        await addMessage({ id: `${i}`, type: 'motivation' as const, message: `Message ${i}`, timestamp: Date.now(), read: false });
      }

      const messages = await getMessages();
      expect(messages.length).toBeLessThanOrEqual(50);
    });
  });

  describe('markMessageRead / markAllMessagesRead', () => {
    it('should mark single message as read', async () => {
      await addMessage({ id: 'msg-1', type: 'motivation' as const, message: 'Test', timestamp: Date.now(), read: false });

      await markMessageRead('msg-1');
      const messages = await getMessages();

      expect(messages[0].read).toBe(true);
    });

    it('should mark all messages as read', async () => {
      await addMessage({ id: '1', type: 'motivation' as const, message: 'Test 1', timestamp: Date.now(), read: false });
      await addMessage({ id: '2', type: 'streak' as const, message: 'Test 2', timestamp: Date.now(), read: false });

      await markAllMessagesRead();
      const messages = await getMessages();

      expect(messages.every(m => m.read)).toBe(true);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', async () => {
      await addMessage({ id: '1', type: 'motivation' as const, message: 'Test', timestamp: Date.now(), read: false });

      await clearMessages();
      const messages = await getMessages();

      expect(messages).toEqual([]);
    });
  });

  describe('getReminderSettings / saveReminderSettings', () => {
    it('should return default settings when none saved', async () => {
      const settings = await getReminderSettings();
      expect(settings.enabled).toBe(true);
    });

    it('should save and retrieve reminder settings', async () => {
      const settings = {
        enabled: false,
        mealReminders: true,
        workoutReminders: false,
        waterReminders: true,
        checkInReminder: false,
        reminderTimes: {
          breakfast: '07:00',
          lunch: '12:00',
          dinner: '18:00',
          water: ['09:00', '14:00', '19:00'],
          checkIn: '21:00',
        },
      };

      await saveReminderSettings(settings);
      const loaded = await getReminderSettings();

      expect(loaded.enabled).toBe(false);
      expect(loaded.waterReminders).toBe(true);
    });
  });

  describe('getWeeklySummaries / saveWeeklySummary', () => {
    it('should return empty array when no summaries', async () => {
      const summaries = await getWeeklySummaries();
      expect(summaries).toEqual([]);
    });

    it('should save and retrieve weekly summaries', async () => {
      const summary = {
        weekStart: '2025-01-13',
        weekEnd: '2025-01-19',
        mealsLogged: 18,
        workoutsCompleted: 4,
        waterGoalsMet: 6,
        averageMood: 4,
        totalCheckIns: 7,
      };

      await saveWeeklySummary(summary);
      const summaries = await getWeeklySummaries();

      expect(summaries).toHaveLength(1);
      expect(summaries[0].mealsLogged).toBe(18);
    });

    it('should limit to 52 weeks', async () => {
      for (let i = 0; i < 60; i++) {
        await saveWeeklySummary({
          weekStart: `2025-${String(i + 1).padStart(2, '0')}-01`,
          weekEnd: `2025-${String(i + 1).padStart(2, '0')}-07`,
          mealsLogged: 20,
          workoutsCompleted: 4,
          waterGoalsMet: 7,
          averageMood: 4,
          totalCheckIns: 7,
        });
      }

      const summaries = await getWeeklySummaries();
      expect(summaries.length).toBeLessThanOrEqual(52);
    });

    it('should limit returned summaries by count parameter', async () => {
      for (let i = 0; i < 15; i++) {
        await saveWeeklySummary({
          weekStart: `2025-${String(i + 1).padStart(2, '0')}-01`,
          weekEnd: `2025-${String(i + 1).padStart(2, '0')}-07`,
          mealsLogged: 20,
          workoutsCompleted: 4,
          waterGoalsMet: 7,
          averageMood: 4,
          totalCheckIns: 7,
        });
      }

      const summaries = await getWeeklySummaries(10);
      expect(summaries).toHaveLength(10);
    });
  });

  describe('getEngagementMetrics / saveEngagementMetrics / recordAppOpen', () => {
    it('should return default metrics when none saved', async () => {
      const metrics = await getEngagementMetrics();
      expect(metrics.appOpensThisWeek).toBe(0);
    });

    it('should record app open and increment counter', async () => {
      await recordAppOpen();
      const metrics = await getEngagementMetrics();

      expect(metrics.appOpensThisWeek).toBe(1);
    });

    it('should reset weekly counter on new week', async () => {
      const lastWeek = Date.now() - 8 * 24 * 60 * 60 * 1000;
      await saveEngagementMetrics({
        appOpensThisWeek: 10,
        lastAppOpen: lastWeek,
        mostActiveDay: 'Monday',
      });

      await recordAppOpen();
      const metrics = await getEngagementMetrics();

      expect(metrics.appOpensThisWeek).toBe(1); // Reset
    });

    it('should track most active day', async () => {
      const mockDate = new Date('2025-01-15T12:00:00'); // Wednesday
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(mockDate.getDay());

      await recordAppOpen();
      const metrics = await getEngagementMetrics();

      expect(metrics.mostActiveDay).toBe('Wednesday');
    });
  });

  describe('clearAllAccountabilityData', () => {
    it('should clear all accountability partner data', async () => {
      await updateActivityStreak('mealLogging', true);
      await saveCheckIn({ date: '2025-01-15', mood: 'good' as const, energy: 4, motivation: 4 });
      await addMessage({ id: '1', type: 'motivation' as const, message: 'Test', timestamp: Date.now(), read: false });
      await recordAppOpen();

      await clearAllAccountabilityData();

      const streaks = await getStreaks();
      const checkIns = await getCheckIns();
      const messages = await getMessages();
      const metrics = await getEngagementMetrics();

      expect(streaks.mealLogging).toEqual(DEFAULT_STREAK_DATA);
      expect(checkIns).toEqual([]);
      expect(messages).toEqual([]);
      expect(metrics.appOpensThisWeek).toBe(0);
    });
  });
});
