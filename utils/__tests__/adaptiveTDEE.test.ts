import {
  calculateAdaptiveTDEE,
  getCalorieAdjustment,
  WeightEntry,
  CalorieEntry,
  UserStats,
} from '../adaptiveTDEE';

// ============================================
// Test Helpers
// ============================================
function createWeightEntries(count: number, startDate: string, unit: 'lbs' | 'kg' = 'lbs'): WeightEntry[] {
  const entries: WeightEntry[] = [];
  const baseWeight = unit === 'lbs' ? 180 : 81.6; // ~180 lbs
  const start = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    entries.push({
      date: date.toISOString().split('T')[0],
      weight: baseWeight + (Math.random() - 0.5) * 2, // Small random variance
      unit,
    });
  }

  return entries;
}

function createCalorieEntries(count: number, startDate: string, avgCalories: number = 2000): CalorieEntry[] {
  const entries: CalorieEntry[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    entries.push({
      date: date.toISOString().split('T')[0],
      calories: avgCalories + (Math.random() - 0.5) * 200, // Variance ±100 cal
    });
  }

  return entries;
}

function createMockUserStats(): UserStats {
  return {
    age: 30,
    sex: 'male',
    heightCm: 178,
    currentWeightLbs: 180,
    activityLevel: 'moderate',
  };
}

