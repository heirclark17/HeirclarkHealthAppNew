// Meal Plan API Service
// Railway Backend: https://heirclarkinstacartbackend-production.up.railway.app
// Falls back to local mock generation when backend endpoint is unavailable

import {
  GenerateMealPlanResponse,
  SwapMealResponse,
  CreateInstacartListResponse,
  UserGoalsForMealPlan,
  MealPlanPreferences,
  GroceryCategory,
  DayPlan,
  Meal,
  Ingredient,
  WeekSummary,
} from '../types/mealPlan';

const API_BASE_URL = 'https://heirclarkinstacartbackend-production.up.railway.app';

// ============================================
// MOCK MEAL DATABASE
// ============================================

const BREAKFAST_MEALS = [
  {
    name: 'Greek Yogurt Parfait',
    description: 'Creamy Greek yogurt layered with fresh berries, granola, and a drizzle of honey',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseCalories: 350,
    proteinRatio: 0.25,
    carbRatio: 0.50,
    fatRatio: 0.25,
    ingredients: [
      { name: 'Greek yogurt', amount: '1', unit: 'cup', category: 'Dairy' },
      { name: 'Mixed berries', amount: '0.5', unit: 'cup', category: 'Produce' },
      { name: 'Granola', amount: '0.25', unit: 'cup', category: 'Grains' },
      { name: 'Honey', amount: '1', unit: 'tbsp', category: 'Pantry' },
    ],
    instructions: [
      'Add half the yogurt to a bowl or jar',
      'Layer with half the berries and granola',
      'Repeat layers with remaining ingredients',
      'Drizzle honey on top and serve immediately',
    ],
  },
  {
    name: 'Avocado Toast with Eggs',
    description: 'Whole grain toast topped with smashed avocado, poached eggs, and everything bagel seasoning',
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseCalories: 420,
    proteinRatio: 0.22,
    carbRatio: 0.38,
    fatRatio: 0.40,
    ingredients: [
      { name: 'Whole grain bread', amount: '2', unit: 'slices', category: 'Grains' },
      { name: 'Avocado', amount: '1', unit: 'medium', category: 'Produce' },
      { name: 'Eggs', amount: '2', unit: 'large', category: 'Protein' },
      { name: 'Everything bagel seasoning', amount: '1', unit: 'tsp', category: 'Spices' },
      { name: 'Lemon juice', amount: '1', unit: 'tsp', category: 'Produce' },
    ],
    instructions: [
      'Toast bread until golden brown',
      'Mash avocado with lemon juice and salt',
      'Poach or fry eggs to desired doneness',
      'Spread avocado on toast, top with eggs',
      'Sprinkle with everything bagel seasoning',
    ],
  },
  {
    name: 'Protein Oatmeal Bowl',
    description: 'Hearty oatmeal with protein powder, banana, almond butter, and cinnamon',
    prepTime: 5,
    cookTime: 5,
    servings: 1,
    baseCalories: 400,
    proteinRatio: 0.28,
    carbRatio: 0.52,
    fatRatio: 0.20,
    ingredients: [
      { name: 'Rolled oats', amount: '0.5', unit: 'cup', category: 'Grains' },
      { name: 'Protein powder', amount: '1', unit: 'scoop', category: 'Protein' },
      { name: 'Banana', amount: '1', unit: 'medium', category: 'Produce' },
      { name: 'Almond butter', amount: '1', unit: 'tbsp', category: 'Pantry' },
      { name: 'Cinnamon', amount: '0.5', unit: 'tsp', category: 'Spices' },
      { name: 'Almond milk', amount: '1', unit: 'cup', category: 'Dairy' },
    ],
    instructions: [
      'Cook oats with almond milk according to package directions',
      'Stir in protein powder while oatmeal is still warm',
      'Top with sliced banana and almond butter',
      'Sprinkle with cinnamon and serve',
    ],
  },
  {
    name: 'Veggie Egg White Scramble',
    description: 'Fluffy egg whites scrambled with spinach, tomatoes, and feta cheese',
    prepTime: 5,
    cookTime: 8,
    servings: 1,
    baseCalories: 280,
    proteinRatio: 0.45,
    carbRatio: 0.20,
    fatRatio: 0.35,
    ingredients: [
      { name: 'Egg whites', amount: '6', unit: 'large', category: 'Protein' },
      { name: 'Spinach', amount: '1', unit: 'cup', category: 'Produce' },
      { name: 'Cherry tomatoes', amount: '0.5', unit: 'cup', category: 'Produce' },
      { name: 'Feta cheese', amount: '2', unit: 'tbsp', category: 'Dairy' },
      { name: 'Olive oil', amount: '1', unit: 'tsp', category: 'Pantry' },
    ],
    instructions: [
      'Heat olive oil in a non-stick pan over medium heat',
      'Add spinach and tomatoes, cook until spinach wilts',
      'Pour in egg whites and scramble until cooked through',
      'Top with crumbled feta and serve',
    ],
  },
  {
    name: 'Overnight Chia Pudding',
    description: 'Creamy chia seed pudding with coconut milk, vanilla, and fresh mango',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseCalories: 320,
    proteinRatio: 0.15,
    carbRatio: 0.45,
    fatRatio: 0.40,
    ingredients: [
      { name: 'Chia seeds', amount: '3', unit: 'tbsp', category: 'Pantry' },
      { name: 'Coconut milk', amount: '1', unit: 'cup', category: 'Dairy' },
      { name: 'Vanilla extract', amount: '0.5', unit: 'tsp', category: 'Pantry' },
      { name: 'Mango', amount: '0.5', unit: 'cup', category: 'Produce' },
      { name: 'Maple syrup', amount: '1', unit: 'tbsp', category: 'Pantry' },
    ],
    instructions: [
      'Mix chia seeds, coconut milk, vanilla, and maple syrup',
      'Refrigerate overnight or at least 4 hours',
      'Stir well before serving',
      'Top with fresh mango chunks',
    ],
  },
];

