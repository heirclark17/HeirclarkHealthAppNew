// Adaptive TDEE Calculation Service
// The core algorithm that learns your true metabolism from real data

import {
  BodyWeightLog,
  DailyCalorieLog,
  TDEEDataPoint,
  AdaptiveTDEEResult,
  TDEECalculationInput,
  TDEE_CONSTANTS,
} from '../types/adaptiveTDEE';
import { adaptiveTDEEStorage, convertBodyWeight } from './adaptiveTDEEStorage';
import { ACTIVITY_MULTIPLIERS } from '../constants/goals';

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female'
): number {
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

/**
 * Calculate formula-based TDEE (static method)
 */
function calculateFormulaTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female',
  activityLevel: string
): number {
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel as keyof typeof ACTIVITY_MULTIPLIERS] || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Group daily data into weekly buckets
 */
function groupByWeek(
  weightHistory: BodyWeightLog[],
  calorieHistory: DailyCalorieLog[]
): Map<string, { weights: BodyWeightLog[]; calories: DailyCalorieLog[] }> {
  const weeks = new Map<string, { weights: BodyWeightLog[]; calories: DailyCalorieLog[] }>();

  // Helper to get week key (Sunday of that week)
  const getWeekKey = (date: string): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  // Group weight logs
  weightHistory.forEach((log) => {
    const weekKey = getWeekKey(log.date);
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, { weights: [], calories: [] });
    }
    weeks.get(weekKey)!.weights.push(log);
  });

  // Group calorie logs
  calorieHistory.forEach((log) => {
    const weekKey = getWeekKey(log.date);
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, { weights: [], calories: [] });
    }
    weeks.get(weekKey)!.calories.push(log);
  });

  return weeks;
}

/**
 * Calculate weekly averages for weight and calories
 */
function calculateWeeklyAverages(
  weeks: Map<string, { weights: BodyWeightLog[]; calories: DailyCalorieLog[] }>,
  targetUnit: 'lb' | 'kg' = 'lb'
): TDEEDataPoint[] {
  const dataPoints: TDEEDataPoint[] = [];
  const sortedWeeks = [...weeks.keys()].sort();

  let previousAvgWeight: number | null = null;

  sortedWeeks.forEach((weekKey) => {
    const week = weeks.get(weekKey)!;

    // Need at least 3 weight logs and 3 calorie logs for reliable data
    if (week.weights.length < 3 || week.calories.length < 3) {
      return;
    }

    // Calculate average weight (convert all to target unit)
    const totalWeight = week.weights.reduce((sum, log) => {
      return sum + convertBodyWeight(log.weight, log.unit, targetUnit);
    }, 0);
    const avgWeight = totalWeight / week.weights.length;

    // Calculate average calories
    const totalCalories = week.calories.reduce((sum, log) => sum + log.caloriesConsumed, 0);
    const avgCalories = totalCalories / week.calories.length;

    // Calculate weight change from previous week
    const weightChange = previousAvgWeight !== null ? avgWeight - previousAvgWeight : 0;

    // Calculate TDEE from energy balance
    // TDEE = Calories In - (Weight Change × Calories per unit)
    const caloriesPerUnit = targetUnit === 'lb'
      ? TDEE_CONSTANTS.CALORIES_PER_POUND
      : TDEE_CONSTANTS.CALORIES_PER_KG;

    // Weekly weight change in calories = (weightChange × caloriesPerUnit)
    // Daily TDEE = avgCalories - (weekly calorie change / 7)
    const weeklyCalorieChange = weightChange * caloriesPerUnit;
    const dailyTDEE = avgCalories - (weeklyCalorieChange / 7);

    if (previousAvgWeight !== null && dailyTDEE > 800 && dailyTDEE < 6000) {
      // Only add valid TDEE calculations
      dataPoints.push({
        weekEndDate: weekKey,
        avgWeight: Math.round(avgWeight * 10) / 10,
        avgCalories: Math.round(avgCalories),
        weightChange: Math.round(weightChange * 100) / 100,
        calculatedTDEE: Math.round(dailyTDEE),
      });
    }

    previousAvgWeight = avgWeight;
  });

  return dataPoints;
}

