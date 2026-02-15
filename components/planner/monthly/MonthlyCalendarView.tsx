/**
 * MonthlyCalendarView - Full month grid view for the planner
 * Properly aligned calendar with correct day-of-week mapping
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { GlassCard } from '../../GlassCard';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Grid sizing: screen - (marginHorizontal*2) - (GlassCard internal padding*2) - (grid inner padding*2)
// 16px margin each side = 32, 16px GlassCard padding each side = 32, 4px grid padding each side = 8
// Total horizontal space eaten: 72px
const GRID_INNER_WIDTH = SCREEN_WIDTH - 32 - 32 - 8;
const CELL_SIZE = Math.floor(GRID_INNER_WIDTH / 7);

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

  // Generate calendar grid - always produces complete rows of 7
  const calendarRows = useMemo(() => {
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0=Sun, 6=Sat
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    type CellData = { empty: true } | {
      empty?: false;
      day: number;
      dateStr: string;
      isToday: boolean;
      isSelected: boolean;
      hasBlocks: boolean;
    };

    const allCells: CellData[] = [];

    // Leading empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      allCells.push({ empty: true });
    }

    // All days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      allCells.push({
        day,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasBlocks: datesWithBlocks.has(dateStr),
      });
    }

    // Trailing empty cells to complete last row
    const remainder = allCells.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        allCells.push({ empty: true });
      }
    }

    // Split into rows of 7
    const rows: CellData[][] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      rows.push(allCells.slice(i, i + 7));
    }

    return rows;
  }, [currentMonth, todayStr, selectedDate, datesWithBlocks]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      {/* Month Header */}
      <GlassCard style={styles.monthHeader}>
        <View style={styles.monthHeaderInner}>
          <TouchableOpacity
            onPress={() => changeMonth('prev')}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={themeColors.text} />
          </TouchableOpacity>

          <Text style={[styles.monthTitle, { color: themeColors.text }]}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>

          <TouchableOpacity
            onPress={() => changeMonth('next')}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronRight size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Calendar Grid (day labels + date cells inside same card) */}
      <GlassCard style={styles.gridCard}>
        {/* Day Labels Row */}
        <View style={styles.dayLabelsRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <View key={day} style={styles.dayLabelCell}>
              <Text style={[styles.dayLabelText, { color: themeColors.textSecondary }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Date Rows */}
        {calendarRows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.calendarRow}>
            {row.map((item, colIndex) =>
              item.empty ? (
                <View key={`empty-${rowIndex}-${colIndex}`} style={styles.calendarCell} />
              ) : (
                <TouchableOpacity
                  key={item.dateStr}
                  style={styles.calendarCell}
                  onPress={() => onDateChange(item.dateStr)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      item.isToday && !item.isSelected && [styles.dayCircleToday, { borderColor: themeColors.primary }],
                      item.isSelected && { backgroundColor: themeColors.primary },
                    ]}
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
                  </View>
                  {item.hasBlocks && (
                    <View
                      style={[
                        styles.blockDot,
                        {
                          backgroundColor: item.isSelected
                            ? (isDark ? Colors.background : '#fff')
                            : themeColors.primary,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              )
            )}
          </View>
        ))}
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
  // Month header: GlassCard wraps, inner view handles centering
  monthHeader: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  monthHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  // Grid card contains both day labels and date rows
  gridCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabelCell: {
    width: CELL_SIZE,
    alignItems: 'center',
  },
  dayLabelText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  calendarCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: CELL_SIZE - 6,
    height: CELL_SIZE - 6,
    borderRadius: (CELL_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
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
    position: 'absolute',
    bottom: 4,
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
