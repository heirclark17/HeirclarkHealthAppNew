/**
 * Exercise Library Tab - Premium Version
 * 11,000+ exercises from ExerciseDB with database persistence
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
  X,
  Download,
  Check,
  ChevronRight,
  Heart,
  Target,
  Zap,
  Info,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { DarkColors, LightColors, Spacing, Fonts } from '../../constants/Theme';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { exerciseDbService } from '../../services/exerciseDbService';
import { api } from '../../services/api';
import type { ExerciseDBExercise } from '../../types/ai';
import type { Exercise, MuscleGroup, Equipment } from '../../types/training';

// Filter types
type MuscleFilter = 'all' | 'chest' | 'back' | 'shoulders' | 'upper arms' | 'lower arms' | 'upper legs' | 'lower legs' | 'waist' | 'cardio';
type EquipmentFilter = 'all' | 'barbell' | 'dumbbell' | 'cable' | 'body weight' | 'resistance band' | 'machine';

const MUSCLE_GROUPS: { key: MuscleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'upper arms', label: 'Arms' },
  { key: 'upper legs', label: 'Legs' },
  { key: 'lower legs', label: 'Calves' },
  { key: 'waist', label: 'Core' },
  { key: 'cardio', label: 'Cardio' },
];

const EQUIPMENT_TYPES: { key: EquipmentFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'body weight', label: 'Bodyweight' },
  { key: 'dumbbell', label: 'Dumbbells' },
  { key: 'barbell', label: 'Barbell' },
  { key: 'cable', label: 'Cable' },
  { key: 'resistance band', label: 'Bands' },
  { key: 'machine', label: 'Machine' },
];

export default function ExercisesScreen() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleFilter>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDBExercise | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Exercise data
  const [exercises, setExercises] = useState<ExerciseDBExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Load All state
  const [showLoadAllModal, setShowLoadAllModal] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadProgressText, setLoadProgressText] = useState('');

  // Initialize: Load exercises and favorites from database
  useEffect(() => {
    loadExercisesFromDatabase();
    loadFavorites();
  }, []);

  const loadExercisesFromDatabase = async () => {
    try {
      setIsLoading(true);
      console.log('[ExerciseLibrary] Loading exercises from database...');

      // Get count and exercises from backend
      const [count, dbExercises] = await Promise.all([
        api.getExerciseCount(),
        api.getExercises({ limit: 10000 }) // Get all exercises
      ]);

      setTotalCount(count);
      setExercises(dbExercises);
      console.log(`[ExerciseLibrary] ✅ Loaded ${dbExercises.length} exercises from database`);
    } catch (error) {
      console.error('[ExerciseLibrary] Failed to load from database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      console.log('[ExerciseLibrary] Loading favorites...');
      const favoriteExerciseIds = await api.getFavoriteExercises();
      setFavoriteIds(new Set(favoriteExerciseIds));
      console.log(`[ExerciseLibrary] ✅ Loaded ${favoriteExerciseIds.length} favorites`);
    } catch (error) {
      console.error('[ExerciseLibrary] Failed to load favorites:', error);
    }
  };

  // Load All Exercises from API
  const handleLoadAll = async () => {
    try {
      setIsLoadingAll(true);
      setShowLoadAllModal(true);
      setLoadProgress(0);
      setLoadProgressText('Initializing...');

      await exerciseDbService.initialize();

      // Estimate total exercises (API doesn't provide total count)
      const ESTIMATED_TOTAL = 1400;
      const BATCH_SIZE = 10;
      let offset = 0;
      let allExercises: ExerciseDBExercise[] = [];
      let hasMore = true;

      while (hasMore) {
        setLoadProgressText(`Loading exercises ${offset + 1}-${offset + BATCH_SIZE}...`);
        setLoadProgress((offset / ESTIMATED_TOTAL) * 100);

        const batch = await exerciseDbService.getAllExercises(BATCH_SIZE, offset);

        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        allExercises = [...allExercises, ...batch];

        // Sync batch to backend in background
        api.syncExercises(batch).catch(err =>
          console.error('[ExerciseLibrary] Sync batch error:', err)
        );

        offset += BATCH_SIZE;

        // Stop if we've loaded a reasonable amount
        if (offset >= ESTIMATED_TOTAL) {
          hasMore = false;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setLoadProgressText(`Finalizing ${allExercises.length} exercises...`);
      setLoadProgress(90);

      // Final sync to ensure all exercises are in database
      await api.syncExercises(allExercises);

      setLoadProgress(100);
      setLoadProgressText(`✅ ${allExercises.length} exercises loaded!`);

      // Reload from database
      await loadExercisesFromDatabase();

      // Wait a moment to show success
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowLoadAllModal(false);
    } catch (error) {
      console.error('[ExerciseLibrary] Load all error:', error);
      setLoadProgressText('❌ Error loading exercises');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowLoadAllModal(false);
    } finally {
      setIsLoadingAll(false);
    }
  };

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let filtered = [...exercises];

    // Favorites filter (apply first)
    if (showFavoritesOnly) {
      filtered = filtered.filter(ex => favoriteIds.has(ex.id));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.bodyPart.toLowerCase().includes(query) ||
        ex.target.toLowerCase().includes(query)
      );
    }

    // Muscle filter
    if (muscleFilter !== 'all') {
      filtered = filtered.filter(ex => ex.bodyPart === muscleFilter);
    }

    // Equipment filter
    if (equipmentFilter !== 'all') {
      filtered = filtered.filter(ex => ex.equipment === equipmentFilter);
    }

    return filtered;
  }, [exercises, searchQuery, muscleFilter, equipmentFilter, showFavoritesOnly, favoriteIds]);

  const handleExercisePress = useCallback((exercise: ExerciseDBExercise) => {
    lightImpact();
    setSelectedExercise(exercise);
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    mediumImpact();

    const isFavorited = favoriteIds.has(id);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFavorited) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // Sync with backend
    try {
      if (isFavorited) {
        await api.removeFavoriteExercise(id);
      } else {
        await api.addFavoriteExercise(id);
      }
    } catch (error) {
      console.error('[ExerciseLibrary] Failed to sync favorite:', error);
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFavorited) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    }
  }, [favoriteIds]);

  // Render Exercise Card
  const renderExerciseCard = useCallback(
    ({ item }: { item: ExerciseDBExercise }) => {
      const isFavorite = favoriteIds.has(item.id);

      // Helper: Title case exercise name
      const toTitleCase = (str: string) => {
        return str
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      // Helper: Calculate difficulty from equipment type
      const getDifficulty = (equipment: string): 'Beginner' | 'Intermediate' | 'Advanced' => {
        const eq = equipment.toLowerCase();
        if (eq.includes('body') || eq === 'assisted' || eq === 'stability ball') {
          return 'Beginner';
        } else if (eq.includes('dumbbell') || eq.includes('kettlebell') || eq.includes('band') || eq === 'ez barbell') {
          return 'Intermediate';
        } else {
          return 'Advanced';
        }
      };

      // Helper: Get difficulty badge color
      const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
          case 'Beginner':
            return '#10b981'; // Green
          case 'Intermediate':
            return '#f59e0b'; // Orange
          case 'Advanced':
            return '#ef4444'; // Red
          default:
            return colors.textMuted;
        }
      };

      // Helper: Format equipment name
      const formatEquipment = (equipment: string) => {
        if (equipment === 'body weight') return 'Bodyweight';
        return toTitleCase(equipment);
      };

      const difficulty = getDifficulty(item.equipment);
      const difficultyColor = getDifficultyColor(difficulty);

      return (
        <TouchableOpacity
          onPress={() => handleExercisePress(item)}
          activeOpacity={0.7}
        >
          <GlassCard style={styles.exerciseCard}>
            <View style={styles.cardContent}>
              {/* GIF Thumbnail - Larger for better recognition */}
              {item.gifUrl && (
                <Image
                  source={{ uri: item.gifUrl }}
                  style={styles.gifThumbnail}
                  resizeMode="cover"
                />
              )}

              {/* Exercise Info */}
              <View style={styles.exerciseInfo}>
                {/* Exercise Name - Title Cased, Larger Font */}
                <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
                  {toTitleCase(item.name)}
                </Text>

                {/* Target Muscle Badge - Primary Info */}
                <View style={[styles.targetBadge, {
                  backgroundColor: colors.accentCyan + '20',
                  borderColor: colors.accentCyan + '40'
                }]}>
                  <Text style={[styles.targetText, { color: colors.accentCyan }]}>
                    🎯 {toTitleCase(item.target)}
                  </Text>
                </View>

                {/* Metadata Badges - Secondary Info */}
                <View style={styles.exerciseMeta}>
                  {/* Body Part */}
                  <View style={[styles.metaBadge, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      💪 {toTitleCase(item.bodyPart)}
                    </Text>
                  </View>

                  {/* Equipment */}
                  <View style={[styles.metaBadge, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      🏋️ {formatEquipment(item.equipment)}
                    </Text>
                  </View>

                  {/* Difficulty Level - Safety Critical */}
                  <View style={[styles.metaBadge, {
                    backgroundColor: difficultyColor + '20',
                    borderWidth: 1,
                    borderColor: difficultyColor + '40'
                  }]}>
                    <Text style={[styles.metaText, { color: difficultyColor }]}>
                      {difficulty}
                    </Text>
                  </View>

                  {/* Instruction Count - Complexity Indicator */}
                  {item.instructions && item.instructions.length > 0 && (
                    <View style={[styles.metaBadge, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>
                        ℹ️ {item.instructions.length} steps
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => handleToggleFavorite(item.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ?
                    `Remove ${item.name} from favorites` :
                    `Add ${item.name} to favorites`
                  }
                >
                  <Heart
                    size={22}
                    color={isFavorite ? '#ff6b6b' : colors.textSecondary}
                    fill={isFavorite ? '#ff6b6b' : 'transparent'}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      );
    },
    [colors, favoriteIds, handleExercisePress, handleToggleFavorite]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Exercise Library</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {totalCount > 0 ? `${totalCount.toLocaleString()} exercises available` : 'Loading...'}
          </Text>
        </View>

        {/* Load All Button */}
        {totalCount < 1000 && (
          <TouchableOpacity
            onPress={handleLoadAll}
            style={[styles.loadAllButton, { backgroundColor: colors.text }]}
          >
            <Download size={16} color={colors.background} strokeWidth={2} />
            <Text style={[styles.loadAllText, { color: colors.background }]}>
              Load All
            </Text>
          </TouchableOpacity>
        )}
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
      </View>

      {/* Favorites Filter */}
      {favoriteIds.size > 0 && (
        <View style={styles.favoritesSection}>
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setShowFavoritesOnly(!showFavoritesOnly);
            }}
            style={[
              styles.favoritesChip,
              {
                backgroundColor: showFavoritesOnly ? '#ff6b6b' : colors.backgroundSecondary,
                borderColor: showFavoritesOnly ? '#ff6b6b' : 'transparent',
              },
            ]}
          >
            <Heart
              size={18}
              color={showFavoritesOnly ? '#ffffff' : colors.textSecondary}
              fill={showFavoritesOnly ? '#ffffff' : 'transparent'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.favoritesChipText,
                {
                  color: showFavoritesOnly ? '#ffffff' : colors.textSecondary,
                  fontFamily: showFavoritesOnly ? Fonts.semiBold : Fonts.regular,
                },
              ]}
            >
              Favorites ({favoriteIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Muscle Group Filters */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
          Muscle Group
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {MUSCLE_GROUPS.map((group) => (
            <TouchableOpacity
              key={group.key}
              onPress={() => {
                lightImpact();
                setMuscleFilter(group.key);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: muscleFilter === group.key ? colors.text : colors.backgroundSecondary,
                  borderColor: muscleFilter === group.key ? colors.text : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: muscleFilter === group.key ? colors.background : colors.textSecondary,
                    fontFamily: muscleFilter === group.key ? Fonts.semiBold : Fonts.regular,
                  },
                ]}
              >
                {group.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Equipment Filters */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
          Equipment
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {EQUIPMENT_TYPES.map((eq) => (
            <TouchableOpacity
              key={eq.key}
              onPress={() => {
                lightImpact();
                setEquipmentFilter(eq.key);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: equipmentFilter === eq.key ? colors.text : colors.backgroundSecondary,
                  borderColor: equipmentFilter === eq.key ? colors.text : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: equipmentFilter === eq.key ? colors.background : colors.textSecondary,
                    fontFamily: equipmentFilter === eq.key ? Fonts.semiBold : Fonts.regular,
                  },
                ]}
              >
                {eq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      {(searchQuery || muscleFilter !== 'all' || equipmentFilter !== 'all') && (
        <View style={styles.resultsCount}>
          <Text style={[styles.resultsText, { color: colors.textMuted }]}>
            {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'} found
          </Text>
        </View>
      )}

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.text} />
              <Text style={[styles.emptyText, { color: colors.textMuted, marginTop: Spacing.md }]}>
                Loading exercises...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Dumbbell size={48} color={colors.textMuted} strokeWidth={1} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {totalCount === 0 ? 'No exercises loaded' : 'No exercises found'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                {totalCount === 0 ? 'Tap "Load All" to download exercises' : 'Try adjusting your filters'}
              </Text>
            </View>
          )
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

      {/* Load All Progress Modal */}
      <Modal visible={showLoadAllModal} transparent animationType="fade">
        <BlurView intensity={100} style={styles.modalOverlay}>
          <View style={[styles.progressModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>
              Loading Exercises
            </Text>
            <Text style={[styles.progressSubtitle, { color: colors.textMuted }]}>
              {loadProgressText}
            </Text>

            {/* Progress Bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.text,
                    width: `${loadProgress}%`,
                  },
                ]}
              />
            </View>

            <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
              {Math.round(loadProgress)}%
            </Text>

            {!isLoadingAll && loadProgress === 100 && (
              <TouchableOpacity
                onPress={() => setShowLoadAllModal(false)}
                style={[styles.closeProgressButton, { backgroundColor: colors.text }]}
              >
                <Check size={20} color={colors.background} strokeWidth={2} />
                <Text style={[styles.closeProgressText, { color: colors.background }]}>
                  Done
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

// Exercise Detail Modal Component
interface ExerciseDetailModalProps {
  exercise: ExerciseDBExercise;
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
                  color={isFavorite ? '#ff6b6b' : colors.text}
                  fill={isFavorite ? '#ff6b6b' : 'transparent'}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{exercise.name}</Text>

            {/* Exercise GIF */}
            {exercise.gifUrl && (
              <View style={styles.gifContainer}>
                <Image
                  source={{ uri: exercise.gifUrl }}
                  style={styles.exerciseGif}
                  resizeMode="contain"
                />
                <Text style={[styles.gifCaption, { color: colors.textMuted }]}>
                  Proper Form Demo
                </Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Target size={20} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Target</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {exercise.target}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Dumbbell size={20} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Equipment</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {exercise.equipment}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Zap size={20} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Muscle</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {exercise.bodyPart}
                </Text>
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

            {/* Secondary Muscles */}
            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Secondary Muscles</Text>
                <View style={styles.muscleGroupsGrid}>
                  {exercise.secondaryMuscles.map((muscle, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.muscleGroupChip,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <Text style={[styles.muscleGroupText, { color: colors.text }]}>
                        {muscle}
                      </Text>
                    </View>
                  ))}
                </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
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
  loadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    gap: 6,
  },
  loadAllText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
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
  favoritesSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  favoritesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
  },
  favoritesChipText: {
    fontSize: 14,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  resultsCount: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  exerciseCard: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  gifThumbnail: {
    width: 80, // Increased from 60 for better recognition
    height: 80,
    borderRadius: 12, // Increased from 8 for consistency with Liquid Glass
    marginRight: Spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17, // Increased from 15 to iOS standard
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.sm, // Changed from 6 to use design token (8px)
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  targetText: {
    fontSize: 12, // Slightly larger than metadata
    fontFamily: Fonts.semiBold,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: Spacing.sm, // Changed from 6 to 8 (design token)
    flexWrap: 'wrap',
  },
  metaBadge: {
    paddingHorizontal: Spacing.sm, // 8px
    paddingVertical: Spacing.xs, // Changed from 3 to 4 (design token)
    borderRadius: Spacing.xs, // Changed from 6 to 4 for consistency
  },
  metaText: {
    fontSize: 12, // Increased from 11 for better readability
    fontFamily: Fonts.medium,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md, // Keep spacing for touch targets
    marginLeft: Spacing.sm,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  progressModal: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  progressSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.md,
  },
  closeProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: 8,
  },
  closeProgressText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
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
    fontSize: 24,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.lg,
  },
  gifContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  exerciseGif: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  gifCaption: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.md,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  muscleGroupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleGroupChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  muscleGroupText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    textTransform: 'capitalize',
  },
});
