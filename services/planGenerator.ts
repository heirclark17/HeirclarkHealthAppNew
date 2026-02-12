// Plan Generator Service - Creates complete training plans with summaries
import {
  TrainingPreferences,
  WeeklyTrainingPlan,
  PlanSummary,
  ExpectedOutcome,
  ProgramTemplate,
  CardioPreference,
  DifficultyLevel,
  CompleteTrainingPlan,
  UserTrainingProfile,
  MuscleGroup,
  WorkoutType,
} from '../types/training';
import { PROGRAM_TEMPLATES, getRecommendedPrograms, getProgramById } from '../data/programTemplates';
import { trainingService } from './trainingService';

// Generate a UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Map goal wizard goal to program goal type
function mapGoalToTarget(goal: string): 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_health' {
  switch (goal) {
    case 'lose_weight':
    case 'fat_loss':
      return 'lose_weight';
    case 'build_muscle':
    case 'strength':
    case 'hypertrophy':
      return 'build_muscle';
    case 'improve_health':
    case 'general_fitness':
    case 'endurance':
      return 'improve_health';
    default:
      return 'maintain';
  }
}

// Get best program based on user preferences
function selectBestProgram(preferences: TrainingPreferences): ProgramTemplate {
  console.log('[PlanGenerator] Selecting program for:', {
    goal: preferences.primaryGoal,
    daysPerWeek: preferences.workoutsPerWeek,
    duration: preferences.workoutDuration,
    fitnessLevel: preferences.fitnessLevel,
    programDurationWeeks: preferences.programDurationWeeks,
  });

  // Get recommended programs for the goal
  // Parameters: fitnessLevel, goal, daysPerWeek, equipmentAccess
  const recommended = getRecommendedPrograms(
    preferences.fitnessLevel,
    preferences.primaryGoal,
    preferences.workoutsPerWeek,
    'full_gym' // Default to full gym, can be enhanced later
  );

  // If we have a timeline, filter programs that fit within the duration
  if (recommended.length > 0 && preferences.programDurationWeeks) {
    // Prefer programs whose duration is close to user's timeline
    const sortedByDuration = recommended.sort((a, b) => {
      const aDiff = Math.abs(a.duration - preferences.programDurationWeeks!);
      const bDiff = Math.abs(b.duration - preferences.programDurationWeeks!);
      return aDiff - bDiff;
    });
    console.log('[PlanGenerator] Using recommended program (timeline-matched):', sortedByDuration[0].name,
      `(${sortedByDuration[0].duration} weeks vs user's ${preferences.programDurationWeeks} weeks)`);
    return sortedByDuration[0];
  } else if (recommended.length > 0) {
    console.log('[PlanGenerator] Using recommended program:', recommended[0].name);
    return recommended[0];
  }

  // Fallback: Try matching by goal only
  const goalMatches = PROGRAM_TEMPLATES.filter(p =>
    p.targetGoals.includes(preferences.primaryGoal as any)
  );

  if (goalMatches.length > 0) {
    // Sort by days per week and duration to find closest match
    const sorted = goalMatches.sort((a, b) => {
      const daysScore = Math.abs(a.daysPerWeek - preferences.workoutsPerWeek) -
                        Math.abs(b.daysPerWeek - preferences.workoutsPerWeek);

      // If timeline is specified, also consider duration
      if (preferences.programDurationWeeks) {
        const durationScore = Math.abs(a.duration - preferences.programDurationWeeks) -
                             Math.abs(b.duration - preferences.programDurationWeeks);
        return daysScore + (durationScore * 0.5); // Weight duration less than days/week
      }
      return daysScore;
    });
    console.log('[PlanGenerator] Using goal-matched program:', sorted[0].name);
    return sorted[0];
  }

  // Final fallback to a general program
  const fallback = PROGRAM_TEMPLATES.find(p => p.id === 'upper-lower-4day') || PROGRAM_TEMPLATES[0];
  console.log('[PlanGenerator] Using fallback program:', fallback.name);
  return fallback;
}

