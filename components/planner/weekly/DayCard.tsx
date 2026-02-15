/**
 * DayCard - Compact day summary in weekly view
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { GlassCard } from '../../GlassCard';
import { DailyTimeline } from '../../../types/planner';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  day: DailyTimeline;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Parse a "YYYY-MM-DD" string as a local-timezone date (not UTC).
 * new Date("2026-02-16") creates a UTC midnight date which can shift the day
 * when displayed in local timezone (e.g. CST is -6h so it shows Feb 15).
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function DayCard({ day, isSelected, onPress }: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  const date = parseLocalDate(day.date);
  const dayName = format(date, 'EEE');
  const dayNumber = format(date, 'd');

  const blocksCompleted = day.blocks.filter((b) => b.status === 'completed').length;
  const totalBlocks = day.blocks.filter((b) => b.type !== 'sleep').length;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <GlassCard
        style={[
          styles.card,
          isSelected && {
            borderColor: themeColors.primary,
            borderWidth: 2,
          },
        ]}
      >
        {/* Day Name */}
        <Text style={[styles.dayName, { color: themeColors.textSecondary }, isSelected && { color: themeColors.primary }]}>
          {dayName}
        </Text>

        {/* Day Number */}
        <Text style={[styles.dayNumber, { color: themeColors.text }, isSelected && { color: themeColors.primary }]}>
          {dayNumber}
        </Text>

        {/* Completion Rate */}
        <View style={[styles.progressContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${day.completionRate}%`,
                backgroundColor: isSelected ? themeColors.primary : Colors.protein,
              },
            ]}
          />
        </View>

        {/* Stats */}
        <Text style={[styles.stats, { color: themeColors.textSecondary }]}>
          {blocksCompleted}/{totalBlocks} done
        </Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  dayName: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 32,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  stats: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
});
