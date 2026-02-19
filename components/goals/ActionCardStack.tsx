import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
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
import { NumberText } from '../NumberText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = SCREEN_WIDTH * 0.55;
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;

const API_URL = Constants.expoConfig?.extra?.apiUrl ||
                process.env.EXPO_PUBLIC_API_URL ||
                'https://heirclarkinstacartbackend-production.up.railway.app';

const GLASS_SPRING = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

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

  const [cardOrder, setCardOrder] = useState<number[]>([]);
  const [cardImages, setCardImages] = useState<Record<string, string>>({});

  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

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
        icon: <Play size={22} color="#fff" />,
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
        icon: <Utensils size={22} color="#fff" />,
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
        loadingTitle: 'GENERATING TRAINING PLAN...',
        loadingSubtitle: 'Please wait while AI creates your plan',
        icon: <Dumbbell size={22} color="#fff" />,
        iconBg: Colors.success,
        onPress: onStartTrainingPlan,
        isLoading: isGeneratingTrainingPlan,
      });
    }
    return list;
  }, [onViewAvatar, onStartMealPlan, onStartTrainingPlan, isGeneratingMealPlan, isGeneratingTrainingPlan, workoutsPerWeek, goalLabel]);

  // Init card order when cards change
  useEffect(() => {
    setCardOrder(cards.map((_, i) => i));
  }, [cards.length]);

  // Fetch card images
  useEffect(() => {
    const types = cards.map((c) => c.type);
    types.forEach(async (type) => {
      if (cardImages[type]) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        const resp = await fetch(`${API_URL}/api/v1/card-image?type=${type}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = await resp.json();
          if (data.url) {
            setCardImages((prev) => ({ ...prev, [type]: data.url }));
          }
        }
      } catch (err) {
        console.log('[ActionCardStack] Image fetch error for', type, err);
      }
    });
  }, [cards]);

  const cycleCards = useCallback(() => {
    setCardOrder((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  }, []);

  const handleTap = useCallback(() => {
    if (cardOrder.length === 0) return;
    const frontIdx = cardOrder[0];
    const card = cards[frontIdx];
    if (card && !card.isLoading) {
      card.onPress();
    }
  }, [cardOrder, cards]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        // Animate off screen then cycle
        const direction = translateX.value > 0 ? 1 : -1;
        translateX.value = withTiming(
          direction * CARD_WIDTH * 1.2,
          { duration: 200 },
          () => {
            runOnJS(cycleCards)();
            translateX.value = 0;
          },
        );
      } else {
        translateX.value = withSpring(0, GLASS_SPRING);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleTap)();
  });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  // Don't render if no cards
  if (cards.length === 0 || cardOrder.length === 0) return null;

  const singleCard = cards.length === 1;

  return (
    <View style={styles.container}>
      {/* Page indicator dots */}
      {!singleCard && (
        <View style={styles.dotsContainer}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === 0
                      ? colors.text
                      : colors.textMuted,
                  opacity: i === 0 ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Card stack */}
      <View style={[styles.stackContainer, { height: CARD_HEIGHT + 28 }]}>
        {/* Render cards in reverse order so front card is on top */}
        {[...cardOrder].reverse().map((cardIdx, visualIdx) => {
          const stackPos = cardOrder.indexOf(cardIdx);
          const card = cards[cardIdx];
          if (!card) return null;
          const isFront = stackPos === 0;

          return (
            <StackCard
              key={card.id}
              card={card}
              stackPos={stackPos}
              isFront={isFront}
              singleCard={singleCard}
              translateX={translateX}
              gesture={isFront ? composedGesture : undefined}
              imageUrl={cardImages[card.type]}
              colors={colors}
              totalCards={cards.length}
            />
          );
        })}
      </View>
    </View>
  );
}

interface StackCardProps {
  card: CardDef;
  stackPos: number;
  isFront: boolean;
  singleCard: boolean;
  translateX: Animated.SharedValue<number>;
  gesture?: ReturnType<typeof Gesture.Exclusive>;
  imageUrl?: string;
  colors: typeof DarkColors;
  totalCards: number;
}

function StackCard({
  card,
  stackPos,
  isFront,
  singleCard,
  translateX,
  gesture,
  imageUrl,
  colors,
  totalCards,
}: StackCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (isFront) {
      const rotation = interpolate(
        translateX.value,
        [-CARD_WIDTH, 0, CARD_WIDTH],
        [-8, 0, 8],
        Extrapolation.CLAMP,
      );
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: 0 },
          { scale: 1 },
          { rotateZ: `${rotation}deg` },
        ],
        opacity: 1,
        zIndex: 10,
      };
    }

    // Behind cards - animate up as front card drags
    const progress = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );

    const baseY = stackPos * 12;
    const baseScale = 1 - stackPos * 0.05;
    const baseOpacity = stackPos === 1 ? 0.7 : 0.4;

    const targetY = (stackPos - 1) * 12;
    const targetScale = 1 - (stackPos - 1) * 0.05;
    const targetOpacity = stackPos === 1 ? 1 : 0.7;

    return {
      transform: [
        { translateX: 0 },
        { translateY: baseY + (targetY - baseY) * progress },
        { scale: baseScale + (targetScale - baseScale) * progress },
        { rotateZ: '0deg' },
      ],
      opacity: baseOpacity + (targetOpacity - baseOpacity) * progress,
      zIndex: 10 - stackPos,
    };
  });

  const content = (
    <Animated.View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }, animatedStyle]}>
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

      {/* Gradient overlay for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Fallback gradient when no image */}
      {!imageUrl && (
        <LinearGradient
          colors={[card.iconBg + '40', card.iconBg + '90']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Content at bottom */}
      <View style={styles.cardContent}>
        <View style={[styles.iconCircle, { backgroundColor: card.iconBg }]}>
          {card.isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            card.icon
          )}
        </View>
        <View style={styles.cardTextContainer}>
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

  if (gesture && isFront) {
    return (
      <GestureDetector gesture={gesture}>
        {content}
      </GestureDetector>
    );
  }

  return content;
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
    justifyContent: 'flex-start',
  },
  card: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Fonts.numericSemiBold,
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.numericRegular,
    color: 'rgba(255,255,255,0.8)',
  },
});
