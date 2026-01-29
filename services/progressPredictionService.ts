/**
 * Progress Prediction Service
 * Business logic for weight predictions, trend analysis, and goal projections
 */

import {
  WeightDataPoint,
  WeightPrediction,
  GoalProjection,
  TrendAnalysis,
  PlateauInfo,
  Milestone,
  ProgressSnapshot,
  WeeklyPredictionSummary,
  PREDICTION_CONSTANTS,
  DEFAULT_WEIGHT_MILESTONES,
  PLATEAU_SUGGESTIONS,
  DEFAULT_PLATEAU_INFO,
  DEFAULT_TREND_ANALYSIS,
} from '../types/progressPrediction';

// ============ Trend Calculation ============

/**
 * Calculate exponential moving average (trend smoothing)
 */
export function calculateEMA(
  dataPoints: WeightDataPoint[],
  alpha: number = PREDICTION_CONSTANTS.EXPONENTIAL_SMOOTHING_ALPHA
): WeightDataPoint[] {
  if (dataPoints.length === 0) return [];

  // Sort by date ascending for EMA calculation
  const sorted = [...dataPoints].sort((a, b) => a.date.localeCompare(b.date));

  // Initialize first EMA with first weight
  let ema = sorted[0].weight;
  const result: WeightDataPoint[] = [];

  for (const point of sorted) {
    ema = alpha * point.weight + (1 - alpha) * ema;
    result.push({
      ...point,
      trend: Math.round(ema * 100) / 100,
    });
  }

  // Return in descending order (newest first)
  return result.reverse();
}

/**
 * Calculate weekly change rate
 */
export function calculateWeeklyRate(dataPoints: WeightDataPoint[]): number {
  if (dataPoints.length < 7) return 0;

  // Get weights from 7 days ago and today
  const sorted = [...dataPoints].sort((a, b) => b.date.localeCompare(a.date));
  const current = sorted[0]?.trend || sorted[0]?.weight;

  // Find weight closest to 7 days ago
  const weekAgoDate = new Date();
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const weekAgoStr = weekAgoDate.toISOString().split('T')[0];

  const weekAgoPoint = sorted.find((p) => p.date <= weekAgoStr);
  if (!weekAgoPoint) return 0;

  const weekAgoWeight = weekAgoPoint.trend || weekAgoPoint.weight;
  return Math.round((current - weekAgoWeight) * 100) / 100;
}

/**
 * Calculate monthly change rate
 */
export function calculateMonthlyRate(dataPoints: WeightDataPoint[]): number {
  if (dataPoints.length < 14) return 0;

  const sorted = [...dataPoints].sort((a, b) => b.date.localeCompare(a.date));
  const current = sorted[0]?.trend || sorted[0]?.weight;

  // Find weight closest to 30 days ago
  const monthAgoDate = new Date();
  monthAgoDate.setDate(monthAgoDate.getDate() - 30);
  const monthAgoStr = monthAgoDate.toISOString().split('T')[0];

  const monthAgoPoint = sorted.find((p) => p.date <= monthAgoStr);
  if (!monthAgoPoint) return calculateWeeklyRate(dataPoints) * 4; // Estimate from weekly

  const monthAgoWeight = monthAgoPoint.trend || monthAgoPoint.weight;
  return Math.round((current - monthAgoWeight) * 100) / 100;
}

/**
 * Analyze weight trends
 */
export function analyzeTrends(dataPoints: WeightDataPoint[]): TrendAnalysis {
  if (dataPoints.length < PREDICTION_CONSTANTS.MIN_DATA_POINTS_TREND) {
    return DEFAULT_TREND_ANALYSIS;
  }

  const smoothed = calculateEMA(dataPoints);
  const weeklyChange = calculateWeeklyRate(smoothed);
  const monthlyChange = calculateMonthlyRate(smoothed);

  // Determine direction
  let direction: TrendAnalysis['direction'] = 'maintaining';
  if (weeklyChange < -0.2) direction = 'losing';
  else if (weeklyChange > 0.2) direction = 'gaining';

  // Determine velocity change (compare recent week to previous week)
  let velocityChange: TrendAnalysis['velocityChange'] = 'steady';
  if (smoothed.length >= 14) {
    const recentWeekRate = calculateWeeklyRate(smoothed.slice(0, 7));
    const prevWeekRate = calculateWeeklyRate(smoothed.slice(7, 14));
    const rateChange = Math.abs(recentWeekRate) - Math.abs(prevWeekRate);

    if (rateChange > 0.3) velocityChange = 'accelerating';
    else if (rateChange < -0.3) velocityChange = 'decelerating';
  }

  // Calculate consistency (how much variation from trend)
  let totalVariance = 0;
  for (const point of smoothed) {
    totalVariance += Math.abs(point.weight - point.trend);
  }
  const avgVariance = totalVariance / smoothed.length;
  const consistency = Math.max(0, Math.round(100 - avgVariance * 50));

  const sorted = [...smoothed].sort((a, b) => a.date.localeCompare(b.date));

  return {
    direction,
    weeklyChange,
    monthlyChange,
    velocityChange,
    consistency,
    dataPoints: smoothed.length,
    startDate: sorted[0]?.date || '',
    endDate: sorted[sorted.length - 1]?.date || '',
  };
}

