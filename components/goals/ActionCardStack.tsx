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
import { GlassCard } from '../GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Narrower cards so there's padding inside the glass container
const CARD_WIDTH = SCREEN_WIDTH - 112;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.35);
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;

// Fan spread: each behind card rotates & offsets to peek out
const FAN_ROTATION = 6;
const FAN_OFFSET_X = 18;
const FAN_OFFSET_Y = 4;
const BEHIND_SCALE = 0.95;

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
        icon: <Play size={20} color="#fff" fill="#fff" />,
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
        icon: <Utensils size={20} color="#fff" />,
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
        icon: <Dumbbell size={20} color="#fff" />,
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

  // Fetch pastel card images from backend
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

  const containerHeight = CARD_HEIGHT + 40;
  const activeIdx = displayIndex % totalCards;

  return (
    <GlassCard style={styles.glassWrapper} interactive>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>YOUR NEXT STEPS</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Swipe through to get started</Text>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.stackContainer, { height: containerHeight }]}>
          {[...cards].reverse().map((card, reverseI) => {
            const i = cards.length - 1 - reverseI;
            return (
              <FanCard
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
    </GlassCard>
  );
}

// ---------- Individual fanned card ----------

interface FanCardProps {
  card: CardDef;
  cardIndex: number;
  totalCards: number;
  currentIndex: Animated.SharedValue<number>;
  translateX: Animated.SharedValue<number>;
  imageUrl?: string;
}

function FanCard({
  card,
  cardIndex,
  totalCards,
  currentIndex,
  translateX,
  imageUrl,
}: FanCardProps) {
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

  const fallbackBg =
    card.type === 'coaching' ? '#F0EDE6' :
    card.type === 'mealPlan' ? '#EDE8E0' :
    '#E8EAED';

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fallbackBg }]} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)']}
        locations={[0.4, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cardContent}>
        <View style={[styles.iconPill, { backgroundColor: card.accent }]}>
          {card.isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            card.icon
          )}
        </View>
        <View style={styles.textArea}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {card.isLoading ? card.loadingTitle : card.title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {card.isLoading ? card.loadingSubtitle : card.subtitle}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glassWrapper: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 26,
    fontFamily: Fonts.numericBold,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 18,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  stackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 14,
    gap: 12,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#fff',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.75)',
  },
});
