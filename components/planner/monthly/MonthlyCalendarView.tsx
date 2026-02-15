/**
 * MonthlyCalendarView - Full month grid view for the planner
 * Matches CalendarCard's full calendar modal style
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { GlassCard } from '../../GlassCard';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.floor((width - 64) / 7);

/** Convert "HH:MM" (24h) to "h:MM AM/PM" */
function to12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// Must match _layout.tsx tab bar constants
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_MARGIN = 12;

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function MonthlyCalendarView({ selectedDate, onDateChange }: Props) {
  const { state } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();

  const bottomPadding = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + (insets.bottom || 0) + 20;

  const todayStr = useMemo(() => formatDateStr(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Start on the month of the selected date
    const parts = selectedDate.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, 1);
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Build set of dates that have blocks in the weekly plan
  const datesWithBlocks = useMemo(() => {
    const set = new Set<string>();
    if (state.weeklyPlan?.days) {
      for (const day of state.weeklyPlan.days) {
        if (day.blocks.length > 0) {
          set.add(day.date);
        }
      }
    }
    return set;
  }, [state.weeklyPlan]);

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const days: Array<{ empty?: boolean; day?: number; dateStr?: string; isToday?: boolean; isSelected?: boolean; hasBlocks?: boolean }> = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    // All days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dateStr = formatDateStr(date);

      days.push({
        day,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasBlocks: datesWithBlocks.has(dateStr),
      });
    }

    return days;
  }, [currentMonth, todayStr, selectedDate, datesWithBlocks]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      {/* Month Header */}
      <GlassCard style={styles.monthHeader}>
        <TouchableOpacity onPress={() => changeMonth('prev')} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={24} color={themeColors.text} />
        </TouchableOpacity>

        <Text style={[styles.monthTitle, { color: themeColors.text }]}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>

        <TouchableOpacity onPress={() => changeMonth('next')} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronRight size={24} color={themeColors.text} />
        </TouchableOpacity>
      </GlassCard>

      {/* Day Labels */}
      <View style={styles.dayLabels}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Text key={day} style={[styles.dayLabel, { color: themeColors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <GlassCard style={styles.gridCard}>
        <View style={styles.calendarGrid}>
          {calendarDays.map((item, index) =>
            item.empty ? (
              <View key={`empty-${index}`} style={styles.emptyDay} />
            ) : (
              <TouchableOpacity
                key={item.dateStr}
                style={[
                  styles.calendarDay,
                  item.isToday && [styles.calendarDayToday, { borderColor: themeColors.primary }],
                  item.isSelected && { backgroundColor: themeColors.primary },
                ]}
                onPress={() => onDateChange(item.dateStr!)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    { color: themeColors.text },
                    item.isSelected && { color: isDark ? Colors.background : '#fff' },
                  ]}
                >
                  {item.day}
                </Text>
                {item.hasBlocks && !item.isSelected && (
                  <View style={[styles.blockDot, { backgroundColor: themeColors.primary }]} />
                )}
                {item.hasBlocks && item.isSelected && (
                  <View style={[styles.blockDot, { backgroundColor: isDark ? Colors.background : '#fff' }]} />
                )}
              </TouchableOpacity>
            )
          )}
        </View>
      </GlassCard>

      {/* Selected Day Summary */}
      {state.weeklyPlan?.days && (() => {
        const dayData = state.weeklyPlan.days.find((d) => d.date === selectedDate);
        if (!dayData) return null;

        const nonSleepBlocks = dayData.blocks.filter((b) => b.type !== 'sleep');
        if (nonSleepBlocks.length === 0) return null;

        return (
          <GlassCard style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
              {new Date(
                parseInt(selectedDate.split('-')[0]),
                parseInt(selectedDate.split('-')[1]) - 1,
                parseInt(selectedDate.split('-')[2])
              ).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.summaryStatValue, { color: themeColors.primary }]}>
                  {nonSleepBlocks.length}
                </Text>
                <Text style={[styles.summaryStatLabel, { color: themeColors.textSecondary }]}>
                  Blocks
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.summaryStatValue, { color: themeColors.primary }]}>
                  {dayData.completionRate}%
                </Text>
                <Text style={[styles.summaryStatLabel, { color: themeColors.textSecondary }]}>
                  Done
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.summaryStatValue, { color: themeColors.primary }]}>
                  {Math.round(dayData.totalFreeMinutes / 60)}h
                </Text>
                <Text style={[styles.summaryStatLabel, { color: themeColors.textSecondary }]}>
                  Free
                </Text>
              </View>
            </View>
            {nonSleepBlocks.map((block) => (
              <View key={block.id} style={[styles.blockRow, { borderLeftColor: block.color }]}>
                <Text style={[styles.blockTime, { color: themeColors.textSecondary }]}>
                  {to12h(block.startTime)}
                </Text>
                <Text style={[styles.blockTitle, { color: themeColors.text }]} numberOfLines={1}>
                  {block.title}
                </Text>
              </View>
            ))}
          </GlassCard>
        );
      })()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    width: CELL_SIZE,
    textAlign: 'center',
  },
  gridCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  emptyDay: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  calendarDay: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: CELL_SIZE / 2,
    marginBottom: 2,
  },
  calendarDayToday: {
    borderWidth: 1.5,
  },
  calendarDayText: {
    fontSize: 15,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  blockDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
    position: 'absolute',
    bottom: 6,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryStatValue: {
    fontSize: 20,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  summaryStatLabel: {
    fontSize: 11,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
  },
  blockTime: {
    fontSize: 11,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
    width: 66,
  },
  blockTitle: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    flex: 1,
  },
});
