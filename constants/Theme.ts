// Heirclark Design System - Matching heirclark.com Website
// Source: https://heirclark.com/pages/calorie-counter
import { Platform } from 'react-native';

// Dark Mode Colors (Default)
export const DarkColors = {
  // Backgrounds
  background: '#000000',          // Black background
  backgroundSecondary: '#111111', // Dark gray secondary
  card: '#1a1a1a',                // Slightly lighter card (was #111111)
  cardHover: '#222222',           // Hover state

  // Text
  text: '#ffffff',                // White text
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: '#888888',           // Muted gray

  // Borders - More subtle/lighter
  border: '#1a1a1a',              // Very subtle border
  cardBorder: '#111111',          // Even more subtle card border

  // Buttons (BLACK & WHITE ONLY - No colors)
  primary: '#ffffff',             // WHITE primary buttons
  primaryText: '#000000',         // Black text on white buttons

  // Links & Accents
  accent: '#ffffff',              // White accent
  link: '#ffffff',                // White links

  // Input
  inputBg: '#111111',             // Dark input background

  // Status Colors (BLACK & WHITE ONLY)
  success: '#4ECDC4',             // Teal for success
  error: '#FF6B6B',               // Red for error
  warning: '#FFD93D',             // Yellow for warning

  // Macro Colors - Matching Nutrition Cards
  calories: '#E74C3C',            // Red (nutrition card calories color)
  protein: '#F39C12',             // Orange (nutrition card protein color)
  carbs: '#FFB6C1',               // Light pink (nutrition card carbs color)
  fat: '#FF69B4',                 // Hot pink (nutrition card fat color)
  fatLoss: '#9B59B6',             // Purple (fat loss goal color)

  // Health Metrics Colors
  activeEnergy: '#CC7722',        // Burnt yellow (active energy/calories burned from activity)
  restingEnergy: '#4169E1',       // Royal blue (resting/basal energy)
  stepsColor: '#CC7722',          // Burnt yellow (steps)

  // Over-target color (red for all gauges)
  overTarget: '#FF3B30',          // Apple red for over-target
  overTargetGlow: '#FF6961',      // Lighter red for glow effect

  // Goal achieved color
  goalAchieved: '#34C759',        // iOS green for goal met/exceeded

  // Gauge/Progress
  gaugeFill: '#CC7722',           // Burnt yellow for steps
  gaugeBg: '#333333',             // Dark gauge background

  // iOS 26 Liquid Glass Colors
  glassCard: 'rgba(255, 255, 255, 0.03)',      // Ultra-subtle translucent background
  glassBorder: 'rgba(255, 255, 255, 0.06)',     // Delicate border (0.5px)
  glassSelected: 'rgba(150, 206, 180, 0.15)',   // Teal selected state
  glassSelectedBorder: 'rgba(150, 206, 180, 0.4)', // Teal selected border
  glassTintSuccess: 'rgba(78, 205, 196, 0.1)',  // Success tint
  glassTintError: 'rgba(255, 107, 107, 0.1)',   // Error tint
  glassTintWarning: 'rgba(255, 217, 61, 0.1)',  // Warning tint
};

// Midnight Gold Luxe Theme Colors - for leopard print backgrounds
export const MidnightGoldColors = {
  // Backgrounds
  background: '#0D0D0D',          // Near black
  backgroundSecondary: '#0A0805', // Warm black undertone
  card: '#151510',                // Slightly warm dark card

  // Gold palette
  goldPrimary: '#C9A227',         // Antique gold
  goldLight: '#FFD700',           // Bright gold shimmer
  goldDark: '#8B7320',            // Dark gold shadow
  goldMuted: 'rgba(201, 162, 39, 0.6)', // Muted gold

  // Text - gold accented
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: '#C9A227',           // Gold muted text
  textGold: '#FFD700',            // Gold accent text

  // Borders
  border: 'rgba(201, 162, 39, 0.15)',   // Subtle gold border
  cardBorder: 'rgba(201, 162, 39, 0.20)', // Gold card border

  // Buttons
  primary: '#C9A227',             // Gold primary buttons
  primaryText: '#0D0D0D',         // Dark text on gold buttons

  // iOS 26 Liquid Glass Colors - Gold tinted
  glassCard: 'rgba(201, 162, 39, 0.08)',       // Gold-tinted glass background
  glassBorder: 'rgba(255, 215, 0, 0.20)',      // Gold shimmer border
  glassSelected: 'rgba(201, 162, 39, 0.18)',   // Gold selected state
  glassSelectedBorder: 'rgba(255, 215, 0, 0.40)', // Bright gold selected border

  // Status colors (gold-harmonized)
  success: '#4ECDC4',             // Teal (complements gold)
  error: '#FF6B6B',               // Coral red
  warning: '#FFD93D',             // Golden yellow
};

