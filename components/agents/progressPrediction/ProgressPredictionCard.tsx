/**
 * Progress Prediction Card
 * Dashboard card showing weight predictions, trends, milestones, and goal projection
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';
import { useProgressPrediction } from '../../../contexts/ProgressPredictionContext';
import { Milestone, WeightPrediction } from '../../../types/progressPrediction';
import { Fonts } from '../../../constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProgressPredictionCard() {
  const { colors } = useGlassTheme();
  const {
    state,
    getTrendDirection,
    getWeeklyRate,
    isInPlateau,
    getPlateauSuggestions,
    getNextMilestone,
    getAchievedMilestones,
    getPercentComplete,
    getTotalLost,
    getGoalDate,
  } = useProgressPrediction();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [showPredictionsModal, setShowPredictionsModal] = useState(false);

  // Get computed values
  const trendDirection = useMemo(() => getTrendDirection(), [getTrendDirection]);
  const weeklyRate = useMemo(() => getWeeklyRate(), [getWeeklyRate]);
  const inPlateau = useMemo(() => isInPlateau(), [isInPlateau]);
  const plateauSuggestions = useMemo(() => getPlateauSuggestions(), [getPlateauSuggestions]);
  const nextMilestone = useMemo(() => getNextMilestone(), [getNextMilestone]);
  const achievedMilestones = useMemo(() => getAchievedMilestones(), [getAchievedMilestones]);
  const percentComplete = useMemo(() => getPercentComplete(), [getPercentComplete]);
  const totalLost = useMemo(() => getTotalLost(), [getTotalLost]);
  const goalDate = useMemo(() => getGoalDate(), [getGoalDate]);

  // Trend icon and color
  const getTrendIcon = useCallback(() => {
    switch (trendDirection) {
      case 'losing':
        return { icon: 'trending-down', color: '#22C55E' };
      case 'gaining':
        return { icon: 'trending-up', color: '#EF4444' };
      default:
        return { icon: 'remove', color: colors.textMuted };
    }
  }, [trendDirection, colors.textMuted]);

  const trendInfo = getTrendIcon();

  // Format goal date
  const formatGoalDate = useCallback((dateStr: string | null) => {
    if (!dateStr) return 'Calculating...';
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }, []);

  // Format days remaining
  const getDaysRemaining = useCallback(() => {
    if (!state.goalProjection?.daysRemaining) return null;
    const days = state.goalProjection.daysRemaining;
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  }, [state.goalProjection]);

  // Render milestone item
  const renderMilestone = (milestone: Milestone, index: number) => (
    <View key={milestone.id} style={styles.milestoneItem}>
      <View
        style={[
          styles.milestoneIcon,
          {
            backgroundColor: milestone.achieved ? '#22C55E20' : colors.cardGlass,
            borderColor: milestone.achieved ? '#22C55E' : colors.glassBorder,
          },
        ]}
      >
        <Ionicons
          name={milestone.achieved ? 'checkmark' : 'flag'}
          size={18}
          color={milestone.achieved ? '#22C55E' : colors.textMuted}
        />
      </View>
      <View style={styles.milestoneInfo}>
        <Text style={[styles.milestoneName, { color: colors.text }]}>
          {milestone.label}
        </Text>
        {milestone.achieved ? (
          <Text style={[styles.milestoneSubtext, { color: '#22C55E' }]}>
            Achieved {milestone.achievedDate}
          </Text>
        ) : (
          <Text style={[styles.milestoneSubtext, { color: colors.textMuted }]}>
            {milestone.projectedDate
              ? `Projected: ${formatGoalDate(milestone.projectedDate)}`
              : 'In progress'}
          </Text>
        )}
      </View>
      <View style={styles.milestoneProgress}>
        <Text style={[styles.milestonePercent, { color: colors.primary }]}>
          {milestone.currentProgress}%
        </Text>
      </View>
    </View>
  );

  // Render prediction item
  const renderPrediction = (prediction: WeightPrediction) => (
    <GlassCard key={prediction.date} style={styles.predictionItem}>
      <View style={styles.predictionHeader}>
        <Text style={[styles.predictionDate, { color: colors.text }]}>
          {formatGoalDate(prediction.date)}
        </Text>
        <Text style={[styles.predictionDays, { color: colors.textMuted }]}>
          {prediction.daysFromNow} days
        </Text>
      </View>
      <View style={styles.predictionBody}>
        <Text style={[styles.predictionWeight, { color: colors.primary }]}>
          {prediction.predictedWeight} lbs
        </Text>
        <Text style={[styles.predictionRange, { color: colors.textMuted }]}>
          Range: {prediction.confidenceMin} - {prediction.confidenceMax}
        </Text>
      </View>
    </GlassCard>
  );

  // Check if we have enough data
  const hasEnoughData = state.weightHistory.length >= 7;

  if (!hasEnoughData) {
    return (
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="analytics" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Progress Prediction</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Predicting your journey
            </Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="hourglass" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            Building Your Model
          </Text>
          <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
            Log at least 7 days of weight data to unlock predictions
          </Text>
          <View style={styles.progressDots}>
            {[...Array(7)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      i < state.weightHistory.length ? colors.primary : colors.glassBorder,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {state.weightHistory.length}/7 days logged
          </Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Progress Prediction</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {state.trendAnalysis?.dataPoints || 0} data points analyzed
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.detailsButton, { backgroundColor: colors.cardGlass }]}
            onPress={() => setShowDetailsModal(true)}
          >
            <Ionicons name="stats-chart" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
              GOAL PROGRESS
            </Text>
            <Text style={[styles.progressValue, { color: colors.primary }]}>
              {percentComplete}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.cardGlass }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, percentComplete)}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressStats}>
            <Text style={[styles.progressStat, { color: colors.textSecondary }]}>
              {totalLost > 0 ? '+' : ''}{totalLost.toFixed(1)} lbs lost
            </Text>
            <Text style={[styles.progressStat, { color: colors.textSecondary }]}>
              {state.snapshot?.totalToLose.toFixed(1) || 0} lbs to go
            </Text>
          </View>
        </View>

        {/* Trend & Rate Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.cardGlass }]}
            onPress={() => setShowPredictionsModal(true)}
          >
            <Ionicons name={trendInfo.icon as any} size={24} color={trendInfo.color} />
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>TREND</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)}
            </Text>
          </TouchableOpacity>

          <View style={[styles.statCard, { backgroundColor: colors.cardGlass }]}>
            <Text style={[styles.rateValue, { color: colors.primary }]}>
              {Math.abs(weeklyRate).toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>LBS/WEEK</Text>
            <Text style={[styles.statSubvalue, { color: colors.textSecondary }]}>
              {weeklyRate < 0 ? 'losing' : weeklyRate > 0 ? 'gaining' : 'stable'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.cardGlass }]}
            onPress={() => setShowMilestonesModal(true)}
          >
            <Ionicons name="flag" size={24} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>MILESTONES</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {achievedMilestones.length}/{state.milestones.length}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plateau Warning */}
        {inPlateau && (
          <View style={[styles.plateauBanner, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="pause-circle" size={18} color="#F59E0B" />
            <View style={styles.plateauContent}>
              <Text style={[styles.plateauTitle, { color: '#F59E0B' }]}>
                Plateau Detected
              </Text>
              <Text style={[styles.plateauText, { color: colors.textSecondary }]}>
                {plateauSuggestions[0] || 'Stay consistent - this is normal!'}
              </Text>
            </View>
          </View>
        )}

        {/* Goal Date */}
        {goalDate && (
          <View style={[styles.goalDateCard, { backgroundColor: colors.primary + '15' }]}>
            <View style={styles.goalDateLeft}>
              <Ionicons name="calendar" size={22} color={colors.primary} />
              <View>
                <Text style={[styles.goalDateLabel, { color: colors.textMuted }]}>
                  PROJECTED GOAL DATE
                </Text>
                <Text style={[styles.goalDateValue, { color: colors.text }]}>
                  {formatGoalDate(goalDate)}
                </Text>
              </View>
            </View>
            {getDaysRemaining() && (
              <View style={styles.goalDateRight}>
                <Text style={[styles.goalDateDays, { color: colors.primary }]}>
                  {getDaysRemaining()}
                </Text>
                <Text style={[styles.goalDateRemaining, { color: colors.textMuted }]}>
                  remaining
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Next Milestone */}
        {nextMilestone && (
          <TouchableOpacity
            style={styles.nextMilestone}
            onPress={() => setShowMilestonesModal(true)}
          >
            <View style={[styles.milestoneProgressBar, { backgroundColor: colors.cardGlass }]}>
              <View
                style={[
                  styles.milestoneProgressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${nextMilestone.currentProgress}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.nextMilestoneInfo}>
              <Text style={[styles.nextMilestoneLabel, { color: colors.textMuted }]}>
                Next: {nextMilestone.label}
              </Text>
              <Text style={[styles.nextMilestonePercent, { color: colors.primary }]}>
                {nextMilestone.currentProgress}%
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </GlassCard>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Trend Analysis</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowDetailsModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {/* Trend Details */}
            <GlassCard style={styles.detailCard}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>Current Trend</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Direction:</Text>
                <View style={styles.detailValueRow}>
                  <Ionicons name={trendInfo.icon as any} size={18} color={trendInfo.color} />
                  <Text style={[styles.detailValue, { color: trendInfo.color }]}>
                    {trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Weekly Rate:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {Math.abs(weeklyRate).toFixed(2)} lbs/week
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Monthly Rate:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {Math.abs(state.trendAnalysis?.monthlyChange || 0).toFixed(2)} lbs/month
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Consistency:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {state.trendAnalysis?.consistency || 0}%
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Velocity:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {state.trendAnalysis?.velocityChange || 'steady'}
                </Text>
              </View>
            </GlassCard>

            {/* Goal Projection */}
            {state.goalProjection && (
              <GlassCard style={styles.detailCard}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>Goal Projection</Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                    Current Weight:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {state.goalProjection.currentWeight.toFixed(1)} lbs
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Goal Weight:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {state.goalProjection.goalWeight.toFixed(1)} lbs
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Remaining:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {Math.abs(state.goalProjection.weightToLose).toFixed(1)} lbs
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                    Projected Date:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>
                    {formatGoalDate(state.goalProjection.projectedDate)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Confidence:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {state.goalProjection.confidenceLevel}
                  </Text>
                </View>
              </GlassCard>
            )}

            {/* Plateau Info */}
            {inPlateau && (
              <GlassCard style={styles.detailCard}>
                <Text style={[styles.detailTitle, { color: '#F59E0B' }]}>Plateau Analysis</Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Duration:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {state.plateauInfo.plateauDuration} days
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                    Expected End:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatGoalDate(state.plateauInfo.expectedBreakthroughDate)}
                  </Text>
                </View>
                <Text style={[styles.suggestionsTitle, { color: colors.text }]}>Suggestions:</Text>
                {plateauSuggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <Ionicons name="bulb" size={16} color="#F59E0B" />
                    <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                      {suggestion}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Milestones Modal */}
      <Modal
        visible={showMilestonesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMilestonesModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Milestones</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowMilestonesModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {state.milestones.map((milestone, index) => renderMilestone(milestone, index))}
            {state.milestones.length === 0 && (
              <View style={styles.emptyMilestones}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Set a goal weight to track milestones
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Predictions Modal */}
      <Modal
        visible={showPredictionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPredictionsModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Weight Predictions</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowPredictionsModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {state.predictions.map(renderPrediction)}
            {state.predictions.length === 0 && (
              <View style={styles.emptyMilestones}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Need more data to generate predictions
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  detailsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressStat: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
    marginTop: 4,
  },
  statValue: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
  },
  statSubvalue: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  rateValue: {
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  plateauBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  plateauContent: {
    flex: 1,
  },
  plateauTitle: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  plateauText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 16,
  },
  goalDateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  goalDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalDateLabel: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
  },
  goalDateValue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
  },
  goalDateRight: {
    alignItems: 'flex-end',
  },
  goalDateDays: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  goalDateRemaining: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  nextMilestone: {
    gap: 6,
  },
  milestoneProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextMilestoneInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextMilestoneLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  nextMilestonePercent: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  emptyStateText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    padding: 16,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginTop: 12,
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: {
    flex: 1,
    marginLeft: 12,
  },
  milestoneName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  milestoneSubtext: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  milestoneProgress: {
    alignItems: 'flex-end',
  },
  milestonePercent: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  emptyMilestones: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  predictionItem: {
    padding: 14,
    marginBottom: 10,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  predictionDate: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  predictionDays: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  predictionBody: {},
  predictionWeight: {
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  predictionRange: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});
