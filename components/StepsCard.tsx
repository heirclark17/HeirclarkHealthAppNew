// StepsCard - Compact display for daily steps with detailed modal
// Matches the design of TodaysWorkoutCard, FastingTimerCard, and HeartRateCard

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { Fonts, Colors, DarkColors, LightColors } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { lightImpact } from '../utils/haptics';

interface StepsCardProps {
  onPress?: () => void;
  steps?: number;
  goal?: number;
  weeklySteps?: number;
  weeklyGoal?: number;
}

export function StepsCard({
  onPress,
  steps = 0,
  goal = 10000,
  weeklySteps = 0,
  weeklyGoal = 70000,
}: StepsCardProps) {
  const { settings } = useSettings();
  const [showModal, setShowModal] = useState(false);

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Calculate progress percentage
  const percentage = useMemo(() => {
    if (goal <= 0) return 0;
    return Math.min((steps / goal) * 100, 100);
  }, [steps, goal]);

  // Calculate weekly progress
  const weeklyPercentage = useMemo(() => {
    if (weeklyGoal <= 0) return 0;
    return Math.min((weeklySteps / weeklyGoal) * 100, 100);
  }, [weeklySteps, weeklyGoal]);

  // Determine color based on progress
  const displayColor = useMemo(() => {
    if (percentage >= 100) return Colors.success;
    if (percentage >= 75) return Colors.successMuted;
    if (percentage >= 50) return '#F39C12';
    return colors.textMuted;
  }, [percentage, colors.textMuted]);

  // Calculate estimated distance (average stride ~2.5 feet)
  const distanceMiles = useMemo(() => {
    return ((steps * 2.5) / 5280).toFixed(2);
  }, [steps]);

  // Calculate estimated calories burned (rough estimate: 0.04 cal per step)
  const caloriesBurned = useMemo(() => {
    return Math.round(steps * 0.04);
  }, [steps]);

  const handlePress = async () => {
    await lightImpact();
    if (onPress) {
      onPress();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={{ flex: 1 }}>
        <GlassCard style={styles.card} interactive>
          <View style={styles.innerContainer}>
            {/* Label */}
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
              STEPS
            </Text>

            {/* Steps Value */}
            <View style={styles.valueContainer}>
              <Text style={[styles.value, { color: displayColor }]}>
                {steps > 0 ? steps.toLocaleString() : '--'}
              </Text>
              <Text style={[styles.goalText, { color: colors.textMuted }]}>
                of {goal.toLocaleString()}
              </Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* Steps Detail Modal */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.modalContent, { backgroundColor: isDark ? Colors.card : Colors.text }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Icon and Title */}
              <View style={styles.modalSection}>
                <View style={[styles.modalIconContainer, { backgroundColor: `${displayColor}20` }]}>
                  <Ionicons name="footsteps" size={32} color={displayColor} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Daily Steps</Text>
                <Text style={[styles.modalValue, { color: displayColor }]}>
                  {steps.toLocaleString()}
                </Text>
                <View style={[styles.progressBadge, { backgroundColor: `${displayColor}20` }]}>
                  <Ionicons
                    name={percentage >= 100 ? 'checkmark-circle' : 'time'}
                    size={16}
                    color={displayColor}
                  />
                  <Text style={[styles.progressBadgeText, { color: displayColor }]}>
                    {percentage.toFixed(0)}% of Goal
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: colors.textMuted }]}>TODAY'S PROGRESS</Text>
                  <Text style={[styles.progressValue, { color: colors.text }]}>
                    {(goal - steps) > 0 ? `${(goal - steps).toLocaleString()} to go` : 'Goal Achieved!'}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: displayColor,
                        width: `${percentage}%`,
                      }
                    ]}
                  />
                </View>
              </View>

              {/* Stats Grid */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACTIVITY BREAKDOWN</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Ionicons name="navigate" size={20} color={Colors.success} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{distanceMiles}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Miles</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Ionicons name="flame" size={20} color={Colors.error} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{caloriesBurned}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Calories</Text>
                </View>
              </View>

              {/* Weekly Summary */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>WEEKLY SUMMARY</Text>
              <View style={[styles.weeklyContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.weeklyRow}>
                  <View style={styles.weeklyItem}>
                    <Text style={[styles.weeklyValue, { color: colors.text }]}>
                      {weeklySteps.toLocaleString()}
                    </Text>
                    <Text style={[styles.weeklyLabel, { color: colors.textMuted }]}>Total Steps</Text>
                  </View>
                  <View style={[styles.weeklyDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                  <View style={styles.weeklyItem}>
                    <Text style={[styles.weeklyValue, { color: colors.text }]}>
                      {Math.round(weeklySteps / 7).toLocaleString()}
                    </Text>
                    <Text style={[styles.weeklyLabel, { color: colors.textMuted }]}>Daily Avg</Text>
                  </View>
                </View>
                <View style={[styles.weeklyProgressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                  <View
                    style={[
                      styles.weeklyProgressFill,
                      {
                        backgroundColor: weeklyPercentage >= 100 ? Colors.success : Colors.successMuted,
                        width: `${weeklyPercentage}%`,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.weeklyGoalText, { color: colors.textMuted }]}>
                  {weeklyPercentage.toFixed(0)}% of weekly goal ({weeklyGoal.toLocaleString()} steps)
                </Text>
              </View>

              {/* Tips */}
              <View style={[styles.tipsContainer, { backgroundColor: `${Colors.success}10` }]}>
                <Ionicons name="bulb" size={18} color={Colors.success} />
                <Text style={[styles.tipsText, { color: colors.text }]}>
                  {percentage >= 100
                    ? 'Amazing! You\'ve hit your daily goal. Keep up the great work!'
                    : percentage >= 75
                    ? 'You\'re almost there! Just a few more steps to reach your goal.'
                    : percentage >= 50
                    ? 'Halfway to your goal! A short walk can help you get there.'
                    : 'Get moving! Every step counts toward your daily goal.'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 12,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  goalText: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    borderRadius: 24,
    padding: 24,
  },
  modalSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 36,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  progressBadgeText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  progressContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  weeklyContainer: {
    borderRadius: 16,
    padding: 16,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weeklyItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyDivider: {
    width: 1,
    height: 50,
  },
  weeklyValue: {
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  weeklyLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  weeklyProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  weeklyProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  weeklyGoalText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 20,
    marginBottom: 16,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  closeButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});

export default StepsCard;
