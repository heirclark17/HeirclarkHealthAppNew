/**
 * EnergyPeakStep - When is your peak energy time?
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sunrise, Sun, Sunset } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { colors } from '@/constants/Theme';
import { EnergyPeak } from '@/types/planner';

interface Props {
  value?: EnergyPeak;
  onChange: (value: EnergyPeak) => void;
  onNext: () => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

const ENERGY_OPTIONS: {
  id: EnergyPeak;
  label: string;
  description: string;
  time: string;
  icon: any;
  color: string;
}[] = [
  {
    id: 'morning',
    label: 'Morning Person',
    description: 'I'm most productive and energetic in the morning',
    time: '6 AM - 12 PM',
    icon: Sunrise,
    color: colors.protein,
  },
  {
    id: 'afternoon',
    label: 'Afternoon Peak',
    description: 'I hit my stride after lunch',
    time: '12 PM - 5 PM',
    icon: Sun,
    color: colors.carbs,
  },
  {
    id: 'evening',
    label: 'Night Owl',
    description: 'I'm most focused and creative in the evening',
    time: '5 PM - 10 PM',
    icon: Sunset,
    color: colors.sleep,
  },
];

export function EnergyPeakStep({
  value,
  onChange,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
}: Props) {
  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>When is your peak energy time?</Text>
          <Text style={styles.subtitle}>
            We'll schedule your workouts during this window
          </Text>
        </View>

        {/* Energy Options */}
        <View style={styles.options}>
          {ENERGY_OPTIONS.map((option) => {
            const isSelected = value === option.id;
            const Icon = option.icon;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
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
                    size={40}
                    color={isSelected ? option.color : colors.textSecondary}
                  />
                  <View style={styles.optionText}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && { color: option.color },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.optionTime}>{option.time}</Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
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
            disabled={!value}
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
  options: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 16,
    backgroundColor: colors.surface + '40',
    borderWidth: 1,
    borderColor: colors.surface,
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
    fontSize: 18,
    fontFamily: 'Urbanist_600SemiBold',
    color: colors.text,
  },
  optionTime: {
    fontSize: 14,
    fontFamily: 'SFProRounded-Medium',
    color: colors.primary,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Urbanist_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
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
