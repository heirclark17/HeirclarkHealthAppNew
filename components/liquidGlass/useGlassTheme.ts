/**
 * useGlassTheme Hook
 *
 * Provides theme-aware Liquid Glass styling throughout the app.
 * Automatically adapts colors, materials, and styling based on
 * the current theme mode (light/dark).
 */

import { useMemo } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import {
  LiquidGlassTheme,
  GlassMaterials,
  GlassMaterialType,
  LightModeColors,
  DarkModeColors,
  GlassRadius,
  GlassSpacing,
  GlassShadows,
  GlassTypography,
  GlassTextShadow,
  getGlassBackground,
  getGlassBorder,
  getAdaptiveTextColor,
  getAdaptiveIconColor,
} from '../../theme/liquidGlass';

export interface GlassThemeColors {
  // Original nested structure
  textNested: typeof LightModeColors.text;
  icon: typeof LightModeColors.icon;
  glass: typeof LightModeColors.glass;
  semantic: typeof LightModeColors.semantic;
  background: string;
  backgroundSecondary: string;

  // Backward compatibility - flattened properties for components
  text: string;  // Maps to text.primary
  textMuted: string;
  textSecondary: string;
  textTertiary: string;  // Added missing property
  primary: string;
  success: string;
  error: string;
  warning: string;
  danger: string;  // Added missing property (alias for error)

  // Glass-specific properties
  cardGlass: string;  // Added missing property
  glassBorder: string;  // Added missing property
  surface: string;  // Added missing property
}

export interface GlassTheme {
  isDark: boolean;
  colors: GlassThemeColors;
  materials: typeof GlassMaterials;
  radius: typeof GlassRadius;
  spacing: typeof GlassSpacing;
  shadows: typeof GlassShadows;
  typography: typeof GlassTypography;
  textShadow: typeof GlassTextShadow.light | typeof GlassTextShadow.dark;

  // Helper functions
  getGlassBackground: (material?: GlassMaterialType) => string;
  getGlassBorder: (material?: GlassMaterialType) => string;
  getTextColor: (variant?: 'primary' | 'secondary' | 'tertiary' | 'muted') => string;
  getIconColor: (variant?: 'primary' | 'secondary' | 'tertiary' | 'accent') => string;
}

/**
 * Hook to access Liquid Glass theme values
 *
 * @example
 * ```tsx
 * const { colors, isDark, getGlassBackground } = useGlassTheme();
 *
 * return (
 *   <View style={{ backgroundColor: getGlassBackground('regular') }}>
 *     <Text style={{ color: colors.text.primary }}>Hello</Text>
 *   </View>
 * );
 * ```
 */
export function useGlassTheme(): GlassTheme {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';

  const theme = useMemo<GlassTheme>(() => {
    const colorSystem = isDark ? DarkModeColors : LightModeColors;

    // Build colors with backward compatibility
    const colors: GlassThemeColors = {
      // Original nested structure (renamed to avoid conflict)
      textNested: colorSystem.text,
      icon: colorSystem.icon,
      glass: colorSystem.glass,
      semantic: colorSystem.semantic,
      background: colorSystem.background,
      backgroundSecondary: colorSystem.backgroundSecondary,

      // Flattened properties for backward compatibility
      text: colorSystem.text.primary,  // Most common usage
      textMuted: colorSystem.text.muted,
      textSecondary: colorSystem.text.secondary,
      textTertiary: colorSystem.text.tertiary,  // Added missing property
      primary: colorSystem.icon.accent,
      success: colorSystem.semantic.success,
      error: colorSystem.semantic.error,
      warning: colorSystem.semantic.warning,
      danger: colorSystem.semantic.error,  // Alias for error

      // Glass-specific properties
      cardGlass: colorSystem.glass.card,  // Added missing property
      glassBorder: colorSystem.glass.border,  // Added missing property
      surface: colorSystem.background,  // Added missing property (same as background)
    };

    return {
      isDark,
      colors,
      materials: GlassMaterials,
      radius: GlassRadius,
      spacing: GlassSpacing,
      shadows: GlassShadows,
      typography: GlassTypography,
      textShadow: isDark ? GlassTextShadow.dark : GlassTextShadow.light,

      // Helper functions
      getGlassBackground: (material: GlassMaterialType = 'regular') =>
        getGlassBackground(isDark, material),
      getGlassBorder: (material: GlassMaterialType = 'regular') =>
        getGlassBorder(isDark, material),
      getTextColor: (variant = 'primary') =>
        getAdaptiveTextColor(isDark, variant),
      getIconColor: (variant = 'primary') =>
        getAdaptiveIconColor(isDark, variant),
    };
  }, [isDark]);

  return theme;
}

export default useGlassTheme;
