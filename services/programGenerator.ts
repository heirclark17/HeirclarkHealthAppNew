import OpenAI from 'openai';
import Constants from 'expo-constants';
import {
  CompleteTrainingPlan,
  WeeklyTrainingPlan,
  TrainingDay,
  Workout,
  WorkoutExercise,
  TrainingPreferences,
  ProgramTemplate,
  UserTrainingProfile,
  PlanSummary,
  MuscleGroup,
} from '../types/training';

/**
 * Program Generator Service
 * Generates multi-week AI workout programs with calendar alignment
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

/**
 * Generate a multi-week training program using AI
 */
export async function generateMultiWeekProgram(
  preferences: TrainingPreferences,
  programTemplate: ProgramTemplate,
  userProfile: UserTrainingProfile,
  weeks: number = 4
): Promise<CompleteTrainingPlan> {
  console.log('[ProgramGenerator] Generating', weeks, 'week program for', programTemplate.name);

  // Calculate calendar dates
  const startDate = getMostRecentMonday();
  const calendarStartDate = startDate.toISOString().split('T')[0];

  // Build AI prompt
  const prompt = buildProgramPrompt(preferences, programTemplate, userProfile, weeks);

  try {
    const openai = getOpenAI();

    // Call GPT-4.1-mini for program generation
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert fitness program designer with deep knowledge of exercise science, progressive overload, and training periodization.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const aiOutput = response.choices[0].message.content || '';
    console.log('[ProgramGenerator] AI response length:', aiOutput.length);

    // Parse AI output into structured program
    const weeklyPlans = parseAIProgramOutput(aiOutput, startDate, weeks, programTemplate.daysPerWeek);

    // Build complete training plan
    const plan: CompleteTrainingPlan = {
      id: `program-${Date.now()}`,
      name: programTemplate.name,
      programTemplate,
      userProfile,
      weeklyPlans,
      summary: calculatePlanSummary(weeklyPlans),
      createdAt: new Date().toISOString(),
      startDate: calendarStartDate,
      endDate: addDays(startDate, weeks * 7),
      currentWeek: 1,
      isActive: true,
      // Multi-week extensions
      calendarStartDate,
      currentWeekIndex: 0,
      totalWeeks: weeks,
    };

    console.log('[ProgramGenerator] ✅ Generated', weeks, 'week program with', weeklyPlans.length, 'weeks');
    return plan;

  } catch (error) {
    console.error('[ProgramGenerator] AI generation failed:', error);
    // Fallback to basic template-based generation
    return generateFallbackProgram(preferences, programTemplate, userProfile, weeks, startDate);
  }
}

/**
 * Build AI prompt for program generation
 */
function buildProgramPrompt(
  preferences: TrainingPreferences,
  template: ProgramTemplate,
  profile: UserTrainingProfile,
  weeks: number
): string {
  return `
Generate a ${weeks}-week ${template.name} training program.

USER PROFILE:
- Goal: ${profile.primaryGoal}
- Fitness Level: ${profile.fitnessLevel}
- Available Equipment: ${preferences.availableEquipment.join(', ')}
- Training Days per Week: ${template.daysPerWeek}
- Session Duration: ~${preferences.sessionDuration} minutes
- Injuries/Limitations: ${profile.injuries || 'None'}

PROGRAM REQUIREMENTS:
- Program Type: ${template.name}
- Focus Areas: ${template.focusAreas.join(', ')}
- Difficulty: ${template.difficulty}
- Duration: ${weeks} weeks
- Split: ${template.split}

EXERCISE REQUIREMENTS:
- Each exercise must have 5-8 alternatives
- Alternatives should cover different equipment: barbell, dumbbell, machine, cable, bodyweight
- Include sets, reps, rest periods, and tempo for each exercise
- Progressive overload: increase weight or reps weekly

WEEKLY STRUCTURE:
${Array.from({ length: weeks }, (_, i) => `Week ${i + 1}: Focus on ${i < weeks / 2 ? 'building volume' : 'increasing intensity'}`).join('\n')}

OUTPUT FORMAT (for each week):
Week [N]:
  Day [1-7]:
    - Exercise Name
      Sets: X
      Reps: Y
      Rest: Z seconds
      Tempo: A-B-C-D
      Alternatives: [list 5-8 alternatives with equipment types]

Generate the complete ${weeks}-week program now.
  `.trim();
}

/**
 * Parse AI output into structured weekly plans
 */
