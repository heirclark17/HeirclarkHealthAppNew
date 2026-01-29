// Smart Meal Logger Agent Types
// Enables quick meal logging with pattern learning and predictions

export interface FrequentMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logCount: number;
  lastLogged: string; // ISO date
  averageTime: string; // HH:MM format
  dayOfWeekFrequency: number[]; // [0-6] = Sun-Sat, count for each day
  imageUrl?: string;
  source: 'manual' | 'ai' | 'barcode' | 'photo';
  createdAt: string;
  updatedAt: string;
}

export interface MealPattern {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timeRange: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  dayOfWeek?: number; // 0-6, Sunday-Saturday
  frequentMealIds: string[];
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
  logCount: number;
}

export interface MealSuggestion {
  meal: FrequentMeal;
  confidence: number; // 0-100
  reason: string;
  isTimeBased: boolean;
  isDayBased: boolean;
  isFrequencyBased: boolean;
}

export interface QuickLogEntry {
  id: string;
  frequentMealId: string;
  date: string;
  time: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SmartMealLoggerState {
  frequentMeals: FrequentMeal[];
  mealPatterns: MealPattern[];
  suggestions: MealSuggestion[];
  recentQuickLogs: QuickLogEntry[];
  isLoading: boolean;
  lastSyncDate: string | null;
}

export interface MealLogHistory {
  id: string;
  date: string;
  time: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Constants for the Smart Meal Logger Agent
export const SMART_MEAL_CONSTANTS = {
  // Minimum logs needed to consider a meal "frequent"
  MIN_LOGS_FOR_FREQUENT: 2,

  // Maximum number of frequent meals to store
  MAX_FREQUENT_MEALS: 50,

  // Maximum number of suggestions to show
  MAX_SUGGESTIONS: 5,

  // Time window for "same time" matching (minutes)
  TIME_WINDOW_MINUTES: 60,

  // Minimum confidence score to show suggestion
  MIN_CONFIDENCE_SCORE: 30,

  // Weights for suggestion scoring
  SCORING_WEIGHTS: {
    frequency: 40, // How often they eat this meal
    timeMatch: 25, // How well it matches current time
    dayMatch: 20, // How well it matches day of week
    recency: 15, // How recently they ate it
  },

  // Default meal time ranges
  MEAL_TIME_RANGES: {
    breakfast: { start: '05:00', end: '10:30' },
    lunch: { start: '11:00', end: '14:30' },
    dinner: { start: '17:00', end: '21:00' },
    snack: { start: '00:00', end: '23:59' },
  },

  // Storage keys
  STORAGE_KEYS: {
    frequentMeals: '@smartMeal:frequentMeals',
    mealPatterns: '@smartMeal:mealPatterns',
    mealLogHistory: '@smartMeal:mealLogHistory',
    lastSync: '@smartMeal:lastSync',
  },
};