// Generate cardio summary based on preference
function generateCardioSummary(
  preference: CardioPreference,
  goal: string,
  sessionsPerWeek: number
): string {
  const cardioDetails: Record<CardioPreference, Record<string, string>> = {
    walking: {
      lose_weight: `${sessionsPerWeek}x walking sessions (30-45 min Zone 2). Low impact, sustainable fat burning through longer duration steady-state. Incline treadmill walking recommended for enhanced calorie burn.`,
      build_muscle: `${Math.max(1, sessionsPerWeek - 1)}x light walking sessions (20-30 min). Active recovery to support muscle growth without interfering with hypertrophy training.`,
      maintain: `${sessionsPerWeek}x moderate walking sessions (25-35 min). Balanced cardiovascular maintenance for overall health.`,
      improve_health: `${sessionsPerWeek}x brisk walking sessions (30-40 min Zone 2). Foundation of cardiovascular health with minimal joint stress.`,
    },
    running: {
      lose_weight: `${sessionsPerWeek}x running sessions mixing steady-state (25-35 min Zone 2-3) and interval runs. High calorie burn with afterburn effect.`,
      build_muscle: `${Math.max(1, sessionsPerWeek - 1)}x light running sessions (15-25 min). Controlled cardio to maintain conditioning without excessive caloric expenditure.`,
      maintain: `${sessionsPerWeek}x running sessions (25-35 min). Variety of paces to maintain cardiovascular fitness and endurance.`,
      improve_health: `${sessionsPerWeek}x running sessions (20-30 min Zone 2-3). Progressive build-up for heart health and aerobic capacity.`,
    },
    hiit: {
      lose_weight: `${sessionsPerWeek}x HIIT sessions (15-25 min). Maximum calorie burn with EPOC (afterburn) effect. Includes burpees, jump squats, mountain climbers, and kettlebell work.`,
      build_muscle: `${Math.max(1, sessionsPerWeek - 1)}x HIIT sessions (15-20 min). Power-based intervals to complement strength training without excessive volume.`,
      maintain: `${sessionsPerWeek}x HIIT sessions (20-25 min). Time-efficient cardio with variety to prevent plateaus.`,
      improve_health: `${sessionsPerWeek}x HIIT sessions (15-25 min). Mixed intensity to improve both anaerobic and aerobic capacity.`,
    },
  };

  return cardioDetails[preference][goal] || cardioDetails[preference].maintain;
}

// Generate expected outcomes based on goal
function generateExpectedOutcomes(
  goal: string,
  weeks: number,
  preferences: TrainingPreferences
): ExpectedOutcome[] {
  const outcomes: ExpectedOutcome[] = [];

  switch (goal) {
    case 'lose_weight':
      outcomes.push(
        {
          metric: 'Weight Loss',
          targetValue: `${weeks * 0.5}-${weeks * 1}+ lbs`,
          timeframe: `${weeks} weeks`,
          confidence: 'high',
        },
        {
          metric: 'Body Fat Reduction',
          targetValue: '2-4%',
          timeframe: `${weeks} weeks`,
          confidence: 'medium',
        },
        {
          metric: 'Cardio Endurance',
          targetValue: '20-30% improvement',
          timeframe: `${weeks} weeks`,
          confidence: 'high',
        },
        {
          metric: 'Muscle Preservation',
          targetValue: 'Maintain current lean mass',
          timeframe: 'Ongoing',
          confidence: 'high',
        }
      );
      break;

    case 'build_muscle':
      outcomes.push(
        {
          metric: 'Lean Muscle Gain',
          targetValue: `${weeks * 0.25}-${weeks * 0.5} lbs`,
          timeframe: `${weeks} weeks`,
          confidence: 'medium',
        },
        {
          metric: 'Strength Increase',
          targetValue: '10-20% on major lifts',
          timeframe: `${weeks} weeks`,
          confidence: 'high',
        },
        {
          metric: 'Training Volume',
          targetValue: 'Progressive increase',
          timeframe: 'Weekly',
          confidence: 'high',
        },
        {
          metric: 'Body Composition',
          targetValue: 'Improved muscle definition',
          timeframe: `${weeks} weeks`,
          confidence: 'medium',
        }
      );
      break;

    case 'improve_health':
      outcomes.push(
        {
          metric: 'Cardiovascular Health',
          targetValue: '15-25% VO2max improvement',
          timeframe: `${weeks} weeks`,
          confidence: 'high',
        },
        {
          metric: 'Resting Heart Rate',
          targetValue: '5-10 bpm reduction',
          timeframe: `${weeks} weeks`,
          confidence: 'medium',
        },
        {
          metric: 'Functional Fitness',
          targetValue: 'Daily activities easier',
          timeframe: '4 weeks',
          confidence: 'high',
        },
        {
          metric: 'Energy Levels',
          targetValue: 'Sustained improvement',
          timeframe: '2-3 weeks',
          confidence: 'high',
        }
      );
      break;

    default: // maintain
      outcomes.push(
        {
          metric: 'Current Fitness',
          targetValue: 'Maintained or improved',
          timeframe: 'Ongoing',
          confidence: 'high',
        },
        {
          metric: 'Strength Levels',
          targetValue: 'Stable or 5-10% increase',
          timeframe: `${weeks} weeks`,
          confidence: 'high',
        },
        {
          metric: 'Body Composition',
          targetValue: 'Stable',
          timeframe: 'Ongoing',
          confidence: 'high',
        }
      );
  }

  return outcomes;
}