const LUNCH_MEALS = [
  {
    name: 'Grilled Chicken Caesar Salad',
    description: 'Crisp romaine lettuce with grilled chicken breast, parmesan, croutons, and creamy Caesar dressing',
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseCalories: 480,
    proteinRatio: 0.40,
    carbRatio: 0.25,
    fatRatio: 0.35,
    ingredients: [
      { name: 'Chicken breast', amount: '6', unit: 'oz', category: 'Protein' },
      { name: 'Romaine lettuce', amount: '3', unit: 'cups', category: 'Produce' },
      { name: 'Parmesan cheese', amount: '2', unit: 'tbsp', category: 'Dairy' },
      { name: 'Croutons', amount: '0.25', unit: 'cup', category: 'Grains' },
      { name: 'Caesar dressing', amount: '2', unit: 'tbsp', category: 'Pantry' },
    ],
    instructions: [
      'Season chicken breast with salt and pepper',
      'Grill chicken for 6-7 minutes per side until cooked through',
      'Let chicken rest for 5 minutes, then slice',
      'Toss romaine with dressing, top with chicken, parmesan, and croutons',
    ],
  },
  {
    name: 'Turkey & Avocado Wrap',
    description: 'Whole wheat wrap filled with sliced turkey, avocado, spinach, and honey mustard',
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseCalories: 450,
    proteinRatio: 0.30,
    carbRatio: 0.40,
    fatRatio: 0.30,
    ingredients: [
      { name: 'Whole wheat tortilla', amount: '1', unit: 'large', category: 'Grains' },
      { name: 'Sliced turkey breast', amount: '4', unit: 'oz', category: 'Protein' },
      { name: 'Avocado', amount: '0.5', unit: 'medium', category: 'Produce' },
      { name: 'Baby spinach', amount: '1', unit: 'cup', category: 'Produce' },
      { name: 'Honey mustard', amount: '1', unit: 'tbsp', category: 'Pantry' },
    ],
    instructions: [
      'Spread honey mustard on the tortilla',
      'Layer turkey, spinach, and sliced avocado',
      'Roll up tightly, tucking in the sides',
      'Cut in half diagonally and serve',
    ],
  },
  {
    name: 'Quinoa Buddha Bowl',
    description: 'Colorful bowl with quinoa, roasted chickpeas, cucumber, cherry tomatoes, and tahini dressing',
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseCalories: 520,
    proteinRatio: 0.18,
    carbRatio: 0.55,
    fatRatio: 0.27,
    ingredients: [
      { name: 'Quinoa', amount: '0.5', unit: 'cup', category: 'Grains' },
      { name: 'Chickpeas', amount: '0.5', unit: 'cup', category: 'Protein' },
      { name: 'Cucumber', amount: '0.5', unit: 'medium', category: 'Produce' },
      { name: 'Cherry tomatoes', amount: '0.5', unit: 'cup', category: 'Produce' },
      { name: 'Tahini', amount: '2', unit: 'tbsp', category: 'Pantry' },
      { name: 'Lemon juice', amount: '1', unit: 'tbsp', category: 'Produce' },
    ],
    instructions: [
      'Cook quinoa according to package directions',
      'Roast chickpeas at 400°F for 20 minutes until crispy',
      'Dice cucumber and halve cherry tomatoes',
      'Mix tahini with lemon juice and water for dressing',
      'Assemble bowl with quinoa, veggies, chickpeas, and drizzle with dressing',
    ],
  },
  {
    name: 'Tuna Salad Stuffed Peppers',
    description: 'Bell peppers filled with protein-packed tuna salad made with Greek yogurt',
    prepTime: 15,
    cookTime: 0,
    servings: 1,
    baseCalories: 380,
    proteinRatio: 0.45,
    carbRatio: 0.20,
    fatRatio: 0.35,
    ingredients: [
      { name: 'Canned tuna', amount: '5', unit: 'oz', category: 'Protein' },
      { name: 'Bell peppers', amount: '2', unit: 'medium', category: 'Produce' },
      { name: 'Greek yogurt', amount: '2', unit: 'tbsp', category: 'Dairy' },
      { name: 'Celery', amount: '1', unit: 'stalk', category: 'Produce' },
      { name: 'Red onion', amount: '2', unit: 'tbsp', category: 'Produce' },
      { name: 'Dijon mustard', amount: '1', unit: 'tsp', category: 'Pantry' },
    ],
    instructions: [
      'Drain tuna and flake with a fork',
      'Mix tuna with Greek yogurt, diced celery, onion, and mustard',
      'Cut bell peppers in half and remove seeds',
      'Fill pepper halves with tuna mixture',
    ],
  },
  {
    name: 'Asian Chicken Lettuce Wraps',
    description: 'Savory ground chicken with water chestnuts and hoisin sauce in crisp lettuce cups',
    prepTime: 10,
    cookTime: 12,
    servings: 1,
    baseCalories: 420,
    proteinRatio: 0.38,
    carbRatio: 0.28,
    fatRatio: 0.34,
    ingredients: [
      { name: 'Ground chicken', amount: '5', unit: 'oz', category: 'Protein' },
      { name: 'Butter lettuce', amount: '1', unit: 'head', category: 'Produce' },
      { name: 'Water chestnuts', amount: '0.25', unit: 'cup', category: 'Pantry' },
      { name: 'Hoisin sauce', amount: '2', unit: 'tbsp', category: 'Pantry' },
      { name: 'Ginger', amount: '1', unit: 'tsp', category: 'Produce' },
      { name: 'Garlic', amount: '2', unit: 'cloves', category: 'Produce' },
      { name: 'Soy sauce', amount: '1', unit: 'tbsp', category: 'Pantry' },
    ],
    instructions: [
      'Cook ground chicken with garlic and ginger until browned',
      'Add diced water chestnuts, hoisin, and soy sauce',
      'Simmer for 3-4 minutes until sauce thickens',
      'Spoon mixture into lettuce cups and serve',
    ],
  },
];

