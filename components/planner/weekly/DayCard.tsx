/**
 * DayCard - Compact day summary in weekly view
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { GlassCard } from '../../GlassCard';
import { DailyTimeline } from '../../../types/planner';
import { Colors } from '../../../constants/Theme';

interface Props {
  day: DailyTimeline;
  isSelected: boolean;
  onPress: () => void;
}

export function DayCard({ day, isSelected, onPress }: Props) {
  const date = new Date(day.date);
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
            borderColor: Colors.primary,
            borderWidth: 2,
          },
        ]}
      >
        {/* Day Name */}
        <Text style={[styles.dayName, isSelected && { color: Colors.primary }]}>
          {dayName}
        </Text>

        {/* Day Number */}
        <Text style={[styles.dayNumber, isSelected && { color: Colors.primary }]}>
          {dayNumber}
        </Text>

        {/* Completion Rate */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${day.completionRate}%`,
                backgroundColor: isSelected ? Colors.primary : Colors.protein,
              },
            ]}
          />
        </View>

        {/* Stats */}
        <Text style={styles.stats}>
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
    fontFamily: 'Urbanist_600SemiBold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 32,
    fontFamily: 'SFProRounded-Bold',
    color: Colors.text,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.surface + '40',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  stats: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: Colors.textSecondary,
  },
});
