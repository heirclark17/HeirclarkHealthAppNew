// Animated Overload Score Bar Component
// Shows a 0-100 score with animated fill and color gradient

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSettings } from '../../contexts/SettingsContext';
import { DarkColors, LightColors, Fonts } from '../../constants/Theme';
import { NumberText } from '../NumberText';

let Animated: any = View;
let useSharedValue: any;
let useAnimatedStyle: any;
let withTiming: any;

if (Platform.OS !== 'web') {
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default;
    useSharedValue = Reanimated.useSharedValue;
    useAnimatedStyle = Reanimated.useAnimatedStyle;
    withTiming = Reanimated.withTiming;
  } catch (e) {}
}

if (!useSharedValue) {
  useSharedValue = (v: any) => ({ value: v });
  useAnimatedStyle = (cb: () => any) => cb();
  withTiming = (v: any) => v;
}

interface OverloadScoreBarProps {
  score: number; // 0-100
  label?: string;
}

export default function OverloadScoreBar({ score, label }: OverloadScoreBarProps) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(score, 0), 100), { duration: 800 });
  }, [score]);

  const animatedFill = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const getScoreColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.successMuted;
    if (score >= 40) return colors.warning;
    if (score >= 20) return colors.warningOrange;
    return colors.error;
  };

  const AnimatedView = Animated !== View ? Animated.View : View;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <NumberText style={[styles.scoreText, { color: getScoreColor() }]}>
          {Math.round(score)}
        </NumberText>
        {label && (
          <NumberText style={[styles.label, { color: colors.textSecondary }]}>
            /100
          </NumberText>
        )}
      </View>
      <View style={[styles.track, { backgroundColor: isDark ? '#1a1a1a' : '#E5E5E5' }]}>
        <AnimatedView
          style={[
            styles.fill,
            { backgroundColor: getScoreColor() },
            animatedFill,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 28,
    fontFamily: Fonts.numericBold,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.numericRegular,
    marginLeft: 2,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
