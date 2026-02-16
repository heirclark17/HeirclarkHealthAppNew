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

  console.log('[GroceryListGenerator] 📊 Extracting from weekly plan:', {
    totalDays: weeklyPlan.length,
    dayNames: weeklyPlan.map(d => d.dayName),
  });

  weeklyPlan.forEach((day, dayIndex) => {
    if (!day.meals || day.meals.length === 0) {
      console.log(`[GroceryListGenerator] ⚠️ Day ${dayIndex + 1} (${day.dayName}): No meals found`);
      return;
    }

    let dayIngredientsCount = 0;
    day.meals.forEach((meal) => {
      if (!meal.ingredients || meal.ingredients.length === 0) {
        console.log(`[GroceryListGenerator] ⚠️ Day ${dayIndex + 1} (${day.dayName}), ${meal.mealType}: No ingredients`);
        return;
      }

      meal.ingredients.forEach((ingredient) => {
        if (ingredient && ingredient.name) {
          ingredients.push(ingredient);
          dayIngredientsCount++;
        }
      });
    });

    console.log(`[GroceryListGenerator] ✅ Day ${dayIndex + 1} (${day.dayName}): ${dayIngredientsCount} ingredients from ${day.meals.length} meals`);
  });

  console.log('[GroceryListGenerator] 📦 Total ingredients extracted:', ingredients.length);
  return ingredients;
}

/**
 * Normalize unit to standard form
 * Examples:
 * "cups" -> "cup"
 * "tbsp" -> "tablespoon"
 * "tsp" -> "teaspoon"
 */
function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();

  // Unit standardization map
  const unitMap: { [key: string]: string } = {
    'cups': 'cup',
    'c': 'cup',
    'tablespoons': 'tablespoon',
    'tbsp': 'tablespoon',
    'tbs': 'tablespoon',
    't': 'tablespoon',
    'teaspoons': 'teaspoon',
    'tsp': 'teaspoon',
    'ounces': 'ounce',
    'oz': 'ounce',
    'pounds': 'pound',
    'lbs': 'pound',
    'lb': 'pound',
    'grams': 'gram',
    'g': 'gram',
    'kilograms': 'kilogram',
    'kg': 'kilogram',
    'milliliters': 'milliliter',
    'ml': 'milliliter',
    'liters': 'liter',
    'l': 'liter',
    'pieces': 'piece',
    'pcs': 'piece',
    'cloves': 'clove',
    'slices': 'slice',
    'pinches': 'pinch',
    'dashes': 'dash',
    'cans': 'can',
    'packages': 'package',
    'pkg': 'package',
    'bunches': 'bunch',
    'heads': 'head',
    'stalks': 'stalk',
    'sprigs': 'sprig',
  };

  return unitMap[normalized] || normalized || 'each';
}

/**
 * Aggregate ingredients with same name and unit
 * Example: "milk, 2, cup" + "milk, 1, cup" = "milk, 3, cup"
 */
