/**
 * PrioritiesStep - Select top 3 priorities
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, Briefcase, Heart, BookOpen, Gamepad, Coffee } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { colors } from '@/constants/Theme';
import { Priority } from '@/types/planner';

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
  { id: 'health', label: 'Health & Fitness', icon: Target, color: colors.activeEnergy },
  { id: 'work', label: 'Work & Career', icon: Briefcase, color: colors.primary },
  { id: 'family', label: 'Family & Friends', icon: Heart, color: colors.protein },
  { id: 'learning', label: 'Learning', icon: BookOpen, color: colors.carbs },
  { id: 'hobbies', label: 'Hobbies', icon: Gamepad, color: colors.fat },
  { id: 'relaxation', label: 'Relaxation', icon: Coffee, color: colors.sleep },
];

export function PrioritiesStep({
  value,
  onChange,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
}: Props) {
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
          <Text style={styles.title}>What are your top priorities?</Text>
          <Text style={styles.subtitle}>
            Select up to 3 areas that matter most to you
          </Text>
          <Text style={styles.counter}>
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
                style={[
                  styles.priorityCard,
                  isSelected && {
                    borderColor: option.color,
                    borderWidth: 2,
                    backgroundColor: option.color + '20',
                  },
                ]}
                onPress={() => togglePriority(option.id)}
                activeOpacity={0.7}
              >
                <Icon
                  size={32}
                  color={isSelected ? option.color : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.priorityLabel,
                    isSelected && { color: option.color },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress */}
        <Text style={styles.progress}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Back"
            onPress={onPrevious}
            variant="secondary"
            style={{ flex: 1 }}
          />
          <Button
            title="Next"
            onPress={onNext}
            variant="primary"
            style={{ flex: 1 }}
            disabled={value.length === 0}
          />
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
    fontFamily: 'Urbanist_700Bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Urbanist_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  counter: {
    fontSize: 14,
    fontFamily: 'SFProRounded-Medium',
    color: colors.primary,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  priorityCard: {
    width: '45%',
    aspectRatio: 1.2,
    borderRadius: 16,
    backgroundColor: colors.surface + '40',
    borderWidth: 1,
    borderColor: colors.surface,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: colors.text,
    textAlign: 'center',
  },
  progress: {
    fontSize: 14,
    fontFamily: 'Urbanist_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
