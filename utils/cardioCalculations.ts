/**
 * Cardio Calculation Utilities
 *
 * Pure calculation functions for dynamic cardio recommendations.
 * No side effects - all functions are testable and deterministic.
 */

import {
  CardioCalculationInputs,
  CardioRecommendation,
  CardioStatus
} from '../types/cardio';

/**
 * Calculate cardio recommendation based on daily calorie balance
 *
 * Formula:
 * 1. netCalories = consumed - burnedStrength
 * 2. targetCalories = dailyTarget - deficit
 * 3. deficitNeeded = netCalories - targetCalories
 * 4. cardioMinutes = Math.max(0, Math.ceil(deficitNeeded / 8))
 * 5. Cap at 60 minutes
 *
 * @param inputs - Calculation inputs from contexts
 * @returns Cardio recommendation with minutes, status, and message
 */
export function calculateCardioRecommendation(
  inputs: CardioCalculationInputs
): CardioRecommendation {
  const { dailyTarget, deficit, consumed, burnedStrength } = inputs;

  // Step 1: Net calories after strength training
  const netCalories = consumed - burnedStrength;

  // Step 2: Target calories (daily goal minus deficit)
  const targetCalories = dailyTarget - deficit;

  // Step 3: How many calories over target?
  const deficitNeeded = netCalories - targetCalories;

  // Step 4: Convert to cardio minutes (8 cal/min conservative estimate)
  const rawCardioMinutes = Math.max(0, Math.ceil(deficitNeeded / 8));
  const cardioMinutes = Math.min(60, rawCardioMinutes); // Cap at 60

  // Step 5: Determine status and message
  let status: CardioStatus;
  let message: string;

  if (deficitNeeded <= 0) {
    // Already on track or under target
    status = 'on_track';
    message = "You're on track! No cardio needed today.";
  } else if (cardioMinutes >= 60 && deficitNeeded > 480) {
    // Even max cardio won't fix this (60 min * 8 cal/min = 480 cal)
    status = 'over_target';
    message = `You're ${Math.abs(deficitNeeded)} calories over target. Focus on nutrition tomorrow.`;
  } else {
    status = 'needs_cardio';
    message = `Complete ${cardioMinutes} minutes of cardio to hit your deficit goal.`;
  }

  return {
    cardioMinutes,
    status,
    netCalories,
    targetCalories,
    deficitNeeded,
    message
  };
}

/**
 * Validate inputs before calculation
 *
 * Ensures all required fields are present and valid:
 * - All fields are numbers
 * - dailyTarget > 0 (can't have 0 calorie goal)
 * - deficit >= 0 (negative deficit doesn't make sense)
 * - consumed >= 0 (can't eat negative calories)
 * - burnedStrength >= 0 (can't burn negative calories)
 *
 * @param inputs - Partial inputs to validate
 * @returns True if inputs are valid, false otherwise
 */
export function validateCardioInputs(
  inputs: Partial<CardioCalculationInputs>
): inputs is CardioCalculationInputs {
  return (
    typeof inputs.dailyTarget === 'number' &&
    typeof inputs.deficit === 'number' &&
    typeof inputs.consumed === 'number' &&
    typeof inputs.burnedStrength === 'number' &&
    inputs.dailyTarget > 0 &&
    inputs.deficit >= 0 &&
    inputs.consumed >= 0 &&
    inputs.burnedStrength >= 0
  );
}

/**
 * Check if date string is today
 *
 * @param dateString - ISO date string (YYYY-MM-DD) or null
 * @returns True if date is today, false otherwise
 */
export function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 *
 * @returns Today's date in ISO format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
