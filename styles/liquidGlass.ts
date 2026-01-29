// iOS 26 Liquid Glass Design System
// Shared styles for consistent glass morphism across the app

import { StyleSheet, Platform } from 'react-native';

// iOS 26 Liquid Glass Color Constants
export const LIQUID_GLASS_COLORS = {
  // Light mode
  light: {
    cardBg: 'rgba(0, 0, 0, 0.02)',
    cardBorder: 'rgba(0, 0, 0, 0.04)',
    selectedBg: 'rgba(78, 205, 196, 0.12)',
    selectedBorder: 'rgba(78, 205, 196, 0.3)',
  },
  // Dark mode
  dark: {
    cardBg: 'rgba(255, 255, 255, 0.03)',
    cardBorder: 'rgba(255, 255, 255, 0.06)',
    selectedBg: 'rgba(78, 205, 196, 0.15)',
    selectedBorder: 'rgba(78, 205, 196, 0.4)',
  },
};

// Blur intensity values
export const BLUR_INTENSITY = {
  light: 35,
  dark: 20,
  medium: 25,
  heavy: 40,
};

// Border radius values
export const BORDER_RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  circle: 9999,
};

// Border width - subtle for liquid glass
export const BORDER_WIDTH = {
  subtle: 0.5,
  normal: 1,
  selected: 1.5,
};

export const liquidGlassStyles = StyleSheet.create({
  // ============================================
  // BASE GLASS CARD
  // ============================================
  glassCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH.subtle,
  },
  glassCardInner: {
    padding: 16,
  },

  // ============================================
  // SECTION CONTAINERS
  // ============================================
  glassSection: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH.subtle,
    marginBottom: 24,
  },
  glassSectionInner: {
    padding: 16,
  },

  // ============================================
  // SMALL CARDS (Activity Level, Diet Style, etc.)
  // ============================================
  smallCard: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH.subtle,
    padding: 14,
    marginVertical: 6,
  },
  smallCardSelected: {
    borderWidth: BORDER_WIDTH.normal,
  },

  // ============================================
  // METRIC CARDS (BMR, TDEE, BMI, etc.)
  // ============================================
  metricCard: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH.subtle,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },

  // ============================================
  // CIRCULAR SELECTORS (Meals per day, Workouts)
  // ============================================
  circleSelector: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: BORDER_WIDTH.normal,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circleSelectorSelected: {
    borderWidth: BORDER_WIDTH.selected,
  },

  // ============================================
  // PRESET CARDS (Intermittent Fasting)
  // ============================================
  presetCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: BORDER_WIDTH.subtle,
    overflow: 'hidden',
  },
  presetCardSelected: {
    borderWidth: BORDER_WIDTH.normal,
  },

  // ============================================
  // TOGGLE/CHIP BUTTONS (Allergies, Restrictions)
  // ============================================
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: BORDER_WIDTH.subtle,
    overflow: 'hidden',
  },
  toggleChipSelected: {
    borderWidth: BORDER_WIDTH.normal,
  },

  // ============================================
  // INPUT FIELDS
  // ============================================
  glassInput: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: BORDER_WIDTH.normal,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    overflow: 'hidden',
  },
  glassInputFocused: {
    borderWidth: BORDER_WIDTH.selected,
  },

  // ============================================
  // BUTTONS - SECONDARY (Back, Adjust)
  // ============================================
  buttonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: BORDER_WIDTH.subtle,
    overflow: 'hidden',
  },

  // ============================================
  // BUTTONS - PRIMARY (Continue, Confirm)
  // ============================================
  buttonPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },

  // ============================================
  // SUMMARY CARDS (Large cards for plan preview)
  // ============================================
  summaryCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH.subtle,
    padding: 20,
    marginBottom: 16,
  },

  // ============================================
  // TARGET CARDS (Daily macros)
  // ============================================
  targetCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: BORDER_WIDTH.subtle,
    padding: 16,
    marginHorizontal: 4,
    overflow: 'hidden',
  },

  // ============================================
  // WORKOUT/TRAINING CARDS
  // ============================================
  workoutCard: {
    borderRadius: BORDER_RADIUS.lg - 2,
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH.subtle,
    padding: 16,
    marginBottom: 16,
  },
});

// Helper function to get glass background color
export const getGlassBg = (isDark: boolean, isSelected: boolean = false) => {
  if (isSelected) {
    return isDark ? LIQUID_GLASS_COLORS.dark.selectedBg : LIQUID_GLASS_COLORS.light.selectedBg;
  }
  return isDark ? LIQUID_GLASS_COLORS.dark.cardBg : LIQUID_GLASS_COLORS.light.cardBg;
};

// Helper function to get glass border color
export const getGlassBorder = (isDark: boolean, isSelected: boolean = false) => {
  if (isSelected) {
    return isDark ? LIQUID_GLASS_COLORS.dark.selectedBorder : LIQUID_GLASS_COLORS.light.selectedBorder;
  }
  return isDark ? LIQUID_GLASS_COLORS.dark.cardBorder : LIQUID_GLASS_COLORS.light.cardBorder;
};

// Helper function to get blur intensity
export const getBlurIntensity = (isDark: boolean) => {
  return isDark ? BLUR_INTENSITY.dark : BLUR_INTENSITY.light;
};

export default liquidGlassStyles;
