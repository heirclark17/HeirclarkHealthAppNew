/**
 * iOS 26 Liquid Glass Design System
 *
 * Based on Apple's Liquid Glass specifications from WWDC 2025.
 * This system provides consistent glass materials, adaptive colors,
 * and semantic styling across the entire app.
 *
 * References:
 * - Apple Newsroom: iOS 26 Design Announcement
 * - @callstack/liquid-glass implementation
 * - expo-glass-effect documentation
 */

import { Platform, StyleSheet } from 'react-native';

// =============================================================================
// GLASS MATERIAL VARIANTS
// =============================================================================

/**
 * Glass material specifications matching iOS 26 UIVisualEffectView materials
 */
export const GlassMaterials = {
  // Ultra-thin: Maximum transparency, minimal blur - for subtle overlays
  ultraThin: {
    blurIntensity: 20,
    backgroundOpacity: 0.15,
    borderOpacity: 0.08,
    effect: 'clear' as const,
  },

  // Thin: Light blur with high transparency - for floating elements
  thin: {
    blurIntensity: 40,
    backgroundOpacity: 0.25,
    borderOpacity: 0.10,
    effect: 'clear' as const,
  },

  // Regular: Standard glass effect - for cards and containers
  regular: {
    blurIntensity: 60,
    backgroundOpacity: 0.35,
    borderOpacity: 0.12,
    effect: 'regular' as const,
  },

  // Thick: Heavy blur with more opacity - for navigation bars, modals
  thick: {
    blurIntensity: 80,
    backgroundOpacity: 0.50,
    borderOpacity: 0.15,
    effect: 'regular' as const,
  },

  // Chrome: Metallic glass effect - for premium elements
  chrome: {
    blurIntensity: 70,
    backgroundOpacity: 0.40,
    borderOpacity: 0.20,
    effect: 'regular' as const,
  },
} as const;

export type GlassMaterialType = keyof typeof GlassMaterials;

// =============================================================================
// ADAPTIVE COLOR SYSTEM
// =============================================================================

/**
 * Light mode colors - optimized for visibility on light glass surfaces
 */
export const LightModeColors = {
  // Text colors
  text: {
    primary: 'rgba(0, 0, 0, 0.85)',
    secondary: 'rgba(0, 0, 0, 0.65)',
    tertiary: 'rgba(0, 0, 0, 0.45)',
    muted: 'rgba(0, 0, 0, 0.35)',
    inverse: 'rgba(255, 255, 255, 0.95)',
  },

  // Icon colors
  icon: {
    primary: 'rgba(0, 0, 0, 0.75)',
    secondary: 'rgba(0, 0, 0, 0.55)',
    tertiary: 'rgba(0, 0, 0, 0.40)',
    accent: '#007AFF',
  },

  // Glass background colors
  glass: {
    background: 'rgba(255, 255, 255, 0.70)',
    backgroundElevated: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(0, 0, 0, 0.08)',
    borderElevated: 'rgba(0, 0, 0, 0.12)',
    shadow: 'rgba(0, 0, 0, 0.15)',
  },

  // Semantic colors
  semantic: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    calories: '#FF6B6B',
    protein: '#FFB347',
    carbs: '#87CEEB',
    fat: '#DDA0DD',
  },

  // Background
  background: '#F5F5F7',
  backgroundSecondary: '#FFFFFF',
};

/**
 * Dark mode colors - optimized for visibility on dark glass surfaces
 */
export const DarkModeColors = {
  // Text colors
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(255, 255, 255, 0.70)',
    tertiary: 'rgba(255, 255, 255, 0.50)',
    muted: 'rgba(255, 255, 255, 0.35)',
    inverse: 'rgba(0, 0, 0, 0.90)',
  },

  // Icon colors
  icon: {
    primary: 'rgba(255, 255, 255, 0.85)',
    secondary: 'rgba(255, 255, 255, 0.60)',
    tertiary: 'rgba(255, 255, 255, 0.40)',
    accent: '#0A84FF',
  },

  // Glass background colors
  glass: {
    background: 'rgba(30, 30, 30, 0.70)',
    backgroundElevated: 'rgba(45, 45, 45, 0.85)',
    border: 'rgba(255, 255, 255, 0.10)',
    borderElevated: 'rgba(255, 255, 255, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.40)',
  },

  // Semantic colors (slightly adjusted for dark mode visibility)
  semantic: {
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
    calories: '#FF6B6B',
    protein: '#FFB347',
    carbs: '#87CEEB',
    fat: '#DDA0DD',
  },

  // Background
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
};

