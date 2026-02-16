/**
 * TimeSlotGrid - Hourly grid lines and labels for timeline
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface TimeSlotGridProps {
  wakeTime?: string; // Format: "HH:MM"
}

export function TimeSlotGrid({ wakeTime = '06:00' }: TimeSlotGridProps) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  // Parse wake time to get starting hour
  const wakeHour = parseInt(wakeTime.split(':')[0], 10);

  // Generate 24 hours starting from wake time
  const hours = Array.from({ length: 24 }, (_, i) => (wakeHour + i) % 24);

  return (
    <View style={styles.container}>
      {hours.map((hour, index) => {
        const displayHour = hour % 12 || 12;
        const period = hour < 12 ? 'AM' : 'PM';
        const yPosition = index * 60; // 60px per hour

        return (
          <View
            key={`hour-${index}`}
            style={[styles.gridLine, { top: yPosition }]}
          >
            {/* Horizontal separator line - at exact top where events start */}
            <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
            {/* Time label - absolutely positioned to not affect line placement */}
            <Text style={[styles.timeLabel, { color: themeColors.textSecondary }]}>
              {displayHour} {period}
            </Text>
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
    height: 1, // Exact height of separator line
  },
  timeLabel: {
    position: 'absolute',
    fontSize: 12,
    fontFamily: Fonts.numericRegular,
    width: 50,
    textAlign: 'right',
    top: -8, // Center label on the line (half of ~16px text height)
    left: 0,
  },
  line: {
    position: 'absolute',
    left: 58, // After label (50px) + gap (8px)
    right: 0,
    height: 1,
    top: 0,
  },
});
