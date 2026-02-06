// Training Types - Comprehensive Strength Training System
// Integrated with Goals System

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
  | 'cardio'
  | 'forearms'
  | 'calves'
  | 'hamstrings'
  | 'quads';

export type ExerciseCategory =
  | 'compound'
  | 'isolation'
  | 'cardio'
  | 'mobility'
  | 'plyometric'
  | 'warmup'
  | 'cooldown';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export type WorkoutType =
  | 'strength'
  | 'hypertrophy'
  | 'endurance'
  | 'hiit'
  | 'cardio'
  | 'flexibility'
  | 'rest'
  | 'push'
  | 'pull'
  | 'upper'
  | 'lower'
  | 'full_body';

export type Equipment =
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'kettlebell'
  | 'resistance_bands'
  | 'cable_machine'
  | 'bodyweight'
  | 'cardio_machine'
  | 'smith_machine'
  | 'ez_bar'
  | 'trap_bar'
  | 'medicine_ball'
  | 'pull_up_bar'
  | 'dip_station'
  | 'bench'
  | 'squat_rack';

export type EquipmentAccess = 'full_gym' | 'home_gym' | 'minimal' | 'bodyweight_only';

// Difficulty modifier for alternative exercises
export type DifficultyModifier = 'easier' | 'same' | 'harder';

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

// Exercise alternative with equipment variation
export interface ExerciseAlternative {
  id: string;
  name: string;
  equipment: Equipment;
  difficultyModifier: DifficultyModifier;
  muscleActivationNotes: string;
  whenToUse: string[];
  formCues?: string[];
}

// Core exercise definition with alternatives
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
  alternatives?: ExerciseAlternative[]; // 5-8 equipment variations
  primaryMuscle?: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  movementPattern?: 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'rotation';
  // ExerciseDB integration for animated GIFs and form guidance
  exerciseDbId?: string; // ExerciseDB API ID for fetching additional data
  gifUrl?: string; // Animated GIF URL showing exercise form
  exerciseDbInstructions?: string[]; // Step-by-step instructions from ExerciseDB
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
  injuries?: string[]; // Body areas to avoid or modify exercises for (e.g., 'lower_back', 'knee')
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

// Expected outcome for plan summary
export interface ExpectedOutcome {
  metric: string;
  targetValue: string;
  timeframe: string;
  confidence: 'high' | 'medium' | 'low';
}

// Comprehensive Plan Summary for Goals Page display
export interface PlanSummary {
  overview: string;
  weeklyStructure: string;
  strengthFocus: string;
  cardioFocus: string; // ALWAYS present - cardio is mandatory
  expectedOutcomes: ExpectedOutcome[];
  weekByWeekProgression: string[];
  nutritionIntegration: string;
  recoveryRecommendations: string[];
  keyMetricsToTrack: string[];
  adjustmentTriggers: string[];
}

// Enhanced Program Template with more detail
export interface ProgramTemplate {
  id: string;
  name: string;
  shortName: string; // e.g., "SS", "SL5x5", "PPL"
  description: string;
  philosophy: string; // Training philosophy behind the program
  source: string; // e.g., "Mark Rippetoe", "Reddit PPL"
  duration: number; // in weeks
  daysPerWeek: number;
  difficulty: DifficultyLevel;
  focus: string[];
  targetGoals: ('lose_weight' | 'build_muscle' | 'maintain' | 'improve_health')[];
  suitableFor: {
    fitnessLevels: FitnessLevel[];
    equipmentAccess: EquipmentAccess[];
    timeCommitment: 'low' | 'medium' | 'high';
    experience: string; // e.g., "0-6 months", "6-18 months", "18+ months"
  };
  weeklyStructure: ProgramDay[];
  progressionScheme: string;
  deloadProtocol?: string;
  cardioIntegration: CardioIntegration;
}

// Program day structure
export interface ProgramDay {
  day: number;
  name: string; // e.g., "Push Day", "Squat Day A"
  workoutType: WorkoutType;
  muscleGroups: MuscleGroup[];
  primaryLifts: string[]; // Exercise IDs
  accessoryWork: string[]; // Exercise IDs
  estimatedDuration: number; // minutes
}

// Cardio integration for each program
export interface CardioIntegration {
  type: 'integrated' | 'separate_days' | 'post_workout';
  frequency: string; // e.g., "Every workout", "3x per week"
  duration: string; // e.g., "15-20 min", "20-30 min"
  intensity: 'low' | 'moderate' | 'high' | 'mixed';
  recommendations: string[];
}

