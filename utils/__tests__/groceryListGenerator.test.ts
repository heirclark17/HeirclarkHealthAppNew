// Tests for Grocery List Generator

import { generateGroceryList } from '../groceryListGenerator';
import { DayPlan, Ingredient } from '../../types/mealPlan';

describe('generateGroceryList', () => {
  // Helper to create a minimal meal plan
  function createMealPlan(ingredients: Ingredient[][]): DayPlan[] {
    return ingredients.map((dayIngredients, index) => ({
      dayNumber: index + 1,
      date: `2026-02-${10 + index}`,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index],
      meals: [
        {
          id: `meal-${index}`,
          mealType: 'breakfast' as const,
          name: 'Test Meal',
          description: 'Test',
          prepTime: 10,
          cookTime: 20,
          servings: 1,
          calories: 400,
          protein: 20,
          carbs: 40,
          fat: 15,
          ingredients: dayIngredients,
          instructions: ['Test instruction'],
        },
      ],
      dailyTotals: {
        calories: 400,
        protein: 20,
        carbs: 40,
        fat: 15,
      },
    }));
  }

  test('aggregates duplicate ingredients with same unit', () => {
    // Day 1: 2 cups milk
    // Day 2: 1 cup milk
    // Expected: 3 cups milk
    const plan = createMealPlan([
      [{ name: 'Milk', amount: '2', unit: 'cup' }],
      [{ name: 'Milk', amount: '1', unit: 'cup' }],
    ]);

    const result = generateGroceryList(plan);

    // Find the Dairy category
    const dairyCategory = result.find(cat => cat.category === 'Dairy');
    expect(dairyCategory).toBeDefined();

    // Find milk item
    const milkItem = dairyCategory!.items.find(item => item.name === 'milk');
    expect(milkItem).toBeDefined();
    expect(milkItem!.totalAmount).toBe('3');
    expect(milkItem!.unit).toBe('cup');
  });

  test('keeps separate items with different units', () => {
    // Day 1: 2 cups milk
    // Day 2: 500 ml milk
    // Expected: Two separate milk entries
    const plan = createMealPlan([
      [{ name: 'Milk', amount: '2', unit: 'cup' }],
      [{ name: 'Milk', amount: '500', unit: 'ml' }],
    ]);

    const result = generateGroceryList(plan);

    const dairyCategory = result.find(cat => cat.category === 'Dairy');
    expect(dairyCategory).toBeDefined();

    const milkItems = dairyCategory!.items.filter(item => item.name === 'milk');
    expect(milkItems).toHaveLength(2);

    // Check both units exist
    const cupMilk = milkItems.find(item => item.unit === 'cup');
    const mlMilk = milkItems.find(item => item.unit === 'ml');
    expect(cupMilk).toBeDefined();
    expect(mlMilk).toBeDefined();
  });

  test('categorizes ingredients correctly', () => {
    const plan = createMealPlan([
      [
        { name: 'Chicken Breast', amount: '2', unit: 'lb' },
        { name: 'Lettuce', amount: '1', unit: 'head' },
        { name: 'Milk', amount: '2', unit: 'cup' },
        { name: 'Rice', amount: '1', unit: 'cup' },
        { name: 'Salt', amount: '1', unit: 'tsp' },
        { name: 'Olive Oil', amount: '2', unit: 'tbsp' },
      ],
    ]);

    const result = generateGroceryList(plan);

    // Check all categories are present
    const categories = result.map(cat => cat.category);
    expect(categories).toContain('Protein');
    expect(categories).toContain('Produce');
    expect(categories).toContain('Dairy');
    expect(categories).toContain('Grains');
    expect(categories).toContain('Spices');
    expect(categories).toContain('Pantry');

    // Verify specific items are in correct categories
    const protein = result.find(cat => cat.category === 'Protein');
    expect(protein!.items.some(item => item.name === 'chicken breast')).toBe(true);

    const produce = result.find(cat => cat.category === 'Produce');
    expect(produce!.items.some(item => item.name === 'lettuce')).toBe(true);

    const dairy = result.find(cat => cat.category === 'Dairy');
    expect(dairy!.items.some(item => item.name === 'milk')).toBe(true);

    const grains = result.find(cat => cat.category === 'Grains');
    expect(grains!.items.some(item => item.name === 'rice')).toBe(true);

    const spices = result.find(cat => cat.category === 'Spices');
    expect(spices!.items.some(item => item.name === 'salt')).toBe(true);

    const pantry = result.find(cat => cat.category === 'Pantry');
    expect(pantry!.items.some(item => item.name === 'olive oil')).toBe(true);
  });

  test('handles empty meal plan', () => {
    const result = generateGroceryList([]);
    expect(result).toEqual([]);
  });

  test('normalizes ingredient names', () => {
    // Different capitalization should aggregate
    const plan = createMealPlan([
      [{ name: 'Chicken Breast', amount: '1', unit: 'lb' }],
      [{ name: 'chicken breast', amount: '2', unit: 'lb' }],
      [{ name: '  CHICKEN BREAST  ', amount: '1.5', unit: 'lb' }],
    ]);

    const result = generateGroceryList(plan);

    const protein = result.find(cat => cat.category === 'Protein');
    expect(protein).toBeDefined();

    const chickenItems = protein!.items.filter(item => item.name === 'chicken breast');
    expect(chickenItems).toHaveLength(1);
    expect(chickenItems[0].totalAmount).toBe('4.5'); // 1 + 2 + 1.5
  });

  test('handles meals with no ingredients', () => {
    const plan: DayPlan[] = [
      {
        dayNumber: 1,
        date: '2026-02-10',
        dayName: 'Sunday',
        meals: [
          {
            id: 'meal-1',
            mealType: 'breakfast',
            name: 'Test Meal',
            description: 'Test',
            prepTime: 10,
            cookTime: 20,
            servings: 1,
            calories: 400,
            protein: 20,
            carbs: 40,
            fat: 15,
            ingredients: [], // No ingredients
            instructions: ['Test'],
          },
        ],
        dailyTotals: { calories: 400, protein: 20, carbs: 40, fat: 15 },
      },
    ];

    const result = generateGroceryList(plan);
    expect(result).toEqual([]);
  });

  test('handles decimal amounts correctly', () => {
    const plan = createMealPlan([
      [{ name: 'Olive Oil', amount: '1.5', unit: 'tbsp' }],
      [{ name: 'Olive Oil', amount: '2.5', unit: 'tbsp' }],
    ]);

    const result = generateGroceryList(plan);

    const pantry = result.find(cat => cat.category === 'Pantry');
    expect(pantry).toBeDefined();

    const oilItem = pantry!.items.find(item => item.name === 'olive oil');
    expect(oilItem).toBeDefined();
    expect(oilItem!.totalAmount).toBe('4'); // 1.5 + 2.5 = 4.0 -> 4
  });

  test('handles fraction amounts as fallback', () => {
    // Non-numeric amounts should concatenate
    const plan = createMealPlan([
      [{ name: 'Flour', amount: '1/2', unit: 'cup' }],
      [{ name: 'Flour', amount: '1/4', unit: 'cup' }],
    ]);

    const result = generateGroceryList(plan);

    const grains = result.find(cat => cat.category === 'Grains');
    expect(grains).toBeDefined();

    const flourItem = grains!.items.find(item => item.name === 'flour');
    expect(flourItem).toBeDefined();
    expect(flourItem!.totalAmount).toBe('1/2, 1/4'); // Concatenated
  });

  test('preserves existing category from ingredient data', () => {
    const plan = createMealPlan([
      [{ name: 'Custom Item', amount: '1', unit: 'each', category: 'Produce' }],
    ]);

    const result = generateGroceryList(plan);

    const produce = result.find(cat => cat.category === 'Produce');
    expect(produce).toBeDefined();
    expect(produce!.items.some(item => item.name === 'custom item')).toBe(true);
  });

  test('default unit is "each" when missing', () => {
    const plan = createMealPlan([
      [{ name: 'Banana', amount: '3', unit: '' }],
    ]);

    const result = generateGroceryList(plan);

    const produce = result.find(cat => cat.category === 'Produce');
    expect(produce).toBeDefined();

    const bananaItem = produce!.items.find(item => item.name === 'banana');
    expect(bananaItem).toBeDefined();
    expect(bananaItem!.unit).toBe('each');
  });

  test('categories are sorted in priority order', () => {
    const plan = createMealPlan([
      [
        { name: 'Unknown Item', amount: '1', unit: 'each' }, // Other
        { name: 'Salt', amount: '1', unit: 'tsp' }, // Spices
        { name: 'Oil', amount: '1', unit: 'tbsp' }, // Pantry
        { name: 'Rice', amount: '1', unit: 'cup' }, // Grains
        { name: 'Milk', amount: '1', unit: 'cup' }, // Dairy
        { name: 'Chicken', amount: '1', unit: 'lb' }, // Protein
        { name: 'Lettuce', amount: '1', unit: 'head' }, // Produce
      ],
    ]);

    const result = generateGroceryList(plan);

    const categoryOrder = result.map(cat => cat.category);
    const expectedOrder = ['Produce', 'Protein', 'Dairy', 'Grains', 'Pantry', 'Spices', 'Other'];

    // Check that categories appear in expected order
    let lastIndex = -1;
    categoryOrder.forEach(category => {
      const currentIndex = expectedOrder.indexOf(category);
      expect(currentIndex).toBeGreaterThan(lastIndex);
      lastIndex = currentIndex;
    });
  });

  test('all items have checked: false by default', () => {
    const plan = createMealPlan([
      [{ name: 'Milk', amount: '1', unit: 'cup' }],
    ]);

    const result = generateGroceryList(plan);

    result.forEach(category => {
      category.items.forEach(item => {
        expect(item.checked).toBe(false);
      });
    });
  });
});
