// Exercise Overload Card Component
// Shows per-exercise overload status with comparison, mini sparkline, and AI snippet

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, Star } from 'lucide-react-native';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { useSettings } from '../../contexts/SettingsContext';
import { DarkColors, LightColors, Fonts } from '../../constants/Theme';
import { ProgressiveOverloadEntry, OverloadStatus } from '../../types/training';
import { lightImpact } from '../../utils/haptics';

interface ExerciseOverloadCardProps {
  current: ProgressiveOverloadEntry;
  previous?: ProgressiveOverloadEntry;
  trendData: { estimated1RM: number; totalVolume: number }[];
  aiSnippet?: string;
  onViewHistory?: () => void;
  onBreakPlateau?: () => void;
  onGetAIPlan?: () => void;
}

const STATUS_CONFIG: Record<OverloadStatus, { label: string; icon: any; colorKey: keyof typeof DarkColors }> = {
  progressing: { label: 'Progressing', icon: TrendingUp, colorKey: 'success' },
  maintaining: { label: 'Maintaining', icon: Minus, colorKey: 'warning' },
  stalling: { label: 'Stalling', icon: AlertTriangle, colorKey: 'warningOrange' },
  regressing: { label: 'Regressing', icon: TrendingDown, colorKey: 'error' },
  deload_recommended: { label: 'Deload', icon: AlertTriangle, colorKey: 'warningOrange' },
  new_exercise: { label: 'New', icon: Zap, colorKey: 'accentCyan' },
  pr_set: { label: 'PR!', icon: Star, colorKey: 'accentGold' },
};

export default function ExerciseOverloadCard({
  current,
  previous,
  trendData,
  aiSnippet,
  onViewHistory,
  onBreakPlateau,
  onGetAIPlan,
}: ExerciseOverloadCardProps) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;
  const status = STATUS_CONFIG[current.overloadStatus] || STATUS_CONFIG.maintaining;
  const StatusIcon = status.icon;
  const statusColor = colors[status.colorKey] as string;

  // Mini sparkline from trend data (e1RM)
  const sparklinePoints = useMemo(() => {
    if (trendData.length < 2) return '';
    const values = trendData.map(d => d.estimated1RM);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 80;
    const height = 24;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [trendData]);

  const volumeArrow = current.volumeChangePercent > 0 ? '+' : '';
  const e1rmArrow = current.estimated1RMChangePercent > 0 ? '+' : '';

  return (
    <GlassCard style={styles.card}>
      {/* Header: Exercise name + status badge */}
      <View style={styles.header}>
        <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
          {current.exerciseName}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
          <StatusIcon size={12} color={statusColor} />
          <Text style={[styles.badgeText, { color: statusColor }]}>{status.label}</Text>
        </View>
      </View>

      {/* Comparison row */}
      <View style={styles.comparisonRow}>
        {/* This week */}
        <View style={styles.weekCol}>
          <Text style={[styles.weekLabel, { color: colors.textMuted }]}>This Week</Text>
          <NumberText style={[styles.weekValue, { color: colors.text }]}>
            {current.totalSets}×{current.totalSets > 0 ? Math.round(current.totalReps / current.totalSets) : 0} @ {current.maxWeight}
          </NumberText>
          <Text style={[styles.volumeLabel, { color: colors.textMuted }]}>
            Vol: <NumberText style={[styles.volumeValue, { color: colors.text }]}>{current.totalVolume.toLocaleString()}</NumberText>
          </Text>
        </View>

        {/* Sparkline */}
        {sparklinePoints ? (
          <View style={styles.sparklineContainer}>
            <Svg width={80} height={24}>
              <Polyline
                points={sparklinePoints}
                fill="none"
                stroke={statusColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        ) : null}

        {/* Change indicators */}
        <View style={styles.changeCol}>
          <View style={styles.changeRow}>
            <Text style={[styles.changeLabel, { color: colors.textMuted }]}>Vol</Text>
            <NumberText
              style={[
                styles.changeValue,
                { color: current.volumeChangePercent >= 0 ? colors.success : colors.error },
              ]}
            >
              {volumeArrow}{current.volumeChangePercent}%
            </NumberText>
          </View>
          <View style={styles.changeRow}>
            <Text style={[styles.changeLabel, { color: colors.textMuted }]}>e1RM</Text>
            <NumberText
              style={[
                styles.changeValue,
                { color: current.estimated1RMChangePercent >= 0 ? colors.success : colors.error },
              ]}
            >
              {e1rmArrow}{current.estimated1RMChangePercent}%
            </NumberText>
          </View>
          <NumberText style={[styles.e1rmValue, { color: colors.textSecondary }]}>
            {current.estimated1RM} lb
          </NumberText>
        </View>
      </View>

      {/* AI recommendation snippet */}
      {aiSnippet && (
        <Text style={[styles.aiSnippet, { color: colors.textSecondary }]} numberOfLines={2}>
          {aiSnippet}
        </Text>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {onViewHistory && (
          <TouchableOpacity
            style={[styles.actionBtn]}
            onPress={() => { lightImpact(); onViewHistory(); }}
          >
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>History</Text>
          </TouchableOpacity>
        )}
        {current.overloadStatus === 'stalling' && onBreakPlateau && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.warningOrange + '10' }]}
            onPress={() => { lightImpact(); onBreakPlateau(); }}
          >
            <Text style={[styles.actionText, { color: colors.warningOrange }]}>Break Plateau</Text>
          </TouchableOpacity>
        )}
        {onGetAIPlan && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accentPurple + '10' }]}
            onPress={() => { lightImpact(); onGetAIPlan(); }}
          >
            <Text style={[styles.actionText, { color: colors.accentPurple }]}>AI Plan</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weekCol: {
    flex: 1,
  },
  weekLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  weekValue: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
  },
  volumeLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  volumeValue: {
    fontSize: 11,
    fontFamily: Fonts.numericSemiBold,
  },
  sparklineContainer: {
    marginHorizontal: 8,
  },
  changeCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  changeValue: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
  },
  e1rmValue: {
    fontSize: 11,
    fontFamily: Fonts.numericRegular,
    marginTop: 2,
  },
  aiSnippet: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0,
  },
  actionText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
});
