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
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Grid3x3, Heart, Sun, UtensilsCrossed, Moon, Coffee, Search, XCircle, Bookmark, Sparkles, FileText, Trash2 } from 'lucide-react-native';

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
import { NumberText } from '../../components/NumberText';
import { mediumImpact, lightImpact } from '../../utils/haptics';

type FilterType = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'favorites';

const FILTER_OPTIONS: { key: FilterType; label: string; icon: any }[] = [
  { key: 'all', label: 'All', icon: Grid3x3 },
  { key: 'favorites', label: 'Favorites', icon: Heart },
  { key: 'breakfast', label: 'Breakfast', icon: Sun },
  { key: 'lunch', label: 'Lunch', icon: UtensilsCrossed },
  { key: 'dinner', label: 'Dinner', icon: Moon },
  { key: 'snack', label: 'Snack', icon: Coffee },
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
          {/* Meal Photo */}
          {meal.imageUrl ? (
            <Image
              source={{ uri: meal.imageUrl }}
              style={styles.mealPhoto}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <View style={[styles.mealPhoto, styles.mealPhotoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
              <UtensilsCrossed size={28} color={colors.textMuted} strokeWidth={1} />
            </View>
          )}
          <View style={styles.mealCardContent}>
          <View style={styles.mealHeader}>
            <View style={[styles.mealTypeIndicator, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.mealTypeText, { color: colors.textSecondary }]}>
                {meal.mealType}
              </Text>
            </View>
            <View style={styles.mealActions}>
              <TouchableOpacity
                onPress={() => handleToggleFavorite(item.id)}
                style={styles.actionButton}
                accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                accessibilityRole="button"
                accessibilityState={{ selected: isFavorite }}
                accessibilityHint={isFavorite ? 'Removes this meal from your favorites list' : 'Adds this meal to your favorites for quick access'}
              >
                <Heart
                  size={20}
                  color={isFavorite ? '#ff6b6b' : colors.textMuted}
                  fill={isFavorite ? '#ff6b6b' : 'transparent'}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteMeal(item.id, meal.name)}
                style={styles.actionButton}
                accessibilityLabel={`Delete ${meal.name}`}
                accessibilityRole="button"
                accessibilityHint="Permanently deletes this saved meal from your library"
              >
                <Trash2 size={18} color={colors.textMuted} strokeWidth={1.5} />
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
              <NumberText weight="semiBold" style={[styles.nutrientValue, { color: colors.text }]}>
                {Math.round(meal.nutrients.calories)}
              </NumberText>
              <Text style={[styles.nutrientLabel, { color: colors.textMuted }]}>cal</Text>
            </View>
            <View style={styles.nutrientBadge}>
              <NumberText weight="semiBold" style={[styles.nutrientValue, { color: colors.text }]}>
                {Math.round(meal.nutrients.protein_g)}g
              </NumberText>
              <Text style={[styles.nutrientLabel, { color: colors.textMuted }]}>protein</Text>
            </View>
            <View style={styles.nutrientBadge}>
              <NumberText weight="semiBold" style={[styles.nutrientValue, { color: colors.text }]}>
                {Math.round(meal.prepTimeMinutes)}
              </NumberText>
              <Text style={[styles.nutrientLabel, { color: colors.textMuted }]}>min</Text>
            </View>
          </View>

          <View style={[styles.mealFooter, { borderTopColor: colors.border }]}>
            <View style={styles.sourceBadge}>
              {source === 'ai' ? (
                <Sparkles size={12} color={colors.textMuted} strokeWidth={1.5} />
              ) : (
                <FileText size={12} color={colors.textMuted} strokeWidth={1.5} />
              )}
              <Text style={[styles.sourceText, { color: colors.textMuted }]}>
                {source === 'ai' ? 'AI Generated' : source === 'template' ? 'Template' : 'Custom'}
              </Text>
            </View>
            <Text style={[styles.savedDate, { color: colors.textMuted }]}>
              Saved {formattedDate}
            </Text>
          </View>

          {meal.tags && meal.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {meal.tags.slice(0, 3).map((tag, tagIndex) => (
                <View key={tagIndex} style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.tagText, { color: colors.textMuted }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          </View>
        </GlassCard>
      </Animated.View>
    );
  }, [colors, handleToggleFavorite, handleDeleteMeal]);

  const renderFilterChip = useCallback(({ key, label, icon: IconComponent }: typeof FILTER_OPTIONS[0]) => {
    const isActive = activeFilter === key;
    // Glass-like backgrounds for filter chips
    const chipBg = isActive
      ? colors.text
      : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)';

    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.filterChip,
          {
            backgroundColor: chipBg,
            borderWidth: isActive ? 0 : 1,
            borderColor: borderColor,
          },
        ]}
        onPress={() => {
          lightImpact();
          setActiveFilter(key);
        }}
        accessibilityLabel={`Filter by ${label}${isActive ? ', selected' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        accessibilityHint={`Shows only ${label.toLowerCase()} meals in your saved meals library`}
      >
        <IconComponent
          size={14}
          color={isActive ? colors.background : colors.textSecondary}
          strokeWidth={1.5}
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
  }, [activeFilter, colors, isDark]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyStateWrapper}>
      <GlassCard style={styles.emptyState}>
        {activeFilter === 'favorites' ? (
          <Heart size={48} color={colors.textMuted} strokeWidth={1.5} />
        ) : (
          <Bookmark size={48} color={colors.textMuted} strokeWidth={1.5} />
        )}
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
      </GlassCard>
    </View>
  ), [activeFilter, searchQuery, colors]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Bookmark size={48} color={colors.textMuted} strokeWidth={1.5} />
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
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      {/* Header */}
      <Animated.View entering={headerAnimation} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Saved Meals</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your meal collection</Text>
      </Animated.View>

      {/* Stats Card */}
      <Animated.View entering={statsAnimation}>
        <GlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <GlassCard style={styles.statItemCard} borderColor="transparent">
              <Bookmark size={20} color={colors.primary} strokeWidth={1.5} />
              <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>{stats.total}</NumberText>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Meals</Text>
            </GlassCard>
            <GlassCard style={styles.statItemCard} borderColor="transparent">
              <Heart size={20} color="#ff6b6b" strokeWidth={1.5} />
              <NumberText weight="semiBold" style={[styles.statValue, { color: '#ff6b6b' }]}>{stats.favorites}</NumberText>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favorites</Text>
            </GlassCard>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Search Input */}
      <Animated.View entering={searchAnimation} style={styles.searchWrapper}>
        <GlassCard style={styles.searchContainer} interactive>
          <Search size={18} color={colors.textMuted} strokeWidth={1.5} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search meals..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              accessibilityHint="Clears the current search query and shows all saved meals"
            >
              <XCircle size={18} color={colors.textMuted} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </GlassCard>
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
    fontFamily: Fonts.regular,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
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
    gap: 12,
  },
  statItemCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  statValue: {
    fontSize: 28,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  searchWrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 14,
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.medium,
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
    padding: 0,
    overflow: 'hidden',
  },
  mealPhoto: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  mealPhotoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCardContent: {
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
    fontFamily: Fonts.medium,
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
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
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
  },
  nutrientLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.regular,
  },
  savedDate: {
    fontSize: 10,
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.regular,
  },
  emptyStateWrapper: {
    marginHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});
