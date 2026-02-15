import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Heart, Clock, Zap, Activity } from 'lucide-react-native';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { DailyCardioRecommendation } from '../../types/training';

interface CardioRecommendationCardProps {
  recommendation: DailyCardioRecommendation;
  dayName: string;
  isDark: boolean;
}

/**
 * Extremely detailed cardio recommendation card
 * Shows: activity, duration, intensity, heart rate zone, calories, tips, warmup/cooldown
 */
export function CardioRecommendationCard({ recommendation, dayName, isDark }: CardioRecommendationCardProps) {
  const colors = isDark ? DarkColors : LightColors;

  // Defensive: Provide default values if data is missing
  const safeRecommendation = {
    activity: recommendation?.activity || 'Rest Day',
    duration: recommendation?.duration || 0,
    intensity: recommendation?.intensity || 'moderate',
    heartRateZone: recommendation?.heartRateZone,
    caloriesBurned: recommendation?.caloriesBurned || 0,
    description: recommendation?.description || 'Take a rest day to recover.',
    tips: recommendation?.tips || [],
    warmup: recommendation?.warmup,
    cooldown: recommendation?.cooldown,
    alternatives: recommendation?.alternatives || [],
  };

  // Get intensity color
  const intensityColor = useMemo(() => {
    switch (safeRecommendation.intensity) {
      case 'low': return '#4ade80'; // green
      case 'moderate': return '#fbbf24'; // yellow
      case 'high': return '#f87171'; // red
      case 'interval': return '#a78bfa'; // purple
      default: return colors.primary;
    }
  }, [safeRecommendation.intensity, colors.primary]);

  return (
    <GlassCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Heart size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {dayName} Cardio
          </Text>
        </View>
        <View style={[styles.intensityBadge, { backgroundColor: `${intensityColor}20` }]}>
          <Text style={[styles.intensityText, { color: intensityColor }]}>
            {safeRecommendation.intensity.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Activity Name */}
      <Text style={[styles.activityName, { color: colors.text }]}>
        {safeRecommendation.activity}
      </Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Duration */}
        <View style={styles.statItem}>
          <Clock size={18} color={colors.textMuted} />
          <NumberText style={[styles.statValue, { color: colors.text }]}>
            {safeRecommendation.duration}
          </NumberText>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>min</Text>
        </View>

        {/* Calories */}
        <View style={styles.statItem}>
          <Zap size={18} color={colors.textMuted} />
          <NumberText style={[styles.statValue, { color: colors.text }]}>
            {safeRecommendation.caloriesBurned}
          </NumberText>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>cal</Text>
        </View>

        {/* Heart Rate Zone (if provided) */}
        {safeRecommendation.heartRateZone && (
          <View style={styles.statItem}>
            <Activity size={18} color={colors.textMuted} />
            <Text style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>
              {safeRecommendation.heartRateZone}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          WHAT TO DO
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {safeRecommendation.description}
        </Text>
      </View>

      {/* Warmup */}
      {safeRecommendation.warmup && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            WARMUP
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {safeRecommendation.warmup}
          </Text>
        </View>
      )}

      {/* Cooldown */}
      {safeRecommendation.cooldown && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            COOLDOWN
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {safeRecommendation.cooldown}
          </Text>
        </View>
      )}

      {/* Tips */}
      {safeRecommendation.tips && safeRecommendation.tips.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            TIPS & FORM CUES
          </Text>
          {safeRecommendation.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Alternatives */}
      {safeRecommendation.alternatives && safeRecommendation.alternatives.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            ALTERNATIVES
          </Text>
          {safeRecommendation.alternatives.map((alt, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {alt}
              </Text>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  intensityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intensityText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  activityName: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts.numericBold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  bulletPoint: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
});
