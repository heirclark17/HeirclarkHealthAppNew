import OpenAI from 'openai';
import Constants from 'expo-constants';
import {
  CompleteTrainingPlan,
  WeeklyTrainingPlan,
  TrainingDay,
  Workout,
  WorkoutExercise,
  Exercise,
  ExerciseAlternative,
  TrainingPreferences,
  ProgramTemplate,
  UserTrainingProfile,
  PlanSummary,
  MuscleGroup,
  WorkoutType,
  DifficultyLevel,
  Equipment,
} from '../types/training';
import { trainingService } from './trainingService';
import { weightTrackingStorage } from './weightTrackingStorage';
import { exerciseDbService } from './exerciseDbService';

/**
 * Program Generator Service
 * Generates multi-week AI workout programs with calendar alignment
 * Uses structured JSON response format from GPT-4.1-mini
 */

// Get API key from Expo environment variables
const getApiKey = () => {
  return Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
};

// Lazy-load OpenAI client
let openaiClient: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = getApiKey();

    if (!apiKey) {
      throw new Error(
        'OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file. ' +
        'Get your key from https://platform.openai.com/api-keys'
      );
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Required for React Native
    });
  }

  return openaiClient;
};

/**
 * Get the most recent Monday from a given date
 */
function getMostRecentMonday(date: Date = new Date()): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday is 0, Monday is 1
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Add days to a date and return ISO string
 */
function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

/**
 * Get day of week name from day number (1-7)
 */
function getDayOfWeek(dayNumber: number): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' {
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  return days[dayNumber - 1];
}

// ============================================================================
// AI Response Types (what GPT returns)
// ============================================================================

interface AIExerciseAlternative {
  name: string;
  equipment: string;
  difficulty: 'easier' | 'same' | 'harder';
  notes?: string;
}

interface AIExercise {
  name: string;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  sets: number;
  reps: string; // "10-12" or "30 sec"
  restSeconds: number;
  weight?: string; // "135 lbs" or "bodyweight" or "moderate"
  notes?: string;
  alternatives: AIExerciseAlternative[];
}

interface AIWorkout {
  name: string;
  type: string; // "push", "pull", "upper", "lower", "full_body", etc.
  duration: number;
  difficulty: string;
  musclesFocused: string[];
  estimatedCalories: number;
  warmup?: AIExercise[];
  exercises: AIExercise[];
  cooldown?: AIExercise[];
}

interface AIDay {
  dayNumber: number;
  dayName: string; // "Monday", "Tuesday", etc.
  isRestDay: boolean;
  workout?: AIWorkout;
}

interface AIWeek {
  weekNumber: number;
  phase: string; // "Accumulation", "Intensity", "Deload"
  days: AIDay[];
}

interface AIProgramResponse {
  programName: string;
  totalWeeks: number;
  weeks: AIWeek[];
}

// ============================================================================
// Equipment mapping
// ============================================================================

const EQUIPMENT_MAP: Record<string, Equipment> = {
  'barbell': 'barbell',
  'dumbbell': 'dumbbells',
  'dumbbells': 'dumbbells',
  'machine': 'cable_machine',
  'cable': 'cable_machine',
  'cable machine': 'cable_machine',
  'bodyweight': 'bodyweight',
  'body weight': 'bodyweight',
  'kettlebell': 'kettlebell',
  'resistance band': 'resistance_bands',
  'resistance bands': 'resistance_bands',
  'smith machine': 'smith_machine',
  'ez bar': 'ez_bar',
  'ez-bar': 'ez_bar',
  'trap bar': 'trap_bar',
  'medicine ball': 'medicine_ball',
  'pull up bar': 'pull_up_bar',
  'pull-up bar': 'pull_up_bar',
  'dip station': 'dip_station',
  'bench': 'bench',
  'squat rack': 'squat_rack',
  'none': 'none',
};

function mapEquipment(raw: string): Equipment {
  const lower = raw.toLowerCase().trim();
  return EQUIPMENT_MAP[lower] || 'none';
}

// ============================================================================
// Muscle group mapping
// ============================================================================

const MUSCLE_MAP: Record<string, MuscleGroup> = {
  'chest': 'chest',
  'pectorals': 'chest',
  'pecs': 'chest',
  'back': 'back',
  'lats': 'back',
  'latissimus dorsi': 'back',
  'rhomboids': 'back',
  'traps': 'back',
  'trapezius': 'back',
  'shoulders': 'shoulders',
  'deltoids': 'shoulders',
  'delts': 'shoulders',
  'front delts': 'shoulders',
  'rear delts': 'shoulders',
  'side delts': 'shoulders',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'legs': 'legs',
  'quadriceps': 'quads',
  'quads': 'quads',
  'hamstrings': 'hamstrings',
  'glutes': 'glutes',
  'gluteus': 'glutes',
  'calves': 'calves',
  'core': 'core',
  'abs': 'core',
  'abdominals': 'core',
  'obliques': 'core',
  'forearms': 'forearms',
  'full body': 'full_body',
  'full_body': 'full_body',
  'cardio': 'cardio',
};

