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

  // Status Colors
  success: '#4ECDC4',             // Teal for success (primary)
  successStrong: '#4ADE80',       // Bright green for strong success
  successMuted: '#96CEB4',        // Muted green for subtle success
  error: '#FF6B6B',               // Red for error (primary)
  errorStrong: '#FF3B30',         // Apple red for critical errors
  warning: '#FFD93D',             // Yellow for warning
  warningOrange: '#FB923C',       // Orange warning variant

  // Accent Colors
  accentPurple: '#7B61FF',        // Purple accent
  accentCyan: '#00D9F5',          // Cyan accent
  accentGold: '#FFD700',          // Gold highlight

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

// Sand Theme Colors - Light Mode (Warm Beige/Cream)
export const SandLightColors = {
  // Backgrounds
  background: '#FAF6F1',          // Light warm cream
  backgroundSecondary: '#F5EDE4', // Tan/parchment
  card: '#F5EDE4',                // Tan/parchment for cards
  cardHover: '#EDE5DB',           // Deeper sand tone

  // Text
  text: '#1A1A1A',                // Near-black text
  textSecondary: '#4A4A4A',       // Dark gray secondary
  textMuted: '#7A7067',           // Warm muted gray

  // Borders
  border: '#DDD5CA',              // Light sand border
  cardBorder: '#E5DDD2',          // Subtle card border

  // Buttons
  primary: '#2C2620',             // Deep warm brown buttons
  primaryText: '#FAF6F1',         // Cream text on dark buttons

  // Links & Accents
  accent: '#2C2620',              // Dark warm accent
  link: '#8B7355',                // Warm brown links

  // Input
  inputBg: '#FFFFFF',             // White input background

  // Status Colors
  success: '#6B8E6B',             // Muted sage green
  successStrong: '#4ADE80',       // Bright green
  successMuted: '#96CEB4',        // Muted green
  error: '#C45C5C',               // Muted warm red
  errorStrong: '#FF3B30',         // Apple red
  warning: '#D4A84B',             // Warm gold warning
  warningOrange: '#CD8B4A',       // Warm orange

  // Accent Colors
  accentPurple: '#8B7399',        // Muted purple
  accentCyan: '#5B9E9E',          // Muted teal
  accentGold: '#C9A227',          // Antique gold

  // Macro Colors
  calories: '#C45C5C',            // Warm red
  protein: '#CD8B4A',             // Warm orange
  carbs: '#D4A4B5',               // Dusty pink
  fat: '#C47BA0',                 // Muted pink
  fatLoss: '#8B7399',             // Muted purple

  // Health Metrics Colors
  activeEnergy: '#B5894D',        // Warm amber
  restingEnergy: '#5B7BAE',       // Muted blue
  stepsColor: '#B5894D',          // Warm amber

  // Over-target color
  overTarget: '#C45C5C',          // Warm red
  overTargetGlow: '#D4807E',      // Lighter warm red

  // Goal achieved color
  goalAchieved: '#6B8E6B',        // Sage green

  // Gauge/Progress
  gaugeFill: '#B5894D',           // Warm amber
  gaugeBg: '#E5DDD2',             // Light sand gauge background

  // iOS 26 Liquid Glass Colors - Sand tinted
  glassCard: 'rgba(250, 246, 241, 0.6)',         // Warm cream glass
  glassBorder: 'rgba(221, 213, 202, 0.5)',       // Sand border
  glassSelected: 'rgba(139, 115, 85, 0.15)',     // Warm selected state
  glassSelectedBorder: 'rgba(139, 115, 85, 0.35)', // Warm selected border
  glassTintSuccess: 'rgba(107, 142, 107, 0.15)', // Sage success tint
  glassTintError: 'rgba(196, 92, 92, 0.15)',     // Warm error tint
  glassTintWarning: 'rgba(212, 168, 75, 0.15)',  // Gold warning tint
};

