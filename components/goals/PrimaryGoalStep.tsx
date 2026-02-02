import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { PrimaryGoal, useGoalWizard } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { lightImpact, selectionFeedback, rigidImpact } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';

// Tab bar constants (must match _layout.tsx)
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_MARGIN_BOTTOM = 12;
const FOOTER_EXTRA_PADDING = 24;

interface GoalOption {
  id: PrimaryGoal;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    subtitle: 'Burn fat, get lean',
    icon: 'flame-outline',
    color: Colors.error,
  },
  {
    id: 'build_muscle',
    title: 'Build Muscle',
    subtitle: 'Get stronger',
    icon: 'barbell-outline',
    color: Colors.success,
  },
  {
    id: 'maintain',
    title: 'Maintain',
    subtitle: 'Stay where you are',
    icon: 'shield-checkmark-outline',
    color: '#45B7D1',
  },
  {
    id: 'improve_health',
    title: 'Improve Health',
    subtitle: 'Feel better daily',
    icon: 'heart-outline',
    color: Colors.successMuted,
  },
  {
    id: 'custom',
    title: 'Custom Goal',
    subtitle: 'Define your own',
    icon: 'create-outline',
    color: '#DDA0DD',
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
                <Ionicons name={option.icon} size={32} color={isSelected ? option.color : colors.textMuted} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }, isSelected && { color: option.color }]}>
                {option.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{option.subtitle}</Text>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: option.color }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
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

  // Calculate footer bottom position to sit above the tab bar
  const footerBottom = TAB_BAR_HEIGHT + TAB_BAR_MARGIN_BOTTOM + FOOTER_EXTRA_PADDING;

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const handleSelect = (goalId: PrimaryGoal) => {
    setPrimaryGoal(goalId);
  };

  const handlePressIn = useCallback(() => {
    rigidImpact();
  }, []);

  const handleContinue = async () => {
    if (!state.primaryGoal) return;
    await lightImpact();
    onNext();
  };

  // iOS 26 Liquid Glass colors for button
  const glassButtonColors = {
    background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
    backgroundActive: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.10)',
    border: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
    text: isDark ? Colors.text : '#1D1D1F',
    textDisabled: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)',
  };

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: Colors.background,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {
      boxShadow: isDark
        ? '0px 8px 16px rgba(0, 0, 0, 0.4)'
        : '0px 8px 16px rgba(0, 0, 0, 0.12)',
    },
  });

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
      </ScrollView>

      {/* Frosted Liquid Glass Continue Button - Fixed at bottom above tab bar */}
      <View style={[styles.footer, { bottom: footerBottom }]}>
        <View>
          <Pressable
            onPress={handleContinue}
            onPressIn={handlePressIn}
            disabled={!state.primaryGoal}
            style={[
              styles.continueButton,
              !state.primaryGoal && styles.continueButtonDisabled,
            ]}
          >
            {/* Glass Background */}
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[
                StyleSheet.absoluteFill,
                styles.continueButtonBlur,
                {
                  backgroundColor: state.primaryGoal
                    ? glassButtonColors.backgroundActive
                    : glassButtonColors.background,
                  borderColor: glassButtonColors.border,
                },
                state.primaryGoal && shadowStyle,
              ]}
            />
            <Text style={[
              styles.continueButtonText,
              {
                color: state.primaryGoal
                  ? glassButtonColors.text
                  : glassButtonColors.textDisabled,
              },
            ]}>
              CONTINUE
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={state.primaryGoal ? glassButtonColors.text : glassButtonColors.textDisabled}
            />
          </Pressable>
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
    paddingBottom: 120, // Space to scroll past the fixed footer button
  },
  header: {
    marginTop: 16,
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
    fontFamily: Fonts.regular,
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
    borderRadius: 28,
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
    fontFamily: Fonts.regular,
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
  footer: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
      },
      default: {
        position: 'absolute' as any,
      },
    }),
    left: 16,
    right: 16,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    // bottom is set dynamically to sit above the floating tab bar
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    overflow: 'hidden',
  },
  continueButtonBlur: {
    borderRadius: 16,
    borderWidth: 1,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});
