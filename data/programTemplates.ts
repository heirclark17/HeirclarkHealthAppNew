// Training Program Templates
// Based on proven programs: Starting Strength, StrongLifts, PPL, PHUL, nSuns, 5/3/1, etc.

import { ProgramTemplate, CardioIntegration } from '../types/training';

// Cardio integration templates by goal
const CARDIO_FAT_LOSS: CardioIntegration = {
  type: 'post_workout',
  frequency: 'Every workout + 1-2 dedicated sessions',
  duration: '20-30 min',
  intensity: 'mixed',
  recommendations: [
    '20min HIIT after strength (rowing, bike, burpees)',
    'Options: jump rope intervals, battle ropes, assault bike',
    '1-2 additional LISS sessions on rest days (30-45min walk)',
    'Heart rate: 70-85% max during HIIT intervals',
  ],
};

const CARDIO_STRENGTH: CardioIntegration = {
  type: 'post_workout',
  frequency: 'Every workout',
  duration: '10-15 min',
  intensity: 'low',
  recommendations: [
    '10-15min light LISS (incline walk, easy bike)',
    'Heart health without impacting recovery',
    'Keep heart rate below 65% max',
    'Options: stair climber (slow), brisk walk, light rowing',
  ],
};

const CARDIO_HYPERTROPHY: CardioIntegration = {
  type: 'post_workout',
  frequency: 'Every workout',
  duration: '15-20 min',
  intensity: 'moderate',
  recommendations: [
    '15-20min moderate cardio after lifting',
    'Incline treadmill walk, stationary bike, elliptical',
    'Helps with nutrient partitioning and recovery',
    'Keep intensity low enough to not impact gains',
  ],
};

