/**
 * Accountability Partner Service
 * Business logic for streak tracking, message generation, and progress analysis
 */

import {
  ActivityStreaks,
  StreakData,
  DailyCheckIn,
  MotivationalMessage,
  MessageType,
  WeeklySummary,
  EngagementMetrics,
  ACCOUNTABILITY_CONSTANTS,
  MOTIVATION_TEMPLATES,
} from '../types/accountabilityPartner';
import {
  getStreaks,
  updateActivityStreak,
  getCheckIns,
  addMessage,
  getEngagementMetrics,
  saveEngagementMetrics,
  getWeeklySummaries,
} from './accountabilityPartnerStorage';

// ============ Message Generation ============

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get a random item from an array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Create a motivational message
 */
export function createMessage(
  type: MessageType,
  title: string,
  message: string,
  icon: string,
  actionRequired: boolean = false,
  actionType?: MotivationalMessage['actionType']
): MotivationalMessage {
  return {
    id: generateMessageId(),
    type,
    title,
    message,
    icon,
    timestamp: Date.now(),
    read: false,
    actionRequired,
    actionType,
  };
}

/**
 * Generate streak milestone message
 */
export function generateStreakMessage(
  activity: keyof ActivityStreaks,
  streak: number
): MotivationalMessage | null {
  // Check if this is a milestone
  if (!ACCOUNTABILITY_CONSTANTS.STREAK_MILESTONES.includes(streak)) {
    return null;
  }

  const activityNames: Record<keyof ActivityStreaks, string> = {
    mealLogging: 'Meal Logging',
    weightLogging: 'Weight Logging',
    workoutCompletion: 'Workout',
    waterIntake: 'Hydration',
    calorieGoalMet: 'Calorie Goal',
  };

  const activityIcons: Record<keyof ActivityStreaks, string> = {
    mealLogging: 'restaurant',
    weightLogging: 'scale',
    workoutCompletion: 'fitness',
    waterIntake: 'water',
    calorieGoalMet: 'flame',
  };

  const streakMessage =
    MOTIVATION_TEMPLATES.STREAK_MESSAGES[streak as keyof typeof MOTIVATION_TEMPLATES.STREAK_MESSAGES] ||
    `${streak} days! Incredible dedication!`;

  return createMessage(
    'streak_milestone',
    `${activityNames[activity]} Streak: ${streak} Days!`,
    streakMessage,
    activityIcons[activity]
  );
}

/**
 * Generate encouragement message
 */
export function generateEncouragementMessage(): MotivationalMessage {
  const message = getRandomItem(MOTIVATION_TEMPLATES.ENCOURAGEMENT);
  return createMessage('encouragement', 'Daily Motivation', message, 'heart');
}

/**
 * Generate comeback message for inactive users
 */
export function generateComebackMessage(daysSinceLastActive: number): MotivationalMessage {
  const message = getRandomItem(MOTIVATION_TEMPLATES.COMEBACK);
  return createMessage(
    'comeback',
    `Welcome Back! (${daysSinceLastActive} days)`,
    message,
    'hand-right'
  );
}

/**
 * Generate goal achieved message
 */
export function generateGoalAchievedMessage(goalType: string): MotivationalMessage {
  const message = getRandomItem(MOTIVATION_TEMPLATES.GOAL_ACHIEVED);
  return createMessage('goal_achieved', `${goalType} Goal Achieved!`, message, 'trophy');
}

/**
 * Generate reminder message
 */