function mapMuscleGroup(raw: string): MuscleGroup {
  const lower = raw.toLowerCase().trim();
  return MUSCLE_MAP[lower] || 'full_body';
}

// ============================================================================
// Workout type mapping
// ============================================================================

const WORKOUT_TYPE_MAP: Record<string, WorkoutType> = {
  'push': 'push',
  'pull': 'pull',
  'upper': 'upper',
  'lower': 'lower',
  'full_body': 'full_body',
  'full body': 'full_body',
  'strength': 'strength',
  'hypertrophy': 'hypertrophy',
  'endurance': 'endurance',
  'hiit': 'hiit',
  'cardio': 'cardio',
  'rest': 'rest',
  'flexibility': 'flexibility',
};

function mapWorkoutType(raw: string): WorkoutType {
  const lower = raw.toLowerCase().trim();
  return WORKOUT_TYPE_MAP[lower] || 'strength';
}

// ============================================================================
// Difficulty mapping
// ============================================================================

function mapDifficulty(raw: string): DifficultyLevel {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('beginner') || lower.includes('easy')) return 'beginner';
  if (lower.includes('advanced') || lower.includes('hard')) return 'advanced';
  if (lower.includes('elite') || lower.includes('expert')) return 'elite';
  return 'intermediate';
}

// ============================================================================
// Main generation function
// ============================================================================

/**
 * Generate a multi-week training program using AI
 */
export async function generateMultiWeekProgram(
  preferences: TrainingPreferences,
  programTemplate: ProgramTemplate,
  userProfile: UserTrainingProfile,
  weeks: number = 4,
  researchContext?: string
): Promise<CompleteTrainingPlan> {
  console.log('[ProgramGenerator] Generating', weeks, 'week program for', programTemplate.name);

  // Calculate calendar dates
  const startDate = getMostRecentMonday();
  const calendarStartDate = startDate.toISOString().split('T')[0];

  // Fetch historical weight data for AI prompt enrichment
  let weightHistoryContext = '';
  try {
    const exerciseIds = await weightTrackingStorage.getExercisesWithHistory();
    if (exerciseIds.length > 0) {
      const progressData = await Promise.all(
        exerciseIds.slice(0, 15).map(async (id) => {
          const logs = await weightTrackingStorage.getLogsForExercise(id);
          if (logs.length === 0) return null;
          const name = logs[0].exerciseName;
          const maxWeight = Math.max(...logs.map(l => l.maxWeight));
          const unit = logs[0].sets[0]?.unit || 'lb';
          return `  - ${name}: ${maxWeight} ${unit} (${logs.length} sessions)`;
        })
      );
      const validEntries = progressData.filter(Boolean);
      if (validEntries.length > 0) {
        weightHistoryContext = `\nUSER'S EXERCISE HISTORY (use these to prescribe appropriate starting weights):\n${validEntries.join('\n')}\n`;
      }
    }
  } catch (histErr) {
    console.warn('[ProgramGenerator] Could not load weight history:', histErr);
  }

  // Build AI prompt
  const prompt = buildProgramPrompt(preferences, programTemplate, userProfile, weeks, researchContext, weightHistoryContext);

  try {
    const openai = getOpenAI();

    // Call GPT-4.1-mini with JSON response format
    // Only generate Week 1 via AI, then programmatically create remaining weeks
    // with progressive overload to avoid JSON truncation
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert fitness program designer with deep knowledge of exercise science, progressive overload, periodization, and training program design. You MUST respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });

    const aiOutput = response.choices[0].message.content || '';
    console.log('[ProgramGenerator] AI response length:', aiOutput.length);

    // Check for truncation (finish_reason !== 'stop')
    const finishReason = response.choices[0].finish_reason;
    if (finishReason === 'length') {
      console.warn('[ProgramGenerator] AI response was truncated (finish_reason=length)');
    }

    // Parse structured JSON output - AI generates Week 1 only
    const weeklyPlans = parseAIProgramOutput(aiOutput, startDate, weeks, programTemplate.daysPerWeek);

    // AI-powered weight adjustment for weeks 2+ (progressive overload)
    if (weeklyPlans.length > 1) {
      try {
        const week1Exercises = weeklyPlans[0].days
          .filter(d => d.workout)
          .flatMap(d => d.workout!.exercises.map(ex => ({
            name: ex.exercise.name,
            weight: ex.weight,
            sets: ex.sets,
            reps: ex.reps,
          })));

        // Generate weights for each subsequent week in parallel
        const weightPromises = weeklyPlans.slice(1).map((_, idx) => {
          const weekIndex = idx + 1;
          const isDeload = weekIndex >= weeks - 1 && weeks > 2;
          const phase = isDeload ? 'Deload' : weekIndex < Math.floor(weeks * 0.5) ? 'Accumulation' : 'Intensification';
          return generateWeekWeights(week1Exercises, weekIndex, weeks, phase, preferences);
        });

        const weekWeightMaps = await Promise.all(weightPromises);

        // Apply AI weights to weeks 2+
        for (let i = 0; i < weekWeightMaps.length; i++) {
          const weightMap = weekWeightMaps[i];
          const week = weeklyPlans[i + 1];
          for (const day of week.days) {
            if (!day.workout) continue;
            for (const ex of day.workout.exercises) {
              const aiWeight = weightMap[ex.exercise.name];
              if (aiWeight) {
                ex.weight = aiWeight;
              }
            }
          }
        }
        console.log('[ProgramGenerator] ✅ AI weight adjustments applied to weeks 2-' + weeks);
      } catch (weightAdjErr) {
        console.warn('[ProgramGenerator] AI weight adjustment failed, using Week 1 weights:', weightAdjErr);
      }
    }

    // Pre-populate exercise weights from overload history (overrides AI if user has logged data)
    try {
      for (const week of weeklyPlans) {
        for (const day of week.days) {
          if (!day.workout) continue;
          for (const ex of day.workout.exercises) {
            const progress = await weightTrackingStorage.getExerciseProgress(ex.exerciseId, ex.exercise.name);
            if (progress && progress.suggestedNextWeight > 0) {
              ex.weight = `${progress.suggestedNextWeight} ${progress.currentMaxUnit}`;
            }
          }
        }
      }
      console.log('[ProgramGenerator] ✅ Exercise weights pre-populated from overload history');
    } catch (weightErr) {
      console.warn('[ProgramGenerator] Weight pre-population failed:', weightErr);
    }

    // Enrich exercises with ExerciseDB GIF URLs (fire-and-forget, don't block)
    enrichWithExerciseDb(weeklyPlans).catch(err =>
      console.warn('[ProgramGenerator] ExerciseDB enrichment failed:', err)
    );

    // Build complete training plan
    const plan: CompleteTrainingPlan = {
      id: `program-${Date.now()}`,
      name: programTemplate.name,
      programTemplate,
      userProfile,
      weeklyPlans,
      summary: calculatePlanSummary(weeklyPlans, programTemplate, weeks),
      createdAt: new Date().toISOString(),
      startDate: calendarStartDate,
      endDate: addDays(startDate, weeks * 7),
      currentWeek: 1,
      isActive: true,
      calendarStartDate,
      currentWeekIndex: 0,
      totalWeeks: weeks,
    };

    console.log('[ProgramGenerator] Generated', weeks, 'week program with', weeklyPlans.length, 'weeks');
    return plan;

  } catch (error) {
    console.error('[ProgramGenerator] AI generation failed:', error);
    return generateFallbackProgram(preferences, programTemplate, userProfile, weeks, startDate);
  }
}

