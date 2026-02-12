// Training Service - AI-Powered Workout Generation Based on Goals
import {
  Exercise,
  Workout,
  WorkoutExercise,
  TrainingDay,
  WeeklyTrainingPlan,
  TrainingPreferences,
  TrainingProgram,
  MuscleGroup,
  WorkoutType,
  DifficultyLevel,
  GoalWorkoutAlignment,
  Equipment,
  CardioPreference,
  PlanSummary,
} from '../types/training';
import { getExerciseDbMapping } from '../data/exerciseDbMapping';

// Cardio exercise IDs grouped by preference
const CARDIO_EXERCISES_BY_PREFERENCE: Record<CardioPreference, string[]> = {
  walking: ['brisk-walk', 'incline-walk', 'power-walk'],
  running: ['treadmill-run', 'outdoor-run', 'interval-run', 'cycling'],
  hiit: ['burpees', 'mountain-climbers', 'jumping-jacks', 'high-knees', 'jump-squats', 'box-jumps', 'kettlebell-swings'],
};

// Exercise Database
const EXERCISES: Exercise[] = [
  // Compound Exercises - Chest
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 7,
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
    category: 'compound',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 6,
  },
  {
    id: 'dumbbell-chest-press',
    name: 'Dumbbell Chest Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    category: 'compound',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 6,
  },
  {
    id: 'incline-press',
    name: 'Incline Dumbbell Press',
    muscleGroups: ['chest', 'shoulders'],
    category: 'compound',
    equipment: 'dumbbells',
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
  },

  // Back Exercises
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    muscleGroups: ['back', 'biceps', 'shoulders'],
    category: 'compound',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    caloriesPerMinute: 8,
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscleGroups: ['back', 'biceps'],
    category: 'compound',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
  },
  {
    id: 'bent-over-rows',
    name: 'Bent Over Rows',
    muscleGroups: ['back', 'biceps', 'core'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
  },
  {
    id: 'dumbbell-rows',
    name: 'Dumbbell Rows',
    muscleGroups: ['back', 'biceps'],
    category: 'compound',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    muscleGroups: ['back', 'biceps'],
    category: 'compound',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
  },

  // Leg Exercises
  {
    id: 'squats',
    name: 'Barbell Squats',
    muscleGroups: ['legs', 'glutes', 'core'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 9,
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    muscleGroups: ['legs', 'glutes'],
    category: 'compound',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 7,
  },
  {
    id: 'lunges',
    name: 'Walking Lunges',
    muscleGroups: ['legs', 'glutes'],
    category: 'compound',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 6,
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscleGroups: ['back', 'legs', 'glutes', 'core'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'advanced',
    caloriesPerMinute: 10,
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    muscleGroups: ['legs', 'glutes', 'back'],
    category: 'compound',
    equipment: 'dumbbells',
    difficulty: 'intermediate',
    caloriesPerMinute: 7,
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscleGroups: ['legs', 'glutes'],
    category: 'compound',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 6,
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    muscleGroups: ['glutes', 'legs'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
  },

  // Shoulder Exercises
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscleGroups: ['shoulders', 'triceps'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    muscleGroups: ['shoulders', 'triceps'],
    category: 'compound',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    muscleGroups: ['shoulders'],
    category: 'isolation',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
  },
  {
    id: 'face-pulls',
    name: 'Face Pulls',
    muscleGroups: ['shoulders', 'back'],
    category: 'isolation',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
  },

  // Arm Exercises
  {
    id: 'bicep-curls',
    name: 'Dumbbell Bicep Curls',
    muscleGroups: ['biceps'],
    category: 'isolation',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
  },
  {
    id: 'hammer-curls',
    name: 'Hammer Curls',
    muscleGroups: ['biceps'],
    category: 'isolation',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    category: 'compound',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    muscleGroups: ['triceps'],
    category: 'isolation',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
  },
  {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    muscleGroups: ['triceps'],
    category: 'isolation',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 4,
  },

  // Core Exercises
  {
    id: 'plank',
    name: 'Plank',
    muscleGroups: ['core'],
    category: 'isolation',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
  },
  {
    id: 'crunches',
    name: 'Crunches',
    muscleGroups: ['core'],
    category: 'isolation',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
  },
  {
    id: 'russian-twists',
    name: 'Russian Twists',
    muscleGroups: ['core'],
    category: 'isolation',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
  },
  {
    id: 'leg-raises',
    name: 'Hanging Leg Raises',
    muscleGroups: ['core'],
    category: 'isolation',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    muscleGroups: ['core', 'full_body'],
    category: 'cardio',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 10,
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    muscleGroups: ['core'],
    category: 'isolation',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 3,
  },

  // Cardio & HIIT
  {
    id: 'burpees',
    name: 'Burpees',
    muscleGroups: ['full_body', 'cardio'],
    category: 'plyometric',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    caloriesPerMinute: 12,
  },
  {
    id: 'jump-squats',
    name: 'Jump Squats',
    muscleGroups: ['legs', 'glutes', 'cardio'],
    category: 'plyometric',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    caloriesPerMinute: 10,
  },
  {
    id: 'box-jumps',
    name: 'Box Jumps',
    muscleGroups: ['legs', 'glutes', 'cardio'],
    category: 'plyometric',
    equipment: 'none',
    difficulty: 'intermediate',
    caloriesPerMinute: 11,
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    muscleGroups: ['full_body', 'cardio'],
    category: 'cardio',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 8,
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    muscleGroups: ['legs', 'cardio'],
    category: 'cardio',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 9,
  },
  {
    id: 'kettlebell-swings',
    name: 'Kettlebell Swings',
    muscleGroups: ['full_body', 'glutes', 'core'],
    category: 'compound',
    equipment: 'kettlebell',
    difficulty: 'intermediate',
    caloriesPerMinute: 10,
  },
  // Walking Exercises (Low Intensity)
  {
    id: 'brisk-walk',
    name: 'Brisk Walking',
    muscleGroups: ['cardio', 'legs'],
    category: 'cardio',
    equipment: 'none',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
    instructions: ['Maintain a pace where you can talk but not sing', 'Swing arms naturally', 'Keep posture upright'],
    tips: ['Great for active recovery', 'Low impact on joints', 'Can be done anywhere'],
  },
  {
    id: 'incline-walk',
    name: 'Incline Treadmill Walk',
    muscleGroups: ['cardio', 'legs', 'glutes'],
    category: 'cardio',
    equipment: 'cardio_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 7,
    instructions: ['Set incline to 8-12%', 'Walk at 3-3.5 mph', 'Do not hold handrails'],
    tips: ['Burns more calories than flat walking', 'Builds glute strength', 'Low impact'],
  },
  {
    id: 'power-walk',
    name: 'Power Walking',
    muscleGroups: ['cardio', 'legs', 'core'],
    category: 'cardio',
    equipment: 'none',
    difficulty: 'beginner',
    caloriesPerMinute: 6,
    instructions: ['Walk at fastest sustainable pace', 'Pump arms actively', 'Take shorter, faster steps'],
    tips: ['Almost as effective as jogging', 'Easier on joints', 'Great for beginners'],
  },
  // Running Exercises (Moderate-High Intensity)
  {
    id: 'treadmill-run',
    name: 'Treadmill Running',
    muscleGroups: ['cardio', 'legs'],
    category: 'cardio',
    equipment: 'cardio_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 11,
    instructions: ['Start with 5 min warm-up walk', 'Maintain steady pace', 'Cool down with 5 min walk'],
    tips: ['High calorie burn', 'Great for endurance', 'Control your pace'],
  },
  {
    id: 'outdoor-run',
    name: 'Outdoor Running',
    muscleGroups: ['cardio', 'legs', 'core'],
    category: 'cardio',
    equipment: 'none',
    difficulty: 'intermediate',
    caloriesPerMinute: 12,
    instructions: ['Warm up with dynamic stretches', 'Maintain conversational pace', 'Cool down and stretch'],
    tips: ['Varied terrain builds strength', 'Fresh air boosts mood', 'Track with GPS app'],
  },
  {
    id: 'interval-run',
    name: 'Interval Running',
    muscleGroups: ['cardio', 'legs'],
    category: 'cardio',
    equipment: 'cardio_machine',
    difficulty: 'intermediate',
    caloriesPerMinute: 13,
    instructions: ['Alternate 1 min fast / 2 min recovery', 'Repeat for 20-30 minutes', 'End with cool down'],
    tips: ['Burns more fat than steady state', 'Improves speed over time', 'Great for plateaus'],
  },
  {
    id: 'cycling',
    name: 'Stationary Bike',
    muscleGroups: ['cardio', 'legs'],
    category: 'cardio',
    equipment: 'cardio_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 8,
  },
  {
    id: 'rowing',
    name: 'Rowing Machine',
    muscleGroups: ['cardio', 'back', 'legs'],
    category: 'cardio',
    equipment: 'cardio_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 9,
  },

  // Mobility & Flexibility
  {
    id: 'stretching',
    name: 'Full Body Stretching',
    muscleGroups: ['full_body'],
    category: 'mobility',
    equipment: 'none',
    difficulty: 'beginner',
    caloriesPerMinute: 2,
  },
  {
    id: 'yoga-flow',
    name: 'Yoga Flow',
    muscleGroups: ['full_body', 'core'],
    category: 'mobility',
    equipment: 'none',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
  },
  {
    id: 'foam-rolling',
    name: 'Foam Rolling',
    muscleGroups: ['full_body'],
    category: 'mobility',
    equipment: 'none',
    difficulty: 'beginner',
    caloriesPerMinute: 2,
  },
];

// Training programs templates based on goals
const TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    id: 'fat-loss-hiit',
    name: 'Fat Burning HIIT',
    description: 'High-intensity interval training designed to maximize calorie burn and boost metabolism',
    duration: 8,
    daysPerWeek: 4,
    difficulty: 'intermediate',
    focus: ['Fat Loss', 'Cardio', 'Conditioning'],
    targetGoals: ['lose_weight'],
    weeklyStructure: [
      { day: 1, workoutType: 'hiit', muscleGroups: ['full_body', 'cardio'] },
      { day: 2, workoutType: 'strength', muscleGroups: ['legs', 'glutes'] },
      { day: 3, workoutType: 'rest', muscleGroups: [] },
      { day: 4, workoutType: 'hiit', muscleGroups: ['full_body', 'cardio'] },
      { day: 5, workoutType: 'strength', muscleGroups: ['chest', 'back', 'shoulders'] },
      { day: 6, workoutType: 'cardio', muscleGroups: ['cardio'] },
      { day: 7, workoutType: 'rest', muscleGroups: [] },
    ],
  },
  {
    id: 'muscle-building',
    name: 'Muscle Building Program',
    description: 'Progressive overload training focused on hypertrophy and strength gains',
    duration: 12,
    daysPerWeek: 5,
    difficulty: 'intermediate',
    focus: ['Muscle Growth', 'Strength', 'Hypertrophy'],
    targetGoals: ['build_muscle'],
    weeklyStructure: [
      { day: 1, workoutType: 'hypertrophy', muscleGroups: ['chest', 'triceps'] },
      { day: 2, workoutType: 'hypertrophy', muscleGroups: ['back', 'biceps'] },
      { day: 3, workoutType: 'hypertrophy', muscleGroups: ['legs', 'glutes'] },
      { day: 4, workoutType: 'rest', muscleGroups: [] },
      { day: 5, workoutType: 'hypertrophy', muscleGroups: ['shoulders', 'core'] },
      { day: 6, workoutType: 'strength', muscleGroups: ['full_body'] },
      { day: 7, workoutType: 'rest', muscleGroups: [] },
    ],
  },
  {
    id: 'maintain-fitness',
    name: 'Fitness Maintenance',
    description: 'Balanced program to maintain current fitness levels with variety',
    duration: 8,
    daysPerWeek: 3,
    difficulty: 'beginner',
    focus: ['Maintenance', 'General Fitness', 'Balance'],
    targetGoals: ['maintain'],
    weeklyStructure: [
      { day: 1, workoutType: 'strength', muscleGroups: ['full_body'] },
      { day: 2, workoutType: 'rest', muscleGroups: [] },
      { day: 3, workoutType: 'cardio', muscleGroups: ['cardio'] },
      { day: 4, workoutType: 'rest', muscleGroups: [] },
      { day: 5, workoutType: 'strength', muscleGroups: ['full_body'] },
      { day: 6, workoutType: 'flexibility', muscleGroups: ['full_body'] },
      { day: 7, workoutType: 'rest', muscleGroups: [] },
    ],
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Focus on overall health improvement with balanced strength and cardio',
    duration: 10,
    daysPerWeek: 4,
    difficulty: 'beginner',
    focus: ['Health', 'Wellness', 'Longevity'],
    targetGoals: ['improve_health'],
    weeklyStructure: [
      { day: 1, workoutType: 'strength', muscleGroups: ['chest', 'back'] },
      { day: 2, workoutType: 'cardio', muscleGroups: ['cardio'] },
      { day: 3, workoutType: 'rest', muscleGroups: [] },
      { day: 4, workoutType: 'strength', muscleGroups: ['legs', 'core'] },
      { day: 5, workoutType: 'rest', muscleGroups: [] },
      { day: 6, workoutType: 'cardio', muscleGroups: ['cardio'] },
      { day: 7, workoutType: 'flexibility', muscleGroups: ['full_body'] },
    ],
  },
];

// Helper functions
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Enrich an exercise with GIF URL and instructions from ExerciseDB
 * This adds animated form demonstrations to exercises for visual guidance
 */
function enrichExerciseWithGif(exercise: Exercise): Exercise {
  const mapping = getExerciseDbMapping(exercise.name);
  if (mapping) {
    return {
      ...exercise,
      exerciseDbId: mapping.id,
      gifUrl: mapping.gifUrl,
      exerciseDbInstructions: mapping.instructions,
    };
  }
  return exercise;
}

function getExercisesByMuscleGroup(muscleGroups: MuscleGroup[], difficulty: DifficultyLevel): Exercise[] {
  const difficultyOrder: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
  const maxDifficultyIndex = difficultyOrder.indexOf(difficulty);

  return EXERCISES.filter(ex => {
    const exDifficultyIndex = difficultyOrder.indexOf(ex.difficulty);
    const matchesDifficulty = exDifficultyIndex <= maxDifficultyIndex;
    const matchesMuscle = ex.muscleGroups.some(mg => muscleGroups.includes(mg));
    return matchesDifficulty && matchesMuscle;
  });
}

// Calculate recommended weight for an exercise based on user's strength baseline
function calculateRecommendedWeight(
  exercise: Exercise,
  workoutType: WorkoutType,
  reps: string,
  preferences?: TrainingPreferences
): string | undefined {
  // Only calculate weights for strength exercises (not cardio/bodyweight)
  if (exercise.category === 'cardio' || exercise.equipment === 'bodyweight' || exercise.equipment === 'none') {
    return undefined;
  }

  // If no preferences or no strength data, return undefined
  if (!preferences || !preferences.hasLiftingExperience || !preferences.strengthLevel) {
    return undefined;
  }

  // Base weights by strength level and sex
  const baseWeights: Record<string, Record<string, Record<string, number>>> = {
    male: {
      beginner: {
        'bench-press': 95, 'squats': 135, 'deadlift': 155,
        'overhead-press': 65, 'bent-over-rows': 85,
        'dumbbell-chest-press': 25, 'dumbbell-shoulder-press': 20,
        'dumbbell-rows': 30, 'goblet-squat': 35,
      },
      intermediate: {
        'bench-press': 155, 'squats': 225, 'deadlift': 275,
        'overhead-press': 105, 'bent-over-rows': 135,
        'dumbbell-chest-press': 45, 'dumbbell-shoulder-press': 35,
        'dumbbell-rows': 50, 'goblet-squat': 60,
      },
      advanced: {
        'bench-press': 225, 'squats': 315, 'deadlift': 405,
        'overhead-press': 155, 'bent-over-rows': 185,
        'dumbbell-chest-press': 70, 'dumbbell-shoulder-press': 55,
        'dumbbell-rows': 75, 'goblet-squat': 90,
      },
    },
    female: {
      beginner: {
        'bench-press': 45, 'squats': 65, 'deadlift': 95,
        'overhead-press': 35, 'bent-over-rows': 45,
        'dumbbell-chest-press': 12, 'dumbbell-shoulder-press': 10,
        'dumbbell-rows': 15, 'goblet-squat': 20,
      },
      intermediate: {
        'bench-press': 85, 'squats': 135, 'deadlift': 185,
        'overhead-press': 65, 'bent-over-rows': 85,
        'dumbbell-chest-press': 25, 'dumbbell-shoulder-press': 20,
        'dumbbell-rows': 30, 'goblet-squat': 40,
      },
      advanced: {
        'bench-press': 135, 'squats': 205, 'deadlift': 275,
        'overhead-press': 95, 'bent-over-rows': 115,
        'dumbbell-chest-press': 40, 'dumbbell-shoulder-press': 32,
        'dumbbell-rows': 50, 'goblet-squat': 65,
      },
    },
  };

  const sex = preferences.sex || 'male';
  const strengthLevel = preferences.strengthLevel === 'never_lifted' ? 'beginner' : preferences.strengthLevel;

  // Use 1RM if available for main lifts
  let baseWeight: number | undefined;
  if (exercise.id === 'bench-press' && preferences.benchPress1RM) {
    baseWeight = preferences.benchPress1RM;
  } else if (exercise.id === 'squats' && preferences.squat1RM) {
    baseWeight = preferences.squat1RM;
  } else if (exercise.id === 'deadlift' && preferences.deadlift1RM) {
    baseWeight = preferences.deadlift1RM;
  } else {
    // Use base weights from table
    baseWeight = baseWeights[sex]?.[strengthLevel]?.[exercise.id];
  }

  if (!baseWeight) {
    return undefined; // No data for this exercise
  }

  // Adjust weight based on rep range and workout type
  let percentage = 0.70; // Default to 70% for moderate reps

  // Parse rep range to determine percentage of 1RM
  const repNum = parseInt(reps.split('-')[0]);
  if (!isNaN(repNum)) {
    if (repNum <= 5) percentage = 0.85; // Heavy sets (85% 1RM)
    else if (repNum <= 8) percentage = 0.80; // Strength sets (80% 1RM)
    else if (repNum <= 12) percentage = 0.70; // Hypertrophy sets (70% 1RM)
    else percentage = 0.60; // Endurance sets (60% 1RM)
  }

  // Calculate working weight
  const workingWeight = Math.round(baseWeight * percentage / 5) * 5; // Round to nearest 5 lbs

  // Return formatted weight string
  return `${workingWeight} lbs`;
}

function selectExercisesForWorkout(
  workoutType: WorkoutType,
  muscleGroups: MuscleGroup[],
  difficulty: DifficultyLevel,
  duration: number,
  cardioPreference?: CardioPreference,
  preferences?: TrainingPreferences
): WorkoutExercise[] {
  let availableExercises = getExercisesByMuscleGroup(muscleGroups, difficulty);

  // *** EQUIPMENT FILTERING: Filter exercises by user's available equipment ***
  if (preferences?.availableEquipment && preferences.availableEquipment.length > 0) {
    const userEquipment = preferences.availableEquipment;
    console.log('[TrainingService] Filtering exercises for equipment:', userEquipment);

    // Map user-friendly equipment names to exercise equipment types
    const equipmentMap: Record<string, string[]> = {
      'bodyweight': ['bodyweight'],
      'dumbbells': ['dumbbells', 'dumbbell'],
      'barbell': ['barbell'],
      'resistance_bands': ['resistance_band', 'bands'],
      'kettlebells': ['kettlebell', 'kettlebells'],
      'pull_up_bar': ['pull_up_bar', 'bar'],
      'bench': ['bench'],
      'cable_machine': ['cable_machine', 'cable'],
      'smith_machine': ['smith_machine'],
      'squat_rack': ['squat_rack', 'rack'],
    };

    // Build list of allowed equipment types
    const allowedEquipmentTypes = new Set<string>();
    userEquipment.forEach(eq => {
      const types = equipmentMap[eq] || [eq];
      types.forEach(t => allowedEquipmentTypes.add(t));
    });

    // Filter exercises to only those matching user's equipment
    const beforeCount = availableExercises.length;
    availableExercises = availableExercises.filter(ex => {
      // Bodyweight exercises are always available
      if (ex.equipment === 'bodyweight') return true;
      // Check if exercise equipment matches user's available equipment
      return allowedEquipmentTypes.has(ex.equipment);
    });

    console.log(`[TrainingService] Equipment filter: ${beforeCount} exercises → ${availableExercises.length} exercises`);

    // If equipment filtering leaves no exercises, fall back to bodyweight only
    if (availableExercises.length === 0) {
      console.warn('[TrainingService] ⚠️ Equipment filter removed all exercises, falling back to bodyweight');
      availableExercises = getExercisesByMuscleGroup(muscleGroups, difficulty).filter(
        ex => ex.equipment === 'bodyweight'
      );
    }
  }

  // *** INJURY/LIMITATION FILTERING: Avoid exercises targeting injured areas ***
  if (preferences?.injuries && preferences.injuries.length > 0) {
    const injuries = preferences.injuries;
    console.log('[TrainingService] Filtering exercises to avoid injuries:', injuries);

    // Map injury areas to muscle groups that should be avoided
    const injuryToMuscleMap: Record<string, MuscleGroup[]> = {
      'lower_back': ['core', 'glutes'],
      'knee': ['quadriceps', 'hamstrings', 'glutes'],
      'shoulder': ['shoulders', 'chest', 'back'],
      'elbow': ['biceps', 'triceps'],
      'wrist': ['biceps', 'triceps', 'chest'],
      'hip': ['glutes', 'quadriceps', 'hamstrings'],
      'ankle': ['quadriceps', 'hamstrings', 'calves'],
      'neck': ['shoulders', 'back'],
    };

    // Build set of muscle groups to avoid
    const avoidMuscles = new Set<MuscleGroup>();
    injuries.forEach(injury => {
      const muscles = injuryToMuscleMap[injury.toLowerCase()];
      if (muscles) {
        muscles.forEach(m => avoidMuscles.add(m));
      }
    });

    if (avoidMuscles.size > 0) {
      const beforeCount = availableExercises.length;
      // Filter out exercises that primarily target injured areas
      availableExercises = availableExercises.filter(ex => {
        // Keep exercise if none of its muscle groups match avoided muscles
        const hasInjuryConflict = ex.muscleGroups.some(mg => avoidMuscles.has(mg));
        return !hasInjuryConflict;
      });

      console.log(`[TrainingService] Injury filter: ${beforeCount} exercises → ${availableExercises.length} exercises`);

      // If injury filtering leaves no exercises, log warning but continue with bodyweight alternatives
      if (availableExercises.length === 0) {
        console.warn('[TrainingService] ⚠️ Injury filter removed all exercises, using minimal bodyweight exercises');
        // Fall back to very safe bodyweight exercises (core, cardio)
        availableExercises = EXERCISES.filter(ex =>
          ex.equipment === 'bodyweight' &&
          (ex.category === 'cardio' || ex.category === 'core')
        );
      }
    }
  }

  // Filter cardio exercises based on user's cardio preference
  if ((workoutType === 'cardio' || workoutType === 'hiit') && cardioPreference) {
    const preferredCardioIds = CARDIO_EXERCISES_BY_PREFERENCE[cardioPreference];
    console.log(`[TrainingService] Cardio/HIIT workout with preference: ${cardioPreference}`);
    console.log(`[TrainingService] Preferred exercise IDs:`, preferredCardioIds);

    // ALWAYS respect user's cardio preference
    // If user chose walking/running but program has HIIT, use their preferred cardio instead
    if (cardioPreference === 'hiit') {
      // User wants HIIT - use HIIT exercises
      const hiitExercises = EXERCISES.filter(ex =>
        CARDIO_EXERCISES_BY_PREFERENCE.hiit.includes(ex.id) ||
        ex.category === 'plyometric'
      );
      console.log(`[TrainingService] Using HIIT exercises (user preference):`, hiitExercises.map(e => e.name));
      if (hiitExercises.length > 0) {
        availableExercises = hiitExercises;
      }
    } else {
      // User prefers walking or running - use their preferred exercises even on HIIT days
      const preferredExercises = EXERCISES.filter(ex => preferredCardioIds.includes(ex.id));
      console.log(`[TrainingService] Using ${cardioPreference} exercises (user preference):`,
        preferredExercises.map(e => e.name));
      if (preferredExercises.length > 0) {
        availableExercises = preferredExercises;
      }
    }
  }

  // Determine number of exercises based on duration
  const exerciseCount = Math.min(
    Math.floor(duration / 8), // ~8 minutes per exercise including rest
    availableExercises.length,
    8 // max 8 exercises
  );

  // Shuffle and select exercises
  const shuffled = [...availableExercises].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, exerciseCount);

  // Configure sets/reps based on workout type
  return selected.map((exercise, index) => {
    let sets = 3;
    let reps = '10-12';
    let restSeconds = 60;

    switch (workoutType) {
      case 'strength':
        sets = 4;
        reps = '6-8';
        restSeconds = 90;
        break;
      case 'hypertrophy':
        sets = 4;
        reps = '8-12';
        restSeconds = 60;
        break;
      case 'endurance':
        sets = 3;
        reps = '15-20';
        restSeconds = 45;
        break;
      case 'hiit':
        sets = 3;
        reps = exercise.category === 'cardio' ? '45 sec' : '12-15';
        restSeconds = 30;
        break;
      case 'cardio':
        sets = 1;
        reps = '15-20 min';
        restSeconds = 0;
        break;
    }

    // Adjust rest periods based on age for better recovery
    if (preferences?.age && workoutType !== 'cardio') {
      const age = preferences.age;
      let ageMultiplier = 1.0;

      if (age >= 55) {
        ageMultiplier = 1.3; // 30% more rest for 55+
      } else if (age >= 40) {
        ageMultiplier = 1.2; // 20% more rest for 40-54
      } else if (age >= 30) {
        ageMultiplier = 1.1; // 10% more rest for 30-39
      }
      // Under 30: no adjustment needed

      if (ageMultiplier > 1.0) {
        restSeconds = Math.round(restSeconds * ageMultiplier);
      }
    }

    // Enrich exercise with GIF URL and instructions from ExerciseDB
    const enrichedExercise = enrichExerciseWithGif(exercise);

    // Calculate recommended weight based on user's strength baseline
    const recommendedWeight = calculateRecommendedWeight(exercise, workoutType, reps, preferences);

    return {
      id: generateUUID(),
      exerciseId: exercise.id,
      exercise: enrichedExercise,
      sets,
      reps,
      restSeconds,
      weight: recommendedWeight,
      completed: false,
    };
  });
}

