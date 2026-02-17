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
  PersonStanding,
  ArrowUpFromLine,
  Footprints,
  StretchHorizontal,
  Activity,
  Hand,
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
type MuscleFilter = 'all' | 'chest' | 'back' | 'shoulders' | 'upper arms' | 'lower arms' | 'upper legs' | 'lower legs' | 'waist' | 'neck' | 'cardio';
type EquipmentFilter = 'all' | 'barbell' | 'dumbbell' | 'cable' | 'body weight' | 'kettlebell' | 'resistance band' | 'machine';
type DifficultyFilter = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';

const MUSCLE_GROUPS: { key: MuscleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'upper arms', label: 'Arms' },
  { key: 'lower arms', label: 'Forearms' },
  { key: 'upper legs', label: 'Legs' },
  { key: 'lower legs', label: 'Calves' },
  { key: 'waist', label: 'Core' },
  { key: 'neck', label: 'Neck' },
  { key: 'cardio', label: 'Cardio' },
];

const EQUIPMENT_TYPES: { key: EquipmentFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'body weight', label: 'Bodyweight' },
  { key: 'dumbbell', label: 'Dumbbells' },
  { key: 'barbell', label: 'Barbell' },
  { key: 'cable', label: 'Cable' },
  { key: 'kettlebell', label: 'Kettlebell' },
  { key: 'resistance band', label: 'Bands' },
  { key: 'machine', label: 'Machine' },
];

const DIFFICULTY_LEVELS: { key: DifficultyFilter; label: string }[] = [
  { key: 'all', label: 'All Levels' },
  { key: 'Beginner', label: 'Beginner' },
  { key: 'Intermediate', label: 'Intermediate' },
  { key: 'Advanced', label: 'Advanced' },
];