function aggregateByName(ingredients: Ingredient[]): AggregatedIngredient[] {
  const ingredientMap = new Map<string, AggregatedIngredient>();

  console.log('[GroceryListGenerator] 🔄 Starting aggregation for', ingredients.length, 'ingredients');

  ingredients.forEach((ingredient, index) => {
    // Normalize name: lowercase, trim whitespace, remove descriptors, singularize
    const normalizedName = normalizeIngredientName(ingredient.name);
    const normalizedUnit = normalizeUnit(ingredient.unit || 'each');

    // Create unique key: name + unit (so "milk cup" and "milk ml" stay separate)
    const key = `${normalizedName}::${normalizedUnit}`;

    if (ingredientMap.has(key)) {
      // Ingredient exists - add to quantity
      const existing = ingredientMap.get(key)!;
      const oldAmount = existing.totalAmount;
      existing.totalAmount = addAmounts(existing.totalAmount, ingredient.amount);
      console.log(`[GroceryListGenerator] ➕ Aggregating: "${normalizedName}" ${oldAmount} ${normalizedUnit} + ${ingredient.amount} ${normalizedUnit} = ${existing.totalAmount} ${normalizedUnit}`);
    } else {
      // New ingredient - add to map
      ingredientMap.set(key, {
        name: normalizedName,
        totalAmount: ingredient.amount || '1',
        unit: normalizedUnit,
        category: ingredient.category || '',
      });
      console.log(`[GroceryListGenerator] 🆕 New ingredient: "${normalizedName}" ${ingredient.amount} ${normalizedUnit}`);
    }
  });

  const aggregatedList = Array.from(ingredientMap.values());

  console.log('[GroceryListGenerator] ✅ Aggregation complete:', ingredientMap.size, 'unique items');
  console.log('[GroceryListGenerator] 📋 Final aggregated list:');
  aggregatedList.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.name}: ${item.totalAmount} ${item.unit}`);
  });

  return aggregatedList;
}

/**
 * Normalize ingredient name for consistent aggregation
 * Removes plurals, descriptive words, and standardizes variations
 *
 * Examples:
 * "Chicken Breasts" -> "chicken breast"
 * "Fresh Tomatoes, diced" -> "tomato"
 * "Extra Virgin Olive Oil" -> "olive oil"
 */
function normalizeIngredientName(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Remove common descriptive words
  const descriptors = [
    'fresh', 'dried', 'frozen', 'canned', 'cooked', 'raw',
    'chopped', 'diced', 'sliced', 'minced', 'crushed', 'grated',
    'whole', 'large', 'small', 'medium', 'ripe', 'unripe',
    'organic', 'extra virgin', 'virgin', 'light', 'dark',
    'boneless', 'skinless', 'peeled', 'seeded',
    'to taste', 'optional', 'for serving', 'for garnish',
  ];

  // Remove descriptors (word boundaries to avoid partial matches)
  descriptors.forEach(descriptor => {
    const regex = new RegExp(`\\b${descriptor}\\b,?\\s*`, 'gi');
    normalized = normalized.replace(regex, '');
  });

  // Remove commas and extra spaces
  normalized = normalized.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

  // Singularize common plurals
  const pluralMap: { [key: string]: string } = {
    'tomatoes': 'tomato',
    'potatoes': 'potato',
    'onions': 'onion',
    'peppers': 'pepper',
    'carrots': 'carrot',
    'mushrooms': 'mushroom',
    'berries': 'berry',
    'strawberries': 'strawberry',
    'blueberries': 'blueberry',
    'apples': 'apple',
    'bananas': 'banana',
    'oranges': 'orange',
    'lemons': 'lemon',
    'limes': 'lime',
    'avocados': 'avocado',
    'beans': 'bean',
    'peas': 'pea',
    'eggs': 'egg',
    'breasts': 'breast',
    'thighs': 'thigh',
    'cloves': 'clove',
    'leaves': 'leaf',
    'stalks': 'stalk',
  };

  // Check for exact plural matches first
  if (pluralMap[normalized]) {
    normalized = pluralMap[normalized];
  } else {
    // Handle multi-word ingredients (e.g., "chicken breasts" -> "chicken breast")
    const words = normalized.split(' ');
    const lastWord = words[words.length - 1];
    if (pluralMap[lastWord]) {
      words[words.length - 1] = pluralMap[lastWord];
      normalized = words.join(' ');
    } else if (lastWord.endsWith('es') && lastWord.length > 3) {
      // Remove 'es' ending
      words[words.length - 1] = lastWord.slice(0, -2);
      normalized = words.join(' ');
    } else if (lastWord.endsWith('s') && lastWord.length > 2 && !lastWord.endsWith('ss')) {
      // Remove 's' ending (but not 'ss' like "grass")
      words[words.length - 1] = lastWord.slice(0, -1);
      normalized = words.join(' ');
    }
  }

  return normalized;
}

/**
 * Convert fraction string to decimal number
 * Handles: "1/2", "1/4", "2 1/2" (mixed fractions), "0.5", "2"
 *
 * Examples:
 * - "1/2" -> 0.5
 * - "1/4" -> 0.25
 * - "2 1/2" -> 2.5
 * - "0.5" -> 0.5
 * - "2" -> 2
 */
function fractionToDecimal(amount: string): number {
  const trimmed = amount.trim();

  // Check for mixed fraction (e.g., "2 1/2")
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const numerator = parseInt(mixedMatch[2]);
    const denominator = parseInt(mixedMatch[3]);
    return whole + (numerator / denominator);
  }

  // Check for simple fraction (e.g., "1/2")
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1]);
    const denominator = parseInt(fractionMatch[2]);
    return numerator / denominator;
  }

  // Try parsing as regular number (handles "2", "0.5", "1.25")
  const num = parseFloat(trimmed);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert decimal to mixed fraction string for display
 * Examples:
 * - 0.5 -> "1/2"
 * - 0.75 -> "3/4"
 * - 2.5 -> "2 1/2"
 * - 1.33 -> "1.33" (keeps decimal if no clean fraction)
 */
function decimalToFraction(decimal: number): string {
  // Handle whole numbers
  if (decimal % 1 === 0) {
    return decimal.toString();
  }

  const whole = Math.floor(decimal);
  const fractionalPart = decimal - whole;

  // Common fraction conversions
  const fractionMap: { [key: string]: string } = {
    '0.125': '1/8',
    '0.25': '1/4',
    '0.333': '1/3',
    '0.375': '3/8',
    '0.5': '1/2',
    '0.625': '5/8',
    '0.667': '2/3',
    '0.75': '3/4',
    '0.875': '7/8',
  };

  // Round to 3 decimal places for comparison
  const roundedFraction = fractionalPart.toFixed(3);
  const fraction = fractionMap[roundedFraction];

  if (fraction) {
    return whole > 0 ? `${whole} ${fraction}` : fraction;
  }

  // If no clean fraction match, return decimal with 1-2 decimal places
  return decimal % 0.1 === 0 ? decimal.toFixed(1) : decimal.toFixed(2);
}

/**
 * Add two amount strings together with proper fraction handling
 *
 * Examples:
 * - addAmounts("1/2", "1/4") -> "3/4"
 * - addAmounts("2", "1") -> "3"
 * - addAmounts("1.5", "0.5") -> "2"
 * - addAmounts("2 1/2", "1/4") -> "2 3/4"
 */
function addAmounts(amount1: string, amount2: string): string {
  const decimal1 = fractionToDecimal(amount1);
  const decimal2 = fractionToDecimal(amount2);

  // If both conversions failed (returned 0 for non-numeric strings), concatenate
  if (decimal1 === 0 && decimal2 === 0 && amount1 !== '0' && amount2 !== '0') {
    return `${amount1}, ${amount2}`;
  }

  const sum = decimal1 + decimal2;

  // Convert back to fraction or decimal for clean display
  return decimalToFraction(sum);
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
