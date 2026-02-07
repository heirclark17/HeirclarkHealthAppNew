/**
 * AI Service Tests
 * Tests AI-powered meal analysis, workout generation, and coaching
 */

import { aiService, NutritionAnalysis } from '../aiService';

// Mock the api module
jest.mock('../api', () => ({
  api: {
    getSavedMeals: jest.fn(),
    saveMeal: jest.fn(),
    deleteSavedMeal: jest.fn(),
  }
}));

// Mock fetch globally
beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

function mockFetch(data: any, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe('AIService - Meal Analysis', () => {
  describe('analyzeMealText', () => {
    it('should analyze meal from text description', async () => {
      const mockResponse = {
        ok: true,
        mealName: 'Grilled Chicken Salad',
        calories: 450,
        protein: 35,
        carbs: 25,
        fat: 20,
        confidence: 0.8,
        foods: [
          { name: 'Chicken Breast', portion: '6 oz', calories: 280, protein: 53, carbs: 0, fat: 6 },
          { name: 'Mixed Greens', portion: '2 cups', calories: 20, protein: 2, carbs: 4, fat: 0 },
        ],
      };

      mockFetch(mockResponse);

      const result = await aiService.analyzeMealText('grilled chicken salad with mixed greens');

      expect(result).toBeDefined();
      expect(result?.mealName).toBe('Grilled Chicken Salad');
      expect(result?.calories).toBe(450);
      expect(result?.protein).toBe(35);
    });

    it('should return null on API error', async () => {
      mockFetch({}, false, 500);

      const result = await aiService.analyzeMealText('test meal');

      expect(result).toBeNull();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await aiService.analyzeMealText('test meal');

      expect(result).toBeNull();
    });
  });

  describe('analyzeMealPhoto', () => {
    it('should analyze meal from photo base64', async () => {
      const mockResponse = {
        ok: true,
        mealName: 'Burger and Fries',
        calories: 850,
        protein: 30,
        carbs: 80,
        fat: 45,
        confidence: 0.75,
        foods: [],
      };

      mockFetch(mockResponse);

      const result = await aiService.analyzeMealPhoto('base64encodedimage', 'image/jpeg');

      expect(result).toBeDefined();
      expect(result?.mealName).toBe('Burger and Fries');
      expect(result?.calories).toBe(850);
    });

    it('should handle file URI format', async () => {
      const mockResponse = { ok: true, mealName: 'Pizza', calories: 600, protein: 25, carbs: 70, fat: 22, confidence: 0.9, foods: [] };

      mockFetch(mockResponse);

      const result = await aiService.analyzeMealPhoto('file:///path/to/image.jpg', 'image/jpeg');

      expect(result).toBeDefined();
    });

    it('should return null on failure', async () => {
      mockFetch({}, false, 400);

      const result = await aiService.analyzeMealPhoto('invalid', 'image/jpeg');

      expect(result).toBeNull();
    });
  });

  describe('lookupBarcode', () => {
    it('should lookup food by barcode successfully', async () => {
      const mockResponse = {
        status: 1,
        product: {
          product_name: 'Protein Bar',
          serving_quantity: 60,
          nutriments: {
            'energy-kcal_100g': 350,
            proteins_100g: 25,
            carbohydrates_100g: 40,
            fat_100g: 10,
          },
          image_front_url: 'https://example.com/image.jpg',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await aiService.lookupBarcode('123456789');

      expect(result).toBeDefined();
      expect(result?.mealName).toBe('Protein Bar');
      expect(result?.confidence).toBe('high');
      expect(result?.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should return null for product not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0 }),
      });

      const result = await aiService.lookupBarcode('999999999');

      expect(result).toBeNull();
    });
  });

  describe('transcribeVoice', () => {
    it('should transcribe voice audio successfully', async () => {
      const mockResponse = {
        ok: true,
        text: 'I had a chicken salad for lunch',
      };

      mockFetch(mockResponse);

      const result = await aiService.transcribeVoice('file:///audio.m4a');

      expect(result).toBe('I had a chicken salad for lunch');
    });

    it('should return null on transcription failure', async () => {
      mockFetch({}, false, 500);

      const result = await aiService.transcribeVoice('file:///audio.m4a');

      expect(result).toBeNull();
    });
  });
});

