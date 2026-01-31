/**
 * Adaptive TDEE Calculator - MacroFactor-style learning metabolism algorithm
 * Calculates actual TDEE from real weight and calorie data (14+ days required)
 *
 * Algorithm:
 * 1. Collect 14+ days of weight measurements and calorie intake
 * 2. Calculate weight change trend using linear regression
 * 3. Convert weight change to calorie deficit/surplus (3500 cal = 1 lb)
 * 4. Add/subtract from average intake to get actual TDEE
 * 5. Compare to formula-based estimate (Mifflin-St Jeor)
 * 6. Provide confidence score based on data quality and consistency
 */

export interface WeightEntry {
  date: string; // ISO date
  weight: number; // in lbs or kg
  unit: 'lbs' | 'kg';
}

export interface CalorieEntry {
  date: string; // ISO date
  calories: number;
}

export interface TDEEResult {
  adaptiveTDEE: number; // Calculated from real data
  formulaTDEE: number; // Mifflin-St Jeor estimate
  variance: number; // % difference between adaptive and formula
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number; // 0-100
  daysOfData: number;
  weightTrend: 'losing' | 'gaining' | 'maintaining';
  avgWeeklyChange: number; // lbs per week
  recommendation: string;
  needsMoreData: boolean;
  minDaysRemaining?: number;
}

export interface UserStats {
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  currentWeightLbs: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

const CALORIES_PER_POUND = 3500;
const MIN_DAYS_REQUIRED = 14;

/**
 * Calculate Mifflin-St Jeor TDEE (formula-based estimate)
 */
function calculateFormulaTDEE(stats: UserStats): number {
  const { age, sex, heightCm, currentWeightLbs, activityLevel } = stats;
  const weightKg = currentWeightLbs * 0.453592;

  // Mifflin-St Jeor BMR
  let bmr: number;
  if (sex === 'male') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * activityMultipliers[activityLevel]);
}

/**
 * Calculate linear regression for weight trend
 */
function calculateLinearRegression(data: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = data.length;
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);
  const sumY2 = data.reduce((sum, point) => sum + point.y * point.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared (quality of fit)
  const meanY = sumY / n;
  const ssTotal = data.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const ssResidual = data.reduce(
    (sum, point) => sum + Math.pow(point.y - (slope * point.x + intercept), 2),
    0
  );
  const rSquared = 1 - ssResidual / ssTotal;

  return { slope, intercept, rSquared };
}

/**
 * Calculate confidence score based on data quality
 */
function calculateConfidence(
  daysOfData: number,
  rSquared: number,
  dataConsistency: number
): { level: 'low' | 'medium' | 'high'; score: number } {
  let score = 0;

  // Days of data (max 40 points)
  if (daysOfData >= 28) score += 40;
  else if (daysOfData >= 21) score += 30;
  else if (daysOfData >= 14) score += 20;
  else score += 10;

  // R-squared quality (max 40 points)
  if (rSquared >= 0.8) score += 40;
  else if (rSquared >= 0.6) score += 30;
  else if (rSquared >= 0.4) score += 20;
  else score += 10;

  // Data consistency (max 20 points)
  score += dataConsistency * 20;

  let level: 'low' | 'medium' | 'high';
  if (score >= 70) level = 'high';
  else if (score >= 50) level = 'medium';
  else level = 'low';

  return { level, score };
}

/**
 * Main adaptive TDEE calculation
 */
