// Smart Meal Logger Card Component
// Shows quick-log suggestions and favorites with liquid glass design

import React, { useState, useEffect, useCallback } from 'react';
import { Colors } from '../../../constants/Theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeIn,
  FadeOut,
  SlideInRight,
} from 'react-native-reanimated';
import { GlassCard } from '../../liquidGlass/GlassCard';
import { useGlassTheme } from '../../liquidGlass/useGlassTheme';
import { useSmartMealLogger } from '../../../contexts/SmartMealLoggerContext';
import { FrequentMeal, MealSuggestion } from '../../../types/smartMealLogger';
import QuickLogModal from './QuickLogModal';

interface SmartMealLoggerCardProps {
  onOpenFullLogger?: () => void;
  selectedDate?: string;
}

const MealTypeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

const MealTypeColors: Record<string, string> = {
  breakfast: colors.warningOrange,
  lunch: colors.accentCyan,
  dinner: colors.accentPurple,
  snack: colors.success,
};

export default function SmartMealLoggerCard({
  onOpenFullLogger,
  selectedDate,
}: SmartMealLoggerCardProps) {
  const {
    state,
    refreshSuggestions,
    quickLogMeal,
    getFavorites,
    getCurrentMealType,
  } = useSmartMealLogger();
  const { isDark, colors } = useGlassTheme();

  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<FrequentMeal | null>(null);
  const [favorites, setFavorites] = useState<FrequentMeal[]>([]);
  const [isLogging, setIsLogging] = useState<string | null>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const scale = useSharedValue(1);
  const currentMealType = getCurrentMealType();

  // Text colors
  const textColor = isDark ? Colors.text : Colors.card;
  const subtextColor = isDark ? Colors.textMuted : Colors.textMuted;
  const mutedColor = isDark ? Colors.textMuted : Colors.textMuted;

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      const faves = await getFavorites();
      setFavorites(faves);
    };
    loadFavorites();
  }, [getFavorites, state.frequentMeals]);

  // Refresh suggestions periodically
  useEffect(() => {
    refreshSuggestions(currentMealType);
    const interval = setInterval(() => {
      refreshSuggestions(currentMealType);
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [refreshSuggestions, currentMealType]);

  // Press animation
  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Handle quick log
  const handleQuickLog = async (meal: FrequentMeal) => {
    setIsLogging(meal.id);
    try {
      await quickLogMeal(meal, selectedDate);
      Alert.alert(
        'Meal Logged!',
        `${meal.name} (${meal.calories} cal) has been added.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    } finally {
      setIsLogging(null);
    }
  };

  // Open quick log modal with details
  const handleOpenQuickLog = (meal: FrequentMeal) => {
    setSelectedMeal(meal);
    setShowQuickLogModal(true);
  };

  // Get suggestions to display
  const displaySuggestions = showAllSuggestions
    ? state.suggestions
    : state.suggestions.slice(0, 3);

  // Render suggestion item
  const renderSuggestionItem = (suggestion: MealSuggestion, index: number) => {
    const { meal, confidence, reason } = suggestion;
    const mealColor = MealTypeColors[meal.mealType];

    return (
      <Animated.View
        key={meal.id}
        entering={SlideInRight.delay(index * 50).duration(300)}
      >
        <TouchableOpacity
          style={[styles.suggestionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
          onPress={() => handleOpenQuickLog(meal)}
          onLongPress={() => handleQuickLog(meal)}
          disabled={isLogging === meal.id}
        >
          <View style={[styles.mealTypeIcon, { backgroundColor: `${mealColor}20` }]}>
            <Ionicons name={MealTypeIcons[meal.mealType]} size={18} color={mealColor} />
          </View>
          <View style={styles.suggestionContent}>
            <Text style={[styles.suggestionName, { color: textColor }]} numberOfLines={1}>
              {meal.name}
            </Text>
            <Text style={[styles.suggestionMacros, { color: subtextColor }]}>
              {meal.calories} cal • {meal.protein}p • {meal.carbs}c • {meal.fat}f
            </Text>
            <Text style={[styles.suggestionReason, { color: mutedColor }]} numberOfLines={1}>
              {reason}
            </Text>
          </View>
          <View style={styles.suggestionActions}>
            <View style={[styles.confidenceBadge, { backgroundColor: `${mealColor}15` }]}>
              <Text style={[styles.confidenceText, { color: mealColor }]}>{confidence}%</Text>
            </View>
            {isLogging === meal.id ? (
              <ActivityIndicator size="small" color={mealColor} />
            ) : (
              <TouchableOpacity
                style={[styles.quickAddButton, { backgroundColor: mealColor }]}
                onPress={() => handleQuickLog(meal)}
              >
                <Ionicons name="add" size={18} color={Colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render favorite item
  const renderFavoriteItem = (meal: FrequentMeal) => {
    const mealColor = MealTypeColors[meal.mealType];

    return (
      <TouchableOpacity
        key={meal.id}
        style={[styles.favoriteItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
        onPress={() => handleOpenQuickLog(meal)}
        disabled={isLogging === meal.id}
      >
        <View style={[styles.favoriteBadge, { backgroundColor: mealColor }]}>
          <Ionicons name="star" size={10} color={Colors.text} />
        </View>
        <Text style={[styles.favoriteName, { color: textColor }]} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={[styles.favoriteCal, { color: mutedColor }]}>{meal.calories}</Text>
        {isLogging === meal.id ? (
          <ActivityIndicator size="small" color={mealColor} style={{ marginLeft: 4 }} />
        ) : (
          <TouchableOpacity onPress={() => handleQuickLog(meal)}>
            <Ionicons name="add-circle" size={20} color={mealColor} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onOpenFullLogger}
        >
          <GlassCard variant="elevated" material="thick" interactive animated>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(74,222,128,0.15)' }]}>
                  <Ionicons name="flash" size={20} color={Colors.successStrong} />
                </View>
                <View>
                  <Text style={[styles.title, { color: textColor }]}>Quick Log</Text>
                  <Text style={[styles.subtitle, { color: subtextColor }]}>
                    {currentMealType.charAt(0).toUpperCase() + currentMealType.slice(1)} suggestions
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.fullLoggerButton, { backgroundColor: 'rgba(74,222,128,0.1)' }]}
                onPress={onOpenFullLogger}
              >
                <Ionicons name="camera" size={16} color={Colors.successStrong} />
                <Text style={[styles.fullLoggerText, { color: Colors.successStrong }]}>AI Log</Text>
              </TouchableOpacity>
            </View>

            {/* Suggestions Section */}
            {state.suggestions.length > 0 ? (
              <View style={styles.suggestionsContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bulb" size={14} color={Colors.accentGold} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Suggested for You</Text>
                </View>
                {displaySuggestions.map((suggestion, index) => renderSuggestionItem(suggestion, index))}

                {state.suggestions.length > 3 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAllSuggestions(!showAllSuggestions)}
                  >
                    <Text style={[styles.showMoreText, { color: Colors.successStrong }]}>
                      {showAllSuggestions ? 'Show Less' : `Show ${state.suggestions.length - 3} More`}
                    </Text>
                    <Ionicons
                      name={showAllSuggestions ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={Colors.successStrong}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : state.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.successStrong} />
                <Text style={[styles.loadingText, { color: subtextColor }]}>Learning your patterns...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: textColor }]}>No Suggestions Yet</Text>
                <Text style={[styles.emptyDesc, { color: subtextColor }]}>
                  Log a few meals to see personalized suggestions
                </Text>
              </View>
            )}

            {/* Favorites Section */}
            {favorites.length > 0 && (
              <View style={styles.favoritesContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star" size={14} color={Colors.accentGold} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Favorites</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.favoritesScroll}
                >
                  {favorites.slice(0, 5).map((meal) => renderFavoriteItem(meal))}
                </ScrollView>
              </View>
            )}

            {/* Tip */}
            <View style={[styles.tipContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
              <Ionicons name="hand-left-outline" size={14} color={mutedColor} />
              <Text style={[styles.tipText, { color: mutedColor }]}>
                Long-press any meal to instantly log it
              </Text>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Log Modal */}
      <QuickLogModal
        visible={showQuickLogModal}
        meal={selectedMeal}
        selectedDate={selectedDate}
        onClose={() => {
          setShowQuickLogModal(false);
          setSelectedMeal(null);
        }}
        onLog={async (meal) => {
          await handleQuickLog(meal);
          setShowQuickLogModal(false);
          setSelectedMeal(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  fullLoggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  fullLoggerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  mealTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionMacros: {
    fontSize: 11,
    marginBottom: 2,
  },
  suggestionReason: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  suggestionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quickAddButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  favoritesContainer: {
    marginBottom: 12,
  },
  favoritesScroll: {
    gap: 8,
    paddingRight: 8,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    minWidth: 120,
  },
  favoriteBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  favoriteCal: {
    fontSize: 11,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  tipText: {
    fontSize: 11,
    flex: 1,
  },
});