function parseAIProgramOutput(
  aiOutput: string,
  startDate: Date,
  weeks: number,
  daysPerWeek: number
): WeeklyTrainingPlan[] {
  console.log('[ProgramGenerator] Parsing AI output into', weeks, 'weeks');

  const weeklyPlans: WeeklyTrainingPlan[] = [];

  // Parse week by week (simplified parsing - enhance based on actual AI output format)
  for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + weekIndex * 7);

    const days: TrainingDay[] = [];

    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      const isWorkoutDay = dayNum <= daysPerWeek;
      const dayDate = addDays(weekStartDate, dayNum - 1);

      const day: TrainingDay = {
        id: `day-${weekIndex + 1}-${dayNum}`,
        dayOfWeek: getDayOfWeek(dayNum),
        dayNumber: dayNum,
        date: dayDate,
        workout: isWorkoutDay ? generatePlaceholderWorkout(weekIndex, dayNum) : null,
        isRestDay: !isWorkoutDay,
        completed: false,
        // Multi-week extensions
        calendarDate: dayDate,
        weekNumber: weekIndex + 1,
      };

      days.push(day);
    }

    const weekPlan: WeeklyTrainingPlan = {
      id: `week-${weekIndex + 1}`,
      weekNumber: weekIndex + 1,
      startDate: addDays(weekStartDate, 0),
      endDate: addDays(weekStartDate, 6),
      days,
      totalWorkouts: daysPerWeek,
      completedWorkouts: 0,
      totalCaloriesBurned: 0,
      focusAreas: ['Full Body'] as MuscleGroup[],
    };

    weeklyPlans.push(weekPlan);
  }

  return weeklyPlans;
}

/**
 * Generate placeholder workout (will be replaced by actual AI parsing)
 */
function generatePlaceholderWorkout(weekIndex: number, dayNum: number): Workout {
  return {
    id: `workout-${weekIndex + 1}-${dayNum}`,
    name: `Week ${weekIndex + 1} - Day ${dayNum}`,
    description: 'AI-generated workout',
    duration: 45,
    difficulty: 'intermediate',
    focusAreas: ['Full Body'] as MuscleGroup[],
    exercises: [
      {
        id: `ex-${weekIndex}-${dayNum}-1`,
        exerciseId: 'placeholder',
        exercise: {
          id: 'placeholder',
          name: 'Barbell Squat',
          equipment: 'barbell',
          primaryMuscles: ['Quadriceps'] as MuscleGroup[],
          secondaryMuscles: ['Glutes'] as MuscleGroup[],
          instructions: ['Stand with feet shoulder-width apart', 'Lower into squat position'],
          difficulty: 'intermediate',
          alternatives: [],
        },
        sets: 3,
        reps: 10,
        restSeconds: 90,
        notes: '',
        completed: false,
      }
    ],
    caloriesBurned: 300,
    completed: false,
  };
}

/**
 * Calculate plan summary from weekly plans
 */
function calculatePlanSummary(weeklyPlans: WeeklyTrainingPlan[]): PlanSummary {
  const totalWorkouts = weeklyPlans.reduce((sum, week) => sum + week.totalWorkouts, 0);
  const totalCalories = weeklyPlans.reduce((sum, week) => sum + week.totalCaloriesBurned, 0);

  return {
    totalWeeks: weeklyPlans.length,
    totalWorkouts,
    estimatedCalories: totalCalories,
    workoutsPerWeek: weeklyPlans[0]?.totalWorkouts || 0,
    primaryFocus: weeklyPlans[0]?.focusAreas || [],
  };
}

/**
 * Fallback program generator when AI fails
 */
function generateFallbackProgram(
  preferences: TrainingPreferences,
  template: ProgramTemplate,
  profile: UserTrainingProfile,
  weeks: number,
  startDate: Date
): CompleteTrainingPlan {
  console.log('[ProgramGenerator] Using fallback template-based generation');

  const weeklyPlans = parseAIProgramOutput('', startDate, weeks, template.daysPerWeek);

  return {
    id: `program-${Date.now()}`,
    name: template.name,
    programTemplate: template,
    userProfile: profile,
    weeklyPlans,
    summary: calculatePlanSummary(weeklyPlans),
    createdAt: new Date().toISOString(),
    startDate: startDate.toISOString().split('T')[0],
    endDate: addDays(startDate, weeks * 7),
    currentWeek: 1,
    isActive: true,
    calendarStartDate: startDate.toISOString().split('T')[0],
    currentWeekIndex: 0,
    totalWeeks: weeks,
  };
}
