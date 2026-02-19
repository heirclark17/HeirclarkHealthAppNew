import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Flame, Dumbbell, ShieldCheck, Heart, Check, Target, Hand } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { PrimaryGoal, useGoalWizard } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { lightImpact, selectionFeedback } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';
import { WizardHeader } from './WizardHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Card dimensions
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.3);
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;

// Fan spread constants
const FAN_ROTATION = 5;
const FAN_OFFSET_X = 14;
const FAN_OFFSET_Y = 6;
const BEHIND_SCALE = 0.94;

const GLASS_SPRING = { damping: 18, stiffness: 120, mass: 1 };

interface GoalOption {
  id: PrimaryGoal;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  gradient: [string, string];
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    subtitle: 'Burn fat, get lean',
    description: 'Calorie deficit focused plan with high protein to preserve muscle while shedding fat',
    icon: Flame,
    color: '#FF6B6B',
    gradient: ['#FF6B6B', '#EE5A24'],
  },
  {
    id: 'build_muscle',
    title: 'Build Muscle',
    subtitle: 'Get stronger',
    description: 'Calorie surplus with optimized protein timing to maximize lean muscle growth',
    icon: Dumbbell,
    color: '#4ECDC4',
    gradient: ['#4ECDC4', '#2ECC71'],
  },
  {
    id: 'maintain',
    title: 'Maintain',
    subtitle: 'Stay where you are',
    description: 'Balanced macros at maintenance calories to sustain your current physique',
    icon: ShieldCheck,
    color: '#45B7D1',
    gradient: ['#45B7D1', '#3498DB'],
  },
  {
    id: 'improve_health',
    title: 'Improve Health',
    subtitle: 'Feel better daily',
    description: 'Nutrient-dense eating focused on energy, sleep quality, and overall wellbeing',
    icon: Heart,
    color: '#A78BFA',
    gradient: ['#A78BFA', '#8B5CF6'],
  },
];

// ---------- Individual fanned goal card ----------

interface FanGoalCardProps {
  option: GoalOption;
  cardIndex: number;
  totalCards: number;
  currentIndex: Animated.SharedValue<number>;
  translateX: Animated.SharedValue<number>;
  isSelected: boolean;
  isDark: boolean;
}