// ============ Plateau Detection ============

/**
 * Detect if user is in a plateau
 */
export function detectPlateau(dataPoints: WeightDataPoint[]): PlateauInfo {
  if (dataPoints.length < PREDICTION_CONSTANTS.PLATEAU_MIN_DAYS) {
    return DEFAULT_PLATEAU_INFO;
  }

  const smoothed = calculateEMA(dataPoints);
  const sorted = [...smoothed].sort((a, b) => b.date.localeCompare(a.date));

  // Get current trend and check last 2 weeks
  const currentTrend = sorted[0].trend;
  const twoWeeksData = sorted.slice(0, 14);

  if (twoWeeksData.length < 14) {
    return DEFAULT_PLATEAU_INFO;
  }

  // Calculate percentage change over 2 weeks
  const twoWeeksAgoTrend = twoWeeksData[twoWeeksData.length - 1].trend;
  const percentChange = Math.abs(
    ((currentTrend - twoWeeksAgoTrend) / twoWeeksAgoTrend) * 100
  );

  if (percentChange > PREDICTION_CONSTANTS.PLATEAU_THRESHOLD_PERCENT) {
    return DEFAULT_PLATEAU_INFO;
  }

  // In a plateau - find when it started
  let plateauStartIndex = 0;
  for (let i = 1; i < sorted.length; i++) {
    const change = Math.abs(
      ((sorted[i - 1].trend - sorted[i].trend) / sorted[i].trend) * 100
    );
    if (change > PREDICTION_CONSTANTS.PLATEAU_THRESHOLD_PERCENT / 2) {
      plateauStartIndex = i - 1;
      break;
    }
  }

  const plateauStartDate = sorted[plateauStartIndex]?.date || sorted[0].date;
  const plateauStart = new Date(plateauStartDate);
  const now = new Date();
  const plateauDuration = Math.floor(
    (now.getTime() - plateauStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Estimate breakthrough date
  const remainingDays = Math.max(
    0,
    PREDICTION_CONSTANTS.PLATEAU_EXPECTED_DURATION - plateauDuration
  );
  const breakthroughDate = new Date();
  breakthroughDate.setDate(breakthroughDate.getDate() + remainingDays);

  // Get random suggestions
  const shuffled = [...PLATEAU_SUGGESTIONS].sort(() => Math.random() - 0.5);
  const suggestions = shuffled.slice(0, 3);

  return {
    isInPlateau: true,
    plateauStartDate,
    plateauDuration,
    expectedBreakthroughDate: breakthroughDate.toISOString().split('T')[0],
    suggestedActions: suggestions,
  };
}

// ============ Weight Predictions ============

/**
 * Generate weight predictions for future dates
 */
export function generatePredictions(
  dataPoints: WeightDataPoint[],
  daysAhead: number = PREDICTION_CONSTANTS.PREDICTION_HORIZON_DAYS
): WeightPrediction[] {
  if (dataPoints.length < PREDICTION_CONSTANTS.MIN_DATA_POINTS_PROJECTION) {
    return [];
  }

  const smoothed = calculateEMA(dataPoints);
  const weeklyRate = calculateWeeklyRate(smoothed);
  const dailyRate = weeklyRate / 7;

  // Calculate variance for confidence intervals
  let sumSquaredDiff = 0;
  for (const point of smoothed) {
    sumSquaredDiff += Math.pow(point.weight - point.trend, 2);
  }
  const stdDev = Math.sqrt(sumSquaredDiff / smoothed.length);

  const currentWeight = smoothed[0].trend;
  const predictions: WeightPrediction[] = [];
  const today = new Date();

  for (let day = 7; day <= daysAhead; day += 7) {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + day);

    // Apply metabolic adaptation for long-term predictions
    let adaptationFactor = 1;
    if (day > PREDICTION_CONSTANTS.ADAPTATION_THRESHOLD_WEEKS * 7) {
      adaptationFactor = 1 - PREDICTION_CONSTANTS.METABOLIC_ADAPTATION_PERCENT;
    }

    const predictedWeight =
      currentWeight + dailyRate * day * adaptationFactor;

    // Confidence intervals widen with time
    const timeUncertainty = Math.sqrt(day / 7) * stdDev;
    const confidenceMin = predictedWeight - timeUncertainty * 1.5;
    const confidenceMax = predictedWeight + timeUncertainty * 1.5;

    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      predictedWeight: Math.round(predictedWeight * 10) / 10,
      confidenceMin: Math.round(confidenceMin * 10) / 10,
      confidenceMax: Math.round(confidenceMax * 10) / 10,
      daysFromNow: day,
    });
  }

  return predictions;
}