/**
 * Apply exponential smoothing to TDEE values
 */
function smoothTDEE(dataPoints: TDEEDataPoint[]): number {
  if (dataPoints.length === 0) return 0;
  if (dataPoints.length === 1) return dataPoints[0].calculatedTDEE;

  const alpha = TDEE_CONSTANTS.SMOOTHING_FACTOR;
  let smoothedTDEE = dataPoints[0].calculatedTDEE;

  for (let i = 1; i < dataPoints.length; i++) {
    smoothedTDEE = alpha * dataPoints[i].calculatedTDEE + (1 - alpha) * smoothedTDEE;
  }

  return Math.round(smoothedTDEE);
}

/**
 * Calculate confidence score based on data quality
 */
function calculateConfidence(
  dataPoints: TDEEDataPoint[],
  totalDaysWithData: number
): { confidence: 'low' | 'medium' | 'high'; score: number } {
  // Factors affecting confidence:
  // 1. Number of weeks of data
  // 2. Consistency of TDEE calculations
  // 3. Total days with complete data

  let score = 0;

  // Data quantity (up to 40 points)
  const weeksOfData = dataPoints.length;
  if (weeksOfData >= 8) score += 40;
  else if (weeksOfData >= 4) score += 30;
  else if (weeksOfData >= 2) score += 20;
  else score += 10;

  // Data consistency (up to 30 points)
  if (dataPoints.length >= 2) {
    const tdeeValues = dataPoints.map((dp) => dp.calculatedTDEE);
    const avgTDEE = tdeeValues.reduce((a, b) => a + b, 0) / tdeeValues.length;
    const variance = tdeeValues.reduce((sum, val) => sum + Math.pow(val - avgTDEE, 2), 0) / tdeeValues.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgTDEE;

    // Lower CV = more consistent = higher score
    if (coefficientOfVariation < 0.05) score += 30;
    else if (coefficientOfVariation < 0.10) score += 25;
    else if (coefficientOfVariation < 0.15) score += 20;
    else if (coefficientOfVariation < 0.20) score += 15;
    else score += 10;
  }

  // Days with complete data (up to 30 points)
  if (totalDaysWithData >= 28) score += 30;
  else if (totalDaysWithData >= 21) score += 25;
  else if (totalDaysWithData >= 14) score += 20;
  else score += 10;

  // Determine confidence level
  let confidence: 'low' | 'medium' | 'high';
  if (score >= 80) confidence = 'high';
  else if (score >= 50) confidence = 'medium';
  else confidence = 'low';

  return { confidence, score };
}

/**
 * Generate insights based on the calculated data
 */
