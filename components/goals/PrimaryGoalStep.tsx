import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Flame, Dumbbell, ShieldCheck, Heart, Check } from 'lucide-react-native';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { PrimaryGoal, useGoalWizard } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { lightImpact, selectionFeedback } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';

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
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
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
    router.back();
  };

  const handleContinue = async () => {
    if (!state.primaryGoal) return;
    await lightImpact();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Scrollable content area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>What's Your Goal?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleBack} style={{ flex: 1 }}>
            <GlassCard style={styles.backButton} interactive>
              <Text style={[styles.backButtonText, { color: colors.text }]}>EXIT</Text>
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!state.primaryGoal}
            style={{ flex: 2 }}
          >
            <GlassCard
              style={[
                styles.continueButton,
                state.primaryGoal && { backgroundColor: primaryGlassBg },
              ]}
              interactive
            >
              <Text style={[styles.continueButtonText, { color: state.primaryGoal ? colors.primary : colors.textMuted }]}>
                CONTINUE
              </Text>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    marginTop: 48,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 37,
    marginHorizontal: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
    color: Colors.text,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
  },
});