// ============ Goal Projection ============

/**
 * Project when user will reach their goal weight
 */
export function projectGoalCompletion(
  dataPoints: WeightDataPoint[],
  goalWeight: number
): GoalProjection {
  const smoothed = calculateEMA(dataPoints);

  if (smoothed.length === 0) {
    return {
      goalWeight,
      currentWeight: 0,
      weightToLose: 0,
      projectedDate: null,
      daysRemaining: null,
      weeklyRate: 0,
      isOnTrack: false,
      confidenceLevel: 'low',
    };
  }

  const currentWeight = smoothed[0].trend;
  const weightToLose = currentWeight - goalWeight;
  const weeklyRate = calculateWeeklyRate(smoothed);

  // Check if already at goal
  if (Math.abs(weightToLose) < 0.5) {
    return {
      goalWeight,
      currentWeight,
      weightToLose: 0,
      projectedDate: new Date().toISOString().split('T')[0],
      daysRemaining: 0,
      weeklyRate,
      isOnTrack: true,
      confidenceLevel: 'high',
    };
  }

  // Check if moving in wrong direction
  if ((weightToLose > 0 && weeklyRate >= 0) || (weightToLose < 0 && weeklyRate <= 0)) {
    return {
      goalWeight,
      currentWeight,
      weightToLose,
      projectedDate: null,
      daysRemaining: null,
      weeklyRate,
      isOnTrack: false,
      confidenceLevel: 'low',
    };
  }

  // Calculate weeks to goal
  const weeksToGoal = Math.abs(weightToLose / weeklyRate);
  const daysToGoal = Math.round(weeksToGoal * 7);

  // Apply metabolic adaptation for long projections
  let adjustedDays = daysToGoal;
  if (weeksToGoal > PREDICTION_CONSTANTS.ADAPTATION_THRESHOLD_WEEKS) {
    adjustedDays = Math.round(
      daysToGoal * (1 + PREDICTION_CONSTANTS.METABOLIC_ADAPTATION_PERCENT)
    );
  }

  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysToGoal);

  const adjustedDate = new Date();
  adjustedDate.setDate(adjustedDate.getDate() + adjustedDays);

  // Determine if on track (healthy rate)
  const absWeeklyRate = Math.abs(weeklyRate);
  const isHealthyRate =
    absWeeklyRate >= PREDICTION_CONSTANTS.MIN_HEALTHY_WEEKLY_LOSS_LBS &&
    absWeeklyRate <= PREDICTION_CONSTANTS.MAX_SAFE_WEEKLY_LOSS_LBS;

  // Confidence based on data points and consistency
  let confidenceLevel: GoalProjection['confidenceLevel'] = 'low';
  if (smoothed.length >= PREDICTION_CONSTANTS.MIN_DATA_POINTS_CONFIDENCE) {
    confidenceLevel = 'high';
  } else if (smoothed.length >= PREDICTION_CONSTANTS.MIN_DATA_POINTS_PROJECTION) {
    confidenceLevel = 'medium';
  }

  return {
    goalWeight,
    currentWeight,
    weightToLose,
    projectedDate: projectedDate.toISOString().split('T')[0],
    daysRemaining: daysToGoal,
    weeklyRate,
    isOnTrack: isHealthyRate,
    confidenceLevel,
    adjustedProjection:
      adjustedDays !== daysToGoal
        ? adjustedDate.toISOString().split('T')[0]
        : undefined,
  };
}

// ============ Progress Snapshot ============

/**
 * Calculate BMI
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Convert lbs to kg
 */
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

/**
 * Create progress snapshot
 */
export function createProgressSnapshot(
  currentWeight: number,
  startingWeight: number,
  goalWeight: number,
  heightCm: number,
  unitSystem: 'imperial' | 'metric' = 'imperial'
): ProgressSnapshot {
  const currentKg = unitSystem === 'imperial' ? lbsToKg(currentWeight) : currentWeight;
  const startingKg = unitSystem === 'imperial' ? lbsToKg(startingWeight) : startingWeight;
  const goalKg = unitSystem === 'imperial' ? lbsToKg(goalWeight) : goalWeight;

  const totalLost = startingWeight - currentWeight;
  const totalToLose = startingWeight - goalWeight;
  const percentComplete =
    totalToLose > 0 ? Math.round((totalLost / totalToLose) * 100) : 100;

  return {
    currentWeight,
    startingWeight,
    goalWeight,
    totalLost: Math.round(totalLost * 10) / 10,
    totalToLose: Math.round(totalToLose * 10) / 10,
    percentComplete: Math.min(100, Math.max(0, percentComplete)),
    currentBMI: calculateBMI(currentKg, heightCm),
    startingBMI: calculateBMI(startingKg, heightCm),
    goalBMI: calculateBMI(goalKg, heightCm),
    heightCm,
    lastUpdated: Date.now(),
  };
}

