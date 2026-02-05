// Meal Plan Types for AI-Generated 7-Day Meal Plans

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category?: string;
}

export interface Meal {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  instructions: string[];
}

export interface DayPlan {
  dayNumber: number; // 1-7
  date: string; // ISO date string (YYYY-MM-DD)
  dayName: string; // "Monday", "Tuesday", etc.
  meals: Meal[];
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface GroceryItem {
  name: string;
  totalAmount: string;
  unit: string;
  category: string;
  checked: boolean;
}

export interface GroceryCategory {
  category: string;
  items: GroceryItem[];
}

export interface WeekSummary {
  avgDailyCalories: number;
  avgDailyProtein: number;
  avgDailyCarbs: number;
  avgDailyFat: number;
  totalMeals: number;
}

export interface MealPlanPreferences {
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  allergies: string[];
  mealsPerDay: number;
  dietStyle?: string;
  intermittentFasting?: boolean;
  fastingStart?: string;
  fastingEnd?: string;
}

export interface UserGoalsForMealPlan {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

// API Request/Response Types

export interface GenerateMealPlanRequest {
  userGoals: UserGoalsForMealPlan;
  preferences: MealPlanPreferences;
  startDate: string;
}

export interface GenerateMealPlanResponse {
  success: boolean;
  weeklyPlan: DayPlan[];
  groceryList: GroceryCategory[];
  weekSummary: WeekSummary;
  error?: string;
}

export interface SwapMealRequest {
  dayNumber: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  currentMealName: string;
  userGoals: UserGoalsForMealPlan;
  reason?: string;
}

export interface SwapMealResponse {
  success: boolean;
  newMeal: Meal;
  error?: string;
}

export interface CreateInstacartListRequest {
  groceryList: GroceryCategory[];
  listName: string;
}

export interface CreateInstacartListResponse {
  success: boolean;
  instacartUrl: string;
  error?: string;
}

// Budget Tier Types (Migrated from HeirclarkHealthApp)

export interface BudgetTier {
  name: string;
  description: string;
  weekly_range: {
    min_cents: number;
    max_cents: number;
  };
  daily_range: {
    min_cents: number;
    max_cents: number;
  };
}

export interface PantryItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface MealPlanWithBudgetPreferences {
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g?: number;
  daily_fat_g?: number;
  dietary_restrictions: string[];
  allergies: string[];
  cuisine_preferences?: string[];
  cooking_skill: 'beginner' | 'intermediate' | 'advanced';
  max_prep_time_minutes?: number;
  meals_per_day: number;
  budget_tier: 'budget' | 'moderate' | 'premium';
  pantry_items: PantryItem[];
  landing_url?: string;
}

export interface InstacartCart {
  cart_url: string;
  items_count: number;
}

export interface MealPlanWithCartResponse {
  ok: boolean;
  data?: {
    plan: {
      id: string;
      weekly_cost_cents: number;
      pantry_savings_cents?: number;
      days: DayPlan[];
    };
    cart: InstacartCart;
    pantry_savings_cents?: number;
  };
  error?: string;
}

// Dietary Constants
export const DIETARY_RESTRICTIONS = [
  'gluten-free',
  'dairy-free',
  'vegetarian',
  'vegan',
  'keto',
  'paleo',
] as const;

export const ALLERGIES = [
  'shellfish',
  'peanuts',
  'tree-nuts',
  'eggs',
  'soy',
  'fish',
] as const;

export const CUISINE_PREFERENCES = [
  'american',
  'mediterranean',
  'asian',
  'mexican',
  'italian',
] as const;

export type DietaryRestriction = typeof DIETARY_RESTRICTIONS[number];
export type Allergy = typeof ALLERGIES[number];
export type CuisinePreference = typeof CUISINE_PREFERENCES[number];
