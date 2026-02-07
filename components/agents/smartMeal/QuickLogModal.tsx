// Quick Log Modal Component
// Shows meal details and allows quick logging with liquid glass design

import React, { useState } from 'react';
import { Colors, Fonts } from '../../../constants/Theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { GlassCard } from '../../liquidGlass/GlassCard';
import { useGlassTheme } from '../../liquidGlass/useGlassTheme';
import { NumberText } from '../../NumberText';
import { FrequentMeal } from '../../../types/smartMealLogger';

interface QuickLogModalProps {
  visible: boolean;
  meal: FrequentMeal | null;
  selectedDate?: string;
  onClose: () => void;
  onLog: (meal: FrequentMeal) => Promise<void>;
}

const MealTypeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

const MealTypeColors: Record<string, string> = {
  breakfast: '#FFB74D',
  lunch: '#4FC3F7',
  dinner: '#9575CD',
  snack: '#81C784',
};

export default function QuickLogModal({
  visible,
  meal,
  selectedDate,
  onClose,
  onLog,
}: QuickLogModalProps) {
  const { isDark, colors } = useGlassTheme();
  const [isLogging, setIsLogging] = useState(false);

  if (!meal) return null;

  const textColor = isDark ? Colors.text : Colors.card;
  const subtextColor = isDark ? Colors.textMuted : Colors.textMuted;
  const mutedColor = isDark ? Colors.textMuted : Colors.textMuted;
  const mealColor = MealTypeColors[meal.mealType];

  const handleLog = async () => {
    setIsLogging(true);
    try {
      await onLog(meal);
    } finally {
      setIsLogging(false);
    }
  };

  // Format date for display
  const displayDate = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Today';

  // Format last logged
  const lastLoggedDate = new Date(meal.lastLogged);
  const daysSinceLastLog = Math.floor(
    (Date.now() - lastLoggedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const lastLoggedText =
    daysSinceLastLog === 0
      ? 'Today'
      : daysSinceLastLog === 1
        ? 'Yesterday'
        : `${daysSinceLastLog} days ago`;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          style={styles.modalContainer}
        >
          <GlassCard variant="elevated" material="thick" style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.mealTypeIcon, { backgroundColor: `${mealColor}20` }]}>
                <Ionicons name={MealTypeIcons[meal.mealType]} size={24} color={mealColor} />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={subtextColor} />
              </TouchableOpacity>
            </View>

            {/* Meal Name */}
            <Text style={[styles.mealName, { color: textColor }]}>{meal.name}</Text>
            <Text style={[styles.mealType, { color: mealColor }]}>
              {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
            </Text>

            {/* Macro Display */}
            <View style={styles.macroContainer}>
              <View style={[styles.macroItem, styles.calorieItem]}>
                <NumberText weight="bold" style={[styles.macroValue, { color: textColor }]}>{meal.calories}</NumberText>
                <Text style={[styles.macroLabel, { color: subtextColor }]}>Calories</Text>
              </View>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: Colors.error }]} />
                  <NumberText weight="semiBold" style={[styles.macroSmallValue, { color: textColor }]}>{meal.protein}g</NumberText>
                  <Text style={[styles.macroSmallLabel, { color: mutedColor }]}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: Colors.success }]} />
                  <NumberText weight="semiBold" style={[styles.macroSmallValue, { color: textColor }]}>{meal.carbs}g</NumberText>
                  <Text style={[styles.macroSmallLabel, { color: mutedColor }]}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: '#FFE66D' }]} />
                  <NumberText weight="semiBold" style={[styles.macroSmallValue, { color: textColor }]}>{meal.fat}g</NumberText>
                  <Text style={[styles.macroSmallLabel, { color: mutedColor }]}>Fat</Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={[styles.statsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
              <View style={styles.statItem}>
                <Ionicons name="repeat" size={16} color={subtextColor} />
                <NumberText weight="regular" style={[styles.statText, { color: subtextColor }]}>Logged {meal.logCount} times</NumberText>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color={subtextColor} />
                <Text style={[styles.statText, { color: subtextColor }]}>Usually at {meal.averageTime}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={16} color={subtextColor} />
                <Text style={[styles.statText, { color: subtextColor }]}>Last logged {lastLoggedText}</Text>
              </View>
            </View>

            {/* Log Button */}
            <TouchableOpacity
              style={[styles.logButton, { backgroundColor: mealColor }]}
              onPress={handleLog}
              disabled={isLogging}
            >
              {isLogging ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color={Colors.text} />
                  <Text style={styles.logButtonText}>Log for {displayDate}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Link */}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelText, { color: subtextColor }]}>Cancel</Text>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  modalCard: {
    padding: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 4,
  },
  mealName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  macroContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  calorieItem: {
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 48,
    fontFamily: Fonts.numericBold,
    letterSpacing: -1,
  },
  macroLabel: {
    fontSize: 14,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  macroSmallValue: {
    fontSize: 20,
    fontFamily: Fonts.numericSemiBold,
  },
  macroSmallLabel: {
    fontSize: 11,
  },
  statsContainer: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 13,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  logButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