// Generate week-by-week progression
function generateWeekProgression(
  program: ProgramTemplate,
  goal: string,
  totalWeeks: number
): string[] {
  const progression: string[] = [];

  if (goal === 'lose_weight') {
    progression.push(
      'Week 1-2: Foundation phase. Learn movements, establish baseline, build habits.',
      'Week 3-4: Intensity building. Increase workout intensity, refine form.',
      'Week 5-6: Metabolic phase. Higher rep ranges, shorter rest periods.',
      'Week 7-8: Peak conditioning. Maximum effort sessions, deload if needed.'
    );
  } else if (goal === 'build_muscle') {
    progression.push(
      'Week 1-2: Volume accumulation. Moderate weights, focus on technique.',
      'Week 3-4: Progressive overload. Increase weights 2.5-5% each session.',
      'Week 5-6: Intensity phase. Heavy sets, compound movements prioritized.',
      'Week 7: Deload. Reduce volume by 40%, maintain intensity.',
      'Week 8-12: Growth phase. Repeat cycle with increased baseline.'
    );
  } else {
    progression.push(
      'Week 1-2: Adaptation phase. Build consistent routine.',
      'Week 3-4: Progression phase. Gradual increases in difficulty.',
      'Week 5-6: Consolidation phase. Maintain improvements, refine techniques.',
      'Week 7+: Maintenance phase. Sustainable long-term routine.'
    );
  }

  return progression.slice(0, Math.ceil(totalWeeks / 2) + 1);
}

// Generate complete plan summary
export function generatePlanSummary(
  preferences: TrainingPreferences,
  program: ProgramTemplate
): PlanSummary {
  const goal = preferences.primaryGoal;
  const cardioPreference = preferences.cardioPreference || 'walking';
  const duration = program.duration || 8;

  // Calculate cardio sessions per week based on goal
  let cardioSessions = 2;
  if (goal === 'lose_weight') cardioSessions = 3;
  else if (goal === 'improve_health') cardioSessions = 3;
  else if (goal === 'build_muscle') cardioSessions = 2;

  const goalDescriptions: Record<string, string> = {
    lose_weight: `Your personalized ${duration}-week fat loss program combining strategic strength training with ${cardioPreference === 'hiit' ? 'high-intensity intervals' : cardioPreference === 'running' ? 'running sessions' : 'walking-based cardio'} for optimal calorie burn while preserving lean muscle mass.`,
    build_muscle: `Your personalized ${duration}-week muscle building program using ${program.name} methodology. Progressive overload principles with strategic cardio to support growth without hindering recovery.`,
    improve_health: `Your personalized ${duration}-week health improvement program balancing strength, cardio, and mobility for comprehensive fitness and wellness enhancement.`,
    maintain: `Your personalized ${duration}-week maintenance program designed to preserve your current fitness while providing variety and preventing plateaus.`,
  };

  return {
    overview: goalDescriptions[goal] || goalDescriptions.maintain,

    weeklyStructure: `${preferences.workoutsPerWeek} training days per week, each session approximately ${preferences.workoutDuration} minutes. Includes ${program.daysPerWeek} strength sessions and ${cardioSessions} dedicated cardio sessions. Rest days strategically placed for optimal recovery.`,

    strengthFocus: `${program.name} - ${program.philosophy}. ${program.progressionScheme}`,

    cardioFocus: generateCardioSummary(cardioPreference, goal, cardioSessions),

    expectedOutcomes: generateExpectedOutcomes(goal, duration, preferences),

    weekByWeekProgression: generateWeekProgression(program, goal, duration),

    nutritionIntegration: goal === 'lose_weight'
      ? 'Maintain your calculated calorie deficit. Prioritize protein (0.8-1g per lb bodyweight) to preserve muscle during fat loss. Time carbs around workouts for energy.'
      : goal === 'build_muscle'
      ? 'Ensure adequate calorie surplus (200-500 kcal). Prioritize protein (1g per lb bodyweight) and carbs for recovery. Post-workout nutrition within 2 hours.'
      : 'Follow your balanced macro targets. Adjust calories based on workout days. Stay hydrated (8+ glasses water daily).',

    recoveryRecommendations: [
      'Sleep 7-9 hours per night for optimal recovery',
      'Active recovery on rest days (light walking, stretching)',
      'Foam rolling 10 minutes post-workout',
      'Listen to your body - extra rest if needed',
      'Stay hydrated throughout the day',
    ],

    keyMetricsToTrack: [
      'Weekly workout completion rate',
      'Progressive weight increases',
      'Resting heart rate trends',
      'Body measurements (monthly)',
      'Energy and sleep quality',
    ],

    adjustmentTriggers: [
      'Plateau in progress for 2+ weeks',
      'Persistent fatigue or soreness',
      'Life changes affecting schedule',
      'Goal changes or refinements',
      'After completing the program duration',
    ],
  };
}

