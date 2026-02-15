/**
 * CardioRecommendationCard (Refactored)
 *
 * Dynamic cardio recommendation based on daily calorie balance.
 * Displays different states based on user progress:
 * - no_goals: User hasn't set goals
 * - no_data: No food logged yet
 * - on_track: Already hit calorie target
 * - needs_cardio: Shows minutes needed
 * - over_target: Ate too much
 * - completed: User marked cardio done
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useCardioRecommendation } from '../../contexts/CardioRecommendationContext';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { GlassButton } from '../liquidGlass/GlassButton';
import { NumberText } from '../NumberText';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { Activity, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react-native';

export function CardioRecommendationCard() {
  const { recommendation, isLoading, completedToday, markCardioComplete } = useCardioRecommendation();
  const { isDark } = useSettings();
  const colors = isDark ? DarkColors : LightColors;

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Calculating cardio recommendation...
          </Text>
        </View>
      </GlassCard>
    );
  }

  // ===== NO RECOMMENDATION =====
  if (!recommendation) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.errorContainer}>
          <AlertCircle size={24} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            Unable to load cardio recommendation
          </Text>
        </View>
      </GlassCard>
    );
  }

  // ===== STATUS-SPECIFIC RENDERING =====

  // NO GOALS SET
  if (recommendation.status === 'no_goals') {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Activity size={24} color={colors.warning} />
          <Text style={[styles.title, { color: colors.text }]}>Set Your Goals</Text>
        </View>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {recommendation.message}
        </Text>
        <GlassButton
          title="Go to Goals"
          onPress={() => router.push('/(tabs)/goals')}
          style={styles.button}
        />
      </GlassCard>
    );
  }

  // NO FOOD LOGGED
  if (recommendation.status === 'no_data') {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Activity size={24} color={colors.info} />
          <Text style={[styles.title, { color: colors.text }]}>Cardio Recommendation</Text>
        </View>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {recommendation.message}
        </Text>
        <Text style={[styles.helpText, { color: colors.textMuted }]}>
          Log your meals throughout the day to see personalized cardio recommendations.
        </Text>
      </GlassCard>
    );
  }

  // ON TRACK (or completed)
  if (recommendation.status === 'on_track' || recommendation.status === 'completed') {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <CheckCircle size={24} color={colors.success} />
          <Text style={[styles.title, { color: colors.success }]}>✓ On Track</Text>
        </View>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {recommendation.message}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Net Calories</Text>
            <NumberText style={[styles.statValue, { color: colors.text }]}>
              {recommendation.netCalories}
            </NumberText>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Target</Text>
            <NumberText style={[styles.statValue, { color: colors.text }]}>
              {recommendation.targetCalories}
            </NumberText>
          </View>
        </View>
      </GlassCard>
    );
  }

  // OVER TARGET
  if (recommendation.status === 'over_target') {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <TrendingDown size={24} color={colors.error} />
          <Text style={[styles.title, { color: colors.error }]}>Over Target</Text>
        </View>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {recommendation.message}
        </Text>
        <Text style={[styles.helpText, { color: colors.textMuted }]}>
          Even 60 minutes of cardio won't reach your deficit today. Focus on nutrition tomorrow and stay consistent.
        </Text>
        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Consumed:</Text>
            <NumberText style={[styles.breakdownValue, { color: colors.text }]}>
              {recommendation.netCalories} cal
            </NumberText>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Target:</Text>
            <NumberText style={[styles.breakdownValue, { color: colors.text }]}>
              {recommendation.targetCalories} cal
            </NumberText>
          </View>
          <View style={[styles.breakdownRow, styles.deficitRow]}>
            <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Over By:</Text>
            <NumberText style={[styles.breakdownValue, { color: colors.error }]}>
              +{recommendation.deficitNeeded} cal
            </NumberText>
          </View>
        </View>
      </GlassCard>
    );
  }

  // NEEDS CARDIO
  if (recommendation.status === 'needs_cardio') {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Activity size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Cardio Recommendation</Text>
        </View>

        <View style={styles.bigNumber}>
          <NumberText style={[styles.cardioMinutes, { color: colors.primary }]}>
            {recommendation.cardioMinutes}
          </NumberText>
          <Text style={[styles.minutesLabel, { color: colors.textSecondary }]}>minutes</Text>
        </View>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {recommendation.message}
        </Text>

        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Consumed:</Text>
            <NumberText style={[styles.breakdownValue, { color: colors.text }]}>
              {recommendation.netCalories} cal
            </NumberText>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Target:</Text>
            <NumberText style={[styles.breakdownValue, { color: colors.text }]}>
              {recommendation.targetCalories} cal
            </NumberText>
          </View>
          <View style={[styles.breakdownRow, styles.deficitRow]}>
            <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Deficit Needed:</Text>
            <NumberText style={[styles.breakdownValue, { color: colors.primary }]}>
              {recommendation.deficitNeeded} cal
            </NumberText>
          </View>
        </View>

        <GlassButton
          title="Mark as Complete"
          onPress={() => markCardioComplete(recommendation.cardioMinutes)}
          style={styles.button}
        />
      </GlassCard>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  bigNumber: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  cardioMinutes: {
    fontSize: 64,
    fontFamily: Fonts.numericBold,
  },
  minutesLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    marginTop: -8,
  },
  message: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  helpText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  breakdown: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  deficitRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: Spacing.xs,
    marginTop: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  breakdownValue: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts.numericSemiBold,
  },
  button: {
    marginTop: Spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
});
