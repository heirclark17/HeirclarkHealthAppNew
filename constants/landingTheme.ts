// Heirclark Landing Page Design System
import { Platform, TextStyle } from 'react-native';

// Liquid Glass Colors - Heirclark Brand
export const liquidGlass = {
  // Backgrounds
  void: '#000000',
  deepSpace: '#050507',
  ambient: '#0a0a0f',
  surface: '#12121a',

  // Glass fills
  glass: {
    clear: 'rgba(255, 255, 255, 0.02)',
    subtle: 'rgba(255, 255, 255, 0.04)',
    standard: 'rgba(255, 255, 255, 0.06)',
    elevated: 'rgba(255, 255, 255, 0.08)',
    solid: 'rgba(255, 255, 255, 0.12)',
  },

  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    standard: 'rgba(255, 255, 255, 0.10)',
    visible: 'rgba(255, 255, 255, 0.15)',
    active: 'rgba(255, 255, 255, 0.25)',
  },

  // Heirclark Accent Colors
  accent: {
    primary: '#4ECDC4',           // Heirclark teal
    secondary: '#96CEB4',         // Soft green
    tertiary: '#45B7D1',          // Ocean blue
    glow: 'rgba(78, 205, 196, 0.35)',
    glowStrong: 'rgba(78, 205, 196, 0.5)',
  },

  // Macro Colors (from app)
  macros: {
    calories: '#E74C3C',
    protein: '#F39C12',
    carbs: '#FFB6C1',
    fat: '#FF69B4',
  },

  // Text
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(255, 255, 255, 0.70)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    disabled: 'rgba(255, 255, 255, 0.25)',
  },

  // Semantic
  success: '#4ECDC4',
  warning: '#F39C12',
  error: '#E74C3C',
} as const;

// Glass blur intensities
export const glassBlur = {
  subtle: 40,
  standard: 60,
  elevated: 80,
  intense: 100,
} as const;

// Spacing scale (8px base)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 128,
} as const;

// Border radius
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

// Typography System
const fontFamily = Platform.select({
  web: '"Urbanist", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  default: 'Urbanist_400Regular',
});

const fontFamilyBold = Platform.select({
  web: '"Urbanist", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  default: 'Urbanist_700Bold',
});

const fontFamilySemiBold = Platform.select({
  web: '"Urbanist", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  default: 'Urbanist_600SemiBold',
});

const fontFamilyMedium = Platform.select({
  web: '"Urbanist", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  default: 'Urbanist_500Medium',
});

export const typography = {
  // Display - Hero headlines
  displayLarge: {
    fontFamily: fontFamilyBold,
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '700',
    letterSpacing: -2,
  } as TextStyle,

  displayMedium: {
    fontFamily: fontFamilyBold,
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '700',
    letterSpacing: -1.5,
  } as TextStyle,

  displaySmall: {
    fontFamily: fontFamilySemiBold,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '600',
    letterSpacing: -1,
  } as TextStyle,

  // Headings
  h1: {
    fontFamily: fontFamilySemiBold,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '600',
    letterSpacing: -0.5,
  } as TextStyle,

  h2: {
    fontFamily: fontFamilySemiBold,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -0.25,
  } as TextStyle,

  h3: {
    fontFamily: fontFamilySemiBold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
  } as TextStyle,

  h4: {
    fontFamily: fontFamilySemiBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  } as TextStyle,

  bodyMedium: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,

  // Labels
  labelLarge: {
    fontFamily: fontFamilyMedium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
  } as TextStyle,

  labelMedium: {
    fontFamily: fontFamilyMedium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.25,
  } as TextStyle,

  labelSmall: {
    fontFamily: fontFamilyMedium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;

// Responsive typography (web)
export const responsiveTypography = {
  displayLarge: {
    mobile: { fontSize: 40, lineHeight: 48 },
    tablet: { fontSize: 56, lineHeight: 64 },
    desktop: { fontSize: 72, lineHeight: 80 },
  },
  displayMedium: {
    mobile: { fontSize: 32, lineHeight: 40 },
    tablet: { fontSize: 44, lineHeight: 52 },
    desktop: { fontSize: 56, lineHeight: 64 },
  },
  displaySmall: {
    mobile: { fontSize: 28, lineHeight: 36 },
    tablet: { fontSize: 36, lineHeight: 44 },
    desktop: { fontSize: 44, lineHeight: 52 },
  },
} as const;
