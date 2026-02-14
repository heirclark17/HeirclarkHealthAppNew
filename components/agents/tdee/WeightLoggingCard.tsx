// Weight Logging Card Component
// Allows users to log daily weight with liquid glass design
// Essential for Adaptive TDEE calculations
// iOS 26 Liquid Glass Design

import React, { useState, useEffect, useCallback } from 'react';
import { Colors } from '../../../constants/Theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { GlassCard } from '../../GlassCard';
import { useAdaptiveTDEE } from '../../../contexts/AdaptiveTDEEContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { Fonts } from '../../../constants/Theme';
import { NumberText } from '../../../components/NumberText';
import { BodyWeightLog } from '../../../types/adaptiveTDEE';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

interface WeightLoggingCardProps {
  onWeightLogged?: (weight: number) => void;
}

export default function WeightLoggingCard({ onWeightLogged }: WeightLoggingCardProps) {
  const { state, logWeight, getWeightHistory, getLatestWeight } = useAdaptiveTDEE();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';

  const [showModal, setShowModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [latestWeight, setLatestWeight] = useState<BodyWeightLog | null>(null);
  const [recentWeights, setRecentWeights] = useState<BodyWeightLog[]>([]);
  const [todayLogged, setTodayLogged] = useState(false);

  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  // Get unit from settings (default to lb)
  const weightUnit = settings.weightUnit || 'lb';

  // Text colors for theme
  const textColor = isDark ? Colors.text : Colors.card;
  const subtextColor = isDark ? Colors.textMuted : Colors.textMuted;
  const mutedColor = isDark ? Colors.textMuted : Colors.textMuted;

  // Load weight data
  const loadWeightData = useCallback(async () => {
    try {
      const [latest, history] = await Promise.all([
        getLatestWeight(),
        getWeightHistory(7), // Last 7 days
      ]);

      setLatestWeight(latest);
      setRecentWeights(history.slice(0, 7));

      // Check if weight was logged today
      const today = new Date().toISOString().split('T')[0];
      const loggedToday = history.some(log => log.date.startsWith(today));
      setTodayLogged(loggedToday);

      // Calculate streak progress (7 days = 100%)
      const streak = Math.min(history.length, 7);
      progressWidth.value = withSpring((streak / 7) * 100, GLASS_SPRING);
    } catch (error) {
      console.error('[WeightLoggingCard] Error loading weight data:', error);
    }
  }, [getLatestWeight, getWeightHistory]);

  useEffect(() => {
    loadWeightData();
  }, [loadWeightData, state.weightHistory]);

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
    width: `${progressWidth.value}%`,
  }));

  // Handle weight logging
  const handleLogWeight = async () => {
    const weight = parseFloat(weightInput);

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight value.');
      return;
    }

    // Basic validation: weight should be reasonable (50-700 lbs or equivalent in kg)
    const minWeight = weightUnit === 'kg' ? 23 : 50;
    const maxWeight = weightUnit === 'kg' ? 320 : 700;

    if (weight < minWeight || weight > maxWeight) {
      Alert.alert(
        'Check Weight',
        `Weight seems outside normal range. Please enter a value between ${minWeight} and ${maxWeight} ${weightUnit}.`
      );
      return;
    }

    setIsLogging(true);
    Keyboard.dismiss();

    try {
      await logWeight(weight, weightUnit);
      setWeightInput('');
      setShowModal(false);
      setTodayLogged(true);
      await loadWeightData();
      onWeightLogged?.(weight);
    } catch (error) {
      console.error('[WeightLoggingCard] Error logging weight:', error);
      Alert.alert('Error', 'Failed to log weight. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  // Format weight display
  const formatWeight = (log: BodyWeightLog) => {
    const displayWeight = weightUnit === log.unit
      ? log.weight
      : weightUnit === 'kg'
        ? log.weightKg
        : log.weightLbs;
    return `${displayWeight.toFixed(1)} ${weightUnit}`;
  };

  // Get weight change indicator
  const getWeightChange = () => {
    if (recentWeights.length < 2) return null;

    const current = recentWeights[0];
    const previous = recentWeights[1];
    const change = current.weightLbs - previous.weightLbs;
    const changeKg = current.weightKg - previous.weightKg;
    const displayChange = weightUnit === 'kg' ? changeKg : change;

    if (Math.abs(displayChange) < 0.1) {
      return { icon: 'remove-outline' as const, color: Colors.restingEnergy, text: 'Stable' };
    }

    return displayChange > 0
      ? { icon: 'trending-up' as const, color: Colors.warningOrange, text: `+${displayChange.toFixed(1)} ${weightUnit}` }
      : { icon: 'trending-down' as const, color: Colors.successStrong, text: `${displayChange.toFixed(1)} ${weightUnit}` };
  };

  const weightChange = getWeightChange();

  // Get mini chart data (last 7 days)
  const getMiniChartData = () => {
    if (recentWeights.length === 0) return [];

    const weights = recentWeights.map(w => weightUnit === 'kg' ? w.weightKg : w.weightLbs);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;

    return weights.map(w => ((w - min) / range) * 100).reverse();
  };

  const chartData = getMiniChartData();

  return (
    <>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => setShowModal(true)}
          accessibilityLabel={`Weight log: ${latestWeight ? `${formatWeight(latestWeight)}, ${weightChange?.text || 'no recent change'}` : 'no weight logged yet'}, ${todayLogged ? 'logged today' : 'not logged today'}, ${Math.min(recentWeights.length, 7)}-day streak`}
          accessibilityRole="button"
          accessibilityHint="Opens weight logging modal to enter your daily body weight for adaptive TDEE tracking"
        >
          <GlassCard style={styles.cardContainer} interactive>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
                  <Ionicons name="scale-outline" size={20} color={Colors.restingEnergy} />
                </View>
                <View>
                  <Text style={[styles.title, { color: textColor }]}>Weight Log</Text>
                  <Text style={[styles.subtitle, { color: subtextColor }]}>Track daily for accuracy</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: todayLogged ? 'rgba(74,222,128,0.2)' : 'rgba(251,146,60,0.2)' }
              ]}>
                <Ionicons
                  name={todayLogged ? 'checkmark-circle' : 'time-outline'}
                  size={14}
                  color={todayLogged ? Colors.successStrong : Colors.warningOrange}
                />
                <Text style={[styles.statusText, { color: todayLogged ? Colors.successStrong : Colors.warningOrange }]}>
                  {todayLogged ? 'Logged Today' : 'Not Logged'}
                </Text>
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.contentContainer}>
              {latestWeight ? (
                <>
                  {/* Current Weight Display */}
                  <View style={styles.weightDisplay}>
                    <NumberText weight="light" style={[styles.weightValue, { color: textColor }]}>
                      {formatWeight(latestWeight)}
                    </NumberText>
                    {weightChange && (
                      <View style={[styles.changeIndicator, { backgroundColor: `${weightChange.color}15` }]}>
                        <Ionicons name={weightChange.icon} size={14} color={weightChange.color} />
                        <NumberText weight="medium" style={[styles.changeText, { color: weightChange.color }]}>
                          {weightChange.text}
                        </NumberText>
                      </View>
                    )}
                  </View>

                  {/* Mini Trend Chart */}
                  {chartData.length > 1 && (
                    <View style={styles.miniChart}>
                      <Text style={[styles.chartLabel, { color: mutedColor }]}>7-Day Trend</Text>
                      <View style={styles.chartContainer}>
                        {chartData.map((height, index) => (
                          <View
                            key={index}
                            style={[
                              styles.chartBar,
                              {
                                height: Math.max(4, height * 0.4),
                                backgroundColor: index === chartData.length - 1 ? Colors.restingEnergy : (isDark ? '#444' : '#ddd'),
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Streak Progress */}
                  <View style={styles.streakContainer}>
                    <View style={styles.streakHeader}>
                      <Ionicons name="flame" size={14} color={Colors.warningOrange} />
                      <Text style={[styles.streakLabel, { color: subtextColor }]}>
                        Logging Streak: {Math.min(recentWeights.length, 7)} days
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                      <Animated.View style={[styles.progressFill, progressStyle]} />
                    </View>
                  </View>
                </>
              ) : (
                // No weight logged yet
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIcon, { backgroundColor: isDark ? 'rgba(96,165,250,0.1)' : 'rgba(96,165,250,0.15)' }]}>
                    <Ionicons name="add-circle-outline" size={32} color={Colors.restingEnergy} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>Start Tracking</Text>
                  <Text style={[styles.emptyDesc, { color: subtextColor }]}>
                    Log your weight daily to enable adaptive metabolism tracking
                  </Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <TouchableOpacity
                style={styles.logButton}
                onPress={() => setShowModal(true)}
                accessibilityLabel="Log weight"
                accessibilityRole="button"
                accessibilityHint="Opens weight entry form to log your current body weight"
              >
                <Ionicons name="add" size={18} color={textColor} />
                <Text style={[styles.logButtonText, { color: textColor }]}>Log Weight</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>

      {/* Weight Entry Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
            accessibilityLabel="Close weight logging modal"
            accessibilityRole="button"
            accessibilityHint="Dismisses the weight entry form and returns to weight log card"
          />
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.modalContainer}
          >
            <GlassCard variant="elevated" material="thick" style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Log Weight</Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.closeButton}
                  accessibilityLabel="Close weight entry form"
                  accessibilityRole="button"
                  accessibilityHint="Cancels weight logging and returns to weight log card"
                >
                  <Ionicons name="close" size={24} color={subtextColor} />
                </TouchableOpacity>
              </View>

              {/* Weight Input */}
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}>
                  <TextInput
                    style={[styles.weightInput, { color: textColor }]}
                    value={weightInput}
                    onChangeText={setWeightInput}
                    placeholder={latestWeight ? formatWeight(latestWeight).split(' ')[0] : '150'}
                    placeholderTextColor={mutedColor}
                    keyboardType="decimal-pad"
                    autoFocus
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleLogWeight}
                  />
                  <Text style={[styles.unitLabel, { color: subtextColor }]}>{weightUnit}</Text>
                </View>

                {latestWeight && (
                  <Text style={[styles.lastWeight, { color: subtextColor }]}>
                    Last logged: {formatWeight(latestWeight)} on{' '}
                    {new Date(latestWeight.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                )}
              </View>

              {/* Quick Adjust Buttons */}
              <View style={styles.quickAdjust}>
                <Text style={[styles.quickAdjustLabel, { color: subtextColor }]}>Quick Adjust</Text>
                <View style={styles.adjustButtons}>
                  {[-1, -0.5, 0.5, 1].map((delta) => (
                    <TouchableOpacity
                      key={delta}
                      style={[styles.adjustButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                      onPress={() => {
                        const current = parseFloat(weightInput) || (latestWeight ?
                          (weightUnit === 'kg' ? latestWeight.weightKg : latestWeight.weightLbs) : 150);
                        setWeightInput((current + delta).toFixed(1));
                      }}
                      accessibilityLabel={`${delta > 0 ? 'Add' : 'Subtract'} ${Math.abs(delta)} ${weightUnit}`}
                      accessibilityRole="button"
                      accessibilityHint={`Adjusts weight input by ${delta > 0 ? 'adding' : 'subtracting'} ${Math.abs(delta)} ${weightUnit}`}
                    >
                      <NumberText weight="medium" style={[styles.adjustButtonText, { color: delta > 0 ? Colors.warningOrange : Colors.successStrong }]}>
                        {delta > 0 ? '+' : ''}{delta}
                      </NumberText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLogging && styles.submitButtonDisabled]}
                onPress={handleLogWeight}
                disabled={isLogging}
                accessibilityLabel={isLogging ? 'Logging weight, please wait' : 'Log weight'}
                accessibilityRole="button"
                accessibilityState={{ disabled: isLogging, busy: isLogging }}
                accessibilityHint="Saves your weight entry to adaptive TDEE tracker and updates weight history"
              >
                {isLogging ? (
                  <Text style={[styles.submitButtonText, { color: textColor }]}>Logging...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={textColor} />
                    <Text style={[styles.submitButtonText, { color: textColor }]}>Log Weight</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Tips */}
              <View style={[styles.tipContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Ionicons name="bulb-outline" size={16} color={Colors.accentGold} />
                <Text style={[styles.tipText, { color: subtextColor }]}>
                  Weigh yourself at the same time each day, ideally in the morning, for the most consistent results.
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
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
  contentContainer: {
    alignItems: 'center',
  },
  weightDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  weightValue: {
    fontSize: 42,
    letterSpacing: -1,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  changeText: {
    fontSize: 12,
  },
  miniChart: {
    width: '100%',
    marginBottom: 16,
  },
  chartLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginBottom: 8,
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 40,
    gap: 8,
  },
  chartBar: {
    width: 16,
    borderRadius: 4,
    minHeight: 4,
  },
  streakContainer: {
    width: '100%',
    marginTop: 8,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  progressBar: {
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.warningOrange,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  logButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalCard: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  weightInput: {
    flex: 1,
    fontSize: 36,
    fontFamily: Fonts.light,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 20,
    fontFamily: Fonts.medium,
    marginLeft: 8,
  },
  lastWeight: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 12,
  },
  quickAdjust: {
    marginBottom: 20,
  },
  quickAdjustLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  adjustButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  adjustButtonText: {
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
});
