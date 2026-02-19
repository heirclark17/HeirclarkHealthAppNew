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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Utensils, Dumbbell } from 'lucide-react-native';
import Constants from 'expo-constants';

import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.25);
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;
const BEHIND_SCALE_STEP = 0.05;
const BEHIND_Y_STEP = 12;

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://heirclarkinstacartbackend-production.up.railway.app';

const GLASS_SPRING = { damping: 18, stiffness: 120, mass: 1 };

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
  const [cardImages, setCardImages] = useState<Record<string, string>>({});

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
        icon: <Play size={22} color="#fff" fill="#fff" />,
        accent: '#4ECDC4',
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
        icon: <Utensils size={22} color="#fff" />,
        accent: '#FF6B6B',
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
        icon: <Dumbbell size={22} color="#fff" />,
        accent: '#00D9F5',
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

  // Fetch card images from backend
  useEffect(() => {
    cards.forEach(async (card) => {
      if (cardImages[card.type]) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        const resp = await fetch(`${API_URL}/api/v1/card-image?type=${card.type}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = await resp.json();
          if (data.url) {
            setCardImages((prev) => ({ ...prev, [card.type]: data.url }));
          }
        }
      } catch (err) {
        console.log('[ActionCardStack] Image fetch error for', card.type);
      }
    });
  }, [cards]);

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
                imageUrl={cardImages[card.type]}
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

// ---------- Individual card ----------

interface SwipeCardProps {
  card: CardDef;
  cardIndex: number;
  totalCards: number;
  currentIndex: Animated.SharedValue<number>;
  translateX: Animated.SharedValue<number>;
  imageUrl?: string;
}

function SwipeCard({
  card,
  cardIndex,
  totalCards,
  currentIndex,
  translateX,
  imageUrl,
}: SwipeCardProps) {
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

    const baseScale = 1 - stackPos * BEHIND_SCALE_STEP;
    const baseY = stackPos * BEHIND_Y_STEP;

    if (stackPos === 1) {
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
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* Background image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a2e' }]} />
      )}

      {/* Bottom gradient for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
        locations={[0.35, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top subtle vignette */}
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'transparent']}
        locations={[0, 0.3]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content pinned to bottom */}
      <View style={styles.cardContent}>
        <View style={[styles.iconPill, { backgroundColor: card.accent }]}>
          {card.isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            card.icon
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {card.isLoading ? card.loadingTitle : card.title}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {card.isLoading ? card.loadingSubtitle : card.subtitle}
        </Text>
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
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#fff',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
});
