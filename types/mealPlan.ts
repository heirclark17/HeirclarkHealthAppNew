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
