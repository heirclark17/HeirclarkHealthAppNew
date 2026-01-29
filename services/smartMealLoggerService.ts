// Smart Meal Logger Service
// Handles meal pattern learning and smart suggestions

import {
  FrequentMeal,
  MealPattern,
  MealSuggestion,
  SMART_MEAL_CONSTANTS,
} from '../types/smartMealLogger';
import { smartMealLoggerStorage } from './smartMealLoggerStorage';

const { SCORING_WEIGHTS, TIME_WINDOW_MINUTES, MIN_CONFIDENCE_SCORE, MAX_SUGGESTIONS } = SMART_MEAL_CONSTANTS;

/**
 * Get the current meal type based on time of day
 */
export function getMealTypeForCurrentTime(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const timeRanges = SMART_MEAL_CONSTANTS.MEAL_TIME_RANGES;

  // Check each meal type
  for (const [mealType, range] of Object.entries(timeRanges)) {
    if (mealType === 'snack') continue; // Skip snack as default

    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes) {
      return mealType as 'breakfast' | 'lunch' | 'dinner';
    }
  }

  return 'snack';
}

/**
 * Calculate time similarity score (0-100)
 */
function calculateTimeScore(mealTime: string, currentTime: string): number {
  const [mealH, mealM] = mealTime.split(':').map(Number);
  const [currH, currM] = currentTime.split(':').map(Number);

  const mealMinutes = mealH * 60 + mealM;
  const currMinutes = currH * 60 + currM;
  const diff = Math.abs(mealMinutes - currMinutes);

  if (diff <= TIME_WINDOW_MINUTES) {
    // Perfect match within window
    return 100 - (diff / TIME_WINDOW_MINUTES) * 50;
  } else if (diff <= TIME_WINDOW_MINUTES * 2) {
    // Decent match
    return 50 - ((diff - TIME_WINDOW_MINUTES) / TIME_WINDOW_MINUTES) * 30;
  } else {
    // Poor match
    return Math.max(0, 20 - (diff / 60) * 5);
  }
}

/**
 * Calculate day of week similarity score (0-100)
 */
function calculateDayScore(dayFrequency: number[], currentDay: number, totalLogs: number): number {
  if (totalLogs === 0) return 0;

  const dayLogs = dayFrequency[currentDay] || 0;
  const dayPercentage = dayLogs / totalLogs;

  // Boost score if this meal is frequently eaten on this day
  return Math.min(100, dayPercentage * 400);
}

/**
 * Calculate frequency score (0-100)
 */
function calculateFrequencyScore(logCount: number, maxLogCount: number): number {
  if (maxLogCount === 0) return 0;
  return (logCount / maxLogCount) * 100;
}

/**
 * Calculate recency score (0-100)
 */
function calculateRecencyScore(lastLogged: string): number {
  const lastDate = new Date(lastLogged);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince <= 1) return 100;
  if (daysSince <= 3) return 80;
  if (daysSince <= 7) return 60;
  if (daysSince <= 14) return 40;
  if (daysSince <= 30) return 20;
  return 10;
}

/**
 * Generate smart meal suggestions based on current context
 */
export async function generateMealSuggestions(
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<MealSuggestion[]> {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const currentDay = now.getDay();
  const targetMealType = mealType || getMealTypeForCurrentTime();

  // Get frequent meals
  const allMeals = await smartMealLoggerStorage.getFrequentMeals();
  const relevantMeals = mealType
    ? allMeals.filter(m => m.mealType === mealType)
    : allMeals;

  if (relevantMeals.length === 0) {
    return [];
  }

  // Find max log count for normalization
  const maxLogCount = Math.max(...relevantMeals.map(m => m.logCount));

  // Score each meal
  const scoredMeals: MealSuggestion[] = relevantMeals.map(meal => {
    const timeScore = calculateTimeScore(meal.averageTime, currentTime);
    const dayScore = calculateDayScore(meal.dayOfWeekFrequency, currentDay, meal.logCount);
    const frequencyScore = calculateFrequencyScore(meal.logCount, maxLogCount);
    const recencyScore = calculateRecencyScore(meal.lastLogged);

    // Calculate weighted confidence score
    const confidence = Math.round(
      (frequencyScore * SCORING_WEIGHTS.frequency +
        timeScore * SCORING_WEIGHTS.timeMatch +
        dayScore * SCORING_WEIGHTS.dayMatch +
        recencyScore * SCORING_WEIGHTS.recency) / 100
    );

    // Determine reason
    const reasons: string[] = [];
    const isTimeBased = timeScore >= 50;
    const isDayBased = dayScore >= 40;
    const isFrequencyBased = frequencyScore >= 50;

    if (isFrequencyBased) {
      reasons.push(`You've logged this ${meal.logCount} times`);
    }
    if (isTimeBased) {
      reasons.push(`Usually eaten around this time`);
    }
    if (isDayBased) {
      const days = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
      reasons.push(`Often eaten on ${days[currentDay]}`);
    }

    const reason = reasons.length > 0 ? reasons.join(' • ') : 'Recently logged meal';

    return {
      meal,
      confidence,
      reason,
      isTimeBased,
      isDayBased,
      isFrequencyBased,
    };
  });

  // Filter and sort by confidence
  return scoredMeals
    .filter(s => s.confidence >= MIN_CONFIDENCE_SCORE)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_SUGGESTIONS);
}

