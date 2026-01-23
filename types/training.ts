// Training Types - Integrated with Goals System

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'full_body'
  | 'cardio';

export type ExerciseCategory =
  | 'compound'
  | 'isolation'
  | 'cardio'
  | 'mobility'
  | 'plyometric';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type WorkoutType =
  | 'strength'
  | 'hypertrophy'
  | 'endurance'
  | 'hiit'
  | 'cardio'
  | 'flexibility'
  | 'rest';

export type Equipment =
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'kettlebell'
  | 'resistance_bands'
  | 'cable_machine'
  | 'bodyweight'
  | 'cardio_machine';

// User's preferred cardio type
export type CardioPreference = 'walking' | 'running' | 'hiit';

// Cardio configuration based on preference and goal
export interface CardioConfig {
  preference: CardioPreference;
  sessionsPerWeek: number;
  durationMinutes: number;
  intensityZone: string; // e.g., "Zone 2", "Zone 4-5"
  caloriesPerSession: number;
  recoveryDays: number; // minimum days between sessions for HIIT
}

// Core exercise definition
export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  category: ExerciseCategory;
  equipment: Equipment;
  difficulty: DifficultyLevel;
  caloriesPerMinute: number; // Estimated calories burned
  instructions?: string[];
  tips?: string[];
  videoUrl?: string;
}

// Exercise within a workout
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: string; // "10-12" or "30 sec" for timed exercises
  restSeconds: number;
  weight?: string; // Optional weight suggestion
  completed: boolean;
  notes?: string;
}

// Single workout session
export interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  duration: number; // in minutes
  estimatedCaloriesBurned: number;
  muscleGroupsFocused: MuscleGroup[];
  difficulty: DifficultyLevel;
  exercises: WorkoutExercise[];
  warmup?: WorkoutExercise[];
  cooldown?: WorkoutExercise[];
  completed: boolean;
  completedAt?: string;
}

// Day in the training plan
export interface TrainingDay {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  dayNumber: number; // 1-7
  date: string; // ISO date
  workout: Workout | null; // null for rest days
  isRestDay: boolean;
  completed: boolean;
}

// Weekly training plan
export interface WeeklyTrainingPlan {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: TrainingDay[];
  totalWorkouts: number;
  completedWorkouts: number;
  totalCaloriesBurned: number;
  focusAreas: MuscleGroup[];
}

// User's training preferences - derived from Goals
export interface TrainingPreferences {
  primaryGoal: 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_health';
  workoutsPerWeek: number;
  workoutDuration: 15 | 30 | 45 | 60;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitnessLevel: DifficultyLevel;
  availableEquipment: Equipment[];
  focusMuscleGroups?: MuscleGroup[];
  excludeExercises?: string[]; // Exercise IDs to exclude (injuries, etc.)
  cardioPreference?: CardioPreference; // User's preferred cardio type
}

// Program template
export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  duration: number; // in weeks
  daysPerWeek: number;
  difficulty: DifficultyLevel;
  focus: string[];
  targetGoals: ('lose_weight' | 'build_muscle' | 'maintain' | 'improve_health')[];
  weeklyStructure: {
    day: number;
    workoutType: WorkoutType;
    muscleGroups: MuscleGroup[];
  }[];
}

// Statistics and progress
export interface TrainingStats {
  totalWorkoutsCompleted: number;
  totalCaloriesBurned: number;
  totalMinutesWorked: number;
  currentStreak: number; // consecutive days with workout
  longestStreak: number;
  weeklyAverage: number; // workouts per week
  favoriteExercises: string[]; // Exercise IDs
  muscleGroupBreakdown: Record<MuscleGroup, number>; // minutes per muscle group
}

// Goal-workout alignment
export interface GoalWorkoutAlignment {
  calorieDeficitSupport: number; // 0-100, how well workouts support calorie deficit
  musclePreservation: number; // 0-100, for weight loss
  muscleGrowthPotential: number; // 0-100, for building muscle
  cardiovascularHealth: number; // 0-100
  overallAlignment: number; // 0-100, overall match with user's goals
  recommendations: string[];
}
