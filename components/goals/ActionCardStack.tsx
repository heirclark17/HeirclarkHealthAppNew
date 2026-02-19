import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Utensils, Dumbbell, ChevronRight } from 'lucide-react-native';

import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 180;
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;
const BEHIND_SCALE_STEP = 0.05;
const BEHIND_Y_STEP = 10;

const GLASS_SPRING = { damping: 18, stiffness: 120, mass: 1 };

// Accent gradients per card type — premium dark glass look
const CARD_GRADIENTS: Record<string, [string, string, string]> = {
  coaching: ['#0f2027', '#203a43', '#2c5364'],
  mealPlan: ['#1a0a2e', '#2d1b4e', '#1a0a2e'],
  trainingPlan: ['#0a1628', '#162a4a', '#0a1628'],
};

const CARD_ACCENT: Record<string, string> = {
  coaching: '#4ECDC4',
  mealPlan: '#FF6B6B',
  trainingPlan: '#00D9F5',
};

interface CardDef {
  id: string;
  type: 'coaching' | 'mealPlan' | 'trainingPlan';
  title: string;
  subtitle: string;
  loadingTitle: string;
  loadingSubtitle: string;
  icon: React.ReactNode;
  accent: string;
  onPress: () => void;
  isLoading: boolean;
}

interface ActionCardStackProps {
  onViewAvatar?: () => void;
  onStartMealPlan?: () => void;
  onStartTrainingPlan?: () => void;
  isGeneratingMealPlan?: boolean;
  isGeneratingTrainingPlan?: boolean;
  workoutsPerWeek?: number;
  primaryGoal?: string;
}