// ============ Milestones ============

/**
 * Generate unique milestone ID
 */
function generateMilestoneId(): string {
  return `ms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create default milestones based on starting and goal weight
 */
export function createDefaultMilestones(
  startingWeight: number,
  goalWeight: number,
  currentWeight: number
): Milestone[] {
  const totalToLose = startingWeight - goalWeight;
  if (totalToLose <= 0) return [];

  const milestones: Milestone[] = [];

  for (const milestone of DEFAULT_WEIGHT_MILESTONES) {
    const targetWeight = startingWeight - (totalToLose * milestone.percent) / 100;
    const lost = startingWeight - currentWeight;
    const targetLost = (totalToLose * milestone.percent) / 100;
    const progress = Math.min(100, Math.max(0, (lost / targetLost) * 100));
    const achieved = currentWeight <= targetWeight;

    milestones.push({
      id: generateMilestoneId(),
      type: 'percentage',
      targetValue: milestone.percent,
      currentProgress: Math.round(progress),
      projectedDate: null, // Will be calculated
      achieved,
      achievedDate: achieved ? new Date().toISOString().split('T')[0] : null,
      label: milestone.label,
    });
  }

  return milestones;
}

/**
 * Update milestones based on current progress
 */
export function updateMilestones(
  milestones: Milestone[],
  currentWeight: number,
  startingWeight: number,
  goalWeight: number,
  weeklyRate: number
): Milestone[] {
  const totalToLose = startingWeight - goalWeight;
  if (totalToLose <= 0) return milestones;

  return milestones.map((milestone) => {
    if (milestone.type === 'percentage') {
      const targetLost = (totalToLose * milestone.targetValue) / 100;
      const targetWeight = startingWeight - targetLost;
      const actualLost = startingWeight - currentWeight;
      const progress = Math.min(100, Math.max(0, (actualLost / targetLost) * 100));
      const achieved = currentWeight <= targetWeight;

      // Calculate projected date if not achieved
      let projectedDate = milestone.projectedDate;
      if (!achieved && weeklyRate < 0) {
        const remainingToLose = currentWeight - targetWeight;
        const weeksRemaining = Math.abs(remainingToLose / weeklyRate);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + Math.round(weeksRemaining * 7));
        projectedDate = futureDate.toISOString().split('T')[0];
      }

      return {
        ...milestone,
        currentProgress: Math.round(progress),
        projectedDate,
        achieved,
        achievedDate: achieved && !milestone.achievedDate
          ? new Date().toISOString().split('T')[0]
          : milestone.achievedDate,
      };
    }

    return milestone;
  });
}

// ============ Weekly Summary ============

/**
 * Create weekly prediction summary
 */
export function createWeeklySummary(
  dataPoints: WeightDataPoint[],
  weekStart: Date,
  expectedWeeklyChange: number
): WeeklyPredictionSummary | null {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  // Get weights for this week
  const weekData = dataPoints.filter(
    (p) => p.date >= weekStartStr && p.date <= weekEndStr
  );

  if (weekData.length < 2) return null;

  const sorted = [...weekData].sort((a, b) => a.date.localeCompare(b.date));
  const startWeight = sorted[0].weight;
  const endWeight = sorted[sorted.length - 1].weight;
  const actualChange = endWeight - startWeight;
  const predictedEndWeight = startWeight + expectedWeeklyChange;
  const variance = actualChange - expectedWeeklyChange;

  let rating: WeeklyPredictionSummary['rating'] = 'on_track';
  if (Math.abs(variance) > 0.5) {
    // If losing weight is the goal and lost more than expected
    if (expectedWeeklyChange < 0 && variance < 0) rating = 'ahead';
    // If losing weight is the goal and lost less than expected
    else if (expectedWeeklyChange < 0 && variance > 0) rating = 'behind';
    // If gaining weight is the goal and gained more than expected
    else if (expectedWeeklyChange > 0 && variance > 0) rating = 'ahead';
    // If gaining weight is the goal and gained less than expected
    else if (expectedWeeklyChange > 0 && variance < 0) rating = 'behind';
  }

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    startWeight: Math.round(startWeight * 10) / 10,
    endWeight: Math.round(endWeight * 10) / 10,
    predictedEndWeight: Math.round(predictedEndWeight * 10) / 10,
    actualChange: Math.round(actualChange * 10) / 10,
    expectedChange: Math.round(expectedWeeklyChange * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    rating,
  };
}
