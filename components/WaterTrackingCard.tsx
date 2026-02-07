import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Spacing } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { lightImpact, successNotification } from '../utils/haptics';

const WATER_STORAGE_KEY = 'hc_water_intake';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// iOS 26 Liquid Glass colors
const GLASS_COLORS = {
  light: {
    background: 'rgba(255, 255, 255, 0.6)',
    border: 'rgba(255, 255, 255, 0.4)',
    water: 'rgba(79, 195, 247, 0.9)',
    waterGlow: 'rgba(79, 195, 247, 0.3)',
    waterBackground: 'rgba(79, 195, 247, 0.1)',
    buttonBg: 'rgba(255, 255, 255, 0.5)',
    buttonBorder: 'rgba(255, 255, 255, 0.6)',
    text: 'rgba(0, 0, 0, 0.85)',
    textMuted: 'rgba(60, 60, 67, 0.6)',
    textSecondary: 'rgba(60, 60, 67, 0.4)',
    success: 'rgba(78, 205, 196, 0.9)',
    successBg: 'rgba(78, 205, 196, 0.15)',
  },
  dark: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.12)',
    water: 'rgba(100, 210, 255, 0.9)',
    waterGlow: 'rgba(100, 210, 255, 0.2)',
    waterBackground: 'rgba(100, 210, 255, 0.08)',
    buttonBg: 'rgba(255, 255, 255, 0.1)',
    buttonBorder: 'rgba(255, 255, 255, 0.15)',
    text: 'rgba(255, 255, 255, 0.95)',
    textMuted: 'rgba(235, 235, 245, 0.6)',
    textSecondary: 'rgba(235, 235, 245, 0.4)',
    success: 'rgba(78, 205, 196, 0.9)',
    successBg: 'rgba(78, 205, 196, 0.12)',
  },
};

interface WaterTrackingCardProps {
  date: string; // ISO date string
}

