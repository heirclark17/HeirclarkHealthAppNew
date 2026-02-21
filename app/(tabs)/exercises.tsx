/**
 * Exercise Library Tab - AI-Generated Exercises
 * Exercises from AI workout plans, persistently saved to database
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
import { api, SavedExercise } from '../../services/api';
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
  const [selectedExercise, setSelectedExercise] = useState<SavedExercise | null>(null);

  // Exercise data
  const [exercises, setExercises] = useState<SavedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Initialize: Load exercises from saved library
  useEffect(() => {
    loadExercisesFromDatabase();
  }, []);

  const loadExercisesFromDatabase = async () => {
    try {
      setIsLoading(true);
      console.log('[ExerciseLibrary] Loading saved exercises from database...');

      // Get saved exercises from backend (from AI-generated workouts)
      const savedExercises = await api.getSavedExercises();

      setTotalCount(savedExercises.length);
      setExercises(savedExercises);
      console.log(`[ExerciseLibrary] ✅ Loaded ${savedExercises.length} saved exercises`);
    } catch (error) {
      console.error('[ExerciseLibrary] Failed to load saved exercises:', error);
    } finally {
      setIsLoading(false);
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

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        (ex.muscleGroups && ex.muscleGroups.some(m => m.toLowerCase().includes(query))) ||
        (ex.category && ex.category.toLowerCase().includes(query))
      );
    }

    // Muscle filter - check if any muscle group matches
    if (muscleFilter !== 'all') {
      filtered = filtered.filter(ex => {
        if (!ex.muscleGroups || ex.muscleGroups.length === 0) return false;
        return ex.muscleGroups.some(m => m.toLowerCase().includes(muscleFilter.toLowerCase()));
      });
    }

    // Equipment filter
    if (equipmentFilter !== 'all') {
      filtered = filtered.filter(ex => {
        const eq = ex.equipment.toLowerCase();
        const filter = equipmentFilter.toLowerCase();
        return eq === filter || eq.includes(filter) || filter.includes(eq);
      });
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(ex => {
        // Use actual difficulty from SavedExercise if available
        const exerciseDifficulty = ex.difficulty || getDifficultyFromEquipment(ex.equipment);
        return exerciseDifficulty.toLowerCase() === difficultyFilter.toLowerCase();
      });
    }

    return filtered;
  }, [exercises, searchQuery, muscleFilter, equipmentFilter, difficultyFilter, getDifficultyFromEquipment]);

  const handleExercisePress = useCallback((exercise: SavedExercise) => {
    lightImpact();
    setSelectedExercise(exercise);
  }, []);

  // Render Exercise Card
  const renderExerciseCard = useCallback(
    ({ item }: { item: SavedExercise }) => {
      // Helper: Title case exercise name
      const toTitleCase = (str: string) => {
        return str
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      // Helper: Get difficulty badge color (using theme tokens)
      const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
          case 'beginner':
            return colors.successStrong;
          case 'intermediate':
            return colors.warningOrange;
          case 'advanced':
            return colors.errorStrong;
          default:
            return colors.textMuted;
        }
      };

      // Helper: Format equipment name
      const formatEquipment = (equipment: string) => {
        if (equipment === 'bodyweight') return 'Bodyweight';
        return toTitleCase(equipment);
      };

      // Helper: Get icon and color for muscle groups
      const getMuscleGroupIcon = (muscleGroups: string[]) => {
        if (!muscleGroups || muscleGroups.length === 0) {
          return { Icon: Dumbbell, color: colors.accentCyan, bg: colors.accentCyan + '18' };
        }
        const mg = muscleGroups[0].toLowerCase();
        if (mg.includes('chest')) return { Icon: StretchHorizontal, color: '#FF6B6B', bg: '#FF6B6B18' };
        if (mg.includes('back')) return { Icon: ArrowUpFromLine, color: '#4ECDC4', bg: '#4ECDC418' };
        if (mg.includes('shoulder')) return { Icon: PersonStanding, color: '#45B7D1', bg: '#45B7D118' };
        if (mg.includes('arm') || mg.includes('bicep') || mg.includes('tricep')) return { Icon: Dumbbell, color: '#F7DC6F', bg: '#F7DC6F18' };
        if (mg.includes('leg') || mg.includes('quad') || mg.includes('hamstring')) return { Icon: PersonStanding, color: '#82E0AA', bg: '#82E0AA18' };
        if (mg.includes('calves')) return { Icon: Footprints, color: '#73C6B6', bg: '#73C6B618' };
        if (mg.includes('core') || mg.includes('abs')) return { Icon: Activity, color: '#F0B27A', bg: '#F0B27A18' };
        return { Icon: Dumbbell, color: colors.accentCyan, bg: colors.accentCyan + '18' };
      };

      const difficulty = item.difficulty || getDifficultyFromEquipment(item.equipment);
      const difficultyColor = getDifficultyColor(difficulty);
      const { Icon: MuscleIcon, color: iconColor, bg: iconBg } = getMuscleGroupIcon(item.muscleGroups);

      return (
        <TouchableOpacity
          onPress={() => handleExercisePress(item)}
          activeOpacity={0.7}
        >
          <GlassCard style={styles.exerciseCard}>
            <View style={styles.cardContent}>
              {/* Muscle Group Icon */}
              <View style={[styles.bodyPartIcon, { backgroundColor: iconBg }]}>
                <MuscleIcon size={28} color={iconColor} strokeWidth={1.5} />
              </View>

              {/* Exercise Info */}
              <View style={styles.exerciseInfo}>
                {/* Exercise Name */}
                <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
                  {toTitleCase(item.name)}
                </Text>

                {/* Primary Muscle Badge */}
                {item.primaryMuscle && (
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
                      {toTitleCase(item.primaryMuscle)}
                    </Text>
                  </BlurView>
                )}

                {/* Metadata Badges */}
                <View style={styles.exerciseMeta}>
                  {/* Category */}
                  {item.category && (
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
                        {toTitleCase(item.category)}
                      </Text>
                    </BlurView>
                  )}

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
                      {toTitleCase(difficulty)}
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
            </View>
          </GlassCard>
        </TouchableOpacity>
      );
    },
    [colors, handleExercisePress, isDark, getDifficultyFromEquipment]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Exercise Library</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {totalCount > 0 ? `${totalCount.toLocaleString()} saved exercises` : 'No exercises yet'}
          </Text>
        </View>
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
                {totalCount === 0 ? 'No saved exercises yet' : 'No exercises found'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                {totalCount === 0 ? 'Generate an AI workout plan to save exercises' : 'Try adjusting your filters'}
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
        />
      )}
    </SafeAreaView>
  );
}

