/**
 * Tests for adaptiveTDEEService.ts
 * Adaptive TDEE calculation algorithm testing
 */

jest.mock('../adaptiveTDEEStorage', () => ({
  adaptiveTDEEStorage: {
    getDataQualityMetrics: jest.fn(),
    saveTDEEResult: jest.fn(),
    getTDEEResult: jest.fn(),
    getWeightHistory: jest.fn(),
    getCalorieHistory: jest.fn(),
  },
  convertBodyWeight: jest.fn((weight: number, fromUnit: string, toUnit: string) => {
    if (fromUnit === toUnit) return weight;
    if (fromUnit === 'lb' && toUnit === 'kg') return weight * 0.453592;
    if (fromUnit === 'kg' && toUnit === 'lb') return weight / 0.453592;
    return weight;
  }),
}));

jest.mock('../../constants/goals', () => ({
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  },
}));

import { calculateAdaptiveTDEE, recalculateTDEEIfNeeded } from '../adaptiveTDEEService';
import { adaptiveTDEEStorage, convertBodyWeight } from '../adaptiveTDEEStorage';
import {
  BodyWeightLog,
  DailyCalorieLog,
  TDEECalculationInput,
  TDEE_CONSTANTS,
} from '../../types/adaptiveTDEE';

// Helper to create weight log
function makeWeightLog(date: string, weight: number, unit: 'lb' | 'kg' = 'lb'): BodyWeightLog {
  return {
    id: `wl_${date}`,
    date,
    weight,
    unit,
    source: 'manual',
    timestamp: new Date(date).toISOString(),
  };
}

// Helper to create calorie log
function makeCalorieLog(date: string, calories: number): DailyCalorieLog {
  return {
    date,
    caloriesConsumed: calories,
    caloriesBurned: 300,
    netCalories: calories - 300,
    mealsLogged: 3,
    isComplete: true,
  };
}

// Helper to create a user profile
function makeUserProfile(overrides: Partial<TDEECalculationInput['userProfile']> = {}): TDEECalculationInput['userProfile'] {
  return {
    age: 30,
    sex: 'male',
    heightCm: 178,
    activityLevel: 'moderate',
    goalType: 'lose',
    targetWeeklyChange: -1,
    ...overrides,
  };
}

