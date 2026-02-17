/**
 * MealDetailModal - Shows detailed meal information when user taps a meal block
 *
 * Features:
 * - Macro breakdown (protein, carbs, fat)
 * - Ingredient list
 * - Prep/cook time
 * - Mark complete / Skip options
 * - Reschedule button
 * - Liquid glass design
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { X, CheckCircle2, Calendar, Utensils, Clock, ChefHat } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { NumberText } from '../../NumberText';
import { TimeBlock } from '../../../types/planner';
import { useSettings } from '../../../contexts/SettingsContext';
import { useMealPlan } from '../../../contexts/MealPlanContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  visible: boolean;
  block: TimeBlock | null;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onReschedule: () => void;
}

export function MealDetailModal({
  visible,
  block,
  onClose,
  onComplete,
  onSkip,
  onReschedule,
}: Props) {
  const { settings } = useSettings();
  const { state: mealState } = useMealPlan();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  if (!block || !visible) return null;

  // Find meal details from meal plan context
  const getMealDetails = () => {
    // Extract meal ID from block's relatedId
    // For now, show placeholder data - you'll wire to real meal data
    return {
      description: 'Grilled chicken breast with quinoa and roasted vegetables',
      calories: 520,
      protein: 45,
      carbs: 52,
      fat: 12,
      prepTime: 15,
      cookTime: 25,
      ingredients: [
        '6 oz chicken breast',
        '1 cup quinoa (uncooked)',
        '2 cups mixed vegetables',
        '1 tbsp olive oil',
        'Salt, pepper, garlic powder',
      ],
    };
  };

  const meal = getMealDetails();
  const isCompleted = block.status === 'completed';
  const isSkipped = block.status === 'skipped';

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onSkip();
    onClose();
  };

  const handleReschedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReschedule();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={isDark ? 80 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          <GlassCard style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Utensils size={24} color={block.color || Colors.carbs} />
                <Text style={[styles.title, { color: themeColors.text }]}>
                  {block.title}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Time */}
            <View style={styles.timeRow}>
              <Clock size={16} color={themeColors.textSecondary} />
              <Text style={[styles.timeText, { color: themeColors.textSecondary }]}>
                {block.startTime} – {block.endTime}  ·  <NumberText style={styles.timeText}>{block.duration}</NumberText>m
              </Text>
            </View>

            {/* Description */}
            <Text style={[styles.description, { color: themeColors.textSecondary }]}>
              {meal.description}
            </Text>

            {/* Macros */}
            <View style={styles.macroRow}>
              <View style={styles.macroCard}>
                <NumberText style={[styles.macroValue, { color: Colors.protein }]}>
                  {meal.protein}
                </NumberText>
                <Text style={[styles.macroLabel, { color: themeColors.textSecondary }]}>
                  Protein
                </Text>
              </View>
              <View style={styles.macroCard}>
                <NumberText style={[styles.macroValue, { color: Colors.carbs }]}>
                  {meal.carbs}
                </NumberText>
                <Text style={[styles.macroLabel, { color: themeColors.textSecondary }]}>
                  Carbs
                </Text>
              </View>
              <View style={styles.macroCard}>
                <NumberText style={[styles.macroValue, { color: Colors.fat }]}>
                  {meal.fat}
                </NumberText>
                <Text style={[styles.macroLabel, { color: themeColors.textSecondary }]}>
                  Fat
                </Text>
              </View>
              <View style={styles.macroCard}>
                <NumberText style={[styles.macroValue, { color: themeColors.text }]}>
                  {meal.calories}
                </NumberText>
                <Text style={[styles.macroLabel, { color: themeColors.textSecondary }]}>
                  Calories
                </Text>
              </View>
            </View>

            {/* Prep/Cook Time */}
            <View style={styles.timeInfoRow}>
              <View style={styles.timeInfo}>
                <ChefHat size={16} color={themeColors.textSecondary} />
                <Text style={[styles.timeInfoText, { color: themeColors.textSecondary }]}>
                  Prep: <NumberText style={styles.timeInfoText}>{meal.prepTime}</NumberText>m
                </Text>
              </View>
              <View style={styles.timeInfo}>
                <Clock size={16} color={themeColors.textSecondary} />
                <Text style={[styles.timeInfoText, { color: themeColors.textSecondary }]}>
                  Cook: <NumberText style={styles.timeInfoText}>{meal.cookTime}</NumberText>m
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            {/* Ingredients */}
            <ScrollView style={styles.ingredientList} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Ingredients
              </Text>
              {meal.ingredients.map((ingredient, index) => (
                <Text key={index} style={[styles.ingredient, { color: themeColors.textSecondary }]}>
                  • {ingredient}
                </Text>
              ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Reschedule */}
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}
                onPress={handleReschedule}
              >
                <Calendar size={20} color={themeColors.text} />
                <Text style={[styles.secondaryButtonText, { color: themeColors.text }]}>
                  Reschedule
                </Text>
              </TouchableOpacity>

              {/* Skip */}
              {!isCompleted && !isSkipped && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}
                  onPress={handleSkip}
                >
                  <X size={20} color={themeColors.textSecondary} />
                  <Text style={[styles.secondaryButtonText, { color: themeColors.textSecondary }]}>
                    Skip
                  </Text>
                </TouchableOpacity>
              )}

              {/* Complete */}
              {!isCompleted && !isSkipped && (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: Colors.carbs }]}
                  onPress={handleComplete}
                >
                  <CheckCircle2 size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    Mark Complete
                  </Text>
                </TouchableOpacity>
              )}

              {/* Status Badge */}
              {isCompleted && (
                <View style={[styles.statusBadge, { backgroundColor: Colors.carbs + '20' }]}>
                  <CheckCircle2 size={18} color={Colors.carbs} />
                  <Text style={[styles.statusBadgeText, { color: Colors.carbs }]}>
                    Completed
                  </Text>
                </View>
              )}
              {isSkipped && (
                <View style={[styles.statusBadge, { backgroundColor: themeColors.textSecondary + '20' }]}>
                  <X size={18} color={themeColors.textSecondary} />
                  <Text style={[styles.statusBadgeText, { color: themeColors.textSecondary }]}>
                    Skipped
                  </Text>
                </View>
              )}
            </View>
          </GlassCard>
        </View>
      </BlurView>
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
  },
  modalContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  card: {
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    fontFamily: Fonts.numericRegular,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.08)',
  },
  macroValue: {
    fontSize: 18,
    fontFamily: Fonts.numericSemiBold,
    fontWeight: '600',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  timeInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeInfoText: {
    fontSize: 13,
    fontFamily: Fonts.numericRegular,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  ingredientList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    marginBottom: 10,
  },
  ingredient: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
});
