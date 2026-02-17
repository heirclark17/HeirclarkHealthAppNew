// @ts-nocheck
/**
 * Exercise Library Tab
 * Browse, search, and explore 100+ exercises with equipment alternatives
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  XCircle,
  Dumbbell,
  Heart,
  ChevronRight,
  Filter,
  X,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { useSettings } from '../../contexts/SettingsContext';
import { DarkColors, LightColors, Spacing, Fonts } from '../../constants/Theme';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import EXERCISE_DATABASE, {
  getExercisesByMuscleGroup,
  getExercisesForEquipment,
} from '../../data/exerciseDatabase';
import type { Exercise, MuscleGroup, Equipment } from '../../types/training';
import { exerciseDbService } from '../../services/exerciseDbService';
import type { ExerciseDBExercise } from '../../types/ai';

// Filter types
type MuscleFilter = MuscleGroup | 'all';
type EquipmentFilter = Equipment | 'all';
type DifficultyFilter = 'beginner' | 'intermediate' | 'advanced' | 'all';

const MUSCLE_GROUPS: { key: MuscleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'arms', label: 'Arms' },
  { key: 'legs', label: 'Legs' },
  { key: 'core', label: 'Core' },
];

const EQUIPMENT_TYPES: { key: EquipmentFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'bodyweight', label: 'Bodyweight' },
  { key: 'dumbbells', label: 'Dumbbells' },
  { key: 'barbell', label: 'Barbell' },
  { key: 'cable_machine', label: 'Cable' },
  { key: 'resistance_bands', label: 'Bands' },
];

const DIFFICULTY_LEVELS: { key: DifficultyFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

export default function ExercisesScreen() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleFilter>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // API exercise state
  const [apiExercises, setApiExercises] = useState<ExerciseDBExercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const EXERCISES_PER_PAGE = 10; // API limit is 10 per request

  // Initialize ExerciseDB service and fetch initial exercises
  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        await exerciseDbService.initialize();
        console.log('[ExercisesScreen] ExerciseDB service initialized');

        // Fetch initial batch of exercises
        const exercises = await exerciseDbService.getAllExercises(EXERCISES_PER_PAGE, 0);
        setApiExercises(exercises);
        setHasMore(exercises.length === EXERCISES_PER_PAGE);
        console.log(`[ExercisesScreen] Loaded ${exercises.length} exercises from API`);
      } catch (error) {
        console.error('[ExercisesScreen] Failed to fetch exercises:', error);
      } finally {
        setIsLoadingExercises(false);
      }
    };

    initializeAndFetch();
  }, []);

  // Convert ExerciseDB API format to local Exercise format
  const convertApiExerciseToLocal = useCallback((apiEx: ExerciseDBExercise): Exercise => {
    // Map API body parts to our muscle groups
    const bodyPartToMuscle: Record<string, MuscleGroup> = {
      'chest': 'chest',
      'back': 'back',
      'shoulders': 'shoulders',
      'upper arms': 'arms',
      'lower arms': 'arms',
      'upper legs': 'legs',
      'lower legs': 'legs',
      'waist': 'core',
      'cardio': 'core',
      'neck': 'core',
    };

    // Map API equipment to our equipment types
    const equipmentMap: Record<string, Equipment> = {
      'barbell': 'barbell',
      'dumbbell': 'dumbbells',
      'body weight': 'bodyweight',
      'cable': 'cable_machine',
      'resistance band': 'resistance_bands',
      'machine': 'cable_machine',
      'ez barbell': 'barbell',
      'kettlebell': 'dumbbells',
      'weighted': 'dumbbells',
      'assisted': 'cable_machine',
      'leverage machine': 'cable_machine',
      'medicine ball': 'dumbbells',
      'stability ball': 'bodyweight',
      'band': 'resistance_bands',
      'roller': 'bodyweight',
      'skierg machine': 'cable_machine',
      'hammer': 'cable_machine',
      'smith machine': 'smith_machine',
      'rope': 'cable_machine',
      'sled machine': 'cable_machine',
      'tire': 'bodyweight',
      'trap bar': 'barbell',
      'upper body ergometer': 'cable_machine',
      'wheel roller': 'bodyweight',
    };

    const primaryMuscle = bodyPartToMuscle[apiEx.bodyPart] || 'core';
    const secondaryMuscles = apiEx.secondaryMuscles?.map(m => bodyPartToMuscle[m] || 'core' as MuscleGroup) || [];
    const muscleGroups: MuscleGroup[] = [primaryMuscle, ...secondaryMuscles.filter(m => m !== primaryMuscle)];
    const equipment = equipmentMap[apiEx.equipment] || 'bodyweight';

    return {
      id: apiEx.id,
      name: apiEx.name,
      muscleGroups,
      primaryMuscle,
      secondaryMuscles,
      category: apiEx.target ? 'isolation' : 'compound',
      equipment,
      difficulty: 'intermediate' as DifficultyLevel,
      caloriesPerMinute: 5,
      instructions: apiEx.instructions || [],
      exerciseDbId: apiEx.id,
      gifUrl: apiEx.gifUrl,
    };
  }, []);

  // Filter exercises from API data
  const filteredExercises = useMemo(() => {
    // Convert API exercises to local format
    let exercises = apiExercises.map(convertApiExerciseToLocal);

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      exercises = exercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.muscleGroups.some((m) => m.toLowerCase().includes(query))
      );
    }

    // Muscle group filter
    if (muscleFilter !== 'all') {
      exercises = exercises.filter((ex) => ex.muscleGroups.includes(muscleFilter));
    }

    // Equipment filter
    if (equipmentFilter !== 'all') {
      exercises = exercises.filter((ex) => ex.equipment === equipmentFilter);
    }

    // Difficulty filter is removed since API doesn't provide difficulty level

    return exercises;
  }, [apiExercises, searchQuery, muscleFilter, equipmentFilter, convertApiExerciseToLocal]);

  const handleExercisePress = useCallback((exercise: Exercise) => {
    lightImpact();
    setSelectedExercise(exercise);
  }, []);

  // Load more exercises for pagination
  const loadMoreExercises = useCallback(async () => {
    if (!hasMore || isLoadingExercises) return;

    try {
      setIsLoadingExercises(true);
      const newOffset = currentOffset + EXERCISES_PER_PAGE;
      const moreExercises = await exerciseDbService.getAllExercises(EXERCISES_PER_PAGE, newOffset);

      if (moreExercises.length > 0) {
        setApiExercises(prev => [...prev, ...moreExercises]);
        setCurrentOffset(newOffset);
        setHasMore(moreExercises.length === EXERCISES_PER_PAGE);
        console.log(`[ExercisesScreen] Loaded ${moreExercises.length} more exercises (total: ${apiExercises.length + moreExercises.length})`);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('[ExercisesScreen] Failed to load more exercises:', error);
    } finally {
      setIsLoadingExercises(false);
    }
  }, [hasMore, isLoadingExercises, currentOffset, apiExercises.length]);

  const handleToggleFavorite = useCallback((exerciseId: string) => {
    mediumImpact();
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setMuscleFilter('all');
    setEquipmentFilter('all');
    setDifficultyFilter('all');
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (muscleFilter !== 'all') count++;
    if (equipmentFilter !== 'all') count++;
    if (difficultyFilter !== 'all') count++;
    return count;
  }, [muscleFilter, equipmentFilter, difficultyFilter]);

  const renderExerciseCard = useCallback(
    ({ item }: { item: Exercise }) => {
      const isFavorite = favoriteIds.has(item.id);

      return (
        <TouchableOpacity
          onPress={() => handleExercisePress(item)}
          activeOpacity={0.7}
        >
          <GlassCard style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <View style={styles.exerciseMeta}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          item.difficulty === 'beginner'
                            ? 'rgba(76, 175, 80, 0.15)'
                            : item.difficulty === 'intermediate'
                            ? 'rgba(255, 152, 0, 0.15)'
                            : 'rgba(244, 67, 54, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        {
                          color:
                            item.difficulty === 'beginner'
                              ? '#4CAF50'
                              : item.difficulty === 'intermediate'
                              ? '#FF9800'
                              : '#F44336',
                        },
                      ]}
                    >
                      {item.difficulty}
                    </Text>
                  </View>
                  <Text style={[styles.equipmentText, { color: colors.textMuted }]}>
                    {item.equipment.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.exerciseActions}>
                <TouchableOpacity
                  onPress={() => handleToggleFavorite(item.id)}
                  style={styles.favoriteButton}
                >
                  <Heart
                    size={20}
                    color={isFavorite ? '#ff6b6b' : colors.textMuted}
                    fill={isFavorite ? '#ff6b6b' : 'transparent'}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
                <ChevronRight size={20} color={colors.textMuted} strokeWidth={1.5} />
              </View>
            </View>

            <View style={styles.muscleGroupRow}>
              {item.muscleGroups.slice(0, 3).map((muscle, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.muscleGroupChip,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Text style={[styles.muscleGroupText, { color: colors.textSecondary }]}>
                    {muscle}
                  </Text>
                </View>
              ))}
            </View>

            {item.alternatives && item.alternatives.length > 0 && (
              <Text style={[styles.alternativesText, { color: colors.textMuted }]}>
                {item.alternatives.length} equipment alternatives
              </Text>
            )}
          </GlassCard>
        </TouchableOpacity>
      );
    },
    [colors, favoriteIds, handleExercisePress, handleToggleFavorite]
  );

  const renderFilterChip = useCallback(
    (label: string, isActive: boolean, onPress: () => void) => {
      return (
        <TouchableOpacity
          onPress={onPress}
          style={[
            styles.filterChip,
            {
              backgroundColor: isActive ? colors.text : colors.backgroundSecondary,
              borderColor: isActive ? colors.text : 'transparent',
            },
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color: isActive ? colors.background : colors.textSecondary,
                fontFamily: isActive ? Fonts.semiBold : Fonts.regular,
              },
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      );
    },
    [colors]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Exercise Library</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {filteredExercises.length} exercises
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Search size={20} color={colors.textMuted} strokeWidth={1.5} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <XCircle size={20} color={colors.textMuted} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
        >
          <Filter size={20} color={colors.text} strokeWidth={1.5} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              Muscle Group
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {MUSCLE_GROUPS.map((group) =>
                  renderFilterChip(
                    group.label,
                    muscleFilter === group.key,
                    () => setMuscleFilter(group.key)
                  )
                )}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              Equipment
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {EQUIPMENT_TYPES.map((eq) =>
                  renderFilterChip(
                    eq.label,
                    equipmentFilter === eq.key,
                    () => setEquipmentFilter(eq.key)
                  )
                )}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              Difficulty
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {DIFFICULTY_LEVELS.map((diff) =>
                  renderFilterChip(
                    diff.label,
                    difficultyFilter === diff.key,
                    () => setDifficultyFilter(diff.key)
                  )
                )}
              </View>
            </ScrollView>
          </View>

          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
              <Text style={[styles.clearFiltersText, { color: colors.text }]}>
                Clear Filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreExercises}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoadingExercises ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.text} />
              <Text style={[styles.emptyText, { color: colors.textMuted, marginTop: Spacing.md }]}>
                Loading exercises from ExerciseDB...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Dumbbell size={48} color={colors.textMuted} strokeWidth={1} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No exercises found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMore && !isLoadingExercises && filteredExercises.length > 0 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={colors.text} />
              <Text style={[styles.loadingFooterText, { color: colors.textMuted }]}>
                Loading more exercises...
              </Text>
            </View>
          ) : null
        }
      />

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          visible={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          isDark={isDark}
          isFavorite={favoriteIds.has(selectedExercise.id)}
          onToggleFavorite={() => handleToggleFavorite(selectedExercise.id)}
        />
      )}
    </SafeAreaView>
  );
}

// Exercise Detail Modal Component
interface ExerciseDetailModalProps {
  exercise: Exercise;
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function ExerciseDetailModal({
  exercise,
  visible,
  onClose,
  isDark,
  isFavorite,
  onToggleFavorite,
}: ExerciseDetailModalProps) {
  const colors = isDark ? DarkColors : LightColors;
  const [exerciseGif, setExerciseGif] = useState<ExerciseDBExercise | null>(null);
  const [isLoadingGif, setIsLoadingGif] = useState(false);
  const [gifError, setGifError] = useState(false);

  // Use exercise GIF URL directly from API data (already fetched)
  useEffect(() => {
    if (!visible) {
      // Reset when modal closes
      setExerciseGif(null);
      setGifError(false);
      return;
    }

    // If exercise already has a gifUrl (from API), use it directly
    if (exercise.gifUrl) {
      setExerciseGif({
        id: exercise.exerciseDbId || exercise.id,
        name: exercise.name,
        bodyPart: exercise.primaryMuscle || 'core',
        target: exercise.primaryMuscle || 'core',
        equipment: exercise.equipment,
        gifUrl: exercise.gifUrl,
        instructions: exercise.instructions,
        secondaryMuscles: exercise.secondaryMuscles?.map(m => m) || [],
      });
      setIsLoadingGif(false);
      console.log('[ExerciseLibrary] Using GIF from API data:', exercise.name);
      return;
    }

    // Fallback: search for exercise if no gifUrl
    const fetchGif = async () => {
      setIsLoadingGif(true);
      setGifError(false);

      try {
        const results = await exerciseDbService.searchExercisesByName(exercise.name);

        if (results && results.length > 0) {
          setExerciseGif(results[0]);
          console.log('[ExerciseLibrary] Loaded GIF from search for:', exercise.name);
        } else {
          console.log('[ExerciseLibrary] No GIF found for:', exercise.name);
        }
      } catch (error) {
        console.error('[ExerciseLibrary] GIF fetch error:', error);
        setGifError(true);
      } finally {
        setIsLoadingGif(false);
      }
    };

    fetchGif();
  }, [visible, exercise.name, exercise.gifUrl, exercise.exerciseDbId, exercise.primaryMuscle, exercise.equipment, exercise.instructions, exercise.secondaryMuscles]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <BlurView intensity={100} style={styles.modalContainer}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.text} strokeWidth={1.5} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onToggleFavorite} style={styles.modalFavoriteButton}>
                <Heart
                  size={24}
                  color={isFavorite ? '#ff6b6b' : colors.textMuted}
                  fill={isFavorite ? '#ff6b6b' : 'transparent'}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{exercise.name}</Text>

            {/* Exercise GIF */}
            {isLoadingGif && (
              <View style={[styles.gifContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <ActivityIndicator size="large" color={colors.text} />
                <Text style={[styles.gifLoadingText, { color: colors.textMuted }]}>
                  Loading exercise demo...
                </Text>
              </View>
            )}
            {!isLoadingGif && exerciseGif?.gifUrl && !gifError && (
              <View style={styles.gifContainer}>
                <Image
                  source={{ uri: exerciseGif.gifUrl }}
                  style={styles.exerciseGif}
                  resizeMode="contain"
                  onError={() => setGifError(true)}
                />
                <Text style={[styles.gifCaption, { color: colors.textMuted }]}>
                  Proper Form Demo
                </Text>
              </View>
            )}
            {!isLoadingGif && !exerciseGif && !gifError && (
              <View style={[styles.gifPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <Dumbbell size={32} color={colors.textMuted} strokeWidth={1} />
                <Text style={[styles.gifPlaceholderText, { color: colors.textMuted }]}>
                  Form demo not available
                </Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Target size={20} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Difficulty</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {exercise.difficulty}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Dumbbell size={20} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Equipment</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {exercise.equipment.replace('_', ' ')}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Zap size={20} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Cal/min</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {exercise.caloriesPerMinute}
                </Text>
              </View>
            </View>

            {/* Muscle Groups */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Muscle Groups</Text>
              <View style={styles.muscleGroupsGrid}>
                {exercise.muscleGroups.map((muscle, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.muscleGroupChipLarge,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <Text style={[styles.muscleGroupTextLarge, { color: colors.text }]}>
                      {muscle}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Instructions */}
            {exercise.instructions && exercise.instructions.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
                {exercise.instructions.map((instruction, idx) => (
                  <View key={idx} style={styles.instructionRow}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.text }]}>
                      <Text style={[styles.stepNumberText, { color: colors.background }]}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                      {instruction}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tips */}
            {exercise.tips && exercise.tips.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips</Text>
                {exercise.tips.map((tip, idx) => (
                  <Text key={idx} style={[styles.tipText, { color: colors.textSecondary }]}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}

            {/* Alternatives */}
            {exercise.alternatives && exercise.alternatives.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Equipment Alternatives ({exercise.alternatives.length})
                </Text>
                {exercise.alternatives.slice(0, 5).map((alt, idx) => (
                  <View
                    key={idx}
                    style={[styles.alternativeCard, { backgroundColor: colors.backgroundSecondary }]}
                  >
                    <Text style={[styles.alternativeName, { color: colors.text }]}>
                      {alt.name}
                    </Text>
                    <Text style={[styles.alternativeEquipment, { color: colors.textMuted }]}>
                      {alt.equipment.replace('_', ' ')} • {alt.difficultyModifier}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  filterButton: {
    padding: 4,
    position: 'relative',
  },
  filterButtonActive: {
    opacity: 1,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: Fonts.semiBold,
  },
  filtersPanel: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  clearFiltersButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  clearFiltersText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  exerciseCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'capitalize',
  },
  equipmentText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textTransform: 'capitalize',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  favoriteButton: {
    padding: 4,
  },
  muscleGroupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  muscleGroupChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  muscleGroupText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'capitalize',
  },
  alternativesText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: Spacing.xs,
  },
  loadingFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  loadingFooterText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  closeButton: {
    padding: 8,
  },
  modalFavoriteButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.lg,
  },
  // GIF styles
  gifContainer: {
    marginBottom: Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  exerciseGif: {
    width: '100%',
    height: 300,
    borderRadius: 16,
  },
  gifCaption: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gifLoadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  gifPlaceholder: {
    height: 200,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  gifPlaceholderText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.md,
  },
  muscleGroupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleGroupChipLarge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  muscleGroupTextLarge: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    textTransform: 'capitalize',
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  tipText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  alternativeCard: {
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  alternativeName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  alternativeEquipment: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textTransform: 'capitalize',
  },
});
