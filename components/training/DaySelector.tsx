import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { WeeklyTrainingPlan } from '../../types/training';
import { lightImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';

interface DaySelectorProps {
  weeklyPlan: WeeklyTrainingPlan;
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
}

function DayPill({
  day,
  isSelected,
  onPress,
  index,
  colors,
  isDark,
}: {
  day: WeeklyTrainingPlan['days'][0];
  isSelected: boolean;
  onPress: () => void;
  index: number;
  colors: any;
  isDark: boolean;
}) {
  // Theme-aware backgrounds matching CalendarCard
  const dayItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const dayNameColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dayShort = day.dayOfWeek.slice(0, 3);
  const dayNumber = new Date(day.date).getDate();
  const hasWorkout = !day.isRestDay && day.workout;
  const isCompleted = day.completed;

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={() => {
          lightImpact();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.dayPill,
          { backgroundColor: dayItemBg },
          isSelected && [styles.dayPillSelected, { backgroundColor: colors.primary }],
          isCompleted && styles.dayPillCompleted,
        ]}
        activeOpacity={0.8}
        accessibilityLabel={`${day.dayOfWeek}, ${day.date}${hasWorkout ? ', workout scheduled' : ', rest day'}${isCompleted ? ', completed' : ''}`}
        accessibilityRole="button"
        accessibilityState={{
          selected: isSelected,
          disabled: false,
        }}
        accessibilityHint={`Select ${day.dayOfWeek} to view ${hasWorkout ? 'workout details' : 'rest day'}`}
      >
        <Text style={[
          styles.dayName,
          { color: dayNameColor },
          isSelected && { color: isDark ? 'rgba(0, 0, 0, 0.6)' : Colors.text },
        ]}>
          {dayShort}
        </Text>
        <Text style={[
          styles.dayNumber,
          { color: colors.text },
          isSelected && { color: isDark ? Colors.background : Colors.text },
        ]}>
          {dayNumber}
        </Text>
        {hasWorkout && !isCompleted && (
          <View style={[styles.workoutIndicator, isSelected && styles.workoutIndicatorSelected]} />
        )}
        {isCompleted && (
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={isSelected ? (isDark ? Colors.background : Colors.text) : colors.text}
            style={styles.completedIcon}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function DaySelector({ weeklyPlan, selectedDayIndex, onSelectDay }: DaySelectorProps) {
  const { settings } = useSettings();
  const scrollViewRef = useRef<ScrollView>(null);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Reverse the days so latest is on the right
  const reversedDays = useMemo(() => [...weeklyPlan.days].reverse(), [weeklyPlan.days]);

  // Auto-scroll to the end (latest day) after mount
  useEffect(() => {
    if (reversedDays.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        const dayWidth = 68; // 60px snap interval + gap
        const maxScroll = reversedDays.length * dayWidth;
        scrollViewRef.current?.scrollTo({ x: maxScroll, y: 0, animated: false });
      }, 100);
    }
  }, [reversedDays.length]);

  // Theme-aware day pill background
  const dayItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <GlassCard style={styles.container} interactive>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={60}
        decelerationRate="fast"
      >
        {reversedDays.map((day, reverseIndex) => {
          // Map back to original index for selection
          const originalIndex = weeklyPlan.days.length - 1 - reverseIndex;
          return (
            <DayPill
              key={day.id}
              day={day}
              index={originalIndex}
              isSelected={originalIndex === selectedDayIndex}
              onPress={() => onSelectDay(originalIndex)}
              colors={colors}
              isDark={isDark}
            />
          );
        })}
      </ScrollView>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  dayPill: {
    width: 52,
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: Spacing.touchTarget + 10,
  },
  dayPillSelected: Platform.select({
    ios: {
      shadowColor: Colors.text,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    android: {
      elevation: 8,
    },
    default: {
      boxShadow: '0px 0px 20px rgba(255, 255, 255, 0.3)',
    },
  }),
  dayPillCompleted: {
    // Completed styling handled inline
  },
  dayName: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: Colors.primaryText,
  },
  dayNumber: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.thin,
  },
  dayNumberSelected: {
    color: Colors.primaryText,
    fontFamily: Fonts.medium,
  },
  workoutIndicator: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: Colors.protein,
    marginTop: 6,
  },
  workoutIndicatorSelected: {
    backgroundColor: Colors.primaryText,
  },
  completedIcon: {
    marginTop: 4,
  },
});