function generateInsights(
  adaptiveTDEE: number,
  formulaTDEE: number,
  dataPoints: TDEEDataPoint[],
  goalType: 'lose' | 'maintain' | 'gain'
): string[] {
  const insights: string[] = [];
  const difference = adaptiveTDEE - formulaTDEE;
  const differencePercent = Math.round((difference / formulaTDEE) * 100);

  // Metabolism insight
  if (differencePercent > 8) {
    insights.push(
      `Your metabolism appears to be ${differencePercent}% higher than predicted by standard formulas. This is great news for your ${goalType === 'lose' ? 'fat loss' : 'goals'}!`
    );
  } else if (differencePercent < -8) {
    insights.push(
      `Your metabolism appears to be ${Math.abs(differencePercent)}% lower than predicted. This is common and just means we need to adjust your targets accordingly.`
    );
  } else {
    insights.push(
      `Your metabolism closely matches the predicted value (within ${Math.abs(differencePercent)}%). The standard formula works well for you!`
    );
  }

  // Trend insight
  if (dataPoints.length >= 4) {
    const recentTDEE = dataPoints.slice(-2).map(dp => dp.calculatedTDEE);
    const olderTDEE = dataPoints.slice(-4, -2).map(dp => dp.calculatedTDEE);
    const recentAvg = recentTDEE.reduce((a, b) => a + b, 0) / recentTDEE.length;
    const olderAvg = olderTDEE.reduce((a, b) => a + b, 0) / olderTDEE.length;
    const trendChange = recentAvg - olderAvg;

    if (trendChange > 100) {
      insights.push(
        `Your metabolism has increased by ~${Math.round(trendChange)} cal/day over the past few weeks. This could indicate metabolic adaptation or increased activity.`
      );
    } else if (trendChange < -100) {
      insights.push(
        `Your metabolism has decreased by ~${Math.abs(Math.round(trendChange))} cal/day recently. This is normal during extended deficits. Consider a diet break if progress stalls.`
      );
    }
  }

  // Goal-specific insights
  if (goalType === 'lose') {
    const weeklyDeficit = 500 * 7; // 500 cal/day deficit
    const expectedWeeklyLoss = weeklyDeficit / TDEE_CONSTANTS.CALORIES_PER_POUND;
    insights.push(
      `Based on your adaptive TDEE, eating ${adaptiveTDEE - 500} calories daily should result in ~${expectedWeeklyLoss.toFixed(1)} lb/week loss.`
    );
  } else if (goalType === 'gain') {
    insights.push(
      `For lean muscle gain, aim for ${adaptiveTDEE + 250}-${adaptiveTDEE + 500} calories daily combined with progressive resistance training.`
    );
  }

  // Data quality insight
  if (dataPoints.length < 4) {
    insights.push(
      `We're still learning your metabolism. After ${4 - dataPoints.length} more weeks of data, our predictions will become more accurate.`
    );
  }

  return insights;
}

/**
 * Main TDEE calculation function
 */
export async function calculateAdaptiveTDEE(
  input: TDEECalculationInput
): Promise<AdaptiveTDEEResult> {
  const { weightHistory, calorieHistory, userProfile } = input;

  // Get data quality metrics
  const metrics = await adaptiveTDEEStorage.getDataQualityMetrics();

  // Calculate formula-based TDEE for comparison
  const latestWeight = weightHistory.length > 0
    ? convertBodyWeight(weightHistory[0].weight, weightHistory[0].unit, 'kg')
    : 80; // default

  const formulaTDEE = calculateFormulaTDEE(
    latestWeight,
    userProfile.heightCm,
    userProfile.age,
    userProfile.sex,
    userProfile.activityLevel
  );

  // If not enough data, return formula-based result
  if (!metrics.isReadyForCalculation) {
    const now = new Date().toISOString();
    const nextRecalc = new Date();
    nextRecalc.setDate(nextRecalc.getDate() + 7);

    return {
      adaptiveTDEE: formulaTDEE,
      formulaTDEE,
      difference: 0,
      differencePercent: 0,
      confidence: 'low',
      confidenceScore: 0,
      dataPoints: 0,
      recommendedCalories: calculateRecommendedCalories(formulaTDEE, userProfile.goalType, userProfile.targetWeeklyChange),
      adjustmentFromFormula: 0,
      metabolismTrend: 'normal',
      insights: [
        `We need ${metrics.daysUntilReady} more days of weight and calorie data to calculate your adaptive TDEE.`,
        `Continue logging your meals and weighing yourself daily for the most accurate results.`,
        `Using formula-based estimate of ${formulaTDEE} calories for now.`,
      ],
      weeklyHistory: [],
      lastCalculated: now,
      nextRecalculationDate: nextRecalc.toISOString(),
    };
  }

  // Group data by week
  const weeks = groupByWeek(weightHistory, calorieHistory);

  // Calculate weekly data points
  const dataPoints = calculateWeeklyAverages(weeks, 'lb');

  // Calculate smoothed adaptive TDEE
  const adaptiveTDEE = smoothTDEE(dataPoints);

  // Calculate confidence
  const { confidence, score } = calculateConfidence(dataPoints, metrics.daysWithBothLogs);

  // Calculate differences
  const difference = adaptiveTDEE - formulaTDEE;
  const differencePercent = Math.round((difference / formulaTDEE) * 100);

  // Determine metabolism trend
  let metabolismTrend: 'faster' | 'normal' | 'slower' = 'normal';
  if (differencePercent > 8) metabolismTrend = 'faster';
  else if (differencePercent < -8) metabolismTrend = 'slower';

  // Calculate recommended calories
  const recommendedCalories = calculateRecommendedCalories(
    adaptiveTDEE,
    userProfile.goalType,
    userProfile.targetWeeklyChange
  );

  // Generate insights
  const insights = generateInsights(
    adaptiveTDEE,
    formulaTDEE,
    dataPoints,
    userProfile.goalType
  );

  // Set next recalculation date (weekly)
  const now = new Date();
  const nextRecalc = new Date();
  nextRecalc.setDate(nextRecalc.getDate() + 7);

  const result: AdaptiveTDEEResult = {
    adaptiveTDEE,
    formulaTDEE,
    difference,
    differencePercent,
    confidence,
    confidenceScore: score,
    dataPoints: dataPoints.length,
    recommendedCalories,
    adjustmentFromFormula: recommendedCalories - calculateRecommendedCalories(formulaTDEE, userProfile.goalType, userProfile.targetWeeklyChange),
    metabolismTrend,
    insights,
    weeklyHistory: dataPoints,
    lastCalculated: now.toISOString(),
    nextRecalculationDate: nextRecalc.toISOString(),
  };

  // Save result to storage
  await adaptiveTDEEStorage.saveTDEEResult(result);

  return result;
}

