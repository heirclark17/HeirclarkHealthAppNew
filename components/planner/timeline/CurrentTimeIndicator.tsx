/**
 * CurrentTimeIndicator - Red line showing current time
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/Theme';

export function CurrentTimeIndicator() {
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

  // Calculate position from 6 AM
  const yPosition = ((currentMinutes - 6 * 60) / 60) * 60;

  // Don't show if outside visible range (6 AM - 6 AM next day)
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
      <View style={styles.dot} />
      <View style={styles.line} />
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{timeStr}</Text>
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
    backgroundColor: colors.protein,
    marginLeft: 44, // Align with grid
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.protein,
  },
  timeContainer: {
    position: 'absolute',
    right: 0,
    backgroundColor: colors.protein,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 10,
    fontFamily: 'SFProRounded-Bold',
    color: colors.background,
  },
});
