/**
 * WeeklyStatsCard - Aggregated weekly statistics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dumbbell, Utensils, Clock, TrendingUp } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { WeeklyStats } from '../../../types/planner';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  stats: WeeklyStats;
}

export function WeeklyStatsCard({ stats }: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  return (
    <GlassCard style={styles.card}>
      <Text style={[styles.title, { color: themeColors.text }]}>This Week</Text>

      <View style={styles.statsGrid}>
        <StatItem
          icon={<Dumbbell size={20} color={Colors.activeEnergy} />}
          label="Workouts"
          value={`${stats.workoutsCompleted}/${stats.workoutsScheduled}`}
          themeColors={themeColors}
          isDark={isDark}
        />
        <StatItem
          icon={<Utensils size={20} color={Colors.protein} />}
          label="Meals"
          value={`${stats.mealsCompleted}/${stats.mealsScheduled}`}
          themeColors={themeColors}
          isDark={isDark}
        />
        <StatItem
          icon={<Clock size={20} color={Colors.carbs} />}
          label="Free Time/Day"
          value={`${Math.round(stats.avgFreeTime / 60)}h`}
          themeColors={themeColors}
          isDark={isDark}
        />
        <StatItem
          icon={<TrendingUp size={20} color={themeColors.primary} />}
          label="Productivity"
          value={`${stats.productivityScore}%`}
          themeColors={themeColors}
          isDark={isDark}
        />
      </View>
    </GlassCard>
  );
}

function StatItem({ icon, label, value, themeColors, isDark }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  themeColors: typeof DarkColors;
  isDark: boolean;
}) {
  return (
    <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
      {icon}
      <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
});
