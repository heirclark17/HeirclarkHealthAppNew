import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Flame, Dumbbell, ShieldCheck, Heart, Check, Target, ChevronRight } from 'lucide-react-native';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { PrimaryGoal, useGoalWizard } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { lightImpact, selectionFeedback } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';
import { WizardHeader } from './WizardHeader';

interface GoalOption {
  id: PrimaryGoal;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    subtitle: 'Burn fat, get lean',
    icon: Flame,
    color: Colors.error,
  },
  {
    id: 'build_muscle',
    title: 'Build Muscle',
    subtitle: 'Get stronger',
    icon: Dumbbell,
    color: Colors.success,
  },
  {
    id: 'maintain',
    title: 'Maintain',
    subtitle: 'Stay where you are',
    icon: ShieldCheck,
    color: '#45B7D1',
  },
  {
    id: 'improve_health',
    title: 'Improve Health',
    subtitle: 'Feel better daily',
    icon: Heart,
    color: Colors.successMuted,
  },
];

interface GoalCardProps {
  option: GoalOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  colors: typeof DarkColors;
  isDark: boolean;
  cardWidth: number;
}

function GoalCard({ option, isSelected, onSelect, index, colors, isDark, cardWidth }: GoalCardProps) {
  // iOS 26 Liquid Glass - subtle, translucent backgrounds
  const unselectedBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const selectedBg = isDark ? option.color + '15' : option.color + '12';
  const unselectedBorder = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const selectedBorder = option.color + '40';

  const handlePress = async () => {
    await selectionFeedback();
    onSelect();
  };

  return (
    <View style={[styles.cardWrapper, { width: cardWidth }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        accessibilityLabel={`${option.title}: ${option.subtitle}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityHint={`Select ${option.title} as your primary fitness goal`}
      >
        <View>
          <GlassCard
            style={[
              styles.card,
              isSelected && {
                borderColor: selectedBorder,
                borderWidth: 1.5,
              },
            ]}
            interactive
          >
            <View
              style={[
                styles.cardInner,
                {
                  backgroundColor: isSelected ? selectedBg : undefined,
                },
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                <option.icon size={32} color={isSelected ? option.color : colors.textMuted} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }, isSelected && { color: option.color }]}>
                {option.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{option.subtitle}</Text>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: option.color }]}>
                  <Check size={14} color="#fff" />
                </View>
              )}
            </View>
          </GlassCard>
        </View>
      </TouchableOpacity>
    </View>
  );
}

interface PrimaryGoalStepProps {
  onNext: () => void;
}

export function PrimaryGoalStep({ onNext }: PrimaryGoalStepProps) {
  const { state, setPrimaryGoal } = useGoalWizard();
  const { settings } = useSettings();
  const { width: screenWidth } = useWindowDimensions();

  // Calculate card width dynamically for 2-column grid
  const cardWidth = (screenWidth - 48 - 12) / 2; // screenWidth - horizontal padding - gap

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Translucent primary color for frosted glass button
  const primaryGlassBg = isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)';

  const handleSelect = (goalId: PrimaryGoal) => {
    setPrimaryGoal(goalId);
  };

  const handleBack = async () => {
    await lightImpact();
    router.replace('/');
  };

  const handleContinue = async () => {
    if (!state.primaryGoal) return;
    await lightImpact();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Modern Liquid Glass Sticky Header */}
      <WizardHeader
        currentStep={1}
        totalSteps={6}
        title="What's Your Goal?"
        icon={<Target size={36} color={isDark ? '#FFFFFF' : '#000000'} />}
        onBack={handleBack}
        isDark={isDark}
      />

      {/* Scrollable content area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer for sticky header */}
        <View style={{ height: Platform.OS === 'ios' ? 220 : 170 }} />

        <View style={styles.subtitle}>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
            Select your primary fitness objective. This helps us personalize your nutrition plan.
          </Text>
        </View>

        <View style={styles.grid}>
          {GOAL_OPTIONS.map((option, index) => (
            <GoalCard
              key={option.id}
              option={option}
              isSelected={state.primaryGoal === option.id}
              onSelect={() => handleSelect(option.id)}
              index={index}
              colors={colors}
              isDark={isDark}
              cardWidth={cardWidth}
            />
          ))}
        </View>

        {/* Bottom Spacing - extra space to prevent blending with buttons */}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!state.primaryGoal}
            activeOpacity={0.7}
            style={{ flex: 1 }}
            accessibilityLabel={state.primaryGoal ? 'Continue to next step' : 'Continue, select a goal first'}
            accessibilityRole="button"
            accessibilityState={{ disabled: !state.primaryGoal }}
            accessibilityHint={state.primaryGoal ? 'Proceeds to the next step in goal setup' : 'Select a primary fitness goal to continue'}
          >
            <GlassCard
              style={[
                styles.continueButton,
                { backgroundColor: state.primaryGoal ? primaryGlassBg : 'transparent' },
              ]}
              interactive
            >
              <ChevronRight size={28} color={state.primaryGoal ? colors.primary : colors.textMuted} />
            </GlassCard>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Content starts after sticky header
  },
  subtitle: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  cardWrapper: {
    // width is set dynamically via style prop
  },
  card: {
    width: '100%',
  },
  cardInner: {
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
    position: 'relative',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
  },
});