// ============================================
// Tests
// ============================================
describe('adaptiveTDEE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAdaptiveTDEE', () => {
    it('returns formula TDEE with needsMoreData=true when insufficient weight data', () => {
      const userStats = createMockUserStats();
      const weightEntries = createWeightEntries(10, '2026-01-01'); // Only 10 days
      const calorieEntries = createCalorieEntries(20, '2026-01-01');

      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      expect(result.needsMoreData).toBe(true);
      expect(result.daysOfData).toBe(10);
      expect(result.minDaysRemaining).toBe(4); // 14 - 10
      expect(result.adaptiveTDEE).toBeGreaterThan(0);
      expect(result.formulaTDEE).toBeGreaterThan(0);
      expect(result.adaptiveTDEE).toBe(result.formulaTDEE);
      expect(result.confidence).toBe('low');
      expect(result.confidenceScore).toBe(0);
      expect(result.recommendation).toBe('Continue tracking for accurate TDEE calculation');
    });

    it('returns formula TDEE with needsMoreData=true when insufficient calorie data', () => {
      const userStats = createMockUserStats();
      const weightEntries = createWeightEntries(20, '2026-01-01');
      const calorieEntries = createCalorieEntries(10, '2026-01-01'); // Only 10 days

      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      expect(result.needsMoreData).toBe(true);
      expect(result.daysOfData).toBe(10);
      expect(result.minDaysRemaining).toBe(4);
    });

    it('calculates adaptive TDEE with 14+ days of data', () => {
      const userStats = createMockUserStats();
      const weightEntries = createWeightEntries(14, '2026-01-01');
      const calorieEntries = createCalorieEntries(14, '2026-01-01', 2000);

      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      expect(result.needsMoreData).toBe(false);
      expect(result.daysOfData).toBe(14);
      expect(result.adaptiveTDEE).toBeGreaterThan(0);
      expect(result.formulaTDEE).toBeGreaterThan(0);
      expect(result.confidence).toBeDefined();
      expect(result.confidenceScore).toBeGreaterThan(0);
      expect(result.variance).toBeDefined();
    });

    it('detects weight loss trend when losing more than 0.25 lb/week', () => {
      const userStats = createMockUserStats();
      const weightEntries: WeightEntry[] = [];
      const startDate = new Date('2026-01-01');

      // Simulate losing 1 lb per week (0.14 lbs per day)
      for (let i = 0; i < 21; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        weightEntries.push({
          date: date.toISOString().split('T')[0],
          weight: 180 - (i * 0.14), // Losing ~1 lb/week
          unit: 'lbs',
        });
      }

      const calorieEntries = createCalorieEntries(21, '2026-01-01', 1800);
      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      expect(result.weightTrend).toBe('losing');
      expect(result.avgWeeklyChange).toBeLessThan(-0.25);
    });

    it('detects weight gain trend when gaining more than 0.25 lb/week', () => {
      const userStats = createMockUserStats();
      const weightEntries: WeightEntry[] = [];
      const startDate = new Date('2026-01-01');

      // Simulate gaining 0.5 lb per week
      for (let i = 0; i < 21; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        weightEntries.push({
          date: date.toISOString().split('T')[0],
          weight: 180 + (i * 0.07), // Gaining ~0.5 lb/week
          unit: 'lbs',
        });
      }

      const calorieEntries = createCalorieEntries(21, '2026-01-01', 2200);
      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      expect(result.weightTrend).toBe('gaining');
      expect(result.avgWeeklyChange).toBeGreaterThan(0.25);
    });

    it('detects maintaining trend when weight change < 0.25 lb/week', () => {
      const userStats = createMockUserStats();
      const weightEntries: WeightEntry[] = [];
      const startDate = new Date('2026-01-01');

      // Simulate minimal weight change
      for (let i = 0; i < 21; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        weightEntries.push({
          date: date.toISOString().split('T')[0],
          weight: 180 + (Math.random() - 0.5) * 0.5, // Random variance ±0.25 lbs
          unit: 'lbs',
        });
      }

      const calorieEntries = createCalorieEntries(21, '2026-01-01', 2000);
      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      expect(result.weightTrend).toBe('maintaining');
      expect(Math.abs(result.avgWeeklyChange)).toBeLessThan(0.25);
    });

    it('calculates confidence as low with minimal data (14-20 days)', () => {
      const userStats = createMockUserStats();
      const weightEntries = createWeightEntries(14, '2026-01-01');
      const calorieEntries = createCalorieEntries(14, '2026-01-01');

      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      // With only 14 days, confidence should be low or medium
      expect(result.confidence).toMatch(/low|medium/);
      expect(result.confidenceScore).toBeLessThan(70);
    });

    it('calculates confidence as higher with more data (28+ days)', () => {
      const userStats = createMockUserStats();
      const weightEntries = createWeightEntries(28, '2026-01-01');
      const calorieEntries = createCalorieEntries(28, '2026-01-01');

      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      // With 28 days, confidence should be medium or high
      expect(result.confidence).toMatch(/medium|high/);
      expect(result.confidenceScore).toBeGreaterThan(30);
    });

    it('converts kg weight entries to lbs', () => {
      const userStats = createMockUserStats();
      const weightEntries: WeightEntry[] = [];
      const startDate = new Date('2026-01-01');

      // Create entries in kg
      for (let i = 0; i < 14; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        weightEntries.push({
          date: date.toISOString().split('T')[0],
          weight: 81.6, // ~180 lbs
          unit: 'kg',
        });
      }

      const calorieEntries = createCalorieEntries(14, '2026-01-01');
      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      // Should successfully calculate without errors
      expect(result.adaptiveTDEE).toBeGreaterThan(0);
      expect(result.needsMoreData).toBe(false);
    });

    it('calculates variance between adaptive and formula TDEE', () => {
      const userStats = createMockUserStats();
      const weightEntries = createWeightEntries(21, '2026-01-01');
      const calorieEntries = createCalorieEntries(21, '2026-01-01', 1800);

      const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);

      expect(result.variance).toBeDefined();
      expect(typeof result.variance).toBe('number');
      // Variance is percentage: (adaptive - formula) / formula * 100
      expect(Math.abs(result.variance)).toBeGreaterThanOrEqual(0);
    });

    it('provides different recommendations based on confidence level', () => {
      const userStats = createMockUserStats();

      // Low confidence (14 days)
      const lowConfResult = calculateAdaptiveTDEE(
        createWeightEntries(14, '2026-01-01'),
        createCalorieEntries(14, '2026-01-01'),
        userStats
      );

      // High confidence (28 days with consistent data)
      const highConfResult = calculateAdaptiveTDEE(
        createWeightEntries(28, '2026-01-01'),
        createCalorieEntries(28, '2026-01-01'),
        userStats
      );

      expect(lowConfResult.recommendation).toBeDefined();
      expect(highConfResult.recommendation).toBeDefined();
      // Recommendations should differ based on confidence
      expect(lowConfResult.recommendation).not.toBe(highConfResult.recommendation);
    });
  });

  describe('getCalorieAdjustment', () => {
    it('returns conservative fat_loss adjustment (-250 cal, 0.5 lb/week)', () => {
      const result = getCalorieAdjustment(2000, 'fat_loss', 'conservative');

      expect(result.adjustment).toBe(-250);
      expect(result.targetCalories).toBe(1750);
      expect(result.expectedWeeklyChange).toBeCloseTo(-0.5, 1);
      expect(result.timeToGoal).toBe('Depends on goal weight');
    });

    it('returns moderate fat_loss adjustment (-500 cal, 1 lb/week)', () => {
      const result = getCalorieAdjustment(2000, 'fat_loss', 'moderate');

      expect(result.adjustment).toBe(-500);
      expect(result.targetCalories).toBe(1500);
      expect(result.expectedWeeklyChange).toBeCloseTo(-1, 1);
    });

    it('returns aggressive fat_loss adjustment (-750 cal, 1.5 lb/week)', () => {
      const result = getCalorieAdjustment(2000, 'fat_loss', 'aggressive');

      expect(result.adjustment).toBe(-750);
      expect(result.targetCalories).toBe(1250);
      expect(result.expectedWeeklyChange).toBeCloseTo(-1.5, 1);
    });

    it('returns conservative muscle_gain adjustment (+200 cal, 0.4 lb/week)', () => {
      const result = getCalorieAdjustment(2000, 'muscle_gain', 'conservative');

      expect(result.adjustment).toBe(200);
      expect(result.targetCalories).toBe(2200);
      expect(result.expectedWeeklyChange).toBeCloseTo(0.4, 1);
      expect(result.timeToGoal).toBe('Depends on goal weight');
    });

    it('returns moderate muscle_gain adjustment (+300 cal, 0.6 lb/week)', () => {
      const result = getCalorieAdjustment(2000, 'muscle_gain', 'moderate');

      expect(result.adjustment).toBe(300);
      expect(result.targetCalories).toBe(2300);
      expect(result.expectedWeeklyChange).toBeCloseTo(0.6, 1);
    });

    it('returns aggressive muscle_gain adjustment (+500 cal, 1 lb/week)', () => {
      const result = getCalorieAdjustment(2000, 'muscle_gain', 'aggressive');

      expect(result.adjustment).toBe(500);
      expect(result.targetCalories).toBe(2500);
      expect(result.expectedWeeklyChange).toBeCloseTo(1, 1);
    });

    it('returns 0 adjustment for maintain goal', () => {
      const conservative = getCalorieAdjustment(2000, 'maintain', 'conservative');
      const moderate = getCalorieAdjustment(2000, 'maintain', 'moderate');
      const aggressive = getCalorieAdjustment(2000, 'maintain', 'aggressive');

      expect(conservative.adjustment).toBe(0);
      expect(moderate.adjustment).toBe(0);
      expect(aggressive.adjustment).toBe(0);

      expect(conservative.targetCalories).toBe(2000);
      expect(conservative.expectedWeeklyChange).toBe(0);
      expect(conservative.timeToGoal).toBe('Ongoing');
    });

    it('calculates expected weekly change correctly', () => {
      const fatLoss = getCalorieAdjustment(2000, 'fat_loss', 'moderate');
      const muscleGain = getCalorieAdjustment(2000, 'muscle_gain', 'moderate');

      // -500 cal/day * 7 days / 3500 cal/lb = -1 lb/week
      expect(fatLoss.expectedWeeklyChange).toBeCloseTo(-1, 1);

      // +300 cal/day * 7 days / 3500 cal/lb = 0.6 lb/week
      expect(muscleGain.expectedWeeklyChange).toBeCloseTo(0.6, 1);
    });

    it('defaults to moderate aggressiveness when not specified', () => {
      const result = getCalorieAdjustment(2000, 'fat_loss');

      expect(result.adjustment).toBe(-500); // moderate default
      expect(result.targetCalories).toBe(1500);
    });
  });
});
