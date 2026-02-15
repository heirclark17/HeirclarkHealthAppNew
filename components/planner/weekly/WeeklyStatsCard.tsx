/**
 * WeeklyStatsCard - Aggregated weekly statistics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dumbbell, Utensils, Clock, TrendingUp } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { WeeklyStats } from '@/types/planner';
import { colors } from '@/constants/Theme';

interface Props {
  stats: WeeklyStats;
}

export function WeeklyStatsCard({ stats }: Props) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>This Week</Text>

      <View style={styles.statsGrid}>
        <StatItem
          icon={<Dumbbell size={20} color={colors.activeEnergy} />}
          label="Workouts"
          value={`${stats.workoutsCompleted}/${stats.workoutsScheduled}`}
        />
        <StatItem
          icon={<Utensils size={20} color={colors.protein} />}
          label="Meals"
          value={`${stats.mealsCompleted}/${stats.mealsScheduled}`}
        />
        <StatItem
          icon={<Clock size={20} color={colors.carbs} />}
          label="Free Time/Day"
          value={`${Math.round(stats.avgFreeTime / 60)}h`}
        />
        <StatItem
          icon={<TrendingUp size={20} color={colors.primary} />}
          label="Productivity"
          value={`${stats.productivityScore}%`}
        />
      </View>
    </GlassCard>
  );
}

function StatItem({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statItem}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    fontFamily: 'Urbanist_600SemiBold',
    color: colors.text,
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
    backgroundColor: colors.surface + '20',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'SFProRounded-Bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
