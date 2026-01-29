/**
 * Progress Prediction Agent Types
 * Predicts weight trajectory, goal completion dates, and analyzes trends
 */

// Weight data point for trend analysis
export interface WeightDataPoint {
  date: string; // ISO date string
  weight: number; // in kg or lbs based on user preference
  trend: number; // smoothed trend value
  timestamp: number;
}

// Prediction timeframes
export type PredictionTimeframe = 'week' | 'month' | 'quarter' | 'year';

// Weight prediction for a future date
export interface WeightPrediction {
  date: string;
  predictedWeight: number;
  confidenceMin: number;
  confidenceMax: number;
  daysFromNow: number;
}

// Goal projection result
export interface GoalProjection {
  goalWeight: number;
  currentWeight: number;
  weightToLose: number; // positive for loss, negative for gain
  projectedDate: string | null;
  daysRemaining: number | null;
  weeklyRate: number; // lbs or kg per week
  isOnTrack: boolean;
  confidenceLevel: 'high' | 'medium' | 'low';
  adjustedProjection?: string; // Date accounting for plateaus
}

// Trend analysis result
export interface TrendAnalysis {
  direction: 'losing' | 'gaining' | 'maintaining';
  weeklyChange: number;
  monthlyChange: number;
  velocityChange: 'accelerating' | 'steady' | 'decelerating';
  consistency: number; // 0-100 score
  dataPoints: number;
  startDate: string;
  endDate: string;
}

// Plateau detection
export interface PlateauInfo {
  isInPlateau: boolean;
  plateauStartDate: string | null;
  plateauDuration: number; // days
  expectedBreakthroughDate: string | null;
  suggestedActions: string[];
}

// Milestone tracking
export interface Milestone {
  id: string;
  type: 'weight' | 'percentage' | 'bmi' | 'streak';
  targetValue: number;
  currentProgress: number; // 0-100
  projectedDate: string | null;
  achieved: boolean;
  achievedDate: string | null;
  label: string;
}

// Weekly summary for predictions
export interface WeeklyPredictionSummary {
  weekStart: string;
  weekEnd: string;
  startWeight: number;
  endWeight: number;
  predictedEndWeight: number;
  actualChange: number;
  expectedChange: number;
  variance: number; // difference from expected
  rating: 'ahead' | 'on_track' | 'behind';
}

// Progress snapshot
export interface ProgressSnapshot {
  currentWeight: number;
  startingWeight: number;
  goalWeight: number;
  totalLost: number;
  totalToLose: number;
  percentComplete: number;
  currentBMI: number;
  startingBMI: number;
  goalBMI: number;
  heightCm: number;
  lastUpdated: number;
}

// Progress prediction state
export interface ProgressPredictionState {
  weightHistory: WeightDataPoint[];
  predictions: WeightPrediction[];
  goalProjection: GoalProjection | null;
  trendAnalysis: TrendAnalysis | null;
  plateauInfo: PlateauInfo;
  milestones: Milestone[];
  snapshot: ProgressSnapshot | null;
  weeklySummaries: WeeklyPredictionSummary[];
  isLoading: boolean;
  lastCalculated: number;
}

// Constants for prediction algorithms
export const PREDICTION_CONSTANTS = {
  // Minimum data points for reliable predictions
  MIN_DATA_POINTS_TREND: 7,
  MIN_DATA_POINTS_PROJECTION: 14,
  MIN_DATA_POINTS_CONFIDENCE: 30,

  // Trend smoothing
  EXPONENTIAL_SMOOTHING_ALPHA: 0.1, // Lower = smoother
  TREND_WINDOW_DAYS: 7,

  // Plateau detection
  PLATEAU_THRESHOLD_PERCENT: 0.5, // < 0.5% change = plateau
  PLATEAU_MIN_DAYS: 14, // 2 weeks with no change
  PLATEAU_EXPECTED_DURATION: 21, // Average plateau lasts 3 weeks

  // Confidence intervals
  CONFIDENCE_LEVEL_HIGH: 0.8, // 80% of predictions within range
  CONFIDENCE_LEVEL_LOW: 0.95, // 95% wide range

  // Rate limits (safety)
  MAX_SAFE_WEEKLY_LOSS_LBS: 2,
  MAX_SAFE_WEEKLY_LOSS_KG: 0.9,
  MIN_HEALTHY_WEEKLY_LOSS_LBS: 0.5,
  MIN_HEALTHY_WEEKLY_LOSS_KG: 0.23,

  // Metabolic adaptation factor
  METABOLIC_ADAPTATION_PERCENT: 0.05, // 5% slowdown expected
  ADAPTATION_THRESHOLD_WEEKS: 8,

  // BMI categories
  BMI_UNDERWEIGHT: 18.5,
  BMI_NORMAL_MIN: 18.5,
  BMI_NORMAL_MAX: 24.9,
  BMI_OVERWEIGHT_MAX: 29.9,

  // Data retention
  MAX_HISTORY_DAYS: 365,
  PREDICTION_HORIZON_DAYS: 90,
};

// Default milestones based on weight loss
export const DEFAULT_WEIGHT_MILESTONES = [
  { percent: 5, label: '5% Lost' },
  { percent: 10, label: '10% Lost' },
  { percent: 15, label: '15% Lost' },
  { percent: 20, label: '20% Lost' },
  { percent: 25, label: '25% Lost' },
];

// Plateau suggestion messages
export const PLATEAU_SUGGESTIONS = [
  'Try varying your calorie intake day-to-day (calorie cycling)',
  'Consider adding or changing your exercise routine',
  'Ensure you are getting adequate sleep (7-9 hours)',
  'Double-check portion sizes - they can creep up over time',
  'Stay hydrated - water retention can mask fat loss',
  'Plateaus are normal! Your body is adapting to the new normal',
  'Consider a planned diet break to reset hormones',
  'Focus on non-scale victories (energy, clothes fit, strength)',
];

// Default plateau info
export const DEFAULT_PLATEAU_INFO: PlateauInfo = {
  isInPlateau: false,
  plateauStartDate: null,
  plateauDuration: 0,
  expectedBreakthroughDate: null,
  suggestedActions: [],
};

// Default trend analysis
export const DEFAULT_TREND_ANALYSIS: TrendAnalysis = {
  direction: 'maintaining',
  weeklyChange: 0,
  monthlyChange: 0,
  velocityChange: 'steady',
  consistency: 0,
  dataPoints: 0,
  startDate: '',
  endDate: '',
};
