import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { lightImpact } from '../utils/haptics';

const WATER_STORAGE_KEY = 'hc_water_intake';

interface WaterTrackingCardProps {
  date: string; // ISO date string
}

export function WaterTrackingCard({ date }: WaterTrackingCardProps) {
  const { settings } = useSettings();
  const [waterIntake, setWaterIntake] = useState(0);
  const [scaleValue] = useState(new Animated.Value(1));

  const goal = settings.dailyWaterGoal;
  const unit = settings.unitSystem === 'metric' ? 'ml' : 'oz';
  const incrementAmount = settings.unitSystem === 'metric' ? 250 : 8; // 250ml or 8oz per glass

  // Load water intake for the current date
  useEffect(() => {
    loadWaterIntake();
  }, [date]);

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

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const newAmount = waterIntake + incrementAmount;
    setWaterIntake(newAmount);
    saveWaterIntake(newAmount);
  };

  const handleRemoveWater = async () => {
    if (waterIntake <= 0) return;
    await lightImpact();

    const newAmount = Math.max(0, waterIntake - incrementAmount);
    setWaterIntake(newAmount);
    saveWaterIntake(newAmount);
  };

  const progress = Math.min(1, waterIntake / goal);
  const glassesCount = Math.floor(waterIntake / incrementAmount);
  const percentage = Math.round(progress * 100);

  // If water tracking is disabled, don't render
  if (!settings.waterTracking) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="water" size={20} color="#4FC3F7" />
        </View>
        <Text style={styles.title}>Water</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.currentValue}>
          {waterIntake} <Text style={styles.unit}>{unit}</Text>
        </Text>
        <Text style={styles.goalValue}>
          / {goal} {unit}
        </Text>
      </View>

      <View style={styles.glassesRow}>
        <Text style={styles.glassesText}>
          {glassesCount} glass{glassesCount !== 1 ? 'es' : ''} ({incrementAmount}{unit} each)
        </Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlButton, waterIntake <= 0 && styles.controlButtonDisabled]}
          onPress={handleRemoveWater}
          disabled={waterIntake <= 0}
        >
          <Ionicons
            name="remove"
            size={20}
            color={waterIntake <= 0 ? Colors.textMuted : Colors.text}
          />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddWater}>
            <Ionicons name="add" size={24} color={Colors.background} />
            <Text style={styles.addButtonText}>Add Glass</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.controlButtonPlaceholder} />
      </View>

      {progress >= 1 && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.completedText}>Goal reached!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    flex: 1,
  },
  percentage: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#4FC3F7',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4FC3F7',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 24,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  unit: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  goalValue: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  glassesRow: {
    marginBottom: 12,
  },
  glassesText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonPlaceholder: {
    width: 40,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4FC3F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.background,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 8,
    gap: 6,
  },
  completedText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.success,
  },
});