const CARDIO_ENDURANCE: CardioIntegration = {
  type: 'integrated',
  frequency: 'Every session + dedicated cardio days',
  duration: '30-45 min',
  intensity: 'mixed',
  recommendations: [
    '30min Zone 2 cardio 3-4x per week',
    '1 HIIT session per week',
    'Options: running, cycling, swimming, rowing',
    'Build aerobic base with occasional high-intensity work',
  ],
};

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  // ==========================================
  // BEGINNER PROGRAMS
  // ==========================================
  {
    id: 'starting-strength',
    name: 'Starting Strength',
    shortName: 'SS',
    description: 'Classic barbell program focusing on the major compound lifts. Perfect for absolute beginners to build a strength foundation.',
    philosophy: 'Linear progression on major barbell lifts. Master the basics before adding complexity. Strength is the foundation of all fitness.',
    source: 'Mark Rippetoe',
    duration: 12,
    daysPerWeek: 3,
    difficulty: 'beginner',
    focus: ['Strength', 'Compound Lifts', 'Foundation Building'],
    targetGoals: ['build_muscle', 'improve_health'],
    suitableFor: {
      fitnessLevels: ['beginner'],
      equipmentAccess: ['full_gym', 'home_gym'],
      timeCommitment: 'low',
      experience: '0-6 months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Workout A',
        workoutType: 'strength',
        muscleGroups: ['legs', 'chest', 'back'],
        primaryLifts: ['squat', 'bench-press', 'deadlift'],
        accessoryWork: [],
        estimatedDuration: 45,
      },
      {
        day: 3,
        name: 'Workout B',
        workoutType: 'strength',
        muscleGroups: ['legs', 'shoulders', 'back'],
        primaryLifts: ['squat', 'overhead-press', 'deadlift'],
        accessoryWork: ['barbell-row'],
        estimatedDuration: 45,
      },
      {
        day: 5,
        name: 'Workout A',
        workoutType: 'strength',
        muscleGroups: ['legs', 'chest', 'back'],
        primaryLifts: ['squat', 'bench-press', 'deadlift'],
        accessoryWork: [],
        estimatedDuration: 45,
      },
    ],
    progressionScheme: 'Add 5lb to upper body lifts, 10lb to lower body lifts each session until stall.',
    deloadProtocol: 'When you fail a weight 3 times, deload by 10% and work back up.',
    cardioIntegration: CARDIO_STRENGTH,
  },

  {
    id: 'stronglifts-5x5',
    name: 'StrongLifts 5x5',
    shortName: 'SL5x5',
    description: 'Simple and effective 5x5 program. Three workouts per week, alternating between two workouts.',
    philosophy: '5 sets of 5 reps provides optimal volume for strength and hypertrophy in beginners. Simple programming allows focus on form.',
    source: 'Mehdi Hadim',
    duration: 12,
    daysPerWeek: 3,
    difficulty: 'beginner',
    focus: ['Strength', 'Muscle Building', 'Simplicity'],
    targetGoals: ['build_muscle', 'improve_health'],
    suitableFor: {
      fitnessLevels: ['beginner'],
      equipmentAccess: ['full_gym', 'home_gym'],
      timeCommitment: 'low',
      experience: '0-6 months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Workout A',
        workoutType: 'strength',
        muscleGroups: ['legs', 'chest', 'back'],
        primaryLifts: ['squat', 'bench-press', 'barbell-row'],
        accessoryWork: [],
        estimatedDuration: 45,
      },
      {
        day: 3,
        name: 'Workout B',
        workoutType: 'strength',
        muscleGroups: ['legs', 'shoulders', 'back'],
        primaryLifts: ['squat', 'overhead-press', 'deadlift'],
        accessoryWork: [],
        estimatedDuration: 45,
      },
      {
        day: 5,
        name: 'Workout A',
        workoutType: 'strength',
        muscleGroups: ['legs', 'chest', 'back'],
        primaryLifts: ['squat', 'bench-press', 'barbell-row'],
        accessoryWork: [],
        estimatedDuration: 45,
      },
    ],
    progressionScheme: 'Add 5lb every successful workout. Squat, bench, row, OHP all progress linearly.',
    deloadProtocol: 'After 3 failures at same weight, deload 10% and switch to 3x5.',
    cardioIntegration: CARDIO_STRENGTH,
  },

  // ==========================================
  // INTERMEDIATE PROGRAMS
  // ==========================================
  {
    id: 'ppl-6day',
    name: 'Push Pull Legs (6-Day)',
    shortName: 'PPL',
    description: 'Popular 6-day split hitting each muscle group twice per week. Great for hypertrophy and strength.',
    philosophy: 'High frequency training with logical muscle group splits. Push muscles (chest, shoulders, triceps), Pull muscles (back, biceps), Legs (quads, hamstrings, glutes).',
    source: 'Reddit PPL / Coolcicada',
    duration: 12,
    daysPerWeek: 6,
    difficulty: 'intermediate',
    focus: ['Hypertrophy', 'Strength', 'High Frequency'],
    targetGoals: ['build_muscle', 'lose_weight'],
    suitableFor: {
      fitnessLevels: ['intermediate', 'advanced'],
      equipmentAccess: ['full_gym'],
      timeCommitment: 'high',
      experience: '6-18 months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Push A (Strength)',
        workoutType: 'push',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        primaryLifts: ['bench-press', 'overhead-press'],
        accessoryWork: ['incline-press', 'lateral-raise', 'tricep-pushdown'],
        estimatedDuration: 60,
      },
      {
        day: 2,
        name: 'Pull A (Strength)',
        workoutType: 'pull',
        muscleGroups: ['back', 'biceps'],
        primaryLifts: ['barbell-row', 'pull-up'],
        accessoryWork: ['face-pull', 'bicep-curl'],
        estimatedDuration: 60,
      },
      {
        day: 3,
        name: 'Legs A (Strength)',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes'],
        primaryLifts: ['squat', 'deadlift'],
        accessoryWork: ['leg-curl', 'calf-raise'],
        estimatedDuration: 60,
      },
      {
        day: 4,
        name: 'Push B (Hypertrophy)',
        workoutType: 'push',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        primaryLifts: ['incline-press', 'overhead-press'],
        accessoryWork: ['lateral-raise', 'tricep-pushdown'],
        estimatedDuration: 60,
      },
      {
        day: 5,
        name: 'Pull B (Hypertrophy)',
        workoutType: 'pull',
        muscleGroups: ['back', 'biceps'],
        primaryLifts: ['pull-up', 'barbell-row'],
        accessoryWork: ['face-pull', 'bicep-curl'],
        estimatedDuration: 60,
      },
      {
        day: 6,
        name: 'Legs B (Hypertrophy)',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes'],
        primaryLifts: ['squat'],
        accessoryWork: ['leg-extension', 'leg-curl', 'calf-raise'],
        estimatedDuration: 60,
      },
    ],
    progressionScheme: 'Double progression: add reps until top of range, then add weight and reset reps.',
    deloadProtocol: 'Every 6-8 weeks, reduce volume by 40% for one week.',
    cardioIntegration: CARDIO_HYPERTROPHY,
  },

  {
    id: 'phul',
    name: 'PHUL (Power Hypertrophy Upper Lower)',
    shortName: 'PHUL',
    description: '4-day split combining power days for strength and hypertrophy days for muscle growth.',
    philosophy: 'Best of both worlds: heavy compound lifts for strength, higher rep work for hypertrophy. Each muscle group trained twice per week.',
    source: 'Brandon Campbell',
    duration: 12,
    daysPerWeek: 4,
    difficulty: 'intermediate',
    focus: ['Strength', 'Hypertrophy', 'Balanced'],
    targetGoals: ['build_muscle', 'improve_health'],
    suitableFor: {
      fitnessLevels: ['intermediate'],
      equipmentAccess: ['full_gym'],
      timeCommitment: 'medium',
      experience: '6-18 months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Upper Power',
        workoutType: 'upper',
        muscleGroups: ['chest', 'back', 'shoulders'],
        primaryLifts: ['bench-press', 'barbell-row', 'overhead-press'],
        accessoryWork: ['pull-up', 'bicep-curl', 'tricep-pushdown'],
        estimatedDuration: 60,
      },
      {
        day: 2,
        name: 'Lower Power',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes'],
        primaryLifts: ['squat', 'deadlift'],
        accessoryWork: ['leg-curl', 'calf-raise'],
        estimatedDuration: 60,
      },
      {
        day: 4,
        name: 'Upper Hypertrophy',
        workoutType: 'upper',
        muscleGroups: ['chest', 'back', 'shoulders'],
        primaryLifts: ['incline-press', 'barbell-row'],
        accessoryWork: ['lateral-raise', 'face-pull', 'bicep-curl', 'tricep-pushdown'],
        estimatedDuration: 60,
      },
      {
        day: 5,
        name: 'Lower Hypertrophy',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes'],
        primaryLifts: ['squat'],
        accessoryWork: ['leg-extension', 'leg-curl', 'calf-raise'],
        estimatedDuration: 60,
      },
    ],
    progressionScheme: 'Power days: 3-5 rep range, add weight when you hit 5 reps. Hypertrophy days: 8-12 reps, add weight at top of range.',
    deloadProtocol: 'Every 4-6 weeks, reduce weight by 10% and reduce volume.',
    cardioIntegration: CARDIO_HYPERTROPHY,
  },

  {
    id: 'upper-lower-4day',
    name: 'Upper Lower Split',
    shortName: 'U/L',
    description: 'Classic 4-day split alternating between upper and lower body. Excellent balance of frequency and recovery.',
    philosophy: 'Simple and effective split for intermediates. Each muscle group trained twice per week with adequate recovery.',
    source: 'Traditional',
    duration: 12,
    daysPerWeek: 4,
    difficulty: 'intermediate',
    focus: ['Balanced Development', 'Recovery', 'Flexibility'],
    targetGoals: ['build_muscle', 'maintain', 'improve_health'],
    suitableFor: {
      fitnessLevels: ['beginner', 'intermediate'],
      equipmentAccess: ['full_gym', 'home_gym'],
      timeCommitment: 'medium',
      experience: '3-18 months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Upper A',
        workoutType: 'upper',
        muscleGroups: ['chest', 'back', 'shoulders'],
        primaryLifts: ['bench-press', 'barbell-row'],
        accessoryWork: ['overhead-press', 'pull-up', 'bicep-curl', 'tricep-pushdown'],
        estimatedDuration: 55,
      },
      {
        day: 2,
        name: 'Lower A',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes'],
        primaryLifts: ['squat', 'deadlift'],
        accessoryWork: ['leg-curl', 'calf-raise'],
        estimatedDuration: 55,
      },
      {
        day: 4,
        name: 'Upper B',
        workoutType: 'upper',
        muscleGroups: ['chest', 'back', 'shoulders'],
        primaryLifts: ['overhead-press', 'pull-up'],
        accessoryWork: ['incline-press', 'barbell-row', 'lateral-raise', 'face-pull'],
        estimatedDuration: 55,
      },
      {
        day: 5,
        name: 'Lower B',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes'],
        primaryLifts: ['squat'],
        accessoryWork: ['leg-extension', 'leg-curl', 'calf-raise'],
        estimatedDuration: 55,
      },
    ],
    progressionScheme: 'Add weight when you complete all sets at the top of the rep range.',
    deloadProtocol: 'Every 6 weeks, reduce intensity by 10-15%.',
    cardioIntegration: CARDIO_HYPERTROPHY,
  },

  // ==========================================
  // ADVANCED PROGRAMS
  // ==========================================
  {
    id: 'nsuns-5day',
    name: 'nSuns 5/3/1 LP',
    shortName: 'nSuns',
    description: 'High volume linear progression based on 5/3/1. Aggressive progression with lots of volume.',
    philosophy: 'Push the main lifts hard with high volume, then add accessory work. Weekly linear progression on training maxes.',
    source: 'Reddit nSuns / Jim Wendler base',
    duration: 16,
    daysPerWeek: 5,
    difficulty: 'advanced',
    focus: ['Strength', 'Volume', 'Aggressive Progression'],
    targetGoals: ['build_muscle'],
    suitableFor: {
      fitnessLevels: ['intermediate', 'advanced'],
      equipmentAccess: ['full_gym'],
      timeCommitment: 'high',
      experience: '12+ months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Bench / OHP',
        workoutType: 'push',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        primaryLifts: ['bench-press', 'overhead-press'],
        accessoryWork: ['incline-press', 'tricep-pushdown', 'lateral-raise'],
        estimatedDuration: 75,
      },
      {
        day: 2,
        name: 'Squat / Sumo DL',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes', 'back'],
        primaryLifts: ['squat', 'deadlift'],
        accessoryWork: ['leg-curl', 'leg-extension', 'calf-raise'],
        estimatedDuration: 75,
      },
      {
        day: 3,
        name: 'OHP / Incline',
        workoutType: 'push',
        muscleGroups: ['shoulders', 'chest', 'triceps'],
        primaryLifts: ['overhead-press', 'incline-press'],
        accessoryWork: ['lateral-raise', 'face-pull', 'tricep-pushdown'],
        estimatedDuration: 75,
      },
      {
        day: 4,
        name: 'Deadlift / Front Squat',
        workoutType: 'lower',
        muscleGroups: ['back', 'legs', 'glutes'],
        primaryLifts: ['deadlift', 'squat'],
        accessoryWork: ['barbell-row', 'leg-curl', 'calf-raise'],
        estimatedDuration: 75,
      },
      {
        day: 5,
        name: 'Bench / Close Grip',
        workoutType: 'push',
        muscleGroups: ['chest', 'triceps'],
        primaryLifts: ['bench-press'],
        accessoryWork: ['pull-up', 'bicep-curl', 'face-pull'],
        estimatedDuration: 75,
      },
    ],
    progressionScheme: 'Increase training max by 5lb (upper) or 10lb (lower) weekly based on AMRAP performance.',
    deloadProtocol: 'When progress stalls, reduce TM by 10% and rebuild.',
    cardioIntegration: CARDIO_STRENGTH,
  },

  {
    id: 'wendler-531',
    name: "Wendler's 5/3/1",
    shortName: '5/3/1',
    description: 'Time-tested program with submaximal training and slow, steady progression. Built for longevity.',
    philosophy: 'Start light, progress slow, break records. Submaximal training allows continuous progress without burnout.',
    source: 'Jim Wendler',
    duration: 16,
    daysPerWeek: 4,
    difficulty: 'intermediate',
    focus: ['Strength', 'Longevity', 'Sustainable Progress'],
    targetGoals: ['build_muscle', 'improve_health'],
    suitableFor: {
      fitnessLevels: ['intermediate', 'advanced'],
      equipmentAccess: ['full_gym', 'home_gym'],
      timeCommitment: 'medium',
      experience: '12+ months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Squat Day',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes', 'core'],
        primaryLifts: ['squat'],
        accessoryWork: ['leg-curl', 'leg-extension', 'plank'],
        estimatedDuration: 60,
      },
      {
        day: 2,
        name: 'Bench Day',
        workoutType: 'push',
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        primaryLifts: ['bench-press'],
        accessoryWork: ['incline-press', 'tricep-pushdown', 'face-pull'],
        estimatedDuration: 60,
      },
      {
        day: 4,
        name: 'Deadlift Day',
        workoutType: 'lower',
        muscleGroups: ['back', 'glutes', 'hamstrings'],
        primaryLifts: ['deadlift'],
        accessoryWork: ['barbell-row', 'leg-curl', 'plank'],
        estimatedDuration: 60,
      },
      {
        day: 5,
        name: 'OHP Day',
        workoutType: 'push',
        muscleGroups: ['shoulders', 'triceps'],
        primaryLifts: ['overhead-press'],
        accessoryWork: ['lateral-raise', 'pull-up', 'bicep-curl'],
        estimatedDuration: 60,
      },
    ],
    progressionScheme: 'Monthly cycles: Week 1 (5s), Week 2 (3s), Week 3 (5/3/1), Week 4 (deload). Increase TM by 5lb upper/10lb lower monthly.',
    deloadProtocol: 'Built-in deload week every 4th week. Reduce to 40-60% of TM.',
    cardioIntegration: CARDIO_STRENGTH,
  },

  // ==========================================
  // FAT LOSS FOCUSED
  // ==========================================
  {
    id: 'fat-loss-3day',
    name: 'Fat Loss Full Body',
    shortName: 'FL3',
    description: 'Full body workouts 3x per week combined with HIIT cardio. Designed to maximize calorie burn while preserving muscle.',
    philosophy: 'Maintain strength training to preserve muscle during a deficit. Add metabolic conditioning for enhanced fat loss.',
    source: 'Evidence-based programming',
    duration: 12,
    daysPerWeek: 3,
    difficulty: 'beginner',
    focus: ['Fat Loss', 'Muscle Preservation', 'Metabolic Conditioning'],
    targetGoals: ['lose_weight'],
    suitableFor: {
      fitnessLevels: ['beginner', 'intermediate'],
      equipmentAccess: ['full_gym', 'home_gym', 'minimal'],
      timeCommitment: 'medium',
      experience: '0-12 months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Full Body A',
        workoutType: 'full_body',
        muscleGroups: ['legs', 'chest', 'back', 'core'],
        primaryLifts: ['squat', 'bench-press', 'barbell-row'],
        accessoryWork: ['plank', 'bicep-curl'],
        estimatedDuration: 45,
      },
      {
        day: 3,
        name: 'Full Body B',
        workoutType: 'full_body',
        muscleGroups: ['legs', 'shoulders', 'back', 'core'],
        primaryLifts: ['deadlift', 'overhead-press', 'pull-up'],
        accessoryWork: ['plank', 'tricep-pushdown'],
        estimatedDuration: 45,
      },
      {
        day: 5,
        name: 'Full Body C',
        workoutType: 'full_body',
        muscleGroups: ['legs', 'chest', 'back', 'core'],
        primaryLifts: ['squat', 'incline-press', 'barbell-row'],
        accessoryWork: ['cable-crunch', 'face-pull'],
        estimatedDuration: 45,
      },
    ],
    progressionScheme: 'Maintain weights during deficit. Focus on preserving strength, not building.',
    deloadProtocol: 'Listen to body. Reduce volume if recovery suffers due to caloric deficit.',
    cardioIntegration: CARDIO_FAT_LOSS,
  },

  {
    id: 'fat-loss-4day',
    name: 'Fat Loss Upper Lower',
    shortName: 'FL4',
    description: '4-day upper/lower split with integrated HIIT. More frequency and volume for enhanced fat burning.',
    philosophy: 'Higher training frequency maintains muscle protein synthesis. HIIT maximizes EPOC for continued calorie burn.',
    source: 'Evidence-based programming',
    duration: 12,
    daysPerWeek: 4,
    difficulty: 'intermediate',
    focus: ['Fat Loss', 'Muscle Retention', 'High Frequency'],
    targetGoals: ['lose_weight'],
    suitableFor: {
      fitnessLevels: ['intermediate'],
      equipmentAccess: ['full_gym'],
      timeCommitment: 'medium',
      experience: '6-18 months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Upper A',
        workoutType: 'upper',
        muscleGroups: ['chest', 'back', 'shoulders'],
        primaryLifts: ['bench-press', 'barbell-row'],
        accessoryWork: ['overhead-press', 'bicep-curl', 'tricep-pushdown'],
        estimatedDuration: 50,
      },
      {
        day: 2,
        name: 'Lower A',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes', 'core'],
        primaryLifts: ['squat', 'deadlift'],
        accessoryWork: ['leg-curl', 'plank'],
        estimatedDuration: 50,
      },
      {
        day: 4,
        name: 'Upper B',
        workoutType: 'upper',
        muscleGroups: ['chest', 'back', 'shoulders'],
        primaryLifts: ['incline-press', 'pull-up'],
        accessoryWork: ['lateral-raise', 'face-pull', 'bicep-curl'],
        estimatedDuration: 50,
      },
      {
        day: 5,
        name: 'Lower B',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes', 'core'],
        primaryLifts: ['squat'],
        accessoryWork: ['leg-extension', 'leg-curl', 'cable-crunch'],
        estimatedDuration: 50,
      },
    ],
    progressionScheme: 'Maintain current weights. If strength drops significantly, slightly reduce deficit.',
    deloadProtocol: 'Every 4 weeks, reduce volume by 30-40%. Critical during caloric deficit.',
    cardioIntegration: CARDIO_FAT_LOSS,
  },

  // ==========================================
  // MINIMAL EQUIPMENT / HOME GYM
  // ==========================================
  {
    id: 'home-dumbbell',
    name: 'Home Dumbbell Program',
    shortName: 'Home DB',
    description: 'Full program using only dumbbells. Perfect for home gyms with limited equipment.',
    philosophy: 'You can build an impressive physique with just dumbbells. Focus on unilateral work and time under tension.',
    source: 'Home Training Fundamentals',
    duration: 12,
    daysPerWeek: 4,
    difficulty: 'beginner',
    focus: ['Home Training', 'Dumbbells Only', 'Flexibility'],
    targetGoals: ['build_muscle', 'maintain', 'improve_health'],
    suitableFor: {
      fitnessLevels: ['beginner', 'intermediate'],
      equipmentAccess: ['home_gym', 'minimal'],
      timeCommitment: 'medium',
      experience: '0-18 months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Upper Push',
        workoutType: 'push',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        primaryLifts: ['bench-press', 'overhead-press'], // DB versions
        accessoryWork: ['lateral-raise', 'tricep-pushdown'],
        estimatedDuration: 45,
      },
      {
        day: 2,
        name: 'Lower',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes'],
        primaryLifts: ['squat', 'deadlift'], // Goblet squat, DB RDL
        accessoryWork: ['calf-raise'],
        estimatedDuration: 45,
      },
      {
        day: 4,
        name: 'Upper Pull',
        workoutType: 'pull',
        muscleGroups: ['back', 'biceps'],
        primaryLifts: ['barbell-row'], // DB row
        accessoryWork: ['bicep-curl', 'face-pull'],
        estimatedDuration: 45,
      },
      {
        day: 5,
        name: 'Full Body',
        workoutType: 'full_body',
        muscleGroups: ['legs', 'chest', 'back', 'core'],
        primaryLifts: ['squat', 'bench-press'],
        accessoryWork: ['plank'],
        estimatedDuration: 45,
      },
    ],
    progressionScheme: 'Increase reps until 15+, then move to heavier dumbbells and reset to 8 reps.',
    deloadProtocol: 'Every 6 weeks, reduce weight by 20% and focus on form.',
    cardioIntegration: {
      type: 'separate_days',
      frequency: '2-3 times per week',
      duration: '20-30 min',
      intensity: 'moderate',
      recommendations: [
        'Bodyweight HIIT circuits',
        'Jump rope intervals',
        'Outdoor walking/jogging',
        'YouTube follow-along cardio',
      ],
    },
  },

  {
    id: 'bodyweight-only',
    name: 'Bodyweight Mastery',
    shortName: 'BWM',
    description: 'Progressive bodyweight program requiring no equipment. Build strength and muscle anywhere.',
    philosophy: 'Master your own bodyweight before adding external load. Progressive overload through leverage and volume.',
    source: 'Calisthenics Fundamentals',
    duration: 12,
    daysPerWeek: 3,
    difficulty: 'beginner',
    focus: ['Bodyweight', 'No Equipment', 'Functional Strength'],
    targetGoals: ['improve_health', 'maintain', 'build_muscle'],
    suitableFor: {
      fitnessLevels: ['beginner', 'intermediate'],
      equipmentAccess: ['bodyweight_only', 'minimal'],
      timeCommitment: 'low',
      experience: '0-12 months',
    },
    weeklyStructure: [
      {
        day: 1,
        name: 'Push Focus',
        workoutType: 'push',
        muscleGroups: ['chest', 'shoulders', 'triceps', 'core'],
        primaryLifts: ['bench-press'], // Push-up variations
        accessoryWork: ['overhead-press', 'plank'], // Pike push-ups, planks
        estimatedDuration: 40,
      },
      {
        day: 3,
        name: 'Pull Focus',
        workoutType: 'pull',
        muscleGroups: ['back', 'biceps', 'core'],
        primaryLifts: ['pull-up', 'barbell-row'], // Pull-ups, inverted rows
        accessoryWork: ['plank'],
        estimatedDuration: 40,
      },
      {
        day: 5,
        name: 'Legs Focus',
        workoutType: 'lower',
        muscleGroups: ['legs', 'glutes', 'core'],
        primaryLifts: ['squat'], // Squat variations
        accessoryWork: ['calf-raise', 'plank'],
        estimatedDuration: 40,
      },
    ],
    progressionScheme: 'Progress to harder variations: push-ups → diamond → archer → one-arm. Increase reps then progress exercise.',
    deloadProtocol: 'Every 4 weeks, reduce volume by half.',
    cardioIntegration: {
      type: 'integrated',
      frequency: 'Every workout',
      duration: '15-20 min',
      intensity: 'mixed',
      recommendations: [
        'Burpees, mountain climbers, jumping jacks',
        'Circuit training between strength sets',
        'Jump rope if available',
        'Outdoor running/walking',
      ],
    },
  },
];

// Helper function to get program by ID
export function getProgramById(id: string): ProgramTemplate | undefined {
  return PROGRAM_TEMPLATES.find(p => p.id === id);
}

// Helper to get programs suitable for a user profile
export function getRecommendedPrograms(
  fitnessLevel: string,
  goal: string,
  daysPerWeek: number,
  equipmentAccess: string
): ProgramTemplate[] {
  return PROGRAM_TEMPLATES.filter(program => {
    const matchesLevel = program.suitableFor.fitnessLevels.includes(fitnessLevel as any);
    const matchesGoal = program.targetGoals.includes(goal as any);
    const matchesDays = program.daysPerWeek <= daysPerWeek;
    const matchesEquipment = program.suitableFor.equipmentAccess.includes(equipmentAccess as any);

    return matchesLevel && matchesGoal && matchesDays && matchesEquipment;
  });
}

// Get all programs for a specific goal
export function getProgramsByGoal(goal: string): ProgramTemplate[] {
  return PROGRAM_TEMPLATES.filter(p => p.targetGoals.includes(goal as any));
}

export default PROGRAM_TEMPLATES;