// =============================================================================
// SHADOW SYSTEM
// =============================================================================

/**
 * Shadow specifications for glass elements
 */
export const GlassShadows = {
  // Subtle shadow for flat glass elements
  subtle: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    },
  }),

  // Standard shadow for cards
  standard: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
    },
  }),

  // Elevated shadow for floating elements
  elevated: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.20,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {
      boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.20)',
    },
  }),

  // Deep shadow for modals and sheets
  deep: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.30,
      shadowRadius: 32,
    },
    android: {
      elevation: 16,
    },
    default: {
      boxShadow: '0px 16px 32px rgba(0, 0, 0, 0.30)',
    },
  }),

  // Inner glow for light mode glass (specular highlight)
  innerGlow: {
    light: 'inset 0px 1px 0px rgba(255, 255, 255, 0.25)',
    dark: 'inset 0px 1px 0px rgba(255, 255, 255, 0.08)',
  },
};

export type GlassShadowType = keyof typeof GlassShadows;

// =============================================================================
// BORDER SYSTEM
// =============================================================================

/**
 * Border specifications for glass elements
 */
export const GlassBorders = {
  // Subtle border for cards
  subtle: {
    width: 0.5,
    style: 'solid' as const,
  },

  // Standard border for interactive elements
  standard: {
    width: 1,
    style: 'solid' as const,
  },

  // Thick border for focused/active states
  thick: {
    width: 1.5,
    style: 'solid' as const,
  },
};

// =============================================================================
// CORNER RADIUS SYSTEM
// =============================================================================

/**
 * Corner radius values following iOS 26 design language
 */
export const GlassRadius = {
  // Small - for buttons, badges, pills
  small: 10,

  // Medium - for small cards, input fields
  medium: 14,

  // Large - for standard cards, containers
  large: 20,

  // XLarge - for modal sheets, large containers
  xlarge: 24,

  // XXLarge - for full-screen modals
  xxlarge: 32,

  // Full - circular elements
  full: 9999,
};

export type GlassRadiusType = keyof typeof GlassRadius;

// =============================================================================
// SPACING SYSTEM
// =============================================================================

/**
 * Spacing values for consistent layout
 */
export const GlassSpacing = {
  // Extra small - 4px
  xs: 4,

  // Small - 8px
  sm: 8,

  // Medium - 12px
  md: 12,

  // Large - 16px
  lg: 16,

  // Extra large - 20px
  xl: 20,

  // 2X large - 24px
  xxl: 24,

  // 3X large - 32px
  xxxl: 32,

  // Card padding
  cardPadding: 16,

  // Container horizontal padding
  containerPadding: 16,
};

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================

/**
 * Typography for glass surfaces with text shadows for legibility
 */
export const GlassTypography = {
  // Large title
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },

  // Title 1
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },

  // Title 2
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },

  // Title 3
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },

  // Headline
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },

  // Body
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },

  // Callout
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },

  // Subheadline
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },

  // Footnote
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },

  // Caption 1
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },

  // Caption 2
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
};

/**
 * Text shadow for glass surfaces to ensure legibility
 */
