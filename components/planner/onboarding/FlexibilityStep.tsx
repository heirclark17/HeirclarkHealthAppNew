/**
 * FlexibilityStep - How flexible is your schedule?
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, TrendingUp, Lock, Hand } from 'lucide-react-native';
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

  // DEBUG: Log render and theme state
  console.log('[FlexibilityStep] Rendering');
  console.log('[FlexibilityStep] isDark:', isDark);
  console.log('[FlexibilityStep] Title color:', isDark ? '#FFFFFF' : '#000000');
  console.log('[FlexibilityStep] themeColors.text:', themeColors.text);
  console.log('[FlexibilityStep] DarkColors:', DarkColors);
  console.log('[FlexibilityStep] LightColors:', LightColors);

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* DEBUG: Test view with solid background */}
        <View style={{ backgroundColor: 'red', padding: 10, marginBottom: 10 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>DEBUG: Can you see this red box and white text?</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000', backgroundColor: 'rgba(255,0,0,0.3)' }]}>How flexible is your schedule?</Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)', backgroundColor: 'rgba(0,255,0,0.3)' }]}>
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
                onPress={() => onChange(option.id)}
                activeOpacity={0.7}
              >
                <GlassCard style={[
                  styles.optionCard,
                  isSelected && { backgroundColor: option.color + '20' },
                ]}>
                  <View style={styles.optionContent}>
                    <Icon
                      size={32}
                      color={isSelected ? option.color : themeColors.textMuted}
                    />
                    <View style={styles.optionText}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: isDark ? '#FFFFFF' : '#000000', backgroundColor: 'rgba(255,255,0,0.2)' },
                          isSelected && { color: option.color, fontFamily: Fonts.numericSemiBold },
                        ]}
                      >
                        {option.label} [DEBUG: {isDark ? 'DARK' : 'LIGHT'}]
                      </Text>
                      <Text style={[styles.optionDescription, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)', backgroundColor: 'rgba(0,255,255,0.2)' }]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress */}
        <Text style={[styles.progress, { color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)' }]}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onPrevious} activeOpacity={0.7}>
            <GlassCard style={styles.actionButton} interactive>
              <View style={{ transform: [{ rotate: '-90deg' }, { scaleX: -1 }] }}>
                <Hand size={24} color={themeColors.text} />
              </View>
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            disabled={!value}
            activeOpacity={0.7}
            style={{ opacity: !value ? 0.5 : 1 }}
          >
            <GlassCard style={styles.actionButton} interactive>
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <Hand size={24} color={themeColors.primary} />
              </View>
            </GlassCard>
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
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
    lineHeight: 24,
  },
  options: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
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
    fontFamily: Fonts.numericSemiBold,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    lineHeight: 20,
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