// ============================================================================
// Prompt builder
// ============================================================================

function buildProgramPrompt(
  preferences: TrainingPreferences,
  template: ProgramTemplate,
  profile: UserTrainingProfile,
  weeks: number,
  researchContext?: string,
  weightHistoryContext?: string
): string {
  // Build strength baseline section
  const strengthSection = [];
  if (preferences.benchPress1RM) strengthSection.push(`Bench Press 1RM: ${preferences.benchPress1RM} lbs`);
  if (preferences.squat1RM) strengthSection.push(`Squat 1RM: ${preferences.squat1RM} lbs`);
  if (preferences.deadlift1RM) strengthSection.push(`Deadlift 1RM: ${preferences.deadlift1RM} lbs`);
  if (profile.experience?.maxLifts?.bench) strengthSection.push(`Bench Press 1RM: ${profile.experience.maxLifts.bench} lbs`);
  if (profile.experience?.maxLifts?.squat) strengthSection.push(`Squat 1RM: ${profile.experience.maxLifts.squat} lbs`);
  if (profile.experience?.maxLifts?.deadlift) strengthSection.push(`Deadlift 1RM: ${profile.experience.maxLifts.deadlift} lbs`);

  // Build weekly structure from template
  const weeklyStructureStr = template.weeklyStructure.map(day =>
    `  Day ${day.day}: ${day.name} (${day.workoutType}) - ${day.muscleGroups.join(', ')}`
  ).join('\n');

  // Periodization phases
  const phases = [];
  for (let w = 0; w < weeks; w++) {
    if (w < Math.floor(weeks * 0.5)) phases.push(`Week ${w + 1}: Accumulation (build volume, moderate intensity)`);
    else if (w < Math.floor(weeks * 0.85)) phases.push(`Week ${w + 1}: Intensification (increase weight, reduce reps)`);
    else phases.push(`Week ${w + 1}: Deload (reduce volume 40-50%, maintain intensity)`);
  }

  return `Generate Week 1 of a ${weeks}-week ${template.name} training program as structured JSON.
I will programmatically create weeks 2-${weeks} with progressive overload from your Week 1 template.

USER PROFILE:
- Primary Goal: ${profile.primaryGoal}
- Fitness Level: ${profile.fitnessLevel}
- Training Experience: ${profile.experience?.yearsTraining || 0} years
- Available Equipment: ${preferences.availableEquipment.join(', ')}
- Training Days per Week: ${template.daysPerWeek}
- Session Duration: ~${preferences.workoutDuration || 60} minutes
- Injuries/Limitations: ${profile.injuries?.join(', ') || 'None'}
- Weight: ${preferences.weight || 'Not specified'} lbs
- Age: ${preferences.age || 'Not specified'}
- Sex: ${preferences.sex || 'Not specified'}
${strengthSection.length > 0 ? `- Strength Baselines:\n  ${strengthSection.join('\n  ')}` : ''}
${preferences.cardioPreference ? `- Cardio Preference: ${preferences.cardioPreference}` : ''}

PROGRAM TEMPLATE:
- Name: ${template.name} (${template.shortName})
- Philosophy: ${template.philosophy}
- Source: ${template.source}
- Focus: ${template.focus.join(', ')}
- Difficulty: ${template.difficulty}
- Progression Scheme: ${template.progressionScheme}
${template.deloadProtocol ? `- Deload Protocol: ${template.deloadProtocol}` : ''}

WEEKLY STRUCTURE (follow this split):
${weeklyStructureStr}

${researchContext ? `RESEARCH CONTEXT (use this to inform exercise selection and volume):\n${researchContext}\n` : ''}
${weightHistoryContext || ''}

CRITICAL REQUIREMENTS:
1. Each exercise MUST have 2-3 alternatives covering different equipment types (barbell, dumbbell, machine/cable, bodyweight)
2. Use REAL exercise names (e.g., "Barbell Back Squat", "Dumbbell Romanian Deadlift", "Cable Lateral Raise")
3. Prescribe specific sets, reps (as range like "8-12"), and rest periods
4. Each workout day must have 4-6 main exercises
5. Rest days MUST have isRestDay: true and no workout
6. Include estimated calories burned per workout (based on duration and intensity)
7. For EVERY exercise, provide a SPECIFIC weight in lbs based on the user's strength baselines. Use the user's 1RM values to calculate appropriate working weights (typically 60-85% of 1RM depending on rep range and exercise). For compound lifts related to bench/squat/deadlift, derive weights from the provided 1RMs. For accessory/isolation exercises, estimate proportionally based on strength level, sex, and bodyweight. For bodyweight exercises, use "bodyweight". NEVER use vague terms like "moderate", "heavy", or "light" - always use a specific number like "135 lbs".

RESPOND WITH THIS EXACT JSON STRUCTURE (Week 1 ONLY, all 7 days):
{
  "programName": "string",
  "totalWeeks": ${weeks},
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Accumulation",
      "days": [
        {
          "dayNumber": 1,
          "dayName": "Monday",
          "isRestDay": false,
          "workout": {
            "name": "Push Day - Chest & Shoulders",
            "type": "push",
            "duration": 50,
            "difficulty": "intermediate",
            "musclesFocused": ["chest", "shoulders", "triceps"],
            "estimatedCalories": 350,
            "exercises": [
              {
                "name": "Barbell Bench Press",
                "equipment": "barbell",
                "primaryMuscles": ["chest"],
                "secondaryMuscles": ["triceps", "shoulders"],
                "sets": 4,
                "reps": "8-10",
                "restSeconds": 120,
                "weight": "135 lbs",
                "notes": "Focus on controlled eccentric",
                "alternatives": [
                  { "name": "Dumbbell Bench Press", "equipment": "dumbbell", "difficulty": "same" },
                  { "name": "Machine Chest Press", "equipment": "machine", "difficulty": "easier" }
                ]
              }
            ]
          }
        },
        {
          "dayNumber": 7,
          "dayName": "Sunday",
          "isRestDay": true
        }
      ]
    }
  ]
}

Generate ONLY Week 1 with ALL 7 days. Include ${template.daysPerWeek} workout days and ${7 - template.daysPerWeek} rest days.`.trim();
}