describe('AIService - Meal Plan Generation', () => {
  describe('generateAIMealPlan', () => {
    it('should generate AI meal plan successfully', async () => {
      const mockResponse = {
        success: true,
        weeklyPlan: [
          {
            dayName: 'Monday',
            dayIndex: 0,
            meals: [
              { mealType: 'breakfast', name: 'Oatmeal', calories: 350, protein: 12, carbs: 55, fat: 8 },
            ],
          },
        ],
        generatedAt: '2026-02-06T12:00:00Z',
      };

      mockFetch(mockResponse);

      const preferences = {
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 200,
        dailyFat: 65,
        dietStyle: 'balanced',
        allergies: [],
      };

      const result = await aiService.generateAIMealPlan(preferences, 7);

      expect(result).toBeDefined();
      expect(result?.days).toHaveLength(1);
      expect(result?.days[0].meals).toHaveLength(1);
    });

    it('should return null on timeout', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: false,
          status: 500
        }), 300000))
      );

      const promise = aiService.generateAIMealPlan({ dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 }, 7);

      // Advance past the 200s timeout defined in the service
      jest.advanceTimersByTime(201000);

      await Promise.resolve(); // Allow promises to resolve

      const result = await promise;

      expect(result).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('getRecipeDetails', () => {
    it('should fetch recipe details successfully', async () => {
      const mockResponse = {
        ok: true,
        recipe: {
          ingredients: [
            { name: 'Chicken', quantity: 6, unit: 'oz' },
            { name: 'Rice', quantity: 1, unit: 'cup' },
          ],
          instructions: ['Cook chicken', 'Prepare rice', 'Serve together'],
          prepMinutes: 10,
          cookMinutes: 25,
          tips: 'Season well for best flavor',
        },
      };

      mockFetch(mockResponse);

      const result = await aiService.getRecipeDetails('Chicken and Rice', 'dinner', 500);

      expect(result).toBeDefined();
      expect(result?.ingredients).toHaveLength(2);
      expect(result?.instructions).toHaveLength(3);
      expect(result?.prepMinutes).toBe(10);
    });

    it('should return null on failure', async () => {
      mockFetch({}, false, 404);

      const result = await aiService.getRecipeDetails('Unknown Meal');

      expect(result).toBeNull();
    });
  });
});

describe('AIService - Saved Meals', () => {
  describe('getSavedMeals', () => {
    it('should fetch saved meals from backend', async () => {
      const mockBackendMeals = [
        { id: 'meal1', mealName: 'Favorite Breakfast', calories: 400, protein: 20, carbs: 50, fat: 12, useCount: 5 },
      ];

      // Mock API call
      const { api } = require('../api');
      (api.getSavedMeals as jest.Mock).mockResolvedValue(mockBackendMeals);

      const result = await aiService.getSavedMeals();

      expect(result).toHaveLength(1);
      expect(result[0].meal.name).toBe('Favorite Breakfast');
    });

    it('should fallback to local storage on backend error', async () => {
      const { api } = require('../api');
      (api.getSavedMeals as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Clear any existing data first
      await AsyncStorage.clear();

      const result = await aiService.getSavedMeals();

      expect(result).toEqual([]);
    });
  });

  describe('saveMeal', () => {
    it('should save meal locally and sync to backend', async () => {
      const meal = {
        id: 'meal123',
        name: 'New Meal',
        mealType: 'lunch',
        description: 'Delicious meal',
        nutrients: { calories: 500, protein_g: 30, carbs_g: 50, fat_g: 15 },
        prepTimeMinutes: 20,
        ingredients: [],
        tags: [],
      };

      // Mock API
      const { api } = require('../api');
      (api.getSavedMeals as jest.Mock).mockResolvedValue([]);
      (api.saveMeal as jest.Mock).mockResolvedValue({ id: 'backend123', mealName: 'New Meal', calories: 500, protein: 30, carbs: 50, fat: 15 });

      const result = await aiService.saveMeal(meal);

      expect(result).toBeDefined();
      // The ID gets updated after backend sync returns
      expect(result?.id).toBe('backend123');
    });
  });
});

describe('AIService - Cheat Day Guidance', () => {
  describe('generateCheatDayGuidance', () => {
    it('should generate cheat day guidance', async () => {
      const mockResponse = {
        success: true,
        guidance: {
          greeting: 'Happy Friday!',
          encouragement: 'Enjoy your day!',
          mindfulTips: ['Tip 1', 'Tip 2'],
          hydrationReminder: 'Drink water',
          balanceTip: 'Get back on track tomorrow',
          motivationalQuote: 'Balance is key',
        },
      };

      mockFetch(mockResponse);

      const result = await aiService.generateCheatDayGuidance('Friday', { goalType: 'lose_weight', dailyCalories: 2000 });

      expect(result).toBeDefined();
      expect(result?.greeting).toBe('Happy Friday!');
      expect(result?.mindfulTips).toHaveLength(2);
    });

    it('should use fallback guidance on error', async () => {
      mockFetch({}, false, 500);

      const result = await aiService.generateCheatDayGuidance('Saturday');

      expect(result).toBeDefined();
      expect(result?.greeting).toContain('Saturday');
    });
  });
});
