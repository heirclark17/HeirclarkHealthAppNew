/**
 * PlannerCalendarStrip - Horizontal week date strip for the planner
 * Matches CalendarCard style from the calorie counter dashboard
 * Includes action buttons (calendar sync + refresh) below the date strip
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { CalendarClock, RefreshCw, Trash2, UtensilsCrossed, Dumbbell } from 'lucide-react-native';
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
      });
    }

    return dateList;
  }, [weekStartDate, todayStr]);

  // Selected date display label
  const selectedLabel = useMemo(() => {
    const date = parseLocalDate(selectedDate);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }, [selectedDate]);

  // No horizontal scroll needed — 7 day items fit on screen via flex: 1

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
                  <ActivityIndicator size="small" color="#22C55E" />
                ) : (
                  <UtensilsCrossed size={18} color="#22C55E" />
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
                  <ActivityIndicator size="small" color="#F97316" />
                ) : (
                  <Dumbbell size={18} color="#F97316" />
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

      {/* Week strip */}
      <ScrollView
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
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  dayNumber: {
    fontSize: 18,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
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