function calculateEstimatedCalories(exercises: WorkoutExercise[], durationMinutes: number): number {
  if (exercises.length === 0) return 0;

  const avgCaloriesPerMinute = exercises.reduce((sum, ex) => sum + ex.exercise.caloriesPerMinute, 0) / exercises.length;
  return Math.round(avgCaloriesPerMinute * durationMinutes);
}

// Main service functions
export const trainingService = {
  // Get exercise by ID
  getExercise(id: string): Exercise | undefined {
    return EXERCISES.find(ex => ex.id === id);
  },

  // Get all exercises
  getAllExercises(): Exercise[] {
    return [...EXERCISES];
  },

  // Get exercises filtered by muscle group
  getExercisesByMuscle(muscleGroup: MuscleGroup): Exercise[] {
    return EXERCISES.filter(ex => ex.muscleGroups.includes(muscleGroup));
  },

  // Get recommended program based on user goals
  getRecommendedProgram(preferences: TrainingPreferences): TrainingProgram {
    // Find program matching primary goal
    const matchingProgram = TRAINING_PROGRAMS.find(p =>
      p.targetGoals.includes(preferences.primaryGoal)
    );

    return matchingProgram || TRAINING_PROGRAMS[2]; // Default to maintenance
  },

  // Get all available programs
  getAllPrograms(): TrainingProgram[] {
    return [...TRAINING_PROGRAMS];
  },

  // Generate a single workout
  generateWorkout(
    type: WorkoutType,
    muscleGroups: MuscleGroup[],
    duration: number,
    difficulty: DifficultyLevel,
    cardioPreference?: CardioPreference,
    preferences?: TrainingPreferences
  ): Workout {
    if (type === 'rest') {
      return {
        id: generateUUID(),
        name: 'Rest Day',
        type: 'rest',
        duration: 0,
        estimatedCaloriesBurned: 0,
        muscleGroupsFocused: [],
        difficulty,
        exercises: [],
        completed: false,
      };
    }

    const exercises = selectExercisesForWorkout(type, muscleGroups, difficulty, duration, cardioPreference, preferences);
    const estimatedCalories = calculateEstimatedCalories(exercises, duration);

    // Generate workout name based on type, muscles, and cardio preference
    const muscleNames = muscleGroups.map(mg => mg.charAt(0).toUpperCase() + mg.slice(1)).join(' & ');
    const typeName = type.charAt(0).toUpperCase() + type.slice(1);

    // Custom cardio workout names based on user's cardio preference
    // This applies to BOTH cardio AND hiit workout types - user preference takes priority
    let name: string;
    if ((type === 'cardio' || type === 'hiit') && cardioPreference) {
      const cardioNames: Record<CardioPreference, string> = {
        walking: 'Walking Session',
        running: 'Running Session',
        hiit: 'HIIT Cardio Blast',
      };
      name = cardioNames[cardioPreference];
      console.log(`[TrainingService] Workout name set to "${name}" based on cardio preference: ${cardioPreference}`);
    } else if (type === 'hiit') {
      name = 'HIIT Cardio Blast';
    } else {
      name = `${muscleNames} ${typeName}`;
    }

    return {
      id: generateUUID(),
      name,
      type,
      duration,
      estimatedCaloriesBurned: estimatedCalories,
      muscleGroupsFocused: muscleGroups,
      difficulty,
      exercises,
      completed: false,
    };
  },

  // Generate weekly training plan based on goals
  generateWeeklyPlan(preferences: TrainingPreferences, weekNumber: number = 1): WeeklyTrainingPlan {
    const program = this.getRecommendedProgram(preferences);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    const days: TrainingDay[] = [];
    const dayNames: TrainingDay['dayOfWeek'][] = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    let workoutDaysCount = 0;
    let totalCalories = 0;
    const focusAreas = new Set<MuscleGroup>();

    // Adjust workout distribution based on user's workoutsPerWeek preference
    const workoutDaysNeeded = preferences.workoutsPerWeek;
    let assignedWorkoutDays = 0;

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);

      const structureDay = program.weeklyStructure[i];
      const isWorkoutDay = structureDay.workoutType !== 'rest' && assignedWorkoutDays < workoutDaysNeeded;

      let workout: Workout | null = null;

      if (isWorkoutDay) {
        workout = this.generateWorkout(
          structureDay.workoutType,
          structureDay.muscleGroups.length > 0 ? structureDay.muscleGroups : ['full_body'],
          preferences.workoutDuration,
          preferences.fitnessLevel,
          preferences.cardioPreference, // Pass user's cardio preference for cardio workouts
          preferences // Pass full preferences for weight calculations
        );
        totalCalories += workout.estimatedCaloriesBurned;
        structureDay.muscleGroups.forEach(mg => focusAreas.add(mg));
        assignedWorkoutDays++;
      }

      days.push({
        id: generateUUID(),
        dayOfWeek: dayNames[i],
        dayNumber: i + 1,
        date: dayDate.toISOString().split('T')[0],
        workout,
        isRestDay: !isWorkoutDay,
        completed: false,
      });

      if (workout) workoutDaysCount++;
    }

    return {
      id: generateUUID(),
      weekNumber,
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      days,
      totalWorkouts: workoutDaysCount,
      completedWorkouts: 0,
      totalCaloriesBurned: totalCalories,
      focusAreas: Array.from(focusAreas),
    };
  },

  // Calculate goal-workout alignment
  calculateGoalAlignment(
    preferences: TrainingPreferences,
    weeklyPlan: WeeklyTrainingPlan
  ): GoalWorkoutAlignment {
    const recommendations: string[] = [];
    let calorieDeficitSupport = 50;
    let musclePreservation = 50;
    let muscleGrowthPotential = 50;
    let cardiovascularHealth = 50;

    // Analyze workouts in the plan - flatten weeks into days
    const allDays = weeklyPlan.weeks?.flatMap(w => w.days) || weeklyPlan.days || [];
    const workouts = allDays.filter(d => d?.workout).map(d => d.workout!);
    const hiitCount = workouts.filter(w => w.type === 'hiit').length;
    const cardioCount = workouts.filter(w => w.type === 'cardio' || w.type === 'hiit').length;
    const strengthCount = workouts.filter(w => w.type === 'strength' || w.type === 'hypertrophy').length;

    // Calculate scores based on goal
    switch (preferences.primaryGoal) {
      case 'lose_weight':
        calorieDeficitSupport = Math.min(100, 50 + cardioCount * 15 + hiitCount * 10);
        musclePreservation = Math.min(100, 40 + strengthCount * 20);
        cardiovascularHealth = Math.min(100, 40 + cardioCount * 15);

        if (cardioCount < 2) recommendations.push('Add more cardio sessions to maximize calorie burn');
        if (strengthCount < 2) recommendations.push('Include strength training to preserve muscle during weight loss');
        if ((weeklyPlan.totalCaloriesBurned || 0) < 1500) recommendations.push('Increase workout intensity to burn more calories');
        break;

      case 'build_muscle':
        muscleGrowthPotential = Math.min(100, 40 + strengthCount * 20);
        musclePreservation = 90;
        calorieDeficitSupport = 30; // Not the focus

        if (strengthCount < 3) recommendations.push('Add more strength training days for optimal muscle growth');
        if (workouts.length < 4) recommendations.push('Consider training more frequently for better muscle stimulus');
        break;

      case 'maintain':
        calorieDeficitSupport = 60;
        musclePreservation = Math.min(100, 50 + strengthCount * 15);
        cardiovascularHealth = Math.min(100, 40 + cardioCount * 15);
        muscleGrowthPotential = 50;

        if (workouts.length < 3) recommendations.push('Aim for at least 3 workouts per week to maintain fitness');
        break;

      case 'improve_health':
        cardiovascularHealth = Math.min(100, 50 + cardioCount * 20);
        musclePreservation = Math.min(100, 40 + strengthCount * 15);

        if (cardioCount < 2) recommendations.push('Include more cardio for heart health');
        if (strengthCount < 2) recommendations.push('Add strength training for bone density and metabolism');
        break;
    }

    const overallAlignment = Math.round(
      (calorieDeficitSupport + musclePreservation + muscleGrowthPotential + cardiovascularHealth) / 4
    );

    if (recommendations.length === 0) {
      recommendations.push('Your training plan is well-aligned with your goals. Keep up the great work!');
    }

    return {
      calorieDeficitSupport,
      musclePreservation,
      muscleGrowthPotential,
      cardiovascularHealth,
      overallAlignment,
      recommendations,
    };
  },

  // Get today's workout from a weekly plan
  getTodaysWorkout(weeklyPlan: WeeklyTrainingPlan): TrainingDay | null {
    const today = new Date().toISOString().split('T')[0];
    const allDays = weeklyPlan.weeks?.flatMap(w => w.days) || weeklyPlan.days || [];
    return allDays.find(d => d?.date === today) || null;
  },

  // Get plan summary for display
  getPlanSummary(weeklyPlan: WeeklyTrainingPlan, preferences: TrainingPreferences): PlanSummary {
    const allDays = weeklyPlan.weeks?.flatMap(w => w.days) || weeklyPlan.days || [];
    const workouts = allDays.filter(d => d?.workout).map(d => d.workout!);
    const workoutCount = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

    const goalText = {
      lose_weight: 'weight loss',
      build_muscle: 'muscle building',
      maintain: 'maintenance',
      improve_health: 'overall health',
      general_fitness: 'general fitness',
    }[preferences.primaryGoal || 'general_fitness'] || 'fitness';

    return {
      overview: `A personalized ${workoutCount}-day per week training plan designed for ${goalText}.`,
      weeklyStructure: `${workoutCount} training sessions averaging ${Math.round(totalDuration / Math.max(workoutCount, 1))} minutes each.`,
      strengthFocus: workouts.some(w => w.type === 'strength' || w.type === 'hypertrophy')
        ? 'Includes progressive strength training to build and maintain muscle.'
        : 'Focus on bodyweight and functional movements.',
      cardioFocus: workouts.some(w => w.type === 'cardio' || w.type === 'hiit')
        ? 'Cardiovascular sessions included for heart health and calorie burn.'
        : 'Active recovery and mobility work for cardiovascular benefits.',
      expectedOutcomes: [
        { metric: 'Strength', targetValue: '+5-10%', timeframe: '4 weeks', confidence: 'high' as const },
        { metric: 'Endurance', targetValue: 'Improved', timeframe: '2-3 weeks', confidence: 'medium' as const },
      ],
      weekByWeekProgression: [
        'Week 1: Foundation and form focus',
        'Week 2: Gradual intensity increase',
        'Week 3: Progressive overload',
        'Week 4: Deload and assessment',
      ],
      nutritionIntegration: 'Ensure adequate protein intake (1.6-2.2g/kg) and stay hydrated.',
      recoveryRecommendations: [
        'Get 7-9 hours of sleep per night',
        'Stay hydrated throughout the day',
        'Include rest days for muscle recovery',
      ],
      keyMetricsToTrack: [
        'Weight lifted progression',
        'Reps completed',
        'Workout consistency',
      ],
      adjustmentTriggers: [
        'If progress stalls for 2+ weeks, increase volume or intensity',
        'If feeling overtrained, add an extra rest day',
      ],
    };
  },
};

export default trainingService;
