/**
 * Exercise Library Modal
 * Reusable modal for browsing and selecting exercises from workout screens
 */

import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  XCircle,
  Dumbbell,
  ChevronRight,
  Filter,
  X,
  Check,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { GlassCard } from './GlassCard';
import { DarkColors, LightColors, Spacing, Fonts } from '../constants/Theme';
import { lightImpact, mediumImpact } from '../utils/haptics';
import EXERCISE_DATABASE from '../data/exerciseDatabase';
import type { Exercise, MuscleGroup, Equipment } from '../types/training';
import { exerciseDbService } from '../services/exerciseDbService';
import type { ExerciseDBExercise } from '../types/ai';

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

interface ExerciseLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  isDark?: boolean;
  title?: string;
  equipmentFilter?: Equipment[];
}

export function ExerciseLibraryModal({
  visible,
  onClose,
  onSelectExercise,
  isDark = false,
  title = 'Exercise Library',
  equipmentFilter,
}: ExerciseLibraryModalProps) {
  const colors = isDark ? DarkColors : LightColors;

  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleFilter>('all');
  const [internalEquipmentFilter, setInternalEquipmentFilter] = useState<EquipmentFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Apply external equipment filter if provided
  const effectiveEquipmentFilter = equipmentFilter
    ? equipmentFilter
    : internalEquipmentFilter === 'all'
    ? undefined
    : [internalEquipmentFilter];

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let exercises = [...EXERCISE_DATABASE];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      exercises = exercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.muscleGroups.some((m) => m.toLowerCase().includes(query)) ||
          ex.category.toLowerCase().includes(query)
      );
    }

    // Muscle group filter
    if (muscleFilter !== 'all') {
      exercises = exercises.filter((ex) => ex.muscleGroups.includes(muscleFilter));
    }

    // Equipment filter (from props or internal)
    if (effectiveEquipmentFilter && effectiveEquipmentFilter.length > 0) {
      exercises = exercises.filter((ex) =>
        effectiveEquipmentFilter.includes(ex.equipment)
      );
    }

    return exercises;
  }, [searchQuery, muscleFilter, effectiveEquipmentFilter]);

  const handleExercisePress = useCallback(
    (exercise: Exercise) => {
      mediumImpact();
      onSelectExercise(exercise);
      onClose();
    },
    [onSelectExercise, onClose]
  );

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setMuscleFilter('all');
    if (!equipmentFilter) {
      setInternalEquipmentFilter('all');
    }
  }, [equipmentFilter]);

  const renderExerciseCard = useCallback(
    ({ item }: { item: Exercise }) => {
      return (
        <TouchableOpacity onPress={() => handleExercisePress(item)} activeOpacity={0.7}>
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
              <ChevronRight size={20} color={colors.textMuted} strokeWidth={1.5} />
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
          </GlassCard>
        </TouchableOpacity>
      );
    },
    [colors, handleExercisePress]
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <BlurView intensity={100} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {filteredExercises.length} exercises
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View
            style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}
          >
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
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Filter size={20} color={colors.text} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {/* Filters */}
          {showFilters && (
            <View
              style={[styles.filtersPanel, { backgroundColor: colors.backgroundSecondary }]}
            >
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

              {!equipmentFilter && (
                <View style={styles.filterSection}>
                  <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                    Equipment
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filterChips}>
                      {EQUIPMENT_TYPES.map((eq) =>
                        renderFilterChip(
                          eq.label,
                          internalEquipmentFilter === eq.key,
                          () => setInternalEquipmentFilter(eq.key)
                        )
                      )}
                    </View>
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={[styles.clearFiltersText, { color: colors.text }]}>
                  Clear Filters
                </Text>
              </TouchableOpacity>
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
              <View style={styles.emptyState}>
                <Dumbbell size={48} color={colors.textMuted} strokeWidth={1} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No exercises found
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  Try adjusting your search or filters
                </Text>
              </View>
            }
          />
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
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  closeButton: {
    padding: 8,
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
  muscleGroupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
});