function FanGoalCard({
  option,
  cardIndex,
  totalCards,
  currentIndex,
  translateX,
  isSelected,
  isDark,
}: FanGoalCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const ci = currentIndex.value % totalCards;
    const stackPos = ((cardIndex - ci) + totalCards) % totalCards;
    const isFront = stackPos === 0;

    const dragProgress = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );

    if (isFront) {
      const rotation = interpolate(
        translateX.value,
        [-SCREEN_WIDTH * 0.5, 0, SCREEN_WIDTH * 0.5],
        [-12, 0, 12],
        Extrapolation.CLAMP,
      );
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: 0 },
          { rotateZ: `${rotation}deg` },
          { scale: 1 },
        ],
        zIndex: 100,
        opacity: 1,
      };
    }

    const fanDir = stackPos % 2 === 1 ? 1 : -1;
    const fanRot = fanDir * stackPos * FAN_ROTATION;
    const fanX = fanDir * stackPos * FAN_OFFSET_X;
    const fanY = stackPos * FAN_OFFSET_Y;
    const scale = Math.max(0.85, 1 - stackPos * (1 - BEHIND_SCALE));

    if (stackPos === 1) {
      const rot = fanRot * (1 - dragProgress);
      const x = fanX * (1 - dragProgress);
      const y = fanY * (1 - dragProgress);
      const s = scale + (1 - scale) * dragProgress;
      return {
        transform: [
          { translateX: x },
          { translateY: y },
          { rotateZ: `${rot}deg` },
          { scale: s },
        ],
        zIndex: 99,
        opacity: 1,
      };
    }

    const prevFanDir = (stackPos - 1) % 2 === 1 ? 1 : -1;
    const prevRot = prevFanDir * (stackPos - 1) * FAN_ROTATION;
    const prevX = prevFanDir * (stackPos - 1) * FAN_OFFSET_X;
    const prevY = (stackPos - 1) * FAN_OFFSET_Y;
    const prevScale = Math.max(0.85, 1 - (stackPos - 1) * (1 - BEHIND_SCALE));

    const rot = fanRot + (prevRot - fanRot) * dragProgress;
    const x = fanX + (prevX - fanX) * dragProgress;
    const y = fanY + (prevY - fanY) * dragProgress;
    const s = scale + (prevScale - scale) * dragProgress;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotateZ: `${rot}deg` },
        { scale: s },
      ],
      zIndex: 100 - stackPos,
      opacity: 0.85,
    };
  });

  const IconComponent = option.icon;

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* Card background with gradient feel */}
      <View style={[styles.cardBackground, { backgroundColor: isDark ? '#1A1A2E' : '#FAFAFA' }]}>
        {/* Accent color bar at top */}
        <View style={[styles.cardAccentBar, { backgroundColor: option.color }]} />

        {/* Card content */}
        <View style={styles.cardContent}>
          {/* Large icon */}
          <View style={[styles.cardIconCircle, { backgroundColor: option.color + '18' }]}>
            <IconComponent size={64} color={option.color} strokeWidth={1.5} />
          </View>

          {/* Title */}
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#1A1A2E' }]}>
            {option.title}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.cardSubtitle, { color: option.color }]}>
            {option.subtitle}
          </Text>

          {/* Description */}
          <Text style={[styles.cardDescription, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }]}>
            {option.description}
          </Text>

          {/* Selected indicator */}
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: option.color }]}>
              <Check size={16} color="#fff" strokeWidth={3} />
              <Text style={styles.selectedText}>Selected</Text>
            </View>
          )}

          {/* Tap hint at bottom */}
          {!isSelected && (
            <Text style={[styles.tapHint, { color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' }]}>
              Tap to select
            </Text>
          )}
        </View>
      </View>

      {/* Frosted glass overlay for depth */}
      <View style={[styles.cardGlassEdge, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

      {/* Selected border glow */}
      {isSelected && (
        <View style={[styles.cardSelectedBorder, { borderColor: option.color + '60' }]} />
      )}
    </Animated.View>
  );
}

// ---------- Main component ----------

interface PrimaryGoalStepProps {
  onNext: () => void;
}

export function PrimaryGoalStep({ onNext }: PrimaryGoalStepProps) {
  const { state, setPrimaryGoal } = useGoalWizard();
  const { settings } = useSettings();

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const totalCards = GOAL_OPTIONS.length;
  const currentIndex = useSharedValue(0);
  const translateX = useSharedValue(0);
  const [displayIndex, setDisplayIndex] = useState(0);

  useAnimatedReaction(
    () => currentIndex.value,
    (val) => {
      runOnJS(setDisplayIndex)(val);
    },
  );

  const handleTapFront = useCallback(async () => {
    const idx = currentIndex.value % totalCards;
    const option = GOAL_OPTIONS[idx];
    await selectionFeedback();
    setPrimaryGoal(option.id);
  }, [totalCards, currentIndex, setPrimaryGoal]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetX([-15, 15])
      .failOffsetY([-10, 10])
      .onUpdate((e) => {
        'worklet';
        translateX.value = e.translationX;
      })
      .onEnd(() => {
        'worklet';
        if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
          const dir = translateX.value > 0 ? 1 : -1;
          translateX.value = withTiming(
            dir * SCREEN_WIDTH,
            { duration: 250 },
            (finished) => {
              'worklet';
              if (finished) {
                currentIndex.value = currentIndex.value + 1;
                translateX.value = 0;
              }
            },
          );
        } else {
          translateX.value = withSpring(0, GLASS_SPRING);
        }
      });

    const tap = Gesture.Tap().onEnd(() => {
      'worklet';
      runOnJS(handleTapFront)();
    });

    return Gesture.Exclusive(pan, tap);
  }, [totalCards, handleTapFront]);

  const handleBack = async () => {
    await lightImpact();
    router.replace('/');
  };

  const handleContinue = async () => {
    if (!state.primaryGoal) return;
    await lightImpact();
    onNext();
  };

  const activeIdx = displayIndex % totalCards;
  const containerHeight = CARD_HEIGHT + 40;

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <WizardHeader
        currentStep={1}
        totalSteps={6}
        title="What's Your Goal?"
        icon={<Target size={36} color={isDark ? '#FFFFFF' : '#000000'} />}
        onBack={handleBack}
        isDark={isDark}
      />

      {/* Content */}
      <View style={styles.contentArea}>
        {/* Spacer for sticky header */}
        <View style={{ height: Platform.OS === 'ios' ? 220 : 170 }} />

        <View style={styles.subtitle}>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
            Swipe to browse, tap to select
          </Text>
        </View>

        {/* Card Fan Stack */}
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.stackContainer, { height: containerHeight }]}>
            {[...GOAL_OPTIONS].reverse().map((option, reverseI) => {
              const i = GOAL_OPTIONS.length - 1 - reverseI;
              return (
                <FanGoalCard
                  key={option.id}
                  option={option}
                  cardIndex={i}
                  totalCards={totalCards}
                  currentIndex={currentIndex}
                  translateX={translateX}
                  isSelected={state.primaryGoal === option.id}
                  isDark={isDark}
                />
              );
            })}
          </Animated.View>
        </GestureDetector>

        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {GOAL_OPTIONS.map((option, i) => {
            const isActive = activeIdx === i;
            const isGoalSelected = state.primaryGoal === option.id;
            return (
              <View
                key={option.id}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isGoalSelected
                      ? option.color
                      : isActive
                        ? colors.text
                        : colors.textMuted,
                    width: isActive ? 20 : 6,
                    opacity: isActive ? 1 : isGoalSelected ? 0.8 : 0.3,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Current card label */}
        <Text style={[styles.cardCounter, { color: colors.textMuted }]}>
          {activeIdx + 1} of {totalCards}
        </Text>
      </View>

      {/* Bottom Continue Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!state.primaryGoal}
            activeOpacity={0.7}
            accessibilityLabel={state.primaryGoal ? 'Continue to next step' : 'Continue, select a goal first'}
            accessibilityRole="button"
            accessibilityState={{ disabled: !state.primaryGoal }}
            accessibilityHint={state.primaryGoal ? 'Proceeds to the next step in goal setup' : 'Select a primary fitness goal to continue'}
          >
            <GlassCard
              style={styles.continueButton}
              interactive
            >
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <Hand size={24} color={state.primaryGoal ? colors.primary : colors.textMuted} />
              </View>
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
  contentArea: {
    flex: 1,
  },
  subtitle: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
  },
  stackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  cardBackground: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardAccentBar: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  cardIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 28,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  selectedText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  tapHint: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  cardGlassEdge: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    pointerEvents: 'none',
  },
  cardSelectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 2,
    pointerEvents: 'none',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  cardCounter: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
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
    justifyContent: 'center',
  },
  continueButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
