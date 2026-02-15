/**
 * FlexibilityStep - How flexible is your schedule?
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, TrendingUp, Lock } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';
import { Flexibility } from '../../../types/planner';

interface Props {
  value?: Flexibility;
  onChange: (value: Flexibility) => void;
  onNext: () => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

const FLEXIBILITY_OPTIONS: {
  id: Flexibility;
  label: string;
  description: string;
  icon: any;
  color: string;
}[] = [
  {
    id: 'very',
    label: 'Very Flexible',
    description: 'I can easily adjust my schedule and move activities around',
    icon: Zap,
    color: Colors.carbs,
  },
  {
    id: 'somewhat',
    label: 'Somewhat Flexible',
    description: 'I have some fixed commitments but can adapt when needed',
    icon: TrendingUp,
    color: Colors.protein,
  },
  {
    id: 'not_very',
    label: 'Not Very Flexible',
    description: 'My schedule is pretty fixed with limited room for changes',
    icon: Lock,
    color: Colors.activeEnergy,
  },
];

export function FlexibilityStep({
  value,
  onChange,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
}: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const surfaceColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const surfaceBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>How flexible is your schedule?</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            This helps us optimize your daily timeline
          </Text>
        </View>

        {/* Flexibility Options */}
        <View style={styles.options}>
          {FLEXIBILITY_OPTIONS.map((option) => {
            const isSelected = value === option.id;
            const Icon = option.icon;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: surfaceColor,
                    borderColor: surfaceBorder,
                  },
                  isSelected && {
                    borderColor: option.color,
                    borderWidth: 2,
                    backgroundColor: option.color + '20',
                  },
                ]}
                onPress={() => onChange(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <Icon
                    size={32}
                    color={isSelected ? option.color : themeColors.textSecondary}
                  />
                  <View style={styles.optionText}>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: themeColors.text },
                        isSelected && { color: option.color },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: themeColors.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress */}
        <Text style={[styles.progress, { color: themeColors.textSecondary }]}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onPrevious}
            style={[styles.actionButton, { backgroundColor: surfaceColor, borderColor: surfaceBorder, borderWidth: 1 }]}
          >
            <Text style={[styles.actionButtonText, { color: themeColors.text }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            disabled={!value}
            style={[styles.actionButton, { backgroundColor: themeColors.primary, opacity: !value ? 0.5 : 1 }]}
          >
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>Next</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.light,
    textAlign: 'center',
    lineHeight: 24,
  },
  options: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: Fonts.light,
    lineHeight: 20,
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  actionButtonText: {
    fontFamily: Fonts.light,
    fontSize: 16,
    fontWeight: '200' as const,
  },
});
