/**
 * Tests for weightTrackingStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { weightTrackingStorage, convertWeight } from '../weightTrackingStorage';

// Mock the API
jest.mock('../api', () => ({
  api: {
    savePersonalRecord: jest.fn().mockResolvedValue(true),
    getPersonalRecords: jest.fn().mockResolvedValue({}),
  },
}));

const { api } = require('../api');

describe('weightTrackingStorage', () => {
  beforeEach(() => {
    AsyncStorage.__resetStore();
    jest.clearAllMocks();
  });

  describe('convertWeight', () => {
    it('should convert pounds to kilograms', () => {
      expect(convertWeight(220, 'lb', 'kg')).toBe(99.8);
    });

    it('should convert kilograms to pounds', () => {
      expect(convertWeight(100, 'kg', 'lb')).toBe(220.5);
    });

    it('should return same value when units match', () => {
      expect(convertWeight(150, 'lb', 'lb')).toBe(150);
      expect(convertWeight(68, 'kg', 'kg')).toBe(68);
    });
  });

  describe('getSettings / saveSettings', () => {
    it('should return default settings when none saved', async () => {
      const settings = await weightTrackingStorage.getSettings();

      expect(settings).toEqual({
        preferredUnit: 'lb',
        autoConvert: true,
        trackRPE: false,
        showProgressChart: true,
        progressionStrategy: 'linear',
        minimumWeightIncrement: { lb: 5, kg: 2.5 },
      });
    });

    it('should save and retrieve settings', async () => {
      const customSettings = {
        preferredUnit: 'kg' as const,
        autoConvert: false,
        trackRPE: true,
        showProgressChart: false,
        progressionStrategy: 'double_progression' as const,
        minimumWeightIncrement: { lb: 10, kg: 5 },
      };

      await weightTrackingStorage.saveSettings(customSettings);
      const loaded = await weightTrackingStorage.getSettings();

      expect(loaded).toEqual(customSettings);
    });

    it('should merge partial settings with existing', async () => {
      await weightTrackingStorage.saveSettings({ preferredUnit: 'kg' });
      const settings = await weightTrackingStorage.getSettings();

      expect(settings.preferredUnit).toBe('kg');
      expect(settings.autoConvert).toBe(true); // Still default
    });
  });

  describe('getAllWeightLogs', () => {
    it('should return empty array when no logs exist', async () => {
      const logs = await weightTrackingStorage.getAllWeightLogs();
      expect(logs).toEqual([]);
    });

    it('should return stored weight logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          exerciseId: 'squat',
          exerciseName: 'Barbell Squat',
          date: '2025-01-15',
          weekNumber: 3,
          sets: [{ setNumber: 1, weight: 225, unit: 'lb' as const, reps: 5, isWarmup: false }],
          totalVolume: 1125,
          maxWeight: 225,
          averageWeight: 225,
          personalRecord: true,
        },
      ];

      await AsyncStorage.setItem('hc_weight_logs', JSON.stringify(mockLogs));
      const logs = await weightTrackingStorage.getAllWeightLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].exerciseName).toBe('Barbell Squat');
    });
  });

  describe('saveWeightLog', () => {
    it('should save weight log with calculated fields', async () => {
      const log = await weightTrackingStorage.saveWeightLog({
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        date: '2025-01-15',
        weekNumber: 1,
        sets: [
          { setNumber: 1, weight: 135, unit: 'lb', reps: 10, isWarmup: true },
          { setNumber: 2, weight: 185, unit: 'lb', reps: 8, isWarmup: false },
          { setNumber: 3, weight: 185, unit: 'lb', reps: 7, isWarmup: false },
        ],
      });

      expect(log.id).toBeDefined();
      expect(log.totalVolume).toBe(135 * 10 + 185 * 8 + 185 * 7); // 4115
      expect(log.maxWeight).toBe(185);
      expect(log.averageWeight).toBe(185); // Average of non-warmup sets
    });

    it('should detect personal record', async () => {
      // First log
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 200, unit: 'lb', reps: 5, isWarmup: false }],
      });

      // PR log
      const prLog = await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-15',
        weekNumber: 3,
        sets: [{ setNumber: 1, weight: 225, unit: 'lb', reps: 5, isWarmup: false }],
      });

      expect(prLog.personalRecord).toBe(true);
    });

    it('should sync PR to backend when detected', async () => {
      const prLog = await weightTrackingStorage.saveWeightLog({
        exerciseId: 'deadlift',
        exerciseName: 'Deadlift',
        date: '2025-01-15',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 405, unit: 'lb', reps: 1, isWarmup: false }],
      });

      expect(api.savePersonalRecord).toHaveBeenCalledWith('Deadlift', 405, 1, undefined);
    });

    it('should not mark as PR if not highest weight', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 300, unit: 'lb', reps: 5, isWarmup: false }],
      });

      const lowerLog = await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-15',
        weekNumber: 3,
        sets: [{ setNumber: 1, weight: 275, unit: 'lb', reps: 5, isWarmup: false }],
      });

      expect(lowerLog.personalRecord).toBe(false);
    });
  });

  describe('getLogsForExercise', () => {
    it('should filter logs by exercise ID', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 225, unit: 'lb', reps: 5, isWarmup: false }],
      });

      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 185, unit: 'lb', reps: 8, isWarmup: false }],
      });

      const squatLogs = await weightTrackingStorage.getLogsForExercise('squat');
      expect(squatLogs).toHaveLength(1);
      expect(squatLogs[0].exerciseName).toBe('Squat');
    });

    it('should sort logs by date descending', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 225, unit: 'lb', reps: 5, isWarmup: false }],
      });

      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-15',
        weekNumber: 3,
        sets: [{ setNumber: 1, weight: 245, unit: 'lb', reps: 5, isWarmup: false }],
      });

      const logs = await weightTrackingStorage.getLogsForExercise('squat');
      expect(logs[0].date).toBe('2025-01-15');
      expect(logs[1].date).toBe('2025-01-01');
    });
  });

  describe('getLastLogForExercise', () => {
    it('should return most recent log', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 225, unit: 'lb', reps: 5, isWarmup: false }],
      });

      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-15',
        weekNumber: 3,
        sets: [{ setNumber: 1, weight: 245, unit: 'lb', reps: 5, isWarmup: false }],
      });

      const lastLog = await weightTrackingStorage.getLastLogForExercise('squat');
      expect(lastLog!.maxWeight).toBe(245);
    });

    it('should return null when no logs exist', async () => {
      const lastLog = await weightTrackingStorage.getLastLogForExercise('nonexistent');
      expect(lastLog).toBeNull();
    });
  });

  describe('getExerciseProgress', () => {
    it('should calculate progress metrics', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 200, unit: 'lb', reps: 5, isWarmup: false }],
      });

      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-15',
        weekNumber: 3,
        sets: [{ setNumber: 1, weight: 225, unit: 'lb', reps: 5, isWarmup: false }],
      });

      const progress = await weightTrackingStorage.getExerciseProgress('squat', 'Squat');

      expect(progress).toBeDefined();
      expect(progress!.totalSessions).toBe(2);
      expect(progress!.currentMax).toBe(225);
      expect(progress!.allTimeMax).toBe(225);
      expect(progress!.progressPercentage).toBe(13); // (225-200)/200 * 100 = 12.5 rounded to 13
    });

    it('should return null when no logs exist', async () => {
      const progress = await weightTrackingStorage.getExerciseProgress('nonexistent', 'Nonexistent');
      expect(progress).toBeNull();
    });

    it('should determine increasing trend', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 200, unit: 'lb', reps: 5, isWarmup: false }],
      });

      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-08',
        weekNumber: 2,
        sets: [{ setNumber: 1, weight: 210, unit: 'lb', reps: 5, isWarmup: false }],
      });

      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-15',
        weekNumber: 3,
        sets: [{ setNumber: 1, weight: 220, unit: 'lb', reps: 5, isWarmup: false }],
      });

      const progress = await weightTrackingStorage.getExerciseProgress('squat', 'Squat');
      expect(progress!.trend).toBe('increasing');
    });

    it('should suggest next weight based on progression', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'bench',
        exerciseName: 'Bench Press',
        date: '2025-01-15',
        weekNumber: 1,
        sets: [
          { setNumber: 1, weight: 185, unit: 'lb', reps: 10, isWarmup: false },
          { setNumber: 2, weight: 185, unit: 'lb', reps: 9, isWarmup: false },
        ],
      });

      const progress = await weightTrackingStorage.getExerciseProgress('bench', 'Bench Press');
      expect(progress!.suggestedNextWeight).toBe(190); // 185 + 5lb increment
    });
  });

  describe('getProgressiveOverloadRecommendation', () => {
    it('should recommend weight increase for linear progression', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-15',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 225, unit: 'lb', reps: 10, isWarmup: false }],
      });

      const recommendation = await weightTrackingStorage.getProgressiveOverloadRecommendation(
        'squat',
        'Squat'
      );

      expect(recommendation).toBeDefined();
      expect(recommendation!.readyToProgress).toBe(true);
      expect(recommendation!.suggestedWeight).toBe(230);
    });

    it('should return null when no logs exist', async () => {
      const recommendation = await weightTrackingStorage.getProgressiveOverloadRecommendation(
        'nonexistent',
        'Nonexistent'
      );
      expect(recommendation).toBeNull();
    });

    it('should use double progression strategy', async () => {
      await weightTrackingStorage.saveSettings({ progressionStrategy: 'double_progression' });

      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'bench',
        exerciseName: 'Bench Press',
        date: '2025-01-15',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 185, unit: 'lb', reps: 12, isWarmup: false }],
      });

      const recommendation = await weightTrackingStorage.getProgressiveOverloadRecommendation(
        'bench',
        'Bench Press'
      );

      expect(recommendation!.readyToProgress).toBe(true);
      expect(recommendation!.confidence).toBe('high');
    });
  });

  describe('syncPersonalRecordsFromBackend', () => {
    it('should sync PRs from backend', async () => {
      api.getPersonalRecords.mockResolvedValueOnce({
        'Squat': { weight: 300, reps: 5, achievedAt: '2025-01-10T00:00:00.000Z' },
      });

      await weightTrackingStorage.syncPersonalRecordsFromBackend();

      const logs = await weightTrackingStorage.getAllWeightLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(log => log.maxWeight === 300)).toBe(true);
    });

    it('should not duplicate existing PRs', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-15',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 350, unit: 'lb', reps: 5, isWarmup: false }],
      });

      api.getPersonalRecords.mockResolvedValueOnce({
        'Squat': { weight: 300, reps: 5, achievedAt: '2025-01-10T00:00:00.000Z' },
      });

      await weightTrackingStorage.syncPersonalRecordsFromBackend();

      const logs = await weightTrackingStorage.getAllWeightLogs();
      expect(logs.some(log => log.maxWeight === 300)).toBe(false); // Should not add lower PR
    });
  });

  describe('clearAllData', () => {
    it('should clear all weight tracking data', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-15',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 225, unit: 'lb', reps: 5, isWarmup: false }],
      });

      await weightTrackingStorage.saveSettings({ preferredUnit: 'kg' });

      await weightTrackingStorage.clearAllData();

      const logs = await weightTrackingStorage.getAllWeightLogs();
      const settings = await weightTrackingStorage.getSettings();

      expect(logs).toEqual([]);
      expect(settings.preferredUnit).toBe('lb'); // Back to defaults
    });
  });

  describe('getExercisesWithHistory', () => {
    it('should return unique exercise IDs', async () => {
      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 225, unit: 'lb', reps: 5, isWarmup: false }],
      });

      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        date: '2025-01-08',
        weekNumber: 2,
        sets: [{ setNumber: 1, weight: 235, unit: 'lb', reps: 5, isWarmup: false }],
      });

      await weightTrackingStorage.saveWeightLog({
        exerciseId: 'bench',
        exerciseName: 'Bench Press',
        date: '2025-01-01',
        weekNumber: 1,
        sets: [{ setNumber: 1, weight: 185, unit: 'lb', reps: 8, isWarmup: false }],
      });

      const exercises = await weightTrackingStorage.getExercisesWithHistory();
      expect(exercises).toEqual(['squat', 'bench']);
    });

    it('should return empty array when no logs exist', async () => {
      const exercises = await weightTrackingStorage.getExercisesWithHistory();
      expect(exercises).toEqual([]);
    });
  });
});
