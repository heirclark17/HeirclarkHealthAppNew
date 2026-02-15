/**
 * Cardio Recommendation Types
 *
 * Dynamic cardio recommendation system that calculates daily cardio needs
 * based on calorie intake, strength training, and deficit goals.
 */

/**
 * Cardio recommendation status based on current calorie balance
 */
export type CardioStatus =
  | 'no_goals'        // User hasn't completed goal wizard
  | 'no_data'         // No food logged yet today
  | 'on_track'        // Already hit calorie target (cardioMinutes = 0)
  | 'needs_cardio'    // Needs cardio to hit deficit target
  | 'over_target'     // Ate too much (even max cardio won't help)
  | 'completed';      // User marked cardio as done today

/**
 * Calculation inputs from other contexts
 */
export interface CardioCalculationInputs {
  dailyTarget: number;        // From GoalWizardContext.results.dailyCalories
  deficit: number;            // From GoalWizardContext.results.deficit
  consumed: number;           // From NutritionContext (sum of foodLogs)
  burnedStrength: number;     // From TrainingContext (sum of workout calories)
}

/**
 * Calculation result
 */
export interface CardioRecommendation {
  cardioMinutes: number;      // 0-60 (capped)
  status: CardioStatus;
  netCalories: number;        // consumed - burnedStrength
  targetCalories: number;     // dailyTarget - deficit
  deficitNeeded: number;      // netCalories - targetCalories
  message: string;            // User-facing message
}

/**
 * Persisted state (AsyncStorage)
 */
export interface CardioState {
  lastCalculation: CardioRecommendation | null;
  completedToday: boolean;    // User marked cardio done
  lastCompletedDate: string | null; // ISO date string
}

/**
 * Context value exposed to components
 */
export interface CardioRecommendationContextValue {
  // State
  recommendation: CardioRecommendation | null;
  isLoading: boolean;
  completedToday: boolean;

  // Actions
  markCardioComplete: (minutes: number) => Promise<void>;
  refreshRecommendation: () => Promise<void>;

  // For debugging
  inputs: CardioCalculationInputs | null;
}
