/**
 * Animation Constants
 *
 * Shared animation configuration for Reanimated across the app.
 * Ensures consistent spring physics and timing throughout the UI.
 */

/**
 * GLASS_SPRING - iOS-style smooth spring animation
 * Used for: Glass card interactions, button presses, tab transitions
 */
export const GLASS_SPRING = {
  damping: 18,
  stiffness: 380,
  mass: 0.8,
};

/**
 * SMOOTH_SPRING - Gentle spring animation
 * Used for: Subtle UI transitions, modal appearances
 */
export const SMOOTH_SPRING = {
  damping: 20,
  stiffness: 300,
  mass: 1,
};

/**
 * BOUNCY_SPRING - Playful bounce effect
 * Used for: Success animations, celebration moments
 */
export const BOUNCY_SPRING = {
  damping: 12,
  stiffness: 400,
  mass: 0.5,
};

/**
 * TIMING_CONFIG - Standard timing configuration
 * Used for: Simple fade in/out, linear movements
 */
export const TIMING_CONFIG = {
  duration: 200,
};

/**
 * FAST_TIMING - Quick transitions
 * Used for: Micro-interactions, immediate feedback
 */
export const FAST_TIMING = {
  duration: 150,
};

/**
 * SLOW_TIMING - Deliberate transitions
 * Used for: Page transitions, important state changes
 */
export const SLOW_TIMING = {
  duration: 300,
};
