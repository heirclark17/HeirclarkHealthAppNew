// TDEE Insight Modal
// Detailed view of adaptive TDEE with insights and weekly history
// Uses Liquid Glass design for frosted glass effect

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useAdaptiveTDEE } from '../../../contexts/AdaptiveTDEEContext';
import { TDEE_CONSTANTS } from '../../../types/adaptiveTDEE';
import { GlassCard } from '../../liquidGlass/GlassCard';
import { useGlassTheme } from '../../liquidGlass/useGlassTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TDEEInsightModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TDEEInsightModal({ visible, onClose }: TDEEInsightModalProps) {
  const { state, getRecommendedCalories } = useAdaptiveTDEE();
  const { result, isEnabled, daysUntilReady } = state;
  const { isDark, getGlassBackground, getGlassBorder } = useGlassTheme();

  // Theme colors
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const subtextColor = isDark ? '#999999' : '#666666';
  const mutedColor = isDark ? '#666666' : '#999999';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: borderColor }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerIcon}>
          <Ionicons name="flame" size={24} color="#FF6B6B" />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: textColor }]}>Adaptive TDEE</Text>
          <Text style={[styles.headerSubtitle, { color: subtextColor }]}>
            {isEnabled ? 'Your personalized metabolism' : 'Learning in progress'}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: cardBg }]}>
        <Ionicons name="close" size={24} color={textColor} />
      </TouchableOpacity>
    </View>
  );

  const renderNotReady = () => (
    <View style={styles.notReadyContainer}>
      <View style={styles.progressCircle}>
        <Text style={[styles.progressNumber, { color: textColor }]}>
          {TDEE_CONSTANTS.MIN_DAYS_FOR_CALCULATION - daysUntilReady}
        </Text>
        <Text style={[styles.progressOf, { color: subtextColor }]}>
          / {TDEE_CONSTANTS.MIN_DAYS_FOR_CALCULATION}
        </Text>
        <Text style={[styles.progressLabel, { color: mutedColor }]}>days</Text>
      </View>

      <Text style={[styles.notReadyTitle, { color: textColor }]}>Building Your Profile</Text>
      <Text style={[styles.notReadyDesc, { color: subtextColor }]}>
        We need {daysUntilReady} more days of data to calculate your true TDEE.
        The adaptive algorithm analyzes your weight changes against calorie intake
        to determine your actual metabolism.
      </Text>

      <GlassCard variant="compact" material="thin" style={styles.tipCard}>
        <View style={styles.tipCardContent}>
          <Ionicons name="bulb-outline" size={20} color="#FFD700" />
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: '#FFD700' }]}>Tips for Accuracy</Text>
            <Text style={[styles.tipText, { color: isDark ? '#cccccc' : '#444444' }]}>
              • Weigh yourself daily, same time (morning before eating){'\n'}
              • Log all meals and snacks{'\n'}
              • Be consistent for best results
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderMainStats = () => {
    if (!result) return null;

    return (
      <View style={styles.mainStatsContainer}>
        {/* Adaptive TDEE */}
        <GlassCard variant="elevated" material="regular" style={styles.mainStatCard}>
          <Text style={[styles.statLabel, { color: subtextColor }]}>Your Adaptive TDEE</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.mainStatValue, { color: textColor }]}>{result.adaptiveTDEE.toLocaleString()}</Text>
            <Text style={[styles.statUnit, { color: subtextColor }]}>cal/day</Text>
          </View>
          <View style={[styles.confidenceBadge, { backgroundColor: cardBg }]}>
            <Ionicons
              name={result.confidence === 'high' ? 'checkmark-circle' : 'analytics'}
              size={14}
              color={result.confidence === 'high' ? '#4ADE80' : '#60A5FA'}
            />
            <Text style={[styles.confidenceText, { color: isDark ? '#cccccc' : '#444444' }]}>
              {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)} Confidence
              ({result.confidenceScore}%)
            </Text>
          </View>
        </GlassCard>

        {/* Comparison Stats */}
        <View style={styles.statsRow}>
          <GlassCard variant="compact" material="thin" style={styles.statBox}>
            <Text style={[styles.statBoxLabel, { color: mutedColor }]}>Formula TDEE</Text>
            <Text style={[styles.statBoxValue, { color: textColor }]}>{result.formulaTDEE.toLocaleString()}</Text>
            <Text style={[styles.statBoxSubtext, { color: mutedColor }]}>Mifflin-St Jeor</Text>
          </GlassCard>
          <GlassCard variant="compact" material="thin" style={styles.statBox}>
            <Text style={[styles.statBoxLabel, { color: mutedColor }]}>Difference</Text>
            <Text style={[
              styles.statBoxValue,
              { color: result.difference >= 0 ? '#4ADE80' : '#FB923C' }
            ]}>
              {result.difference >= 0 ? '+' : ''}{result.difference}
            </Text>
            <Text style={[styles.statBoxSubtext, { color: mutedColor }]}>
              {result.differencePercent >= 0 ? '+' : ''}{result.differencePercent}% variance
            </Text>
          </GlassCard>
        </View>

        {/* Recommended Calories */}
        <GlassCard variant="compact" material="thin" style={[styles.recommendedCard, { backgroundColor: 'rgba(74,222,128,0.1)' }]}>
          <View style={styles.recommendedHeader}>
            <Ionicons name="nutrition" size={20} color="#4ADE80" />
            <Text style={styles.recommendedTitle}>Recommended Daily Intake</Text>
          </View>
          <Text style={[styles.recommendedValue, { color: textColor }]}>
            {getRecommendedCalories().toLocaleString()} calories
          </Text>
          <Text style={[styles.recommendedSubtext, { color: subtextColor }]}>
            Based on your adaptive TDEE and goal
          </Text>
        </GlassCard>
      </View>
    );
  };

  const renderMetabolismInsight = () => {
    if (!result) return null;

    const getMood = () => {
      if (result.metabolismTrend === 'faster') {
        return {
          icon: 'happy-outline' as const,
          color: '#4ADE80',
          title: 'Your Metabolism is Higher Than Average',
          desc: `Great news! Your body burns ${Math.abs(result.difference)} more calories per day than formula predictions. This could be due to genetics, muscle mass, or activity level.`,
        };
      } else if (result.metabolismTrend === 'slower') {
        return {
          icon: 'information-circle-outline' as const,
          color: '#FB923C',
          title: 'Your Metabolism is Lower Than Average',
          desc: `Your body burns ${Math.abs(result.difference)} fewer calories than predicted. This is common and simply means we need to adjust your targets. Many successful dieters have "slower" metabolisms.`,
        };
      }
      return {
        icon: 'thumbs-up-outline' as const,
        color: '#60A5FA',
        title: 'Your Metabolism Matches Predictions',
        desc: `Your actual TDEE is within 8% of the formula prediction. The standard calculation works well for you!`,
      };
    };

    const mood = getMood();

    return (
      <GlassCard variant="compact" material="thin" style={[styles.insightCard, { borderColor: `${mood.color}30` }]}>
        <View style={styles.insightHeader}>
          <Ionicons name={mood.icon} size={24} color={mood.color} />
          <Text style={[styles.insightTitle, { color: mood.color }]}>{mood.title}</Text>
        </View>
        <Text style={[styles.insightDesc, { color: isDark ? '#cccccc' : '#444444' }]}>{mood.desc}</Text>
      </GlassCard>
    );
  };

  const renderWeeklyHistory = () => {
    if (!result || result.weeklyHistory.length === 0) return null;

    const recentWeeks = result.weeklyHistory.slice(-4).reverse();

    return (
      <View style={styles.historyContainer}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Weekly History</Text>
        <GlassCard variant="compact" material="ultraThin" noPadding>
          <View style={styles.historyTable}>
            <View style={[styles.historyHeader, { backgroundColor: cardBg }]}>
              <Text style={[styles.historyHeaderText, { flex: 1.5, color: mutedColor }]}>Week</Text>
              <Text style={[styles.historyHeaderText, { color: mutedColor }]}>Avg Weight</Text>
              <Text style={[styles.historyHeaderText, { color: mutedColor }]}>Avg Cals</Text>
              <Text style={[styles.historyHeaderText, { color: mutedColor }]}>TDEE</Text>
            </View>
            {recentWeeks.map((week, index) => (
              <View key={week.weekEndDate} style={[styles.historyRow, { borderBottomColor: borderColor }]}>
                <Text style={[styles.historyText, { flex: 1.5, color: isDark ? '#cccccc' : '#444444' }]}>
                  {new Date(week.weekEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={[styles.historyText, { color: isDark ? '#cccccc' : '#444444' }]}>{week.avgWeight} lb</Text>
                <Text style={[styles.historyText, { color: isDark ? '#cccccc' : '#444444' }]}>{week.avgCalories}</Text>
                <Text style={[styles.historyText, styles.historyTDEE]}>
                  {week.calculatedTDEE}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </View>
    );
  };

  const renderInsights = () => {
    if (!result || result.insights.length === 0) return null;

    return (
      <View style={styles.insightsContainer}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>AI Insights</Text>
        {result.insights.map((insight, index) => (
          <GlassCard key={index} variant="flat" material="ultraThin" style={styles.insightItem}>
            <View style={styles.insightItemContent}>
              <Ionicons name="sparkles" size={16} color="#FFD700" />
              <Text style={[styles.insightText, { color: isDark ? '#cccccc' : '#444444' }]}>{insight}</Text>
            </View>
          </GlassCard>
        ))}
      </View>
    );
  };

  const renderHowItWorks = () => (
    <View style={styles.howItWorksContainer}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>How Adaptive TDEE Works</Text>
      <View style={styles.howItWorksContent}>
        {[
          { num: '1', title: 'Track Your Data', desc: 'Log your weight and meals daily. The more consistent, the better.' },
          { num: '2', title: 'We Analyze Patterns', desc: 'Our algorithm compares weight changes to calorie intake to calculate your true TDEE.' },
          { num: '3', title: 'Continuous Learning', desc: 'Your TDEE updates weekly as we gather more data, becoming increasingly accurate.' },
        ].map((step, index) => (
          <View key={index} style={styles.howItWorksStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.num}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: textColor }]}>{step.title}</Text>
              <Text style={[styles.stepDesc, { color: subtextColor }]}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={Platform.OS === 'ios' ? 50 : 100} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
          <Animated.View
            entering={SlideInUp.springify()}
            style={styles.modalContainer}
          >
            {/* Modal background with glass effect */}
            <View style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? 'rgba(26,26,26,0.95)' : 'rgba(255,255,255,0.95)',
                borderColor: borderColor,
              }
            ]}>
              {/* Handle bar */}
              <View style={styles.handleBar}>
                <View style={[styles.handle, { backgroundColor: mutedColor }]} />
              </View>

              {renderHeader()}

              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {!isEnabled ? (
                  renderNotReady()
                ) : (
                  <>
                    {renderMainStats()}
                    {renderMetabolismInsight()}
                    {renderWeeklyHistory()}
                    {renderInsights()}
                  </>
                )}
                {renderHowItWorks()}
              </ScrollView>
            </View>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  notReadyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    marginBottom: 20,
  },
  progressNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  progressOf: {
    fontSize: 14,
    marginTop: -4,
  },
  progressLabel: {
    fontSize: 12,
  },
  notReadyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  notReadyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tipCard: {
    width: '100%',
  },
  tipCardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
  },
  mainStatsContainer: {
    marginBottom: 20,
  },
  mainStatCard: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 20,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mainStatValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 16,
    marginLeft: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statBoxLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statBoxSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  recommendedCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recommendedTitle: {
    fontSize: 13,
    color: '#4ADE80',
    fontWeight: '600',
  },
  recommendedValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  recommendedSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  insightCard: {
    marginBottom: 20,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  insightDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  historyContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  historyTable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  historyHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyText: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  historyTDEE: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  insightsContainer: {
    marginBottom: 20,
  },
  insightItem: {
    marginBottom: 8,
  },
  insightItemContent: {
    flexDirection: 'row',
    gap: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  howItWorksContainer: {
    marginTop: 10,
  },
  howItWorksContent: {
    gap: 16,
  },
  howItWorksStep: {
    flexDirection: 'row',
    gap: 14,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(96,165,250,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
});
