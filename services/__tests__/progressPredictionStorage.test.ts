/**
 * Tests for progressPredictionStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getWeightHistory,
  addWeightDataPoint,
  getLatestWeight,
  importWeightHistory,
  getPredictions,
  savePredictions,
  getGoalProjection,
  saveGoalProjection,
  getMilestones,
  saveMilestones,
  updateMilestone,
  getWeeklySummaries,
  saveWeeklySummary,
  getProgressSnapshot,
  saveProgressSnapshot,
  getLastCalculated,
  saveLastCalculated,
  clearAllProgressData,
} from '../progressPredictionStorage';
import {
  WeightDataPoint,
  WeightPrediction,
  GoalProjection,
  Milestone,
  WeeklyPredictionSummary,
  ProgressSnapshot,
} from '../../types/progressPrediction';

// Helper to create a mock WeightDataPoint
function createMockWeightPoint(overrides: Partial<WeightDataPoint> = {}): WeightDataPoint {
  return {
    date: new Date().toISOString().split('T')[0],
    weight: 180,
    trend: 180,
    timestamp: Date.now(),
    ...overrides,
  };
}

// Helper to create a mock WeightPrediction
function createMockPrediction(overrides: Partial<WeightPrediction> = {}): WeightPrediction {
  return {
    date: '2025-03-01',
    predictedWeight: 175,
    confidenceMin: 173,
    confidenceMax: 177,
    daysFromNow: 30,
    ...overrides,
  };
}

// Helper to create a mock GoalProjection
function createMockGoalProjection(overrides: Partial<GoalProjection> = {}): GoalProjection {
  return {
    goalWeight: 170,
    currentWeight: 180,
    weightToLose: 10,
    projectedDate: '2025-06-01',
    daysRemaining: 120,
    weeklyRate: 0.8,
    isOnTrack: true,
    confidenceLevel: 'medium',
    ...overrides,
  };
}

// Helper to create a mock Milestone
function createMockMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'milestone-1',
    type: 'weight',
    targetValue: 175,
    currentProgress: 50,
    projectedDate: '2025-04-01',
    achieved: false,
    achievedDate: null,
    label: '5% Lost',
    ...overrides,
  };
}

// Helper to create a mock WeeklyPredictionSummary
function createMockWeeklySummary(overrides: Partial<WeeklyPredictionSummary> = {}): WeeklyPredictionSummary {
  return {
    weekStart: '2025-01-13',
    weekEnd: '2025-01-19',
    startWeight: 180,
    endWeight: 179,
    predictedEndWeight: 179.2,
    actualChange: -1,
    expectedChange: -0.8,
    variance: -0.2,
    rating: 'on_track',
    ...overrides,
  };
}

// Helper to create a mock ProgressSnapshot
function createMockSnapshot(overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot {
  return {
    currentWeight: 180,
    startingWeight: 200,
    goalWeight: 170,
    totalLost: 20,
    totalToLose: 30,
    percentComplete: 67,
    currentBMI: 25.9,
    startingBMI: 28.8,
    goalBMI: 24.5,
    heightCm: 178,
    lastUpdated: Date.now(),
    ...overrides,
  };
}

describe('progressPredictionStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  // ============ Weight History ============

  describe('getWeightHistory', () => {
    it('should return empty array when no history saved', async () => {
      const history = await getWeightHistory();
      expect(history).toEqual([]);
    });

    it('should return saved history sorted by date descending', async () => {
      const points = [
        createMockWeightPoint({ date: '2025-01-10', weight: 182 }),
        createMockWeightPoint({ date: '2025-01-15', weight: 180 }),
        createMockWeightPoint({ date: '2025-01-05', weight: 184 }),
      ];
      await AsyncStorage.setItem('@progress_weight_history', JSON.stringify(points));

      const history = await getWeightHistory();
      expect(history[0].date).toBe('2025-01-15');
      expect(history[1].date).toBe('2025-01-10');
      expect(history[2].date).toBe('2025-01-05');
    });

    it('should filter by days when specified', async () => {
      const today = new Date();
      const recentDate = new Date();
      recentDate.setDate(today.getDate() - 5);
      const oldDate = new Date();
      oldDate.setDate(today.getDate() - 60);

      const points = [
        createMockWeightPoint({ date: recentDate.toISOString().split('T')[0], weight: 180 }),
        createMockWeightPoint({ date: oldDate.toISOString().split('T')[0], weight: 185 }),
      ];
      await AsyncStorage.setItem('@progress_weight_history', JSON.stringify(points));

      const history = await getWeightHistory(30);
      expect(history).toHaveLength(1);
      expect(history[0].weight).toBe(180);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const history = await getWeightHistory();
      expect(history).toEqual([]);
    });
  });

  describe('addWeightDataPoint', () => {
    it('should add a new weight data point', async () => {
      const point = createMockWeightPoint({ date: '2025-01-15' });
      const result = await addWeightDataPoint(point);

      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(180);
    });

    it('should update existing data point for same date', async () => {
      await addWeightDataPoint(createMockWeightPoint({ date: '2025-01-15', weight: 180 }));
      const result = await addWeightDataPoint(createMockWeightPoint({ date: '2025-01-15', weight: 179 }));

      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(179);
    });

    it('should sort by date descending after adding', async () => {
      await addWeightDataPoint(createMockWeightPoint({ date: '2025-01-15' }));
      const result = await addWeightDataPoint(createMockWeightPoint({ date: '2025-01-20' }));

      expect(result[0].date).toBe('2025-01-20');
      expect(result[1].date).toBe('2025-01-15');
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(addWeightDataPoint(createMockWeightPoint())).rejects.toThrow('Storage error');
    });
  });

  describe('getLatestWeight', () => {
    it('should return null when no history', async () => {
      const latest = await getLatestWeight();
      expect(latest).toBeNull();
    });

    it('should return most recent weight data point', async () => {
      const today = new Date().toISOString().split('T')[0];
      const points = [
        createMockWeightPoint({ date: today, weight: 179 }),
      ];
      await AsyncStorage.setItem('@progress_weight_history', JSON.stringify(points));

      const latest = await getLatestWeight();
      expect(latest).not.toBeNull();
      expect(latest!.weight).toBe(179);
    });
  });

  describe('importWeightHistory', () => {
    it('should import data points into empty storage', async () => {
      const points = [
        createMockWeightPoint({ date: '2025-01-10', weight: 182 }),
        createMockWeightPoint({ date: '2025-01-15', weight: 180 }),
      ];
      await importWeightHistory(points);

      const stored = await AsyncStorage.getItem('@progress_weight_history');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(2);
    });

    it('should merge without duplicating dates', async () => {
      await addWeightDataPoint(createMockWeightPoint({ date: '2025-01-15', weight: 180 }));

      const newPoints = [
        createMockWeightPoint({ date: '2025-01-15', weight: 179 }), // same date, different weight
        createMockWeightPoint({ date: '2025-01-16', weight: 178 }),
      ];
      await importWeightHistory(newPoints);

      const stored = await AsyncStorage.getItem('@progress_weight_history');
      const parsed = JSON.parse(stored!);
      // Should have 2 entries, not 3 (date 2025-01-15 merged)
      expect(parsed).toHaveLength(2);
      // The imported value should overwrite existing
      const jan15 = parsed.find((p: WeightDataPoint) => p.date === '2025-01-15');
      expect(jan15.weight).toBe(179);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(importWeightHistory([createMockWeightPoint()])).rejects.toThrow('Storage error');
    });
  });

  // ============ Predictions ============

  describe('getPredictions', () => {
    it('should return empty array when no predictions saved', async () => {
      const predictions = await getPredictions();
      expect(predictions).toEqual([]);
    });

    it('should return saved predictions', async () => {
      const mockPredictions = [createMockPrediction()];
      await AsyncStorage.setItem('@progress_predictions', JSON.stringify(mockPredictions));

      const predictions = await getPredictions();
      expect(predictions).toHaveLength(1);
      expect(predictions[0].predictedWeight).toBe(175);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const predictions = await getPredictions();
      expect(predictions).toEqual([]);
    });
  });

  describe('savePredictions', () => {
    it('should save and retrieve predictions', async () => {
      const predictions = [createMockPrediction(), createMockPrediction({ date: '2025-04-01' })];
      await savePredictions(predictions);

      const stored = await AsyncStorage.getItem('@progress_predictions');
      expect(JSON.parse(stored!)).toHaveLength(2);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(savePredictions([createMockPrediction()])).rejects.toThrow('Storage error');
    });
  });

  // ============ Goal Projection ============

  describe('getGoalProjection', () => {
    it('should return null when no projection saved', async () => {
      const projection = await getGoalProjection();
      expect(projection).toBeNull();
    });

    it('should return saved projection', async () => {
      const mockProjection = createMockGoalProjection();
      await AsyncStorage.setItem('@progress_goal_projection', JSON.stringify(mockProjection));

      const projection = await getGoalProjection();
      expect(projection).not.toBeNull();
      expect(projection!.goalWeight).toBe(170);
    });

    it('should return null on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const projection = await getGoalProjection();
      expect(projection).toBeNull();
    });
  });

  describe('saveGoalProjection', () => {
    it('should save and retrieve projection', async () => {
      const projection = createMockGoalProjection();
      await saveGoalProjection(projection);

      const stored = await AsyncStorage.getItem('@progress_goal_projection');
      expect(JSON.parse(stored!).goalWeight).toBe(170);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveGoalProjection(createMockGoalProjection())).rejects.toThrow('Storage error');
    });
  });

  // ============ Milestones ============

  describe('getMilestones', () => {
    it('should return empty array when no milestones saved', async () => {
      const milestones = await getMilestones();
      expect(milestones).toEqual([]);
    });

    it('should return saved milestones', async () => {
      const mockMilestones = [createMockMilestone()];
      await AsyncStorage.setItem('@progress_milestones', JSON.stringify(mockMilestones));

      const milestones = await getMilestones();
      expect(milestones).toHaveLength(1);
      expect(milestones[0].label).toBe('5% Lost');
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const milestones = await getMilestones();
      expect(milestones).toEqual([]);
    });
  });

  describe('saveMilestones', () => {
    it('should save and retrieve milestones', async () => {
      const milestones = [createMockMilestone(), createMockMilestone({ id: 'milestone-2', label: '10% Lost' })];
      await saveMilestones(milestones);

      const stored = await AsyncStorage.getItem('@progress_milestones');
      expect(JSON.parse(stored!)).toHaveLength(2);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveMilestones([createMockMilestone()])).rejects.toThrow('Storage error');
    });
  });

  describe('updateMilestone', () => {
    it('should update an existing milestone', async () => {
      const milestones = [createMockMilestone({ id: 'ms-1', achieved: false })];
      await AsyncStorage.setItem('@progress_milestones', JSON.stringify(milestones));

      const result = await updateMilestone('ms-1', { achieved: true, achievedDate: '2025-02-01' });
      expect(result[0].achieved).toBe(true);
      expect(result[0].achievedDate).toBe('2025-02-01');
    });

    it('should not modify milestones if ID not found', async () => {
      const milestones = [createMockMilestone({ id: 'ms-1' })];
      await AsyncStorage.setItem('@progress_milestones', JSON.stringify(milestones));

      const result = await updateMilestone('nonexistent', { achieved: true });
      expect(result).toHaveLength(1);
      expect(result[0].achieved).toBe(false);
    });

    it('should persist the update', async () => {
      const milestones = [createMockMilestone({ id: 'ms-1', currentProgress: 50 })];
      await AsyncStorage.setItem('@progress_milestones', JSON.stringify(milestones));

      await updateMilestone('ms-1', { currentProgress: 75 });

      const stored = await AsyncStorage.getItem('@progress_milestones');
      expect(JSON.parse(stored!)[0].currentProgress).toBe(75);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(updateMilestone('ms-1', { achieved: true })).rejects.toThrow('Storage error');
    });
  });

  // ============ Weekly Summaries ============

  describe('getWeeklySummaries', () => {
    it('should return empty array when no summaries saved', async () => {
      const summaries = await getWeeklySummaries();
      expect(summaries).toEqual([]);
    });

    it('should return saved summaries', async () => {
      const mockSummaries = [createMockWeeklySummary()];
      await AsyncStorage.setItem('@progress_weekly_summaries', JSON.stringify(mockSummaries));

      const summaries = await getWeeklySummaries();
      expect(summaries).toHaveLength(1);
    });

    it('should limit to count when specified', async () => {
      const mockSummaries = [
        createMockWeeklySummary({ weekStart: '2025-01-13' }),
        createMockWeeklySummary({ weekStart: '2025-01-06' }),
        createMockWeeklySummary({ weekStart: '2024-12-30' }),
      ];
      await AsyncStorage.setItem('@progress_weekly_summaries', JSON.stringify(mockSummaries));

      const summaries = await getWeeklySummaries(2);
      expect(summaries).toHaveLength(2);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const summaries = await getWeeklySummaries();
      expect(summaries).toEqual([]);
    });
  });

  describe('saveWeeklySummary', () => {
    it('should save a new weekly summary', async () => {
      const summary = createMockWeeklySummary();
      await saveWeeklySummary(summary);

      const stored = await AsyncStorage.getItem('@progress_weekly_summaries');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
    });

    it('should update existing summary for same weekStart', async () => {
      await saveWeeklySummary(createMockWeeklySummary({ weekStart: '2025-01-13', rating: 'behind' }));
      await saveWeeklySummary(createMockWeeklySummary({ weekStart: '2025-01-13', rating: 'on_track' }));

      const stored = await AsyncStorage.getItem('@progress_weekly_summaries');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].rating).toBe('on_track');
    });

    it('should limit summaries to 52 weeks', async () => {
      const summaries = Array.from({ length: 55 }, (_, i) =>
        createMockWeeklySummary({ weekStart: `2025-01-${String(i + 1).padStart(2, '0')}` })
      );
      await AsyncStorage.setItem('@progress_weekly_summaries', JSON.stringify(summaries));

      await saveWeeklySummary(createMockWeeklySummary({ weekStart: '2026-01-01' }));

      const stored = await AsyncStorage.getItem('@progress_weekly_summaries');
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBeLessThanOrEqual(52);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveWeeklySummary(createMockWeeklySummary())).rejects.toThrow('Storage error');
    });
  });

  // ============ Progress Snapshot ============

  describe('getProgressSnapshot', () => {
    it('should return null when no snapshot saved', async () => {
      const snapshot = await getProgressSnapshot();
      expect(snapshot).toBeNull();
    });

    it('should return saved snapshot', async () => {
      const mockSnapshot = createMockSnapshot();
      await AsyncStorage.setItem('@progress_snapshot', JSON.stringify(mockSnapshot));

      const snapshot = await getProgressSnapshot();
      expect(snapshot).not.toBeNull();
      expect(snapshot!.currentWeight).toBe(180);
    });

    it('should return null on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const snapshot = await getProgressSnapshot();
      expect(snapshot).toBeNull();
    });
  });

  describe('saveProgressSnapshot', () => {
    it('should save and retrieve snapshot', async () => {
      const snapshot = createMockSnapshot();
      await saveProgressSnapshot(snapshot);

      const stored = await AsyncStorage.getItem('@progress_snapshot');
      expect(JSON.parse(stored!).currentWeight).toBe(180);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveProgressSnapshot(createMockSnapshot())).rejects.toThrow('Storage error');
    });
  });

  // ============ Last Calculated ============

  describe('getLastCalculated', () => {
    it('should return 0 when not set', async () => {
      const last = await getLastCalculated();
      expect(last).toBe(0);
    });

    it('should return saved timestamp', async () => {
      const ts = 1705000000000;
      await AsyncStorage.setItem('@progress_last_calculated', ts.toString());

      const last = await getLastCalculated();
      expect(last).toBe(ts);
    });

    it('should return 0 on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const last = await getLastCalculated();
      expect(last).toBe(0);
    });
  });

  describe('saveLastCalculated', () => {
    it('should save timestamp as string', async () => {
      const ts = 1705000000000;
      await saveLastCalculated(ts);

      const stored = await AsyncStorage.getItem('@progress_last_calculated');
      expect(stored).toBe(ts.toString());
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveLastCalculated(Date.now())).rejects.toThrow('Storage error');
    });
  });

  // ============ Clear All ============

  describe('clearAllProgressData', () => {
    it('should remove all progress storage keys', async () => {
      await addWeightDataPoint(createMockWeightPoint({ date: '2025-01-15' }));
      await savePredictions([createMockPrediction()]);
      await saveGoalProjection(createMockGoalProjection());
      await saveMilestones([createMockMilestone()]);
      await saveWeeklySummary(createMockWeeklySummary());
      await saveProgressSnapshot(createMockSnapshot());
      await saveLastCalculated(Date.now());

      await clearAllProgressData();

      const history = await getWeightHistory();
      const predictions = await getPredictions();
      const projection = await getGoalProjection();
      const milestones = await getMilestones();
      const summaries = await getWeeklySummaries();
      const snapshot = await getProgressSnapshot();
      const lastCalc = await getLastCalculated();

      expect(history).toEqual([]);
      expect(predictions).toEqual([]);
      expect(projection).toBeNull();
      expect(milestones).toEqual([]);
      expect(summaries).toEqual([]);
      expect(snapshot).toBeNull();
      expect(lastCalc).toBe(0);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(clearAllProgressData()).rejects.toThrow('Storage error');
    });
  });
});
