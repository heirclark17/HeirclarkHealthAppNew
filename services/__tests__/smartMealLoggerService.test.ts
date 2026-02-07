/**
 * Tests for smartMealLoggerService.ts
 */

import {
  getMealTypeForCurrentTime,
  generateMealSuggestions,
  getSuggestionsForMealType,
  logMealAndLearn,
  getFavoriteMeals,
  getRecentMeals,
  searchMeals,
  getMealInsights,
} from '../smartMealLoggerService';
import { smartMealLoggerStorage } from '../smartMealLoggerStorage';
import { FrequentMeal, SMART_MEAL_CONSTANTS } from '../../types/smartMealLogger';

jest.mock('../smartMealLoggerStorage', () => ({
  smartMealLoggerStorage: {
    getFrequentMeals: jest.fn(),
    upsertFrequentMeal: jest.fn(),
    updateMealPatterns: jest.fn(),
    addToLogHistory: jest.fn(),
    getMealLogHistory: jest.fn(),
    searchFrequentMeals: jest.fn(),
  },
}));

const mockedStorage = smartMealLoggerStorage as jest.Mocked<typeof smartMealLoggerStorage>;

function createMockMeal(overrides: Partial<FrequentMeal> = {}): FrequentMeal {
  return {
    id: 'meal-1',
    name: 'Chicken Salad',
    calories: 450,
    protein: 35,
    carbs: 20,
    fat: 15,
    mealType: 'lunch',
    logCount: 5,
    lastLogged: new Date().toISOString(),
    averageTime: '12:30',
    dayOfWeekFrequency: [1, 2, 3, 2, 1, 0, 0],
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('smartMealLoggerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================
  // getMealTypeForCurrentTime
  // =============================================
  describe('getMealTypeForCurrentTime', () => {
    it('should return breakfast for morning hours', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T08:00:00'));
      expect(getMealTypeForCurrentTime()).toBe('breakfast');
      jest.useRealTimers();
    });

    it('should return lunch for midday hours', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00'));
      expect(getMealTypeForCurrentTime()).toBe('lunch');
      jest.useRealTimers();
    });

    it('should return dinner for evening hours', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T19:00:00'));
      expect(getMealTypeForCurrentTime()).toBe('dinner');
      jest.useRealTimers();
    });

    it('should return snack for late night hours', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T23:00:00'));
      expect(getMealTypeForCurrentTime()).toBe('snack');
      jest.useRealTimers();
    });

    it('should return snack for early morning hours (before breakfast)', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T03:00:00'));
      expect(getMealTypeForCurrentTime()).toBe('snack');
      jest.useRealTimers();
    });
  });

  // =============================================
  // generateMealSuggestions
  // =============================================
  describe('generateMealSuggestions', () => {
    it('should return empty array when no frequent meals exist', async () => {
      mockedStorage.getFrequentMeals.mockResolvedValue([]);
      const suggestions = await generateMealSuggestions();
      expect(suggestions).toEqual([]);
    });

    it('should return scored suggestions filtered by confidence', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:30:00'));

      const mockMeals: FrequentMeal[] = [
        createMockMeal({
          id: 'meal-1',
          name: 'Grilled Chicken',
          mealType: 'lunch',
          logCount: 10,
          averageTime: '12:30',
          lastLogged: new Date().toISOString(),
          dayOfWeekFrequency: [0, 0, 0, 5, 0, 0, 0], // Wednesday heavy
        }),
        createMockMeal({
          id: 'meal-2',
          name: 'Pasta',
          mealType: 'lunch',
          logCount: 3,
          averageTime: '12:00',
          lastLogged: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
          dayOfWeekFrequency: [0, 0, 0, 0, 0, 0, 0],
        }),
      ];
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const suggestions = await generateMealSuggestions('lunch');
      expect(suggestions.length).toBeGreaterThan(0);

      // Suggestions should be sorted by confidence descending
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
      }

      jest.useRealTimers();
    });

    it('should filter by meal type when provided', async () => {
      const mockMeals: FrequentMeal[] = [
        createMockMeal({ id: '1', mealType: 'breakfast', logCount: 10 }),
        createMockMeal({ id: '2', mealType: 'lunch', logCount: 10 }),
        createMockMeal({ id: '3', mealType: 'dinner', logCount: 10 }),
      ];
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const suggestions = await generateMealSuggestions('breakfast');
      // All returned suggestions should be breakfast meals
      suggestions.forEach(s => {
        expect(s.meal.mealType).toBe('breakfast');
      });
    });

    it('should limit results to MAX_SUGGESTIONS', async () => {
      const mockMeals: FrequentMeal[] = Array.from({ length: 20 }, (_, i) =>
        createMockMeal({
          id: `meal-${i}`,
          name: `Meal ${i}`,
          logCount: 20 - i,
          lastLogged: new Date().toISOString(),
        })
      );
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const suggestions = await generateMealSuggestions();
      expect(suggestions.length).toBeLessThanOrEqual(SMART_MEAL_CONSTANTS.MAX_SUGGESTIONS);
    });

    it('should include reason text in suggestions', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:30:00'));

      const mockMeals: FrequentMeal[] = [
        createMockMeal({
          logCount: 10,
          averageTime: '12:30',
          lastLogged: new Date().toISOString(),
        }),
      ];
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const suggestions = await generateMealSuggestions();
      if (suggestions.length > 0) {
        expect(typeof suggestions[0].reason).toBe('string');
        expect(suggestions[0].reason.length).toBeGreaterThan(0);
      }

      jest.useRealTimers();
    });
  });

  // =============================================
  // getSuggestionsForMealType
  // =============================================
  describe('getSuggestionsForMealType', () => {
    it('should delegate to generateMealSuggestions with mealType', async () => {
      mockedStorage.getFrequentMeals.mockResolvedValue([]);
      const result = await getSuggestionsForMealType('dinner');
      expect(result).toEqual([]);
      expect(mockedStorage.getFrequentMeals).toHaveBeenCalled();
    });
  });

  // =============================================
  // logMealAndLearn
  // =============================================
  describe('logMealAndLearn', () => {
    it('should upsert frequent meal and update patterns', async () => {
      const mockReturn = createMockMeal({ id: 'meal-new', logCount: 1 });
      mockedStorage.upsertFrequentMeal.mockResolvedValue(mockReturn);
      mockedStorage.updateMealPatterns.mockResolvedValue(undefined);
      mockedStorage.addToLogHistory.mockResolvedValue(undefined);

      const mealInput = {
        name: 'Test Meal',
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
        mealType: 'lunch' as const,
        source: 'manual' as const,
      };

      const result = await logMealAndLearn(mealInput);
      expect(result).toEqual(mockReturn);
      expect(mockedStorage.upsertFrequentMeal).toHaveBeenCalledWith(mealInput);
      expect(mockedStorage.updateMealPatterns).toHaveBeenCalledWith(
        'lunch',
        'meal-new',
        500,
        30,
        50,
        20
      );
      expect(mockedStorage.addToLogHistory).toHaveBeenCalledWith(mealInput);
    });

    it('should handle all meal sources', async () => {
      const sources: Array<'manual' | 'ai' | 'barcode' | 'photo'> = ['manual', 'ai', 'barcode', 'photo'];

      for (const source of sources) {
        const mockReturn = createMockMeal({ source });
        mockedStorage.upsertFrequentMeal.mockResolvedValue(mockReturn);

        const result = await logMealAndLearn({
          name: 'Test',
          calories: 100,
          protein: 10,
          carbs: 10,
          fat: 5,
          mealType: 'snack',
          source,
        });
        expect(result.source).toBe(source);
      }
    });
  });

  // =============================================
  // getFavoriteMeals
  // =============================================
  describe('getFavoriteMeals', () => {
    it('should filter meals by MIN_LOGS_FOR_FREQUENT', async () => {
      const mockMeals: FrequentMeal[] = [
        createMockMeal({ id: '1', logCount: 1 }), // below threshold
        createMockMeal({ id: '2', logCount: 5 }), // above threshold
        createMockMeal({ id: '3', logCount: 10 }), // above threshold
      ];
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const result = await getFavoriteMeals();
      expect(result.length).toBe(2);
      expect(result.every(m => m.logCount >= SMART_MEAL_CONSTANTS.MIN_LOGS_FOR_FREQUENT)).toBe(true);
    });

    it('should sort by logCount descending', async () => {
      const mockMeals: FrequentMeal[] = [
        createMockMeal({ id: '1', logCount: 5 }),
        createMockMeal({ id: '2', logCount: 15 }),
        createMockMeal({ id: '3', logCount: 10 }),
      ];
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const result = await getFavoriteMeals();
      expect(result[0].logCount).toBe(15);
      expect(result[1].logCount).toBe(10);
      expect(result[2].logCount).toBe(5);
    });

    it('should respect the limit parameter', async () => {
      const mockMeals = Array.from({ length: 20 }, (_, i) =>
        createMockMeal({ id: `meal-${i}`, logCount: 20 - i })
      );
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const result = await getFavoriteMeals(3);
      expect(result.length).toBe(3);
    });

    it('should default to limit of 10', async () => {
      const mockMeals = Array.from({ length: 20 }, (_, i) =>
        createMockMeal({ id: `meal-${i}`, logCount: 20 - i })
      );
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const result = await getFavoriteMeals();
      expect(result.length).toBe(10);
    });
  });

  // =============================================
  // getRecentMeals
  // =============================================
  describe('getRecentMeals', () => {
    it('should return only meals logged within last 7 days', async () => {
      const recentDate = new Date().toISOString();
      const oldDate = new Date(Date.now() - 14 * 86400000).toISOString(); // 14 days ago

      const mockMeals: FrequentMeal[] = [
        createMockMeal({ id: '1', lastLogged: recentDate }),
        createMockMeal({ id: '2', lastLogged: oldDate }),
      ];
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const result = await getRecentMeals();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('should sort by lastLogged descending', async () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();

      const mockMeals: FrequentMeal[] = [
        createMockMeal({ id: '1', lastLogged: yesterday }),
        createMockMeal({ id: '2', lastLogged: today }),
      ];
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const result = await getRecentMeals();
      expect(result[0].id).toBe('2');
    });

    it('should respect limit parameter', async () => {
      const mockMeals = Array.from({ length: 10 }, (_, i) =>
        createMockMeal({ id: `meal-${i}`, lastLogged: new Date().toISOString() })
      );
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);

      const result = await getRecentMeals(3);
      expect(result.length).toBe(3);
    });
  });

  // =============================================
  // searchMeals
  // =============================================
  describe('searchMeals', () => {
    it('should delegate to storage searchFrequentMeals', async () => {
      const mockResult = [createMockMeal()];
      mockedStorage.searchFrequentMeals.mockResolvedValue(mockResult);

      const result = await searchMeals('chicken');
      expect(result).toEqual(mockResult);
      expect(mockedStorage.searchFrequentMeals).toHaveBeenCalledWith('chicken');
    });
  });

  // =============================================
  // getMealInsights
  // =============================================
  describe('getMealInsights', () => {
    it('should return empty insights when no meals exist', async () => {
      mockedStorage.getFrequentMeals.mockResolvedValue([]);
      mockedStorage.getMealLogHistory.mockResolvedValue([]);

      const result = await getMealInsights();
      expect(result.totalMealsLogged).toBe(0);
      expect(result.favoriteMealType).toBeNull();
      expect(result.averageCaloriesPerMeal).toBe(0);
      expect(result.uniqueMealsLogged).toBe(0);
    });

    it('should compute correct statistics', async () => {
      const mockMeals: FrequentMeal[] = [
        createMockMeal({
          id: '1',
          name: 'Oatmeal',
          mealType: 'breakfast',
          logCount: 10,
          calories: 300,
          dayOfWeekFrequency: [0, 5, 3, 2, 0, 0, 0],
        }),
        createMockMeal({
          id: '2',
          name: 'Chicken',
          mealType: 'lunch',
          logCount: 5,
          calories: 500,
          dayOfWeekFrequency: [0, 2, 1, 1, 1, 0, 0],
        }),
      ];
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);
      mockedStorage.getMealLogHistory.mockResolvedValue([]);

      const result = await getMealInsights();
      expect(result.totalMealsLogged).toBe(15); // 10 + 5
      expect(result.favoriteMealType).toBe('breakfast'); // 10 > 5
      // totalCalories = (300*10) + (500*5) = 5500
      // averageCaloriesPerMeal = 5500 / 15 ≈ 367
      expect(result.averageCaloriesPerMeal).toBe(Math.round(5500 / 15));
      expect(result.uniqueMealsLogged).toBe(2);
      // dayActivity = [0, 7, 4, 3, 1, 0, 0], max at index 1 (Monday)
      expect(result.mostActiveDayOfWeek).toBe(1);
    });

    it('should correctly determine most active day of week', async () => {
      const mockMeals: FrequentMeal[] = [
        createMockMeal({
          id: '1',
          logCount: 7,
          dayOfWeekFrequency: [0, 0, 0, 0, 0, 7, 0], // all on Friday
        }),
      ];
      mockedStorage.getFrequentMeals.mockResolvedValue(mockMeals);
      mockedStorage.getMealLogHistory.mockResolvedValue([]);

      const result = await getMealInsights();
      expect(result.mostActiveDayOfWeek).toBe(5); // Friday
    });
  });
});