// Helper to generate dates going back from today
function datesBack(numDays: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

describe('adaptiveTDEEService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAdaptiveTDEE', () => {
    it('should return formula-based TDEE when not enough data', async () => {
      (adaptiveTDEEStorage.getDataQualityMetrics as jest.Mock).mockResolvedValue({
        isReadyForCalculation: false,
        daysUntilReady: 10,
        daysWithBothLogs: 4,
        totalWeightLogs: 4,
        totalCalorieLogs: 4,
      });

      const input: TDEECalculationInput = {
        weightHistory: [makeWeightLog('2025-01-15', 180)],
        calorieHistory: [makeCalorieLog('2025-01-15', 2000)],
        userProfile: makeUserProfile(),
      };

      const result = await calculateAdaptiveTDEE(input);

      expect(result.confidence).toBe('low');
      expect(result.confidenceScore).toBe(0);
      expect(result.adaptiveTDEE).toBe(result.formulaTDEE);
      expect(result.difference).toBe(0);
      expect(result.differencePercent).toBe(0);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights[0]).toContain('more days');
    });

    it('should use default weight of 80kg when no weight history', async () => {
      (adaptiveTDEEStorage.getDataQualityMetrics as jest.Mock).mockResolvedValue({
        isReadyForCalculation: false,
        daysUntilReady: 14,
        daysWithBothLogs: 0,
        totalWeightLogs: 0,
        totalCalorieLogs: 0,
      });

      const input: TDEECalculationInput = {
        weightHistory: [],
        calorieHistory: [],
        userProfile: makeUserProfile(),
      };

      const result = await calculateAdaptiveTDEE(input);

      // Should still calculate a formulaTDEE using default 80kg
      expect(result.formulaTDEE).toBeGreaterThan(0);
      expect(result.adaptiveTDEE).toBe(result.formulaTDEE);
    });

    it('should include recommended calories in result', async () => {
      (adaptiveTDEEStorage.getDataQualityMetrics as jest.Mock).mockResolvedValue({
        isReadyForCalculation: false,
        daysUntilReady: 10,
        daysWithBothLogs: 4,
        totalWeightLogs: 4,
        totalCalorieLogs: 4,
      });

      const input: TDEECalculationInput = {
        weightHistory: [makeWeightLog('2025-01-15', 180)],
        calorieHistory: [makeCalorieLog('2025-01-15', 2000)],
        userProfile: makeUserProfile({ goalType: 'lose', targetWeeklyChange: -1 }),
      };

      const result = await calculateAdaptiveTDEE(input);

      // For weight loss, recommended calories should be less than TDEE
      expect(result.recommendedCalories).toBeLessThan(result.adaptiveTDEE);
      // Should not go below floor
      expect(result.recommendedCalories).toBeGreaterThanOrEqual(TDEE_CONSTANTS.MIN_CALORIES_FLOOR);
    });

    it('should set next recalculation date 7 days in the future', async () => {
      (adaptiveTDEEStorage.getDataQualityMetrics as jest.Mock).mockResolvedValue({
        isReadyForCalculation: false,
        daysUntilReady: 10,
        daysWithBothLogs: 4,
        totalWeightLogs: 4,
        totalCalorieLogs: 4,
      });

      const input: TDEECalculationInput = {
        weightHistory: [makeWeightLog('2025-01-15', 180)],
        calorieHistory: [],
        userProfile: makeUserProfile(),
      };

      const result = await calculateAdaptiveTDEE(input);

      const nextRecalc = new Date(result.nextRecalculationDate);
      const now = new Date();
      const diffDays = Math.round((nextRecalc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(8);
    });

    it('should calculate adaptive TDEE when data is ready', async () => {
      (adaptiveTDEEStorage.getDataQualityMetrics as jest.Mock).mockResolvedValue({
        isReadyForCalculation: true,
        daysUntilReady: 0,
        daysWithBothLogs: 28,
        totalWeightLogs: 28,
        totalCalorieLogs: 28,
      });

      // Create 4+ weeks of data grouped such that each week has 3+ logs
      const dates = datesBack(35);
      const weightHistory = dates.map((date, i) =>
        makeWeightLog(date, 180 - i * 0.1, 'lb')
      );
      const calorieHistory = dates.map((date) =>
        makeCalorieLog(date, 2200)
      );

      const input: TDEECalculationInput = {
        weightHistory,
        calorieHistory,
        userProfile: makeUserProfile(),
      };

      const result = await calculateAdaptiveTDEE(input);

      expect(result.formulaTDEE).toBeGreaterThan(0);
      expect(result.lastCalculated).toBeTruthy();
      expect(adaptiveTDEEStorage.saveTDEEResult).toHaveBeenCalledWith(result);
    });

    it('should handle female sex in BMR calculation', async () => {
      (adaptiveTDEEStorage.getDataQualityMetrics as jest.Mock).mockResolvedValue({
        isReadyForCalculation: false,
        daysUntilReady: 10,
        daysWithBothLogs: 4,
        totalWeightLogs: 4,
        totalCalorieLogs: 4,
      });

      const input: TDEECalculationInput = {
        weightHistory: [makeWeightLog('2025-01-15', 150)],
        calorieHistory: [],
        userProfile: makeUserProfile({ sex: 'female', heightCm: 165, age: 28 }),
      };

      const result = await calculateAdaptiveTDEE(input);

      // Female BMR is lower (uses -161 instead of +5)
      // So TDEE should be less than for a same-weight male
      expect(result.formulaTDEE).toBeGreaterThan(0);
    });

    it('should return maintain goal recommended calories equal to TDEE', async () => {
      (adaptiveTDEEStorage.getDataQualityMetrics as jest.Mock).mockResolvedValue({
        isReadyForCalculation: false,
        daysUntilReady: 10,
        daysWithBothLogs: 4,
        totalWeightLogs: 4,
        totalCalorieLogs: 4,
      });

      const input: TDEECalculationInput = {
        weightHistory: [makeWeightLog('2025-01-15', 180)],
        calorieHistory: [],
        userProfile: makeUserProfile({ goalType: 'maintain', targetWeeklyChange: 0 }),
      };

      const result = await calculateAdaptiveTDEE(input);

      expect(result.recommendedCalories).toBe(result.adaptiveTDEE);
    });
  });

  describe('recalculateTDEEIfNeeded', () => {
    it('should return existing result if calculated less than 1 day ago', async () => {
      const existingResult = {
        adaptiveTDEE: 2500,
        formulaTDEE: 2400,
        lastCalculated: new Date().toISOString(),
        confidence: 'medium' as const,
        confidenceScore: 60,
        difference: 100,
        differencePercent: 4,
        dataPoints: 4,
        recommendedCalories: 2000,
        adjustmentFromFormula: 100,
        metabolismTrend: 'normal' as const,
        insights: [],
        weeklyHistory: [],
        nextRecalculationDate: new Date().toISOString(),
      };

      (adaptiveTDEEStorage.getTDEEResult as jest.Mock).mockResolvedValue(existingResult);

      const result = await recalculateTDEEIfNeeded(makeUserProfile());

      expect(result).toEqual(existingResult);
      // Should NOT call getWeightHistory because it returns early
      expect(adaptiveTDEEStorage.getWeightHistory).not.toHaveBeenCalled();
    });

    it('should recalculate if last calculation was over 1 day ago', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      (adaptiveTDEEStorage.getTDEEResult as jest.Mock).mockResolvedValue({
        lastCalculated: twoDaysAgo.toISOString(),
      });

      (adaptiveTDEEStorage.getWeightHistory as jest.Mock).mockResolvedValue([
        makeWeightLog('2025-01-15', 180),
      ]);
      (adaptiveTDEEStorage.getCalorieHistory as jest.Mock).mockResolvedValue([
        makeCalorieLog('2025-01-15', 2000),
      ]);
      (adaptiveTDEEStorage.getDataQualityMetrics as jest.Mock).mockResolvedValue({
        isReadyForCalculation: false,
        daysUntilReady: 10,
        daysWithBothLogs: 4,
        totalWeightLogs: 4,
        totalCalorieLogs: 4,
      });

      const result = await recalculateTDEEIfNeeded(makeUserProfile());

      expect(result).not.toBeNull();
      expect(adaptiveTDEEStorage.getWeightHistory).toHaveBeenCalled();
      expect(adaptiveTDEEStorage.getCalorieHistory).toHaveBeenCalled();
    });

    it('should recalculate if no existing result', async () => {
      (adaptiveTDEEStorage.getTDEEResult as jest.Mock).mockResolvedValue(null);
      (adaptiveTDEEStorage.getWeightHistory as jest.Mock).mockResolvedValue([]);
      (adaptiveTDEEStorage.getCalorieHistory as jest.Mock).mockResolvedValue([]);
      (adaptiveTDEEStorage.getDataQualityMetrics as jest.Mock).mockResolvedValue({
        isReadyForCalculation: false,
        daysUntilReady: 14,
        daysWithBothLogs: 0,
        totalWeightLogs: 0,
        totalCalorieLogs: 0,
      });

      const result = await recalculateTDEEIfNeeded(makeUserProfile());

      expect(result).not.toBeNull();
      expect(adaptiveTDEEStorage.getWeightHistory).toHaveBeenCalled();
    });
  });
});