export function ActionCardStack({
  onViewAvatar,
  onStartMealPlan,
  onStartTrainingPlan,
  isGeneratingMealPlan = false,
  isGeneratingTrainingPlan = false,
  workoutsPerWeek = 3,
  primaryGoal,
}: ActionCardStackProps) {
  const { settings } = useSettings();
  const colors = useMemo(
    () => (settings.themeMode === 'light' ? LightColors : DarkColors),
    [settings.themeMode],
  );

  const currentIndex = useSharedValue(0);
  const translateX = useSharedValue(0);
  const [displayIndex, setDisplayIndex] = useState(0);

  const goalLabel = useMemo(() => {
    if (primaryGoal === 'lose_weight') return 'Fat burning';
    if (primaryGoal === 'build_muscle') return 'Muscle building';
    return 'Fitness';
  }, [primaryGoal]);

  const cards = useMemo<CardDef[]>(() => {
    const list: CardDef[] = [];
    if (onViewAvatar) {
      list.push({
        id: 'coaching',
        type: 'coaching',
        title: 'Watch Coaching',
        subtitle: 'Your AI coach explains your plan',
        loadingTitle: 'Watch Coaching',
        loadingSubtitle: 'Your AI coach explains your plan',
        icon: <Play size={28} color={CARD_ACCENT.coaching} fill={CARD_ACCENT.coaching} />,
        accent: CARD_ACCENT.coaching,
        onPress: onViewAvatar,
        isLoading: false,
      });
    }
    if (onStartMealPlan) {
      list.push({
        id: 'mealPlan',
        type: 'mealPlan',
        title: 'Start 7-Day Meal Plan',
        subtitle: 'AI-generated meals for your goals',
        loadingTitle: 'Generating Meal Plan...',
        loadingSubtitle: 'Please wait while AI creates your plan',
        icon: <Utensils size={28} color={CARD_ACCENT.mealPlan} />,
        accent: CARD_ACCENT.mealPlan,
        onPress: onStartMealPlan,
        isLoading: isGeneratingMealPlan,
      });
    }
    if (onStartTrainingPlan) {
      list.push({
        id: 'trainingPlan',
        type: 'trainingPlan',
        title: 'Start Training Plan',
        subtitle: `${workoutsPerWeek} days/week \u2022 ${goalLabel} focused`,
        loadingTitle: 'Generating Training...',
        loadingSubtitle: 'Please wait while AI creates your plan',
        icon: <Dumbbell size={28} color={CARD_ACCENT.trainingPlan} />,
        accent: CARD_ACCENT.trainingPlan,
        onPress: onStartTrainingPlan,
        isLoading: isGeneratingTrainingPlan,
      });
    }
    return list;
  }, [
    onViewAvatar,
    onStartMealPlan,
    onStartTrainingPlan,
    isGeneratingMealPlan,
    isGeneratingTrainingPlan,
    workoutsPerWeek,
    goalLabel,
  ]);

  const totalCards = cards.length;

  useEffect(() => {
    currentIndex.value = 0;
    translateX.value = 0;
    setDisplayIndex(0);
  }, [totalCards]);

  useAnimatedReaction(
    () => currentIndex.value,
    (val) => {
      runOnJS(setDisplayIndex)(val);
    },
  );

  const handleTapFront = useCallback(() => {
    if (totalCards === 0) return;
    const idx = currentIndex.value % totalCards;
    const card = cards[idx];
    if (card && !card.isLoading) card.onPress();
  }, [cards, totalCards, currentIndex]);

  const gesture = useMemo(() => {
    const n = totalCards;
    if (n === 0) return Gesture.Tap();

    const pan = Gesture.Pan()
      .activeOffsetX([-15, 15])
      .failOffsetY([-10, 10])
      .onUpdate((e) => {
        'worklet';
        translateX.value = e.translationX;
      })
      .onEnd(() => {
        'worklet';
        if (n <= 1) {
          translateX.value = withSpring(0, GLASS_SPRING);
          return;
        }
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

  if (totalCards === 0) return null;

  const behindCount = Math.max(0, totalCards - 1);
  const containerHeight = CARD_HEIGHT + behindCount * BEHIND_Y_STEP;
  const activeIdx = displayIndex % totalCards;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.stackContainer, { height: containerHeight }]}>
          {/* Render back-to-front so last rendered = visually on top */}
          {[...cards].reverse().map((card, reverseI) => {
            const i = cards.length - 1 - reverseI;
            return (
              <SwipeCard
                key={card.id}
                card={card}
                cardIndex={i}
                totalCards={totalCards}
                currentIndex={currentIndex}
                translateX={translateX}
              />
            );
          })}
        </Animated.View>
      </GestureDetector>

      {totalCards > 1 && (
        <View style={styles.dotsContainer}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: activeIdx === i ? colors.text : colors.textMuted,
                  width: activeIdx === i ? 18 : 6,
                  opacity: activeIdx === i ? 1 : 0.35,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ---------- Individual Tinder-style card ----------

interface SwipeCardProps {
  card: CardDef;
  cardIndex: number;
  totalCards: number;
  currentIndex: Animated.SharedValue<number>;
  translateX: Animated.SharedValue<number>;
}

function SwipeCard({
  card,
  cardIndex,
  totalCards,
  currentIndex,
  translateX,
}: SwipeCardProps) {
  const gradient = CARD_GRADIENTS[card.type] || CARD_GRADIENTS.coaching;

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

    // Behind cards: stacked underneath, slightly smaller and offset down
    const baseScale = 1 - stackPos * BEHIND_SCALE_STEP;
    const baseY = stackPos * BEHIND_Y_STEP;

    if (stackPos === 1) {
      // Next card: scales up toward 1.0 as front card is dragged
      const scale = baseScale + BEHIND_SCALE_STEP * dragProgress;
      const y = baseY - BEHIND_Y_STEP * dragProgress;
      return {
        transform: [
          { translateX: 0 },
          { translateY: y },
          { rotateZ: '0deg' },
          { scale },
        ],
        zIndex: 99,
        opacity: 1,
      };
    }

    // Further back cards: shift forward one position during drag
    const prevScale = 1 - (stackPos - 1) * BEHIND_SCALE_STEP;
    const prevY = (stackPos - 1) * BEHIND_Y_STEP;
    const scale = baseScale + (prevScale - baseScale) * dragProgress;
    const y = baseY + (prevY - baseY) * dragProgress;

    return {
      transform: [
        { translateX: 0 },
        { translateY: y },
        { rotateZ: '0deg' },
        { scale },
      ],
      zIndex: 100 - stackPos,
      opacity: 0.7,
    };
  });

  return (
    <Animated.View style={[styles.card, { width: CARD_WIDTH }, animatedStyle]}>
      {/* Premium gradient background */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle accent glow at top */}
      <LinearGradient
        colors={[card.accent + '18', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glass border overlay */}
      <View style={styles.glassBorder} />

      {/* Card content */}
      <View style={styles.cardContent}>
        {/* Icon with glow ring */}
        <View style={styles.iconArea}>
          <View style={[styles.iconGlow, { backgroundColor: card.accent + '15' }]}>
            <View style={[styles.iconCircle, { borderColor: card.accent + '40' }]}>
              {card.isLoading ? (
                <ActivityIndicator size="small" color={card.accent} />
              ) : (
                card.icon
              )}
            </View>
          </View>
        </View>

        {/* Text content */}
        <View style={styles.textArea}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {card.isLoading ? card.loadingTitle : card.title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {card.isLoading ? card.loadingSubtitle : card.subtitle}
          </Text>
        </View>

        {/* Action arrow */}
        {!card.isLoading && (
          <View style={[styles.arrowCircle, { backgroundColor: card.accent + '15', borderColor: card.accent + '30' }]}>
            <ChevronRight size={18} color={card.accent} />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
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
  stackContainer: {
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  textArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: '#fff',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 18,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
