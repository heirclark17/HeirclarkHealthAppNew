import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Check, Target, Hand } from 'lucide-react-native';
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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { PrimaryGoal, useGoalWizard } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { lightImpact, selectionFeedback } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';
import { WizardHeader } from './WizardHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://heirclarkinstacartbackend-production.up.railway.app';

// Card dimensions — slightly taller for image-based cards
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.25);
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;

// Fan spread constants
const FAN_ROTATION = 6;
const FAN_OFFSET_X = 18;
const FAN_OFFSET_Y = 4;
const BEHIND_SCALE = 0.95;

const GLASS_SPRING = { damping: 18, stiffness: 120, mass: 1 };

interface GoalOption {
  id: PrimaryGoal;
  imageType: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  fallbackBg: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'lose_weight',
    imageType: 'goal_lose_weight',
    title: 'Lose Weight',
    subtitle: 'Burn fat, get lean',
    description: 'Calorie deficit focused plan with high protein to preserve muscle while shedding fat',
    color: '#FF6B6B',
    fallbackBg: '#F8E8E8',
  },
  {
    id: 'build_muscle',
    imageType: 'goal_build_muscle',
    title: 'Build Muscle',
    subtitle: 'Get stronger',
    description: 'Calorie surplus with optimized protein timing to maximize lean muscle growth',
    color: '#4ECDC4',
    fallbackBg: '#E4F5F3',
  },
  {
    id: 'maintain',
    imageType: 'goal_maintain',
    title: 'Maintain',
    subtitle: 'Stay where you are',
    description: 'Balanced macros at maintenance calories to sustain your current physique',
    color: '#45B7D1',
    fallbackBg: '#E3F1F7',
  },
  {
    id: 'improve_health',
    imageType: 'goal_improve_health',
    title: 'Improve Health',
    subtitle: 'Feel better daily',
    description: 'Nutrient-dense eating focused on energy, sleep quality, and overall wellbeing',
    color: '#A78BFA',
    fallbackBg: '#EDE8F9',
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
  imageUrl?: string;
}

function FanGoalCard({
  option,
  cardIndex,
  totalCards,
  currentIndex,
  translateX,
  isSelected,
  imageUrl,
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
        [-15, 0, 15],
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

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* AI-generated pastel image background */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={400}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: option.fallbackBg }]} />
      )}

      {/* Gradient overlay for text legibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)']}
        locations={[0.25, 0.45, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Selected checkmark - top right */}
      {isSelected && (
        <View style={[styles.selectedCheck, { backgroundColor: option.color }]}>
          <Check size={18} color="#fff" strokeWidth={3} />
        </View>
      )}

      {/* Bottom text content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          {option.title}
        </Text>
        <Text style={[styles.cardSubtitle, { color: option.color }]}>
          {option.subtitle}
        </Text>
        <Text style={styles.cardDescription}>
          {option.description}
        </Text>

        {/* Selection state */}
        {isSelected ? (
          <View style={[styles.selectedPill, { backgroundColor: option.color }]}>
            <Check size={14} color="#fff" strokeWidth={3} />
            <Text style={styles.selectedPillText}>Selected</Text>
          </View>
        ) : (
          <Text style={styles.tapHint}>Tap to select</Text>
        )}
      </View>

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
  const [cardImages, setCardImages] = useState<Record<string, string>>({});

  useAnimatedReaction(
    () => currentIndex.value,
    (val) => {
      runOnJS(setDisplayIndex)(val);
    },
  );

  // Fetch AI-generated card images from backend
  useEffect(() => {
    GOAL_OPTIONS.forEach(async (option) => {
      if (cardImages[option.imageType]) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        const resp = await fetch(`${API_URL}/api/v1/card-image?type=${option.imageType}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = await resp.json();
          if (data.url) {
            setCardImages((prev) => ({ ...prev, [option.imageType]: data.url }));
          }
        }
      } catch (err) {
        console.log('[GoalCards] Image fetch error for', option.imageType);
      }
    });
  }, []);

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
                  imageUrl={cardImages[option.imageType]}
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
    fontFamily: Fonts.numericSemiBold,
    color: Colors.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
  },
  stackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 20,
  },
  cardTitle: {
    fontSize: 30,
    fontFamily: Fonts.numericBold,
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.numericSemiBold,
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: Fonts.numericRegular,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 19,
    marginBottom: 16,
  },
  selectedCheck: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedPillText: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  tapHint: {
    fontSize: 12,
    fontFamily: Fonts.numericRegular,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
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
    fontFamily: Fonts.numericRegular,
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
