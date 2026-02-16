/**
 * CurrentTimeIndicator - Red line showing current time
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface CurrentTimeIndicatorProps {
  wakeTime?: string; // Format: "HH:MM"
}

export function CurrentTimeIndicator({ wakeTime = '06:00' }: CurrentTimeIndicatorProps) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Calculate position relative to wake time
  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
  const wakeMinutes = wakeHour * 60 + wakeMin;

  // Calculate relative position (handle wraparound for late night)
  let relativeMinutes = currentMinutes - wakeMinutes;
  if (relativeMinutes < 0) relativeMinutes += 24 * 60; // Wrap around

  const yPosition = (relativeMinutes / 60) * 60;

  // Don't show if outside visible range (24 hours from wake time)
  if (yPosition < 0 || yPosition > 1440) {
    return null;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={[styles.container, { top: yPosition }]} pointerEvents="none">
      <View style={[styles.dot, { backgroundColor: Colors.protein }]} />
      <View style={[styles.line, { backgroundColor: Colors.protein }]} />
      <View style={[styles.timeContainer, { backgroundColor: Colors.protein }]}>
        <Text style={[styles.timeText, { color: isDark ? themeColors.background : '#FFFFFF' }]}>{timeStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 44, // Align with grid
  },
  line: {
    flex: 1,
    height: 2,
  },
  timeContainer: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 10,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
});
