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
const CARD_HEIGHT = Math.round(SCREEN_WIDTH * 0.5);
// Height of the title strip that peeks out for behind cards
const PEEK_HEIGHT = 50;
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://heirclarkinstacartbackend-production.up.railway.app';

const GLASS_SPRING = { damping: 15, stiffness: 150, mass: 1 };

interface CardDef {
  id: string;
  type: 'coaching' | 'mealPlan' | 'trainingPlan';
  title: string;
  subtitle: string;
  loadingTitle: string;
  loadingSubtitle: string;
  icon: React.ReactNode;
  iconBg: string;
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
        title: 'WATCH COACHING',
        subtitle: 'Your AI coach explains your plan',
        loadingTitle: 'WATCH COACHING',
        loadingSubtitle: 'Your AI coach explains your plan',
        icon: <Play size={20} color="#fff" />,
        iconBg: Colors.success,
        onPress: onViewAvatar,
        isLoading: false,
      });
    }
    if (onStartMealPlan) {
      list.push({
        id: 'mealPlan',
        type: 'mealPlan',
        title: 'START 7-DAY MEAL PLAN',
        subtitle: 'AI-generated meals for your goals',
        loadingTitle: 'GENERATING MEAL PLAN...',
        loadingSubtitle: 'Please wait while AI creates your plan',
        icon: <Utensils size={20} color="#fff" />,
        iconBg: Colors.error,
        onPress: onStartMealPlan,
        isLoading: isGeneratingMealPlan,
      });
    }
    if (onStartTrainingPlan) {
      list.push({
        id: 'trainingPlan',
        type: 'trainingPlan',
        title: 'START TRAINING PLAN',
        subtitle: `${workoutsPerWeek} days/week \u2022 ${goalLabel} focused`,
        loadingTitle: 'GENERATING TRAINING...',
        loadingSubtitle: 'Please wait while AI creates your plan',
        icon: <Dumbbell size={20} color="#fff" />,
        iconBg: Colors.success,
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

  // Fetch card images
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
            dir * CARD_WIDTH * 1.2,
            { duration: 200 },
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

  // Container: front card full height + peek strip for each behind card (flush, no gaps)
  const behindCount = Math.max(0, totalCards - 1);
  const containerHeight = CARD_HEIGHT + behindCount * PEEK_HEIGHT;
  const activeIdx = displayIndex % totalCards;

  return (
    <View style={styles.container}>
      {totalCards > 1 && (
        <View style={styles.dotsContainer}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: activeIdx === i ? colors.text : colors.textMuted,
                  opacity: activeIdx === i ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.stackContainer, { height: containerHeight }]}>
          {cards.map((card, i) => (
            <WalletCard
              key={card.id}
              card={card}
              cardIndex={i}
              totalCards={totalCards}
              currentIndex={currentIndex}
              translateX={translateX}
              imageUrl={cardImages[card.type]}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ---------- Individual card ----------

interface WalletCardProps {
  card: CardDef;
  cardIndex: number;
  totalCards: number;
  currentIndex: Animated.SharedValue<number>;
  translateX: Animated.SharedValue<number>;
  imageUrl?: string;
}

function WalletCard({
  card,
  cardIndex,
  totalCards,
  currentIndex,
  translateX,
  imageUrl,
}: WalletCardProps) {
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

    // ---- FRONT CARD: full size, swipeable ----
    if (isFront) {
      const rotation = interpolate(
        translateX.value,
        [-CARD_WIDTH, 0, CARD_WIDTH],
        [-6, 0, 6],
        Extrapolation.CLAMP,
      );
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: 0 },
          { rotateZ: `${rotation}deg` },
        ],
        height: CARD_HEIGHT,
        zIndex: 100,
        elevation: 10,
        opacity: 1,
      };
    }

    // ---- BEHIND CARDS: positioned flush below front, showing title peek strip ----
    // Each behind card sits directly below the previous one
    // stackPos 1 = first behind card, starts at CARD_HEIGHT
    // stackPos 2 = second behind card, starts at CARD_HEIGHT + PEEK_HEIGHT
    const restY = CARD_HEIGHT + (stackPos - 1) * PEEK_HEIGHT;

    if (stackPos === 1) {
      // Next card: as user drags, this card rises to front position and expands
      const y = restY * (1 - dragProgress);
      const h = PEEK_HEIGHT + (CARD_HEIGHT - PEEK_HEIGHT) * dragProgress;
      return {
        transform: [
          { translateX: 0 },
          { translateY: y },
          { rotateZ: '0deg' },
        ],
        height: h,
        zIndex: 99,
        elevation: 9,
        opacity: 1,
      };
    }

    // Further behind cards: shift up one slot as drag progresses
    const prevY = CARD_HEIGHT + (stackPos - 2) * PEEK_HEIGHT;
    const y = restY + (prevY - restY) * dragProgress;

    return {
      transform: [
        { translateX: 0 },
        { translateY: y },
        { rotateZ: '0deg' },
      ],
      height: PEEK_HEIGHT,
      zIndex: 100 - stackPos,
      elevation: Math.max(1, 10 - stackPos),
      opacity: 1,
    };
  });

  return (
    <Animated.View style={[styles.card, { width: CARD_WIDTH }, animatedStyle]}>
      <View style={styles.cardInner}>
        {/* Background image */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : null}

        {/* Top gradient for title readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.25)', 'transparent']}
          locations={[0, 0.35, 0.65]}
          style={StyleSheet.absoluteFill}
        />

        {/* Fallback gradient when no image */}
        {!imageUrl && (
          <LinearGradient
            colors={[card.iconBg + '55', card.iconBg + '18']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Title bar at TOP — visible as peek strip for behind cards */}
        <View style={styles.titleBar}>
          <View style={[styles.iconCircle, { backgroundColor: card.iconBg }]}>
            {card.isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              card.icon
            )}
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {card.isLoading ? card.loadingTitle : card.title}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {card.isLoading ? card.loadingSubtitle : card.subtitle}
            </Text>
          </View>
        </View>
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
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stackContainer: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    // Thin top border to separate peek strips visually
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cardInner: {
    height: CARD_HEIGHT,
    width: '100%',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    height: PEEK_HEIGHT,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: Fonts.numericRegular,
    color: 'rgba(255,255,255,0.75)',
  },
});
