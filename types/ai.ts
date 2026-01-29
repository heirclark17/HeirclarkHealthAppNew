/**
 * AI Integration Types
 * Types for AI meal planning, workout programming, coach chat, and ExerciseDB
 */

// ============================================================================
// AI Meal Plan Types
// ============================================================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface AIMealNutrients {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

export interface AIMealIngredient {
  name: string;
  amount: string;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface AIMeal {
  id: string;
  name: string;
  description?: string;
  mealType: MealType;
  nutrients: AIMealNutrients;
  ingredients: AIMealIngredient[];
  instructions?: string[];
  prepTimeMinutes: number;
  cookTimeMinutes?: number;
  servings: number;
  tags?: string[];
  imageUrl?: string;
  instacartUrl?: string;
}

export interface AIDailyMealPlan {
  date: string; // ISO date string
  dayOfWeek: string;
  meals: AIMeal[];
  totalNutrients: AIMealNutrients;
}

export interface AIWeeklyMealPlan {
  id: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  days: AIDailyMealPlan[];
  targetNutrients: AIMealNutrients;
  preferences: MealPlanPreferences;
  source: 'ai' | 'template';
}

export interface MealPlanPreferences {
  dietStyle?: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  allergies?: string[];
  excludeIngredients?: string[];
  cuisinePreferences?: string[];
  maxPrepTime?: number;
  mealsPerDay?: number;
  calorieTarget?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
}

// ============================================================================
// AI Workout Plan Types
// ============================================================================

export type WorkoutFocus = 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'full_body';

export interface AIWorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps?: string; // e.g., "8-12" or "15"
  duration?: number; // seconds for timed exercises
  restSeconds: number;
  notes?: string;
  exerciseDbId?: string; // Reference to ExerciseDB
  muscleGroup: MuscleGroup;
  isSuperset?: boolean;
  supersetWith?: string;
}

export interface AIWorkoutDay {
  id: string;
  dayNumber: number;
  name: string;
  focus: string;
  exercises: AIWorkoutExercise[];
  estimatedDuration: number; // minutes
  warmup?: string;
  cooldown?: string;
}

export interface AIWorkoutPlan {
  id: string;
  createdAt: string;
  name: string;
  description?: string;
  weeks: number;
  daysPerWeek: number;
  focus: WorkoutFocus;
  fitnessLevel: FitnessLevel;
  workouts: AIWorkoutDay[];
  source: 'ai' | 'template';
  preferences: WorkoutPlanPreferences;
}

export interface WorkoutPlanPreferences {
  primaryGoal: WorkoutFocus;
  fitnessLevel: FitnessLevel;
  workoutsPerWeek: number;
  sessionDuration?: number; // minutes
  availableEquipment?: string[];
  injuries?: string[];
  preferredExercises?: string[];
  excludeExercises?: string[];
}

// ============================================================================
// AI Coach Chat Types
// ============================================================================

export type CoachMode = 'meal' | 'training' | 'general';

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  mode?: CoachMode;
}

export interface CoachContext {
  mode: CoachMode;
  userGoals?: {
    primaryGoal?: string;
    targetWeight?: number;
    calorieTarget?: number;
    proteinTarget?: number;
  };
  recentMeals?: AIMeal[];
  currentWorkout?: AIWorkoutDay;
  conversationHistory?: CoachMessage[];
}

export interface CoachResponse {
  message: string;
  suggestions?: string[];
  relatedTopics?: string[];
  actionItems?: {
    type: 'meal' | 'workout' | 'tip';
    title: string;
    description: string;
  }[];
}

// ============================================================================
// ExerciseDB Types
// ============================================================================

export interface ExerciseDBExercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl: string;
  instructions?: string[];
  secondaryMuscles?: string[];
}

export interface CachedExercise extends ExerciseDBExercise {
  cachedAt: string;
}

export interface ExerciseDBCache {
  exercises: { [id: string]: CachedExercise };
  lastUpdated: string;
  expiresAt: string;
}

// ============================================================================
// Saved Meals Types
// ============================================================================

export interface SavedMeal {
  id: string;
  meal: AIMeal;
  savedAt: string;
  source: 'ai' | 'template' | 'custom';
  isFavorite: boolean;
  notes?: string;
  timesUsed: number;
  lastUsed?: string;
}

export interface SavedMealsState {
  meals: SavedMeal[];
  lastUpdated: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface GenerateMealPlanRequest {
  preferences: MealPlanPreferences;
  days?: number;
  userProfile?: {
    age?: number;
    weight?: number;
    height?: number;
    activityLevel?: string;
    goals?: string;
  };
}

export interface GenerateMealPlanResponse {
  success: boolean;
  plan?: AIWeeklyMealPlan;
  error?: string;
}

export interface GenerateWorkoutPlanRequest {
  preferences: WorkoutPlanPreferences;
  weeks?: number;
  userProfile?: {
    age?: number;
    fitnessLevel?: FitnessLevel;
    goals?: string;
  };
}

export interface GenerateWorkoutPlanResponse {
  success: boolean;
  plan?: AIWorkoutPlan;
  error?: string;
}

export interface CoachChatRequest {
  message: string;
  context: CoachContext;
}

export interface CoachChatResponse {
  success: boolean;
  response?: CoachResponse;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const AI_CONSTANTS = {
  MEAL_PLAN_CACHE_DAYS: 7,
  WORKOUT_PLAN_CACHE_DAYS: 30,
  EXERCISE_DB_CACHE_DAYS: 30,
  MAX_SAVED_MEALS: 100,
  MAX_COACH_HISTORY: 50,
  COACH_MODELS: {
    MEAL: 'gpt-4.1-mini',
    TRAINING: 'gpt-4.1-mini',
    GENERAL: 'gpt-4.1-mini',
  },
};