export const GlassTextShadow = {
  light: {
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  dark: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
};

// =============================================================================
// ANIMATION TIMINGS
// =============================================================================

/**
 * Animation timing values for glass interactions
 */
export const GlassAnimations = {
  // Fast - for micro-interactions (press states)
  fast: 150,

  // Normal - for standard transitions
  normal: 250,

  // Slow - for elaborate transitions
  slow: 400,

  // Spring configs for react-native-reanimated
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Bounce spring for playful interactions
  bounce: {
    damping: 12,
    stiffness: 180,
    mass: 0.8,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get colors based on theme mode
 */
export function getThemeColors(isDark: boolean) {
  return isDark ? DarkModeColors : LightModeColors;
}

/**
 * Get glass background color with proper opacity
 */
export function getGlassBackground(isDark: boolean, material: GlassMaterialType = 'regular') {
  const colors = getThemeColors(isDark);
  const materialSpec = GlassMaterials[material];

  if (isDark) {
    return `rgba(30, 30, 30, ${materialSpec.backgroundOpacity})`;
  }
  return `rgba(255, 255, 255, ${materialSpec.backgroundOpacity + 0.2})`;
}

/**
 * Get glass border color
 */
export function getGlassBorder(isDark: boolean, material: GlassMaterialType = 'regular') {
  const materialSpec = GlassMaterials[material];

  if (isDark) {
    return `rgba(255, 255, 255, ${materialSpec.borderOpacity})`;
  }
  return `rgba(0, 0, 0, ${materialSpec.borderOpacity})`;
}

/**
 * Get adaptive text color based on background luminance
 */
export function getAdaptiveTextColor(
  isDark: boolean,
  variant: 'primary' | 'secondary' | 'tertiary' | 'muted' = 'primary'
) {
  const colors = getThemeColors(isDark);
  return colors.text[variant];
}

/**
 * Get adaptive icon color
 */
export function getAdaptiveIconColor(
  isDark: boolean,
  variant: 'primary' | 'secondary' | 'tertiary' | 'accent' = 'primary'
) {
  const colors = getThemeColors(isDark);
  return colors.icon[variant];
}

/**
 * Calculate contrast ratio between two colors
 * Used for accessibility compliance (WCAG 2.1)
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  // This is a simplified calculation - in production, use a proper color library
  // Returns approximate contrast ratio
  return 4.5; // Placeholder - should implement proper luminance calculation
}

// =============================================================================
// PRESET STYLES
// =============================================================================

/**
 * Pre-built glass card styles
 */
export const GlassCardStyles = StyleSheet.create({
  // Standard card
  card: {
    borderRadius: GlassRadius.large,
    padding: GlassSpacing.cardPadding,
    ...GlassShadows.standard,
  },

  // Elevated card (floating)
  elevated: {
    borderRadius: GlassRadius.xlarge,
    padding: GlassSpacing.cardPadding,
    ...GlassShadows.elevated,
  },

  // Compact card
  compact: {
    borderRadius: GlassRadius.medium,
    padding: GlassSpacing.md,
    ...GlassShadows.subtle,
  },

  // Pill/badge style
  pill: {
    borderRadius: GlassRadius.full,
    paddingHorizontal: GlassSpacing.md,
    paddingVertical: GlassSpacing.xs,
  },
});

/**
 * Pre-built glass button styles
 */
export const GlassButtonStyles = StyleSheet.create({
  // Primary button
  primary: {
    borderRadius: GlassRadius.medium,
    paddingVertical: GlassSpacing.md,
    paddingHorizontal: GlassSpacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Secondary button
  secondary: {
    borderRadius: GlassRadius.medium,
    paddingVertical: GlassSpacing.sm,
    paddingHorizontal: GlassSpacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: GlassBorders.standard.width,
  },

  // Icon button
  icon: {
    borderRadius: GlassRadius.full,
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Small icon button
  iconSmall: {
    borderRadius: GlassRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});

/**
 * Pre-built navigation styles
 */
export const GlassNavStyles = StyleSheet.create({
  // Tab bar
  tabBar: {
    borderRadius: GlassRadius.xlarge,
    paddingVertical: GlassSpacing.sm,
    paddingHorizontal: GlassSpacing.md,
    ...GlassShadows.elevated,
  },

  // Navigation header
  header: {
    paddingHorizontal: GlassSpacing.containerPadding,
    paddingVertical: GlassSpacing.md,
    ...GlassShadows.subtle,
  },
});

// =============================================================================
// EXPORT DEFAULT THEME
// =============================================================================

export const LiquidGlassTheme = {
  materials: GlassMaterials,
  colors: {
    light: LightModeColors,
    dark: DarkModeColors,
  },
  shadows: GlassShadows,
  borders: GlassBorders,
  radius: GlassRadius,
  spacing: GlassSpacing,
  typography: GlassTypography,
  textShadow: GlassTextShadow,
  animations: GlassAnimations,
  cardStyles: GlassCardStyles,
  buttonStyles: GlassButtonStyles,
  navStyles: GlassNavStyles,
  helpers: {
    getThemeColors,
    getGlassBackground,
    getGlassBorder,
    getAdaptiveTextColor,
    getAdaptiveIconColor,
    calculateContrastRatio,
  },
};

export default LiquidGlassTheme;
