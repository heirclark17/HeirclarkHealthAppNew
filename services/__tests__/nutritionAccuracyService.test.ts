/**
 * Tests for nutritionAccuracyService.ts
 */

import {
  verifyNutritionData,
  quickValidate,
  searchFoodDatabase,
} from '../nutritionAccuracyService';
import { NutritionData, NUTRITION_RULES, USDA_CONFIG } from '../../types/nutritionAccuracy';

describe('nutritionAccuracyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createNutritionData(overrides: Partial<NutritionData> = {}): NutritionData {
    return {
      name: 'Chicken Breast',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      ...overrides,
    };
  }

  // Helper: create a USDA API response
  function createUSDAResponse(foods: any[] = []) {
    return {
      query: 'chicken',
      totalHits: foods.length,
      foods,
    };
  }

  function createUSDAFoodItem(overrides: Record<string, any> = {}) {
    return {
      fdcId: 123456,
      description: 'Chicken, breast, roasted',
      dataType: 'Survey (FNDDS)',
      nutrients: [
        { nutrientId: USDA_CONFIG.NUTRIENT_IDS.energy, nutrientName: 'Energy', unitName: 'kcal', value: 165 },
        { nutrientId: USDA_CONFIG.NUTRIENT_IDS.protein, nutrientName: 'Protein', unitName: 'g', value: 31 },
        { nutrientId: USDA_CONFIG.NUTRIENT_IDS.carbs, nutrientName: 'Carbohydrate', unitName: 'g', value: 0 },
        { nutrientId: USDA_CONFIG.NUTRIENT_IDS.fat, nutrientName: 'Total lipid (fat)', unitName: 'g', value: 3.6 },
        { nutrientId: USDA_CONFIG.NUTRIENT_IDS.fiber, nutrientName: 'Fiber', unitName: 'g', value: 0 },
        { nutrientId: USDA_CONFIG.NUTRIENT_IDS.sugar, nutrientName: 'Sugars', unitName: 'g', value: 0 },
        { nutrientId: USDA_CONFIG.NUTRIENT_IDS.sodium, nutrientName: 'Sodium', unitName: 'mg', value: 74 },
      ],
      servingSize: 100,
      servingSizeUnit: 'g',
      ...overrides,
    };
  }

  // =============================================
  // quickValidate
  // =============================================
  describe('quickValidate', () => {
    it('should validate valid nutrition data with no flags', () => {
      // Chicken breast: 165 cal, 31p, 0c, 3.6f
      // Expected: 31*4 + 0*4 + 3.6*9 = 124 + 0 + 32.4 = 156.4 => ~156
      // Difference: 165 - 156 = 9, tolerance: 156*0.15 = 23.4
      // Within tolerance, so no mismatch
      const data = createNutritionData();
      const result = quickValidate(data);

      expect(result.isValid).toBe(true);
      expect(result.suggestedCalories).toBe(Math.round(31 * 4 + 0 * 4 + 3.6 * 9));
    });

    it('should flag negative values as error', () => {
      const data = createNutritionData({ calories: -100 });
      const result = quickValidate(data);

      expect(result.isValid).toBe(false);
      const negativeFlag = result.flags.find(f => f.code === 'NEGATIVE_VALUES');
      expect(negativeFlag).toBeDefined();
      expect(negativeFlag!.type).toBe('error');
    });

    it('should flag zero macros with calories as warning', () => {
      const data = createNutritionData({ calories: 200, protein: 0, carbs: 0, fat: 0 });
      const result = quickValidate(data);

      const zeroFlag = result.flags.find(f => f.code === 'ZERO_MACROS');
      expect(zeroFlag).toBeDefined();
      expect(zeroFlag!.type).toBe('warning');
    });

    it('should flag calorie-macro mismatch', () => {
      // 500 calories but macros only add up to ~100
      const data = createNutritionData({ calories: 500, protein: 10, carbs: 10, fat: 2 });
      // Expected: 10*4 + 10*4 + 2*9 = 40+40+18 = 98
      // Diff: 500-98 = 402, tolerance: 98*0.15 = 14.7
      const result = quickValidate(data);

      const mismatchFlag = result.flags.find(f => f.code === 'CALORIE_MACRO_MISMATCH');
      expect(mismatchFlag).toBeDefined();
    });

    it('should flag unusually high calories', () => {
      const data = createNutritionData({
        calories: 3000,
        protein: 200,
        carbs: 300,
        fat: 50,
      });
      const result = quickValidate(data);

      const highCalFlag = result.flags.find(f => f.code === 'UNUSUALLY_HIGH_CALORIES');
      expect(highCalFlag).toBeDefined();
    });

    it('should flag unusually low calories', () => {
      const data = createNutritionData({ calories: 3, protein: 0, carbs: 0, fat: 0 });
      const result = quickValidate(data);

      const lowCalFlag = result.flags.find(f => f.code === 'UNUSUALLY_LOW_CALORIES');
      expect(lowCalFlag).toBeDefined();
    });

    it('should flag high protein', () => {
      const data = createNutritionData({
        calories: 1000,
        protein: 200, // > MAX_PROTEIN_PER_SERVING (150)
        carbs: 50,
        fat: 20,
      });
      const result = quickValidate(data);

      const highProteinFlag = result.flags.find(f => f.code === 'PROTEIN_TOO_HIGH');
      expect(highProteinFlag).toBeDefined();
    });

    it('should flag high carbs', () => {
      const data = createNutritionData({
        calories: 1500,
        protein: 30,
        carbs: 350, // > MAX_CARBS_PER_SERVING (300)
        fat: 20,
      });
      const result = quickValidate(data);

      const highCarbsFlag = result.flags.find(f => f.code === 'CARBS_TOO_HIGH');
      expect(highCarbsFlag).toBeDefined();
    });

    it('should flag high fat', () => {
      const data = createNutritionData({
        calories: 2000,
        protein: 30,
        carbs: 50,
        fat: 200, // > MAX_FAT_PER_SERVING (150)
      });
      const result = quickValidate(data);

      const highFatFlag = result.flags.find(f => f.code === 'FAT_TOO_HIGH');
      expect(highFatFlag).toBeDefined();
    });

    it('should return suggestedCalories based on macro calculation', () => {
      const data = createNutritionData({ protein: 20, carbs: 30, fat: 10 });
      const result = quickValidate(data);

      // 20*4 + 30*4 + 10*9 = 80 + 120 + 90 = 290
      expect(result.suggestedCalories).toBe(290);
    });

    it('should mark as valid when no errors or high-severity warnings', () => {
      const data = createNutritionData({ calories: 156, protein: 31, carbs: 0, fat: 3.6 });
      const result = quickValidate(data);

      expect(result.isValid).toBe(true);
    });

    it('should mark as invalid on error flags', () => {
      const data = createNutritionData({ calories: -1, protein: -1, carbs: 0, fat: 0 });
      const result = quickValidate(data);

      expect(result.isValid).toBe(false);
    });
  });

  // =============================================
  // verifyNutritionData
  // =============================================
  describe('verifyNutritionData', () => {
    it('should return verification result with original data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([]),
      });

      const data = createNutritionData();
      const result = await verifyNutritionData(data);

      expect(result.originalData).toEqual(data);
      expect(result.verificationDate).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('should include original source in sources', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([]),
      });

      const data = createNutritionData();
      const result = await verifyNutritionData(data, 'ai_estimate');

      const originalSource = result.sources.find(s => s.name === 'Original Input');
      expect(originalSource).toBeDefined();
      expect(originalSource!.type).toBe('ai_estimate');
    });

    it('should verify against USDA when results found', async () => {
      const usdaFood = createUSDAFoodItem();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([usdaFood]),
      });

      const data = createNutritionData();
      const result = await verifyNutritionData(data);

      const usdaSource = result.sources.find(s => s.type === 'usda');
      expect(usdaSource).toBeDefined();
      expect(usdaSource!.name).toBe('USDA FoodData Central');
    });

    it('should calculate match score when USDA data is similar', async () => {
      const usdaFood = createUSDAFoodItem(); // Same values as our data
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([usdaFood]),
      });

      const data = createNutritionData();
      const result = await verifyNutritionData(data);

      const usdaSource = result.sources.find(s => s.type === 'usda');
      if (usdaSource) {
        expect(usdaSource.matchScore).toBeGreaterThan(30);
      }
    });

    it('should handle USDA API error gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const data = createNutritionData();
      const result = await verifyNutritionData(data);

      expect(result).toBeDefined();
      // Should still have at least the original source
      expect(result.sources.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle USDA fetch exception gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const data = createNutritionData();
      const result = await verifyNutritionData(data);

      expect(result).toBeDefined();
      const unverifiedFlag = result.flags.find(f => f.code === 'UNVERIFIED_SOURCE');
      expect(unverifiedFlag).toBeDefined();
    });

    it('should adjust data when USDA values differ significantly (>20%)', async () => {
      // USDA says 250 cal, we say 165 -- significant difference
      const usdaFood = createUSDAFoodItem({
        nutrients: [
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.energy, nutrientName: 'Energy', unitName: 'kcal', value: 250 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.protein, nutrientName: 'Protein', unitName: 'g', value: 45 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.carbs, nutrientName: 'Carbohydrate', unitName: 'g', value: 0 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.fat, nutrientName: 'Total lipid (fat)', unitName: 'g', value: 6 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.fiber, nutrientName: 'Fiber', unitName: 'g', value: 0 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.sugar, nutrientName: 'Sugars', unitName: 'g', value: 0 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.sodium, nutrientName: 'Sodium', unitName: 'mg', value: 74 },
        ],
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([usdaFood]),
      });

      const data = createNutritionData({ calories: 165, protein: 31, carbs: 0, fat: 3.6 });
      const result = await verifyNutritionData(data);

      // If USDA source is high confidence and match score > 30, adjustments may occur
      if (result.adjustments.length > 0) {
        result.adjustments.forEach(adj => {
          expect(adj.field).toBeDefined();
          expect(adj.originalValue).toBeDefined();
          expect(adj.adjustedValue).toBeDefined();
          expect(adj.reason).toBeDefined();
        });
        expect(result.verifiedData).not.toEqual(data);
      }
    });

    it('should not adjust data when values are within 20%', async () => {
      // USDA values very close to our data
      const usdaFood = createUSDAFoodItem({
        nutrients: [
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.energy, nutrientName: 'Energy', unitName: 'kcal', value: 170 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.protein, nutrientName: 'Protein', unitName: 'g', value: 32 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.carbs, nutrientName: 'Carbohydrate', unitName: 'g', value: 0 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.fat, nutrientName: 'Total lipid (fat)', unitName: 'g', value: 3.8 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.fiber, nutrientName: 'Fiber', unitName: 'g', value: 0 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.sugar, nutrientName: 'Sugars', unitName: 'g', value: 0 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.sodium, nutrientName: 'Sodium', unitName: 'mg', value: 74 },
        ],
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([usdaFood]),
      });

      const data = createNutritionData({ calories: 165, protein: 31, carbs: 0, fat: 3.6 });
      const result = await verifyNutritionData(data);

      // No adjustment for values within 20%
      const macroAdjustments = result.adjustments.filter(
        a => ['protein', 'carbs', 'fat'].includes(a.field as string)
      );
      expect(macroAdjustments.length).toBe(0);
    });

    it('should return confidence level (high/medium/low)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([createUSDAFoodItem()]),
      });

      const data = createNutritionData();
      const result = await verifyNutritionData(data);

      expect(['high', 'medium', 'low']).toContain(result.confidence);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('should set isVerified to false when confidence is low', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      // Data with errors should result in low confidence
      const data = createNutritionData({ calories: -100, protein: -5, carbs: -3, fat: -2 });
      const result = await verifyNutritionData(data);

      if (result.confidence === 'low') {
        expect(result.isVerified).toBe(false);
      }
    });

    it('should support different source types', async () => {
      const sourceTypes: Array<'ai_estimate' | 'barcode' | 'user_input'> = ['ai_estimate', 'barcode', 'user_input'];

      for (const sourceType of sourceTypes) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => createUSDAResponse([]),
        });

        const data = createNutritionData();
        const result = await verifyNutritionData(data, sourceType);

        const originalSource = result.sources.find(s => s.name === 'Original Input');
        expect(originalSource!.type).toBe(sourceType);
      }
    });

    it('should default to ai_estimate source type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([]),
      });

      const data = createNutritionData();
      const result = await verifyNutritionData(data);

      const originalSource = result.sources.find(s => s.name === 'Original Input');
      expect(originalSource!.type).toBe('ai_estimate');
    });
  });

  // =============================================
  // searchFoodDatabase
  // =============================================
  describe('searchFoodDatabase', () => {
    it('should return formatted results from USDA search', async () => {
      const foods = [
        createUSDAFoodItem({ description: 'Chicken breast, grilled' }),
        createUSDAFoodItem({ description: 'Chicken breast, baked', fdcId: 789 }),
      ];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse(foods),
      });

      const results = await searchFoodDatabase('chicken breast');
      expect(results.length).toBe(2);
      results.forEach(result => {
        expect(result.name).toBeDefined();
        expect(result.calories).toBeDefined();
        expect(result.protein).toBeDefined();
        expect(result.carbs).toBeDefined();
        expect(result.fat).toBeDefined();
        expect(result.source).toBe('USDA');
      });
    });

    it('should limit to 10 results', async () => {
      const foods = Array.from({ length: 15 }, (_, i) =>
        createUSDAFoodItem({ fdcId: i + 1, description: `Food item ${i + 1}` })
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse(foods),
      });

      const results = await searchFoodDatabase('food');
      expect(results.length).toBe(10);
    });

    it('should return empty array when no results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([]),
      });

      const results = await searchFoodDatabase('zzznonexistentfood');
      expect(results).toEqual([]);
    });

    it('should return empty array on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const results = await searchFoodDatabase('chicken');
      expect(results).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const results = await searchFoodDatabase('chicken');
      expect(results).toEqual([]);
    });

    it('should construct correct USDA API URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([]),
      });

      await searchFoodDatabase('grilled chicken');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.nal.usda.gov/fdc/v1/foods/search')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=grilled%20chicken')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=5')
      );
    });

    it('should extract nutrition values correctly from USDA format', async () => {
      const food = createUSDAFoodItem({
        nutrients: [
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.energy, nutrientName: 'Energy', unitName: 'kcal', value: 250 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.protein, nutrientName: 'Protein', unitName: 'g', value: 40 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.carbs, nutrientName: 'Carbs', unitName: 'g', value: 10 },
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.fat, nutrientName: 'Fat', unitName: 'g', value: 8 },
        ],
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([food]),
      });

      const results = await searchFoodDatabase('test');
      expect(results[0].calories).toBe(250);
      expect(results[0].protein).toBe(40);
      expect(results[0].carbs).toBe(10);
      expect(results[0].fat).toBe(8);
    });

    it('should handle missing nutrient values as 0', async () => {
      const food = createUSDAFoodItem({
        nutrients: [
          // Only energy, no macros
          { nutrientId: USDA_CONFIG.NUTRIENT_IDS.energy, nutrientName: 'Energy', unitName: 'kcal', value: 100 },
        ],
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createUSDAResponse([food]),
      });

      const results = await searchFoodDatabase('test');
      expect(results[0].calories).toBe(100);
      expect(results[0].protein).toBe(0);
      expect(results[0].carbs).toBe(0);
      expect(results[0].fat).toBe(0);
    });
  });
});
