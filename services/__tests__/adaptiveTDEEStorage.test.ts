/**
 * Tests for adaptiveTDEEStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { adaptiveTDEEStorage, convertBodyWeight } from '../adaptiveTDEEStorage';

describe('adaptiveTDEEStorage', () => {
  beforeEach(() => {
    AsyncStorage.__resetStore();
    jest.clearAllMocks();
  });

  describe('convertBodyWeight', () => {
    it('should convert pounds to kilograms', () => {
      expect(convertBodyWeight(220, 'lb', 'kg')).toBe(99.8);
    });

    it('should convert kilograms to pounds', () => {
      expect(convertBodyWeight(100, 'kg', 'lb')).toBe(220.5);
    });

    it('should return same value when units match', () => {
      expect(convertBodyWeight(150, 'lb', 'lb')).toBe(150);
    });
  });

  describe('getWeightHistory / logWeight', () => {
    it('should return empty array when no history', async () => {
      const history = await adaptiveTDEEStorage.getWeightHistory();
      expect(history).toEqual([]);
    });

    it('should log weight and return entry', async () => {
      const entry = await adaptiveTDEEStorage.logWeight(180, 'lb', 'manual');
      expect(entry.weight).toBe(180);
      expect(entry.unit).toBe('lb');
      expect(entry.id).toBeDefined();
    });

    it('should update existing log for same date and source', async () => {
      await adaptiveTDEEStorage.logWeight(180, 'lb', 'manual');
      await adaptiveTDEEStorage.logWeight(182, 'lb', 'manual');

      const history = await adaptiveTDEEStorage.getWeightHistory();
      expect(history).toHaveLength(1);
      expect(history[0].weight).toBe(182);
    });

    it('should sort history by date descending', async () => {
      const mockToday = jest.spyOn(Date.prototype, 'toISOString');
      mockToday.mockReturnValueOnce('2025-01-10T00:00:00.000Z');
      await adaptiveTDEEStorage.logWeight(180, 'lb');

      mockToday.mockReturnValueOnce('2025-01-15T00:00:00.000Z');
      await adaptiveTDEEStorage.logWeight(182, 'lb');

      const history = await adaptiveTDEEStorage.getWeightHistory();
      expect(history[0].weight).toBe(182);
    });

    it('should limit history to 365 days', async () => {
      for (let i = 0; i < 400; i++) {
        await adaptiveTDEEStorage.logWeight(180, 'lb');
      }

      const stored = await AsyncStorage.getItem('hc_adaptive_tdee_weight_history');
      const history = JSON.parse(stored!);
      expect(history.length).toBeLessThanOrEqual(365);
    });
  });

  describe('getLatestWeight', () => {
    it('should return most recent weight', async () => {
      await adaptiveTDEEStorage.logWeight(180, 'lb');
      await adaptiveTDEEStorage.logWeight(182, 'lb');

      const latest = await adaptiveTDEEStorage.getLatestWeight();
      expect(latest!.weight).toBe(182);
    });

    it('should return null when no weights', async () => {
      const latest = await adaptiveTDEEStorage.getLatestWeight();
      expect(latest).toBeNull();
    });
  });

  describe('logDailyCalories', () => {
    it('should log daily calories', async () => {
      const log = await adaptiveTDEEStorage.logDailyCalories('2025-01-15', 2000, 300, 3, true);

      expect(log.caloriesConsumed).toBe(2000);
      expect(log.caloriesBurned).toBe(300);
      expect(log.netCalories).toBe(1700);
      expect(log.isComplete).toBe(true);
    });

    it('should update existing log for same date', async () => {
      await adaptiveTDEEStorage.logDailyCalories('2025-01-15', 1800, 200);
      await adaptiveTDEEStorage.logDailyCalories('2025-01-15', 2000, 300);

      const history = await adaptiveTDEEStorage.getCalorieHistory();
      expect(history).toHaveLength(1);
      expect(history[0].caloriesConsumed).toBe(2000);
    });
  });

  describe('updateDailyCalories', () => {
    it('should update partial fields', async () => {
      await adaptiveTDEEStorage.logDailyCalories('2025-01-15', 1800, 200);
      const updated = await adaptiveTDEEStorage.updateDailyCalories('2025-01-15', {
        isComplete: true,
      });

      expect(updated!.isComplete).toBe(true);
      expect(updated!.caloriesConsumed).toBe(1800);
    });

    it('should recalculate net calories', async () => {
      await adaptiveTDEEStorage.logDailyCalories('2025-01-15', 2000, 300);
      const updated = await adaptiveTDEEStorage.updateDailyCalories('2025-01-15', {
        caloriesBurned: 500,
      });

      expect(updated!.netCalories).toBe(1500);
    });
  });

  describe('getTDEEResult', () => {
    it('should save and retrieve TDEE result', async () => {
      const result = {
        adaptiveTDEE: 2500,
        confidence: 'high' as const,
        dataPoints: 14,
        calculatedAt: new Date().toISOString(),
      };

      await adaptiveTDEEStorage.saveTDEEResult(result);
      const loaded = await adaptiveTDEEStorage.getTDEEResult();

      expect(loaded!.adaptiveTDEE).toBe(2500);
    });

    it('should return null when no result saved', async () => {
      const result = await adaptiveTDEEStorage.getTDEEResult();
      expect(result).toBeNull();
    });
  });

  describe('getDataQualityMetrics', () => {
    it('should return quality metrics', async () => {
      await adaptiveTDEEStorage.logWeight(180, 'lb');
      await adaptiveTDEEStorage.logDailyCalories('2025-01-15', 2000, 0, 3, true);

      const metrics = await adaptiveTDEEStorage.getDataQualityMetrics();

      expect(metrics.totalWeightLogs).toBeGreaterThanOrEqual(1);
      expect(metrics.totalCalorieLogs).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clearAllData', () => {
    it('should clear all data', async () => {
      await adaptiveTDEEStorage.logWeight(180, 'lb');
      await adaptiveTDEEStorage.logDailyCalories('2025-01-15', 2000);

      await adaptiveTDEEStorage.clearAllData();

      const weights = await adaptiveTDEEStorage.getWeightHistory();
      const calories = await adaptiveTDEEStorage.getCalorieHistory();

      expect(weights).toEqual([]);
      expect(calories).toEqual([]);
    });
  });

  describe('exportData', () => {
    it('should export all data', async () => {
      await adaptiveTDEEStorage.logWeight(180, 'lb');
      await adaptiveTDEEStorage.logDailyCalories('2025-01-15', 2000);

      const exported = await adaptiveTDEEStorage.exportData();

      expect(exported.weightHistory).toHaveLength(1);
      expect(exported.calorieHistory).toHaveLength(1);
    });
  });
});
