import { useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { DarkColors, LightColors } from '../constants/Theme';

export type ThemeColors = typeof DarkColors;

export function useTheme() {
  const { settings } = useSettings();

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);

  const isDark = settings.themeMode === 'dark';

  return {
    colors,
    isDark,
    themeMode: settings.themeMode,
  };
}

// Export a function to get colors without hook (for use in StyleSheet.create)
// This should only be used when you can't use the hook
export function getThemeColors(themeMode: 'dark' | 'light'): ThemeColors {
  return themeMode === 'light' ? LightColors : DarkColors;
}
