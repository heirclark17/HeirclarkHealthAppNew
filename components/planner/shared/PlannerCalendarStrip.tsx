/**
 * PlannerCalendarStrip - 7-day week strip for the planner
 * Shows exactly the 7 days from the active weekly plan (or current week as fallback).
 * Includes action buttons (calendar sync + refresh) below the date strip.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { CalendarClock, RefreshCw, Trash2, UtensilsCrossed, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  weekStartDate?: string; // YYYY-MM-DD of the week's Sunday
  onSyncCalendar?: () => void;
  isSyncingCalendar?: boolean;
  onResyncMeals?: () => void;
  isSyncingMeals?: boolean;
  onResyncWorkouts?: () => void;
  isSyncingWorkouts?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onClear?: () => void;
  allDayEventDots?: Record<string, string[]>; // dateStr -> array of up to 3 event colors
  // Week navigation
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  isCurrentWeek?: boolean;
  isLoadingWeek?: boolean;
  onJumpToToday?: () => void;
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
  onResyncMeals,
  isSyncingMeals,
  onResyncWorkouts,
  isSyncingWorkouts,
  onRefresh,
  isRefreshing,
  onClear,
  allDayEventDots,
  onPrevWeek,
  onNextWeek,
  isCurrentWeek = true,
  isLoadingWeek,
  onJumpToToday,
}: Props) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const themeColors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';
  const dayItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const dayNameColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const actionBtnBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  // Generate exactly 7 days from the weekly plan's start date (or current week as fallback)
  const weekDays = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    // Use the plan's weekStartDate if available, otherwise calculate current week's Sunday
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
        day: dayNames[date.getDay()],
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        dateStr,
        isToday: dateStr === todayStr,
        // Show month label on first day or when month changes from previous day
        showMonth: i === 0,
      });
    }

    // Also mark the first day of a new month (month boundary within the week)
    for (let i = 1; i < dateList.length; i++) {
      if (dateList[i].month !== dateList[i - 1].month) {
        dateList[i].showMonth = true;
      }
    }

    return dateList;
  }, [weekStartDate, todayStr]);

  // Selected date display label
  const selectedLabel = useMemo(() => {
    const date = parseLocalDate(selectedDate);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }, [selectedDate]);

  // Week range label (e.g. "Feb 16 - Feb 22, 2026")
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = parseLocalDate(weekDays[0].dateStr);
    const last = parseLocalDate(weekDays[6].dateStr);
    const firstMonth = first.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = last.toLocaleDateString('en-US', { month: 'short' });
    const year = last.getFullYear();
    if (firstMonth === lastMonth) {
      return `${firstMonth} ${first.getDate()} - ${last.getDate()}, ${year}`;
    }
    return `${firstMonth} ${first.getDate()} - ${lastMonth} ${last.getDate()}, ${year}`;
  }, [weekDays]);

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
            {onResyncMeals && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: actionBtnBg }]}
                onPress={onResyncMeals}
                disabled={isSyncingMeals}
                activeOpacity={0.7}
              >
                {isSyncingMeals ? (
                  <ActivityIndicator size="small" color={themeColors.text} />
                ) : (
                  <UtensilsCrossed size={18} color={themeColors.text} />
                )}
              </TouchableOpacity>
            )}
            {onResyncWorkouts && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: actionBtnBg }]}
                onPress={onResyncWorkouts}
                disabled={isSyncingWorkouts}
                activeOpacity={0.7}
              >
                {isSyncingWorkouts ? (
                  <ActivityIndicator size="small" color={themeColors.text} />
                ) : (
                  <Dumbbell size={18} color={themeColors.text} />
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
            {onClear && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: actionBtnBg }]}
                onPress={onClear}
                activeOpacity={0.7}
              >
                <Trash2 size={18} color="rgba(239, 68, 68, 0.8)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Week navigation row */}
      {(onPrevWeek || onNextWeek) && (
        <View style={styles.weekNavRow}>
          <TouchableOpacity
            style={[styles.weekNavBtn, { backgroundColor: actionBtnBg }]}
            onPress={onPrevWeek}
            activeOpacity={0.7}
          >
            <ChevronLeft size={18} color={themeColors.text} />
          </TouchableOpacity>

          <View style={styles.weekNavCenter}>
            {isLoadingWeek ? (
              <ActivityIndicator size="small" color={themeColors.textSecondary} />
            ) : (
              <Text style={[styles.weekRangeLabel, { color: themeColors.textSecondary }]}>
                {weekRangeLabel}
              </Text>
            )}
            {!isCurrentWeek && onJumpToToday && (
              <TouchableOpacity
                style={[styles.todayPill, { backgroundColor: themeColors.primary }]}
                onPress={onJumpToToday}
                activeOpacity={0.7}
              >
                <Text style={styles.todayPillText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.weekNavBtn, { backgroundColor: actionBtnBg }]}
            onPress={onNextWeek}
            activeOpacity={0.7}
          >
            <ChevronRight size={18} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Week strip - exactly 7 days, no scroll needed */}
      <View style={styles.weekStrip}>
        {weekDays.map((item) => {
          const isSelected = selectedDate === item.dateStr;

          return (
            <TouchableOpacity
              key={item.dateStr}
              style={styles.dayItem}
              onPress={() => onDateChange(item.dateStr)}
              activeOpacity={0.7}
            >
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: 12,
                    zIndex: -1,
                  },
                  isSelected ? {
                    backgroundColor: isDark ? '#FFFFFF' : '#000000',
                    opacity: 1,
                  } : {
                    backgroundColor: dayItemBg,
                    opacity: 1,
                  },
                ]}
              />
              <Text
                style={[
                  styles.dayName,
                  { color: dayNameColor },
                  isSelected ? { color: isDark ? '#000000' : '#FFFFFF' } : {},
                ]}
              >
                {item.day}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  { color: themeColors.text },
                  isSelected ? { color: isDark ? '#000000' : '#FFFFFF' } : {},
                ]}
              >
                {item.date}
              </Text>
              {/* Show month abbreviation when month changes within the week */}
              {item.showMonth && (
                <Text
                  style={[
                    styles.monthLabel,
                    { color: dayNameColor },
                    isSelected ? { color: isDark ? '#000000' : '#FFFFFF' } : {},
                  ]}
                >
                  {item.month}
                </Text>
              )}
              {item.isToday && !isSelected && (
                <View style={[styles.todayDot, { backgroundColor: themeColors.primary }]} />
              )}
              {/* All-day event color dots (hidden on selected day) */}
              {!isSelected && allDayEventDots?.[item.dateStr]?.length ? (
                <View style={styles.eventDotsRow}>
                  {allDayEventDots[item.dateStr].map((dotColor, idx) => (
                    <View key={idx} style={[styles.eventDot, { backgroundColor: dotColor }]} />
                  ))}
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
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
    fontFamily: Fonts.numericSemiBold,
    fontWeight: '600' as const,
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
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  weekRangeLabel: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
    fontWeight: '600' as const,
  },
  todayPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayPillText: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  weekStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 3,
  },
  dayName: {
    fontSize: 11,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  dayNumber: {
    fontSize: 18,
    fontFamily: Fonts.numericSemiBold,
    fontWeight: '600' as const,
  },
  monthLabel: {
    fontSize: 9,
    fontFamily: Fonts.numericLight,
    fontWeight: '300' as const,
    opacity: 0.7,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventDotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