/**
 * Get suggestions for a specific meal type
 */
export async function getSuggestionsForMealType(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<MealSuggestion[]> {
  return generateMealSuggestions(mealType);
}

/**
 * Log a meal and update learning
 */
export async function logMealAndLearn(meal: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
  source: 'manual' | 'ai' | 'barcode' | 'photo';
}): Promise<FrequentMeal> {
  // Update frequent meals
  const frequentMeal = await smartMealLoggerStorage.upsertFrequentMeal(meal);

  // Update meal patterns
  await smartMealLoggerStorage.updateMealPatterns(
    meal.mealType,
    frequentMeal.id,
    meal.calories,
    meal.protein,
    meal.carbs,
    meal.fat
  );

  // Add to log history
  await smartMealLoggerStorage.addToLogHistory(meal);

  console.log('[SmartMealLogger] Logged meal and updated learning:', {
    name: meal.name,
    logCount: frequentMeal.logCount,
    mealType: meal.mealType,
  });

  return frequentMeal;
}

/**
 * Get favorite meals (most frequently logged)
 */
export async function getFavoriteMeals(limit: number = 10): Promise<FrequentMeal[]> {
  const meals = await smartMealLoggerStorage.getFrequentMeals();
  return meals
    .filter(m => m.logCount >= SMART_MEAL_CONSTANTS.MIN_LOGS_FOR_FREQUENT)
    .sort((a, b) => b.logCount - a.logCount)
    .slice(0, limit);
}

/**
 * Get recent meals (within last 7 days)
 */
export async function getRecentMeals(limit: number = 10): Promise<FrequentMeal[]> {
  const meals = await smartMealLoggerStorage.getFrequentMeals();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return meals
    .filter(m => new Date(m.lastLogged) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.lastLogged).getTime() - new Date(a.lastLogged).getTime())
    .slice(0, limit);
}

/**
 * Search meals by name
 */
export async function searchMeals(query: string): Promise<FrequentMeal[]> {
  return smartMealLoggerStorage.searchFrequentMeals(query);
}

/**
 * Get meal insights (statistics)
 */
export async function getMealInsights(): Promise<{
  totalMealsLogged: number;
  favoriteMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
  averageCaloriesPerMeal: number;
  mostActiveDayOfWeek: number;
  uniqueMealsLogged: number;
}> {
  const meals = await smartMealLoggerStorage.getFrequentMeals();
  const history = await smartMealLoggerStorage.getMealLogHistory(30);

  if (meals.length === 0) {
    return {
      totalMealsLogged: 0,
      favoriteMealType: null,
      averageCaloriesPerMeal: 0,
      mostActiveDayOfWeek: 0,
      uniqueMealsLogged: 0,
    };
  }

  // Total meals logged
  const totalMealsLogged = meals.reduce((sum, m) => sum + m.logCount, 0);

  // Favorite meal type
  const mealTypeCounts: Record<string, number> = {};
  meals.forEach(m => {
    mealTypeCounts[m.mealType] = (mealTypeCounts[m.mealType] || 0) + m.logCount;
  });
  const favoriteMealType = Object.entries(mealTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as
    | 'breakfast'
    | 'lunch'
    | 'dinner'
    | 'snack'
    | null;

  // Average calories
  const totalCalories = meals.reduce((sum, m) => sum + m.calories * m.logCount, 0);
  const averageCaloriesPerMeal = Math.round(totalCalories / totalMealsLogged);

  // Most active day
  const dayActivity = [0, 0, 0, 0, 0, 0, 0];
  meals.forEach(m => {
    m.dayOfWeekFrequency.forEach((count, day) => {
      dayActivity[day] += count;
    });
  });
  const mostActiveDayOfWeek = dayActivity.indexOf(Math.max(...dayActivity));

  return {
    totalMealsLogged,
    favoriteMealType,
    averageCaloriesPerMeal,
    mostActiveDayOfWeek,
    uniqueMealsLogged: meals.length,
  };
}
