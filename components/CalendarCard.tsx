import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, ScrollView, Platform } from 'react-native';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { GlassCard } from './GlassCard';
import { useSettings } from '../contexts/SettingsContext';

const { width } = Dimensions.get('window');

interface CalendarCardProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function CalendarCard({ selectedDate, onDateChange }: CalendarCardProps) {
  const [weekDays, setWeekDays] = useState<{day: string, date: number, dateStr: string, isToday: boolean, isFuture: boolean}[]>([]);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware styling
  const dayItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const dayNameColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const dayNameDisabledColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
  const dayNumberDisabledColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
  const modalOverlayBg = isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)';

  useEffect(() => {
    generateWeekDays();
  }, []);

  useEffect(() => {
    // Scroll to the beginning (current week) after data is loaded
    if (weekDays.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      }, 100);
    }
  }, [weekDays]);

  useEffect(() => {
    if (showFullCalendar) {
      generateMonthDays(currentMonth);
    }
  }, [currentMonth, showFullCalendar]);

  const generateWeekDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Calculate current week Sunday
    const dayOfWeek = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);

    const dateList = [];

    // Generate weeks: current week (Sunday-Saturday) + past 52 weeks
    // User can scroll right to see previous weeks
    for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
      const weekStart = new Date(sunday);
      weekStart.setDate(sunday.getDate() - (weekOffset * 7));

      // Generate all 7 days for this week (Sunday to Saturday)
      for (let dayInWeek = 0; dayInWeek < 7; dayInWeek++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + dayInWeek);

        const dateStr = date.toISOString().split('T')[0];
        const isFuture = date > now;

        dateList.push({
          day: days[date.getDay()],
          date: date.getDate(),
          dateStr: dateStr,
          isToday: dateStr === todayStr,
          isFuture: isFuture
        });
      }
    }

    setWeekDays(dateList);
  };

  const generateMonthDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dateStr = date.toISOString().split('T')[0];
      const isFuture = date > today;

      days.push({
        day,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isFuture // Mark future dates as disabled
      });
    }

    setCalendarDays(days);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    const today = new Date();

    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
      setCurrentMonth(newMonth);
    } else {
      // Prevent going to future months
      newMonth.setMonth(newMonth.getMonth() + 1);
      if (newMonth.getFullYear() < today.getFullYear() ||
          (newMonth.getFullYear() === today.getFullYear() && newMonth.getMonth() <= today.getMonth())) {
        setCurrentMonth(newMonth);
      }
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <>
      {/* Seamless Week Strip - Glass Morphism */}
      <GlassCard style={styles.container} interactive>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekStrip}
          scrollEnabled={true}
          pagingEnabled={false}
          decelerationRate="fast"
          accessibilityRole="tablist"
        >
          {weekDays.map((item, index) => {
            const isSelected = selectedDate === item.dateStr;
            const accessibilityLabel = `${item.day} ${item.date}${item.isToday ? ', Today' : ''}${isSelected ? ', Selected' : ''}${item.isFuture ? ', Future date' : ''}`;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  { backgroundColor: dayItemBg },
                  isSelected && [styles.dayItemActive, { backgroundColor: colors.primary }],
                  item.isFuture && styles.dayItemDisabled
                ]}
                onPress={() => {
                  if (!item.isFuture) {
                    onDateChange(item.dateStr);
                  }
                }}
                disabled={item.isFuture}
                accessible={true}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected, disabled: item.isFuture }}
              >
                <Text style={[
                  styles.dayName,
                  { color: dayNameColor },
                  isSelected && { color: isDark ? 'rgba(0, 0, 0, 0.6)' : Colors.text },
                  item.isFuture && { color: dayNameDisabledColor }
                ]}>
                  {item.day}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  { color: colors.text },
                  isSelected && { color: isDark ? Colors.background : Colors.text },
                  item.isFuture && { color: dayNumberDisabledColor }
                ]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* View Full Calendar Button */}
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

      {/* Full Calendar Modal */}
      <Modal
        visible={showFullCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFullCalendar(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={[styles.dayLabel, { color: colors.textMuted }]}>{day}</Text>
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
                      item.isFuture && styles.calendarDayDisabled
                    ]}
                    onPress={() => {
                      if (!item.isFuture) {
                        onDateChange(item.dateStr);
                        setShowFullCalendar(false);
                      }
                    }}
                    disabled={item.isFuture}
                    accessible={true}
                    accessibilityLabel={`${monthNames[currentMonth.getMonth()]} ${item.day}${item.isToday ? ', Today' : ''}${item.isSelected ? ', Selected' : ''}${item.isFuture ? ', Future date, disabled' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.isSelected, disabled: item.isFuture }}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      { color: colors.text },
                      item.isSelected && { color: colors.background },
                      item.isFuture && { color: colors.textMuted }
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
    marginBottom: 4,
  },
  weekStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  dayItem: {
    width: 48,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'transparent', // Let GlassCard handle background
    minHeight: Spacing.touchTarget + 10, // More comfortable touch target
  },
  dayItemActive: {
    // backgroundColor handled inline with colors.primary
    ...Platform.select({
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
  },
  dayName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)', // text-white/40
    marginBottom: 4,
    fontFamily: Fonts.regular,
  },
  dayNameActive: {
    color: 'rgba(0, 0, 0, 0.6)', // text-black/60
  },
  dayNumber: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.numericRegular,
  },
  dayNumberActive: {
    color: Colors.background, // Black text on white selected day
  },
  dayItemDisabled: {
    opacity: 0.3,
  },
  dayNameDisabled: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  dayNumberDisabled: {
    color: 'rgba(255, 255, 255, 0.2)',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'transparent', // Let GlassCard handle background
    borderRadius: 20, // Extra round corners
    padding: 24,
    width: width - 40,
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
    width: (width - 88) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: (width - 88) / 7,
    height: 48,
  },
  calendarDay: {
    width: (width - 88) / 7,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  calendarDaySelected: {
    backgroundColor: Colors.text,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.numericMedium,
  },
  calendarDayTextSelected: {
    color: Colors.background,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayTextDisabled: {
    color: Colors.textMuted,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
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