// User Training Profile (comprehensive)
export interface UserTrainingProfile {
  fitnessLevel: FitnessLevel;
  primaryGoal: 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance' | 'general_fitness' | 'athletic_performance';
  secondaryGoal?: string;
  daysPerWeek: 2 | 3 | 4 | 5 | 6;
  sessionDuration: 30 | 45 | 60 | 75 | 90;
  equipmentAccess: EquipmentAccess;
  availableEquipment: Equipment[];
  injuries?: string[];
  preferences: {
    cardioPreference: CardioPreference;
    preferredExercises?: string[];
    dislikedExercises?: string[];
    morningOrEvening?: 'morning' | 'evening' | 'no_preference';
  };
  experience: {
    yearsTraining: number;
    familiarWithCompounds: boolean;
    maxLifts?: {
      squat?: number;
      bench?: number;
      deadlift?: number;
      overhead?: number;
    };
  };
}

// Complete Training Plan
export interface CompleteTrainingPlan {
  id: string;
  name: string;
  programTemplate: ProgramTemplate;
  userProfile: UserTrainingProfile;
  weeklyPlans: WeeklyTrainingPlan[];
  summary: PlanSummary;
  createdAt: string;
  startDate: string;
  endDate: string;
  currentWeek: number;
  isActive: boolean;
}

// Cardio session with alternatives
export interface CardioSession {
  id: string;
  name: string;
  type: 'hiit' | 'liss' | 'moderate' | 'sport';
  duration: number; // minutes
  intensity: 'low' | 'moderate' | 'high';
  caloriesBurned: number;
  equipment?: Equipment;
  instructions: string[];
  alternatives: CardioAlternative[];
}

// Cardio alternative
export interface CardioAlternative {
  id: string;
  name: string;
  type: 'hiit' | 'liss' | 'moderate' | 'sport';
  equipment?: Equipment;
  duration: number;
  whenToUse: string[];
}

// Warm-up and cool-down protocols
export interface WarmupProtocol {
  id: string;
  name: string;
  duration: number;
  exercises: {
    name: string;
    duration: string; // e.g., "30 sec", "10 reps"
    notes?: string;
  }[];
  targetMuscleGroups: MuscleGroup[];
}

export interface CooldownProtocol {
  id: string;
  name: string;
  duration: number;
  exercises: {
    name: string;
    duration: string;
    notes?: string;
  }[];
}

// ==========================================
// Progressive Overload Weight Tracking Types
// ==========================================

// Weight unit preference
export type WeightUnit = 'lb' | 'kg';

// Individual weight log entry for a set
export interface SetLog {
  setNumber: number;
  weight: number;
  unit: WeightUnit;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  isWarmup?: boolean;
  notes?: string;
}

// Weight log for an exercise session
export interface WeightLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string; // ISO date
  weekNumber: number;
  sets: SetLog[];
  totalVolume: number; // weight * reps for all sets
  maxWeight: number; // heaviest weight lifted
  averageWeight: number;
  personalRecord?: boolean; // Did they beat their PR?
  notes?: string;
}

// Progress summary for an exercise over time
export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  totalSessions: number;
  currentMax: number;
  currentMaxUnit: WeightUnit;
  previousMax: number;
  allTimeMax: number; // Personal Record
  allTimeMaxDate: string;
  lastSessionDate: string;
  progressPercentage: number; // % increase from first to last session
  trend: 'increasing' | 'stable' | 'decreasing';
  weeklyHistory: {
    weekNumber: number;
    date: string;
    maxWeight: number;
    totalVolume: number;
    avgReps: number;
  }[];
  suggestedNextWeight: number; // Based on progressive overload algorithm
}

// Progressive overload recommendation
export interface ProgressiveOverloadRecommendation {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  unit: WeightUnit;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  readyToProgress: boolean;
  suggestedSets?: number;
  suggestedReps?: number;
}

// User's weight tracking settings
export interface WeightTrackingSettings {
  preferredUnit: WeightUnit;
  autoConvert: boolean; // Auto-convert between lb/kg
  trackRPE: boolean;
  showProgressChart: boolean;
  progressionStrategy: 'linear' | 'double_progression' | 'wave_loading';
  minimumWeightIncrement: {
    lb: number; // e.g., 2.5 or 5
    kg: number; // e.g., 1.25 or 2.5
  };
}
