/**
 * PrioritiesStep - Select top 3 priorities
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, Briefcase, Heart, BookOpen, Gamepad, Coffee } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';
import { Priority } from '../../../types/planner';

interface Props {
  value: Priority[];
  onChange: (value: Priority[]) => void;
  onNext: () => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

const PRIORITY_OPTIONS: {
  id: Priority;
  label: string;
  icon: any;
  color: string;
}[] = [
  { id: 'health', label: 'Health & Fitness', icon: Target, color: Colors.activeEnergy },
  { id: 'work', label: 'Work & Career', icon: Briefcase, color: Colors.restingEnergy },
  { id: 'family', label: 'Family & Friends', icon: Heart, color: Colors.protein },
  { id: 'learning', label: 'Learning', icon: BookOpen, color: Colors.carbs },
  { id: 'hobbies', label: 'Hobbies', icon: Gamepad, color: Colors.fat },
  { id: 'relaxation', label: 'Relaxation', icon: Coffee, color: Colors.accentPurple },
];

export function PrioritiesStep({
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
  const surfaceColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const surfaceBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';

  const togglePriority = (priority: Priority) => {
    if (value.includes(priority)) {
      onChange(value.filter((p) => p !== priority));
    } else {
      if (value.length < 3) {
        onChange([...value, priority]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>What are your top priorities?</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Select up to 3 areas that matter most to you
          </Text>
          <Text style={[styles.counter, { color: themeColors.text }]}>
            {value.length} / 3 selected
          </Text>
        </View>

        {/* Priority Grid */}
        <View style={styles.grid}>
          {PRIORITY_OPTIONS.map((option) => {
            const isSelected = value.includes(option.id);
            const Icon = option.icon;

            return (
              <TouchableOpacity
                key={option.id}
                style={styles.priorityCardOuter}
                onPress={() => togglePriority(option.id)}
                activeOpacity={0.7}
              >
                <GlassCard style={[
                  styles.priorityCard,
                  isSelected && { backgroundColor: option.color + '20' },
                ]}>
                  <Icon
                    size={32}
                    color={isSelected ? option.color : themeColors.textMuted}
                  />
                  <Text
                    style={[
                      styles.priorityLabel,
                      { color: themeColors.text },
                      isSelected && { color: option.color, fontFamily: Fonts.medium },
                    ]}
                  >
                    {option.label}
                  </Text>
                </GlassCard>
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
            disabled={value.length === 0}
            style={[styles.actionButton, { flex: 2, backgroundColor: themeColors.primary, opacity: value.length === 0 ? 0.5 : 1 }]}
          >
            <Text style={[styles.actionButtonText, { color: themeColors.primaryText }]}>Next</Text>
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
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  counter: {
    fontSize: 14,
    fontFamily: Fonts.numericMedium,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  priorityCardOuter: {
    width: '45%',
    aspectRatio: 1.2,
  },
  priorityCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.medium,
    fontSize: 16,
  },
});