export function WaterTrackingCard({ date }: WaterTrackingCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  const { settings } = useSettings();
  const [waterIntake, setWaterIntake] = useState(0);

  // Spring animations
  const addButtonScale = useSharedValue(1);
  const removeButtonScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const celebrationScale = useSharedValue(0);

  const goal = settings.dailyWaterGoal;
  const unit = settings.unitSystem === 'metric' ? 'ml' : 'oz';
  const incrementAmount = settings.unitSystem === 'metric' ? 250 : 8;

  // Load water intake for the current date
  useEffect(() => {
    loadWaterIntake();
  }, [date]);

  // Update progress animation when water intake changes
  useEffect(() => {
    const progress = Math.min(1, waterIntake / goal);
    progressWidth.value = withSpring(progress * 100, {
      damping: 20,
      stiffness: 90,
    });

    // Celebrate when goal is reached
    if (progress >= 1) {
      celebrationScale.value = withSpring(1, GLASS_SPRING);
    } else {
      celebrationScale.value = withSpring(0, GLASS_SPRING);
    }
  }, [waterIntake, goal]);

  const loadWaterIntake = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${WATER_STORAGE_KEY}_${date}`);
      if (stored) {
        setWaterIntake(parseInt(stored, 10));
      } else {
        setWaterIntake(0);
      }
    } catch (error) {
      console.error('[WaterTracking] Failed to load water intake:', error);
    }
  };

  const saveWaterIntake = async (amount: number) => {
    try {
      await AsyncStorage.setItem(`${WATER_STORAGE_KEY}_${date}`, amount.toString());
    } catch (error) {
      console.error('[WaterTracking] Failed to save water intake:', error);
    }
  };

  const handleAddWater = async () => {
    await lightImpact();
    addButtonScale.value = withSpring(0.9, GLASS_SPRING);
    setTimeout(() => {
      addButtonScale.value = withSpring(1, GLASS_SPRING);
    }, 100);

    const newAmount = waterIntake + incrementAmount;
    setWaterIntake(newAmount);
    saveWaterIntake(newAmount);

    // Success haptic if goal reached
    if (newAmount >= goal && waterIntake < goal) {
      await successNotification();
    }
  };

  const handleRemoveWater = async () => {
    if (waterIntake <= 0) return;
    await lightImpact();

    removeButtonScale.value = withSpring(0.9, GLASS_SPRING);
    setTimeout(() => {
      removeButtonScale.value = withSpring(1, GLASS_SPRING);
    }, 100);

    const newAmount = Math.max(0, waterIntake - incrementAmount);
    setWaterIntake(newAmount);
    saveWaterIntake(newAmount);
  };

  const progress = Math.min(1, waterIntake / goal);
  const glassesCount = Math.floor(waterIntake / incrementAmount);
  const percentage = Math.round(progress * 100);

  // Animated styles
  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const removeButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: removeButtonScale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const celebrationAnimatedStyle = useAnimatedStyle(() => ({
    opacity: celebrationScale.value,
    transform: [{ scale: celebrationScale.value }],
  }));

  // If water tracking is disabled, don't render
  if (!settings.waterTracking) {
    return null;
  }

  return (
    <View style={[styles.container, { borderColor: glassColors.border }]}>
      <BlurView
        intensity={isDark ? 25 : 40}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="water" size={20} color={glassColors.water} />
          </View>
          <Text style={[styles.title, { color: glassColors.text }]}>Water</Text>
          <Text style={[styles.percentage, { color: glassColors.water }]}>{percentage}%</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBackground, { backgroundColor: glassColors.buttonBg }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: glassColors.water },
                progressAnimatedStyle,
              ]}
            />
            {/* Glass highlight on progress bar */}
            <View style={styles.progressHighlight} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={[styles.currentValue, { color: glassColors.text }]}>
            {waterIntake} <Text style={[styles.unit, { color: glassColors.textMuted }]}>{unit}</Text>
          </Text>
          <Text style={[styles.goalValue, { color: glassColors.textMuted }]}>
            / {goal} {unit}
          </Text>
        </View>

        <View style={styles.glassesRow}>
          <Text style={[styles.glassesText, { color: glassColors.textSecondary }]}>
            {glassesCount} glass{glassesCount !== 1 ? 'es' : ''} ({incrementAmount}{unit} each)
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <Animated.View style={removeButtonAnimatedStyle}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: glassColors.buttonBg, borderColor: glassColors.buttonBorder },
                waterIntake <= 0 && styles.controlButtonDisabled,
              ]}
              onPress={handleRemoveWater}
              disabled={waterIntake <= 0}
            >
              <Ionicons
                name="remove"
                size={20}
                color={waterIntake <= 0 ? glassColors.textMuted : glassColors.text}
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={addButtonAnimatedStyle}>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: glassColors.water,
                  shadowColor: glassColors.water,
                },
              ]}
              onPress={handleAddWater}
            >
              <Ionicons name="add" size={24} color={Colors.text} />
              <Text style={styles.addButtonText}>Add Glass</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.controlButtonPlaceholder} />
        </View>

        {/* Goal completed celebration */}
        <Animated.View style={[styles.completedBadge, { backgroundColor: glassColors.successBg }, celebrationAnimatedStyle]}>
          <Ionicons name="checkmark-circle" size={16} color={glassColors.success} />
          <Text style={[styles.completedText, { color: glassColors.success }]}>Goal reached!</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.radiusMD,
    borderWidth: 1,
    overflow: 'hidden',
    // Soft glass shadow
    shadowColor: Colors.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    flex: 1,
  },
  percentage: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressHighlight: {
    position: 'absolute',
    top: 1,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 24,
    fontFamily: Fonts.numericSemiBold,
  },
  unit: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  goalValue: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginLeft: 4,
  },
  glassesRow: {
    marginBottom: 12,
  },
  glassesText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  controlButtonPlaceholder: {
    width: 44,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    // Glow shadow for button
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: Spacing.radiusSM,
    gap: 6,
  },
  completedText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
});