// Main plan generation function
export const planGenerator = {
  // Generate a complete training plan with summary
  // If programId is provided, use that specific program instead of auto-selecting
  generateCompletePlan(
    preferences: TrainingPreferences,
    userProfile?: Partial<UserTrainingProfile>,
    programId?: string
  ): { weeklyPlan: WeeklyTrainingPlan; program: ProgramTemplate; summary: PlanSummary } {
    console.log('[PlanGenerator] Generating complete plan...', programId ? `with program: ${programId}` : 'auto-selecting');

    // Use specific program if provided, otherwise auto-select
    let program: ProgramTemplate;
    if (programId) {
      const specificProgram = getProgramById(programId);
      if (specificProgram) {
        console.log('[PlanGenerator] Using user-selected program:', specificProgram.name);
        program = specificProgram;
      } else {
        console.warn('[PlanGenerator] Program not found:', programId, '- falling back to auto-select');
        program = selectBestProgram(preferences);
      }
    } else {
      program = selectBestProgram(preferences);
    }

    // Generate weekly plan using the selected program's structure
    // Adjust preferences to match the program's requirements
    const adjustedPreferences: TrainingPreferences = {
      ...preferences,
      workoutsPerWeek: program.daysPerWeek, // Use program's day structure
    };

    const weeklyPlan = trainingService.generateWeeklyPlan(adjustedPreferences, 1);

    // Generate plan summary
    const summary = generatePlanSummary(preferences, program);

    console.log('[PlanGenerator] Plan generated:', {
      program: program.name,
      workouts: weeklyPlan.totalWorkouts,
      outcomeCount: summary.expectedOutcomes.length,
    });

    return {
      weeklyPlan,
      program,
      summary,
    };
  },

  // Generate multi-week complete training plan
  generateMultiWeekPlan(
    preferences: TrainingPreferences,
    weeks: number = 8
  ): CompleteTrainingPlan {
    console.log('[PlanGenerator] Generating', weeks, 'week plan...');

    const program = selectBestProgram(preferences);
    const summary = generatePlanSummary(preferences, program);

    // Generate weekly plans for each week
    const weeklyPlans: WeeklyTrainingPlan[] = [];
    for (let i = 1; i <= weeks; i++) {
      const weekPlan = trainingService.generateWeeklyPlan(preferences, i);
      weeklyPlans.push(weekPlan);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + weeks * 7);

    return {
      id: generateUUID(),
      name: `${program.name} - ${weeks} Week Program`,
      programTemplate: program,
      userProfile: {
        fitnessLevel: preferences.fitnessLevel,
        primaryGoal: preferences.primaryGoal as any,
        daysPerWeek: preferences.workoutsPerWeek as any,
        sessionDuration: preferences.workoutDuration as any,
        equipmentAccess: 'full_gym',
        availableEquipment: preferences.availableEquipment,
        preferences: {
          cardioPreference: preferences.cardioPreference || 'walking',
        },
        experience: {
          yearsTraining: 0,
          familiarWithCompounds: false,
        },
      },
      weeklyPlans,
      summary,
      createdAt: new Date().toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      currentWeek: 1,
      isActive: true,
    };
  },

  // Get program templates
  getAllPrograms(): ProgramTemplate[] {
    return PROGRAM_TEMPLATES;
  },

  // Get recommended programs for user
  getRecommendedPrograms(
    goal: string,
    daysPerWeek: number,
    fitnessLevel: DifficultyLevel,
    equipmentAccess: string = 'full_gym'
  ): ProgramTemplate[] {
    const mappedGoal = mapGoalToTarget(goal);
    return getRecommendedPrograms(fitnessLevel, mappedGoal, daysPerWeek, equipmentAccess);
  },

  // Get program by ID
  getProgramById(id: string): ProgramTemplate | undefined {
    return getProgramById(id);
  },

  // Generate summary only (for display)
  generateSummaryOnly(preferences: TrainingPreferences): PlanSummary {
    const program = selectBestProgram(preferences);
    return generatePlanSummary(preferences, program);
  },
};

export default planGenerator;
