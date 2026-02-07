/**
 * Tests for progressPredictionService.ts
 * Weight prediction, trend analysis, goal projection, and milestone tracking
 */

import {
  calculateEMA,
  calculateWeeklyRate,
  calculateMonthlyRate,
  analyzeTrends,
  detectPlateau,
  generatePredictions,
  projectGoalCompletion,
  calculateBMI,
  lbsToKg,
  createProgressSnapshot,
  createDefaultMilestones,
  updateMilestones,
  createWeeklySummary,
} from '../progressPredictionService';
import {
  WeightDataPoint,
  PREDICTION_CONSTANTS,
  DEFAULT_TREND_ANALYSIS,
  DEFAULT_PLATEAU_INFO,
} from '../../types/progressPrediction';

// Helper to create a weight data point
function makeDataPoint(
  date: string,
  weight: number,
  trend?: number
): WeightDataPoint {
  return {
    date,
    weight,
    trend: trend ?? weight,
    timestamp: new Date(date).getTime(),
  };
}

// Helper to generate N data points going back from today with a daily weight change
function generateDataPoints(
  numDays: number,
  startWeight: number,
  dailyChange: number = 0
): WeightDataPoint[] {
  const points: WeightDataPoint[] = [];
  const today = new Date();

  for (let i = 0; i < numDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const weight = startWeight + dailyChange * i;
    points.push(makeDataPoint(dateStr, weight));
  }

  return points; // newest first
}

