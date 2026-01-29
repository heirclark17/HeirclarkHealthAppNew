/**
 * Saved Meals Tab
 * Browse, search, and manage saved meals collection
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Conditionally import Reanimated only for native platforms to avoid web infinite loops
let Animated: any = View;
let FadeIn: any = undefined;
let FadeInDown: any = undefined;

if (Platform.OS !== 'web') {
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default;
    FadeIn = Reanimated.FadeIn;
    FadeInDown = Reanimated.FadeInDown;
  } catch (e) {
    // Fallback if Reanimated fails
  }
}
import { GlassCard } from '../../components/GlassCard';
import { useSettings } from '../../contexts/SettingsContext';
import { aiService } from '../../services/aiService';
import { SavedMeal, MealType } from '../../types/ai';
import { DarkColors, LightColors, Spacing, Fonts } from '../../constants/Theme';
import { mediumImpact, lightImpact } from '../../utils/haptics';

type FilterType = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'favorites';

const FILTER_OPTIONS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'favorites', label: 'Favorites', icon: 'heart' },
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { key: 'snack', label: 'Snack', icon: 'cafe-outline' },
];

export default function SavedMealsScreen() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<SavedMeal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const hasLoadedRef = useRef(false);

  // Load saved meals
  const loadSavedMeals = useCallback(async (force = false) => {
    // Prevent duplicate loads on mount
    if (!force && hasLoadedRef.current) {
      setIsLoading(false);
      return;
    }

    try {
      hasLoadedRef.current = true;
      const meals = await aiService.getSavedMeals();
      setSavedMeals(meals);
    } catch (error) {
      console.error('Failed to load saved meals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter meals based on search and filter
  useEffect(() => {
    let filtered = [...savedMeals];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        meal =>
          meal.meal.name.toLowerCase().includes(query) ||
          meal.meal.description?.toLowerCase().includes(query) ||
          meal.meal.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (activeFilter === 'favorites') {
      filtered = filtered.filter(meal => meal.isFavorite);
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter(meal => meal.meal.mealType === activeFilter);
    }

    // Sort by date (newest first), favorites at top
    filtered.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });

    setFilteredMeals(filtered);
  }, [savedMeals, searchQuery, activeFilter]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadSavedMeals();
    }, [loadSavedMeals])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSavedMeals(true); // Force refresh
    setRefreshing(false);
  }, [loadSavedMeals]);

  const handleToggleFavorite = useCallback(async (mealId: string) => {
    lightImpact();
    const success = await aiService.toggleFavoriteMeal(mealId);
    if (success) {
      setSavedMeals(prev =>
        prev.map(meal =>
          meal.id === mealId ? { ...meal, isFavorite: !meal.isFavorite } : meal
        )
      );
    }
  }, []);

  const handleDeleteMeal = useCallback((mealId: string, mealName: string) => {
    Alert.alert(
      'Remove Meal',
      `Are you sure you want to remove "${mealName}" from your saved meals?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            mediumImpact();
            const success = await aiService.removeSavedMeal(mealId);
            if (success) {
              setSavedMeals(prev => prev.filter(meal => meal.id !== mealId));
            }
          },
        },
      ]
    );
  }, []);

  const stats = useMemo(() => ({
    total: savedMeals.length,
    favorites: savedMeals.filter(m => m.isFavorite).length,
  }), [savedMeals]);

  const renderMealCard = useCallback(({ item, index }: { item: SavedMeal; index: number }) => {
    const { meal, isFavorite, savedAt, source } = item;
    const formattedDate = new Date(savedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Use stable animations - only on native platforms where Reanimated is available
    const enteringAnimation = FadeInDown?.delay?.(Math.min(index * 50, 300))?.duration?.(300);

    return (
      <Animated.View entering={enteringAnimation}>
        <GlassCard style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <View style={[styles.mealTypeIndicator, { backgroundColor: colors.surface }]}>
              <Text style={[styles.mealTypeText, { color: colors.textSecondary }]}>
                {meal.mealType}
              </Text>
            </View>
            <View style={styles.mealActions}>
              <TouchableOpacity
                onPress={() => handleToggleFavorite(item.id)}
                style={styles.actionButton}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? '#ff6b6b' : colors.textTertiary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteMeal(item.id, meal.name)}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
          {meal.description && (
            <Text style={[styles.mealDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {meal.description}
            </Text>
          )}

          <View style={styles.mealMeta}>
            <View style={styles.nutrientBadge}>
              <Text style={[styles.nutrientValue, { color: colors.text }]}>
                {meal.nutrients.calories}
              </Text>
              <Text style={[styles.nutrientLabel, { color: colors.textTertiary }]}>cal</Text>
            </View>
            <View style={styles.nutrientBadge}>
              <Text style={[styles.nutrientValue, { color: colors.text }]}>
                {meal.nutrients.protein_g}g
              </Text>
              <Text style={[styles.nutrientLabel, { color: colors.textTertiary }]}>protein</Text>
            </View>
            <View style={styles.nutrientBadge}>
              <Text style={[styles.nutrientValue, { color: colors.text }]}>
                {meal.prepTimeMinutes}
              </Text>
              <Text style={[styles.nutrientLabel, { color: colors.textTertiary }]}>min</Text>
            </View>
          </View>

          <View style={[styles.mealFooter, { borderTopColor: colors.surface }]}>
            <View style={styles.sourceBadge}>
              <Ionicons
                name={source === 'ai' ? 'sparkles' : 'document-text-outline'}
                size={12}
                color={colors.textTertiary}
              />
              <Text style={[styles.sourceText, { color: colors.textTertiary }]}>
                {source === 'ai' ? 'AI Generated' : source === 'template' ? 'Template' : 'Custom'}
              </Text>
            </View>
            <Text style={[styles.savedDate, { color: colors.textTertiary }]}>
              Saved {formattedDate}
            </Text>
          </View>

          {meal.tags && meal.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {meal.tags.slice(0, 3).map((tag, tagIndex) => (
                <View key={tagIndex} style={[styles.tag, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.tagText, { color: colors.textTertiary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      </Animated.View>
    );
  }, [colors, handleToggleFavorite, handleDeleteMeal]);

  const renderFilterChip = useCallback(({ key, label, icon }: typeof FILTER_OPTIONS[0]) => {
    const isActive = activeFilter === key;
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.filterChip,
          { backgroundColor: isActive ? colors.text : colors.surface },
        ]}
        onPress={() => {
          lightImpact();
          setActiveFilter(key);
        }}
      >
        <Ionicons
          name={icon as any}
          size={14}
          color={isActive ? colors.background : colors.textSecondary}
        />
        <Text
          style={[
            styles.filterChipText,
            { color: isActive ? colors.background : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }, [activeFilter, colors]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeFilter === 'favorites' ? 'heart-outline' : 'bookmark-outline'}
        size={48}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {activeFilter === 'favorites'
          ? 'No Favorite Meals'
          : searchQuery
          ? 'No Meals Found'
          : 'No Saved Meals'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {activeFilter === 'favorites'
          ? 'Tap the heart icon on meals to add them to your favorites'
          : searchQuery
          ? 'Try a different search term'
          : 'Save meals from your meal plan to build your collection'}
      </Text>
    </View>
  ), [activeFilter, searchQuery, colors]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="bookmark-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading saved meals...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use stable entering animations - only on native platforms where Reanimated is available
  const headerAnimation = FadeIn?.duration?.(300);
  const statsAnimation = FadeInDown?.delay?.(100)?.duration?.(300);
  const searchAnimation = FadeInDown?.delay?.(150)?.duration?.(300);
  const filterAnimation = FadeInDown?.delay?.(200)?.duration?.(300);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View entering={headerAnimation} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>SAVED MEALS</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your meal collection</Text>
      </Animated.View>

      {/* Stats Card */}
      <Animated.View entering={statsAnimation}>
        <GlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Meals</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surface }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#ff6b6b' }]}>{stats.favorites}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favorites</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Search Input */}
      <Animated.View
        entering={searchAnimation}
        style={[styles.searchContainer, { backgroundColor: colors.surface }]}
      >
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search meals..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Filter Chips */}
      <Animated.View entering={filterAnimation}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_OPTIONS}
          renderItem={({ item }) => renderFilterChip(item)}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.filterList}
          style={styles.filterContainer}
        />
      </Animated.View>

      {/* Meals List */}
      <FlatList
        data={filteredMeals}
        renderItem={renderMealCard}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredMeals.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  statsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 14,
  },
  filterContainer: {
    marginBottom: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  mealCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mealTypeIndicator: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mealTypeText: {
    fontSize: 10,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  mealMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  nutrientBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  nutrientValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  nutrientLabel: {
    fontSize: 10,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 10,
  },
  savedDate: {
    fontSize: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.sm,
  },
  tag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
