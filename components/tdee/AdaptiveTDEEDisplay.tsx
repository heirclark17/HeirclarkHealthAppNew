/**
 * Adaptive TDEE Display - Shows calculated metabolism with confidence score
 * Updates daily as user tracks weight and calories
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../GlassCard';
import { Colors, Fonts, Spacing } from '../../constants/Theme';
import {
  calculateAdaptiveTDEE,
  getCalorieAdjustment,
  TDEEResult,
  WeightEntry,
  CalorieEntry,
  UserStats,
} from '../../utils/adaptiveTDEE';
import { CircularGauge } from '../CircularGauge';

interface AdaptiveTDEEDisplayProps {
  weightEntries: WeightEntry[];
  calorieEntries: CalorieEntry[];
  userStats: UserStats;
  goal: 'fat_loss' | 'muscle_gain' | 'maintain';
  onTDEECalculated?: (result: TDEEResult) => void;
}

export function AdaptiveTDEEDisplay({
  weightEntries,
  calorieEntries,
  userStats,
  goal,
  onTDEECalculated,
}: AdaptiveTDEEDisplayProps) {
  const [tdeeResult, setTdeeResult] = useState<TDEEResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    const calculateTDEE = async () => {
      setIsCalculating(true);
      try {
        const result = calculateAdaptiveTDEE(weightEntries, calorieEntries, userStats);
        setTdeeResult(result);
        onTDEECalculated?.(result);
      } catch (error) {
        console.error('Error calculating TDEE:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateTDEE();
  }, [weightEntries, calorieEntries, userStats]);

  if (isCalculating || !tdeeResult) {
    return (
      <GlassCard style={styles.card}>
        <ActivityIndicator size="large" color={Colors.text} />
        <Text style={styles.loadingText}>Calculating your metabolism...</Text>
      </GlassCard>
    );
  }

  const calorieAdjustment = getCalorieAdjustment(
    tdeeResult.adaptiveTDEE,
    goal,
    'moderate'
  );

  const confidenceColor =
    tdeeResult.confidence === 'high'
      ? Colors.success
      : tdeeResult.confidence === 'medium'
      ? Colors.warningOrange
      : Colors.textMuted;

  const trendIcon =
    tdeeResult.weightTrend === 'losing'
      ? 'trending-down'
      : tdeeResult.weightTrend === 'gaining'
      ? 'trending-up'
      : 'remove';

  return (
    <GlassCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Adaptive TDEE</Text>
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
          <Text style={styles.confidenceText}>
            {tdeeResult.confidence.toUpperCase()}
          </Text>
        </View>
      </View>

      {tdeeResult.needsMoreData ? (
        /* Need More Data State */
        <View style={styles.needsData}>
          <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.needsDataTitle}>
            {tdeeResult.minDaysRemaining} more days needed
          </Text>
          <Text style={styles.needsDataText}>
            Continue tracking weight and calories daily for accurate TDEE calculation.
          </Text>
          <Text style={styles.needsDataText}>
            Using formula estimate: {tdeeResult.formulaTDEE} cal/day
          </Text>
        </View>
      ) : (
        /* TDEE Calculated State */
        <>
          {/* Main TDEE Value */}
          <View style={styles.mainValue}>
            <Text style={styles.tdeeValue}>
              {tdeeResult.adaptiveTDEE.toLocaleString()}
            </Text>
            <Text style={styles.tdeeUnit}>cal/day</Text>
          </View>

          {/* Confidence Score */}
          <View style={styles.confidenceContainer}>
            <CircularGauge
              value={tdeeResult.confidenceScore}
              maxValue={100}
              size={80}
              label="Confidence"
              color={confidenceColor}
            />
            <View style={styles.confidenceInfo}>
              <Text style={styles.confidenceLabel}>Data Quality</Text>
              <Text style={styles.confidenceValue}>
                {tdeeResult.confidenceScore}/100
              </Text>
              <Text style={styles.daysTracked}>
                {tdeeResult.daysOfData} days tracked
              </Text>
            </View>
          </View>

          {/* Comparison */}
          <View style={styles.comparison}>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Your Data:</Text>
              <Text style={styles.comparisonValue}>
                {tdeeResult.adaptiveTDEE} cal
              </Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Formula Estimate:</Text>
              <Text style={styles.comparisonValue}>
                {tdeeResult.formulaTDEE} cal
              </Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Variance:</Text>
              <Text
                style={[
                  styles.comparisonValue,
                  { color: Math.abs(tdeeResult.variance) > 10 ? Colors.warningOrange : Colors.success },
                ]}
              >
                {tdeeResult.variance > 0 ? '+' : ''}
                {tdeeResult.variance.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Weight Trend */}
          <View style={styles.trend}>
            <Ionicons name={trendIcon} size={24} color={Colors.text} />
            <Text style={styles.trendText}>
              {tdeeResult.weightTrend === 'maintaining'
                ? 'Maintaining weight'
                : `${tdeeResult.weightTrend === 'losing' ? 'Losing' : 'Gaining'} ${Math.abs(
                    tdeeResult.avgWeeklyChange
                  ).toFixed(2)} lbs/week`}
            </Text>
          </View>

          {/* Target Calories */}
          <View style={styles.target}>
            <Text style={styles.targetLabel}>Target for {goal.replace('_', ' ')}:</Text>
            <Text style={styles.targetValue}>
              {calorieAdjustment.targetCalories} cal/day
            </Text>
            <Text style={styles.targetSubtext}>
              {calorieAdjustment.adjustment > 0 ? '+' : ''}
              {calorieAdjustment.adjustment} cal from TDEE
            </Text>
          </View>

          {/* Recommendation */}
          <View style={styles.recommendation}>
            <Ionicons name="bulb-outline" size={20} color={Colors.accentGold} />
            <Text style={styles.recommendationText}>
              {tdeeResult.recommendation}
            </Text>
          </View>
        </>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.radiusSM,
  },
  confidenceText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  needsData: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  needsDataTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  needsDataText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  mainValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  tdeeValue: {
    fontSize: 48,
    fontFamily: Fonts.extraLight,
    color: Colors.text,
  },
  tdeeUnit: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.glassTintSuccess,
    borderRadius: Spacing.radiusMD,
  },
  confidenceInfo: {
    flex: 1,
  },
  confidenceLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  daysTracked: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 4,
  },
  comparison: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  comparisonValue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Spacing.radiusMD,
    marginBottom: Spacing.lg,
  },
  trendText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  target: {
    padding: Spacing.md,
    backgroundColor: Colors.glassTintSuccess,
    borderRadius: Spacing.radiusMD,
    marginBottom: Spacing.lg,
  },
  targetLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  targetValue: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  targetSubtext: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Spacing.radiusMD,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
