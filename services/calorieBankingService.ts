// Calorie Banking Service
// Handles banking/borrowing calculations and recommendations

import {
  WeeklyCalorieBudget,
  DayCalorieLog,
  BankingRecommendation,
  CalorieBankingSettings,
  CALORIE_BANKING_CONSTANTS,
} from '../types/calorieBanking';
import { calorieBankingStorage } from './calorieBankingStorage';

/**
 * Get today's date string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate remaining days in the week (including today)
 */
function getRemainingDays(week: WeeklyCalorieBudget): number {
  const today = getTodayString();
  return week.dailyLogs.filter(d => d.date >= today).length;
}

/**
 * Calculate remaining calories for the week
 */
function getRemainingWeeklyCalories(week: WeeklyCalorieBudget): number {
  let remaining = week.weeklyTarget;

  for (const day of week.dailyLogs) {
    if (day.isComplete) {
      remaining -= day.consumedCalories;
    }
  }

  return remaining;
}

/**
 * Calculate how much can be banked today
 */
export async function calculateBankableAmount(
  consumed: number,
  dayTarget: number,
  settings: CalorieBankingSettings
): Promise<{ amount: number; reason: string }> {
  const surplus = dayTarget - consumed;

  if (surplus <= 0) {
    return { amount: 0, reason: 'No surplus to bank' };
  }

  // Check minimum daily calories
  if (consumed < settings.minimumDailyCalories) {
    return {
      amount: 0,
      reason: `Eat at least ${settings.minimumDailyCalories} calories first`,
    };
  }

  // Cap at max bankable
  const bankable = Math.min(surplus, settings.maxBankablePerDay);

  // Check weekly bank limit
  const week = await calorieBankingStorage.getCurrentWeek();
  if (week) {
    const afterBanking = week.bankedCalories + bankable;
    if (afterBanking > settings.maxWeeklyBank) {
      const allowable = Math.max(0, settings.maxWeeklyBank - week.bankedCalories);
      return {
        amount: allowable,
        reason: `Limited by weekly bank cap (${settings.maxWeeklyBank} cal)`,
      };
    }
  }

  return { amount: bankable, reason: 'Available to bank' };
}

/**
 * Calculate how much can be borrowed today
 */
export async function calculateBorrowableAmount(
  needed: number,
  dayTarget: number,
  settings: CalorieBankingSettings
): Promise<{ amount: number; reason: string }> {
  const week = await calorieBankingStorage.getCurrentWeek();
  if (!week) {
    return { amount: 0, reason: 'No active week' };
  }

  // Can only borrow from banked calories
  if (week.bankedCalories <= 0) {
    return { amount: 0, reason: 'No banked calories available' };
  }

  const want = needed - dayTarget;
  if (want <= 0) {
    return { amount: 0, reason: 'No need to borrow' };
  }

  // Cap at max borrowable per day
  const maxBorrow = Math.min(
    want,
    settings.maxBorrowablePerDay,
    week.bankedCalories
  );

  return { amount: maxBorrow, reason: 'Available from banked calories' };
}

/**
 * Get banking recommendation for today
 */
export async function getBankingRecommendation(
  currentConsumed: number,
  dailyTarget: number
): Promise<BankingRecommendation> {
  const settings = await calorieBankingStorage.getSettings();
  let week = await calorieBankingStorage.getCurrentWeek();

  // Create week if needed
  if (!week) {
    week = await calorieBankingStorage.createWeek(dailyTarget);
  }

  const today = getTodayString();
  const todayLog = week.dailyLogs.find(d => d.date === today);
  const remainingDays = getRemainingDays(week);
  const remainingWeekly = getRemainingWeeklyCalories(week);

  // Calculate average needed for remaining days
  const averageNeeded = remainingDays > 0 ? Math.round(remainingWeekly / remainingDays) : dailyTarget;

  const adjustedTarget = todayLog?.targetCalories || dailyTarget;
  const surplus = adjustedTarget - currentConsumed;

  // Determine recommendation
  if (surplus > 100 && week.bankedCalories < settings.maxWeeklyBank) {
    // Can bank
    const { amount } = await calculateBankableAmount(currentConsumed, adjustedTarget, settings);
    return {
      type: 'bank',
      amount,
      reason: `You're under target - bank ${amount} cal for later`,
      adjustedTarget,
      weeklyRemaining: remainingWeekly,
      daysRemaining: remainingDays,
      averageNeeded,
    };
  } else if (surplus < -100 && week.bankedCalories > 0) {
    // Can borrow
    const { amount } = await calculateBorrowableAmount(currentConsumed, adjustedTarget, settings);
    return {
      type: 'borrow',
      amount,
      reason: `Over target - use ${amount} banked cal`,
      adjustedTarget: adjustedTarget + amount,
      weeklyRemaining: remainingWeekly,
      daysRemaining: remainingDays,
      averageNeeded,
    };
  }

  // Maintain current
  return {
    type: 'maintain',
    amount: 0,
    reason: 'On track for the day',
    adjustedTarget,
    weeklyRemaining: remainingWeekly,
    daysRemaining: remainingDays,
    averageNeeded,
  };
}

