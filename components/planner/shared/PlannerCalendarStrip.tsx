/**
 * PlannerCalendarStrip - Horizontal week date strip for the planner
 * Matches CalendarCard style from the calorie counter dashboard
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  weekStartDate?: string; // YYYY-MM-DD of the week's Sunday
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

export function PlannerCalendarStrip({ selectedDate, onDateChange, weekStartDate }: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const scrollRef = useRef<ScrollView>(null);

  const dayItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const dayNameColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

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

  // Scroll to selected date on mount
  useEffect(() => {
    const selectedIdx = weekDays.findIndex((d) => d.dateStr === selectedDate);
    if (selectedIdx > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, selectedIdx * 56 - 40), animated: false });
      }, 50);
    }
  }, [selectedDate, weekDays]);

  return (
    <GlassCard style={styles.container}>
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
              {item.isToday && !isSelected && (
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
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
