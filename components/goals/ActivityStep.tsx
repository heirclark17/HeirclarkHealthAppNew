import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { ActivityLevel } from '../../constants/goals';
import { useSettings } from '../../contexts/SettingsContext';

interface ActivityOption {
  value: ActivityLevel;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    value: 'sedentary',
    name: 'Sedentary',
    description: 'Little or no exercise',
    icon: 'bed-outline',
  },
  {
    value: 'light',
    name: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    icon: 'walk-outline',
  },
  {
    value: 'moderate',
    name: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    icon: 'bicycle-outline',
  },
  {
    value: 'very',
    name: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    icon: 'fitness-outline',
  },
  {
    value: 'extra',
    name: 'Extra Active',
    description: 'Very hard exercise & physical job',
    icon: 'barbell-outline',
  },
];

interface ActivityStepProps {
  activity: ActivityLevel;
  setActivity: (value: ActivityLevel) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ActivityStep({
  activity,
  setActivity,
  onBack,
  onNext,
}: ActivityStepProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds
  const cardBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.95)';
  const optionBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.9)';
  const iconBg = isDark ? colors.background : 'rgba(245,245,245,0.9)';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Activity Level</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Choose the option that best describes your typical day.
        </Text>

        <View style={styles.options}>
          {ACTIVITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                { backgroundColor: optionBg, borderColor: colors.border },
                activity === option.value && [styles.optionActive, { borderColor: colors.primary }],
              ]}
              onPress={() => setActivity(option.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                <Ionicons name={option.icon} size={22} color={colors.text} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionName, { color: colors.text }]}>{option.name}</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.buttonSecondary, { borderColor: colors.border }]} onPress={onBack}>
          <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: colors.primary }]} onPress={onNext}>
          <Text style={[styles.buttonPrimaryText, { color: colors.primaryText }]}>CONTINUE</Text>
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
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius + 4,
    padding: 16,
  },
  optionActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
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
