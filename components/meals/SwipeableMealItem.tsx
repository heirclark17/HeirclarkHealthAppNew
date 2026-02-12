/**
 * Swipeable Meal Item - iOS-style swipe actions for meal management
 * Allows users to edit or delete meals with swipe gestures
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Colors, Fonts, Spacing } from '../../constants/Theme';
import { LoggedMeal } from './EditMealModal';

// iOS 26 Liquid Glass spring physics
const GLASS_SPRING = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

const SWIPE_THRESHOLD = -80;
const ACTION_WIDTH = 80;

interface SwipeableMealItemProps {
  meal: LoggedMeal;
  onEdit: (meal: LoggedMeal) => void;
  onDelete: (meal: LoggedMeal) => void;
}

export function SwipeableMealItem({
  meal,
  onEdit,
  onDelete,
}: SwipeableMealItemProps) {
  const translateX = useSharedValue(0);
  const [isOpen, setIsOpen] = useState(false);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx: any) => {
      const newValue = ctx.startX + event.translationX;
      // Only allow left swipe (negative values)
      if (newValue <= 0 && newValue >= -ACTION_WIDTH * 2) {
        translateX.value = newValue;
      }
    },
    onEnd: (event) => {
      if (translateX.value < SWIPE_THRESHOLD) {
        // Open actions
        translateX.value = withSpring(-ACTION_WIDTH * 2, GLASS_SPRING);
        runOnJS(setIsOpen)(true);
      } else {
        // Close actions
        translateX.value = withSpring(0, GLASS_SPRING);
        runOnJS(setIsOpen)(false);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleEdit = () => {
    translateX.value = withSpring(0, GLASS_SPRING);
    setIsOpen(false);
    onEdit(meal);
  };

  const handleDelete = () => {
    translateX.value = withSpring(0, GLASS_SPRING);
    setIsOpen(false);
    onDelete(meal);
  };

  const closeActions = () => {
    translateX.value = withSpring(0, GLASS_SPRING);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={[styles.action, styles.editAction]}
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={24} color={Colors.text} />
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>

        <Pressable
          style={[styles.action, styles.deleteAction]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color={Colors.text} />
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </View>

      {/* Meal Content (swipeable) */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.mealContent, animatedStyle]}>
          <Pressable
            style={styles.mealPressable}
            onPress={closeActions}
          >
            {/* Meal Info */}
            <View style={styles.mealInfo}>
              <Text style={styles.mealName} numberOfLines={1}>
                {meal.name}
              </Text>
              <View style={styles.macrosRow}>
                <Text style={styles.macroText}>
                  {Math.round(meal.calories)} cal
                </Text>
                <Text style={styles.macroDot}>•</Text>
                <Text style={styles.macroText}>
                  P: {Math.round(meal.protein)}g
                </Text>
                <Text style={styles.macroDot}>•</Text>
                <Text style={styles.macroText}>
                  C: {Math.round(meal.carbs)}g
                </Text>
                <Text style={styles.macroDot}>•</Text>
                <Text style={styles.macroText}>
                  F: {Math.round(meal.fat)}g
                </Text>
              </View>
            </View>

            {/* Chevron Icon */}
            <Ionicons
              name="chevron-back"
              size={20}
              color={Colors.textMuted}
              style={styles.chevron}
            />
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    borderRadius: Spacing.radiusMD,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  action: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  editAction: {
    backgroundColor: Colors.accentCyan,
  },
  deleteAction: {
    backgroundColor: Colors.error,
  },
  actionText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  mealContent: {
    backgroundColor: Colors.card,
  },
  mealPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  macroDot: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  chevron: {
    opacity: 0.5,
  },
});
