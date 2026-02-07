import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { GoalType } from '../../constants/goals';
import { validateWeeklyChange } from '../../utils/goalCalculations';
import { useSettings } from '../../contexts/SettingsContext';

interface GoalStepProps {
  goalType: GoalType;
  setGoalType: (value: GoalType) => void;
  currentWeight: string;
  targetWeight: string;
  setTargetWeight: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  onBack: () => void;
  onCalculate: () => void;
}

export function GoalStep({
  goalType,
  setGoalType,
  currentWeight,
  targetWeight,
  setTargetWeight,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onBack,
  onCalculate,
}: GoalStepProps) {
  const { settings } = useSettings();
  const [weeklyChange, setWeeklyChange] = useState(0);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [warning, setWarning] = useState({ isWarning: false, message: '' });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds
  const cardBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.95)';
  const optionBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.9)';
  const inputBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.9)';
  const computedBg = isDark ? colors.background : 'rgba(245,245,245,0.9)';

  useEffect(() => {
    calculateWeeklyChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeight, targetWeight, startDate, endDate, goalType]);

  const calculateWeeklyChange = () => {
    if (goalType === 'maintain') {
      setWeeklyChange(0);
      setWarning({ isWarning: false, message: '' });
      return;
    }

    const current = parseFloat(currentWeight) || 0;
    const target = parseFloat(targetWeight) || 0;

    if (!current || !target || !startDate || !endDate) {
      setWeeklyChange(0);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const weeks = Math.max(1, diffDays / 7);
    const totalChange = target - current;
    const weekly = totalChange / weeks;

    setWeeklyChange(weekly);
    setTotalWeeks(weeks);

    const validationResult = validateWeeklyChange(goalType, weekly);
    setWarning(validationResult);
  };

  const handleGoalTypeChange = (type: GoalType) => {
    setGoalType(type);
    if (type === 'maintain') {
      setTargetWeight(currentWeight);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>What's Your Goal?</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Select your primary wellness objective.
        </Text>

        {/* Goal Type Selection */}
        <View style={styles.goalOptions}>
          <TouchableOpacity
            style={[styles.goalOption, { backgroundColor: optionBg, borderColor: colors.border }, goalType === 'lose' && [styles.goalOptionActive, { borderColor: colors.primary }]]}
            onPress={() => handleGoalTypeChange('lose')}
          >
            <View style={styles.goalIcon}>
              <Ionicons name="arrow-up" size={24} color={colors.text} />
            </View>
            <Text style={[styles.goalName, { color: colors.text }]}>Lose Weight</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.goalOption, { backgroundColor: optionBg, borderColor: colors.border }, goalType === 'maintain' && [styles.goalOptionActive, { borderColor: colors.primary }]]}
            onPress={() => handleGoalTypeChange('maintain')}
          >
            <View style={styles.goalIcon}>
              <Ionicons name="remove" size={24} color={colors.text} />
            </View>
            <Text style={[styles.goalName, { color: colors.text }]}>Maintain Weight</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.goalOption, { backgroundColor: optionBg, borderColor: colors.border }, goalType === 'gain' && [styles.goalOptionActive, { borderColor: colors.primary }]]}
            onPress={() => handleGoalTypeChange('gain')}
          >
            <View style={styles.goalIcon}>
              <Ionicons name="arrow-down" size={24} color={colors.text} />
            </View>
            <Text style={[styles.goalName, { color: colors.text }]}>Gain Weight</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Start Date */}
        <View style={styles.dateField}>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Plan Start Date</Text>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>We recommend starting today or tomorrow</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: inputBg, borderColor: colors.border }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(startDate)}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={new Date(startDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowStartPicker(Platform.OS === 'ios');
              if (selectedDate) {
                setStartDate(selectedDate.toISOString().split('T')[0]);
              }
            }}
          />
        )}

        {/* Timeline Fields (shown for lose/gain) */}
        {goalType !== 'maintain' && (
          <View style={styles.timelineFields}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Target Weight</Text>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  placeholder="160"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                <Text style={[styles.unit, { color: colors.textMuted }]}>lbs</Text>
              </View>
            </View>

            <View style={styles.dateField}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Target End Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: inputBg, borderColor: colors.border }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(endDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {showEndPicker && (
              <DateTimePicker
                value={new Date(endDate)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setEndDate(selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}

            {/* Weekly Change Display */}
            {weeklyChange !== 0 && (
              <View style={[styles.computedRate, { backgroundColor: computedBg, borderColor: colors.border }]}>
                <Text style={[styles.computedLabel, { color: colors.textMuted }]}>Estimated Weekly Change</Text>
                <Text style={[styles.computedValue, { color: colors.text }]}>
                  {weeklyChange > 0 ? '+' : ''}{Math.abs(weeklyChange).toFixed(2)} lb/week
                </Text>
                <Text style={[styles.computedNote, { color: colors.textMuted }]}>
                  Over {totalWeeks.toFixed(1)} weeks ({Math.round(totalWeeks * 7)} days)
                </Text>
              </View>
            )}

            {/* Warning */}
            {warning.isWarning && (
              <View style={styles.warningCallout}>
                <Ionicons name="warning" size={20} color="#ffaa00" />
                <Text style={styles.warningText}>{warning.message}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.buttonSecondary, { borderColor: colors.border }]} onPress={onBack}>
          <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: colors.primary }]} onPress={onCalculate}>
          <Text style={[styles.buttonPrimaryText, { color: colors.primaryText }]}>CALCULATE MY PLAN</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryText} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius + 8,
    padding: Spacing.cardPadding + 4,
    marginBottom: Spacing.sectionMargin,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  goalOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  goalOption: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius + 4,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  goalOptionActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  goalIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.text,
    textAlign: 'center',
  },
  dateField: {
    marginTop: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  timelineFields: {
    gap: 20,
    marginTop: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  unit: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  computedRate: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius,
    padding: 16,
    alignItems: 'center',
  },
  computedLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  computedValue: {
    fontSize: 24,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginBottom: 4,
  },
  computedNote: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  warningCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
    borderRadius: Spacing.borderRadius,
    padding: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#ffaa00',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 100,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    letterSpacing: 1,
    color: Colors.text,
  },
  buttonPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  buttonPrimaryText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    letterSpacing: 1,
    color: Colors.primaryText,
  },
});
