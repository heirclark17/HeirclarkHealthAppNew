/**
 * TimeSlotGrid - Hourly grid lines and labels for timeline
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

export function TimeSlotGrid() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  // Generate 24 hours (6 AM to 6 AM next day)
  const hours = Array.from({ length: 24 }, (_, i) => (i + 6) % 24);

  return (
    <View style={styles.container}>
      {hours.map((hour, index) => {
        const displayHour = hour % 12 || 12;
        const period = hour < 12 ? 'AM' : 'PM';
        const yPosition = index * 60; // 60px per hour

        return (
          <View
            key={hour}
            style={[styles.gridLine, { top: yPosition }]}
          >
            <Text style={[styles.timeLabel, { color: themeColors.textSecondary }]}>
              {displayHour} {period}
            </Text>
            <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1440, // 24 hours * 60px
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: Fonts.numericRegular,
    width: 50,
    textAlign: 'right',
  },
  line: {
    flex: 1,
    height: 1,
  },
});
