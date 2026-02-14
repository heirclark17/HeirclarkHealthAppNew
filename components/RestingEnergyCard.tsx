// RestingEnergyCard - Compact display for resting energy (BMR) with detailed modal
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
import { Moon, Activity, Gauge, Calendar, User, Dumbbell, Plus, ArrowRight, Info, CheckCircle, Clock, Users } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { Fonts, Colors, DarkColors, LightColors } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { lightImpact } from '../utils/haptics';

interface RestingEnergyCardProps {
  onPress?: () => void;
  restingEnergy?: number;
  goal?: number;
  weeklyRestingEnergy?: number;
}

export function RestingEnergyCard({
  onPress,
  restingEnergy = 0,
  goal = 1700,
  weeklyRestingEnergy = 0,
}: RestingEnergyCardProps) {
  const { settings } = useSettings();
  const [showModal, setShowModal] = useState(false);

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Calculate progress percentage (usually close to 100% since this is automatic)
  const percentage = useMemo(() => {
    if (goal <= 0) return 0;
    return Math.min((restingEnergy / goal) * 100, 100);
  }, [restingEnergy, goal]);

  // Determine color (resting energy is usually steady)
  const displayColor = Colors.restingEnergy;

  // BMR Categories (calories per hour)
  const caloriesPerHour = useMemo(() => {
    return Math.round(restingEnergy / 24);
  }, [restingEnergy]);

  const caloriesPerMinute = useMemo(() => {
    return (restingEnergy / 1440).toFixed(2);
  }, [restingEnergy]);

  // Weekly average
  const weeklyAverage = useMemo(() => {
    return Math.round(weeklyRestingEnergy / 7);
  }, [weeklyRestingEnergy]);

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
        accessibilityLabel={`Resting energy: ${restingEnergy > 0 ? Math.round(restingEnergy).toLocaleString() : '0'} kilocalories, Basal Metabolic Rate`}
        accessibilityRole="button"
        accessibilityHint="Opens detailed view with BMR breakdown, weekly average, and factors affecting metabolism"
      >
        <GlassCard style={styles.card} interactive>
          <View style={styles.innerContainer}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Moon size={24} color={colors.text} />
            </View>

            {/* Label */}
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
              RESTING
            </Text>

            {/* Resting Energy Value */}
            <Text style={[styles.value, { color: colors.text }]}>
              {restingEnergy > 0 ? Math.round(restingEnergy).toLocaleString() : '--'}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              kcal
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* Resting Energy Detail Modal */}
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
          accessibilityLabel="Close resting energy detail modal"
          accessibilityRole="button"
          accessibilityHint="Dismisses the detailed BMR view and returns to the main screen"
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.modalContent, { backgroundColor: isDark ? Colors.card : Colors.text }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Icon and Title */}
              <View style={styles.modalSection}>
                <View style={[styles.modalIconContainer, { backgroundColor: `${displayColor}20` }]}>
                  <Moon size={32} color={displayColor} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Resting Energy</Text>
                <Text style={[styles.modalValue, { color: displayColor }]}>
                  {Math.round(restingEnergy).toLocaleString()} kcal
                </Text>
                <View style={[styles.bmrBadge, { backgroundColor: `${displayColor}20` }]}>
                  <Activity size={16} color={displayColor} />
                  <Text style={[styles.bmrBadgeText, { color: displayColor }]}>
                    Basal Metabolic Rate
                  </Text>
                </View>
              </View>

              {/* What is Resting Energy */}
              <View style={[styles.infoCard, { backgroundColor: `${Colors.restingEnergy}10` }]}>
                <Info size={20} color={Colors.restingEnergy} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>What is Resting Energy?</Text>
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    This is the number of calories your body burns at rest to maintain vital functions like breathing,
                    circulation, and cell production. It represents your baseline metabolism and typically accounts for
                    60-75% of your total daily energy expenditure.
                  </Text>
                </View>
              </View>

              {/* Breakdown Stats */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ENERGY BREAKDOWN</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Clock size={20} color={Colors.restingEnergy} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{caloriesPerHour}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>kcal/hour</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Gauge size={20} color={Colors.restingEnergy} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{caloriesPerMinute}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>kcal/min</Text>
                </View>
              </View>

              {/* Weekly Consistency */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>WEEKLY AVERAGE</Text>
              <View style={[styles.weeklyContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.weeklyRow}>
                  <View style={styles.weeklyItem}>
                    <Text style={[styles.weeklyValue, { color: colors.text }]}>
                      {weeklyAverage.toLocaleString()}
                    </Text>
                    <Text style={[styles.weeklyLabel, { color: colors.textMuted }]}>Daily Average</Text>
                  </View>
                  <View style={[styles.weeklyDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                  <View style={styles.weeklyItem}>
                    <Text style={[styles.weeklyValue, { color: colors.text }]}>
                      {Math.round(weeklyRestingEnergy).toLocaleString()}
                    </Text>
                    <Text style={[styles.weeklyLabel, { color: colors.textMuted }]}>Weekly Total</Text>
                  </View>
                </View>
                <View style={[styles.consistencyRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={[styles.consistencyText, { color: colors.text }]}>
                    Your BMR is consistent, which is healthy and expected
                  </Text>
                </View>
              </View>

              {/* Factors Affecting BMR */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>FACTORS AFFECTING BMR</Text>
              <View style={[styles.factorsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.factorRow}>
                  <User size={16} color={Colors.restingEnergy} />
                  <Text style={[styles.factorText, { color: colors.text }]}>
                    <Text style={{ fontFamily: Fonts.semiBold }}>Body Composition:</Text> More muscle mass = higher BMR
                  </Text>
                </View>
                <View style={styles.factorRow}>
                  <Calendar size={16} color={Colors.restingEnergy} />
                  <Text style={[styles.factorText, { color: colors.text }]}>
                    <Text style={{ fontFamily: Fonts.semiBold }}>Age:</Text> BMR decreases ~2% per decade after 20
                  </Text>
                </View>
                <View style={styles.factorRow}>
                  <Users size={16} color={Colors.restingEnergy} />
                  <Text style={[styles.factorText, { color: colors.text }]}>
                    <Text style={{ fontFamily: Fonts.semiBold }}>Sex:</Text> Males typically have 5-10% higher BMR
                  </Text>
                </View>
                <View style={styles.factorRow}>
                  <Dumbbell size={16} color={Colors.restingEnergy} />
                  <Text style={[styles.factorText, { color: colors.text }]}>
                    <Text style={{ fontFamily: Fonts.semiBold }}>Activity Level:</Text> Regular exercise can boost BMR
                  </Text>
                </View>
              </View>

              {/* Comparison: BMR vs TDEE */}
              <View style={[styles.comparisonCard, { backgroundColor: `${Colors.success}10` }]}>
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonItem}>
                    <Text style={[styles.comparisonLabel, { color: colors.textMuted }]}>BMR (Resting)</Text>
                    <Text style={[styles.comparisonValue, { color: Colors.restingEnergy }]}>
                      {Math.round(restingEnergy)}
                    </Text>
                  </View>
                  <Plus size={20} color={colors.textMuted} />
                  <View style={styles.comparisonItem}>
                    <Text style={[styles.comparisonLabel, { color: colors.textMuted }]}>Activity</Text>
                    <Text style={[styles.comparisonValue, { color: Colors.activeEnergy }]}>
                      Variable
                    </Text>
                  </View>
                  <ArrowRight size={20} color={colors.textMuted} />
                  <View style={styles.comparisonItem}>
                    <Text style={[styles.comparisonLabel, { color: colors.textMuted }]}>TDEE</Text>
                    <Text style={[styles.comparisonValue, { color: Colors.success }]}>
                      Total
                    </Text>
                  </View>
                </View>
                <Text style={[styles.comparisonNote, { color: colors.textMuted }]}>
                  Your Total Daily Energy Expenditure (TDEE) = BMR + Active Energy + Digestion
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => setShowModal(false)}
                accessibilityLabel="Close resting energy detail modal"
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
    fontFamily: Fonts.numericRegular,
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
  bmrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  bmrBadgeText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
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
  consistencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  consistencyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  factorsContainer: {
    borderRadius: 12,
    padding: 16,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  factorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  comparisonCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  comparisonNote: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 16,
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

export default RestingEnergyCard;
