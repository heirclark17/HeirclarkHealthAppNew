import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';

interface DailyFatLossCardProps {
  caloriesIn: number;
  caloriesOut: number;
  weeklyTarget?: number; // Weekly weight change target from goals (negative for loss, positive for gain)
  goalType?: 'lose' | 'maintain' | 'gain';
}

export const DailyFatLossCard: React.FC<DailyFatLossCardProps> = ({
  caloriesIn,
  caloriesOut,
  weeklyTarget = 0,
  goalType = 'maintain',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const netCalories = caloriesIn - caloriesOut;
  const dailyFatChange = netCalories / 3500; // 1 lb = 3500 calories (positive = gain, negative = loss)
  const weeklyProjected = dailyFatChange * 7; // Project to weekly

  const isDeficit = netCalories < 0;
  const isSurplus = netCalories > 0;
  const isMaintenance = netCalories === 0;

  // Calculate progress toward weekly goal
  const dailyTarget = weeklyTarget / 7;
  const progressPercent = weeklyTarget !== 0
    ? Math.min(100, Math.abs((dailyFatChange / dailyTarget) * 100))
    : 0;
  const isOnTrack = goalType === 'lose'
    ? dailyFatChange <= dailyTarget // For loss, negative is good
    : goalType === 'gain'
      ? dailyFatChange >= dailyTarget // For gain, positive is good
      : Math.abs(dailyFatChange) < 0.01; // For maintenance

  const statusColor = isDeficit
    ? Colors.success
    : isSurplus
    ? Colors.error
    : Colors.warning;

  const statusText = isDeficit
    ? 'Deficit'
    : isSurplus
    ? 'Surplus'
    : 'Maintenance';

  const tintColor = isDeficit
    ? Colors.glassTintSuccess
    : isSurplus
    ? Colors.glassTintError
    : Colors.glassTintWarning;

  return (
    <GlassCard style={styles.card} tintColor={tintColor} interactive>
      {/* Collapsible Header */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.header}
        accessible={true}
        accessibilityLabel={`Daily Fat Loss card, ${isExpanded ? 'expanded' : 'collapsed'}`}
        accessibilityHint="Tap to expand or collapse"
        accessibilityRole="button"
      >
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DAILY FAT LOSS</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Click to expand • Based on net calories</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {/* Expandable Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Daily Progress Section */}
          <View style={styles.mainSection}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {isDeficit ? 'ESTIMATED FAT LOST TODAY' : isSurplus ? 'ESTIMATED FAT GAINED TODAY' : 'MAINTENANCE'}
            </Text>
            <Text style={[styles.fatLossValue, { color: colors.text }, isDeficit && { color: 'Colors.successStrong' }, isSurplus && { color: Colors.errorStrong }]}>
              {Math.abs(dailyFatChange).toFixed(3)} lbs
            </Text>
            {isDeficit && <Text style={[styles.helperText, { color: colors.textSecondary }]}>You're in a calorie deficit - great work!</Text>}
            {isSurplus && <Text style={[styles.helperText, { color: colors.textSecondary }]}>You're in a calorie surplus</Text>}
            {isMaintenance && <Text style={[styles.helperText, { color: colors.textSecondary }]}>Perfect maintenance</Text>}
          </View>

          {/* Weekly Target Section - Only show if user has a goal set */}
          {weeklyTarget !== 0 && (
            <View style={[styles.weeklyTargetSection, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <View style={styles.weeklyTargetHeader}>
                <Text style={[styles.label, { color: colors.textMuted }]}>WEEKLY TARGET</Text>
                <View style={[styles.trackingBadge, { backgroundColor: isOnTrack ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 107, 107, 0.15)' }]}>
                  <Ionicons
                    name={isOnTrack ? 'checkmark-circle' : 'alert-circle'}
                    size={12}
                    color={isOnTrack ? 'Colors.successStrong' : Colors.error}
                  />
                  <Text style={[styles.trackingText, { color: isOnTrack ? 'Colors.successStrong' : Colors.error }]}>
                    {isOnTrack ? 'On Track' : 'Off Track'}
                  </Text>
                </View>
              </View>

              <View style={styles.weeklyTargetRow}>
                <View style={styles.weeklyTargetItem}>
                  <Text style={[styles.weeklyTargetValue, { color: colors.text }]}>
                    {Math.abs(weeklyTarget).toFixed(1)}
                  </Text>
                  <Text style={[styles.weeklyTargetLabel, { color: colors.textMuted }]}>
                    lbs/{goalType === 'lose' ? 'loss' : goalType === 'gain' ? 'gain' : 'week'}
                  </Text>
                </View>
                <View style={[styles.weeklyTargetDivider, { backgroundColor: colors.border }]} />
                <View style={styles.weeklyTargetItem}>
                  <Text style={[
                    styles.weeklyTargetValue,
                    { color: isOnTrack ? 'Colors.successStrong' : Colors.error }
                  ]}>
                    {Math.abs(weeklyProjected).toFixed(1)}
                  </Text>
                  <Text style={[styles.weeklyTargetLabel, { color: colors.textMuted }]}>lbs/projected</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(progressPercent, 100)}%`,
                        backgroundColor: isOnTrack ? 'Colors.successStrong' : Colors.error,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressBarText, { color: colors.textMuted }]}>
                  {progressPercent.toFixed(0)}% of daily target
                </Text>
              </View>
            </View>
          )}

          <View style={styles.statusRow}>
            <View>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>STATUS</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: colors.text }]}>{statusText}</Text>
              </View>
            </View>
            <View style={styles.caloriesDiff}>
              <Text style={[styles.caloriesDiffValue, { color: statusColor }]}>
                {netCalories > 0 ? '+' : ''}{netCalories} cal
              </Text>
            </View>
          </View>

          <Text style={[styles.infoText, { color: colors.textMuted }]}>● 1 lb of fat = 3,500 calories</Text>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.sectionMargin,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  content: {
    marginTop: 16,
  },
  mainSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: Fonts.medium,
  },
  fatLossValue: {
    fontSize: 32,
    color: Colors.text,
    fontFamily: Fonts.numericRegular,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 8,
    fontFamily: Fonts.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  caloriesDiff: {
    alignItems: 'flex-end',
  },
  caloriesDiffValue: {
    fontSize: 20,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },
  infoText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    fontFamily: Fonts.regular,
  },
  weeklyTargetSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  weeklyTargetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackingText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  weeklyTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeklyTargetItem: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyTargetDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  weeklyTargetValue: {
    fontSize: 24,
    fontFamily: Fonts.numericBold,
    color: Colors.text,
  },
  weeklyTargetLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarText: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});