// ============================================================================
// AI output parser
// ============================================================================

function parseAIProgramOutput(
  aiOutput: string,
  startDate: Date,
  weeks: number,
  daysPerWeek: number
): WeeklyTrainingPlan[] {
  console.log('[ProgramGenerator] Parsing AI JSON output into', weeks, 'weeks');

  let parsed: AIProgramResponse;
  try {
    parsed = JSON.parse(aiOutput);
  } catch (parseError) {
    console.error('[ProgramGenerator] Failed to parse AI JSON:', parseError);
    // Try to extract JSON from response if wrapped in markdown
    const jsonMatch = aiOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('Failed to parse AI response as JSON');
      }
    } else {
      throw new Error('No valid JSON found in AI response');
    }
  }

  if (!parsed.weeks || !Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
    throw new Error('AI response missing weeks array');
  }

  // AI generates only Week 1 - we'll create remaining weeks with progressive overload
  const aiWeeksCount = parsed.weeks.length;
  console.log('[ProgramGenerator] AI provided', aiWeeksCount, 'week(s), need', weeks, 'weeks total');

  const weeklyPlans: WeeklyTrainingPlan[] = [];

  // Parse Week 1 from AI
  const week1 = buildWeekFromAI(parsed.weeks[0], startDate, 0);
  weeklyPlans.push(week1);

  // If AI provided more weeks, use them; otherwise generate from Week 1
  for (let weekIndex = 1; weekIndex < weeks; weekIndex++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + weekIndex * 7);

    if (weekIndex < aiWeeksCount && parsed.weeks[weekIndex]?.days?.length > 0) {
      // Use AI-provided week
      weeklyPlans.push(buildWeekFromAI(parsed.weeks[weekIndex], weekStartDate, weekIndex));
    } else {
      // Generate from Week 1 with progressive overload
      weeklyPlans.push(buildProgressiveWeek(week1, weekStartDate, weekIndex, weeks));
    }
  }

  return weeklyPlans;
}

