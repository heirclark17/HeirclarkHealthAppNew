// @ts-nocheck
/**
 * Tests for sleepRecoveryStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSleepEntries,
  saveSleepEntry,
  deleteSleepEntry,
  getSleepEntriesForDateRange,
  getRecoveryScores,
  saveRecoveryScore,
  getTodayRecoveryScore,
  getSleepGoal,
  saveSleepGoal,
  getAverageSleepDuration,
  getAverageSleepQuality,
  calculateSleepDebt,
  getSleepConsistencyScore,
} from '../sleepRecoveryStorage';
import { SleepEntry, RecoveryScore, SleepGoal, DEFAULT_SLEEP_GOAL } from '../../types/sleepRecovery';

// Helper to create a mock SleepEntry
function createMockSleepEntry(overrides: Partial<SleepEntry> = {}): SleepEntry {
  return {
    id: 'sleep-1',
    date: new Date().toISOString().split('T')[0],
    bedtime: '22:30',
    wakeTime: '06:30',
    duration: 480,
    quality: 4 as const,
    notes: '',
    ...overrides,
  };
}

// Helper to create a mock RecoveryScore
function createMockRecoveryScore(overrides: Partial<RecoveryScore> = {}): RecoveryScore {
  return {
    date: new Date().toISOString().split('T')[0],
    score: 85,
    factors: {
      sleep: 90,
      nutrition: 80,
      activity: 85,
      stress: 75,
    },
    ...overrides,
  };
}

describe('sleepRecoveryStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  // ============ Sleep Entries ============

  describe('getSleepEntries', () => {
    it('should return empty array when no entries saved', async () => {
      const entries = await getSleepEntries();
      expect(entries).toEqual([]);
    });

    it('should return saved entries', async () => {
      const mockEntries = [
        createMockSleepEntry({ id: 'sleep-1' }),
        createMockSleepEntry({ id: 'sleep-2', duration: 420 }),
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(mockEntries));

      const entries = await getSleepEntries();
      expect(entries).toHaveLength(2);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const entries = await getSleepEntries();
      expect(entries).toEqual([]);
    });
  });

  describe('saveSleepEntry', () => {
    it('should save a new sleep entry', async () => {
      const entry = createMockSleepEntry();
      await saveSleepEntry(entry);

      const stored = await AsyncStorage.getItem('@sleep_entries');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('sleep-1');
    });

    it('should prepend new entries (most recent first)', async () => {
      await saveSleepEntry(createMockSleepEntry({ id: 'sleep-1' }));
      await saveSleepEntry(createMockSleepEntry({ id: 'sleep-2' }));

      const stored = await AsyncStorage.getItem('@sleep_entries');
      const parsed = JSON.parse(stored!);
      expect(parsed[0].id).toBe('sleep-2');
    });

    it('should update existing entry with same ID', async () => {
      await saveSleepEntry(createMockSleepEntry({ id: 'sleep-1', duration: 400 }));
      await saveSleepEntry(createMockSleepEntry({ id: 'sleep-1', duration: 480 }));

      const stored = await AsyncStorage.getItem('@sleep_entries');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].duration).toBe(480);
    });

    it('should limit entries to 90', async () => {
      // First save 90 entries
      const entries = Array.from({ length: 95 }, (_, i) =>
        createMockSleepEntry({ id: `sleep-${i}` })
      );
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      // Save one more
      await saveSleepEntry(createMockSleepEntry({ id: 'sleep-new' }));

      const stored = await AsyncStorage.getItem('@sleep_entries');
      const parsed = JSON.parse(stored!);
      // New entry prepended, then trimmed to 90
      expect(parsed.length).toBeLessThanOrEqual(90);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveSleepEntry(createMockSleepEntry())).rejects.toThrow('Storage error');
    });
  });

  describe('deleteSleepEntry', () => {
    it('should remove entry by ID', async () => {
      const entries = [
        createMockSleepEntry({ id: 'sleep-1' }),
        createMockSleepEntry({ id: 'sleep-2' }),
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      await deleteSleepEntry('sleep-1');

      const stored = await AsyncStorage.getItem('@sleep_entries');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('sleep-2');
    });

    it('should not change list when ID not found', async () => {
      const entries = [createMockSleepEntry({ id: 'sleep-1' })];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      await deleteSleepEntry('nonexistent');

      const stored = await AsyncStorage.getItem('@sleep_entries');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(deleteSleepEntry('sleep-1')).rejects.toThrow('Storage error');
    });
  });

  describe('getSleepEntriesForDateRange', () => {
    it('should return entries within date range', async () => {
      const entries = [
        createMockSleepEntry({ id: 's1', date: '2025-01-10' }),
        createMockSleepEntry({ id: 's2', date: '2025-01-15' }),
        createMockSleepEntry({ id: 's3', date: '2025-01-20' }),
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const result = await getSleepEntriesForDateRange('2025-01-12', '2025-01-18');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s2');
    });

    it('should return empty array when no entries in range', async () => {
      const entries = [createMockSleepEntry({ date: '2025-01-01' })];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const result = await getSleepEntriesForDateRange('2025-06-01', '2025-06-30');
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const result = await getSleepEntriesForDateRange('2025-01-01', '2025-01-31');
      expect(result).toEqual([]);
    });
  });

  // ============ Recovery Scores ============

  describe('getRecoveryScores', () => {
    it('should return empty array when no scores saved', async () => {
      const scores = await getRecoveryScores();
      expect(scores).toEqual([]);
    });

    it('should return saved scores', async () => {
      const mockScores = [createMockRecoveryScore()];
      await AsyncStorage.setItem('@recovery_scores', JSON.stringify(mockScores));

      const scores = await getRecoveryScores();
      expect(scores).toHaveLength(1);
      expect(scores[0].score).toBe(85);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const scores = await getRecoveryScores();
      expect(scores).toEqual([]);
    });
  });

  describe('saveRecoveryScore', () => {
    it('should save a new recovery score', async () => {
      const score = createMockRecoveryScore();
      await saveRecoveryScore(score);

      const stored = await AsyncStorage.getItem('@recovery_scores');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].score).toBe(85);
    });

    it('should update existing score for same date', async () => {
      const date = '2025-01-15';
      await saveRecoveryScore(createMockRecoveryScore({ date, score: 70 }));
      await saveRecoveryScore(createMockRecoveryScore({ date, score: 90 }));

      const stored = await AsyncStorage.getItem('@recovery_scores');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].score).toBe(90);
    });

    it('should limit scores to 30', async () => {
      const scores = Array.from({ length: 35 }, (_, i) =>
        createMockRecoveryScore({ date: `2025-01-${String(i + 1).padStart(2, '0')}` })
      );
      await AsyncStorage.setItem('@recovery_scores', JSON.stringify(scores));

      await saveRecoveryScore(createMockRecoveryScore({ date: '2025-02-15' }));

      const stored = await AsyncStorage.getItem('@recovery_scores');
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBeLessThanOrEqual(30);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveRecoveryScore(createMockRecoveryScore())).rejects.toThrow('Storage error');
    });
  });

  describe('getTodayRecoveryScore', () => {
    it('should return null when no score for today', async () => {
      const score = await getTodayRecoveryScore();
      expect(score).toBeNull();
    });

    it('should return today recovery score', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockScores = [createMockRecoveryScore({ date: today, score: 92 })];
      await AsyncStorage.setItem('@recovery_scores', JSON.stringify(mockScores));

      const score = await getTodayRecoveryScore();
      expect(score).not.toBeNull();
      expect(score!.score).toBe(92);
    });

    it('should return null on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const score = await getTodayRecoveryScore();
      expect(score).toBeNull();
    });
  });

  // ============ Sleep Goal ============

  describe('getSleepGoal', () => {
    it('should return default goal when none saved', async () => {
      const goal = await getSleepGoal();
      expect(goal).toEqual(DEFAULT_SLEEP_GOAL);
    });

    it('should return saved goal', async () => {
      const customGoal: SleepGoal = {
        targetBedtime: '23:00',
        targetWakeTime: '07:00',
        targetDuration: 480,
      };
      await AsyncStorage.setItem('@sleep_goal', JSON.stringify(customGoal));

      const goal = await getSleepGoal();
      expect(goal).toEqual(customGoal);
    });

    it('should return default goal on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const goal = await getSleepGoal();
      expect(goal).toEqual(DEFAULT_SLEEP_GOAL);
    });
  });

  describe('saveSleepGoal', () => {
    it('should save and retrieve goal', async () => {
      const customGoal: SleepGoal = {
        targetBedtime: '21:00',
        targetWakeTime: '05:00',
        targetDuration: 480,
      };
      await saveSleepGoal(customGoal);

      const stored = await AsyncStorage.getItem('@sleep_goal');
      expect(JSON.parse(stored!)).toEqual(customGoal);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveSleepGoal(DEFAULT_SLEEP_GOAL)).rejects.toThrow('Storage error');
    });
  });

  // ============ Analytics ============

  describe('getAverageSleepDuration', () => {
    it('should return 0 when no entries', async () => {
      const avg = await getAverageSleepDuration();
      expect(avg).toBe(0);
    });

    it('should calculate average of recent entries', async () => {
      const entries = [
        createMockSleepEntry({ id: 's1', duration: 420 }),
        createMockSleepEntry({ id: 's2', duration: 480 }),
        createMockSleepEntry({ id: 's3', duration: 540 }),
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const avg = await getAverageSleepDuration(3);
      expect(avg).toBe(Math.round((420 + 480 + 540) / 3));
    });

    it('should limit to specified number of days', async () => {
      const entries = [
        createMockSleepEntry({ id: 's1', duration: 480 }),
        createMockSleepEntry({ id: 's2', duration: 360 }),
        createMockSleepEntry({ id: 's3', duration: 300 }),
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const avg = await getAverageSleepDuration(2);
      // Only first 2 entries (s1 and s2)
      expect(avg).toBe(Math.round((480 + 360) / 2));
    });

    it('should return 0 on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const avg = await getAverageSleepDuration();
      expect(avg).toBe(0);
    });
  });

  describe('getAverageSleepQuality', () => {
    it('should return 0 when no entries', async () => {
      const avg = await getAverageSleepQuality();
      expect(avg).toBe(0);
    });

    it('should calculate average quality', async () => {
      const entries = [
        createMockSleepEntry({ id: 's1', quality: 4 }),
        createMockSleepEntry({ id: 's2', quality: 3 }),
        createMockSleepEntry({ id: 's3', quality: 5 }),
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const avg = await getAverageSleepQuality(3);
      expect(avg).toBe(4);
    });

    it('should return 0 on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const avg = await getAverageSleepQuality();
      expect(avg).toBe(0);
    });
  });

  describe('calculateSleepDebt', () => {
    it('should return 0 when no entries', async () => {
      const debt = await calculateSleepDebt();
      expect(debt).toBe(0);
    });

    it('should calculate positive sleep debt', async () => {
      // Default target is 480 min (8 hours)
      const entries = [
        createMockSleepEntry({ id: 's1', duration: 360 }), // 2h short
        createMockSleepEntry({ id: 's2', duration: 360 }), // 2h short
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const debt = await calculateSleepDebt();
      // Target: 480 * 2 = 960, Actual: 360 * 2 = 720, Debt: 240
      expect(debt).toBe(240);
    });

    it('should return 0 when sleep exceeds goal (no negative debt)', async () => {
      const entries = [
        createMockSleepEntry({ id: 's1', duration: 600 }),
        createMockSleepEntry({ id: 's2', duration: 540 }),
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const debt = await calculateSleepDebt();
      expect(debt).toBe(0);
    });

    it('should return 0 on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const debt = await calculateSleepDebt();
      expect(debt).toBe(0);
    });
  });

  describe('getSleepConsistencyScore', () => {
    it('should return 100 when fewer than 2 entries', async () => {
      const entries = [createMockSleepEntry({ id: 's1', bedtime: '22:30' })];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const score = await getSleepConsistencyScore();
      expect(score).toBe(100);
    });

    it('should return 100 for empty entries', async () => {
      const score = await getSleepConsistencyScore();
      expect(score).toBe(100);
    });

    it('should return high score for consistent bedtimes', async () => {
      const entries = [
        createMockSleepEntry({ id: 's1', bedtime: '22:30' }),
        createMockSleepEntry({ id: 's2', bedtime: '22:30' }),
        createMockSleepEntry({ id: 's3', bedtime: '22:30' }),
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const score = await getSleepConsistencyScore();
      expect(score).toBe(100);
    });

    it('should return lower score for inconsistent bedtimes', async () => {
      const entries = [
        createMockSleepEntry({ id: 's1', bedtime: '21:00' }),
        createMockSleepEntry({ id: 's2', bedtime: '00:00' }),
        createMockSleepEntry({ id: 's3', bedtime: '23:00' }),
        createMockSleepEntry({ id: 's4', bedtime: '02:00' }),
      ];
      await AsyncStorage.setItem('@sleep_entries', JSON.stringify(entries));

      const score = await getSleepConsistencyScore();
      expect(score).toBeLessThan(100);
    });

    it('should return 0 on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const score = await getSleepConsistencyScore();
      expect(score).toBe(0);
    });
  });
});