const DINNER_MEALS = [
  {
    name: 'Baked Salmon with Asparagus',
    description: 'Herb-crusted salmon fillet with roasted asparagus and lemon butter sauce',
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseCalories: 520,
    proteinRatio: 0.42,
    carbRatio: 0.12,
    fatRatio: 0.46,
    ingredients: [
      { name: 'Salmon fillet', amount: '6', unit: 'oz', category: 'Protein' },
      { name: 'Asparagus', amount: '1', unit: 'bunch', category: 'Produce' },
      { name: 'Lemon', amount: '1', unit: 'medium', category: 'Produce' },
      { name: 'Butter', amount: '1', unit: 'tbsp', category: 'Dairy' },
      { name: 'Garlic', amount: '2', unit: 'cloves', category: 'Produce' },
      { name: 'Fresh dill', amount: '1', unit: 'tbsp', category: 'Produce' },
    ],
    instructions: [
      'Preheat oven to 400°F',
      'Place salmon and asparagus on a baking sheet',
      'Season with salt, pepper, and minced garlic',
      'Bake for 15-18 minutes until salmon flakes easily',
      'Top with butter, lemon juice, and fresh dill',
    ],
  },
  {
    name: 'Lean Beef Stir-Fry',
    description: 'Tender beef strips with colorful vegetables in a savory ginger-soy sauce over brown rice',
    prepTime: 15,
    cookTime: 15,
    servings: 1,
    baseCalories: 550,
    proteinRatio: 0.35,
    carbRatio: 0.40,
    fatRatio: 0.25,
    ingredients: [
      { name: 'Lean beef sirloin', amount: '5', unit: 'oz', category: 'Protein' },
      { name: 'Brown rice', amount: '0.5', unit: 'cup', category: 'Grains' },
      { name: 'Broccoli', amount: '1', unit: 'cup', category: 'Produce' },
      { name: 'Bell peppers', amount: '0.5', unit: 'cup', category: 'Produce' },
      { name: 'Soy sauce', amount: '2', unit: 'tbsp', category: 'Pantry' },
      { name: 'Ginger', amount: '1', unit: 'tbsp', category: 'Produce' },
      { name: 'Sesame oil', amount: '1', unit: 'tsp', category: 'Pantry' },
    ],
    instructions: [
      'Cook brown rice according to package directions',
      'Slice beef into thin strips',
      'Stir-fry beef in sesame oil until browned, set aside',
      'Cook vegetables until crisp-tender',
      'Return beef to pan, add soy sauce and ginger',
      'Serve over brown rice',
    ],
  },
  {
    name: 'Mediterranean Chicken Bowl',
    description: 'Grilled chicken with hummus, cucumber, tomatoes, olives, and feta over mixed greens',
    prepTime: 15,
    cookTime: 15,
    servings: 1,
    baseCalories: 500,
    proteinRatio: 0.38,
    carbRatio: 0.28,
    fatRatio: 0.34,
    ingredients: [
      { name: 'Chicken breast', amount: '6', unit: 'oz', category: 'Protein' },
      { name: 'Mixed greens', amount: '2', unit: 'cups', category: 'Produce' },
      { name: 'Hummus', amount: '3', unit: 'tbsp', category: 'Pantry' },
      { name: 'Cucumber', amount: '0.5', unit: 'medium', category: 'Produce' },
      { name: 'Cherry tomatoes', amount: '0.5', unit: 'cup', category: 'Produce' },
      { name: 'Kalamata olives', amount: '8', unit: 'pieces', category: 'Pantry' },
      { name: 'Feta cheese', amount: '2', unit: 'tbsp', category: 'Dairy' },
    ],
    instructions: [
      'Season chicken with Mediterranean herbs and grill until cooked',
      'Let chicken rest, then slice',
      'Arrange mixed greens in a bowl',
      'Top with chicken, hummus, cucumber, tomatoes, olives, and feta',
      'Drizzle with olive oil and lemon juice',
    ],
  },
  {
    name: 'Turkey Meatballs with Zucchini Noodles',
    description: 'Lean turkey meatballs in marinara sauce over spiralized zucchini noodles',
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseCalories: 450,
    proteinRatio: 0.40,
    carbRatio: 0.25,
    fatRatio: 0.35,
    ingredients: [
      { name: 'Ground turkey', amount: '5', unit: 'oz', category: 'Protein' },
      { name: 'Zucchini', amount: '2', unit: 'medium', category: 'Produce' },
      { name: 'Marinara sauce', amount: '0.5', unit: 'cup', category: 'Pantry' },
      { name: 'Egg', amount: '1', unit: 'large', category: 'Protein' },
      { name: 'Italian breadcrumbs', amount: '2', unit: 'tbsp', category: 'Grains' },
      { name: 'Parmesan cheese', amount: '2', unit: 'tbsp', category: 'Dairy' },
    ],
    instructions: [
      'Mix ground turkey with egg, breadcrumbs, and half the parmesan',
      'Form into 6-8 meatballs',
      'Bake at 400°F for 20 minutes or until cooked through',
      'Spiralize zucchini into noodles',
      'Sauté zoodles for 2-3 minutes',
      'Top with meatballs, marinara, and remaining parmesan',
    ],
  },
  {
    name: 'Shrimp Tacos with Mango Salsa',
    description: 'Seasoned grilled shrimp in corn tortillas with fresh mango salsa and avocado crema',
    prepTime: 20,
    cookTime: 8,
    servings: 1,
    baseCalories: 480,
    proteinRatio: 0.32,
    carbRatio: 0.42,
    fatRatio: 0.26,
    ingredients: [
      { name: 'Shrimp', amount: '6', unit: 'oz', category: 'Protein' },
      { name: 'Corn tortillas', amount: '3', unit: 'small', category: 'Grains' },
      { name: 'Mango', amount: '0.5', unit: 'cup', category: 'Produce' },
      { name: 'Avocado', amount: '0.25', unit: 'medium', category: 'Produce' },
      { name: 'Greek yogurt', amount: '2', unit: 'tbsp', category: 'Dairy' },
      { name: 'Lime', amount: '1', unit: 'medium', category: 'Produce' },
      { name: 'Cilantro', amount: '2', unit: 'tbsp', category: 'Produce' },
    ],
    instructions: [
      'Season shrimp with cumin, paprika, and lime juice',
      'Grill or sauté shrimp for 2-3 minutes per side',
      'Mix diced mango with cilantro and lime for salsa',
      'Blend avocado with Greek yogurt for crema',
      'Warm tortillas and assemble tacos with shrimp, salsa, and crema',
    ],
  },
];

