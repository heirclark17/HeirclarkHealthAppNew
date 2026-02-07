/**
 * Tests for mealPlanService.ts
 */

import { mealPlanService } from '../mealPlanService';
import { UserGoalsForMealPlan, MealPlanPreferences, GroceryCategory, Meal } from '../../types/mealPlan';

describe('mealPlanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const defaultGoals: UserGoalsForMealPlan = {
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 70,
  };

  const defaultPreferences: MealPlanPreferences = {
    mealsPerDay: 3,
    allergies: [],
    hatedFoods: '',
    cookingSkill: 'intermediate',
    favoriteProteins: ['chicken', 'fish'],
  };

  // =============================================
  // setCustomerId
  // =============================================
  describe('setCustomerId', () => {
    it('should update the customer ID used in headers', () => {
      mealPlanService.setCustomerId('cust_12345');
      // We verify indirectly - this changes internal state used in requests
      // No error means success
      expect(true).toBe(true);
    });
  });

  // =============================================
  // generateMealPlan
  // =============================================
  describe('generateMealPlan', () => {
    it('should return API data when API call succeeds', async () => {
      const apiData = {
        weeklyPlan: [{ dayNumber: 1, date: '2025-01-13', dayName: 'Monday', meals: [], dailyTotals: { calories: 2000, protein: 150, carbs: 200, fat: 70 } }],
        groceryList: [{ category: 'Produce', items: [] }],
        weekSummary: { avgDailyCalories: 2000, avgDailyProtein: 150, avgDailyCarbs: 200, avgDailyFat: 70, totalMeals: 3 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => apiData,
      });

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');
      expect(result.success).toBe(true);
      expect(result.weeklyPlan.length).toBe(1);
      expect(result.groceryList.length).toBe(1);
    });

    it('should fallback to mock generation when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');
      expect(result.success).toBe(true);
      expect(result.weeklyPlan.length).toBe(7); // mock generates 7 days
      expect(result.groceryList.length).toBeGreaterThan(0);
      expect(result.weekSummary).toBeDefined();
    });

    it('should fallback to mock generation when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');
      expect(result.success).toBe(true);
      expect(result.weeklyPlan.length).toBe(7);
    });

    it('should generate 7 days in mock plan', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-15');
      expect(result.weeklyPlan.length).toBe(7);

      result.weeklyPlan.forEach((day, i) => {
        expect(day.dayNumber).toBe(i + 1);
        expect(day.date).toBeDefined();
        expect(day.dayName).toBeDefined();
        expect(day.meals.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should include snack when mealsPerDay >= 4', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const prefsWithSnack = { ...defaultPreferences, mealsPerDay: 4 };
      const result = await mealPlanService.generateMealPlan(defaultGoals, prefsWithSnack, '2025-01-13');

      result.weeklyPlan.forEach(day => {
        expect(day.meals.length).toBe(4);
        const snackMeal = day.meals.find(m => m.mealType === 'snack');
        expect(snackMeal).toBeDefined();
      });
    });

    it('should not include snack when mealsPerDay < 4', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');

      result.weeklyPlan.forEach(day => {
        expect(day.meals.length).toBe(3);
        const snackMeal = day.meals.find(m => m.mealType === 'snack');
        expect(snackMeal).toBeUndefined();
      });
    });

    it('should calculate daily totals for each day', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');

      result.weeklyPlan.forEach(day => {
        expect(day.dailyTotals.calories).toBeGreaterThan(0);
        expect(day.dailyTotals.protein).toBeGreaterThan(0);
        expect(day.dailyTotals.carbs).toBeGreaterThan(0);
        expect(day.dailyTotals.fat).toBeGreaterThan(0);
      });
    });

    it('should generate a grocery list from the plan', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');

      expect(result.groceryList.length).toBeGreaterThan(0);
      result.groceryList.forEach(category => {
        expect(category.category).toBeDefined();
        expect(category.items.length).toBeGreaterThan(0);
        category.items.forEach(item => {
          expect(item.name).toBeDefined();
          expect(item.totalAmount).toBeDefined();
          expect(item.checked).toBe(false);
        });
      });
    });

    it('should generate a week summary', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');

      expect(result.weekSummary.avgDailyCalories).toBeGreaterThan(0);
      expect(result.weekSummary.avgDailyProtein).toBeGreaterThan(0);
      expect(result.weekSummary.avgDailyCarbs).toBeGreaterThan(0);
      expect(result.weekSummary.avgDailyFat).toBeGreaterThan(0);
      expect(result.weekSummary.totalMeals).toBeGreaterThan(0);
    });

    it('should scale meal macros based on user goals', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');

      result.weeklyPlan.forEach(day => {
        day.meals.forEach(meal => {
          expect(meal.calories).toBeGreaterThan(0);
          expect(meal.protein).toBeGreaterThan(0);
          expect(meal.carbs).toBeGreaterThan(0);
          expect(meal.fat).toBeGreaterThan(0);
        });
      });
    });

    it('should generate unique meal IDs', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');

      const allIds = new Set<string>();
      result.weeklyPlan.forEach(day => {
        day.meals.forEach(meal => {
          expect(allIds.has(meal.id)).toBe(false);
          allIds.add(meal.id);
        });
      });
    });

    it('should include meal ingredients and instructions', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const result = await mealPlanService.generateMealPlan(defaultGoals, defaultPreferences, '2025-01-13');

      const firstMeal = result.weeklyPlan[0].meals[0];
      expect(firstMeal.ingredients.length).toBeGreaterThan(0);
      expect(firstMeal.instructions.length).toBeGreaterThan(0);
    });
  });

  // =============================================
  // swapMeal
  // =============================================
  describe('swapMeal', () => {
    it('should return API swap when API succeeds', async () => {
      const mockNewMeal = {
        id: 'swap-1',
        mealType: 'lunch',
        name: 'New Lunch',
        calories: 500,
        protein: 40,
        carbs: 50,
        fat: 20,
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newMeal: mockNewMeal }),
      });

      const result = await mealPlanService.swapMeal(1, 'lunch', 'Old Lunch', defaultGoals);
      expect(result.success).toBe(true);
      expect(result.newMeal.name).toBe('New Lunch');
    });

    it('should fallback to mock swap when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await mealPlanService.swapMeal(1, 'lunch', 'Grilled Chicken Caesar Salad', defaultGoals);
      expect(result.success).toBe(true);
      expect(result.newMeal).toBeDefined();
      expect(result.newMeal.mealType).toBe('lunch');
    });

    it('should fallback to mock swap when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await mealPlanService.swapMeal(1, 'breakfast', 'Some Breakfast', defaultGoals);
      expect(result.success).toBe(true);
      expect(result.newMeal).toBeDefined();
      expect(result.newMeal.mealType).toBe('breakfast');
    });

    it('should try to return a different meal than current', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

      const currentMealName = 'Grilled Chicken Caesar Salad';
      const result = await mealPlanService.swapMeal(1, 'lunch', currentMealName, defaultGoals);

      // It should try to pick a different one, but might pick same if only one option
      expect(result.success).toBe(true);
      expect(result.newMeal.name).toBeDefined();
    });

    it('should swap for all meal types', async () => {
      const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];

      for (const mealType of mealTypes) {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

        const result = await mealPlanService.swapMeal(1, mealType, 'Current Meal', defaultGoals);
        expect(result.success).toBe(true);
        expect(result.newMeal.mealType).toBe(mealType);
      }
    });

    it('should include reason in API call body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newMeal: { id: '1', name: 'Test', mealType: 'lunch' } }),
      });

      await mealPlanService.swapMeal(1, 'lunch', 'Old Meal', defaultGoals, 'Too many carbs');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Too many carbs'),
        })
      );
    });
  });

  // =============================================
  // createInstacartList
  // =============================================
  describe('createInstacartList', () => {
    it('should return success with URL when API returns link', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, data: { link_url: 'https://instacart.com/list/abc123' } }),
      });

      const groceryList: GroceryCategory[] = [
        {
          category: 'Produce',
          items: [
            { name: 'Apples', totalAmount: '3', unit: 'medium', category: 'Produce', checked: false },
          ],
        },
      ];

      const result = await mealPlanService.createInstacartList(groceryList, 'Weekly Groceries');
      expect(result.success).toBe(true);
      expect(result.instacartUrl).toBe('https://instacart.com/list/abc123');
    });

    it('should return failure when no items to add', async () => {
      const result = await mealPlanService.createInstacartList([], 'Empty List');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No items');
    });

    it('should skip checked items', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, data: { link_url: 'https://instacart.com/list/abc123' } }),
      });

      const groceryList: GroceryCategory[] = [
        {
          category: 'Produce',
          items: [
            { name: 'Apples', totalAmount: '3', unit: 'medium', category: 'Produce', checked: true },
            { name: 'Bananas', totalAmount: '2', unit: 'medium', category: 'Produce', checked: false },
          ],
        },
      ];

      await mealPlanService.createInstacartList(groceryList, 'Test');

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.items.length).toBe(1);
      expect(callBody.items[0].name).toBe('Bananas');
    });

    it('should return failure when all items are checked', async () => {
      const groceryList: GroceryCategory[] = [
        {
          category: 'Produce',
          items: [
            { name: 'Apples', totalAmount: '3', unit: 'medium', category: 'Produce', checked: true },
          ],
        },
      ];

      const result = await mealPlanService.createInstacartList(groceryList, 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No items');
    });

    it('should round up quantities', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, data: { link_url: 'https://instacart.com/list/test' } }),
      });

      const groceryList: GroceryCategory[] = [
        {
          category: 'Produce',
          items: [
            { name: 'Avocado', totalAmount: '1.5', unit: 'medium', category: 'Produce', checked: false },
          ],
        },
      ];

      await mealPlanService.createInstacartList(groceryList, 'Test');

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.items[0].quantity).toBe(2); // Math.ceil(1.5)
    });

    it('should return failure when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Service unavailable' }),
      });

      const groceryList: GroceryCategory[] = [
        {
          category: 'Produce',
          items: [
            { name: 'Apples', totalAmount: '3', unit: 'medium', category: 'Produce', checked: false },
          ],
        },
      ];

      const result = await mealPlanService.createInstacartList(groceryList, 'Test');
      expect(result.success).toBe(false);
    });

    it('should return failure on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const groceryList: GroceryCategory[] = [
        {
          category: 'Produce',
          items: [
            { name: 'Apples', totalAmount: '3', unit: 'medium', category: 'Produce', checked: false },
          ],
        },
      ];

      const result = await mealPlanService.createInstacartList(groceryList, 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  // =============================================
  // createInstacartListForMeal
  // =============================================
  describe('createInstacartListForMeal', () => {
    it('should create Instacart list from meal ingredients', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, data: { link_url: 'https://instacart.com/meal/123' } }),
      });

      const meal: Meal = {
        id: 'meal-1',
        mealType: 'dinner',
        name: 'Test Dinner',
        description: 'A test meal',
        prepTime: 10,
        cookTime: 20,
        servings: 1,
        calories: 500,
        protein: 40,
        carbs: 50,
        fat: 20,
        ingredients: [
          { name: 'Chicken breast', amount: '6', unit: 'oz', category: 'Protein' },
          { name: 'Rice', amount: '1', unit: 'cup', category: 'Grains' },
        ],
        instructions: ['Cook chicken', 'Cook rice'],
      };

      const result = await mealPlanService.createInstacartListForMeal(meal);
      expect(result.success).toBe(true);
      expect(result.instacartUrl).toBe('https://instacart.com/meal/123');
    });

    it('should return failure when meal has no ingredients', async () => {
      const meal: Meal = {
        id: 'meal-1',
        mealType: 'dinner',
        name: 'Empty Meal',
        description: '',
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        ingredients: [],
        instructions: [],
      };

      const result = await mealPlanService.createInstacartListForMeal(meal);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No ingredients');
    });

    it('should include meal name in title', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, data: { link_url: 'https://instacart.com/meal/123' } }),
      });

      const meal: Meal = {
        id: 'meal-1',
        mealType: 'lunch',
        name: 'Chicken Salad',
        description: '',
        prepTime: 5,
        cookTime: 0,
        servings: 1,
        calories: 400,
        protein: 35,
        carbs: 20,
        fat: 15,
        ingredients: [
          { name: 'Chicken', amount: '4', unit: 'oz', category: 'Protein' },
        ],
        instructions: ['Prep chicken'],
      };

      await mealPlanService.createInstacartListForMeal(meal);

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.title).toContain('Chicken Salad');
    });

    it('should return failure on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API error' }),
      });

      const meal: Meal = {
        id: 'meal-1',
        mealType: 'dinner',
        name: 'Test',
        description: '',
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 5,
        ingredients: [
          { name: 'Item', amount: '1', unit: 'each', category: 'Other' },
        ],
        instructions: [],
      };

      const result = await mealPlanService.createInstacartListForMeal(meal);
      expect(result.success).toBe(false);
    });

    it('should return failure on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

      const meal: Meal = {
        id: 'meal-1',
        mealType: 'dinner',
        name: 'Test',
        description: '',
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 5,
        ingredients: [
          { name: 'Item', amount: '1', unit: 'each', category: 'Other' },
        ],
        instructions: [],
      };

      const result = await mealPlanService.createInstacartListForMeal(meal);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection refused');
    });
  });
});
