// Adaptive TDEE Card Component
// Displays the user's adaptive metabolism on the dashboard with Liquid Glass design

import React, { useState } from 'react';
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
import { GlassCard } from '../../liquidGlass/GlassCard';
import { useGlassTheme } from '../../liquidGlass/useGlassTheme';
import TDEEInsightModal from './TDEEInsightModal';

interface AdaptiveTDEECardProps {
  onPress?: () => void;
}

export default function AdaptiveTDEECard({ onPress }: AdaptiveTDEECardProps) {
  const { state, recalculateTDEE, getRecommendedCalories } = useAdaptiveTDEE();
  const [showModal, setShowModal] = useState(false);
  const scale = useSharedValue(1);
  const { isDark } = useGlassTheme();

  const { result, isCalculating, isEnabled, daysUntilReady } = state;

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
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const subtextColor = isDark ? '#999999' : '#666666';
  const mutedColor = isDark ? '#666666' : '#999999';

  // Determine status colors and icons
  const getStatusConfig = () => {
    if (!isEnabled) {
      return {
        color: '#FFD700',
        icon: 'time-outline' as const,
        label: 'Learning',
        sublabel: `${daysUntilReady} days until ready`,
      };
    }

    switch (confidence) {
      case 'high':
        return {
          color: '#4ADE80',
          icon: 'checkmark-circle' as const,
          label: 'High Confidence',
          sublabel: `${dataPoints} weeks of data`,
        };
      case 'medium':
        return {
          color: '#60A5FA',
          icon: 'analytics-outline' as const,
          label: 'Medium Confidence',
          sublabel: `${dataPoints} weeks of data`,
        };
      default:
        return {
          color: '#FB923C',
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
          color: '#4ADE80',
          text: `+${Math.abs(result?.differencePercent || 0)}% vs formula`,
        };
      case 'slower':
        return {
          icon: 'trending-down' as const,
          color: '#FB923C',
          text: `${result?.differencePercent || 0}% vs formula`,
        };
      default:
        return {
          icon: 'remove-outline' as const,
          color: '#60A5FA',
          text: 'Matches formula',
        };
    }
  };

  const trendDisplay = getTrendDisplay();

  return (
    <>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => setShowModal(true)}
        >
          <GlassCard variant="elevated" material="thick" interactive animated>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="flame" size={20} color="#FF6B6B" />
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
                <ActivityIndicator size="large" color="#60A5FA" />
                <Text style={[styles.loadingText, { color: subtextColor }]}>Calculating your metabolism...</Text>
              </View>
            ) : !isEnabled ? (
              // Not enough data state
              <View style={styles.notReadyContainer}>
                <View style={styles.progressRing}>
                  <Text style={[styles.progressText, { color: textColor }]}>
                    {TDEE_CONSTANTS.MIN_DAYS_FOR_CALCULATION - daysUntilReady}
                  </Text>
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
                        color={state.weightHistory.length > 0 ? '#4ADE80' : mutedColor}
                      />
                      <Text style={[styles.checklistText, { color: isDark ? '#cccccc' : '#444444' }]}>Log daily weight</Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={state.calorieHistory.length > 0 ? '#4ADE80' : mutedColor}
                      />
                      <Text style={[styles.checklistText, { color: isDark ? '#cccccc' : '#444444' }]}>Track meals</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              // Has data - show TDEE
              <View style={styles.tdeeContainer}>
                {/* Main TDEE Display */}
                <View style={styles.mainTDEE}>
                  <Text style={[styles.tdeeValue, { color: textColor }]}>{adaptiveTDEE.toLocaleString()}</Text>
                  <Text style={[styles.tdeeUnit, { color: subtextColor }]}>cal/day</Text>
                </View>

                {/* Comparison Row */}
                <View style={[styles.comparisonRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                  <View style={styles.comparisonItem}>
                    <Text style={[styles.comparisonLabel, { color: mutedColor }]}>Formula Estimate</Text>
                    <Text style={[styles.comparisonValue, { color: isDark ? '#cccccc' : '#444444' }]}>{formulaTDEE.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                  <View style={styles.comparisonItem}>
                    <Text style={[styles.comparisonLabel, { color: mutedColor }]}>Recommended</Text>
                    <Text style={[styles.comparisonValue, styles.recommendedValue]}>
                      {getRecommendedCalories().toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Trend Indicator */}
                {trendDisplay && (
                  <View style={[styles.trendContainer, { backgroundColor: `${trendDisplay.color}15` }]}>
                    <Ionicons name={trendDisplay.icon} size={16} color={trendDisplay.color} />
                    <Text style={[styles.trendText, { color: trendDisplay.color }]}>
                      {trendDisplay.text}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
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
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
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
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
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
    fontWeight: '400',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
    fontWeight: '300',
  },
  progressLabel: {
    fontSize: 10,
  },
  notReadyInfo: {
    flex: 1,
  },
  notReadyTitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  notReadyDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  checklistContainer: {
    gap: 6,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checklistText: {
    fontSize: 12,
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
    fontWeight: '200',
    letterSpacing: -1,
  },
  tdeeUnit: {
    fontSize: 16,
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
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 18,
    fontWeight: '400',
  },
  recommendedValue: {
    color: '#4ADE80',
  },
  divider: {
    width: 1,
    height: 30,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
    marginRight: 4,
  },
});