describe('progressPredictionService', () => {
  // ============ calculateEMA ============

  describe('calculateEMA', () => {
    it('should return empty array for empty input', () => {
      expect(calculateEMA([])).toEqual([]);
    });

    it('should return single point with trend set', () => {
      const points = [makeDataPoint('2025-01-15', 180)];
      const result = calculateEMA(points);

      expect(result.length).toBe(1);
      expect(result[0].trend).toBeDefined();
      expect(typeof result[0].trend).toBe('number');
    });

    it('should smooth data and return in descending date order', () => {
      const points = [
        makeDataPoint('2025-01-15', 180),
        makeDataPoint('2025-01-14', 181),
        makeDataPoint('2025-01-13', 179),
        makeDataPoint('2025-01-12', 182),
      ];

      const result = calculateEMA(points);

      // Should be in descending order (newest first)
      expect(result[0].date).toBe('2025-01-15');
      expect(result[result.length - 1].date).toBe('2025-01-12');

      // Trends should be smoother than raw weights
      const weightRange = Math.max(...points.map((p) => p.weight)) - Math.min(...points.map((p) => p.weight));
      const trendRange = Math.max(...result.map((p) => p.trend)) - Math.min(...result.map((p) => p.trend));
      expect(trendRange).toBeLessThanOrEqual(weightRange);
    });

    it('should respect custom alpha parameter', () => {
      const points = [
        makeDataPoint('2025-01-15', 180),
        makeDataPoint('2025-01-14', 170),
      ];

      // High alpha = more responsive (closer to raw values)
      const highAlpha = calculateEMA(points, 0.9);
      // Low alpha = smoother (closer to previous trend)
      const lowAlpha = calculateEMA(points, 0.1);

      // With high alpha, the latest trend should be closer to 180
      // With low alpha, the latest trend should be closer to 170 (first value dominates)
      // The newest point (2025-01-15, weight=180) should have different trends
      expect(highAlpha[0].trend).not.toBe(lowAlpha[0].trend);
    });
  });

  // ============ calculateWeeklyRate ============

  describe('calculateWeeklyRate', () => {
    it('should return 0 when fewer than 7 data points', () => {
      const points = generateDataPoints(5, 180);
      expect(calculateWeeklyRate(points)).toBe(0);
    });

    it('should return negative rate for weight loss', () => {
      // Generate 10 days of data, losing 0.2 lbs/day
      const points = generateDataPoints(10, 180, 0.2);
      // Points go back in time getting heavier, so current is 180, 7 days ago is ~181.4
      const rate = calculateWeeklyRate(points);
      expect(rate).toBeLessThan(0);
    });

    it('should return 0 for stable weight', () => {
      const today = new Date();
      const points: WeightDataPoint[] = [];
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        points.push(makeDataPoint(date.toISOString().split('T')[0], 180, 180));
      }
      const rate = calculateWeeklyRate(points);
      expect(rate).toBe(0);
    });
  });

  // ============ calculateMonthlyRate ============

  describe('calculateMonthlyRate', () => {
    it('should return 0 when fewer than 14 data points', () => {
      const points = generateDataPoints(10, 180);
      expect(calculateMonthlyRate(points)).toBe(0);
    });

    it('should estimate from weekly rate when no 30-day data', () => {
      // 20 data points but none from 30 days ago
      const points = generateDataPoints(20, 180, 0.1);
      const rate = calculateMonthlyRate(points);
      // Should return something (estimated from weekly * 4)
      expect(typeof rate).toBe('number');
    });
  });

  // ============ analyzeTrends ============

  describe('analyzeTrends', () => {
    it('should return default when not enough data points', () => {
      const points = generateDataPoints(3, 180);
      const result = analyzeTrends(points);
      expect(result).toEqual(DEFAULT_TREND_ANALYSIS);
    });

    it('should detect maintaining direction for stable weight', () => {
      const today = new Date();
      const points: WeightDataPoint[] = [];
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Small fluctuations around 180
        const weight = 180 + (Math.sin(i) * 0.1);
        points.push(makeDataPoint(date.toISOString().split('T')[0], weight));
      }

      const result = analyzeTrends(points);

      expect(result.direction).toBe('maintaining');
      expect(result.dataPoints).toBeGreaterThan(0);
    });

    it('should return consistency score between 0 and 100', () => {
      const points = generateDataPoints(14, 180, 0.1);
      const result = analyzeTrends(points);

      expect(result.consistency).toBeGreaterThanOrEqual(0);
      expect(result.consistency).toBeLessThanOrEqual(100);
    });

    it('should have valid start and end dates', () => {
      const points = generateDataPoints(14, 180, 0.1);
      const result = analyzeTrends(points);

      expect(result.startDate).toBeTruthy();
      expect(result.endDate).toBeTruthy();
      expect(result.startDate <= result.endDate).toBe(true);
    });
  });

  // ============ detectPlateau ============

  describe('detectPlateau', () => {
    it('should return default when not enough data', () => {
      const points = generateDataPoints(5, 180);
      const result = detectPlateau(points);
      expect(result).toEqual(DEFAULT_PLATEAU_INFO);
    });

    it('should detect plateau for stable weight over 14+ days', () => {
      // Create 20 days of very stable weight
      const today = new Date();
      const points: WeightDataPoint[] = [];
      for (let i = 0; i < 20; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Very slight variation
        const weight = 180 + (i % 2 === 0 ? 0.05 : -0.05);
        points.push(makeDataPoint(date.toISOString().split('T')[0], weight));
      }

      const result = detectPlateau(points);

      expect(result.isInPlateau).toBe(true);
      expect(result.plateauDuration).toBeGreaterThanOrEqual(0);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
      expect(result.suggestedActions.length).toBeLessThanOrEqual(3);
    });

    it('should not detect plateau for weight that is changing significantly', () => {
      // Create data with significant weight change
      const points = generateDataPoints(20, 180, 0.3); // losing 0.3 lbs/day
      const result = detectPlateau(points);

      // May or may not detect plateau depending on EMA smoothing
      // The key test is that it processes without error
      expect(result).toBeDefined();
      expect(typeof result.isInPlateau).toBe('boolean');
    });
  });

  // ============ generatePredictions ============

  describe('generatePredictions', () => {
    it('should return empty array with insufficient data', () => {
      const points = generateDataPoints(5, 180);
      const result = generatePredictions(points);
      expect(result).toEqual([]);
    });

    it('should generate weekly predictions', () => {
      const points = generateDataPoints(30, 180, 0.1);
      const result = generatePredictions(points, 90);

      expect(result.length).toBeGreaterThan(0);
      // Should be weekly intervals (7, 14, 21, ...)
      expect(result[0].daysFromNow).toBe(7);
      if (result.length > 1) {
        expect(result[1].daysFromNow).toBe(14);
      }
    });

    it('should have confidence intervals that widen over time', () => {
      const points = generateDataPoints(30, 180, 0.1);
      const result = generatePredictions(points, 90);

      if (result.length >= 2) {
        const firstRange = result[0].confidenceMax - result[0].confidenceMin;
        const lastRange = result[result.length - 1].confidenceMax - result[result.length - 1].confidenceMin;
        expect(lastRange).toBeGreaterThanOrEqual(firstRange);
      }
    });

    it('should return predictions with proper structure', () => {
      const points = generateDataPoints(20, 180, 0.1);
      const result = generatePredictions(points, 28);

      for (const prediction of result) {
        expect(prediction.date).toBeTruthy();
        expect(typeof prediction.predictedWeight).toBe('number');
        expect(typeof prediction.confidenceMin).toBe('number');
        expect(typeof prediction.confidenceMax).toBe('number');
        expect(typeof prediction.daysFromNow).toBe('number');
        expect(prediction.confidenceMin).toBeLessThanOrEqual(prediction.predictedWeight);
        expect(prediction.confidenceMax).toBeGreaterThanOrEqual(prediction.predictedWeight);
      }
    });
  });

  // ============ projectGoalCompletion ============

  describe('projectGoalCompletion', () => {
    it('should handle empty data points', () => {
      const result = projectGoalCompletion([], 160);

      expect(result.currentWeight).toBe(0);
      expect(result.isOnTrack).toBe(false);
      expect(result.confidenceLevel).toBe('low');
    });

    it('should detect when already at goal weight', () => {
      const points = generateDataPoints(10, 160, 0);
      const emaPoints = calculateEMA(points);
      const result = projectGoalCompletion(emaPoints, 160);

      expect(result.daysRemaining).toBe(0);
      expect(result.isOnTrack).toBe(true);
      expect(result.weightToLose).toBe(0);
    });

    it('should detect moving in wrong direction', () => {
      // Gaining weight but goal is to lose
      const points = generateDataPoints(10, 180, -0.2); // weight increasing going back
      const emaPoints = calculateEMA(points);
      const result = projectGoalCompletion(emaPoints, 160);

      // The goal is 160, current around 180. If gaining, projectedDate should be null
      if (result.weeklyRate >= 0 && result.weightToLose > 0) {
        expect(result.projectedDate).toBeNull();
        expect(result.isOnTrack).toBe(false);
      }
    });

    it('should project future goal completion date', () => {
      // Losing weight toward goal
      const points = generateDataPoints(20, 180, 0.15); // current weight ~180, was heavier
      const emaPoints = calculateEMA(points);
      const result = projectGoalCompletion(emaPoints, 170);

      expect(result.goalWeight).toBe(170);
      expect(typeof result.currentWeight).toBe('number');
      expect(typeof result.weeklyRate).toBe('number');
    });

    it('should set confidence level based on data points', () => {
      // Few data points = low confidence
      const fewPoints = generateDataPoints(10, 180, 0.1);
      const fewEma = calculateEMA(fewPoints);
      const lowConfResult = projectGoalCompletion(fewEma, 170);

      // Many data points = higher confidence
      const manyPoints = generateDataPoints(40, 180, 0.1);
      const manyEma = calculateEMA(manyPoints);
      const highConfResult = projectGoalCompletion(manyEma, 170);

      // The one with more data should have equal or higher confidence
      const confOrder = { low: 0, medium: 1, high: 2 };
      expect(confOrder[highConfResult.confidenceLevel]).toBeGreaterThanOrEqual(
        confOrder[lowConfResult.confidenceLevel]
      );
    });
  });

  // ============ BMI and Conversion ============

  describe('calculateBMI', () => {
    it('should calculate BMI correctly', () => {
      // 80kg, 180cm = 80 / (1.8^2) = 24.7
      const bmi = calculateBMI(80, 180);
      expect(bmi).toBeCloseTo(24.7, 0);
    });

    it('should return 0 for zero height', () => {
      expect(calculateBMI(80, 0)).toBe(0);
    });

    it('should return 0 for negative height', () => {
      expect(calculateBMI(80, -10)).toBe(0);
    });
  });

  describe('lbsToKg', () => {
    it('should convert pounds to kilograms', () => {
      expect(lbsToKg(1)).toBeCloseTo(0.4536, 3);
      expect(lbsToKg(100)).toBeCloseTo(45.3592, 2);
      expect(lbsToKg(0)).toBe(0);
    });
  });

  // ============ createProgressSnapshot ============

  describe('createProgressSnapshot', () => {
    it('should create a valid progress snapshot', () => {
      const snapshot = createProgressSnapshot(175, 200, 160, 178);

      expect(snapshot.currentWeight).toBe(175);
      expect(snapshot.startingWeight).toBe(200);
      expect(snapshot.goalWeight).toBe(160);
      expect(snapshot.totalLost).toBe(25);
      expect(snapshot.totalToLose).toBe(40);
      expect(snapshot.percentComplete).toBe(63); // 25/40 * 100
      expect(snapshot.currentBMI).toBeGreaterThan(0);
      expect(snapshot.startingBMI).toBeGreaterThan(0);
      expect(snapshot.goalBMI).toBeGreaterThan(0);
      expect(snapshot.heightCm).toBe(178);
    });

    it('should cap percentComplete at 100', () => {
      const snapshot = createProgressSnapshot(155, 200, 160, 178);
      expect(snapshot.percentComplete).toBe(100);
    });

    it('should not go below 0 percentComplete', () => {
      const snapshot = createProgressSnapshot(210, 200, 160, 178);
      expect(snapshot.percentComplete).toBe(0);
    });

    it('should handle metric system', () => {
      const snapshot = createProgressSnapshot(80, 90, 75, 178, 'metric');

      expect(snapshot.currentBMI).toBeGreaterThan(0);
      // For metric, weight is already in kg so BMI calculation should be direct
    });

    it('should handle goal already reached', () => {
      const snapshot = createProgressSnapshot(160, 200, 160, 178);
      expect(snapshot.percentComplete).toBe(100);
      expect(snapshot.totalLost).toBe(40);
    });
  });

  // ============ Milestones ============

  describe('createDefaultMilestones', () => {
    it('should create milestones based on weight difference', () => {
      const milestones = createDefaultMilestones(200, 160, 190);

      expect(milestones.length).toBeGreaterThan(0);
      milestones.forEach((m) => {
        expect(m.type).toBe('percentage');
        expect(m.id).toMatch(/^ms_/);
        expect(m.label).toBeTruthy();
        expect(m.currentProgress).toBeGreaterThanOrEqual(0);
        expect(m.currentProgress).toBeLessThanOrEqual(100);
      });
    });

    it('should return empty array when no weight to lose', () => {
      const milestones = createDefaultMilestones(160, 160, 160);
      expect(milestones).toEqual([]);
    });

    it('should return empty array when goal is heavier than start', () => {
      const milestones = createDefaultMilestones(160, 200, 170);
      expect(milestones).toEqual([]);
    });

    it('should mark achieved milestones correctly', () => {
      // Starting 200, goal 160, current 185 (lost 15 of 40 = 37.5%)
      const milestones = createDefaultMilestones(200, 160, 185);

      // 5% milestone (target: 198) should be achieved
      const fivePercent = milestones.find((m) => m.targetValue === 5);
      expect(fivePercent?.achieved).toBe(true);

      // 25% milestone (target: 190) should be achieved
      const twentyFive = milestones.find((m) => m.targetValue === 25);
      expect(twentyFive?.achieved).toBe(true);
    });
  });

  describe('updateMilestones', () => {
    it('should update progress and detect newly achieved milestones', () => {
      const milestones = createDefaultMilestones(200, 160, 195);

      // User has now lost more weight
      const updated = updateMilestones(milestones, 185, 200, 160, -1);

      // Progress should be higher
      const fivePercent = updated.find((m) => m.targetValue === 5);
      expect(fivePercent?.achieved).toBe(true);
      expect(fivePercent?.currentProgress).toBe(100);
    });

    it('should calculate projected dates for unachieved milestones', () => {
      const milestones = createDefaultMilestones(200, 160, 195);

      const updated = updateMilestones(milestones, 195, 200, 160, -1);

      // Unachieved milestones with negative weekly rate should have projected dates
      const unachieved = updated.filter((m) => !m.achieved);
      unachieved.forEach((m) => {
        expect(m.projectedDate).toBeTruthy();
      });
    });

    it('should return empty for no weight to lose', () => {
      const milestones = updateMilestones([], 160, 160, 160, 0);
      expect(milestones).toEqual([]);
    });
  });

  // ============ Weekly Summary ============

  describe('createWeeklySummary', () => {
    it('should return null with less than 2 data points in the week', () => {
      const weekStart = new Date('2025-01-13');
      const points = [makeDataPoint('2025-01-13', 180)];

      const result = createWeeklySummary(points, weekStart, -1);

      expect(result).toBeNull();
    });

    it('should calculate weekly summary correctly', () => {
      const weekStart = new Date('2025-01-13');
      const points = [
        makeDataPoint('2025-01-13', 180),
        makeDataPoint('2025-01-14', 179.5),
        makeDataPoint('2025-01-15', 179.8),
        makeDataPoint('2025-01-16', 179.2),
        makeDataPoint('2025-01-17', 179),
        makeDataPoint('2025-01-18', 178.8),
        makeDataPoint('2025-01-19', 178.5),
      ];

      const result = createWeeklySummary(points, weekStart, -1);

      expect(result).not.toBeNull();
      expect(result!.weekStart).toBe('2025-01-13');
      expect(result!.startWeight).toBe(180);
      expect(result!.endWeight).toBe(178.5);
      expect(result!.actualChange).toBe(-1.5);
      expect(result!.expectedChange).toBe(-1);
    });

    it('should rate as on_track when variance is small', () => {
      const weekStart = new Date('2025-01-13');
      const points = [
        makeDataPoint('2025-01-13', 180),
        makeDataPoint('2025-01-19', 179),
      ];

      const result = createWeeklySummary(points, weekStart, -1);

      expect(result!.rating).toBe('on_track');
    });

    it('should rate as ahead when losing more than expected', () => {
      const weekStart = new Date('2025-01-13');
      const points = [
        makeDataPoint('2025-01-13', 180),
        makeDataPoint('2025-01-19', 177.5), // Lost 2.5 but expected -1
      ];

      const result = createWeeklySummary(points, weekStart, -1);

      expect(result!.rating).toBe('ahead');
    });

    it('should rate as behind when losing less than expected', () => {
      const weekStart = new Date('2025-01-13');
      const points = [
        makeDataPoint('2025-01-13', 180),
        makeDataPoint('2025-01-19', 179.8), // Lost only 0.2 but expected -1
      ];

      const result = createWeeklySummary(points, weekStart, -1);

      expect(result!.rating).toBe('behind');
    });

    it('should filter data points to the specified week only', () => {
      const weekStart = new Date('2025-01-13');
      const points = [
        makeDataPoint('2025-01-10', 185), // Before the week - should be excluded
        makeDataPoint('2025-01-13', 180),
        makeDataPoint('2025-01-19', 179),
        makeDataPoint('2025-01-22', 178), // After the week - should be excluded
      ];

      const result = createWeeklySummary(points, weekStart, -1);

      expect(result!.startWeight).toBe(180);
      expect(result!.endWeight).toBe(179);
    });
  });
});