/**
 * Bank calories for today
 */
export async function bankCalories(amount: number): Promise<WeeklyCalorieBudget | null> {
  const settings = await calorieBankingStorage.getSettings();
  const week = await calorieBankingStorage.getCurrentWeek();

  if (!week) return null;

  const today = getTodayString();
  const dayIndex = week.dailyLogs.findIndex(d => d.date === today);

  if (dayIndex === -1) return week;

  // Update day log
  week.dailyLogs[dayIndex].bankedAmount = amount;

  // Update weekly bank
  week.bankedCalories += amount;

  await calorieBankingStorage.updateWeek(week);

  // Log transaction
  await calorieBankingStorage.addTransaction({
    date: today,
    type: 'bank',
    amount,
    reason: 'Daily surplus banked',
    balanceAfter: week.bankedCalories,
  });

  return week;
}

/**
 * Borrow calories from bank
 */
export async function borrowCalories(amount: number): Promise<WeeklyCalorieBudget | null> {
  const week = await calorieBankingStorage.getCurrentWeek();

  if (!week || week.bankedCalories < amount) return null;

  const today = getTodayString();
  const dayIndex = week.dailyLogs.findIndex(d => d.date === today);

  if (dayIndex === -1) return week;

  // Update day log
  week.dailyLogs[dayIndex].bankedAmount = -amount;
  week.dailyLogs[dayIndex].targetCalories += amount;

  // Update weekly bank
  week.bankedCalories -= amount;

  await calorieBankingStorage.updateWeek(week);

  // Log transaction
  await calorieBankingStorage.addTransaction({
    date: today,
    type: 'borrow',
    amount: -amount,
    reason: 'Borrowed from bank',
    balanceAfter: week.bankedCalories,
  });

  return week;
}

/**
 * Redistribute remaining calories across remaining days
 */
export async function redistributeCalories(): Promise<WeeklyCalorieBudget | null> {
  const week = await calorieBankingStorage.getCurrentWeek();
  if (!week) return null;

  const today = getTodayString();
  const remainingDays = week.dailyLogs.filter(d => d.date >= today && !d.isComplete);
  const remainingCalories = getRemainingWeeklyCalories(week);

  if (remainingDays.length === 0) return week;

  const perDay = Math.round(remainingCalories / remainingDays.length);

  for (const day of remainingDays) {
    const dayIndex = week.dailyLogs.findIndex(d => d.date === day.date);
    if (dayIndex !== -1) {
      week.dailyLogs[dayIndex].targetCalories = perDay;
    }
  }

  await calorieBankingStorage.updateWeek(week);
  return week;
}

/**
 * Complete a day and finalize banking
 */
export async function completeDay(date: string, consumed: number): Promise<WeeklyCalorieBudget | null> {
  const week = await calorieBankingStorage.getCurrentWeek();
  if (!week) return null;

  const dayIndex = week.dailyLogs.findIndex(d => d.date === date);
  if (dayIndex === -1) return week;

  const day = week.dailyLogs[dayIndex];
  const surplus = day.targetCalories - consumed;

  // Update day
  week.dailyLogs[dayIndex] = {
    ...day,
    consumedCalories: consumed,
    bankedAmount: surplus,
    isComplete: true,
  };

  // Recalculate total banked
  let totalBanked = 0;
  for (const d of week.dailyLogs) {
    if (d.isComplete) {
      totalBanked += d.bankedAmount;
    }
  }
  week.bankedCalories = totalBanked;

  await calorieBankingStorage.updateWeek(week);

  // Log transaction
  if (surplus !== 0) {
    await calorieBankingStorage.addTransaction({
      date,
      type: surplus > 0 ? 'bank' : 'borrow',
      amount: surplus,
      reason: 'Day completed',
      balanceAfter: week.bankedCalories,
    });
  }

  return week;
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(): Promise<{
  weeklyTarget: number;
  weeklyConsumed: number;
  weeklyRemaining: number;
  bankedCalories: number;
  daysComplete: number;
  daysRemaining: number;
  onTrack: boolean;
  projectedEndOfWeek: number;
} | null> {
  const week = await calorieBankingStorage.getCurrentWeek();
  if (!week) return null;

  let weeklyConsumed = 0;
  let daysComplete = 0;

  for (const day of week.dailyLogs) {
    if (day.isComplete) {
      weeklyConsumed += day.consumedCalories;
      daysComplete++;
    }
  }

  const daysRemaining = 7 - daysComplete;
  const weeklyRemaining = week.weeklyTarget - weeklyConsumed;
  const averageDaily = daysComplete > 0 ? weeklyConsumed / daysComplete : week.dailyBaseTarget;
  const projectedEndOfWeek = weeklyConsumed + (averageDaily * daysRemaining);
  const onTrack = projectedEndOfWeek <= week.weeklyTarget * 1.05; // 5% tolerance

  return {
    weeklyTarget: week.weeklyTarget,
    weeklyConsumed,
    weeklyRemaining,
    bankedCalories: week.bankedCalories,
    daysComplete,
    daysRemaining,
    onTrack,
    projectedEndOfWeek: Math.round(projectedEndOfWeek),
  };
}
