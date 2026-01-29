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
  text: typeof LightModeColors.text;
  icon: typeof LightModeColors.icon;
  glass: typeof LightModeColors.glass;
  semantic: typeof LightModeColors.semantic;
  background: string;
  backgroundSecondary: string;
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
    const colors = isDark ? DarkModeColors : LightModeColors;

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
