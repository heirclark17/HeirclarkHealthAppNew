/**
 * CalendarSyncButton - Manual calendar sync trigger
 * Frosted liquid glass styling with light/dark mode support
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CalendarClock } from 'lucide-react-native';
import { DarkColors, LightColors, Fonts } from '../../../constants/Theme';
import { useSettings } from '../../../contexts/SettingsContext';

interface Props {
  onPress: () => void;
  loading: boolean;
}

export function CalendarSyncButton({ onPress, loading }: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 0.5,
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={themeColors.text} />
      ) : (
        <CalendarClock size={20} color={themeColors.text} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
