// Adaptive TDEE Card Component
// Displays the user's adaptive metabolism on the dashboard with Liquid Glass design
// iOS 26 Liquid Glass Design

import React, { useState } from 'react';
import { Colors } from '../../../constants/Theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useAdaptiveTDEE } from '../../../contexts/AdaptiveTDEEContext';
import { TDEE_CONSTANTS } from '../../../types/adaptiveTDEE';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { Fonts } from '../../../constants/Theme';
import { NumberText } from '../../../components/NumberText';
import TDEEInsightModal from './TDEEInsightModal';
import { useGoalWizard } from '../../../contexts/GoalWizardContext';

interface AdaptiveTDEECardProps {
  onPress?: () => void;
}

export default function AdaptiveTDEECard({ onPress }: AdaptiveTDEECardProps) {
  const { state, recalculateTDEE, getRecommendedCalories } = useAdaptiveTDEE();
  const { state: goalState } = useGoalWizard();
  const { settings } = useSettings();
  const [showModal, setShowModal] = useState(false);
  const scale = useSharedValue(1);
  const isDark = settings.themeMode === 'dark';

  const { result, isCalculating, isEnabled, daysUntilReady } = state;

  // Get macros and calculated results from goal wizard
  const macros = goalState.results;
  const hasMacroData = macros && macros.calories > 0;

  // Animated press effect
  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get display values
  const adaptiveTDEE = result?.adaptiveTDEE || 0;
  const formulaTDEE = result?.formulaTDEE || 0;
  const confidence = result?.confidence || 'low';
  const dataPoints = result?.dataPoints || 0;
  const metabolismTrend = result?.metabolismTrend || 'normal';

  // Colors for dark/light mode
  const textColor = isDark ? Colors.text : Colors.card;
  const subtextColor = isDark ? Colors.textMuted : Colors.textMuted;
  const mutedColor = isDark ? Colors.textMuted : Colors.textMuted;

  // Determine status colors and icons
  const getStatusConfig = () => {
    if (!isEnabled) {
      return {
        color: Colors.accentGold,
        icon: 'time-outline' as const,
        label: 'Learning',
        sublabel: `${daysUntilReady} days until ready`,
      };
    }

    switch (confidence) {
      case 'high':
        return {
          color: Colors.successStrong,
          icon: 'checkmark-circle' as const,
          label: 'High Confidence',
          sublabel: `${dataPoints} weeks of data`,
        };
      case 'medium':
        return {
          color: Colors.restingEnergy,
          icon: 'analytics-outline' as const,
          label: 'Medium Confidence',
          sublabel: `${dataPoints} weeks of data`,
        };
      default:
        return {
          color: Colors.warningOrange,
          icon: 'hourglass-outline' as const,
          label: 'Building Confidence',
          sublabel: `${dataPoints} weeks of data`,
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Get metabolism trend display
  const getTrendDisplay = () => {
    if (!isEnabled) return null;

    switch (metabolismTrend) {
      case 'faster':
        return {
          icon: 'trending-up' as const,
          color: Colors.successStrong,
          text: `+${Math.abs(result?.differencePercent || 0)}% vs formula`,
        };
      case 'slower':
        return {
          icon: 'trending-down' as const,
          color: Colors.warningOrange,
          text: `${result?.differencePercent || 0}% vs formula`,
        };
      default:
        return {
          icon: 'remove-outline' as const,
          color: Colors.restingEnergy,
          text: 'Matches formula',
        };
    }
  };

  const trendDisplay = getTrendDisplay();

  return (
    <>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => setShowModal(true)}
          accessibilityLabel={`Adaptive TDEE: ${isEnabled ? `${adaptiveTDEE.toLocaleString()} calories per day, ${statusConfig.label}` : `Learning mode, ${daysUntilReady} days until ready`}`}
          accessibilityRole="button"
          accessibilityHint="Opens detailed TDEE insights modal with metabolism analysis, trend history, and personalized recommendations"
        >
          <GlassCard style={styles.cardContainer} interactive>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="flame" size={20} color={Colors.error} />
                </View>
                <View>
                  <Text style={[styles.title, { color: textColor }]}>Adaptive TDEE</Text>
                  <Text style={[styles.subtitle, { color: subtextColor }]}>Your true metabolism</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
                <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            {/* Main Content */}
            {isCalculating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.restingEnergy} />
                <Text style={[styles.loadingText, { color: subtextColor }]}>Calculating your metabolism...</Text>
              </View>
            ) : !isEnabled ? (
              // Not enough data state
              <View style={styles.notReadyContainer}>
                <View style={styles.progressRing}>
                  <NumberText weight="light" style={[styles.progressText, { color: textColor }]}>
                    {TDEE_CONSTANTS.MIN_DAYS_FOR_CALCULATION - daysUntilReady}
                  </NumberText>
                  <Text style={[styles.progressLabel, { color: subtextColor }]}>days logged</Text>
                </View>
                <View style={styles.notReadyInfo}>
                  <Text style={[styles.notReadyTitle, { color: textColor }]}>Learning Your Metabolism</Text>
                  <Text style={[styles.notReadyDesc, { color: subtextColor }]}>
                    Log your weight and meals daily. In {daysUntilReady} more days, we'll calculate
                    your true TDEE.
                  </Text>
                  <View style={styles.checklistContainer}>
                    <View style={styles.checklistItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={state.weightHistory.length > 0 ? Colors.successStrong : mutedColor}
                      />
                      <Text style={[styles.checklistText, { color: isDark ? Colors.textSecondary : Colors.textMuted }]}>Log daily weight</Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={state.calorieHistory.length > 0 ? Colors.successStrong : mutedColor}
                      />
                      <Text style={[styles.checklistText, { color: isDark ? Colors.textSecondary : Colors.textMuted }]}>Track meals</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              // Has data - show TDEE
              <View style={styles.tdeeContainer}>
                {/* Main TDEE Display */}
                <View style={styles.mainTDEE}>
                  <NumberText weight="light" style={[styles.tdeeValue, { color: textColor }]}>{adaptiveTDEE.toLocaleString()}</NumberText>
                  <Text style={[styles.tdeeUnit, { color: subtextColor }]}>cal/day</Text>
                </View>

                {/* Comparison Row */}
                <View style={[styles.comparisonRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                  <View style={styles.comparisonItem}>
                    <Text style={[styles.comparisonLabel, { color: mutedColor }]}>Formula Estimate</Text>
                    <NumberText weight="medium" style={[styles.comparisonValue, { color: isDark ? Colors.textSecondary : Colors.textMuted }]}>{formulaTDEE.toLocaleString()}</NumberText>
                  </View>
                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                  <View style={styles.comparisonItem}>
                    <Text style={[styles.comparisonLabel, { color: mutedColor }]}>Recommended</Text>
                    <NumberText weight="medium" style={[styles.comparisonValue, styles.recommendedValue]}>
                      {getRecommendedCalories().toLocaleString()}
                    </NumberText>
                  </View>
                </View>

                {/* Trend Indicator */}
                {trendDisplay && (
                  <View style={[styles.trendContainer, { backgroundColor: `${trendDisplay.color}15` }]}>
                    <Ionicons name={trendDisplay.icon} size={16} color={trendDisplay.color} />
                    <NumberText weight="medium" style={[styles.trendText, { color: trendDisplay.color }]}>
                      {trendDisplay.text}
                    </NumberText>
                  </View>
                )}
              </View>
            )}

            {/* Macro Breakdown (from Goal Wizard) */}
            {hasMacroData && (
              <View style={[styles.macroSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                <Text style={[styles.macroTitle, { color: mutedColor }]}>DAILY TARGETS</Text>
                <View style={styles.macroGrid}>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroLabel, { color: mutedColor }]}>Calories</Text>
                    <NumberText weight="semiBold" style={[styles.macroValue, { color: textColor }]}>
                      {macros.calories}
                    </NumberText>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroLabel, { color: mutedColor }]}>Protein</Text>
                    <NumberText weight="semiBold" style={[styles.macroValue, { color: textColor }]}>
                      {macros.protein}g
                    </NumberText>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroLabel, { color: mutedColor }]}>Carbs</Text>
                    <NumberText weight="semiBold" style={[styles.macroValue, { color: textColor }]}>
                      {macros.carbs}g
                    </NumberText>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroLabel, { color: mutedColor }]}>Fat</Text>
                    <NumberText weight="semiBold" style={[styles.macroValue, { color: textColor }]}>
                      {macros.fat}g
                    </NumberText>
                  </View>
                </View>
                <View style={styles.bmrRow}>
                  <View style={styles.bmrItem}>
                    <Text style={[styles.bmrLabel, { color: mutedColor }]}>BMR</Text>
                    <NumberText weight="medium" style={[styles.bmrValue, { color: textColor }]}>
                      {macros.bmr} cal
                    </NumberText>
                  </View>
                  <View style={styles.bmrItem}>
                    <Text style={[styles.bmrLabel, { color: mutedColor }]}>TDEE (formula)</Text>
                    <NumberText weight="medium" style={[styles.bmrValue, { color: textColor }]}>
                      {macros.tdee} cal
                    </NumberText>
                  </View>
                </View>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: mutedColor }]}>
                {isEnabled
                  ? 'Tap for insights and detailed breakdown'
                  : 'Tap for more information'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>

      <TDEEInsightModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  notReadyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  progressText: {
    fontSize: 24,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  notReadyInfo: {
    flex: 1,
  },
  notReadyTitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  notReadyDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    marginBottom: 12,
  },
  checklistContainer: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  tdeeContainer: {
    alignItems: 'center',
  },
  mainTDEE: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  tdeeValue: {
    fontSize: 48,
    letterSpacing: -1,
  },
  tdeeUnit: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginLeft: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 18,
  },
  recommendedValue: {
    color: Colors.successStrong,
  },
  divider: {
    width: 0,
    height: 30,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginRight: 4,
  },
  macroSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  macroTitle: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  macroItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
  },
  bmrRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    marginTop: 4,
  },
  bmrItem: {
    alignItems: 'center',
  },
  bmrLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  bmrValue: {
    fontSize: 14,
  },
});