const SNACK_MEALS = [
  {
    name: 'Apple Slices with Almond Butter',
    description: 'Crisp apple slices paired with creamy almond butter for a satisfying snack',
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseCalories: 200,
    proteinRatio: 0.12,
    carbRatio: 0.50,
    fatRatio: 0.38,
    ingredients: [
      { name: 'Apple', amount: '1', unit: 'medium', category: 'Produce' },
      { name: 'Almond butter', amount: '2', unit: 'tbsp', category: 'Pantry' },
    ],
    instructions: [
      'Wash and slice apple into wedges',
      'Serve with almond butter for dipping',
    ],
  },
  {
    name: 'Protein Energy Balls',
    description: 'No-bake energy balls made with oats, protein powder, honey, and dark chocolate chips',
    prepTime: 15,
    cookTime: 0,
    servings: 2,
    baseCalories: 180,
    proteinRatio: 0.25,
    carbRatio: 0.50,
    fatRatio: 0.25,
    ingredients: [
      { name: 'Rolled oats', amount: '0.5', unit: 'cup', category: 'Grains' },
      { name: 'Protein powder', amount: '0.5', unit: 'scoop', category: 'Protein' },
      { name: 'Honey', amount: '2', unit: 'tbsp', category: 'Pantry' },
      { name: 'Peanut butter', amount: '2', unit: 'tbsp', category: 'Pantry' },
      { name: 'Dark chocolate chips', amount: '1', unit: 'tbsp', category: 'Pantry' },
    ],
    instructions: [
      'Mix all ingredients in a bowl until combined',
      'Refrigerate for 15 minutes',
      'Roll into 4-6 small balls',
      'Store in refrigerator for up to a week',
    ],
  },
  {
    name: 'Greek Yogurt with Berries',
    description: 'High-protein Greek yogurt topped with fresh mixed berries',
    prepTime: 2,
    cookTime: 0,
    servings: 1,
    baseCalories: 150,
    proteinRatio: 0.45,
    carbRatio: 0.40,
    fatRatio: 0.15,
    ingredients: [
      { name: 'Greek yogurt', amount: '0.75', unit: 'cup', category: 'Dairy' },
      { name: 'Mixed berries', amount: '0.5', unit: 'cup', category: 'Produce' },
    ],
    instructions: [
      'Add Greek yogurt to a bowl',
      'Top with fresh mixed berries',
    ],
  },
  {
    name: 'Hummus & Veggie Sticks',
    description: 'Creamy hummus served with fresh carrot, celery, and cucumber sticks',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseCalories: 180,
    proteinRatio: 0.15,
    carbRatio: 0.45,
    fatRatio: 0.40,
    ingredients: [
      { name: 'Hummus', amount: '3', unit: 'tbsp', category: 'Pantry' },
      { name: 'Carrots', amount: '1', unit: 'medium', category: 'Produce' },
      { name: 'Celery', amount: '2', unit: 'stalks', category: 'Produce' },
      { name: 'Cucumber', amount: '0.5', unit: 'medium', category: 'Produce' },
    ],
    instructions: [
      'Cut vegetables into sticks',
      'Serve with hummus for dipping',
    ],
  },
  {
    name: 'Cottage Cheese with Pineapple',
    description: 'Protein-rich cottage cheese topped with sweet pineapple chunks',
    prepTime: 2,
    cookTime: 0,
    servings: 1,
    baseCalories: 160,
    proteinRatio: 0.50,
    carbRatio: 0.35,
    fatRatio: 0.15,
    ingredients: [
      { name: 'Cottage cheese', amount: '0.75', unit: 'cup', category: 'Dairy' },
      { name: 'Pineapple chunks', amount: '0.5', unit: 'cup', category: 'Produce' },
    ],
    instructions: [
      'Add cottage cheese to a bowl',
      'Top with pineapple chunks',
    ],
  },
];

