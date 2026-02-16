/**
 * BehaviorInsightCard - Tier 2c
 * Shows actionable insights based on learned completion patterns.
 * Displayed at top of DailyTimelineView when there's a relevant insight.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrendingUp, X, Clock, Flame, Award } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { DarkColors, LightColors, Fonts } from '../../../constants/Theme';
import { CompletionPatterns } from '../../../types/planner';

interface BehaviorInsightCardProps {
  completionPatterns: CompletionPatterns;
}

interface Insight {
  text: string;
  icon: typeof TrendingUp;
  color: string;
}

function generateInsight(patterns: CompletionPatterns): Insight | null {
  const entries = Object.entries(patterns);
  if (entries.length === 0) return null;

  // Check for high-completion workout pattern
  const workout = patterns['workout'];
  if (workout && workout.completionRate > 0.8 && workout.preferredWindow) {
    const hour = parseInt(workout.preferredWindow.split(':')[0], 10);
    const timeLabel = hour < 12 ? `before ${hour + 1} AM` : `around ${hour > 12 ? hour - 12 : hour} PM`;
    return {
      text: `You complete workouts ${Math.round(workout.completionRate * 100)}% of the time when scheduled ${timeLabel}`,
      icon: Flame,
      color: '#CC7722',
    };
  }

  // Check for skipping pattern
  for (const [type, pattern] of entries) {
    if (pattern.skippedAt.length >= 3 && pattern.completionRate < 0.5) {
      const label = type.includes('meal') ? 'meals' : type + 's';
      return {
        text: `You've skipped ${pattern.skippedAt.length} ${label} recently \u2014 try scheduling them at a different time?`,
        icon: Clock,
        color: '#E76F51',
      };
    }
  }

  // Check for streak
  if (workout && workout.completedAt.length >= 5) {
    return {
      text: `Great streak! You've completed ${workout.completedAt.length} workouts. Keep the momentum going!`,
      icon: Award,
      color: '#2A9D8F',
    };
  }

  return null;
}

export function BehaviorInsightCard({ completionPatterns }: BehaviorInsightCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  const insight = useMemo(() => generateInsight(completionPatterns), [completionPatterns]);

  if (!insight || dismissed) return null;

  const IconComponent = insight.icon;

  return (
    <GlassCard style={styles.container}>
      <View style={[styles.accentBar, { backgroundColor: insight.color }]} />
      <View style={styles.content}>
        <IconComponent size={18} color={insight.color} />
        <Text style={[styles.text, { color: themeColors.text }]} numberOfLines={2}>
          {insight.text}
        </Text>
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X size={16} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    lineHeight: 18,
  },
});
