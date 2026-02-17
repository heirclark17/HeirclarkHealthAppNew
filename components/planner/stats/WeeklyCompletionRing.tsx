/**
 * WeeklyCompletionRing - Circular progress ring showing weekly plan adherence
 *
 * Features:
 * - Animated SVG ring with completion percentage
 * - Color-coded by adherence level (green > yellow > red)
 * - Shows completed vs total blocks for the week
 * - Breakdown by category (workouts, meals, total)
 * - Liquid glass design
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// Create animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import { GlassCard } from '../../GlassCard';
import { NumberText } from '../../NumberText';
import { useSettings } from '../../../contexts/SettingsContext';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

const RING_SIZE = 180;
const RING_THICKNESS = 12;
const RING_RADIUS = (RING_SIZE - RING_THICKNESS) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function WeeklyCompletionRing() {
  const { settings } = useSettings();
  const { state } = useDayPlanner();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  // Calculate weekly stats
  const weeklyStats = React.useMemo(() => {
    if (!state.weeklyPlan?.days) {
      return {
        totalBlocks: 0,
        completedBlocks: 0,
        completionRate: 0,
        workoutCompletion: 0,
        mealCompletion: 0,
        totalWorkouts: 0,
        completedWorkouts: 0,
        totalMeals: 0,
        completedMeals: 0,
      };
    }

    let totalBlocks = 0;
    let completedBlocks = 0;
    let totalWorkouts = 0;
    let completedWorkouts = 0;
    let totalMeals = 0;
    let completedMeals = 0;

    state.weeklyPlan.days.forEach((day) => {
      if (!day.blocks) return;

      day.blocks.forEach((block) => {
        // Skip sleep, buffer, and calendar events from stats
        if (block.type === 'sleep' || block.type === 'buffer' || block.type === 'calendar_event') {
          return;
        }

        totalBlocks++;
        if (block.status === 'completed') completedBlocks++;

        // Count workouts
        if (block.type === 'workout') {
          totalWorkouts++;
          if (block.status === 'completed') completedWorkouts++;
        }

        // Count meals
        if (block.type === 'meal_eating' || block.type === 'meal_prep') {
          totalMeals++;
          if (block.status === 'completed') completedMeals++;
        }
      });
    });

    const completionRate = totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0;
    const workoutCompletion = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;
    const mealCompletion = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0;

    return {
      totalBlocks,
      completedBlocks,
      completionRate,
      workoutCompletion,
      mealCompletion,
      totalWorkouts,
      completedWorkouts,
      totalMeals,
      completedMeals,
    };
  }, [state.weeklyPlan]);

  // Animated progress value
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedProgress, {
      toValue: weeklyStats.completionRate,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [weeklyStats.completionRate, animatedProgress]);

  // Determine ring color based on completion rate
  const getRingColor = (rate: number): string => {
    if (rate >= 80) return Colors.protein; // Green - excellent
    if (rate >= 60) return Colors.carbs;    // Yellow - good
    return Colors.fat;                       // Red - needs improvement
  };

  const ringColor = getRingColor(weeklyStats.completionRate);

  // Calculate stroke dash offset for progress animation
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  return (
    <GlassCard style={styles.card}>
      {/* Title */}
      <Text style={[styles.title, { color: themeColors.text }]}>
        Weekly Adherence
      </Text>

      {/* Ring Chart */}
      <View style={styles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svg}>
          {/* Background circle */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth={RING_THICKNESS}
            fill="none"
          />

          {/* Progress circle */}
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={ringColor}
            strokeWidth={RING_THICKNESS}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Center Text */}
        <View style={styles.centerText}>
          <NumberText style={[styles.percentage, { color: ringColor }]}>
            {Math.round(weeklyStats.completionRate)}
          </NumberText>
          <Text style={[styles.percentSign, { color: ringColor }]}>%</Text>
          <Text style={[styles.centerLabel, { color: themeColors.textSecondary }]}>
            Complete
          </Text>
        </View>
      </View>

      {/* Stats Breakdown */}
      <View style={styles.breakdown}>
        {/* Total */}
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Overall
          </Text>
          <NumberText style={[styles.statValue, { color: themeColors.text }]}>
            {weeklyStats.completedBlocks}
          </NumberText>
          <Text style={[styles.statSeparator, { color: themeColors.textSecondary }]}>/</Text>
          <NumberText style={[styles.statTotal, { color: themeColors.textSecondary }]}>
            {weeklyStats.totalBlocks}
          </NumberText>
        </View>

        {/* Workouts */}
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Workouts
          </Text>
          <NumberText style={[styles.statValue, { color: Colors.protein }]}>
            {weeklyStats.completedWorkouts}
          </NumberText>
          <Text style={[styles.statSeparator, { color: themeColors.textSecondary }]}>/</Text>
          <NumberText style={[styles.statTotal, { color: themeColors.textSecondary }]}>
            {weeklyStats.totalWorkouts}
          </NumberText>
          <NumberText style={[styles.statPercentage, { color: Colors.protein }]}>
            ({Math.round(weeklyStats.workoutCompletion)}%)
          </NumberText>
        </View>

        {/* Meals */}
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Meals
          </Text>
          <NumberText style={[styles.statValue, { color: Colors.carbs }]}>
            {weeklyStats.completedMeals}
          </NumberText>
          <Text style={[styles.statSeparator, { color: themeColors.textSecondary }]}>/</Text>
          <NumberText style={[styles.statTotal, { color: themeColors.textSecondary }]}>
            {weeklyStats.totalMeals}
          </NumberText>
          <NumberText style={[styles.statPercentage, { color: Colors.carbs }]}>
            ({Math.round(weeklyStats.mealCompletion)}%)
          </NumberText>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 48,
    fontFamily: Fonts.numericBold,
    fontWeight: '700',
    lineHeight: 52,
  },
  percentSign: {
    fontSize: 24,
    fontFamily: Fonts.numericBold,
    fontWeight: '700',
    marginTop: -4,
  },
  centerLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  breakdown: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
    fontWeight: '600',
  },
  statSeparator: {
    fontSize: 16,
    fontFamily: Fonts.numericRegular,
  },
  statTotal: {
    fontSize: 16,
    fontFamily: Fonts.numericRegular,
  },
  statPercentage: {
    fontSize: 13,
    fontFamily: Fonts.numericRegular,
  },
});
