// Grocery List Generator - Aggregates ingredients from 7-day meal plan

import { DayPlan, GroceryCategory, GroceryItem, Ingredient } from '../types/mealPlan';

/**
 * Generates a categorized grocery list from a weekly meal plan
 *
 * Algorithm:
 * 1. Extract all ingredients from all meals across all days
 * 2. Normalize ingredient names (lowercase, trim)
 * 3. Aggregate ingredients by name+unit (e.g., "2 cups milk" + "1 cup milk" = "3 cups milk")
 * 4. Categorize ingredients by food type (Produce, Protein, Dairy, etc.)
 * 5. Return categorized list ready for display
 *
 * @param weeklyPlan - Array of 7 DayPlan objects containing meals
 * @returns Categorized grocery list with aggregated quantities
 */
export function generateGroceryList(weeklyPlan: DayPlan[]): GroceryCategory[] {
  if (!weeklyPlan || weeklyPlan.length === 0) {
    console.log('[GroceryListGenerator] Empty meal plan provided');
    return [];
  }

  // Step 1: Extract all ingredients from all meals
  const allIngredients = extractIngredientsFromMealPlan(weeklyPlan);

  if (allIngredients.length === 0) {
    console.log('[GroceryListGenerator] No ingredients found in meal plan');
    return [];
  }

  // Step 2 & 3: Normalize and aggregate ingredients
  const aggregatedIngredients = aggregateByName(allIngredients);

  // Step 4: Categorize ingredients
  const categorizedList = categorizeIngredients(aggregatedIngredients);

  console.log('[GroceryListGenerator] ✅ Generated grocery list:', {
    totalIngredients: allIngredients.length,
    uniqueItems: aggregatedIngredients.length,
    categories: categorizedList.length,
  });

  return categorizedList;
}

/**
 * Extract all ingredients from weekly meal plan
 */
function extractIngredientsFromMealPlan(weeklyPlan: DayPlan[]): Ingredient[] {
  const ingredients: Ingredient[] = [];

  weeklyPlan.forEach((day) => {
    if (!day.meals || day.meals.length === 0) return;

    day.meals.forEach((meal) => {
      if (!meal.ingredients || meal.ingredients.length === 0) return;

      meal.ingredients.forEach((ingredient) => {
        if (ingredient && ingredient.name) {
          ingredients.push(ingredient);
        }
      });
    });
  });

  return ingredients;
}

/**
 * Aggregate ingredients with same name and unit
 * Example: "milk, 2, cup" + "milk, 1, cup" = "milk, 3, cup"
 */
function aggregateByName(ingredients: Ingredient[]): AggregatedIngredient[] {
  const ingredientMap = new Map<string, AggregatedIngredient>();

  ingredients.forEach((ingredient) => {
    // Normalize name: lowercase, trim whitespace
    const normalizedName = normalizeIngredientName(ingredient.name);
    const unit = ingredient.unit?.toLowerCase().trim() || 'each';

    // Create unique key: name + unit (so "milk cups" and "milk ml" stay separate)
    const key = `${normalizedName}::${unit}`;

    if (ingredientMap.has(key)) {
      // Ingredient exists - add to quantity
      const existing = ingredientMap.get(key)!;
      existing.totalAmount = addAmounts(existing.totalAmount, ingredient.amount);
    } else {
      // New ingredient - add to map
      ingredientMap.set(key, {
        name: normalizedName,
        totalAmount: ingredient.amount || '1',
        unit: unit,
        category: ingredient.category || '',
      });
    }
  });

  return Array.from(ingredientMap.values());
}

/**
 * Normalize ingredient name for consistent aggregation
 * "Chicken Breast" -> "chicken breast"
 * "  Tomatoes  " -> "tomatoes"
 */
function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Add two amount strings together
 * Attempts numeric addition, falls back to concatenation
 *
 * Examples:
 * - addAmounts("2", "1") -> "3"
 * - addAmounts("1.5", "0.5") -> "2"
 * - addAmounts("1/2", "1/4") -> "1/2, 1/4" (fallback)
 */
function addAmounts(amount1: string, amount2: string): string {
  const num1 = parseFloat(amount1);
  const num2 = parseFloat(amount2);

  // If both are valid numbers, add them
  if (!isNaN(num1) && !isNaN(num2)) {
    const sum = num1 + num2;
    // Format to 1 decimal place if needed, otherwise integer
    return sum % 1 === 0 ? sum.toString() : sum.toFixed(1);
  }

  // Fallback: concatenate (e.g., fractions like "1/2")
  return `${amount1}, ${amount2}`;
}