export function calculateAdaptiveTDEE(
  weightEntries: WeightEntry[],
  calorieEntries: CalorieEntry[],
  userStats: UserStats
): TDEEResult {
  const formulaTDEE = calculateFormulaTDEE(userStats);

  // Check minimum data requirement
  if (weightEntries.length < MIN_DAYS_REQUIRED || calorieEntries.length < MIN_DAYS_REQUIRED) {
    return {
      adaptiveTDEE: formulaTDEE,
      formulaTDEE,
      variance: 0,
      confidence: 'low',
      confidenceScore: 0,
      daysOfData: Math.min(weightEntries.length, calorieEntries.length),
      weightTrend: 'maintaining',
      avgWeeklyChange: 0,
      recommendation: 'Continue tracking for accurate TDEE calculation',
      needsMoreData: true,
      minDaysRemaining: MIN_DAYS_REQUIRED - Math.min(weightEntries.length, calorieEntries.length),
    };
  }

  // Sort entries by date
  const sortedWeights = [...weightEntries].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const sortedCalories = [...calorieEntries].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Convert weights to lbs for consistency
  const weightsInLbs = sortedWeights.map(entry => ({
    date: entry.date,
    weight: entry.unit === 'kg' ? entry.weight * 2.20462 : entry.weight,
  }));

  // Prepare data for linear regression (x = day index, y = weight)
  const regressionData = weightsInLbs.map((entry, index) => ({
    x: index,
    y: entry.weight,
  }));

  const regression = calculateLinearRegression(regressionData);

  // Calculate weight change per day (slope)
  const weightChangePerDay = regression.slope;
  const weightChangePerWeek = weightChangePerDay * 7;

  // Calculate average calorie intake
  const avgCalories = sortedCalories.reduce((sum, entry) => sum + entry.calories, 0) / sortedCalories.length;

  // Calculate calorie deficit/surplus from weight change
  // Positive weight change = surplus, negative = deficit
  const calorieChangePerDay = (weightChangePerDay * CALORIES_PER_POUND) / 7;

  // Adaptive TDEE = average intake - calorie change
  // If losing weight (negative change), TDEE = intake + deficit
  // If gaining weight (positive change), TDEE = intake - surplus
  const adaptiveTDEE = Math.round(avgCalories - calorieChangePerDay);

  // Calculate data consistency (how many days have both weight and calorie data)
  const dateSet = new Set(sortedCalories.map(e => e.date));
  const consistentDays = sortedWeights.filter(e => dateSet.has(e.date)).length;
  const dataConsistency = consistentDays / Math.max(weightEntries.length, calorieEntries.length);

  // Calculate confidence
  const { level: confidence, score: confidenceScore } = calculateConfidence(
    Math.min(weightEntries.length, calorieEntries.length),
    regression.rSquared,
    dataConsistency
  );

  // Determine trend
  let weightTrend: 'losing' | 'gaining' | 'maintaining';
  if (Math.abs(weightChangePerWeek) < 0.25) {
    weightTrend = 'maintaining';
  } else if (weightChangePerWeek < 0) {
    weightTrend = 'losing';
  } else {
    weightTrend = 'gaining';
  }

  // Calculate variance from formula
  const variance = ((adaptiveTDEE - formulaTDEE) / formulaTDEE) * 100;

  // Generate recommendation
  let recommendation = '';
  if (confidence === 'high') {
    if (Math.abs(variance) > 15) {
      recommendation = `Your actual TDEE is ${Math.abs(variance).toFixed(0)}% ${variance > 0 ? 'higher' : 'lower'} than formulas predicted. Trust your data!`;
    } else {
      recommendation = 'Your metabolism aligns closely with formula estimates. Data is reliable.';
    }
  } else if (confidence === 'medium') {
    recommendation = 'Continue tracking for more accurate results. Early data shows promising trends.';
  } else {
    recommendation = 'More consistent tracking needed. Try to log weight and calories daily.';
  }

  return {
    adaptiveTDEE,
    formulaTDEE,
    variance,
    confidence,
    confidenceScore,
    daysOfData: Math.min(weightEntries.length, calorieEntries.length),
    weightTrend,
    avgWeeklyChange: weightChangePerWeek,
    recommendation,
    needsMoreData: false,
  };
}

/**
 * Get suggested calorie adjustment based on goal
 */
export function getCalorieAdjustment(
  currentTDEE: number,
  goal: 'fat_loss' | 'muscle_gain' | 'maintain',
  aggressiveness: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
): {
  targetCalories: number;
  adjustment: number;
  expectedWeeklyChange: number;
  timeToGoal: string;
} {
  const adjustments = {
    fat_loss: {
      conservative: -250, // 0.5 lb/week
      moderate: -500,     // 1 lb/week
      aggressive: -750,   // 1.5 lb/week
    },
    muscle_gain: {
      conservative: 200,  // 0.4 lb/week
      moderate: 300,      // 0.6 lb/week
      aggressive: 500,    // 1 lb/week
    },
    maintain: {
      conservative: 0,
      moderate: 0,
      aggressive: 0,
    },
  };

  const adjustment = adjustments[goal][aggressiveness];
  const targetCalories = currentTDEE + adjustment;
  const expectedWeeklyChange = (adjustment * 7) / CALORIES_PER_POUND;

  return {
    targetCalories: Math.round(targetCalories),
    adjustment,
    expectedWeeklyChange,
    timeToGoal: goal === 'maintain' ? 'Ongoing' : 'Depends on goal weight',
  };
}