// Sand Theme Colors - Dark Mode (Deep Warm Brown)
export const SandDarkColors = {
  // Backgrounds
  background: '#2C2620',          // Deep warm brown
  backgroundSecondary: '#3D352D', // Muted cocoa
  card: '#3D352D',                // Muted cocoa for cards
  cardHover: '#4E443A',           // Warm charcoal

  // Text
  text: '#FAF6F1',                // Cream text
  textSecondary: '#C9C0B5',       // Muted sand secondary
  textMuted: '#9A9088',           // Warm gray muted

  // Borders
  border: '#5A4F44',              // Warm dark border
  cardBorder: '#4E443A',          // Subtle card border

  // Buttons
  primary: '#FAF6F1',             // Cream buttons
  primaryText: '#2C2620',         // Deep brown text on cream

  // Links & Accents
  accent: '#FAF6F1',              // Cream accent
  link: '#C9A078',                // Warm tan links

  // Input
  inputBg: '#3D352D',             // Cocoa input background

  // Status Colors
  success: '#7CAF7C',             // Muted green
  successStrong: '#4ADE80',       // Bright green
  successMuted: '#96CEB4',        // Muted green
  error: '#E07A7A',               // Warm coral red
  errorStrong: '#FF3B30',         // Apple red
  warning: '#E5BC5A',             // Warm gold
  warningOrange: '#E0A05A',       // Warm orange

  // Accent Colors
  accentPurple: '#A08BB0',        // Muted purple
  accentCyan: '#7AB5B5',          // Muted teal
  accentGold: '#E5C55A',          // Bright gold

  // Macro Colors
  calories: '#E07A7A',            // Warm coral
  protein: '#E0A05A',             // Warm orange
  carbs: '#E0B5C5',               // Dusty pink
  fat: '#D08AAF',                 // Muted pink
  fatLoss: '#A08BB0',             // Muted purple

  // Health Metrics Colors
  activeEnergy: '#D4A05A',        // Warm amber
  restingEnergy: '#7A9BC5',       // Muted blue
  stepsColor: '#D4A05A',          // Warm amber

  // Over-target color
  overTarget: '#E07A7A',          // Warm coral
  overTargetGlow: '#EFA5A0',      // Lighter coral

  // Goal achieved color
  goalAchieved: '#7CAF7C',        // Muted green

  // Gauge/Progress
  gaugeFill: '#D4A05A',           // Warm amber
  gaugeBg: '#4E443A',             // Warm charcoal gauge background

  // iOS 26 Liquid Glass Colors - Sand dark tinted
  glassCard: 'rgba(44, 38, 32, 0.7)',            // Deep warm glass
  glassBorder: 'rgba(90, 79, 68, 0.4)',          // Warm border
  glassSelected: 'rgba(201, 160, 120, 0.18)',    // Warm tan selected
  glassSelectedBorder: 'rgba(201, 160, 120, 0.35)', // Warm tan selected border
  glassTintSuccess: 'rgba(124, 175, 124, 0.15)', // Green success tint
  glassTintError: 'rgba(224, 122, 122, 0.15)',   // Coral error tint
  glassTintWarning: 'rgba(229, 188, 90, 0.15)',  // Gold warning tint
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
  success: '#34C759',             // iOS green (primary)
  successStrong: '#4ADE80',       // Bright green for strong success
  successMuted: '#96CEB4',        // Muted green for subtle success
  error: '#FF3B30',               // iOS red (primary)
  errorStrong: '#FF3B30',         // Same as primary for consistency
  warning: '#FF9500',             // iOS orange
  warningOrange: '#FB923C',       // Orange warning variant

  // Accent Colors
  accentPurple: '#7B61FF',        // Purple accent
  accentCyan: '#00D9F5',          // Cyan accent
  accentGold: '#FFD700',          // Gold highlight

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
  getBg: (isDark: boolean, isSelected: boolean = false, theme: 'default' | 'midnightGold' | 'sand' = 'default') => {
    if (theme === 'midnightGold') {
      return isSelected ? MidnightGoldColors.glassSelected : MidnightGoldColors.glassCard;
    }
    if (theme === 'sand') {
      const sandColors = isDark ? SandDarkColors : SandLightColors;
      return isSelected ? sandColors.glassSelected : sandColors.glassCard;
    }
    if (isSelected) {
      return isDark ? DarkColors.glassSelected : LightColors.glassSelected;
    }
    return isDark ? DarkColors.glassCard : LightColors.glassCard;
  },

  // Helper to get liquid glass border color
  getBorder: (isDark: boolean, isSelected: boolean = false, theme: 'default' | 'midnightGold' | 'sand' = 'default') => {
    if (theme === 'midnightGold') {
      return isSelected ? MidnightGoldColors.glassSelectedBorder : MidnightGoldColors.glassBorder;
    }
    if (theme === 'sand') {
      const sandColors = isDark ? SandDarkColors : SandLightColors;
      return isSelected ? sandColors.glassSelectedBorder : sandColors.glassBorder;
    }
    if (isSelected) {
      return isDark ? DarkColors.glassSelectedBorder : LightColors.glassSelectedBorder;
    }
    return isDark ? DarkColors.glassBorder : LightColors.glassBorder;
  },

  // Helper to get blur intensity
  getBlurIntensity: (isDark: boolean, theme: 'default' | 'midnightGold' | 'sand' = 'default') => {
    if (theme === 'midnightGold') return 60;
    if (theme === 'sand') return isDark ? 25 : 40;
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

  // SF Pro Rounded for numbers (rounded appearance like v-fonts.com)
  numericUltralight: 'SFProRounded-Ultralight',
  numericThin: 'SFProRounded-Thin',
  numericLight: 'SFProRounded-Light',
  numericRegular: 'SFProRounded-Regular',
  numericMedium: 'SFProRounded-Medium',
  numericSemiBold: 'SFProRounded-Semibold',
  numericBold: 'SFProRounded-Bold',
  numericHeavy: 'SFProRounded-Heavy',
  numericBlack: 'SFProRounded-Black',
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

// Wearable Device Brand Colors
export const WearableBrands = {
  apple_health: '#FF3B30',   // Apple Health red
  fitbit: '#00B0B9',         // Fitbit teal
  garmin: '#007CC3',         // Garmin blue
  oura: '#8B5CF6',           // Oura purple
  strava: '#FC4C02',         // Strava orange
  whoop: '#000000',          // Whoop black
  withings: '#00A9CE',       // Withings cyan
};

export default { Colors, Fonts, Typography, MidnightGoldColors, SandLightColors, SandDarkColors, LiquidGlass, WearableBrands };