/**
 * Calculate recommended daily calories based on goal
 */
function calculateRecommendedCalories(
  tdee: number,
  goalType: 'lose' | 'maintain' | 'gain',
  targetWeeklyChange: number
): number {
  // targetWeeklyChange is in lbs/week (negative for loss)
  const dailyCalorieAdjustment = (targetWeeklyChange * TDEE_CONSTANTS.CALORIES_PER_POUND) / 7;

  let recommended = tdee + dailyCalorieAdjustment;

  // Apply floors and ceilings
  recommended = Math.max(recommended, TDEE_CONSTANTS.MIN_CALORIES_FLOOR);

  // Don't allow more than 20% variance from TDEE
  const maxAdjustment = tdee * (TDEE_CONSTANTS.MAX_ADJUSTMENT_PERCENT / 100);
  if (Math.abs(recommended - tdee) > maxAdjustment) {
    if (goalType === 'lose') {
      recommended = tdee - maxAdjustment;
    } else if (goalType === 'gain') {
      recommended = tdee + maxAdjustment;
    }
  }

  return Math.round(recommended);
}

/**
 * Quick recalculation trigger (called when new data is added)
 */
export async function recalculateTDEEIfNeeded(
  userProfile: TDEECalculationInput['userProfile']
): Promise<AdaptiveTDEEResult | null> {
  const existingResult = await adaptiveTDEEStorage.getTDEEResult();

  // Check if recalculation is needed
  if (existingResult) {
    const lastCalc = new Date(existingResult.lastCalculated);
    const now = new Date();
    const daysSinceLastCalc = (now.getTime() - lastCalc.getTime()) / (1000 * 60 * 60 * 24);

    // Only recalculate once per day
    if (daysSinceLastCalc < 1) {
      return existingResult;
    }
  }

  // Get latest data
  const weightHistory = await adaptiveTDEEStorage.getWeightHistory();
  const calorieHistory = await adaptiveTDEEStorage.getCalorieHistory();

  // Perform calculation
  return calculateAdaptiveTDEE({
    weightHistory,
    calorieHistory,
    userProfile,
  });
}

export default {
  calculateAdaptiveTDEE,
  recalculateTDEEIfNeeded,
  calculateFormulaTDEE,
};