// ============================================
// MOCK GENERATION FUNCTIONS
// ============================================

function generateMealId(): string {
  return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function scaleMealToCalories(
  mealTemplate: typeof BREAKFAST_MEALS[0],
  targetCalories: number,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  targetMacros: { protein: number; carbs: number; fat: number }
): Meal {
  // Scale macros based on user's daily goals, proportional to this meal's calorie share
  const scaledCalories = Math.round(targetCalories);
  const scaledProtein = Math.round(targetMacros.protein);
  const scaledCarbs = Math.round(targetMacros.carbs);
  const scaledFat = Math.round(targetMacros.fat);

  return {
    id: generateMealId(),
    mealType,
    name: mealTemplate.name,
    description: mealTemplate.description,
    prepTime: mealTemplate.prepTime,
    cookTime: mealTemplate.cookTime,
    servings: mealTemplate.servings,
    calories: scaledCalories,
    protein: scaledProtein,
    carbs: scaledCarbs,
    fat: scaledFat,
    ingredients: mealTemplate.ingredients.map(ing => ({
      ...ing,
      category: ing.category || 'Other',
    })),
    instructions: mealTemplate.instructions,
  };
}

function getRandomMeal(meals: typeof BREAKFAST_MEALS, usedIndices: Set<number>): { meal: typeof BREAKFAST_MEALS[0]; index: number } {
  const availableIndices = meals
    .map((_, i) => i)
    .filter(i => !usedIndices.has(i));

  if (availableIndices.length === 0) {
    // Reset if all used
    usedIndices.clear();
    return { meal: meals[0], index: 0 };
  }

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  return { meal: meals[randomIndex], index: randomIndex };
}

function generateMockWeeklyPlan(
  userGoals: UserGoalsForMealPlan,
  preferences: MealPlanPreferences,
  startDate: string
): DayPlan[] {
  const weeklyPlan: DayPlan[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const mealsPerDay = preferences.mealsPerDay || 3;
  const includeSnack = mealsPerDay >= 4;

  // Calculate calorie and macro distribution ratios
  // breakfast: 25%, lunch: 30%, dinner: 35%, snack: 10%
  const distribution = {
    breakfast: 0.25,
    lunch: 0.30,
    dinner: 0.35,
    snack: includeSnack ? 0.10 : 0,
  };

  // Adjust ratios if no snack (redistribute 10% to other meals)
  if (!includeSnack) {
    distribution.breakfast = 0.27;
    distribution.lunch = 0.33;
    distribution.dinner = 0.40;
  }

  // Calculate calories for each meal type
  const breakfastCals = Math.round(userGoals.dailyCalories * distribution.breakfast);
  const lunchCals = Math.round(userGoals.dailyCalories * distribution.lunch);
  const dinnerCals = Math.round(userGoals.dailyCalories * distribution.dinner);
  const snackCals = includeSnack ? Math.round(userGoals.dailyCalories * distribution.snack) : 0;

  // Calculate macros for each meal type (proportional to calorie distribution)
  const breakfastMacros = {
    protein: userGoals.dailyProtein * distribution.breakfast,
    carbs: userGoals.dailyCarbs * distribution.breakfast,
    fat: userGoals.dailyFat * distribution.breakfast,
  };
  const lunchMacros = {
    protein: userGoals.dailyProtein * distribution.lunch,
    carbs: userGoals.dailyCarbs * distribution.lunch,
    fat: userGoals.dailyFat * distribution.lunch,
  };
  const dinnerMacros = {
    protein: userGoals.dailyProtein * distribution.dinner,
    carbs: userGoals.dailyCarbs * distribution.dinner,
    fat: userGoals.dailyFat * distribution.dinner,
  };
  const snackMacros = {
    protein: userGoals.dailyProtein * distribution.snack,
    carbs: userGoals.dailyCarbs * distribution.snack,
    fat: userGoals.dailyFat * distribution.snack,
  };

  // Track used meals to ensure variety
  const usedBreakfast = new Set<number>();
  const usedLunch = new Set<number>();
  const usedDinner = new Set<number>();
  const usedSnack = new Set<number>();

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = dayNames[date.getDay()];

    const meals: Meal[] = [];

    // Breakfast
    const { meal: breakfastTemplate, index: bIdx } = getRandomMeal(BREAKFAST_MEALS, usedBreakfast);
    usedBreakfast.add(bIdx);
    meals.push(scaleMealToCalories(breakfastTemplate, breakfastCals, 'breakfast', breakfastMacros));

    // Lunch
    const { meal: lunchTemplate, index: lIdx } = getRandomMeal(LUNCH_MEALS, usedLunch);
    usedLunch.add(lIdx);
    meals.push(scaleMealToCalories(lunchTemplate, lunchCals, 'lunch', lunchMacros));

    // Dinner
    const { meal: dinnerTemplate, index: dIdx } = getRandomMeal(DINNER_MEALS, usedDinner);
    usedDinner.add(dIdx);
    meals.push(scaleMealToCalories(dinnerTemplate, dinnerCals, 'dinner', dinnerMacros));

    // Snack (if 4 meals per day)
    if (includeSnack) {
      const { meal: snackTemplate, index: sIdx } = getRandomMeal(SNACK_MEALS, usedSnack);
      usedSnack.add(sIdx);
      meals.push(scaleMealToCalories(snackTemplate, snackCals, 'snack', snackMacros));
    }

    // Calculate daily totals
    const dailyTotals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    weeklyPlan.push({
      dayNumber: i + 1,
      date: dateStr,
      dayName,
      meals,
      dailyTotals,
    });
  }

  return weeklyPlan;
}

function generateMockGroceryList(weeklyPlan: DayPlan[]): GroceryCategory[] {
  const groceryMap = new Map<string, Map<string, { amount: number; unit: string }>>();

  // Aggregate all ingredients
  for (const day of weeklyPlan) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const category = ingredient.category || 'Other';

        if (!groceryMap.has(category)) {
          groceryMap.set(category, new Map());
        }

        const categoryItems = groceryMap.get(category)!;
        const existing = categoryItems.get(ingredient.name);

        if (existing) {
          existing.amount += parseFloat(ingredient.amount) || 1;
        } else {
          categoryItems.set(ingredient.name, {
            amount: parseFloat(ingredient.amount) || 1,
            unit: ingredient.unit,
          });
        }
      }
    }
  }

  // Convert to GroceryCategory array
  const groceryList: GroceryCategory[] = [];
  const categoryOrder = ['Produce', 'Protein', 'Dairy', 'Grains', 'Pantry', 'Spices', 'Other'];

  for (const categoryName of categoryOrder) {
    const items = groceryMap.get(categoryName);
    if (items && items.size > 0) {
      groceryList.push({
        category: categoryName,
        items: Array.from(items.entries()).map(([name, { amount, unit }]) => ({
          name,
          totalAmount: amount.toFixed(1).replace(/\.0$/, ''),
          unit,
          category: categoryName,
          checked: false,
        })),
      });
    }
  }

  return groceryList;
}