export function generateReminderMessage(
  reminderType: 'meal' | 'workout' | 'weight' | 'water' | 'check_in',
  mealType?: string
): MotivationalMessage {
  const reminders: Record<string, { title: string; message: string; icon: string; action: MotivationalMessage['actionType'] }> = {
    meal: {
      title: `Time for ${mealType || 'a Meal'}`,
      message: "Don't forget to log your meal to keep your streak going!",
      icon: 'restaurant',
      action: 'log_meal',
    },
    workout: {
      title: 'Workout Reminder',
      message: "It's workout time! Stay consistent and crush your goals.",
      icon: 'barbell',
      action: 'log_workout',
    },
    weight: {
      title: 'Weight Check-In',
      message: 'Time to log your weight and track your progress!',
      icon: 'scale',
      action: 'log_weight',
    },
    water: {
      title: 'Hydration Reminder',
      message: 'Stay hydrated! Time to drink some water.',
      icon: 'water',
      action: undefined,
    },
    check_in: {
      title: 'Daily Check-In',
      message: 'Take a moment to reflect on your day and set your intentions.',
      icon: 'checkbox',
      action: 'check_in',
    },
  };

  const reminder = reminders[reminderType];
  return createMessage('reminder', reminder.title, reminder.message, reminder.icon, true, reminder.action);
}

// ============ Streak Analysis ============

/**
 * Check if streak is at risk (didn't log yesterday)
 */
export function isStreakAtRisk(streak: StreakData): boolean {
  if (!streak.lastLoggedDate || streak.currentStreak === 0) {
    return false;
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return streak.lastLoggedDate !== today.toISOString().split('T')[0] &&
         streak.lastLoggedDate !== yesterdayStr;
}

/**
 * Get the best performing streak
 */
export function getBestStreak(streaks: ActivityStreaks): {
  activity: keyof ActivityStreaks;
  streak: StreakData;
} {
  let bestActivity: keyof ActivityStreaks = 'mealLogging';
  let bestStreak = streaks.mealLogging;

  (Object.keys(streaks) as Array<keyof ActivityStreaks>).forEach((activity) => {
    if (streaks[activity].currentStreak > bestStreak.currentStreak) {
      bestActivity = activity;
      bestStreak = streaks[activity];
    }
  });

  return { activity: bestActivity, streak: bestStreak };
}

/**
 * Get streaks at risk
 */
export function getStreaksAtRisk(streaks: ActivityStreaks): Array<keyof ActivityStreaks> {
  return (Object.keys(streaks) as Array<keyof ActivityStreaks>).filter((activity) =>
    isStreakAtRisk(streaks[activity])
  );
}

/**
 * Calculate overall consistency score (0-100)
 */
export function calculateConsistencyScore(streaks: ActivityStreaks, days: number = 30): number {
  const activities = Object.keys(streaks) as Array<keyof ActivityStreaks>;
  let totalScore = 0;

  activities.forEach((activity) => {
    const streak = streaks[activity];
    // Score based on how many of the last N days were logged
    const activityScore = Math.min(100, (streak.totalDaysLogged / days) * 100);
    totalScore += activityScore;
  });

  return Math.round(totalScore / activities.length);
}

// ============ Weekly Summary Generation ============

/**
 * Generate weekly summary from data
 */
export async function generateWeeklySummary(
  mealsLogged: number,
  workoutsCompleted: number,
  daysOnTarget: number,
  averageCalories: number,
  averageProtein: number,
  weightChange: number | null,
  streaks: ActivityStreaks
): Promise<WeeklySummary> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  // Determine top accomplishment
  let topAccomplishment = 'Stayed consistent!';
  const { activity, streak } = getBestStreak(streaks);
  if (streak.currentStreak >= 7) {
    const activityNames: Record<keyof ActivityStreaks, string> = {
      mealLogging: 'meal logging',
      weightLogging: 'weight tracking',
      workoutCompletion: 'workouts',
      waterIntake: 'hydration',
      calorieGoalMet: 'hitting calorie goals',
    };
    topAccomplishment = `Maintained a ${streak.currentStreak}-day ${activityNames[activity]} streak!`;
  } else if (daysOnTarget >= 5) {
    topAccomplishment = `Hit your calorie target ${daysOnTarget} out of 7 days!`;
  } else if (workoutsCompleted >= 4) {
    topAccomplishment = `Completed ${workoutsCompleted} workouts this week!`;
  }

  // Identify areas to improve
  const areasToImprove: string[] = [];
  if (daysOnTarget < 4) {
    areasToImprove.push('Focus on hitting daily calorie targets');
  }
  if (workoutsCompleted < 3) {
    areasToImprove.push('Try to get more workouts in');
  }
  if (mealsLogged < 14) {
    areasToImprove.push('Log more meals for better tracking');
  }
  if (areasToImprove.length === 0) {
    areasToImprove.push("Keep doing what you're doing!");
  }

  // Generate motivational note
  const motivationalNotes = [
    "You're making progress! Every day counts.",
    'Great week! Keep building on this momentum.',
    'Consistency is key, and you showed it this week.',
    'Your dedication is inspiring. Keep pushing!',
  ];

  // Calculate overall score
  const mealScore = Math.min(100, (mealsLogged / 21) * 100);
  const workoutScore = Math.min(100, (workoutsCompleted / 5) * 100);
  const targetScore = (daysOnTarget / 7) * 100;
  const overallScore = Math.round((mealScore + workoutScore + targetScore) / 3);

  return {
    weekStartDate: weekStart.toISOString().split('T')[0],
    weekEndDate: now.toISOString().split('T')[0],
    mealsLogged,
    workoutsCompleted,
    daysOnTarget,
    averageCalories,
    averageProtein,
    weightChange,
    topAccomplishment,
    areasToImprove,
    motivationalNote: getRandomItem(motivationalNotes),
    overallScore,
  };
}