/**
 * Categorize ingredients into food groups
 */
function categorizeIngredients(ingredients: AggregatedIngredient[]): GroceryCategory[] {
  const categories: Record<string, GroceryItem[]> = {
    Produce: [],
    Protein: [],
    Dairy: [],
    Grains: [],
    Pantry: [],
    Spices: [],
    Other: [],
  };

  ingredients.forEach((ingredient) => {
    // Use existing category if provided, otherwise infer from name
    const category = ingredient.category || inferCategory(ingredient.name);

    if (!categories[category]) {
      categories[category] = [];
    }

    categories[category].push({
      name: ingredient.name,
      totalAmount: ingredient.totalAmount,
      unit: ingredient.unit,
      category: category,
      checked: false,
    });
  });

  // Convert to array and filter out empty categories
  return Object.entries(categories)
    .filter(([_, items]) => items.length > 0)
    .map(([category, items]) => ({
      category,
      items,
    }))
    .sort((a, b) => {
      // Sort categories by importance
      const order = ['Produce', 'Protein', 'Dairy', 'Grains', 'Pantry', 'Spices', 'Other'];
      return order.indexOf(a.category) - order.indexOf(b.category);
    });
}

/**
 * Infer food category from ingredient name using keyword matching
 */
function inferCategory(name: string): string {
  const lowerName = name.toLowerCase();

  // Produce keywords
  const produceKeywords = [
    'lettuce', 'tomato', 'cucumber', 'carrot', 'spinach', 'kale', 'broccoli',
    'cauliflower', 'pepper', 'onion', 'garlic', 'potato', 'sweet potato',
    'avocado', 'apple', 'banana', 'berry', 'orange', 'lemon', 'lime',
    'mushroom', 'zucchini', 'squash', 'celery', 'cabbage', 'arugula',
  ];

  // Protein keywords
  const proteinKeywords = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp',
    'turkey', 'lamb', 'tofu', 'tempeh', 'seitan', 'egg', 'beans',
    'lentils', 'chickpeas', 'edamame', 'steak', 'ground',
  ];

  // Dairy keywords
  const dairyKeywords = [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream',
    'cottage cheese', 'ricotta', 'mozzarella', 'parmesan', 'cheddar',
    'greek yogurt', 'kefir', 'whey',
  ];

  // Grains keywords
  const grainsKeywords = [
    'rice', 'quinoa', 'pasta', 'bread', 'oats', 'barley', 'bulgur',
    'couscous', 'noodles', 'tortilla', 'pita', 'bagel', 'cereal',
    'flour', 'cornmeal', 'polenta', 'farro',
  ];

  // Spices keywords
  const spicesKeywords = [
    'salt', 'pepper', 'garlic powder', 'onion powder', 'paprika',
    'cumin', 'coriander', 'turmeric', 'cinnamon', 'nutmeg', 'ginger',
    'oregano', 'basil', 'thyme', 'rosemary', 'parsley', 'cilantro',
    'chili powder', 'curry', 'bay leaf', 'vanilla', 'cardamom',
  ];

  // Pantry keywords
  const pantryKeywords = [
    'oil', 'vinegar', 'sauce', 'broth', 'stock', 'soy sauce',
    'worcestershire', 'mustard', 'ketchup', 'mayonnaise', 'honey',
    'maple syrup', 'sugar', 'baking', 'canned', 'jar', 'can',
  ];

  // Check each category
  if (produceKeywords.some(keyword => lowerName.includes(keyword))) return 'Produce';
  if (proteinKeywords.some(keyword => lowerName.includes(keyword))) return 'Protein';
  if (dairyKeywords.some(keyword => lowerName.includes(keyword))) return 'Dairy';
  if (grainsKeywords.some(keyword => lowerName.includes(keyword))) return 'Grains';
  if (spicesKeywords.some(keyword => lowerName.includes(keyword))) return 'Spices';
  if (pantryKeywords.some(keyword => lowerName.includes(keyword))) return 'Pantry';

  // Default: Other
  return 'Other';
}

// Internal type for aggregation
interface AggregatedIngredient {
  name: string;
  totalAmount: string;
  unit: string;
  category: string;
}