// Light Mode Colors
export const LightColors = {
  // Backgrounds
  background: '#F5F5F7',          // Apple-style light gray
  backgroundSecondary: '#FFFFFF', // White secondary
  card: '#FFFFFF',                // White cards
  cardHover: '#F0F0F0',           // Light hover state

  // Text
  text: '#1D1D1F',                // Near-black text
  textSecondary: 'rgba(0,0,0,0.6)',
  textMuted: '#86868B',           // Apple gray

  // Borders
  border: '#E5E5E5',              // Light border
  cardBorder: '#E5E5E5',          // Light card border

  // Buttons
  primary: '#1D1D1F',             // Dark primary buttons
  primaryText: '#FFFFFF',         // White text on dark buttons

  // Links & Accents
  accent: '#1D1D1F',              // Dark accent
  link: '#007AFF',                // iOS blue links

  // Input
  inputBg: '#FFFFFF',             // White input background

  // Status Colors
  success: '#34C759',             // iOS green
  error: '#FF3B30',               // iOS red
  warning: '#FF9500',             // iOS orange

  // Macro Colors - Same as dark mode for consistency
  calories: '#E74C3C',            // Red
  protein: '#F39C12',             // Orange
  carbs: '#FFB6C1',               // Light pink
  fat: '#FF69B4',                 // Hot pink
  fatLoss: '#9B59B6',             // Purple

  // Health Metrics Colors
  activeEnergy: '#CC7722',        // Burnt yellow
  restingEnergy: '#4169E1',       // Royal blue
  stepsColor: '#CC7722',          // Burnt yellow

  // Over-target color
  overTarget: '#FF3B30',          // Apple red
  overTargetGlow: '#FF6961',      // Lighter red

  // Goal achieved color
  goalAchieved: '#34C759',        // iOS green for goal met/exceeded

  // Gauge/Progress
  gaugeFill: '#CC7722',           // Burnt yellow for steps
  gaugeBg: '#E5E5E5',             // Light gauge background

  // iOS 26 Liquid Glass Colors
  glassCard: 'rgba(0, 0, 0, 0.02)',        // Ultra-subtle translucent background
  glassBorder: 'rgba(0, 0, 0, 0.04)',       // Delicate border (0.5px)
  glassSelected: 'rgba(150, 206, 180, 0.12)', // Teal selected state
  glassSelectedBorder: 'rgba(150, 206, 180, 0.45)', // Teal selected border
  glassTintSuccess: 'rgba(78, 205, 196, 0.1)',  // Success tint
  glassTintError: 'rgba(255, 107, 107, 0.1)',   // Error tint
  glassTintWarning: 'rgba(255, 217, 61, 0.1)',  // Warning tint
};

// iOS 26 Liquid Glass Style Constants
export const LiquidGlass = {
  // Blur intensity values
  blurIntensity: {
    light: 35,
    dark: 20,
    medium: 25,
    heavy: 40,
    midnightGold: 60, // Higher blur for gold theme (better contrast)
  },

  // Border widths (subtle for liquid glass)
  borderWidth: {
    subtle: 0.5,
    normal: 0.8,
    selected: 1.5,
  },

  // Border radius values
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    circle: 9999,
  },

  // Helper to get liquid glass background color
  getBg: (isDark: boolean, isSelected: boolean = false, theme: 'default' | 'midnightGold' = 'default') => {
    if (theme === 'midnightGold') {
      return isSelected ? MidnightGoldColors.glassSelected : MidnightGoldColors.glassCard;
    }
    if (isSelected) {
      return isDark ? DarkColors.glassSelected : LightColors.glassSelected;
    }
    return isDark ? DarkColors.glassCard : LightColors.glassCard;
  },

  // Helper to get liquid glass border color
  getBorder: (isDark: boolean, isSelected: boolean = false, theme: 'default' | 'midnightGold' = 'default') => {
    if (theme === 'midnightGold') {
      return isSelected ? MidnightGoldColors.glassSelectedBorder : MidnightGoldColors.glassBorder;
    }
    if (isSelected) {
      return isDark ? DarkColors.glassSelectedBorder : LightColors.glassSelectedBorder;
    }
    return isDark ? DarkColors.glassBorder : LightColors.glassBorder;
  },

  // Helper to get blur intensity
  getBlurIntensity: (isDark: boolean, theme: 'default' | 'midnightGold' = 'default') => {
    if (theme === 'midnightGold') return 60;
    return isDark ? 20 : 35;
  },
};