// Exercise Detail Modal Component
interface ExerciseDetailModalProps {
  exercise: SavedExercise;
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

function ExerciseDetailModal({
  exercise,
  visible,
  onClose,
  isDark,
}: ExerciseDetailModalProps) {
  const colors = isDark ? DarkColors : LightColors;
  const [gifLoading, setGifLoading] = useState(true);

  // Title case helper
  const toTitleCase = (str: string) =>
    str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // Derive difficulty from equipment
  const getDifficulty = (equipment: string) => {
    const eq = equipment.toLowerCase();
    if (eq.includes('body') || eq === 'assisted' || eq === 'stability ball') return 'beginner';
    if (eq.includes('dumbbell') || eq.includes('kettlebell') || eq.includes('band') || eq === 'ez barbell') return 'intermediate';
    return 'advanced';
  };

  const difficulty = exercise.difficulty || getDifficulty(exercise.equipment);
  const difficultyColor =
    difficulty.toLowerCase() === 'beginner' ? colors.successStrong :
    difficulty.toLowerCase() === 'intermediate' ? colors.warningOrange :
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
                {toTitleCase(difficulty)}
              </Text>
            </View>

            {/* Exercise GIF */}
            {exercise.gifUrl && (
              <View style={styles.gifContainer}>
                {gifLoading && (
                  <View style={styles.gifLoadingOverlay}>
                    <ActivityIndicator size="small" color={colors.textMuted} />
                  </View>
                )}
                <Image
                  source={{ uri: exercise.gifUrl }}
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
              {exercise.primaryMuscle && (
                <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                  <Target size={20} color={colors.text} strokeWidth={1.5} />
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Primary</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {toTitleCase(exercise.primaryMuscle)}
                  </Text>
                </View>
              )}
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Dumbbell size={20} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Equipment</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {exercise.equipment === 'bodyweight' ? 'Bodyweight' : toTitleCase(exercise.equipment)}
                </Text>
              </View>
              {exercise.category && (
                <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                  <Zap size={20} color={colors.text} strokeWidth={1.5} />
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Category</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {toTitleCase(exercise.category)}
                  </Text>
                </View>
              )}
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

            {/* Muscle Groups */}
            {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Muscle Groups</Text>
                <View style={styles.muscleGroupsGrid}>
                  {exercise.muscleGroups.map((muscle, idx) => (
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
