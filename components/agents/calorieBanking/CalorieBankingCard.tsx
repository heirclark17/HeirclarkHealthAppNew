// Calorie Banking Card Component
// Shows weekly calorie budget with banking/borrowing status

import React, { useState, useEffect, useCallback } from 'react';
import { Colors } from '../../../constants/Theme';
import { GLASS_SPRING } from '../../../constants/Animations';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from '../../liquidGlass/GlassCard';
import { useGlassTheme } from '../../liquidGlass/useGlassTheme';
import { useCalorieBanking } from '../../../contexts/CalorieBankingContext';
import { BankingRecommendation } from '../../../types/calorieBanking';
import { NumberText } from '../../../components/NumberText';

interface CalorieBankingCardProps {
  currentConsumed: number;
  dailyTarget: number;
  onShowDetails?: () => void;
}

export default function CalorieBankingCard({
  currentConsumed,
  dailyTarget,
  onShowDetails,
}: CalorieBankingCardProps) {
  const {
    state,
    getRecommendation,
    bankToday,
    borrowToday,
    getSummary,
  } = useCalorieBanking();
  const { isDark } = useGlassTheme();

  const [recommendation, setRecommendation] = useState<BankingRecommendation | null>(null);
  const [summary, setSummary] = useState<{
    bankedCalories: number;
    daysRemaining: number;
    onTrack: boolean;
    weeklyRemaining: number;
  } | null>(null);
  const [isActing, setIsActing] = useState(false);

  const scale = useSharedValue(1);
  const bankProgress = useSharedValue(0);

  const textColor = isDark ? Colors.text : Colors.card;
  const subtextColor = isDark ? Colors.textMuted : Colors.textMuted;
  const mutedColor = isDark ? Colors.textMuted : Colors.textMuted;

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const [rec, sum] = await Promise.all([
        getRecommendation(currentConsumed),
        getSummary(),
      ]);
      setRecommendation(rec);
      if (sum) {
        setSummary({
          bankedCalories: sum.bankedCalories,
          daysRemaining: sum.daysRemaining,
          onTrack: sum.onTrack,
          weeklyRemaining: sum.weeklyRemaining,
        });
        // Animate bank progress
        const maxBank = 1500; // Default max
        bankProgress.value = withSpring((sum.bankedCalories / maxBank) * 100, GLASS_SPRING);
      }
    };
    loadData();
  }, [currentConsumed, getRecommendation, getSummary, state.currentWeek]);

  // Press animation
  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.abs(bankProgress.value))}%`,
  }));

  // Handle bank action
  const handleBank = async () => {
    if (!recommendation || recommendation.amount <= 0) return;

    setIsActing(true);
    try {
      await bankToday(recommendation.amount);
      Alert.alert(
        'Calories Banked!',
        `${recommendation.amount} calories saved for later this week.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to bank calories.');
    } finally {
      setIsActing(false);
    }
  };

  // Handle borrow action
  const handleBorrow = async () => {
    if (!recommendation || recommendation.amount <= 0) return;

    setIsActing(true);
    try {
      await borrowToday(recommendation.amount);
      Alert.alert(
        'Calories Borrowed!',
        `${recommendation.amount} calories borrowed from your bank.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to borrow calories.');
    } finally {
      setIsActing(false);
    }
  };

  // Get status config
  const getStatusConfig = () => {
    if (!summary) {
      return { icon: 'wallet-outline' as const, color: Colors.restingEnergy, label: 'Loading' };
    }

    if (summary.bankedCalories > 200) {
      return { icon: 'trending-up' as const, color: Colors.successStrong, label: 'Banked' };
    } else if (summary.bankedCalories < -200) {
      return { icon: 'trending-down' as const, color: Colors.warningOrange, label: 'Borrowed' };
    }
    return { icon: 'remove-outline' as const, color: Colors.restingEnergy, label: 'Balanced' };
  };

  const statusConfig = getStatusConfig();

  if (!state.settings.isEnabled) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onShowDetails}
      >
        <GlassCard variant="elevated" material="thick" interactive animated>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accentPurple + '20' }]}>
                <Ionicons name="wallet" size={20} color={colors.accentPurple} />
              </View>
              <View>
                <Text style={[styles.title, { color: textColor }]}>Calorie Bank</Text>
                <Text style={[styles.subtitle, { color: subtextColor }]}>
                  {summary ? `${summary.daysRemaining} days left` : 'Weekly budget'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
              <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Bank Balance Display */}
          <View style={styles.balanceContainer}>
            <View style={styles.balanceMain}>
              <NumberText weight="bold" style={[styles.balanceValue, { color: summary && summary.bankedCalories < 0 ? Colors.warningOrange : Colors.successStrong }]}>
                {summary ? (summary.bankedCalories >= 0 ? '+' : '') + summary.bankedCalories : '0'}
              </NumberText>
              <Text style={[styles.balanceUnit, { color: subtextColor }]}>cal banked</Text>
            </View>

            {/* Bank Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    progressStyle,
                    { backgroundColor: summary && summary.bankedCalories < 0 ? Colors.warningOrange : Colors.successStrong },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, { color: mutedColor }]}>0</Text>
                <Text style={[styles.progressLabel, { color: mutedColor }]}>1500 max</Text>
              </View>
            </View>
          </View>

          {/* Recommendation */}
          {recommendation && recommendation.type !== 'maintain' && (
            <View style={[styles.recommendationContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={styles.recommendationContent}>
                <Ionicons
                  name={recommendation.type === 'bank' ? 'arrow-down-circle' : 'arrow-up-circle'}
                  size={20}
                  color={recommendation.type === 'bank' ? Colors.successStrong : Colors.warningOrange}
                />
                <View style={styles.recommendationText}>
                  <Text style={[styles.recommendationTitle, { color: textColor }]}>
                    {recommendation.type === 'bank' ? 'Bank calories?' : 'Use banked calories?'}
                  </Text>
                  <Text style={[styles.recommendationDesc, { color: subtextColor }]}>
                    {recommendation.reason}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: recommendation.type === 'bank' ? Colors.successStrong : Colors.warningOrange },
                ]}
                onPress={recommendation.type === 'bank' ? handleBank : handleBorrow}
                disabled={isActing}
              >
                <NumberText weight="bold" style={styles.actionButtonText}>
                  {isActing ? '...' : recommendation.type === 'bank' ? `+${recommendation.amount}` : `-${recommendation.amount}`}
                </NumberText>
              </TouchableOpacity>
            </View>
          )}

          {/* Weekly Stats */}
          {summary && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <NumberText weight="semiBold" style={[styles.statValue, { color: textColor }]}>
                  {summary.weeklyRemaining.toLocaleString()}
                </NumberText>
                <Text style={[styles.statLabel, { color: mutedColor }]}>cal remaining</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
              <View style={styles.statItem}>
                <NumberText weight="semiBold" style={[styles.statValue, { color: textColor }]}>
                  {recommendation?.averageNeeded.toLocaleString() || dailyTarget}
                </NumberText>
                <Text style={[styles.statLabel, { color: mutedColor }]}>avg/day needed</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
              <View style={styles.statItem}>
                <Ionicons
                  name={summary.onTrack ? 'checkmark-circle' : 'alert-circle'}
                  size={18}
                  color={summary.onTrack ? Colors.successStrong : Colors.warningOrange}
                />
                <Text style={[styles.statLabel, { color: summary.onTrack ? Colors.successStrong : Colors.warningOrange }]}>
                  {summary.onTrack ? 'On track' : 'Behind'}
                </Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <Text style={[styles.footerText, { color: mutedColor }]}>
              Tap for detailed weekly view
            </Text>
            <Ionicons name="chevron-forward" size={16} color={mutedColor} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
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
    fontWeight: '600',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  balanceValue: {
    fontSize: 42,
    letterSpacing: -1,
  },
  balanceUnit: {
    fontSize: 14,
    marginLeft: 8,
  },
  progressContainer: {
    width: '100%',
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
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 10,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  recommendationText: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  recommendationDesc: {
    fontSize: 11,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  actionButtonText: {
    color: Colors.text,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    height: 30,
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