function calculateWeekSummary(weeklyPlan: DayPlan[]): WeekSummary {
  const totalDays = weeklyPlan.length;
  const totals = weeklyPlan.reduce(
    (acc, day) => ({
      calories: acc.calories + day.dailyTotals.calories,
      protein: acc.protein + day.dailyTotals.protein,
      carbs: acc.carbs + day.dailyTotals.carbs,
      fat: acc.fat + day.dailyTotals.fat,
      meals: acc.meals + day.meals.length,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 }
  );

  return {
    avgDailyCalories: Math.round(totals.calories / totalDays),
    avgDailyProtein: Math.round(totals.protein / totalDays),
    avgDailyCarbs: Math.round(totals.carbs / totalDays),
    avgDailyFat: Math.round(totals.fat / totalDays),
    totalMeals: totals.meals,
  };
}

function generateMockSwapMeal(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  targetCalories: number,
  currentMealName: string,
  userGoals: UserGoalsForMealPlan
): Meal {
  const mealDatabase = {
    breakfast: BREAKFAST_MEALS,
    lunch: LUNCH_MEALS,
    dinner: DINNER_MEALS,
    snack: SNACK_MEALS,
  };

  // Get meal distribution ratio for this meal type
  const distributionRatios = {
    breakfast: 0.25,
    lunch: 0.30,
    dinner: 0.35,
    snack: 0.10,
  };
  const ratio = distributionRatios[mealType];

  // Calculate target macros for this meal based on user goals
  const targetMacros = {
    protein: userGoals.dailyProtein * ratio,
    carbs: userGoals.dailyCarbs * ratio,
    fat: userGoals.dailyFat * ratio,
  };

  const meals = mealDatabase[mealType];

  // Find a different meal than the current one
  const availableMeals = meals.filter(m => m.name !== currentMealName);
  const randomMeal = availableMeals[Math.floor(Math.random() * availableMeals.length)] || meals[0];

  return scaleMealToCalories(randomMeal, targetCalories, mealType, targetMacros);
}

// ============================================
// SERVICE CLASS
// ============================================

class MealPlanService {
  private shopifyCustomerId: string;

  constructor() {
    this.shopifyCustomerId = 'guest_ios_app';
  }

  setCustomerId(customerId: string) {
    this.shopifyCustomerId = customerId;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Customer-Id': this.shopifyCustomerId,
    };
  }

  /**
   * Generate a 7-day meal plan
   * Tries API first, falls back to mock generation if unavailable
   */
  async generateMealPlan(
    userGoals: UserGoalsForMealPlan,
    preferences: MealPlanPreferences,
    startDate: string
  ): Promise<GenerateMealPlanResponse> {
    console.log('[MealPlanService] Generating meal plan...');
    console.log('[MealPlanService] Goals:', JSON.stringify(userGoals, null, 2));
    console.log('[MealPlanService] Preferences:', JSON.stringify(preferences, null, 2));

    // Try API first
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/meal-plans/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userGoals, preferences, startDate }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[MealPlanService] API generate success');
        return {
          success: true,
          weeklyPlan: data.weeklyPlan || [],
          groceryList: data.groceryList || [],
          weekSummary: data.weekSummary || calculateWeekSummary(data.weeklyPlan || []),
        };
      }

      // API returned error - fall through to mock generation
      console.log('[MealPlanService] API returned', response.status, '- using mock generation');
    } catch (error) {
      console.log('[MealPlanService] API error - using mock generation:', error);
    }

    // Generate mock data - API is not available, using local generation
    console.log('[MealPlanService] *** USING MOCK GENERATION - API NOT AVAILABLE ***');

    try {
      console.log('[MealPlanService] Calling generateMockWeeklyPlan...');
      const weeklyPlan = generateMockWeeklyPlan(userGoals, preferences, startDate);
      console.log('[MealPlanService] Weekly plan generated, days:', weeklyPlan.length);

      console.log('[MealPlanService] Calling generateMockGroceryList...');
      const groceryList = generateMockGroceryList(weeklyPlan);
      console.log('[MealPlanService] Grocery list generated, categories:', groceryList.length);

      console.log('[MealPlanService] Calling calculateWeekSummary...');
      const weekSummary = calculateWeekSummary(weeklyPlan);
      console.log('[MealPlanService] Week summary:', weekSummary);

      console.log('[MealPlanService] *** MOCK GENERATION SUCCESS - Returning data ***');

      return {
        success: true,
        weeklyPlan,
        groceryList,
        weekSummary,
      };
    } catch (error) {
      console.error('[MealPlanService] Mock generation error:', error);
      return {
        success: false,
        weeklyPlan: [],
        groceryList: [],
        weekSummary: {
          avgDailyCalories: 0,
          avgDailyProtein: 0,
          avgDailyCarbs: 0,
          avgDailyFat: 0,
          totalMeals: 0,
        },
        error: error instanceof Error ? error.message : 'Failed to generate meal plan',
      };
    }
  }

  /**
   * Swap a single meal with an alternative
   * Tries API first, falls back to mock generation if unavailable
   */
  async swapMeal(
    dayNumber: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    currentMealName: string,
    userGoals: UserGoalsForMealPlan,
    reason?: string
  ): Promise<SwapMealResponse> {
    console.log('[MealPlanService] Swapping meal...');
    console.log('[MealPlanService] Day:', dayNumber, 'Type:', mealType, 'Current:', currentMealName);

    // Try API first
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/meal-plans/swap`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ dayNumber, mealType, currentMealName, userGoals, reason }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[MealPlanService] API swap success');
        return { success: true, newMeal: data.newMeal };
      }

      console.log('[MealPlanService] API returned', response.status, '- using mock swap');
    } catch (error) {
      console.log('[MealPlanService] API error - using mock swap:', error);
    }

    // Generate mock swap
    try {
      // Calculate target calories for this meal type
      const calorieDistribution = {
        breakfast: 0.25,
        lunch: 0.30,
        dinner: 0.35,
        snack: 0.10,
      };
      const targetCalories = Math.round(userGoals.dailyCalories * calorieDistribution[mealType]);

      const newMeal = generateMockSwapMeal(mealType, targetCalories, currentMealName, userGoals);
      console.log('[MealPlanService] Mock swap complete:', newMeal.name);

      return { success: true, newMeal };
    } catch (error) {
      console.error('[MealPlanService] Mock swap error:', error);
      return {
        success: false,
        newMeal: {} as Meal,
        error: error instanceof Error ? error.message : 'Failed to swap meal',
      };
    }
  }

  /**
   * Create an Instacart shopping list from grocery items
   * Uses the Instacart Developer Platform (IDP) API to create a products link
   */
  async createInstacartList(
    groceryList: GroceryCategory[],
    listName: string
  ): Promise<CreateInstacartListResponse> {
    console.log('[MealPlanService] Creating Instacart list...');
    console.log('[MealPlanService] Grocery categories:', groceryList.length);

    // Transform GroceryCategory[] into Instacart line_items format
    const items: { name: string; quantity: number; unit: string }[] = [];

    for (const category of groceryList) {
      for (const item of category.items) {
        // Skip items that are already checked off
        if (item.checked) continue;

        // Parse the amount (could be "1", "1.5", "0.5", etc.)
        const quantity = parseFloat(item.totalAmount) || 1;

        items.push({
          name: item.name,
          quantity: Math.ceil(quantity), // Round up for shopping
          unit: item.unit || 'each',
        });
      }
    }

    console.log('[MealPlanService] Items to add to Instacart:', items.length);

    if (items.length === 0) {
      console.log('[MealPlanService] No items to add to Instacart');
      return { success: false, instacartUrl: '', error: 'No items to add' };
    }

    // Call the backend's products-link endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/api/instacart/products-link`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          items,
          title: listName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok && data.data?.link_url) {
        console.log('[MealPlanService] Instacart products link created successfully');
        return {
          success: true,
          instacartUrl: data.data.link_url,
        };
      }

      console.log('[MealPlanService] Instacart API response:', data);
      return {
        success: false,
        instacartUrl: '',
        error: data.error || 'Failed to create Instacart link'
      };
    } catch (error) {
      console.error('[MealPlanService] Instacart API error:', error);
      return {
        success: false,
        instacartUrl: '',
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Create an Instacart shopping list for a single meal's ingredients
   */
  async createInstacartListForMeal(meal: Meal): Promise<CreateInstacartListResponse> {
    console.log('[MealPlanService] Creating Instacart list for meal:', meal.name);

    if (!meal.ingredients || meal.ingredients.length === 0) {
      console.log('[MealPlanService] No ingredients for meal');
      return { success: false, instacartUrl: '', error: 'No ingredients' };
    }

    // Transform meal ingredients into Instacart line_items format
    const items: { name: string; quantity: number; unit: string }[] = meal.ingredients.map(ing => ({
      name: ing.name,
      quantity: Math.ceil(parseFloat(ing.amount) || 1),
      unit: ing.unit || 'each',
    }));

    console.log('[MealPlanService] Meal ingredients:', items.length);

    // Call the backend's products-link endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/api/instacart/products-link`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          items,
          title: `Ingredients for ${meal.name}`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok && data.data?.link_url) {
        console.log('[MealPlanService] Instacart meal link created successfully');
        return {
          success: true,
          instacartUrl: data.data.link_url,
        };
      }

      console.log('[MealPlanService] Instacart API response:', data);
      return {
        success: false,
        instacartUrl: '',
        error: data.error || 'Failed to create Instacart link'
      };
    } catch (error) {
      console.error('[MealPlanService] Instacart meal API error:', error);
      return {
        success: false,
        instacartUrl: '',
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }
}

// Export singleton instance
export const mealPlanService = new MealPlanService();
export default mealPlanService;
