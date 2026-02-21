/**
 * EnergyPeakStep - When is your peak energy time?
 * Swipeable fan cards with AI-generated images
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Hand, Check } from 'lucide-react-native';
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
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';
import { EnergyPeak } from '../../../types/planner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://heirclarkinstacartbackend-production.up.railway.app';

// Card dimensions - reduced height for better screen fit
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.95); // Reduced from 1.25 to 0.95 aspect ratio
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;

// Fan spread constants
const FAN_ROTATION = 6;
const FAN_OFFSET_X = 18;
const FAN_OFFSET_Y = 4;
const BEHIND_SCALE = 0.95;

const GLASS_SPRING = { damping: 18, stiffness: 120, mass: 1 };

interface Props {
  value?: EnergyPeak;
  onChange: (value: EnergyPeak) => void;
  onNext: () => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

interface EnergyOption {
  id: EnergyPeak;
  imageType: string;
  label: string;
  time: string;
  color: string;
  fallbackBg: string;
}

const ENERGY_OPTIONS: EnergyOption[] = [
  {
    id: 'morning',
    imageType: 'energy_morning',
    label: 'Morning Person',
    time: '6 AM - 12 PM',
    color: Colors.protein,
    fallbackBg: '#FFF4E6',
  },
  {
    id: 'afternoon',
    imageType: 'energy_afternoon',
    label: 'Afternoon Peak',
    time: '12 PM - 5 PM',
    color: Colors.carbs,
    fallbackBg: '#FFE4F7',
  },
  {
    id: 'evening',
    imageType: 'energy_evening',
    label: 'Night Owl',
    time: '5 PM - 10 PM',
    color: Colors.accentPurple,
    fallbackBg: '#E9DCFF',
  },
];

// Individual fan card
interface FanCardProps {
  option: EnergyOption;
  cardIndex: number;
  totalCards: number;
  currentIndex: Animated.SharedValue<number>;
  translateX: Animated.SharedValue<number>;
  isSelected: boolean;
  imageUrl?: string;
}

function FanCard({
  option,
  cardIndex,
  totalCards,
  currentIndex,
  translateX,
  isSelected,
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

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* AI-generated image background */}
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
        <Text style={styles.cardTitle}>{option.label}</Text>
        <Text style={[styles.cardTime, { color: option.color }]}>{option.time}</Text>

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

export function EnergyPeakStep({
  value,
  onChange,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
}: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  const totalCards = ENERGY_OPTIONS.length;
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
    ENERGY_OPTIONS.forEach(async (option) => {
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
        console.log('[EnergyPeakStep] Image fetch error for', option.imageType);
      }
    });
  }, []);

  const handleTapFront = useCallback(async () => {
    const idx = currentIndex.value % totalCards;
    const option = ENERGY_OPTIONS[idx];
    onChange(option.id);
  }, [totalCards, currentIndex, onChange]);

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

  const activeIdx = displayIndex % totalCards;
  const containerHeight = CARD_HEIGHT + 40;

  return (
    <View style={styles.container}>
      <GlassCard style={styles.mainCard}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>When is your peak energy time?</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Swipe to browse, tap to select
          </Text>
        </View>

        {/* Card Fan Stack */}
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.stackContainer, { height: containerHeight }]}>
            {[...ENERGY_OPTIONS].reverse().map((option, reverseI) => {
              const i = ENERGY_OPTIONS.length - 1 - reverseI;
              return (
                <FanCard
                  key={option.id}
                  option={option}
                  cardIndex={i}
                  totalCards={totalCards}
                  currentIndex={currentIndex}
                  translateX={translateX}
                  isSelected={value === option.id}
                  imageUrl={cardImages[option.imageType]}
                />
              );
            })}
          </Animated.View>
        </GestureDetector>

        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {ENERGY_OPTIONS.map((option, i) => {
            const isActive = activeIdx === i;
            const isSelected = value === option.id;
            return (
              <View
                key={option.id}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isSelected
                      ? option.color
                      : isActive
                        ? themeColors.text
                        : themeColors.textMuted,
                    width: isActive ? 20 : 6,
                    opacity: isActive ? 1 : isSelected ? 0.8 : 0.3,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Card counter */}
        <Text style={[styles.cardCounter, { color: themeColors.textMuted }]}>
          {activeIdx + 1} of {totalCards}
        </Text>

        {/* Progress */}
        <Text style={[styles.progress, { color: themeColors.textSecondary }]}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onPrevious} activeOpacity={0.7}>
            <GlassCard style={styles.actionButton} interactive>
              <View style={{ transform: [{ rotate: '-90deg' }, { scaleX: -1 }] }}>
                <Hand size={24} color={themeColors.text} />
              </View>
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            disabled={!value}
            activeOpacity={0.7}
            style={{ opacity: !value ? 0.5 : 1 }}
          >
            <GlassCard style={styles.actionButton} interactive>
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <Hand size={24} color={themeColors.primary} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  mainCard: {
    padding: 20,
    gap: 12,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
    lineHeight: 24,
  },
  stackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
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
    fontFamily: Fonts.numericSemiBold,
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardTime: {
    fontSize: 15,
    fontFamily: Fonts.numericSemiBold,
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  progress: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