export default function ExercisesScreen() {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleFilter>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
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

  // Helper: Calculate difficulty from equipment type (shared logic)
  const getDifficultyFromEquipment = useCallback((equipment: string): DifficultyFilter => {
    const eq = equipment.toLowerCase();
    if (eq.includes('body') || eq === 'assisted' || eq === 'stability ball') {
      return 'Beginner';
    } else if (eq.includes('dumbbell') || eq.includes('kettlebell') || eq.includes('band') || eq === 'ez barbell') {
      return 'Intermediate';
    } else {
      return 'Advanced';
    }
  }, []);

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

    // Equipment filter (use includes for broader matching: 'barbell' matches 'ez barbell', 'machine' matches 'leverage machine', etc.)
    if (equipmentFilter !== 'all') {
      filtered = filtered.filter(ex => {
        const eq = ex.equipment.toLowerCase();
        const filter = equipmentFilter.toLowerCase();
        // Match exact, or equipment contains filter keyword, or filter contains equipment keyword
        return eq === filter || eq.includes(filter) || filter.includes(eq);
      });
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(ex => {
        const exerciseDifficulty = getDifficultyFromEquipment(ex.equipment);
        return exerciseDifficulty === difficultyFilter;
      });
    }

    return filtered;
  }, [exercises, searchQuery, muscleFilter, equipmentFilter, difficultyFilter, showFavoritesOnly, favoriteIds, getDifficultyFromEquipment]);

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


      // Helper: Get difficulty badge color (using theme tokens)
      const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
          case 'Beginner':
            return colors.successStrong; // #4ADE80
          case 'Intermediate':
            return colors.warningOrange; // #FB923C
          case 'Advanced':
            return colors.errorStrong; // #FF3B30
          default:
            return colors.textMuted;
        }
      };

      // Helper: Format equipment name
      const formatEquipment = (equipment: string) => {
        if (equipment === 'body weight') return 'Bodyweight';
        return toTitleCase(equipment);
      };

      // Helper: Get icon and color for body part
      const getBodyPartIcon = (bodyPart: string) => {
        const bp = bodyPart.toLowerCase();
        const size = 28;
        const strokeWidth = 1.5;
        if (bp === 'chest') return { Icon: StretchHorizontal, color: '#FF6B6B', bg: '#FF6B6B18' };
        if (bp === 'back') return { Icon: ArrowUpFromLine, color: '#4ECDC4', bg: '#4ECDC418' };
        if (bp === 'shoulders') return { Icon: PersonStanding, color: '#45B7D1', bg: '#45B7D118' };
        if (bp === 'upper arms') return { Icon: Dumbbell, color: '#F7DC6F', bg: '#F7DC6F18' };
        if (bp === 'lower arms') return { Icon: Hand, color: '#BB8FCE', bg: '#BB8FCE18' };
        if (bp === 'upper legs') return { Icon: PersonStanding, color: '#82E0AA', bg: '#82E0AA18' };
        if (bp === 'lower legs') return { Icon: Footprints, color: '#73C6B6', bg: '#73C6B618' };
        if (bp === 'waist') return { Icon: Activity, color: '#F0B27A', bg: '#F0B27A18' };
        if (bp === 'cardio') return { Icon: Activity, color: '#EC7063', bg: '#EC706318' };
        if (bp === 'neck') return { Icon: PersonStanding, color: '#85C1E9', bg: '#85C1E918' };
        return { Icon: Dumbbell, color: colors.accentCyan, bg: colors.accentCyan + '18' };
      };

      const difficulty = getDifficultyFromEquipment(item.equipment);
      const difficultyColor = getDifficultyColor(difficulty);
      const { Icon: BodyPartIcon, color: iconColor, bg: iconBg } = getBodyPartIcon(item.bodyPart);

      return (
        <TouchableOpacity
          onPress={() => handleExercisePress(item)}
          activeOpacity={0.7}
        >
          <GlassCard style={styles.exerciseCard}>
            <View style={styles.cardContent}>
              {/* Body Part Icon (no GIF in list - saves API calls) */}
              <View style={[styles.bodyPartIcon, { backgroundColor: iconBg }]}>
                <BodyPartIcon size={28} color={iconColor} strokeWidth={1.5} />
              </View>

              {/* Exercise Info */}
              <View style={styles.exerciseInfo}>
                {/* Exercise Name */}
                <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
                  {toTitleCase(item.name)}
                </Text>

                {/* Target Muscle Badge - Primary Info with Frosted Glass */}
                <BlurView
                  intensity={isDark ? 20 : 35}
                  tint={isDark ? 'dark' : 'light'}
                  style={[styles.targetBadge, {
                    backgroundColor: colors.accentCyan + '20',
                    borderColor: colors.accentCyan + '40',
                    overflow: 'hidden',
                  }]}
                >
                  <Target size={14} color={colors.accentCyan} strokeWidth={2} />
                  <Text style={[styles.targetText, { color: colors.accentCyan }]}>
                    {toTitleCase(item.target)}
                  </Text>
                </BlurView>

                {/* Metadata Badges - Secondary Info */}
                <View style={styles.exerciseMeta}>
                  {/* Body Part */}
                  <BlurView
                    intensity={isDark ? 15 : 30}
                    tint={isDark ? 'dark' : 'light'}
                    style={[styles.metaBadge, {
                      backgroundColor: colors.glassCard,
                      overflow: 'hidden',
                    }]}
                  >
                    <Zap size={12} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {toTitleCase(item.bodyPart)}
                    </Text>
                  </BlurView>

                  {/* Equipment */}
                  <BlurView
                    intensity={isDark ? 15 : 30}
                    tint={isDark ? 'dark' : 'light'}
                    style={[styles.metaBadge, {
                      backgroundColor: colors.glassCard,
                      overflow: 'hidden',
                    }]}
                  >
                    <Dumbbell size={12} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {formatEquipment(item.equipment)}
                    </Text>
                  </BlurView>

                  {/* Difficulty Level */}
                  <BlurView
                    intensity={isDark ? 20 : 35}
                    tint={isDark ? 'dark' : 'light'}
                    style={[styles.metaBadge, {
                      backgroundColor: difficultyColor + '20',
                      borderWidth: 1,
                      borderColor: difficultyColor + '40',
                      overflow: 'hidden',
                    }]}
                  >
                    <Text style={[styles.metaText, { color: difficultyColor }]}>
                      {difficulty}
                    </Text>
                  </BlurView>

                  {/* Instruction Count */}
                  {item.instructions && item.instructions.length > 0 && (
                    <BlurView
                      intensity={isDark ? 15 : 30}
                      tint={isDark ? 'dark' : 'light'}
                      style={[styles.metaBadge, {
                        backgroundColor: colors.glassCard,
                        overflow: 'hidden',
                      }]}
                    >
                      <Info size={12} color={colors.textMuted} strokeWidth={2} />
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>
                        {item.instructions.length} steps
                      </Text>
                    </BlurView>
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
    [colors, favoriteIds, handleExercisePress, handleToggleFavorite, isDark, getDifficultyFromEquipment]
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

      {/* Difficulty Level Filters */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
          Difficulty Level
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {DIFFICULTY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.key}
              onPress={() => {
                lightImpact();
                setDifficultyFilter(level.key);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: difficultyFilter === level.key ? colors.text : colors.backgroundSecondary,
                  borderColor: difficultyFilter === level.key ? colors.text : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: difficultyFilter === level.key ? colors.background : colors.textSecondary,
                    fontFamily: difficultyFilter === level.key ? Fonts.semiBold : Fonts.regular,
                  },
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      {(searchQuery || muscleFilter !== 'all' || equipmentFilter !== 'all' || difficultyFilter !== 'all') && (
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
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
  const [gifLoading, setGifLoading] = useState(true);

  // Title case helper
  const toTitleCase = (str: string) =>
    str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // Derive difficulty from equipment
  const getDifficulty = (equipment: string) => {
    const eq = equipment.toLowerCase();
    if (eq.includes('body') || eq === 'assisted' || eq === 'stability ball') return 'Beginner';
    if (eq.includes('dumbbell') || eq.includes('kettlebell') || eq.includes('band') || eq === 'ez barbell') return 'Intermediate';
    return 'Advanced';
  };

  const difficulty = getDifficulty(exercise.equipment);
  const difficultyColor =
    difficulty === 'Beginner' ? colors.successStrong :
    difficulty === 'Intermediate' ? colors.warningOrange :
    colors.errorStrong;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
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

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {toTitleCase(exercise.name)}
            </Text>

            {/* Difficulty Badge */}
            <View style={[styles.modalDifficultyBadge, {
              backgroundColor: difficultyColor + '20',
              borderColor: difficultyColor + '40',
            }]}>
              <Text style={[styles.modalDifficultyText, { color: difficultyColor }]}>
                {difficulty}
              </Text>
            </View>

            {/* Exercise GIF - use higher resolution for detail view */}
            {exercise.gifUrl && (
              <View style={styles.gifContainer}>
                {gifLoading && (
                  <View style={styles.gifLoadingOverlay}>
                    <ActivityIndicator size="small" color={colors.textMuted} />
                  </View>
                )}
                <Image
                  source={{ uri: exercise.gifUrl.replace('resolution=180', 'resolution=360') }}
                  style={styles.exerciseGif}
                  resizeMode="contain"
                  onLoadStart={() => setGifLoading(true)}
                  onLoadEnd={() => setGifLoading(false)}
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
                  {toTitleCase(exercise.target)}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Dumbbell size={20} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Equipment</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {exercise.equipment === 'body weight' ? 'Bodyweight' : toTitleCase(exercise.equipment)}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Zap size={20} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Muscle</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {toTitleCase(exercise.bodyPart)}
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
                        {toTitleCase(muscle)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    marginBottom: 4,
    letterSpacing: 0.5,
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
    // Glass-appropriate shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  gifThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: Spacing.md,
  },
  bodyPartIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17, // iOS standard body text
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.sm,
    letterSpacing: -0.4, // Apple standard tracking for 17pt
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs, // Icon-to-text spacing
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12, // LiquidGlass.borderRadius.sm
    borderWidth: 0.5, // LiquidGlass.borderWidth.subtle
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  targetText: {
    fontSize: 13, // iOS footnote
    fontFamily: Fonts.semiBold,
    letterSpacing: -0.08, // Apple standard tracking for 13pt
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs, // Icon-to-text spacing
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.sm, // 8px for compact badges
  },
  metaText: {
    fontSize: 12, // iOS caption1
    fontFamily: Fonts.medium,
    letterSpacing: 0, // Standard tracking for 12pt
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
    marginBottom: Spacing.sm,
  },
  modalDifficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  modalDifficultyText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  gifContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  gifLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.sm,
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