// Default export for backward compatibility (dark mode)
export const Colors = DarkColors;

export const Fonts = {
  // Urbanist for text (letters)
  thin: 'Urbanist_100Thin',
  extraLight: 'Urbanist_200ExtraLight',
  light: 'Urbanist_300Light',
  regular: 'Urbanist_400Regular',
  medium: 'Urbanist_500Medium',
  semiBold: 'Urbanist_600SemiBold',
  bold: 'Urbanist_700Bold',

  // Urbanist for numbers (consistent with text)
  numericThin: 'Urbanist_100Thin',
  numericExtraLight: 'Urbanist_200ExtraLight',
  numericLight: 'Urbanist_300Light',
  numericRegular: 'Urbanist_400Regular',
  numericMedium: 'Urbanist_500Medium',
  numericSemiBold: 'Urbanist_600SemiBold',
  numericBold: 'Urbanist_700Bold',
};

export const Spacing = {
  // iOS 8-Point Grid System
  // Base grid units
  xs: 4,      // 0.5 × 8
  sm: 8,      // 1 × 8
  md: 16,     // 2 × 8
  lg: 24,     // 3 × 8
  xl: 32,     // 4 × 8
  xxl: 40,    // 5 × 8
  xxxl: 48,   // 6 × 8

  // Semantic spacing
  screenMargin: 16,           // iPhone standard
  screenMarginIPad: 24,       // iPad standard
  cardPadding: 16,            // Updated from 20 to match 8pt grid
  cardGap: 16,
  sectionGap: 24,

  // Border radius (iOS standards) - Updated for extra round corners
  radiusXS: 4,
  radiusSM: 8,
  radiusMD: 20,    // Cards, modals - Updated to 20 for extra round
  radiusLG: 24,
  radiusXL: 32,

  // Touch targets
  touchTarget: 44,        // iOS minimum
  touchTargetLarge: 48,

  // Legacy aliases for backward compatibility
  borderRadius: 20,       // Updated to 20 for extra round corners
  sectionMargin: 16,      // Already 8pt compliant
};

export const Typography = {
  // iOS Standard Typography Scale
  // iOS Large Title (screen titles)
  largeTitle: {
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 41,
  },

  // iOS Title 1
  title1: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 34,
  },

  // iOS Title 2
  title2: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    lineHeight: 28,
  },

  // iOS Title 3
  title3: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    lineHeight: 25,
  },

  // iOS Headline
  headline: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    lineHeight: 22,
  },

  // iOS Body (default) - increased from 16 to 17
  body: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    lineHeight: 22,
  },

  // iOS Callout
  callout: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 21,
  },

  // iOS Subhead
  subhead: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 20,
  },

  // iOS Footnote
  footnote: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },

  // iOS Caption 1
  caption1: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },

  // iOS Caption 2 (tab bar labels)
  caption2: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    lineHeight: 13,
  },

  // Legacy aliases for backward compatibility
  // Headers
  h1: {
    fontFamily: Fonts.bold,
    fontSize: 32,
  },
  h2: {
    fontFamily: Fonts.bold,
    fontSize: 28,
  },
  h3: {
    fontFamily: Fonts.semiBold,
    fontSize: 24,
  },
  h4: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
  },
  h5: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
  },
  h6: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },

  // Body text (updated to iOS standard 17pt)
  bodyMedium: {
    fontFamily: Fonts.medium,
    fontSize: 17,
  },
  bodySemiBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
  },

  // Small text
  small: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  smallMedium: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  smallSemiBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  // Caption
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  captionMedium: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  captionSemiBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },

  // Tiny
  tiny: {
    fontFamily: Fonts.regular,
    fontSize: 10,
  },
  tinyMedium: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },
  tinySemiBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
  },
};

export default { Colors, Fonts, Typography, MidnightGoldColors, LiquidGlass };