/**
 * Build a single week from AI output
 */
function buildWeekFromAI(
  aiWeek: any,
  weekStartDate: Date,
  weekIndex: number
): WeeklyTrainingPlan {
  const days: TrainingDay[] = [];
  const focusAreas = new Set<MuscleGroup>();
  let totalCalories = 0;
  let workoutCount = 0;

  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    const dayDate = addDays(weekStartDate, dayNum - 1);
    const aiDay = aiWeek?.days?.find((d: AIDay) => d.dayNumber === dayNum);

    let workout: Workout | null = null;
    const isRestDay = aiDay?.isRestDay !== false || !aiDay?.workout;

    if (!isRestDay && aiDay?.workout) {
      workout = mapAIWorkoutToWorkout(aiDay.workout, weekIndex, dayNum);
      totalCalories += workout.estimatedCaloriesBurned;
      workout.muscleGroupsFocused.forEach(mg => focusAreas.add(mg));
      workoutCount++;
    }

    days.push({
      id: `day-${weekIndex + 1}-${dayNum}`,
      dayOfWeek: getDayOfWeek(dayNum),
      dayNumber: dayNum,
      date: dayDate,
      workout,
      isRestDay: !workout,
      completed: false,
      calendarDate: dayDate,
      weekNumber: weekIndex + 1,
    });
  }

  return {
    id: `week-${weekIndex + 1}`,
    weekNumber: weekIndex + 1,
    startDate: addDays(weekStartDate, 0),
    endDate: addDays(weekStartDate, 6),
    days,
    totalWorkouts: workoutCount,
    completedWorkouts: 0,
    totalCaloriesBurned: totalCalories,
    focusAreas: Array.from(focusAreas),
  };
}

/**
 * Generate AI-personalized weights for a progressive week.
 * Uses a lightweight GPT-4.1-mini call to adjust Week 1 weights
 * based on periodization phase and week number.
 */
