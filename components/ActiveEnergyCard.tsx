// ActiveEnergyCard - Compact display for active energy burned with detailed modal
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
import { Zap, Clock, Dumbbell, Lightbulb, Bike, Footprints, Activity } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { Fonts, Colors, DarkColors, LightColors } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { lightImpact } from '../utils/haptics';

interface ActiveEnergyCardProps {
  onPress?: () => void;
  activeEnergy?: number;
  goal?: number;
  weeklyActiveEnergy?: number;
  weeklyGoal?: number;
}

export function ActiveEnergyCard({
  onPress,
  activeEnergy = 0,
  goal = 500,
  weeklyActiveEnergy = 0,
  weeklyGoal = 3500,
}: ActiveEnergyCardProps) {
  const { settings } = useSettings();
  const [showModal, setShowModal] = useState(false);

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Calculate progress percentage
  const percentage = useMemo(() => {
    if (goal <= 0) return 0;
    return Math.min((activeEnergy / goal) * 100, 100);
  }, [activeEnergy, goal]);

  // Calculate weekly progress
  const weeklyPercentage = useMemo(() => {
    if (weeklyGoal <= 0) return 0;
    return Math.min((weeklyActiveEnergy / weeklyGoal) * 100, 100);
  }, [weeklyActiveEnergy, weeklyGoal]);

  // Determine color based on progress
  const displayColor = useMemo(() => {
    if (percentage >= 100) return Colors.success;
    if (percentage >= 75) return colors.protein;
    if (percentage >= 50) return Colors.activeEnergy;
    return colors.textMuted;
  }, [percentage, colors.textMuted]);

  // Activity level classification
  const getActivityLevel = () => {
    if (activeEnergy >= goal) return { label: 'Highly Active', color: Colors.success, Icon: Zap };
    if (activeEnergy >= goal * 0.75) return { label: 'Active', color: colors.protein, Icon: Bike };
    if (activeEnergy >= goal * 0.5) return { label: 'Moderately Active', color: Colors.activeEnergy, Icon: Activity };
    return { label: 'Light Activity', color: colors.textMuted, Icon: Footprints };
  };

  const activityLevel = getActivityLevel();

  // Estimate workout minutes (rough estimate: ~8-10 cal/min for moderate activity)
  const estimatedMinutes = useMemo(() => {
    return Math.round(activeEnergy / 9);
  }, [activeEnergy]);

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
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={{ flex: 1 }}
        accessibilityLabel={`Active energy: ${activeEnergy > 0 ? Math.round(activeEnergy).toLocaleString() : '0'} kilocalories burned, ${percentage.toFixed(0)}% of ${goal} goal, ${activityLevel.label}`}
        accessibilityRole="button"
        accessibilityHint="Opens detailed view with activity breakdown, weekly summary, and intensity levels"
      >
        <GlassCard style={styles.card} interactive>
          <View style={styles.innerContainer}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Zap size={24} color={colors.text} />
            </View>

            {/* Label */}
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
              ACTIVE
            </Text>

            {/* Active Energy Value */}
            <Text style={[styles.value, { color: colors.text }]}>
              {activeEnergy > 0 ? Math.round(activeEnergy).toLocaleString() : '--'}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              kcal
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* Active Energy Detail Modal */}
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
          accessibilityLabel="Close active energy detail modal"
          accessibilityRole="button"
          accessibilityHint="Dismisses the detailed active energy view and returns to the main screen"
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.modalContent, { backgroundColor: isDark ? Colors.card : Colors.text }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Icon and Title */}
              <View style={styles.modalSection}>
                <View style={[styles.modalIconContainer, { backgroundColor: `${displayColor}20` }]}>
                  <Zap size={32} color={displayColor} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Active Energy</Text>
                <Text style={[styles.modalValue, { color: displayColor }]}>
                  {Math.round(activeEnergy).toLocaleString()} kcal
                </Text>
                <View style={[styles.activityBadge, { backgroundColor: `${activityLevel.color}20` }]}>
                  <activityLevel.Icon size={16} color={activityLevel.color} />
                  <Text style={[styles.activityBadgeText, { color: activityLevel.color }]}>
                    {activityLevel.label}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: colors.textMuted }]}>TODAY'S PROGRESS</Text>
                  <Text style={[styles.progressValue, { color: colors.text }]}>
                    {percentage.toFixed(0)}%
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
                <Text style={[styles.goalText, { color: colors.textMuted }]}>
                  Goal: {goal.toLocaleString()} kcal {(goal - activeEnergy) > 0 ? `• ${Math.round(goal - activeEnergy)} to go` : '• Achieved!'}
                </Text>
              </View>

              {/* Stats Grid */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACTIVITY BREAKDOWN</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Clock size={20} color={Colors.activeEnergy} />
                  <Text style={[styles.statValue, { color: colors.text }]}>~{estimatedMinutes}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active Minutes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Dumbbell size={20} color={Colors.error} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{percentage >= 100 ? '✓' : Math.round(percentage)}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {percentage >= 100 ? 'Complete' : '% of Goal'}
                  </Text>
                </View>
              </View>

              {/* Weekly Summary */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>WEEKLY SUMMARY</Text>
              <View style={[styles.weeklyContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.weeklyRow}>
                  <View style={styles.weeklyItem}>
                    <Text style={[styles.weeklyValue, { color: colors.text }]}>
                      {Math.round(weeklyActiveEnergy).toLocaleString()}
                    </Text>
                    <Text style={[styles.weeklyLabel, { color: colors.textMuted }]}>Total kcal</Text>
                  </View>
                  <View style={[styles.weeklyDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                  <View style={styles.weeklyItem}>
                    <Text style={[styles.weeklyValue, { color: colors.text }]}>
                      {Math.round(weeklyActiveEnergy / 7).toLocaleString()}
                    </Text>
                    <Text style={[styles.weeklyLabel, { color: colors.textMuted }]}>Daily Avg</Text>
                  </View>
                </View>
                <View style={[styles.weeklyProgressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                  <View
                    style={[
                      styles.weeklyProgressFill,
                      {
                        backgroundColor: weeklyPercentage >= 100 ? Colors.success : Colors.activeEnergy,
                        width: `${weeklyPercentage}%`,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.weeklyGoalText, { color: colors.textMuted }]}>
                  {weeklyPercentage.toFixed(0)}% of weekly goal ({weeklyGoal.toLocaleString()} kcal)
                </Text>
              </View>

              {/* Activity Levels Guide */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>ACTIVITY INTENSITY</Text>
              <View style={[styles.guideContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.guideRow}>
                  <Zap size={16} color={Colors.success} />
                  <Text style={[styles.guideText, { color: colors.text }]}>High: 100%+ of goal</Text>
                </View>
                <View style={styles.guideRow}>
                  <Bike size={16} color={colors.protein} />
                  <Text style={[styles.guideText, { color: colors.text }]}>Moderate: 75-99% of goal</Text>
                </View>
                <View style={styles.guideRow}>
                  <Activity size={16} color={Colors.activeEnergy} />
                  <Text style={[styles.guideText, { color: colors.text }]}>Light: 50-74% of goal</Text>
                </View>
                <View style={styles.guideRow}>
                  <Footprints size={16} color={colors.textMuted} />
                  <Text style={[styles.guideText, { color: colors.text }]}>Minimal: Below 50%</Text>
                </View>
              </View>

              {/* Tips */}
              <View style={[styles.tipsContainer, { backgroundColor: `${Colors.activeEnergy}10` }]}>
                <Lightbulb size={18} color={Colors.activeEnergy} />
                <Text style={[styles.tipsText, { color: colors.text }]}>
                  Active energy is calories burned through intentional movement like workouts, walking, and physical activity.
                  This excludes calories burned at rest (resting energy). Aim for consistent daily activity to meet your goals!
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => setShowModal(false)}
                accessibilityLabel="Close active energy detail modal"
                accessibilityRole="button"
                accessibilityHint="Returns to the main screen"
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
    justifyContent: 'space-between',
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: Fonts.numericRegular,
    textAlign: 'center',
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
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  activityBadgeText: {
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
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
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
    textAlign: 'center',
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
  guideContainer: {
    borderRadius: 12,
    padding: 16,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  guideText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    gap: 8,
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});

export default ActiveEnergyCard;
