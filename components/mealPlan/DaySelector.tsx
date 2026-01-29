import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Platform } from 'react-native';
import Animated, {
  FadeInRight,
} from 'react-native-reanimated';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { DayPlan } from '../../types/mealPlan';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DaySelectorProps {
  weeklyPlan: DayPlan[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
}

export function DaySelector({ weeklyPlan, selectedDayIndex, onSelectDay }: DaySelectorProps) {
  const { settings } = useSettings();
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<any[]>([]);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware styling (matching CalendarCard exactly)
  const dayItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const dayNameColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const modalOverlayBg = isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)';

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (showFullCalendar) {
      generateMonthDays(currentMonth);
    }
  }, [currentMonth, showFullCalendar]);

  const generateMonthDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = new Date();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dateStr = date.toISOString().split('T')[0];

      // Check if this date is in the weekly plan
      const planDayIndex = weeklyPlan.findIndex(d => d.date === dateStr);
      const isInPlan = planDayIndex !== -1;
      const isSelected = planDayIndex === selectedDayIndex;
      const isToday = dateStr === today.toISOString().split('T')[0];

      days.push({
        day,
        dateStr,
        isToday,
        isSelected,
        isInPlan,
        planDayIndex,
      });
    }

    setCalendarDays(days);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleCalendarDayPress = (item: any) => {
    if (item.isInPlan && item.planDayIndex !== undefined) {
      onSelectDay(item.planDayIndex);
      setShowFullCalendar(false);
    }
  };

  // Get short day name (Mon, Tue, etc.)
  const getShortDayName = (dayName: string) => {
    return dayName.slice(0, 3);
  };

  // Get day number from date
  const getDayNumber = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate();
  };

  if (!weeklyPlan || weeklyPlan.length === 0) {
    return null;
  }

  return (
    <>
      {/* Week Strip - Glass Morphism matching CalendarCard exactly */}
      <GlassCard style={styles.container} interactive>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekStrip}
          scrollEnabled={true}
          pagingEnabled={false}
          decelerationRate="fast"
          accessibilityRole="tablist"
        >
          {weeklyPlan.map((day, index) => {
            const isSelected = index === selectedDayIndex;
            const accessibilityLabel = `${getShortDayName(day.dayName)} ${getDayNumber(day.date)}${isSelected ? ', Selected' : ''}`;

            return (
              <Animated.View
                key={day.dayNumber}
                entering={FadeInRight.delay(index * 80).springify().damping(15)}
              >
                <TouchableOpacity
                  style={[
                    styles.dayItem,
                    { backgroundColor: dayItemBg },
                    isSelected && [styles.dayItemActive, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => onSelectDay(index)}
                  accessible={true}
                  accessibilityLabel={accessibilityLabel}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[
                    styles.dayName,
                    { color: dayNameColor },
                    isSelected && { color: isDark ? 'rgba(0, 0, 0, 0.6)' : '#ffffff' },
                  ]}>
                    {getShortDayName(day.dayName)}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    { color: colors.text },
                    isSelected && { color: isDark ? '#000000' : '#ffffff' },
                  ]}>
                    {getDayNumber(day.date)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* View Full Calendar Button - matching CalendarCard exactly */}
        <TouchableOpacity
          onPress={() => setShowFullCalendar(true)}
          style={styles.fullCalendarButton}
          accessible={true}
          accessibilityLabel="View full calendar"
          accessibilityHint="Opens the full month calendar view"
          accessibilityRole="button"
        >
          <Text style={[styles.fullCalendarButtonText, { color: colors.primary }]}>VIEW FULL CALENDAR →</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Full Calendar Modal - matching CalendarCard exactly */}
      <Modal
        visible={showFullCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFullCalendar(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => changeMonth('prev')}
                accessible={true}
                accessibilityLabel="Previous month"
                accessibilityRole="button"
              >
                <Text style={[styles.navButton, { color: colors.text }]}>←</Text>
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.text }]} accessibilityRole="header">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={() => changeMonth('next')}
                accessible={true}
                accessibilityLabel="Next month"
                accessibilityRole="button"
              >
                <Text style={[styles.navButton, { color: colors.text }]}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Day Labels */}
            <View style={styles.dayLabels}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel) => (
                <Text key={dayLabel} style={[styles.dayLabel, { color: colors.textMuted }]}>{dayLabel}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((item, index) => (
                item.empty ? (
                  <View key={index} style={styles.emptyDay} />
                ) : (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      item.isToday && [styles.calendarDayToday, { borderColor: colors.primary }],
                      item.isSelected && { backgroundColor: colors.text },
                      item.isInPlan && !item.isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                      !item.isInPlan && styles.calendarDayDisabled,
                    ]}
                    onPress={() => handleCalendarDayPress(item)}
                    disabled={!item.isInPlan}
                    accessible={true}
                    accessibilityLabel={`${monthNames[currentMonth.getMonth()]} ${item.day}${item.isToday ? ', Today' : ''}${item.isSelected ? ', Selected' : ''}${item.isInPlan ? ', Has meal plan' : ', No meal plan'}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.isSelected, disabled: !item.isInPlan }}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      { color: colors.text },
                      item.isSelected && { color: colors.background },
                      !item.isInPlan && { color: colors.textMuted },
                    ]}>
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                )
              ))}
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFullCalendar(false)}
              accessible={true}
              accessibilityLabel="Close calendar"
              accessibilityRole="button"
            >
              <Text style={[styles.closeButtonText, { color: colors.primaryText }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  weekStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
  },
  dayItem: {
    width: 48,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
    minHeight: Spacing.touchTarget + 10,
  },
  dayItemActive: Platform.select({
    ios: {
      shadowColor: '#ffffff',
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
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 4,
    fontFamily: Fonts.regular,
  },
  dayNumber: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontWeight: '100',
  },
  fullCalendarButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  fullCalendarButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: Fonts.medium,
    letterSpacing: 2,
  },
  // Modal styles - matching CalendarCard exactly
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  navButton: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: Fonts.bold,
    paddingHorizontal: 12,
  },
  monthTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
    width: (SCREEN_WIDTH - 88) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyDay: {
    width: (SCREEN_WIDTH - 88) / 7 - 4,
    height: 44,
    marginHorizontal: 2,
    marginBottom: 6,
  },
  calendarDay: {
    width: (SCREEN_WIDTH - 88) / 7 - 4,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
    marginBottom: 6,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    marginTop: 24,
  },
  closeButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});

export default DaySelector;