async function generateWeekWeights(
  week1Exercises: { name: string; weight?: string; sets: number; reps: string }[],
  weekIndex: number,
  totalWeeks: number,
  phase: string,
  preferences: TrainingPreferences | null
): Promise<Record<string, string>> {
  try {
    const openai = getOpenAI();

    const exerciseList = week1Exercises
      .filter(e => e.weight && /\d/.test(e.weight))
      .map(e => `  - ${e.name}: ${e.weight} (${e.sets} sets x ${e.reps})`)
      .join('\n');

    if (!exerciseList) return {};

    const userContext = preferences ? [
      preferences.benchPress1RM ? `Bench 1RM: ${preferences.benchPress1RM} lbs` : '',
      preferences.squat1RM ? `Squat 1RM: ${preferences.squat1RM} lbs` : '',
      preferences.deadlift1RM ? `Deadlift 1RM: ${preferences.deadlift1RM} lbs` : '',
      preferences.sex ? `Sex: ${preferences.sex}` : '',
      preferences.weight ? `Bodyweight: ${preferences.weight} lbs` : '',
      preferences.strengthLevel ? `Level: ${preferences.strengthLevel}` : '',
    ].filter(Boolean).join(', ') : 'Not available';

    const prompt = `Given these Week 1 exercises with base weights, generate appropriate weights for Week ${weekIndex + 1} (${phase} phase) of a ${totalWeeks}-week program.

User profile: ${userContext}

Week 1 exercises:
${exerciseList}

This is Week ${weekIndex + 1} (${phase}):
- Accumulation: maintain or slight increase (+2-5 lbs on compounds, +2.5 lbs on isolation)
- Intensification: increase weight to match lower rep range (+5-10 lbs on compounds, +2.5-5 lbs on isolation)
- Deload: reduce weight by ~20% for recovery

Return JSON object mapping exercise names to new weights: { "Exercise Name": "X lbs", ... }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are a strength coach. Respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const output = response.choices[0].message.content || '{}';
    const weightMap = JSON.parse(output) as Record<string, string>;
    console.log(`[ProgramGenerator] AI weights for Week ${weekIndex + 1}:`, Object.keys(weightMap).length, 'exercises');
    return weightMap;
  } catch (error) {
    console.warn(`[ProgramGenerator] AI weight generation failed for Week ${weekIndex + 1}, using fallback:`, error);
    // Fallback: simple increment
    const fallbackMap: Record<string, string> = {};
    for (const ex of week1Exercises) {
      if (!ex.weight || !/\d/.test(ex.weight)) continue;
      const match = ex.weight.match(/(\d+(?:\.\d+)?)/);
      if (!match) continue;
      const baseWeight = parseFloat(match[1]);
      const unit = ex.weight.match(/\d+(?:\.\d+)?\s*(lbs?|kg)/i)?.[1] || 'lbs';
      const isDeload = phase === 'Deload';
      const isIntensification = phase === 'Intensification';
      let newWeight: number;
      if (isDeload) {
        newWeight = Math.round(baseWeight * 0.8);
      } else if (isIntensification) {
        newWeight = baseWeight + 5;
      } else {
        // Accumulation: small increment per week beyond week 1
        newWeight = baseWeight + (weekIndex * 2.5);
      }
      fallbackMap[ex.name] = `${Math.round(newWeight)} ${unit}`;
    }
    return fallbackMap;
  }
}

// Store preferences reference for weight generation in progressive weeks
let _lastGenerationPreferences: TrainingPreferences | null = null;

/**
 * Create a progressive overload week from Week 1 template.
 * - Weeks 2-3 (Accumulation/Intensification): +1 set or +reps
 * - Last week (Deload): -40% volume, maintain exercise selection
 */
function buildProgressiveWeek(
  week1: WeeklyTrainingPlan,
  weekStartDate: Date,
  weekIndex: number,
  totalWeeks: number
): WeeklyTrainingPlan {
  const isDeload = weekIndex >= totalWeeks - 1 && totalWeeks > 2;
  const phase = isDeload ? 'Deload' : weekIndex < Math.floor(totalWeeks * 0.5) ? 'Accumulation' : 'Intensification';
  console.log(`[ProgramGenerator] Building Week ${weekIndex + 1} (${phase}) from Week 1 template`);

  const days: TrainingDay[] = week1.days.map((day, dayIdx) => {
    const dayDate = addDays(weekStartDate, dayIdx);
    const dayNum = dayIdx + 1;

    if (!day.workout) {
      return {
        id: `day-${weekIndex + 1}-${dayNum}`,
        dayOfWeek: getDayOfWeek(dayNum),
        dayNumber: dayNum,
        date: dayDate,
        workout: null,
        isRestDay: true,
        completed: false,
        calendarDate: dayDate,
        weekNumber: weekIndex + 1,
      };
    }

    // Clone workout with progressive overload
    const clonedExercises: WorkoutExercise[] = day.workout.exercises.map((ex, exIdx) => {
      const exerciseId = `ex-${weekIndex}-${dayNum}-${exIdx}`;
      let sets = ex.sets;
      let reps = ex.reps;

      if (isDeload) {
        // Deload: reduce sets by ~40%, keep same reps
        sets = Math.max(2, Math.round(ex.sets * 0.6));
      } else if (phase === 'Intensification') {
        // Intensification: same sets, lower rep range (heavier weight implied)
        const repMatch = reps.match(/(\d+)-(\d+)/);
        if (repMatch) {
          const low = Math.max(1, parseInt(repMatch[1]) - 2);
          const high = Math.max(low + 1, parseInt(repMatch[2]) - 2);
          reps = `${low}-${high}`;
        }
      } else {
        // Accumulation: add a set every other week
        if (weekIndex % 2 === 1) {
          sets = Math.min(ex.sets + 1, 6);
        }
      }

      return {
        ...ex,
        id: exerciseId,
        exerciseId,
        sets,
        reps,
        completed: false,
        exercise: {
          ...ex.exercise,
          id: exerciseId,
        },
      };
    });

    const clonedWorkout: Workout = {
      ...day.workout,
      id: `workout-${weekIndex + 1}-${dayNum}`,
      name: day.workout.name.replace(/Week \d+/, `Week ${weekIndex + 1}`),
      exercises: clonedExercises,
      warmup: day.workout.warmup?.map((w, i) => ({
        ...w,
        id: `warmup-${weekIndex}-${dayNum}-${i}`,
        exerciseId: `warmup-${weekIndex}-${dayNum}-${i}`,
        completed: false,
        exercise: { ...w.exercise, id: `warmup-${weekIndex}-${dayNum}-${i}` },
      })),
      cooldown: day.workout.cooldown?.map((c, i) => ({
        ...c,
        id: `cooldown-${weekIndex}-${dayNum}-${i}`,
        exerciseId: `cooldown-${weekIndex}-${dayNum}-${i}`,
        completed: false,
        exercise: { ...c.exercise, id: `cooldown-${weekIndex}-${dayNum}-${i}` },
      })),
      completed: false,
    };

    return {
      id: `day-${weekIndex + 1}-${dayNum}`,
      dayOfWeek: getDayOfWeek(dayNum),
      dayNumber: dayNum,
      date: dayDate,
      workout: clonedWorkout,
      isRestDay: false,
      completed: false,
      calendarDate: dayDate,
      weekNumber: weekIndex + 1,
    };
  });

  const focusAreas = new Set<MuscleGroup>();
  let totalCalories = 0;
  let workoutCount = 0;
  days.forEach(d => {
    if (d.workout) {
      workoutCount++;
      totalCalories += d.workout.estimatedCaloriesBurned;
      d.workout.muscleGroupsFocused.forEach(mg => focusAreas.add(mg));
    }
  });

  return {
    id: `week-${weekIndex + 1}`,
    weekNumber: weekIndex + 1,
    startDate: addDays(weekStartDate, 0),
    endDate: addDays(weekStartDate, 6),
    days,
    totalWorkouts: workoutCount,
    completedWorkouts: 0,
    totalCaloriesBurned: totalCalories,
    focusAreas: Array.from(focusAreas),
  };
}

// ============================================================================
// Map AI workout to typed Workout
// ============================================================================

function mapAIWorkoutToWorkout(aiWorkout: AIWorkout, weekIndex: number, dayNum: number): Workout {
  const exercises: WorkoutExercise[] = (aiWorkout.exercises || []).map((ex, idx) =>
    mapAIExerciseToWorkoutExercise(ex, weekIndex, dayNum, idx)
  );

  const warmup: WorkoutExercise[] | undefined = aiWorkout.warmup?.map((ex, idx) =>
    mapAIExerciseToWorkoutExercise(ex, weekIndex, dayNum, idx, 'warmup')
  );

  const cooldown: WorkoutExercise[] | undefined = aiWorkout.cooldown?.map((ex, idx) =>
    mapAIExerciseToWorkoutExercise(ex, weekIndex, dayNum, idx, 'cooldown')
  );

  return {
    id: `workout-${weekIndex + 1}-${dayNum}`,
    name: aiWorkout.name || `Week ${weekIndex + 1} - Day ${dayNum}`,
    type: mapWorkoutType(aiWorkout.type || 'strength'),
    duration: aiWorkout.duration || 45,
    estimatedCaloriesBurned: aiWorkout.estimatedCalories || 300,
    muscleGroupsFocused: (aiWorkout.musclesFocused || []).map(mapMuscleGroup),
    difficulty: mapDifficulty(aiWorkout.difficulty || 'intermediate'),
    exercises,
    warmup: warmup && warmup.length > 0 ? warmup : undefined,
    cooldown: cooldown && cooldown.length > 0 ? cooldown : undefined,
    completed: false,
  };
}

function mapAIExerciseToWorkoutExercise(
  aiEx: AIExercise,
  weekIndex: number,
  dayNum: number,
  exIndex: number,
  prefix: string = 'ex'
): WorkoutExercise {
  const exerciseId = `${prefix}-${weekIndex}-${dayNum}-${exIndex}`;

  const alternatives: ExerciseAlternative[] = (aiEx.alternatives || []).map((alt, altIdx) => ({
    id: `alt-${exerciseId}-${altIdx}`,
    name: alt.name,
    equipment: mapEquipment(alt.equipment),
    difficultyModifier: alt.difficulty || 'same',
    muscleActivationNotes: alt.notes || '',
    whenToUse: [alt.difficulty === 'easier' ? 'When main exercise is too challenging' :
                alt.difficulty === 'harder' ? 'For advanced progression' :
                'As equipment variation'],
  }));

  const exercise: Exercise = {
    id: exerciseId,
    name: aiEx.name,
    muscleGroups: (aiEx.primaryMuscles || []).map(mapMuscleGroup),
    category: 'compound',
    equipment: mapEquipment(aiEx.equipment || 'bodyweight'),
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
    alternatives,
    primaryMuscle: aiEx.primaryMuscles?.[0] ? mapMuscleGroup(aiEx.primaryMuscles[0]) : undefined,
    secondaryMuscles: (aiEx.secondaryMuscles || []).map(mapMuscleGroup),
  };

  // Filter out vague weight terms - only keep specific numeric weights or "bodyweight"
  let weight = aiEx.weight;
  if (weight) {
    const lower = weight.toLowerCase().trim();
    const isBodyweight = lower === 'bodyweight' || lower === 'body weight' || lower === 'bw';
    const hasNumber = /\d/.test(weight);
    if (!isBodyweight && !hasNumber) {
      // Vague term like "moderate", "heavy", "light" - discard
      weight = undefined;
    }
  }

  return {
    id: exerciseId,
    exerciseId,
    exercise,
    sets: aiEx.sets || 3,
    reps: String(aiEx.reps || '10'),
    restSeconds: aiEx.restSeconds || 90,
    weight,
    completed: false,
    notes: aiEx.notes,
  };
}

// ============================================================================
// ExerciseDB enrichment (async, non-blocking)
// ============================================================================

async function enrichWithExerciseDb(weeklyPlans: WeeklyTrainingPlan[]): Promise<void> {
  const enrichedNames = new Set<string>();

  for (const week of weeklyPlans) {
    for (const day of week.days) {
      if (!day.workout) continue;

      const allExercises = [
        ...day.workout.exercises,
        ...(day.workout.warmup || []),
        ...(day.workout.cooldown || []),
      ];

      for (const workoutEx of allExercises) {
        const name = workoutEx.exercise.name;
        if (enrichedNames.has(name)) continue;
        enrichedNames.add(name);

        try {
          const results = await exerciseDbService.searchExercisesByName(name);
          if (results.length > 0) {
            const match = results[0];
            workoutEx.exercise.exerciseDbId = match.id;
            workoutEx.exercise.gifUrl = match.gifUrl;
            if (match.instructions?.length) {
              workoutEx.exercise.exerciseDbInstructions = match.instructions;
            }
          }
        } catch {
          // Non-critical - continue without GIF
        }
      }
    }
  }

  console.log('[ProgramGenerator] Enriched', enrichedNames.size, 'exercises with ExerciseDB data');
}

// ============================================================================
// Plan summary
// ============================================================================

function calculatePlanSummary(
  weeklyPlans: WeeklyTrainingPlan[],
  template: ProgramTemplate,
  weeks: number
): PlanSummary {
  const totalWorkouts = weeklyPlans.reduce((sum, week) => sum + week.totalWorkouts, 0);
  const totalCalories = weeklyPlans.reduce((sum, week) => sum + week.totalCaloriesBurned, 0);
  const focusSet = new Set<MuscleGroup>();
  weeklyPlans.forEach(w => w.focusAreas.forEach(f => focusSet.add(f)));

  // Build week-by-week progression
  const weekByWeek: string[] = weeklyPlans.map((week, i) => {
    if (i < Math.floor(weeks * 0.5)) return `Week ${i + 1}: Accumulation - build volume, ${week.totalWorkouts} sessions`;
    if (i < Math.floor(weeks * 0.85)) return `Week ${i + 1}: Intensification - increase weight, ${week.totalWorkouts} sessions`;
    return `Week ${i + 1}: Deload - recover and consolidate gains`;
  });

  return {
    overview: `${weeks}-week ${template.name} program targeting ${template.focus.join(', ')}. ${totalWorkouts} total workouts burning an estimated ${totalCalories} calories.`,
    weeklyStructure: `${template.daysPerWeek} training days per week following a ${template.shortName} split.`,
    strengthFocus: `Primary focus on ${Array.from(focusSet).slice(0, 4).join(', ')} with progressive overload.`,
    cardioFocus: template.cardioIntegration?.recommendations?.join('. ') || 'Cardio integrated as warm-up and on rest days.',
    expectedOutcomes: [
      { metric: 'Strength', targetValue: '5-15% increase', timeframe: `${weeks} weeks`, confidence: 'high' as const },
      { metric: 'Muscle Endurance', targetValue: '10-20% increase', timeframe: `${weeks} weeks`, confidence: 'medium' as const },
    ],
    weekByWeekProgression: weekByWeek,
    nutritionIntegration: 'Ensure adequate protein intake (0.8-1g per lb bodyweight) and caloric surplus for muscle gain or deficit for fat loss.',
    recoveryRecommendations: [
      'Sleep 7-9 hours per night',
      'Take scheduled rest days seriously',
      'Stay hydrated (0.5oz per lb bodyweight)',
    ],
    keyMetricsToTrack: [
      'Weight lifted per exercise',
      'Total weekly volume (sets x reps x weight)',
      'Body weight and measurements',
    ],
    adjustmentTriggers: [
      'If you miss 3+ reps on a lift for 2 consecutive sessions, deload that lift by 10%',
      'If recovery feels insufficient, add an extra rest day',
    ],
  };
}

// ============================================================================
// Fallback generator (uses trainingService for real exercises)
// ============================================================================

function generateFallbackProgram(
  preferences: TrainingPreferences,
  template: ProgramTemplate,
  profile: UserTrainingProfile,
  weeks: number,
  startDate: Date
): CompleteTrainingPlan {
  console.log('[ProgramGenerator] Using fallback template-based generation with real exercises');

  const weeklyPlans: WeeklyTrainingPlan[] = [];

  for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
    // Use trainingService to generate real workouts per week
    const weekPlan = trainingService.generateWeeklyPlan(preferences, weekIndex + 1);

    // Fix dates to align with our calendar start
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + weekIndex * 7);

    const fixedDays: TrainingDay[] = weekPlan.days.map((day, i) => {
      const dayDate = addDays(weekStartDate, i);
      return {
        ...day,
        id: `day-${weekIndex + 1}-${i + 1}`,
        date: dayDate,
        calendarDate: dayDate,
        weekNumber: weekIndex + 1,
      };
    });

    weeklyPlans.push({
      ...weekPlan,
      id: `week-${weekIndex + 1}`,
      weekNumber: weekIndex + 1,
      startDate: addDays(weekStartDate, 0),
      endDate: addDays(weekStartDate, 6),
      days: fixedDays,
    });
  }

  const calendarStartDate = startDate.toISOString().split('T')[0];

  return {
    id: `program-${Date.now()}`,
    name: template.name,
    programTemplate: template,
    userProfile: profile,
    weeklyPlans,
    summary: calculatePlanSummary(weeklyPlans, template, weeks),
    createdAt: new Date().toISOString(),
    startDate: calendarStartDate,
    endDate: addDays(startDate, weeks * 7),
    currentWeek: 1,
    isActive: true,
    calendarStartDate,
    currentWeekIndex: 0,
    totalWeeks: weeks,
  };
}
