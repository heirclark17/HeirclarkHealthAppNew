/**
 * Accountability Coach Service
 * Builds daily snapshots from all app contexts, manages cache, and handles midnight reset.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@accountability_coach_daily';

export interface DailySnapshot {
  date: string; // YYYY-MM-DD

  // Goals
  primaryGoal: string;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  waterGoalOz: number;
  sleepGoalHours: number;
  stepGoal: number;

  // Today's actuals (from logged meals via API)
  caloriesConsumed: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  mealsLogged: number;
  mealsPlanned: number;
  loggedMealDetails: { name: string; calories: number; mealType: string }[];
  plannedMealDetails: { name: string; calories: number; mealType: string }[];

  // Fitness
  workoutCompleted: boolean;
  workoutName: string | null;
  workoutsThisWeek: number;
  workoutStreak: number;

  // Hydration
  waterIntakeOz: number;
  waterGoalPercent: number;

  // Sleep & Recovery
  lastSleepHours: number | null;
  recoveryScore: number | null;
  sleepDebt: number;

  // Calorie Banking
  weeklyCaloriesRemaining: number;
  isOnTrack: boolean;
  bankedCalories: number;

  // Schedule adherence
  scheduledBlocks: number;
  completedBlocks: number;
  skippedBlocks: number;

  // Streaks
  streaks: {
    mealLogging: number;
    weightLogging: number;
    workoutCompletion: number;
    waterIntake: number;
    calorieGoalMet: number;
  };

  // Fasting
  isFasting: boolean;
  fastingWindow: string | null;

  consistencyScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CachedCoachData {
  date: string;
  summary: string;
  messages: ChatMessage[];
}

/**
 * Check if we need to reset (new day)
 */
export function shouldResetDaily(cachedDate: string | null): boolean {
  if (!cachedDate) return true;
  const today = new Date().toISOString().split('T')[0];
  return cachedDate !== today;
}

/**
 * Get cached daily summary and chat history
 */
export async function getDailySummaryCache(): Promise<CachedCoachData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CachedCoachData = JSON.parse(raw);
    if (shouldResetDaily(data.date)) {
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (error) {
    console.error('[AccountabilityCoach] Cache read error:', error);
    return null;
  }
}

/**
 * Save daily summary and chat history to cache
 */
