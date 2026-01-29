// Adaptive TDEE Agent Types
// Tracks weight and calorie history to calculate true metabolic rate

export interface BodyWeightLog {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  weight: number; // in user's preferred unit
  unit: 'lb' | 'kg';
  source: 'manual' | 'apple_health' | 'fitbit' | 'google_fit';
  timestamp: string; // ISO timestamp for exact time
}

export interface DailyCalorieLog {
  date: string; // ISO date string (YYYY-MM-DD)
  caloriesConsumed: number;
  caloriesBurned: number; // from exercise
  netCalories: number; // consumed - burned
  mealsLogged: number;
  isComplete: boolean; // did user log all meals?
}

export interface TDEEDataPoint {
  weekEndDate: string;
  avgWeight: number;
  avgCalories: number;
  weightChange: number; // change from previous week
  calculatedTDEE: number;
}

export interface AdaptiveTDEEResult {
  // Core values
  adaptiveTDEE: number; // calculated from actual data
  formulaTDEE: number; // from Mifflin-St Jeor
  difference: number; // adaptive - formula
  differencePercent: number;

  // Confidence metrics
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number; // 0-100
  dataPoints: number; // number of weeks of data

  // Recommendations
  recommendedCalories: number; // based on goal
  adjustmentFromFormula: number; // how much to adjust from static calculation

  // Insights
  metabolismTrend: 'faster' | 'normal' | 'slower';
  insights: string[];

  // History
  weeklyHistory: TDEEDataPoint[];

  // Timestamps
  lastCalculated: string;
  nextRecalculationDate: string;
}

export interface AdaptiveTDEEState {
  // Current result
  result: AdaptiveTDEEResult | null;

  // Raw data
  weightHistory: BodyWeightLog[];
  calorieHistory: DailyCalorieLog[];

  // Status
  isCalculating: boolean;
  isEnabled: boolean; // user has enough data
  daysUntilReady: number; // days until enough data (14 minimum)

  // Last sync
  lastSyncDate: string | null;
}

export interface TDEECalculationInput {
  weightHistory: BodyWeightLog[];
  calorieHistory: DailyCalorieLog[];
  userProfile: {
    age: number;
    sex: 'male' | 'female';
    heightCm: number;
    activityLevel: string;
    goalType: 'lose' | 'maintain' | 'gain';
    targetWeeklyChange: number; // lbs per week (negative for loss)
  };
}

// Constants for TDEE calculation
export const TDEE_CONSTANTS = {
  MIN_DAYS_FOR_CALCULATION: 14, // minimum days of data needed
  IDEAL_DAYS_FOR_HIGH_CONFIDENCE: 28, // 4 weeks for high confidence
  CALORIES_PER_POUND: 3500, // calories in 1 lb of body weight
  CALORIES_PER_KG: 7700, // calories in 1 kg of body weight
  MIN_CALORIES_FLOOR: 1200, // minimum safe calories
  MAX_ADJUSTMENT_PERCENT: 20, // max % adjustment from formula
  SMOOTHING_FACTOR: 0.3, // for exponential smoothing
};
