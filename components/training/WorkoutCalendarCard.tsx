import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { GlassCard } from '../GlassCard';
import { useSettings } from '../../contexts/SettingsContext';
import { WeeklyTrainingPlan, DayPlan } from '../../types/training';
import { lightImpact } from '../../utils/haptics';

type CalendarView = 'week' | 'month';

interface WorkoutCalendarCardProps {
  weeklyPlan: WeeklyTrainingPlan;
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
// Account for: GlassCard margin (16*2) + GlassCard padding (16*2) + grid padding (4*2)
const TOTAL_HORIZONTAL_PADDING = 32 + 32 + 8; // 72px total
const DAY_GAP = 2; // Smaller gap to fit all 7 days
const DAYS_PER_WEEK = 7;
const TOTAL_GAP_WIDTH = DAY_GAP * (DAYS_PER_WEEK - 1); // 6 gaps between 7 days
const DAY_SIZE = Math.floor((SCREEN_WIDTH - TOTAL_HORIZONTAL_PADDING - TOTAL_GAP_WIDTH) / DAYS_PER_WEEK);

export function WorkoutCalendarCard({ weeklyPlan, selectedDayIndex, onSelectDay }: WorkoutCalendarCardProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { settings } = useSettings();
  const [viewMode, setViewMode] = useState<CalendarView>('week');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware styling
  const dayItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const dayNameColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

  useEffect(() => {
    // Scroll to selected day after data is loaded (week view only)
    if (viewMode === 'week' && weeklyPlan?.days?.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        const offset = selectedDayIndex * 54; // 48px width + 6px gap
        scrollViewRef.current?.scrollTo({ x: Math.max(0, offset - 100), y: 0, animated: true });
      }, 100);
    }
  }, [selectedDayIndex, weeklyPlan, viewMode]);

  // Generate month calendar data
  const monthCalendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for the first day (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();

    // Create array for all days in the calendar view
    const calendarDays: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      dayPlan?: DayPlan;
      isSelected: boolean;
      weekPlanIndex?: number;
    }> = [];

    // Add previous month days to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      calendarDays.push({
        date,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isSelected: false,
      });
    }

    // Add current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];

      // Find matching day in weekly plan
      const planIndex = weeklyPlan?.days?.findIndex(d => {
        const planDate = new Date(d.date).toISOString().split('T')[0];
        return planDate === dateStr;
      }) ?? -1;

      const dayPlan = planIndex >= 0 ? weeklyPlan?.days?.[planIndex] : undefined;

      calendarDays.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        dayPlan,
        isSelected: planIndex === selectedDayIndex,
        weekPlanIndex: planIndex !== undefined && planIndex >= 0 ? planIndex : undefined,
      });
    }

    // Add next month days to complete the grid (6 rows)
    const remainingDays = 42 - calendarDays.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      calendarDays.push({
        date,
        dayNumber: day,
        isCurrentMonth: false,
        isSelected: false,
      });
    }

    return calendarDays;
  }, [currentMonth, weeklyPlan, selectedDayIndex]);

  // Navigate months
  const goToPreviousMonth = useCallback(() => {
    lightImpact();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    lightImpact();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    lightImpact();
    setViewMode(prev => prev === 'week' ? 'month' : 'week');
  }, []);

  // Handle day selection in month view
  const handleMonthDaySelect = useCallback((day: typeof monthCalendarData[0]) => {
    if (day.weekPlanIndex !== undefined) {
      lightImpact();
      onSelectDay(day.weekPlanIndex);
    }
  }, [onSelectDay]);

  if (!weeklyPlan) return null;

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <GlassCard style={styles.container} interactive>
      {/* Header with View Toggle */}
      <View style={styles.weekHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.weekTitle, { color: colors.textSecondary }]}>
            {viewMode === 'week' ? `Week ${weeklyPlan?.weekNumber || 1}` : monthName}
          </Text>
        </View>

        {/* View Toggle */}
        <TouchableOpacity
          style={[styles.viewToggle, { backgroundColor: dayItemBg }]}
          onPress={toggleViewMode}
          activeOpacity={0.7}
        >
          <View style={[
            styles.toggleOption,
            viewMode === 'week' && [styles.toggleOptionActive, { backgroundColor: colors.primary }]
          ]}>
            <Text style={[
              styles.toggleText,
              { color: colors.textMuted },
              viewMode === 'week' && { color: isDark ? Colors.background : '#fff' }
            ]}>Week</Text>
          </View>
          <View style={[
            styles.toggleOption,
            viewMode === 'month' && [styles.toggleOptionActive, { backgroundColor: colors.primary }]
          ]}>
            <Text style={[
              styles.toggleText,
              { color: colors.textMuted },
              viewMode === 'month' && { color: isDark ? Colors.background : '#fff' }
            ]}>Month</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Week View */}
      {viewMode === 'week' && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekStrip}
            scrollEnabled={true}
            decelerationRate="fast"
            accessibilityRole="tablist"
          >
            {(weeklyPlan?.days || []).map((day, index) => {
              const isSelected = selectedDayIndex === index;
              const dayShort = day.dayOfWeek.slice(0, 3);
              const dayNumber = new Date(day.date).getDate();
              const hasWorkout = !day.isRestDay && day.workout;
              const isCompleted = day.completed;
              const isRestDay = day.isRestDay;

              return (
                <TouchableOpacity
                  key={day.id || index}
                  style={[
                    styles.dayItem,
                    { backgroundColor: dayItemBg },
                    isSelected && [styles.dayItemActive, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => onSelectDay(index)}
                  accessible={true}
                  accessibilityLabel={`${day.dayOfWeek} ${dayNumber}${isSelected ? ', Selected' : ''}${isRestDay ? ', Rest Day' : ''}${isCompleted ? ', Completed' : ''}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
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

                  <View style={styles.indicatorContainer}>
                    {isRestDay && (
                      <View style={styles.restIndicator}>
                        <Ionicons
                          name="bed-outline"
                          size={12}
                          color={isSelected ? (isDark ? Colors.background : Colors.text) : colors.textMuted}
                        />
                      </View>
                    )}
                    {hasWorkout && !isCompleted && (
                      <View style={[
                        styles.workoutIndicator,
                        { backgroundColor: isSelected ? (isDark ? Colors.background : Colors.text) : colors.protein }
                      ]} />
                    )}
                    {isCompleted && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={isSelected ? (isDark ? Colors.background : Colors.text) : colors.protein}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.text }]}>{monthName}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Day of Week Headers */}
          <View style={styles.weekdayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={[styles.weekdayHeader, { color: colors.textMuted }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {monthCalendarData.map((day, index) => {
              const hasWorkout = day.dayPlan && !day.dayPlan.isRestDay && day.dayPlan.workout;
              const isCompleted = day.dayPlan?.completed;
              const isRestDay = day.dayPlan?.isRestDay;
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthDayItem,
                    { backgroundColor: day.isCurrentMonth ? dayItemBg : 'transparent' },
                    day.isSelected && [styles.monthDayItemActive, { backgroundColor: colors.primary }],
                    isToday && !day.isSelected && [styles.monthDayToday, { borderColor: colors.primary }],
                  ]}
                  onPress={() => handleMonthDaySelect(day)}
                  disabled={!day.isCurrentMonth || day.weekPlanIndex === undefined}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.monthDayNumber,
                    { color: day.isCurrentMonth ? colors.text : colors.textMuted },
                    !day.isCurrentMonth && { opacity: 0.3 },
                    day.isSelected && { color: isDark ? Colors.background : '#fff' },
                  ]}>
                    {day.dayNumber}
                  </Text>

                  {/* Workout Indicators */}
                  {day.isCurrentMonth && day.dayPlan && (
                    <View style={styles.monthIndicatorContainer}>
                      {isRestDay && (
                        <View style={[styles.monthIndicatorDot, { backgroundColor: colors.textMuted, opacity: 0.5 }]} />
                      )}
                      {hasWorkout && !isCompleted && (
                        <View style={[
                          styles.monthIndicatorDot,
                          { backgroundColor: day.isSelected ? (isDark ? Colors.background : '#fff') : colors.protein }
                        ]} />
                      )}
                      {isCompleted && (
                        <View style={[
                          styles.monthIndicatorDot,
                          { backgroundColor: day.isSelected ? (isDark ? Colors.background : '#fff') : colors.protein }
                        ]}>
                          <Ionicons
                            name="checkmark"
                            size={8}
                            color={day.isSelected ? colors.primary : '#fff'}
                          />
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* Workout Summary */}
      <View style={[styles.summaryRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: colors.protein }]} />
          <Text style={[styles.summaryText, { color: colors.textMuted }]}>
            {(weeklyPlan?.days || []).filter(d => !d.isRestDay && d.workout).length} Workouts
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="bed-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.summaryText, { color: colors.textMuted }]}>
            {(weeklyPlan?.days || []).filter(d => d.isRestDay).length} Rest Days
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="checkmark-circle" size={12} color={colors.protein} />
          <Text style={[styles.summaryText, { color: colors.textMuted }]}>
            {weeklyPlan?.completedWorkouts || 0}/{weeklyPlan?.totalWorkouts || 0} Done
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekTitle: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  toggleOption: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleOptionActive: {
    // Background set dynamically
  },
  toggleText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  weekStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  dayItem: {
    width: 48,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: Spacing.touchTarget + 10,
  },
  dayItemActive: Platform.select({
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
  dayName: {
    fontSize: 11,
    marginBottom: 4,
    fontFamily: Fonts.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 18,
    fontFamily: Fonts.thin,
    fontWeight: '100',
  },
  indicatorContainer: {
    marginTop: 6,
    minHeight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  restIndicator: {
    // Icon handles its own styling
  },

  // Month View Styles
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  weekdayHeaders: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 4,
    gap: DAY_GAP,
  },
  weekdayHeader: {
    width: DAY_SIZE,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
    marginBottom: 12,
    rowGap: DAY_GAP,
    columnGap: DAY_GAP,
  },
  monthDayItem: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  monthDayItemActive: Platform.select({
    ios: {
      shadowColor: Colors.text,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
    android: {
      elevation: 4,
    },
    default: {
      boxShadow: '0px 0px 10px rgba(255, 255, 255, 0.2)',
    },
  }),
  monthDayToday: {
    borderWidth: 1,
  },
  monthDayNumber: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  monthIndicatorContainer: {
    position: 'absolute',
    bottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
});
