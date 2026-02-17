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
import { useTraining } from '../../../contexts/TrainingContext';
import { useMealPlan } from '../../../contexts/MealPlanContext';

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

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type CellData =
  | { empty: true }
  | {
      empty: false;
      day: number;
      dateStr: string;
      isToday: boolean;
      isSelected: boolean;
      hasBlocks: boolean;
    };

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function MonthlyCalendarView({ selectedDate, onDateChange }: Props) {
  const { state } = useDayPlanner();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  // Dynamic theme colors
  const themeColors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Access training and meal plan contexts for full month data
  let trainingState: any = null;
  try { trainingState = useTraining()?.state; } catch {}
  let mealPlanState: any = null;
  try { mealPlanState = useMealPlan()?.state; } catch {}

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

  // Build set of dates that have blocks across the entire month
  const datesWithBlocks = useMemo(() => {
    const set = new Set<string>();

    // Include days from the weekly planner plan
    if (state.weeklyPlan?.days) {
      for (const day of state.weeklyPlan.days) {
        if (day.blocks.length > 0) {
          set.add(day.date);
        }
      }
    }

    // Check training and meal data for all days of the displayed month
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Build set of day-of-week names that have workouts
    const workoutDayNames = new Set<string>();
    if (trainingState?.weeklyPlan?.days) {
      for (const td of trainingState.weeklyPlan.days) {
        if (td.workout && !td.isRestDay) {
          workoutDayNames.add(td.dayOfWeek);
        }
      }
    }

    // Build set of day-of-week indices that have meals
    const mealDayIndices = new Set<number>();
    if (mealPlanState?.weeklyPlan) {
      for (const md of mealPlanState.weeklyPlan) {
        if (md.meals?.length > 0) {
          if (md.dayName) {
            const idx = DAY_NAMES.indexOf(md.dayName);
            if (idx >= 0) mealDayIndices.add(idx);
          } else if (md.dayNumber) {
            mealDayIndices.add(md.dayNumber === 7 ? 0 : md.dayNumber);
          }
        }
      }
    }

    // Mark each day of the month that has workout or meal data
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (set.has(dateStr)) continue;
      const date = new Date(year, monthIndex, day);
      const dayOfWeek = date.getDay();
      if (workoutDayNames.has(DAY_NAMES[dayOfWeek]) || mealDayIndices.has(dayOfWeek)) {
        set.add(dateStr);
      }
    }

    return set;
  }, [state.weeklyPlan, currentMonth, trainingState?.weeklyPlan, mealPlanState?.weeklyPlan]);

  // Compute blocks for the selected day (works for any day, not just weekly plan)
  const selectedDayBlocks = useMemo(() => {
    // First check weekly planner data
    if (state.weeklyPlan?.days) {
      const planDay = state.weeklyPlan.days.find((d) => d.date === selectedDate);
      if (planDay) return planDay;
    }

    // Compute from training + meal data for days outside the weekly plan
    const date = parseLocalDate(selectedDate);
    const dayOfWeek = date.getDay();
    const dayName = DAY_NAMES[dayOfWeek];
    const blocks: any[] = [];

    // Workout
    if (trainingState?.weeklyPlan?.days) {
      const trainingDay = trainingState.weeklyPlan.days.find((d: any) => d.dayOfWeek === dayName);
      if (trainingDay?.workout && !trainingDay.isRestDay) {
        blocks.push({
          id: `workout_${selectedDate}`,
          type: 'workout',
          title: trainingDay.workout.name || 'Workout',
          startTime: '07:00',
          endTime: '08:00',
          duration: trainingDay.workout.duration || 45,
          color: Colors.activeEnergy || '#FF6B6B',
          status: 'scheduled',
        });
      }
    }

    // Meals
    if (mealPlanState?.weeklyPlan) {
      const mappedDayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
      const mealDay = mealPlanState.weeklyPlan.find((d: any) => {
        if (d.dayName === dayName) return true;
        return d.dayNumber === mappedDayNum;
      });
      if (mealDay?.meals?.length > 0) {
        const mealTimes: Record<string, string> = {
          breakfast: '08:00', lunch: '12:00', dinner: '18:00', snack: '15:00',
        };
        for (const meal of mealDay.meals) {
          const startTime = mealTimes[meal.mealType] || '12:00';
          blocks.push({
            id: `meal_${selectedDate}_${meal.mealType}`,
            type: 'meal_eating',
            title: `${capitalize(meal.mealType)}: ${meal.name}`,
            startTime,
            endTime: startTime,
            duration: 30,
            color: Colors.protein || '#4ECDC4',
            status: 'scheduled',
          });
        }
      }
    }

    if (blocks.length === 0) return null;

    return {
      date: selectedDate,
      blocks,
      completionRate: 0,
      totalFreeMinutes: 0,
    };
  }, [selectedDate, state.weeklyPlan, trainingState?.weeklyPlan, mealPlanState?.weeklyPlan]);

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

    const allCells: CellData[] = [];

    // Leading empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      allCells.push({ empty: true });
    }

    // All days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      allCells.push({
        empty: false,
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
      {selectedDayBlocks && (() => {
        const nonSleepBlocks = selectedDayBlocks.blocks.filter((b: any) => b.type !== 'sleep');
        if (nonSleepBlocks.length === 0) return null;

        return (
          <GlassCard style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
              {parseLocalDate(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long', month: 'short', day: 'numeric',
              })}
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
              {selectedDayBlocks.completionRate > 0 && (
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, { color: themeColors.primary }]}>
                    {selectedDayBlocks.completionRate}%
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: themeColors.textSecondary }]}>
                    Done
                  </Text>
                </View>
              )}
              {selectedDayBlocks.totalFreeMinutes > 0 && (
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, { color: themeColors.primary }]}>
                    {Math.round(selectedDayBlocks.totalFreeMinutes / 60)}h
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: themeColors.textSecondary }]}>
                    Free
                  </Text>
                </View>
              )}
            </View>
            {nonSleepBlocks.map((block: any) => (
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
    fontFamily: Fonts.numericLight,
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
    bottom: Math.floor(CELL_SIZE * 0.22),
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
