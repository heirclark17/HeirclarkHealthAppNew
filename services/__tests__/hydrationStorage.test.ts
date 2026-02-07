/**
 * Tests for hydrationStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getWaterEntries,
  getTodayEntries,
  saveWaterEntry,
  deleteWaterEntry,
  getHydrationGoal,
  saveHydrationGoal,
  getHydrationStreak,
  updateHydrationStreak,
  getDailyHistory,
  calculateTotalIntake,
  getTodayTotalIntake,
  checkTodayGoalMet,
  getHydrationStats,
} from '../hydrationStorage';
import {
  WaterEntry,
  HydrationGoal,
  DEFAULT_HYDRATION_GOAL,
  HYDRATION_MULTIPLIERS,
} from '../../types/hydration';

// Helper to create a mock WaterEntry
function createMockEntry(overrides: Partial<WaterEntry> = {}): WaterEntry {
  return {
    id: 'entry-1',
    date: new Date().toISOString().split('T')[0],
    amount: 250,
    timestamp: new Date().toISOString(),
    source: 'water',
    ...overrides,
  };
}

describe('hydrationStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  // ============ Water Entries ============

  describe('getWaterEntries', () => {
    it('should return empty array when no entries saved', async () => {
      const entries = await getWaterEntries();
      expect(entries).toEqual([]);
    });

    it('should return saved entries', async () => {
      const mockEntries = [createMockEntry(), createMockEntry({ id: 'entry-2', amount: 500 })];
      await AsyncStorage.setItem('@hydration_entries', JSON.stringify(mockEntries));

      const entries = await getWaterEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].amount).toBe(250);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const entries = await getWaterEntries();
      expect(entries).toEqual([]);
    });
  });

  describe('getTodayEntries', () => {
    it('should return only entries for today', async () => {
      const today = new Date().toISOString().split('T')[0];
      const entries = [
        createMockEntry({ id: 'e1', date: today }),
        createMockEntry({ id: 'e2', date: '2020-01-01' }),
      ];
      await AsyncStorage.setItem('@hydration_entries', JSON.stringify(entries));

      const result = await getTodayEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e1');
    });

    it('should return empty array when no entries for today', async () => {
      const entries = [createMockEntry({ id: 'e1', date: '2020-01-01' })];
      await AsyncStorage.setItem('@hydration_entries', JSON.stringify(entries));

      const result = await getTodayEntries();
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const result = await getTodayEntries();
      expect(result).toEqual([]);
    });
  });

  describe('saveWaterEntry', () => {
    it('should save a new water entry', async () => {
      const entry = createMockEntry();
      await saveWaterEntry(entry);

      const stored = await AsyncStorage.getItem('@hydration_entries');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('entry-1');
    });

    it('should prepend new entries (most recent first)', async () => {
      const entry1 = createMockEntry({ id: 'e1' });
      const entry2 = createMockEntry({ id: 'e2' });

      await saveWaterEntry(entry1);
      await saveWaterEntry(entry2);

      const stored = await AsyncStorage.getItem('@hydration_entries');
      const parsed = JSON.parse(stored!);
      expect(parsed[0].id).toBe('e2');
    });

    it('should filter out entries older than 30 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);
      const oldDateStr = oldDate.toISOString().split('T')[0];

      const oldEntries = [createMockEntry({ id: 'old', date: oldDateStr })];
      await AsyncStorage.setItem('@hydration_entries', JSON.stringify(oldEntries));

      const newEntry = createMockEntry({ id: 'new' });
      await saveWaterEntry(newEntry);

      const stored = await AsyncStorage.getItem('@hydration_entries');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('new');
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveWaterEntry(createMockEntry())).rejects.toThrow('Storage error');
    });
  });

  describe('deleteWaterEntry', () => {
    it('should remove entry by ID', async () => {
      const entries = [
        createMockEntry({ id: 'e1' }),
        createMockEntry({ id: 'e2' }),
      ];
      await AsyncStorage.setItem('@hydration_entries', JSON.stringify(entries));

      await deleteWaterEntry('e1');

      const stored = await AsyncStorage.getItem('@hydration_entries');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('e2');
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(deleteWaterEntry('e1')).rejects.toThrow('Storage error');
    });
  });

  // ============ Hydration Goal ============

  describe('getHydrationGoal', () => {
    it('should return default goal when none saved', async () => {
      const goal = await getHydrationGoal();
      expect(goal).toEqual(DEFAULT_HYDRATION_GOAL);
    });

    it('should return saved goal', async () => {
      const customGoal: HydrationGoal = {
        dailyGoal: 3000,
        reminderEnabled: false,
        reminderInterval: 90,
        wakeTime: '06:00',
        sleepTime: '23:00',
      };
      await AsyncStorage.setItem('@hydration_goal', JSON.stringify(customGoal));

      const goal = await getHydrationGoal();
      expect(goal).toEqual(customGoal);
    });

    it('should return default goal on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const goal = await getHydrationGoal();
      expect(goal).toEqual(DEFAULT_HYDRATION_GOAL);
    });
  });

  describe('saveHydrationGoal', () => {
    it('should save and retrieve goal', async () => {
      const customGoal: HydrationGoal = {
        dailyGoal: 3500,
        reminderEnabled: true,
        reminderInterval: 45,
        wakeTime: '05:30',
        sleepTime: '21:30',
      };
      await saveHydrationGoal(customGoal);

      const stored = await AsyncStorage.getItem('@hydration_goal');
      expect(JSON.parse(stored!)).toEqual(customGoal);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        saveHydrationGoal(DEFAULT_HYDRATION_GOAL)
      ).rejects.toThrow('Storage error');
    });
  });

  // ============ Hydration Streak ============

  describe('getHydrationStreak', () => {
    it('should return default streak when none saved', async () => {
      const streak = await getHydrationStreak();
      expect(streak).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastGoalMetDate: null,
      });
    });

    it('should return saved streak', async () => {
      const mockStreak = {
        currentStreak: 5,
        longestStreak: 10,
        lastGoalMetDate: '2025-01-15',
      };
      await AsyncStorage.setItem('@hydration_streak', JSON.stringify(mockStreak));

      const streak = await getHydrationStreak();
      expect(streak).toEqual(mockStreak);
    });

    it('should return default streak on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const streak = await getHydrationStreak();
      expect(streak).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastGoalMetDate: null,
      });
    });
  });

  describe('updateHydrationStreak', () => {
    it('should start streak at 1 for first goal met', async () => {
      const result = await updateHydrationStreak(true);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.lastGoalMetDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should increment streak on consecutive day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const existingStreak = {
        currentStreak: 3,
        longestStreak: 5,
        lastGoalMetDate: yesterdayStr,
      };
      await AsyncStorage.setItem('@hydration_streak', JSON.stringify(existingStreak));

      const result = await updateHydrationStreak(true);
      expect(result.currentStreak).toBe(4);
    });

    it('should reset streak when gap is more than 1 day', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      const existingStreak = {
        currentStreak: 7,
        longestStreak: 10,
        lastGoalMetDate: threeDaysAgoStr,
      };
      await AsyncStorage.setItem('@hydration_streak', JSON.stringify(existingStreak));

      const result = await updateHydrationStreak(true);
      expect(result.currentStreak).toBe(1);
    });

    it('should not change streak for same day repeat', async () => {
      const today = new Date().toISOString().split('T')[0];
      const existingStreak = {
        currentStreak: 5,
        longestStreak: 10,
        lastGoalMetDate: today,
      };
      await AsyncStorage.setItem('@hydration_streak', JSON.stringify(existingStreak));

      const result = await updateHydrationStreak(true);
      // diffDays === 0 means same day, streak unchanged
      expect(result.currentStreak).toBe(5);
    });

    it('should update longest streak when current exceeds it', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const existingStreak = {
        currentStreak: 10,
        longestStreak: 10,
        lastGoalMetDate: yesterdayStr,
      };
      await AsyncStorage.setItem('@hydration_streak', JSON.stringify(existingStreak));

      const result = await updateHydrationStreak(true);
      expect(result.longestStreak).toBe(11);
    });

    it('should reset streak to 0 when goal not met and gap is more than 1 day', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      const existingStreak = {
        currentStreak: 5,
        longestStreak: 10,
        lastGoalMetDate: threeDaysAgoStr,
      };
      await AsyncStorage.setItem('@hydration_streak', JSON.stringify(existingStreak));

      const result = await updateHydrationStreak(false);
      expect(result.currentStreak).toBe(0);
    });

    it('should throw on AsyncStorage error during save', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(updateHydrationStreak(true)).rejects.toThrow('Storage error');
    });
  });

  // ============ calculateTotalIntake (pure function) ============

  describe('calculateTotalIntake', () => {
    it('should return 0 for empty entries', () => {
      expect(calculateTotalIntake([])).toBe(0);
    });

    it('should calculate intake with water multiplier (1.0)', () => {
      const entries = [createMockEntry({ amount: 500, source: 'water' })];
      expect(calculateTotalIntake(entries)).toBe(500);
    });

    it('should apply coffee multiplier (0.8)', () => {
      const entries = [createMockEntry({ amount: 250, source: 'coffee' })];
      expect(calculateTotalIntake(entries)).toBe(Math.round(250 * HYDRATION_MULTIPLIERS.coffee));
    });

    it('should apply sports drink multiplier (1.1)', () => {
      const entries = [createMockEntry({ amount: 500, source: 'sports_drink' })];
      expect(calculateTotalIntake(entries)).toBe(Math.round(500 * HYDRATION_MULTIPLIERS.sports_drink));
    });

    it('should sum multiple entries with different sources', () => {
      const entries = [
        createMockEntry({ id: 'e1', amount: 500, source: 'water' }),
        createMockEntry({ id: 'e2', amount: 250, source: 'coffee' }),
      ];
      const expected =
        Math.round(500 * HYDRATION_MULTIPLIERS.water) +
        Math.round(250 * HYDRATION_MULTIPLIERS.coffee);
      expect(calculateTotalIntake(entries)).toBe(expected);
    });
  });

  // ============ getDailyHistory ============

  describe('getDailyHistory', () => {
    it('should return history for last N days', async () => {
      const history = await getDailyHistory(3);
      expect(history).toHaveLength(3);
    });

    it('should include default goal information', async () => {
      const history = await getDailyHistory(1);
      expect(history[0].goal).toBe(DEFAULT_HYDRATION_GOAL.dailyGoal);
    });

    it('should calculate percent complete and goalMet correctly', async () => {
      const today = new Date().toISOString().split('T')[0];
      // Save entries that exactly meet the default goal of 2500
      const entries = [createMockEntry({ date: today, amount: 2500, source: 'water' })];
      await AsyncStorage.setItem('@hydration_entries', JSON.stringify(entries));

      const history = await getDailyHistory(1);
      expect(history[0].totalIntake).toBe(2500);
      expect(history[0].percentComplete).toBe(100);
      expect(history[0].goalMet).toBe(true);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const history = await getDailyHistory(7);
      expect(history).toEqual([]);
    });
  });

  // ============ getTodayTotalIntake ============

  describe('getTodayTotalIntake', () => {
    it('should return 0 when no entries for today', async () => {
      const intake = await getTodayTotalIntake();
      expect(intake).toBe(0);
    });

    it('should return total intake for today', async () => {
      const today = new Date().toISOString().split('T')[0];
      const entries = [
        createMockEntry({ id: 'e1', date: today, amount: 250, source: 'water' }),
        createMockEntry({ id: 'e2', date: today, amount: 500, source: 'water' }),
      ];
      await AsyncStorage.setItem('@hydration_entries', JSON.stringify(entries));

      const intake = await getTodayTotalIntake();
      expect(intake).toBe(750);
    });

    it('should return 0 on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const intake = await getTodayTotalIntake();
      expect(intake).toBe(0);
    });
  });

  // ============ checkTodayGoalMet ============

  describe('checkTodayGoalMet', () => {
    it('should return false when no entries', async () => {
      const result = await checkTodayGoalMet();
      expect(result).toBe(false);
    });

    it('should return true when intake meets goal', async () => {
      const today = new Date().toISOString().split('T')[0];
      const entries = [createMockEntry({ date: today, amount: 3000, source: 'water' })];
      await AsyncStorage.setItem('@hydration_entries', JSON.stringify(entries));

      const result = await checkTodayGoalMet();
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const result = await checkTodayGoalMet();
      expect(result).toBe(false);
    });
  });

  // ============ getHydrationStats ============

  describe('getHydrationStats', () => {
    it('should return zero stats when no entries', async () => {
      const stats = await getHydrationStats();
      expect(stats.avgIntake).toBe(0);
      expect(stats.goalMetDays).toBe(0);
      expect(stats.totalDays).toBe(7);
    });

    it('should return zero stats on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const stats = await getHydrationStats();
      expect(stats).toEqual({ avgIntake: 0, goalMetDays: 0, totalDays: 0 });
    });
  });
});
