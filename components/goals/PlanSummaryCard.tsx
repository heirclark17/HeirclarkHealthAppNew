// Plan Summary Card - Displays training plan overview on Goals page
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
// Animations removed
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { PlanSummary, ExpectedOutcome } from '../../types/training';
import { mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';

interface PlanSummaryCardProps {
  summary: PlanSummary;
  onStartTraining?: () => void;
  onViewDetails?: () => void;
  isExpanded?: boolean;
  showStartButton?: boolean;
  containerStyle?: any;
}

// Confidence color mapping
const getConfidenceColor = (confidence: ExpectedOutcome['confidence']): string => {
  switch (confidence) {
    case 'high':
      return '#2ECC71'; // Green
    case 'medium':
      return Colors.protein; // Orange
    case 'low':
      return Colors.textMuted;
    default:
      return Colors.text;
  }
};

// Section Header Component
function SectionHeader({ title, icon, colors }: { title: string; icon: string; colors: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={colors.protein} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

// Outcome Card Component
function OutcomeCard({ outcome, index, colors, isDark }: { outcome: ExpectedOutcome; index: number; colors: any; isDark: boolean }) {
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  return (
    <View
     
      style={[styles.outcomeCard, { backgroundColor: cardBg }]}
    >
      <View style={styles.outcomeHeader}>
        <Text style={[styles.outcomeMetric, { color: colors.textMuted }]}>{outcome.metric}</Text>
        <View
          style={[
            styles.confidenceBadge,
            { backgroundColor: `${getConfidenceColor(outcome.confidence)}20` },
          ]}
        >
          <View
            style={[
              styles.confidenceDot,
              { backgroundColor: getConfidenceColor(outcome.confidence) },
            ]}
          />
          <Text
            style={[
              styles.confidenceText,
              { color: getConfidenceColor(outcome.confidence) },
            ]}
          >
            {outcome.confidence}
          </Text>
        </View>
      </View>
      <NumberText weight="semiBold" style={[styles.outcomeValue, { color: colors.text }]}>{outcome.targetValue}</NumberText>
      <NumberText weight="light" style={[styles.outcomeTimeframe, { color: colors.textMuted }]}>{outcome.timeframe}</NumberText>
    </View>
  );
}

// Progression Step Component
function ProgressionStep({ step, index, colors }: { step: string; index: number; colors: any }) {
  return (
    <View
     
      style={styles.progressionStep}
    >
      <View style={[styles.stepNumber, { backgroundColor: colors.protein }]}>
        <NumberText weight="semiBold" style={[styles.stepNumberText, { color: colors.background }]}>
          {index + 1}
        </NumberText>
      </View>
      <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
    </View>
  );
}

// Main Component
export function PlanSummaryCard({
  summary,
  onStartTraining,
  onViewDetails,
  isExpanded = false,
  showStartButton = true,
  containerStyle,
}: PlanSummaryCardProps) {
  const { settings } = useSettings();
  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds for inner elements
  const secondaryBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  const handleStartTraining = () => {
    mediumImpact();
    onStartTraining?.();
  };

  return (
    <GlassCard style={[styles.container, containerStyle]} interactive>
      {/* Header Section */}
      <View style={styles.headerTouchable}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="fitness" size={24} color={colors.protein} />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>YOUR TRAINING PLAN</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                <NumberText weight="medium" style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  {summary.expectedOutcomes.length}
                </NumberText> goals
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Overview */}
      <View style={styles.overviewSection}>
        <Text style={[styles.overviewText, { color: colors.textSecondary }]}>{summary.overview}</Text>
      </View>

      {/* Full Content - Always Visible */}
      <View>
          {/* Weekly Structure */}
          <View style={styles.section}>
            <SectionHeader title="Weekly Structure" icon="calendar-outline" colors={colors} />
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{summary.weeklyStructure}</Text>
          </View>

          {/* Strength Focus */}
          <View style={styles.section}>
            <SectionHeader title="Strength Training" icon="barbell-outline" colors={colors} />
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{summary.strengthFocus}</Text>
          </View>

          {/* Cardio Focus */}
          <View style={styles.section}>
            <SectionHeader title="Cardio Program" icon="heart-outline" colors={colors} />
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{summary.cardioFocus}</Text>
          </View>

          {/* Expected Outcomes */}
          <View style={styles.section}>
            <SectionHeader title="Expected Results" icon="trending-up-outline" colors={colors} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.outcomesScroll}
            >
              {summary.expectedOutcomes.map((outcome, index) => (
                <OutcomeCard key={index} outcome={outcome} index={index} colors={colors} isDark={isDark} />
              ))}
            </ScrollView>
          </View>

          {/* Week by Week Progression */}
          <View style={styles.section}>
            <SectionHeader title="Progression Plan" icon="trending-up" colors={colors} />
            <View style={styles.progressionContainer}>
              {summary.weekByWeekProgression.map((step, index) => (
                <ProgressionStep key={index} step={step} index={index} colors={colors} />
              ))}
            </View>
          </View>

          {/* Nutrition Integration */}
          <View style={styles.section}>
            <SectionHeader title="Nutrition Tips" icon="nutrition-outline" colors={colors} />
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{summary.nutritionIntegration}</Text>
          </View>

          {/* Recovery Recommendations */}
          <View style={styles.section}>
            <SectionHeader title="Recovery" icon="bed-outline" colors={colors} />
            <View style={styles.listContainer}>
              {summary.recoveryRecommendations.map((rec, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listBullet, { color: colors.protein }]}>•</Text>
                  <Text style={[styles.listText, { color: colors.textSecondary }]}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.section}>
            <SectionHeader title="Track These Metrics" icon="analytics-outline" colors={colors} />
            <View style={styles.metricsGrid}>
              {summary.keyMetricsToTrack.map((metric, index) => (
                <View key={index} style={[styles.metricTag, { backgroundColor: secondaryBg }]}>
                  <Text style={[styles.metricText, { color: colors.textSecondary }]}>{metric}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Adjustment Triggers */}
          <View style={styles.section}>
            <SectionHeader title="When to Adjust" icon="refresh-outline" colors={colors} />
            <View style={styles.listContainer}>
              {summary.adjustmentTriggers.map((trigger, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.protein} />
                  <Text style={[styles.listText, { color: colors.textSecondary }]}>{trigger}</Text>
                </View>
              ))}
            </View>
          </View>
      </View>

      {/* Action Buttons */}
      {showStartButton && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleStartTraining}
            activeOpacity={0.8}
            accessibilityLabel="Start training plan"
            accessibilityRole="button"
            accessibilityHint="Begins your personalized training program with today's workout"
          >
            <Text style={[styles.startButtonText, { color: colors.primaryText }]}>Start Training Plan</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primaryText} />
          </TouchableOpacity>

          {onViewDetails && (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={onViewDetails}
              activeOpacity={0.7}
              accessibilityLabel="View full schedule"
              accessibilityRole="button"
              accessibilityHint="Opens detailed week-by-week workout schedule with exercises and progression"
            >
              <Text style={[styles.detailsButtonText, { color: colors.textMuted }]}>View Full Schedule</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: 24,
  },
  headerTouchable: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.numericRegular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  overviewSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  overviewText: {
    fontSize: 14,
    fontFamily: Fonts.numericRegular,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: 14,
    fontFamily: Fonts.numericRegular,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  outcomesScroll: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  outcomeCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Spacing.radiusSM,
    padding: Spacing.sm,
    minWidth: 140,
    marginRight: Spacing.sm,
  },
  outcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  outcomeMetric: {
    fontSize: 12,
    fontFamily: Fonts.numericMedium,
    color: Colors.textMuted,
    flex: 1,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontFamily: Fonts.numericMedium,
    textTransform: 'capitalize',
  },
  outcomeValue: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
    marginTop: 4,
  },
  outcomeTimeframe: {
    fontSize: 11,
    fontFamily: Fonts.numericLight,
    color: Colors.textMuted,
    marginTop: 2,
  },
  progressionContainer: {
    gap: Spacing.sm,
  },
  progressionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.protein,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: Fonts.numericBold,
    color: Colors.background,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.numericRegular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  listBullet: {
    fontSize: 14,
    color: Colors.protein,
    fontFamily: Fonts.bold,
    marginTop: 1,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.numericRegular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricTag: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metricText: {
    fontSize: 12,
    fontFamily: Fonts.numericMedium,
    color: Colors.textSecondary,
  },
  actionContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  startButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Spacing.radiusSM,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.primaryText,
  },
  detailsButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailsButtonText: {
    fontSize: 14,
    fontFamily: Fonts.numericMedium,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});

export default PlanSummaryCard;
