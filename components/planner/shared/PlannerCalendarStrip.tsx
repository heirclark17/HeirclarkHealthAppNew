/**
 * PlannerCalendarStrip - Horizontal week date strip for the planner
 * Matches CalendarCard style from the calorie counter dashboard
 * Includes action buttons (calendar sync + refresh) below the date strip
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { CalendarClock, RefreshCw } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  weekStartDate?: string; // YYYY-MM-DD of the week's Sunday
  onSyncCalendar?: () => void;
  isSyncingCalendar?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * Returns US holiday name for a date string, or null if not a holiday.
 * Covers fixed-date and floating federal holidays.
 */
function getHolidayName(dateStr: string): string | null {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dow = date.getDay(); // 0=Sun

  // Fixed-date holidays
  if (month === 1 && day === 1) return "New Year's";
  if (month === 6 && day === 19) return 'Juneteenth';
  if (month === 7 && day === 4) return 'July 4th';
  if (month === 11 && day === 11) return "Veterans Day";
  if (month === 12 && day === 25) return 'Christmas';
  if (month === 12 && day === 31) return "New Year's Eve";
  if (month === 2 && day === 14) return "Valentine's";
  if (month === 10 && day === 31) return 'Halloween';

  // Floating holidays (Nth weekday of month)
  const weekOfMonth = Math.ceil(day / 7);

  // MLK Day: 3rd Monday of January
  if (month === 1 && dow === 1 && weekOfMonth === 3) return 'MLK Day';

  // Presidents' Day: 3rd Monday of February
  if (month === 2 && dow === 1 && weekOfMonth === 3) return "Presidents'";

  // Memorial Day: last Monday of May
  if (month === 5 && dow === 1 && day > 24) return 'Memorial Day';

  // Labor Day: 1st Monday of September
  if (month === 9 && dow === 1 && weekOfMonth === 1) return 'Labor Day';

  // Columbus Day: 2nd Monday of October
  if (month === 10 && dow === 1 && weekOfMonth === 2) return 'Columbus Day';

  // Thanksgiving: 4th Thursday of November
  if (month === 11 && dow === 4 && weekOfMonth === 4) return 'Thanksgiving';

  // Mother's Day: 2nd Sunday of May
  if (month === 5 && dow === 0 && weekOfMonth === 2) return "Mother's Day";

  // Father's Day: 3rd Sunday of June
  if (month === 6 && dow === 0 && weekOfMonth === 3) return "Father's Day";

  return null;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PlannerCalendarStrip({
  selectedDate,
  onDateChange,
  weekStartDate,
  onSyncCalendar,
  isSyncingCalendar,
  onRefresh,
  isRefreshing,
}: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const scrollRef = useRef<ScrollView>(null);

  const dayItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const dayNameColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const actionBtnBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  // Generate current week's 7 days
  const weekDays = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    // Use provided weekStartDate or calculate current week's Sunday
    let sunday: Date;
    if (weekStartDate) {
      sunday = parseLocalDate(weekStartDate);
    } else {
      sunday = new Date(now);
      sunday.setDate(now.getDate() - now.getDay());
    }
    sunday.setHours(0, 0, 0, 0);

    const dateList = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      const dateStr = formatDateStr(date);

      dateList.push({
        day: days[date.getDay()],
        date: date.getDate(),
        dateStr,
        isToday: dateStr === todayStr,
        holiday: getHolidayName(dateStr),
      });
    }

    return dateList;
  }, [weekStartDate, todayStr]);

  // Selected date display label
  const selectedLabel = useMemo(() => {
    const date = parseLocalDate(selectedDate);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }, [selectedDate]);

  // Scroll to selected date on mount
  useEffect(() => {
    const selectedIdx = weekDays.findIndex((d) => d.dateStr === selectedDate);
    if (selectedIdx > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, selectedIdx * 56 - 40), animated: false });
      }, 50);
    }
  }, [selectedDate, weekDays]);

  const hasActions = onSyncCalendar || onRefresh;

  return (
    <GlassCard style={styles.container}>
      {/* Action row: date label + buttons */}
      {hasActions && (
        <View style={styles.actionRow}>
          <Text style={[styles.dateLabel, { color: themeColors.text }]}>{selectedLabel}</Text>
          <View style={styles.actionButtons}>
            {onSyncCalendar && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: actionBtnBg }]}
                onPress={onSyncCalendar}
                disabled={isSyncingCalendar}
                activeOpacity={0.7}
              >
                {isSyncingCalendar ? (
                  <ActivityIndicator size="small" color={themeColors.text} />
                ) : (
                  <CalendarClock size={18} color={themeColors.text} />
                )}
              </TouchableOpacity>
            )}
            {onRefresh && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: actionBtnBg }]}
                onPress={onRefresh}
                disabled={isRefreshing}
                activeOpacity={0.7}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={themeColors.primary} />
                ) : (
                  <RefreshCw size={18} color={themeColors.primary} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Week strip */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekStrip}
      >
        {weekDays.map((item) => {
          const isSelected = selectedDate === item.dateStr;
          return (
            <TouchableOpacity
              key={item.dateStr}
              style={[
                styles.dayItem,
                { backgroundColor: dayItemBg },
                isSelected && [styles.dayItemActive, { backgroundColor: themeColors.primary }],
              ]}
              onPress={() => onDateChange(item.dateStr)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: dayNameColor },
                  isSelected && { color: isDark ? 'rgba(0,0,0,0.6)' : '#fff' },
                ]}
              >
                {item.day}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  { color: themeColors.text },
                  isSelected && { color: isDark ? Colors.background : '#fff' },
                ]}
              >
                {item.date}
              </Text>
              {item.holiday && (
                <Text
                  style={[
                    styles.holidayLabel,
                    { color: isSelected ? (isDark ? '#000' : '#fff') : themeColors.accentGold },
                  ]}
                  numberOfLines={1}
                >
                  {item.holiday}
                </Text>
              )}
              {item.isToday && !isSelected && !item.holiday && (
                <View style={[styles.todayDot, { backgroundColor: themeColors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    flex: 1,
  },
  dayItem: {
    flex: 1,
    minWidth: 42,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  dayItemActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  dayName: {
    fontSize: 11,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  dayNumber: {
    fontSize: 18,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  holidayLabel: {
    fontSize: 7,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    maxWidth: 46,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
