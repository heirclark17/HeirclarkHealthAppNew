// @ts-nocheck
/**
 * Tests for smartMealLoggerStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { smartMealLoggerStorage } from '../smartMealLoggerStorage';
import { SMART_MEAL_CONSTANTS } from '../../types/smartMealLogger';

const { STORAGE_KEYS } = SMART_MEAL_CONSTANTS;

describe('smartMealLoggerStorage', () => {
  beforeEach(() => {
    AsyncStorage.__resetStore();
    jest.clearAllMocks();
  });

  describe('getFrequentMeals', () => {
    it('should return empty array when no meals stored', async () => {
      const meals = await smartMealLoggerStorage.getFrequentMeals();
      expect(meals).toEqual([]);
    });

    it('should return stored frequent meals', async () => {
      const mockMeals = [
        {
          id: '1',
          name: 'Oatmeal',
          calories: 300,
          protein: 10,
          carbs: 54,
          fat: 6,
          mealType: 'breakfast' as const,
          logCount: 10,
          lastLogged: '2025-01-15',
          averageTime: '08:00',
          dayOfWeekFrequency: [1, 2, 3, 2, 1, 0, 0],
          source: 'manual' as const,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-15T00:00:00.000Z',
        },
      ];
      await AsyncStorage.setItem(STORAGE_KEYS.frequentMeals, JSON.stringify(mockMeals));
      const meals = await smartMealLoggerStorage.getFrequentMeals();
      expect(meals).toHaveLength(1);
      expect(meals[0].name).toBe('Oatmeal');
    });

    it('should handle corrupted data gracefully', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.frequentMeals, 'invalid json');
      const meals = await smartMealLoggerStorage.getFrequentMeals();
      expect(meals).toEqual([]);
    });
  });

  describe('getFrequentMealsByType', () => {
    it('should filter meals by type', async () => {
      const mockMeals = [
        {
          id: '1',
          name: 'Oatmeal',
          calories: 300,
          protein: 10,
          carbs: 54,
          fat: 6,
          mealType: 'breakfast' as const,
          logCount: 10,
          lastLogged: '2025-01-15',
          averageTime: '08:00',
          dayOfWeekFrequency: [0, 0, 0, 0, 0, 0, 0],
          source: 'manual' as const,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-15T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Chicken Salad',
          calories: 400,
          protein: 35,
          carbs: 20,
          fat: 15,
          mealType: 'lunch' as const,
          logCount: 8,
          lastLogged: '2025-01-15',
          averageTime: '12:30',
          dayOfWeekFrequency: [0, 0, 0, 0, 0, 0, 0],
          source: 'manual' as const,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-15T00:00:00.000Z',
        },
      ];
      await AsyncStorage.setItem(STORAGE_KEYS.frequentMeals, JSON.stringify(mockMeals));

      const breakfastMeals = await smartMealLoggerStorage.getFrequentMealsByType('breakfast');
      expect(breakfastMeals).toHaveLength(1);
      expect(breakfastMeals[0].name).toBe('Oatmeal');
    });
  });

  describe('getTopFrequentMeals', () => {
    it('should return meals sorted by log count', async () => {
      const mockMeals = [
        {
          id: '1',
          name: 'Meal A',
          calories: 300,
          protein: 10,
          carbs: 40,
          fat: 5,
          mealType: 'breakfast' as const,
          logCount: 5,
          lastLogged: '2025-01-15',
          averageTime: '08:00',
          dayOfWeekFrequency: [0, 0, 0, 0, 0, 0, 0],
          source: 'manual' as const,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-15T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Meal B',
          calories: 400,
          protein: 20,
          carbs: 30,
          fat: 10,
          mealType: 'lunch' as const,
          logCount: 15,
          lastLogged: '2025-01-15',
          averageTime: '12:00',
          dayOfWeekFrequency: [0, 0, 0, 0, 0, 0, 0],
          source: 'manual' as const,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-15T00:00:00.000Z',
        },
      ];
      await AsyncStorage.setItem(STORAGE_KEYS.frequentMeals, JSON.stringify(mockMeals));

      const topMeals = await smartMealLoggerStorage.getTopFrequentMeals(2);
      expect(topMeals[0].name).toBe('Meal B');
      expect(topMeals[1].name).toBe('Meal A');
    });

    it('should limit results to specified count', async () => {
      const mockMeals = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        name: `Meal ${i}`,
        calories: 300,
        protein: 10,
        carbs: 40,
        fat: 5,
        mealType: 'breakfast' as const,
        logCount: i,
        lastLogged: '2025-01-15',
        averageTime: '08:00',
        dayOfWeekFrequency: [0, 0, 0, 0, 0, 0, 0],
        source: 'manual' as const,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T00:00:00.000Z',
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.frequentMeals, JSON.stringify(mockMeals));

      const topMeals = await smartMealLoggerStorage.getTopFrequentMeals(5);
      expect(topMeals).toHaveLength(5);
    });
  });

  describe('upsertFrequentMeal', () => {
    it('should create new meal when it does not exist', async () => {
      const meal = await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'New Meal',
        calories: 350,
        protein: 15,
        carbs: 45,
        fat: 8,
        mealType: 'lunch',
        source: 'manual',
      });

      expect(meal.name).toBe('New Meal');
      expect(meal.logCount).toBe(1);
      expect(meal.id).toBeDefined();
    });

    it('should update existing meal with case-insensitive match', async () => {
      await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Chicken Salad',
        calories: 400,
        protein: 30,
        carbs: 20,
        fat: 15,
        mealType: 'lunch',
        source: 'manual',
      });

      const updated = await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'chicken salad', // lowercase
        calories: 400,
        protein: 30,
        carbs: 20,
        fat: 15,
        mealType: 'lunch',
        source: 'manual',
      });

      expect(updated.logCount).toBe(2);
      const meals = await smartMealLoggerStorage.getFrequentMeals();
      expect(meals).toHaveLength(1);
    });

    it('should calculate average time correctly', async () => {
      // First log at 08:00
      await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Oatmeal',
        calories: 300,
        protein: 10,
        carbs: 50,
        fat: 5,
        mealType: 'breakfast',
        source: 'manual',
      });

      // Mock current time to 08:30
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(8);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(30);

      const updated = await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Oatmeal',
        calories: 300,
        protein: 10,
        carbs: 50,
        fat: 5,
        mealType: 'breakfast',
        source: 'manual',
      });

      // Average of 08:00 and 08:30 should be 08:15
      expect(updated.averageTime).toBe('08:15');
    });

    it('should update day of week frequency', async () => {
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Monday

      await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Lunch',
        calories: 500,
        protein: 25,
        carbs: 40,
        fat: 20,
        mealType: 'lunch',
        source: 'manual',
      });

      const meals = await smartMealLoggerStorage.getFrequentMeals();
      expect(meals[0].dayOfWeekFrequency[1]).toBe(1); // Monday count
    });

    it('should trim to MAX_FREQUENT_MEALS keeping most logged', async () => {
      // Create 101 meals (max is 100)
      for (let i = 0; i < 101; i++) {
        await smartMealLoggerStorage.upsertFrequentMeal({
          name: `Meal ${i}`,
          calories: 300,
          protein: 10,
          carbs: 40,
          fat: 5,
          mealType: 'snack',
          source: 'manual',
        });
      }

      const meals = await smartMealLoggerStorage.getFrequentMeals();
      expect(meals).toHaveLength(SMART_MEAL_CONSTANTS.MAX_FREQUENT_MEALS);
    });

    it('should update macros to latest values', async () => {
      await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Protein Shake',
        calories: 200,
        protein: 25,
        carbs: 10,
        fat: 5,
        mealType: 'snack',
        source: 'manual',
      });

      const updated = await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Protein Shake',
        calories: 250,
        protein: 30,
        carbs: 15,
        fat: 7,
        mealType: 'snack',
        source: 'manual',
      });

      expect(updated.calories).toBe(250);
      expect(updated.protein).toBe(30);
    });
  });

  describe('deleteFrequentMeal', () => {
    it('should delete meal by ID', async () => {
      const meal = await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'To Delete',
        calories: 300,
        protein: 10,
        carbs: 40,
        fat: 5,
        mealType: 'snack',
        source: 'manual',
      });

      await smartMealLoggerStorage.deleteFrequentMeal(meal.id);
      const meals = await smartMealLoggerStorage.getFrequentMeals();
      expect(meals).toHaveLength(0);
    });

    it('should handle non-existent ID gracefully', async () => {
      await expect(
        smartMealLoggerStorage.deleteFrequentMeal('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('searchFrequentMeals', () => {
    it('should find meals by name substring', async () => {
      await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Chicken Breast',
        calories: 200,
        protein: 40,
        carbs: 0,
        fat: 5,
        mealType: 'lunch',
        source: 'manual',
      });

      await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Chicken Salad',
        calories: 400,
        protein: 30,
        carbs: 20,
        fat: 15,
        mealType: 'lunch',
        source: 'manual',
      });

      const results = await smartMealLoggerStorage.searchFrequentMeals('chick');
      expect(results).toHaveLength(2);
    });

    it('should be case insensitive', async () => {
      await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Greek Yogurt',
        calories: 150,
        protein: 15,
        carbs: 12,
        fat: 4,
        mealType: 'snack',
        source: 'manual',
      });

      const results = await smartMealLoggerStorage.searchFrequentMeals('GREEK');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      const results = await smartMealLoggerStorage.searchFrequentMeals('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getMealPatterns', () => {
    it('should return empty array when no patterns', async () => {
      const patterns = await smartMealLoggerStorage.getMealPatterns();
      expect(patterns).toEqual([]);
    });

    it('should return stored patterns', async () => {
      const mockPatterns = [
        {
          id: 'breakfast_1',
          mealType: 'breakfast' as const,
          timeRange: { start: '06:00', end: '10:00' },
          dayOfWeek: 1,
          frequentMealIds: ['meal-1'],
          averageCalories: 350,
          averageProtein: 15,
          averageCarbs: 45,
          averageFat: 10,
          logCount: 5,
        },
      ];
      await AsyncStorage.setItem(STORAGE_KEYS.mealPatterns, JSON.stringify(mockPatterns));

      const patterns = await smartMealLoggerStorage.getMealPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].mealType).toBe('breakfast');
    });
  });

  describe('updateMealPatterns', () => {
    it('should create new pattern when it does not exist', async () => {
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(2); // Tuesday
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12);

      await smartMealLoggerStorage.updateMealPatterns('lunch', 'meal-1', 500, 25, 40, 20);

      const patterns = await smartMealLoggerStorage.getMealPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].id).toBe('lunch_2');
      expect(patterns[0].averageCalories).toBe(500);
    });

    it('should update existing pattern with running averages', async () => {
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Monday

      await smartMealLoggerStorage.updateMealPatterns('breakfast', 'meal-1', 300, 10, 40, 5);
      await smartMealLoggerStorage.updateMealPatterns('breakfast', 'meal-2', 400, 20, 50, 10);

      const patterns = await smartMealLoggerStorage.getMealPatterns();
      expect(patterns[0].averageCalories).toBe(350); // (300 + 400) / 2
      expect(patterns[0].logCount).toBe(2);
    });

    it('should add meal IDs to frequentMealIds array', async () => {
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);

      await smartMealLoggerStorage.updateMealPatterns('dinner', 'meal-1', 600, 30, 50, 20);
      await smartMealLoggerStorage.updateMealPatterns('dinner', 'meal-2', 650, 35, 55, 22);

      const patterns = await smartMealLoggerStorage.getMealPatterns();
      expect(patterns[0].frequentMealIds).toContain('meal-1');
      expect(patterns[0].frequentMealIds).toContain('meal-2');
    });
  });

  describe('getMealLogHistory', () => {
    it('should return empty array when no history', async () => {
      const history = await smartMealLoggerStorage.getMealLogHistory();
      expect(history).toEqual([]);
    });

    it('should filter history by days parameter', async () => {
      const mockHistory = [
        {
          id: '1',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '12:00',
          mealType: 'lunch' as const,
          name: 'Lunch',
          calories: 500,
          protein: 25,
          carbs: 40,
          fat: 20,
        },
        {
          id: '2',
          date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '12:00',
          mealType: 'lunch' as const,
          name: 'Old Lunch',
          calories: 500,
          protein: 25,
          carbs: 40,
          fat: 20,
        },
      ];
      await AsyncStorage.setItem(STORAGE_KEYS.mealLogHistory, JSON.stringify(mockHistory));

      const history = await smartMealLoggerStorage.getMealLogHistory(30);
      expect(history).toHaveLength(1);
    });
  });

  describe('addToLogHistory', () => {
    it('should add meal to history', async () => {
      await smartMealLoggerStorage.addToLogHistory({
        name: 'Test Meal',
        mealType: 'dinner',
        calories: 600,
        protein: 30,
        carbs: 50,
        fat: 20,
      });

      const history = await smartMealLoggerStorage.getMealLogHistory();
      expect(history).toHaveLength(1);
      expect(history[0].name).toBe('Test Meal');
    });

    it('should trim history to 60 days', async () => {
      // Add 70 days of history
      for (let i = 0; i < 70; i++) {
        const pastDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        jest.spyOn(Date.prototype, 'toISOString').mockReturnValueOnce(pastDate.toISOString());

        await smartMealLoggerStorage.addToLogHistory({
          name: `Meal ${i}`,
          mealType: 'lunch',
          calories: 500,
          protein: 25,
          carbs: 40,
          fat: 20,
        });
      }

      const stored = await AsyncStorage.getItem(STORAGE_KEYS.mealLogHistory);
      const history = JSON.parse(stored!);
      expect(history.length).toBeLessThanOrEqual(60);
    });
  });

  describe('getMealsForDayOfWeek', () => {
    it('should filter meals by day of week', async () => {
      const monday = new Date('2025-01-13T12:00:00'); // Monday
      const tuesday = new Date('2025-01-14T12:00:00'); // Tuesday

      const mockHistory = [
        {
          id: '1',
          date: monday.toISOString().split('T')[0],
          time: '12:00',
          mealType: 'lunch' as const,
          name: 'Monday Lunch',
          calories: 500,
          protein: 25,
          carbs: 40,
          fat: 20,
        },
        {
          id: '2',
          date: tuesday.toISOString().split('T')[0],
          time: '12:00',
          mealType: 'lunch' as const,
          name: 'Tuesday Lunch',
          calories: 500,
          protein: 25,
          carbs: 40,
          fat: 20,
        },
      ];
      await AsyncStorage.setItem(STORAGE_KEYS.mealLogHistory, JSON.stringify(mockHistory));

      const mondayMeals = await smartMealLoggerStorage.getMealsForDayOfWeek(1); // Monday
      expect(mondayMeals).toHaveLength(1);
      expect(mondayMeals[0].name).toBe('Monday Lunch');
    });
  });

  describe('getLastSyncDate / updateLastSyncDate', () => {
    it('should return null when no sync date', async () => {
      const date = await smartMealLoggerStorage.getLastSyncDate();
      expect(date).toBeNull();
    });

    it('should save and retrieve sync date', async () => {
      await smartMealLoggerStorage.updateLastSyncDate();
      const date = await smartMealLoggerStorage.getLastSyncDate();
      expect(date).toBeTruthy();
    });
  });

  describe('clearAllData', () => {
    it('should clear all smart meal logger data', async () => {
      await smartMealLoggerStorage.upsertFrequentMeal({
        name: 'Test',
        calories: 300,
        protein: 10,
        carbs: 40,
        fat: 5,
        mealType: 'snack',
        source: 'manual',
      });

      await smartMealLoggerStorage.updateLastSyncDate();

      await smartMealLoggerStorage.clearAllData();

      const meals = await smartMealLoggerStorage.getFrequentMeals();
      const patterns = await smartMealLoggerStorage.getMealPatterns();
      const history = await smartMealLoggerStorage.getMealLogHistory();
      const syncDate = await smartMealLoggerStorage.getLastSyncDate();

      expect(meals).toEqual([]);
      expect(patterns).toEqual([]);
      expect(history).toEqual([]);
      expect(syncDate).toBeNull();
    });
  });
});