export async function saveDailySummaryCache(
  summary: string,
  messages: ChatMessage[]
): Promise<void> {
  try {
    const data: CachedCoachData = {
      date: new Date().toISOString().split('T')[0],
      summary,
      messages,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[AccountabilityCoach] Cache write error:', error);
  }
}

/**
 * Build a daily snapshot from context data.
 * Called from the component where all hooks are available.
 */
export function buildDailySnapshot(params: {
  // GoalWizard
  goals: {
    primaryGoal: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    waterGoalOz: number;
    sleepGoalHours: number;
    stepGoal: number;
    intermittentFasting: boolean;
    fastingStart: string;
    fastingEnd: string;
  };
  // Logged meals (actually eaten, from API)
  loggedMeals: {
    meals: { name: string; calories: number; mealType: string; protein: number; carbs: number; fat: number }[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
  // Planned meals (from meal plan generator)
  plannedMeals: {
    meals: { name: string; calories: number; mealType: string }[];
    count: number;
  };
  // Training
  training: {
    workoutCompleted: boolean;
    workoutName: string | null;
    completedThisWeek: number;
    workoutStreak: number;
  };
  // Hydration
  hydration: {
    intakeOz: number;
    goalOz: number;
    progressPercent: number;
  };
  // Sleep
  sleep: {
    lastSleepHours: number | null;
    recoveryScore: number | null;
    sleepDebt: number;
  };
  // CalorieBanking
  banking: {
    weeklyRemaining: number;
    isOnTrack: boolean;
    bankedCalories: number;
  };
  // DayPlanner
  planner: {
    scheduledBlocks: number;
    completedBlocks: number;
    skippedBlocks: number;
  };
  // Streaks
  streaks: {
    mealLogging: number;
    weightLogging: number;
    workoutCompletion: number;
    waterIntake: number;
    calorieGoalMet: number;
  };
  // Accountability
  consistencyScore: number;
}): DailySnapshot {
  const today = new Date().toISOString().split('T')[0];
  const { goals, loggedMeals, plannedMeals, training, hydration, sleep, banking, planner, streaks } = params;

  return {
    date: today,
    primaryGoal: goals.primaryGoal || 'Not set',
    calorieTarget: goals.calories,
    proteinTarget: goals.protein,
    carbsTarget: goals.carbs,
    fatTarget: goals.fat,
    waterGoalOz: goals.waterGoalOz,
    sleepGoalHours: goals.sleepGoalHours,
    stepGoal: goals.stepGoal,

    caloriesConsumed: loggedMeals.totalCalories,
    proteinConsumed: loggedMeals.totalProtein,
    carbsConsumed: loggedMeals.totalCarbs,
    fatConsumed: loggedMeals.totalFat,
    mealsLogged: loggedMeals.meals.length,
    mealsPlanned: plannedMeals.count,
    loggedMealDetails: loggedMeals.meals.map(m => ({ name: m.name, calories: m.calories, mealType: m.mealType })),
    plannedMealDetails: plannedMeals.meals,

    workoutCompleted: training.workoutCompleted,
    workoutName: training.workoutName,
    workoutsThisWeek: training.completedThisWeek,
    workoutStreak: training.workoutStreak,

    waterIntakeOz: hydration.intakeOz,
    waterGoalPercent: hydration.progressPercent,

    lastSleepHours: sleep.lastSleepHours,
    recoveryScore: sleep.recoveryScore,
    sleepDebt: sleep.sleepDebt,

    weeklyCaloriesRemaining: banking.weeklyRemaining,
    isOnTrack: banking.isOnTrack,
    bankedCalories: banking.bankedCalories,

    scheduledBlocks: planner.scheduledBlocks,
    completedBlocks: planner.completedBlocks,
    skippedBlocks: planner.skippedBlocks,

    streaks,

    isFasting: goals.intermittentFasting,
    fastingWindow: goals.intermittentFasting
      ? `${goals.fastingEnd} - ${goals.fastingStart}`
      : null,

    consistencyScore: params.consistencyScore,
  };
}

/**
 * Format snapshot into a readable string for the AI prompt
 */
export function formatSnapshotForAI(snapshot: DailySnapshot): string {
  const calPct = snapshot.calorieTarget > 0
    ? Math.round((snapshot.caloriesConsumed / snapshot.calorieTarget) * 100)
    : 0;
  const protPct = snapshot.proteinTarget > 0
    ? Math.round((snapshot.proteinConsumed / snapshot.proteinTarget) * 100)
    : 0;

  let text = `TODAY'S DATA (${snapshot.date}):

GOAL: ${snapshot.primaryGoal}

NUTRITION (from actually logged meals):
- Calories consumed: ${snapshot.caloriesConsumed} / ${snapshot.calorieTarget} target (${calPct}%)
- Protein consumed: ${Math.round(snapshot.proteinConsumed)}g / ${snapshot.proteinTarget}g target (${protPct}%)
- Carbs consumed: ${Math.round(snapshot.carbsConsumed)}g / ${snapshot.carbsTarget}g target
- Fat consumed: ${Math.round(snapshot.fatConsumed)}g / ${snapshot.fatTarget}g target
- Meals ACTUALLY LOGGED today: ${snapshot.mealsLogged}
- Meals PLANNED in meal plan: ${snapshot.mealsPlanned}`;

  if (snapshot.mealsLogged === 0) {
    text += '\n- ⚠️ NO MEALS HAVE BEEN LOGGED TODAY. The user has not tracked any food yet.';
  }

  if (snapshot.loggedMealDetails.length > 0) {
    text += '\n- Logged meals:';
    snapshot.loggedMealDetails.forEach(m => {
      text += `\n  * ${m.mealType}: ${m.name} (${m.calories} cal)`;
    });
  }

  if (snapshot.plannedMealDetails.length > 0 && snapshot.mealsLogged < snapshot.mealsPlanned) {
    text += `\n- Planned meals (not yet logged):`;
    snapshot.plannedMealDetails.forEach(m => {
      const wasLogged = snapshot.loggedMealDetails.some(l => l.mealType === m.mealType);
      if (!wasLogged) {
        text += `\n  * ${m.mealType}: ${m.name} (${m.calories} cal) — NOT LOGGED`;
      }
    });
  }

  text += `

TRAINING:
- Workout today: ${snapshot.workoutCompleted ? 'COMPLETED' : snapshot.workoutName ? 'SCHEDULED (not done)' : 'Rest day'}`;
  if (snapshot.workoutName) text += `\n- Workout: ${snapshot.workoutName}`;
  text += `\n- Workouts this week: ${snapshot.workoutsThisWeek}
- Workout streak: ${snapshot.workoutStreak} days`;

  text += `

HYDRATION:
- Water intake: ${Math.round(snapshot.waterIntakeOz)} oz / ${snapshot.waterGoalOz} oz goal (${snapshot.waterGoalPercent}%)`;

  text += `

SLEEP & RECOVERY:
- Last night sleep: ${snapshot.lastSleepHours !== null ? `${snapshot.lastSleepHours.toFixed(1)} hours` : 'No data logged'}
- Sleep goal: ${snapshot.sleepGoalHours} hours
- Sleep debt: ${Math.round(snapshot.sleepDebt)} minutes
- Recovery score: ${snapshot.recoveryScore !== null ? `${snapshot.recoveryScore}/100` : 'No data'}`;

  text += `

CALORIE BANKING:
- Weekly calories remaining: ${Math.round(snapshot.weeklyCaloriesRemaining)}
- On track: ${snapshot.isOnTrack ? 'Yes' : 'No'}
- Banked calories: ${Math.round(snapshot.bankedCalories)}`;

  text += `

SCHEDULE ADHERENCE:
- Scheduled blocks: ${snapshot.scheduledBlocks}
- Completed: ${snapshot.completedBlocks}
- Skipped: ${snapshot.skippedBlocks}`;

  text += `

STREAKS:
- Meal logging: ${snapshot.streaks.mealLogging} days
- Weight logging: ${snapshot.streaks.weightLogging} days
- Workout completion: ${snapshot.streaks.workoutCompletion} days
- Water intake: ${snapshot.streaks.waterIntake} days
- Calorie goal met: ${snapshot.streaks.calorieGoalMet} days`;

  if (snapshot.isFasting && snapshot.fastingWindow) {
    text += `\n\nFASTING:
- Eating window: ${snapshot.fastingWindow}`;
  }

  text += `\n\nOVERALL CONSISTENCY SCORE: ${snapshot.consistencyScore}/100`;

  return text;
}