// ============ Check-In Analysis ============

/**
 * Calculate average mood from recent check-ins
 */
export function calculateAverageMood(checkIns: DailyCheckIn[]): number | null {
  const moodRatings = checkIns
    .filter((c) => c.moodRating !== null)
    .map((c) => c.moodRating as number);

  if (moodRatings.length === 0) return null;
  return Math.round((moodRatings.reduce((a, b) => a + b, 0) / moodRatings.length) * 10) / 10;
}

/**
 * Calculate average energy from recent check-ins
 */
export function calculateAverageEnergy(checkIns: DailyCheckIn[]): number | null {
  const energyLevels = checkIns
    .filter((c) => c.energyLevel !== null)
    .map((c) => c.energyLevel as number);

  if (energyLevels.length === 0) return null;
  return Math.round((energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length) * 10) / 10;
}

/**
 * Get check-in completion rate
 */
export function getCheckInCompletionRate(checkIns: DailyCheckIn[], days: number = 7): number {
  const completedCheckIns = checkIns.filter(
    (c) => c.morningCheckIn || c.eveningCheckIn
  ).length;
  return Math.round((completedCheckIns / days) * 100);
}

// ============ Engagement Analysis ============

/**
 * Calculate days since last active
 */
export function getDaysSinceLastActive(lastAppOpen: number): number {
  const now = Date.now();
  const diffMs = now - lastAppOpen;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine if user needs a comeback message
 */
export function needsComebackMessage(metrics: EngagementMetrics): boolean {
  const daysSinceActive = getDaysSinceLastActive(metrics.lastAppOpen);
  return daysSinceActive >= ACCOUNTABILITY_CONSTANTS.INACTIVE_DAYS_COMEBACK;
}

/**
 * Determine if user needs an encouragement
 */
export function needsEncouragement(metrics: EngagementMetrics, streaks: ActivityStreaks): boolean {
  // If consistency score is low, provide encouragement
  const consistencyScore = calculateConsistencyScore(streaks);
  return consistencyScore < 50;
}

// ============ Smart Recommendations ============

/**
 * Get personalized recommendations based on user data
 */
export function getSmartRecommendations(
  streaks: ActivityStreaks,
  checkIns: DailyCheckIn[],
  metrics: EngagementMetrics
): string[] {
  const recommendations: string[] = [];

  // Check streaks at risk
  const atRisk = getStreaksAtRisk(streaks);
  if (atRisk.length > 0) {
    const activityNames: Record<keyof ActivityStreaks, string> = {
      mealLogging: 'meal logging',
      weightLogging: 'weight tracking',
      workoutCompletion: 'workout',
      waterIntake: 'hydration',
      calorieGoalMet: 'calorie tracking',
    };
    recommendations.push(
      `Your ${activityNames[atRisk[0]]} streak is at risk! Log today to keep it going.`
    );
  }

  // Check mood trends
  const avgMood = calculateAverageMood(checkIns.slice(0, 7));
  if (avgMood !== null && avgMood < 3) {
    recommendations.push(
      'Your mood has been lower this week. Consider some self-care activities.'
    );
  }

  // Check energy trends
  const avgEnergy = calculateAverageEnergy(checkIns.slice(0, 7));
  if (avgEnergy !== null && avgEnergy < 3) {
    recommendations.push(
      'Energy levels have been low. Focus on sleep and nutrition to recharge.'
    );
  }

  // Check-in completion
  const checkInRate = getCheckInCompletionRate(checkIns);
  if (checkInRate < 50) {
    recommendations.push(
      'Daily check-ins help track your progress. Try to do them more consistently.'
    );
  }

  // Best streak encouragement
  const { activity, streak } = getBestStreak(streaks);
  if (streak.currentStreak >= 5) {
    const activityNames: Record<keyof ActivityStreaks, string> = {
      mealLogging: 'meal logging',
      weightLogging: 'weight tracking',
      workoutCompletion: 'workouts',
      waterIntake: 'hydration',
      calorieGoalMet: 'calorie goals',
    };
    recommendations.push(
      `Keep up your ${activityNames[activity]} streak! You're on fire with ${streak.currentStreak} days!`
    );
  }

  // Limit to 3 recommendations
  return recommendations.slice(0, 3);
}

// ============ Activity Logging Handlers ============

/**
 * Handle meal logged - update streak and possibly generate message
 */
export async function handleMealLogged(): Promise<MotivationalMessage | null> {
  const streaks = await updateActivityStreak('mealLogging', true);
  const newStreak = streaks.mealLogging.currentStreak;

  const message = generateStreakMessage('mealLogging', newStreak);
  if (message) {
    await addMessage(message);
  }
  return message;
}

/**
 * Handle weight logged - update streak and possibly generate message
 */
export async function handleWeightLogged(): Promise<MotivationalMessage | null> {
  const streaks = await updateActivityStreak('weightLogging', true);
  const newStreak = streaks.weightLogging.currentStreak;

  const message = generateStreakMessage('weightLogging', newStreak);
  if (message) {
    await addMessage(message);
  }
  return message;
}

/**
 * Handle workout completed - update streak and possibly generate message
 */
export async function handleWorkoutCompleted(): Promise<MotivationalMessage | null> {
  const streaks = await updateActivityStreak('workoutCompletion', true);
  const newStreak = streaks.workoutCompletion.currentStreak;

  const message = generateStreakMessage('workoutCompletion', newStreak);
  if (message) {
    await addMessage(message);
  }
  return message;
}

/**
 * Handle calorie goal met - update streak and possibly generate message
 */
export async function handleCalorieGoalMet(): Promise<MotivationalMessage | null> {
  const streaks = await updateActivityStreak('calorieGoalMet', true);
  const newStreak = streaks.calorieGoalMet.currentStreak;

  // Also generate goal achieved message
  const goalMessage = generateGoalAchievedMessage('Calorie');
  await addMessage(goalMessage);

  const streakMessage = generateStreakMessage('calorieGoalMet', newStreak);
  if (streakMessage) {
    await addMessage(streakMessage);
  }

  return goalMessage;
}

/**
 * Handle water intake goal met - update streak
 */
export async function handleWaterGoalMet(): Promise<MotivationalMessage | null> {
  const streaks = await updateActivityStreak('waterIntake', true);
  const newStreak = streaks.waterIntake.currentStreak;

  const message = generateStreakMessage('waterIntake', newStreak);
  if (message) {
    await addMessage(message);
  }
  return message;
}
