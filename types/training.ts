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
  // Multi-week program extensions
  calendarDate: string;  // ISO date (YYYY-MM-DD) - SINGLE SOURCE OF TRUTH for date alignment
  weekNumber: number;    // Which week of program (1-12)
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

  // Body metrics for personalized training
  weight?: number; // User's current weight in lbs
  age?: number; // User's age for recovery adjustments
  sex?: 'male' | 'female'; // Affects strength calculations and recovery

  // Strength baseline for weight recommendations
  hasLiftingExperience?: boolean;
  strengthLevel?: 'never_lifted' | 'beginner' | 'intermediate' | 'advanced';
  benchPress1RM?: number | null; // 1-rep max in lbs
  squat1RM?: number | null;
  deadlift1RM?: number | null;

  // Timeline for program selection
  programDurationWeeks?: number; // Duration from start to target date

  // Additional body metrics
  targetWeight?: number; // Target weight in lbs
  heightInches?: number; // Total height in inches (for BMI calculations)

  // Lifestyle/recovery
  sleepGoalHours?: number; // User's sleep target (for recovery recommendations)
  stepGoal?: number; // Daily step target
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
  // Multi-week program extensions
  calendarStartDate: string;  // ISO date - Week 1 Day 1 anchor (most recent Monday)
  currentWeekIndex: number;   // 0-based index (0 = week 1, 1 = week 2, etc.)
  totalWeeks: number;         // 4, 8, or 12 weeks
  perplexityResearchSummary?: string; // Research context used to inform program design
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

// ============================================================================
// CARDIO & NUTRITION GUIDANCE (Separate from Strength Training)
// ============================================================================

/**
 * Daily cardio recommendation (separate from strength training calendar)
 * User requested: "extremely detailed for the user to follow"
 */
export interface DailyCardioRecommendation {
  activity: string; // e.g., "Steady-State Cardio", "HIIT", "Active Recovery Walk"
  duration: number; // minutes
  intensity: 'low' | 'moderate' | 'high' | 'interval';
  heartRateZone?: string; // e.g., "Zone 2 (60-70% max HR)", "Zone 4-5 (80-90% max HR)"
  caloriesBurned: number; // estimated
  description: string; // Detailed description of what to do
  tips: string[]; // Specific form cues, pacing advice, safety tips
  warmup?: string; // e.g., "5 min easy walk"
  cooldown?: string; // e.g., "5 min walking, light stretching"
  alternatives?: string[]; // Alternative activities if equipment not available
}

/**
 * Weekly cardio recommendations (one for each day)
 */
export interface CardioRecommendations {
  monday: DailyCardioRecommendation;
  tuesday: DailyCardioRecommendation;
  wednesday: DailyCardioRecommendation;
  thursday: DailyCardioRecommendation;
  friday: DailyCardioRecommendation;
  saturday: DailyCardioRecommendation;
  sunday: DailyCardioRecommendation;
}

/**
 * Nutrition guidance for calorie deficit and macro targets
 * User requested: "extremely detailed for the user to follow"
 */
export interface NutritionGuidance {
  dailyCalories: number; // Target daily calories
  deficit: number; // Calorie deficit amount (e.g., 500 = lose 1 lb/week)
  proteinGrams: number; // Daily protein target
  carbsGrams: number; // Daily carbs target
  fatGrams: number; // Daily fat target
  mealTiming: string; // e.g., "3-4 meals per day", "16:8 intermittent fasting"
  hydration: string; // e.g., "Drink 0.5oz per lb of bodyweight = 100oz/day"
  preworkoutNutrition: string; // What to eat before training
  postworkoutNutrition: string; // What to eat after training
  supplementRecommendations?: string[]; // Optional supplements (protein powder, creatine, etc.)
  mealExamples: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  tips: string[]; // Detailed nutrition tips
  deficitStrategy: string; // How to maintain the deficit sustainably
  progressMonitoring: string; // How to track progress (weekly weigh-ins, measurements, etc.)
}

// ============================================================================
// Progressive Overload Tracking System Types
// ============================================================================

/** Status of an exercise's overload progression */
export type OverloadStatus =
  | 'progressing'
  | 'maintaining'
  | 'stalling'
  | 'regressing'
  | 'deload_recommended'
  | 'new_exercise'
  | 'pr_set';

/** Weekly aggregate per exercise for overload tracking */
export interface ProgressiveOverloadEntry {
  exerciseId: string;
  exerciseName: string;
  weekNumber: number;
  weekStartDate: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number; // sets * reps * weight
  maxWeight: number;
  estimated1RM: number; // Brzycki formula
  averageRPE: number;
  volumeChangePercent: number; // vs previous week
  estimated1RMChangePercent: number;
  overloadStatus: OverloadStatus;
  sessions: number; // how many sessions this week
}

/** AI-generated targets for next session */
export interface AISetRecommendation {
  exerciseId: string;
  exerciseName: string;
  sets: {
    setNumber: number;
    targetWeight: number;
    targetReps: number;
    isWarmup: boolean;
    notes?: string;
  }[];
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  progressionStrategy: string;
  generatedAt: string;
}

/** AI weekly analysis report */
export interface AIWeeklyAnalysis {
  weekNumber: number;
  weekStartDate: string;
  overallScore: number; // 0-100
  headline: string;
  exerciseAnalyses: {
    exerciseId: string;
    exerciseName: string;
    status: OverloadStatus;
    volumeChange: number;
    strengthChange: number;
    recommendation: string;
  }[];
  muscleVolumeAudit: {
    muscleGroup: MuscleGroup;
    weeklySets: number;
    mev: number; // minimum effective volume
    mrv: number; // maximum recoverable volume
    status: 'under' | 'optimal' | 'over';
  }[];
  recoveryAssessment: string;
  nutritionNote: string;
  achievements: string[];
  generatedAt: string;
}

/** User's progression preferences */
export interface UserProgressionProfile {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  progressionModel: 'linear' | 'double_progression' | 'wave_loading' | 'rpe_based';
  weightIncrements: {
    upper: number; // lb increment for upper body
    lower: number; // lb increment for lower body
  };
  preferredUnit: WeightUnit;
  deloadFrequency: number; // weeks between deloads
  targetRPE: number; // default target RPE
  repRanges: {
    strength: [number, number]; // e.g. [3, 5]
    hypertrophy: [number, number]; // e.g. [8, 12]
    endurance: [number, number]; // e.g. [12, 20]
  };
}

/** Perplexity research result for evidence-based program design */
export interface PerplexityResearchResult {
  summary: string;
  recommendedSplit: string;
  volumeTargets: { muscleGroup: string; setsPerWeek: number }[];
  periodizationApproach: string;
  deloadFrequency: number;
  specialConsiderations: string[];
  researchedAt: string;
}

/** Long-term trend data for charts */
export interface OverloadTrend {
  exerciseId: string;
  exerciseName: string;
  dataPoints: {
    weekNumber: number;
    weekStartDate: string;
    estimated1RM: number;
    totalVolume: number;
    maxWeight: number;
    averageReps: number;
  }[];
}
