/**
 * Custom Workout Builder Tab
 * Allows users to create custom workouts from exercise library
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plus,
  X,
  Save,
  Trash2,
  Edit3,
  Dumbbell,
  ChevronRight,
  Check,
  Search,
  Target,
  Zap,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { DarkColors, LightColors, Spacing, Fonts } from '../../constants/Theme';
import { lightImpact, mediumImpact, heavyImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { useCustomWorkout, Exercise, WorkoutDay } from '../../contexts/CustomWorkoutContext';
import { exerciseDbService } from '../../services/exerciseDbService';
import type { ExerciseDBExercise } from '../../types/ai';

export default function CustomWorkoutBuilderScreen() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;
  const router = useRouter();

  const {
    state,
    updateWorkoutMetadata,
    addDay,
    removeDay,
    updateDayName,
    addExercise,
    removeExercise,
    updateExercise,
    saveCustomWorkout,
    cancelBuilding,
  } = useCustomWorkout();

  // Local state
  const [workoutName, setWorkoutName] = useState(state.currentWorkout?.name || '');
  const [workoutDescription, setWorkoutDescription] = useState(
    state.currentWorkout?.description || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Exercise library modal state
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [exercises, setExercises] = useState<ExerciseDBExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  // Exercise edit modal state
  const [editingExercise, setEditingExercise] = useState<{
    exercise: Exercise;
    dayIndex: number;
  } | null>(null);
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editRest, setEditRest] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editIntensity, setEditIntensity] = useState('');

  // Update metadata when name/description changes
  useEffect(() => {
    if (workoutName || workoutDescription) {
      updateWorkoutMetadata(workoutName, workoutDescription);
    }
  }, [workoutName, workoutDescription]);

  // Load initial exercises for library
  useEffect(() => {
    loadInitialExercises();
  }, []);

  const loadInitialExercises = async () => {
    setIsLoadingExercises(true);
    try {
      const data = await exerciseDbService.getAllExercises(50, 0);
      setExercises(data);
    } catch (error) {
      console.error('[CustomWorkoutBuilder] Error loading exercises:', error);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const searchExercises = useCallback(async (query: string) => {
    if (query.length < 2) {
      loadInitialExercises();
      return;
    }

    setIsLoadingExercises(true);
    try {
      const data = await exerciseDbService.searchExercisesByName(query);
      setExercises(data);
    } catch (error) {
      console.error('[CustomWorkoutBuilder] Search error:', error);
    } finally {
      setIsLoadingExercises(false);
    }
  }, []);

  // Handle opening exercise library for specific day
  const handleAddExerciseTap = (dayIndex: number) => {
    lightImpact();
    setSelectedDayIndex(dayIndex);
    setShowExerciseLibrary(true);
  };

  // Handle exercise selection from library
  const handleExerciseSelect = (dbExercise: ExerciseDBExercise) => {
    if (selectedDayIndex === null) return;

    mediumImpact();

    // Convert ExerciseDBExercise to Exercise format
    const exercise: Exercise = {
      id: dbExercise.id,
      name: dbExercise.name,
      type: dbExercise.bodyPart === 'cardio' ? 'cardio' : 'strength',
      equipment: dbExercise.equipment,
      bodyPart: dbExercise.bodyPart,
      target: dbExercise.target,
      gifUrl: dbExercise.gifUrl,
      // Default values will be added by context
    };

    addExercise(exercise, selectedDayIndex);
    setShowExerciseLibrary(false);
    setSelectedDayIndex(null);
    setSearchQuery('');
  };

  // Handle exercise edit
  const handleEditExercise = (exercise: Exercise, dayIndex: number) => {
    lightImpact();
    setEditingExercise({ exercise, dayIndex });
    setEditSets(exercise.sets?.toString() || '');
    setEditReps(exercise.reps || '');
    setEditRest(exercise.rest || '');
    setEditDuration(exercise.duration || '');
    setEditIntensity(exercise.intensity || '');
  };

  // Save exercise edits
  const handleSaveExerciseEdit = () => {
    if (!editingExercise) return;

    mediumImpact();

    const updates: Partial<Exercise> = {};
    if (editingExercise.exercise.type === 'strength') {
      if (editSets) updates.sets = parseInt(editSets, 10);
      if (editReps) updates.reps = editReps;
      if (editRest) updates.rest = editRest;
    } else {
      if (editDuration) updates.duration = editDuration;
      if (editIntensity) updates.intensity = editIntensity;
    }

    updateExercise(editingExercise.exercise.id, editingExercise.dayIndex, updates);
    setEditingExercise(null);
  };

  // Handle day name edit
  const handleEditDayName = (dayIndex: number, currentName: string) => {
    lightImpact();
    Alert.prompt(
      'Edit Day Name',
      'Enter a new name for this day',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newName) => {
            if (newName && newName.trim()) {
              updateDayName(dayIndex, newName.trim());
            }
          },
        },
      ],
      'plain-text',
      currentName
    );
  };

  // Handle save workout
  const handleSave = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Workout Name Required', 'Please enter a name for your workout.');
      return;
    }

    if (!state.currentWorkout?.workout_structure.days.length) {
      Alert.alert('Add Days', 'Please add at least one workout day.');
      return;
    }

    const hasExercises = state.currentWorkout.workout_structure.days.some(
      (day) => day.exercises.length > 0
    );
    if (!hasExercises) {
      Alert.alert('Add Exercises', 'Please add at least one exercise to your workout.');
      return;
    }

    heavyImpact();
    setIsSaving(true);

    const success = await saveCustomWorkout();

    setIsSaving(false);

    if (success) {
      Alert.alert('Workout Saved', 'Your custom workout has been saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } else {
      Alert.alert('Save Failed', state.error || 'Failed to save workout. Please try again.');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    lightImpact();
    Alert.alert('Discard Changes?', 'Are you sure you want to discard this workout?', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          cancelBuilding();
          router.back();
        },
      },
    ]);
  };

  // Render exercise card in library
  const renderExerciseLibraryCard = ({ item }: { item: ExerciseDBExercise }) => {
    const toTitleCase = (str: string) =>
      str
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return (
      <TouchableOpacity onPress={() => handleExerciseSelect(item)} activeOpacity={0.7}>
        <GlassCard style={styles.libraryExerciseCard}>
          <View style={styles.libraryCardContent}>
            {item.gifUrl && (
              <Image
                source={{ uri: item.gifUrl }}
                style={styles.libraryGifThumbnail}
                resizeMode="cover"
              />
            )}
            <View style={styles.libraryExerciseInfo}>
              <Text style={[styles.libraryExerciseName, { color: colors.text }]} numberOfLines={2}>
                {toTitleCase(item.name)}
              </Text>
              <View style={styles.libraryBadges}>
                <BlurView
                  intensity={isDark ? 20 : 35}
                  tint={isDark ? 'dark' : 'light'}
                  style={[
                    styles.libraryBadge,
                    {
                      backgroundColor: colors.accentCyan + '20',
                      borderColor: colors.accentCyan + '40',
                    },
                  ]}
                >
                  <Target size={12} color={colors.accentCyan} />
                  <Text style={[styles.libraryBadgeText, { color: colors.accentCyan }]}>
                    {toTitleCase(item.target)}
                  </Text>
                </BlurView>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  // Render exercise in workout day
  const renderWorkoutExercise = (exercise: Exercise, dayIndex: number) => {
    const toTitleCase = (str: string) =>
      str
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return (
      <GlassCard key={exercise.id} style={styles.exerciseCard}>
        <View style={styles.exerciseCardHeader}>
          <View style={styles.exerciseCardInfo}>
            <Text style={[styles.exerciseCardName, { color: colors.text }]} numberOfLines={2}>
              {toTitleCase(exercise.name)}
            </Text>
            {exercise.type === 'strength' ? (
              <Text style={[styles.exerciseCardDetails, { color: colors.textSecondary }]}>
                {exercise.sets} sets × {exercise.reps} reps, {exercise.rest} rest
              </Text>
            ) : (
              <Text style={[styles.exerciseCardDetails, { color: colors.textSecondary }]}>
                {exercise.duration}, {exercise.intensity} intensity
              </Text>
            )}
          </View>
          <View style={styles.exerciseCardActions}>
            <TouchableOpacity
              onPress={() => handleEditExercise(exercise, dayIndex)}
              style={styles.exerciseActionButton}
            >
              <Edit3 size={18} color={colors.accentCyan} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                removeExercise(exercise.id, dayIndex);
              }}
              style={styles.exerciseActionButton}
            >
              <Trash2 size={18} color={colors.errorStrong} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  };

  // Render workout day
  const renderWorkoutDay = (day: WorkoutDay, index: number) => {
    return (
      <GlassCard key={index} style={styles.dayCard}>
        {/* Day Header */}
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderLeft}>
            <Dumbbell size={20} color={colors.accentCyan} strokeWidth={2} />
            <Text style={[styles.dayName, { color: colors.text }]}>{day.dayName}</Text>
          </View>
          <View style={styles.dayHeaderRight}>
            <TouchableOpacity
              onPress={() => handleEditDayName(index, day.dayName)}
              style={styles.dayActionButton}
            >
              <Edit3 size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {state.currentWorkout && state.currentWorkout.workout_structure.days.length > 1 && (
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  Alert.alert('Remove Day?', `Remove "${day.dayName}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => removeDay(index),
                    },
                  ]);
                }}
                style={styles.dayActionButton}
              >
                <Trash2 size={18} color={colors.errorStrong} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          {day.exercises.map((exercise) => renderWorkoutExercise(exercise, index))}
        </View>

        {/* Add Exercise Button */}
        <TouchableOpacity
          onPress={() => handleAddExerciseTap(index)}
          style={[styles.addExerciseButton, { borderColor: colors.accentCyan + '40' }]}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.accentCyan} strokeWidth={2} />
          <Text style={[styles.addExerciseText, { color: colors.accentCyan }]}>
            Add Exercise
          </Text>
        </TouchableOpacity>
      </GlassCard>
    );
  };

  if (!state.isBuilding || !state.currentWorkout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.emptyState}>
          <Dumbbell size={64} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
            No workout in progress
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.accentCyan }]}
          >
            <Text style={[styles.backButtonText, { color: colors.background }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Custom Workout</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.headerButton, styles.saveButton, { backgroundColor: colors.accentCyan }]}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Save size={20} color={colors.background} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Name Input */}
        <GlassCard style={styles.inputCard}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Workout Name *
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g., Push/Pull/Legs Split"
            placeholderTextColor={colors.textMuted}
            value={workoutName}
            onChangeText={setWorkoutName}
            autoCapitalize="words"
          />
        </GlassCard>

        {/* Workout Description Input */}
        <GlassCard style={styles.inputCard}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Description (Optional)
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text }]}
            placeholder="Brief description of your workout program"
            placeholderTextColor={colors.textMuted}
            value={workoutDescription}
            onChangeText={setWorkoutDescription}
            multiline
            numberOfLines={3}
          />
        </GlassCard>

        {/* Workout Days */}
        {state.currentWorkout.workout_structure.days.map((day, index) =>
          renderWorkoutDay(day, index)
        )}

        {/* Add Day Button */}
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            addDay();
          }}
          style={[styles.addDayButton, { borderColor: colors.accentCyan + '40' }]}
          activeOpacity={0.7}
        >
          <Plus size={24} color={colors.accentCyan} strokeWidth={2} />
          <Text style={[styles.addDayText, { color: colors.accentCyan }]}>Add Day</Text>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Exercise Library Modal */}
      <Modal
        visible={showExerciseLibrary}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseLibrary(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          edges={['top']}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Exercise</Text>
            <TouchableOpacity
              onPress={() => {
                setShowExerciseLibrary(false);
                setSearchQuery('');
              }}
              style={styles.modalCloseButton}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.glassCard }]}>
            <Search size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchExercises(text);
              }}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  loadInitialExercises();
                }}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Exercise List */}
          {isLoadingExercises ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accentCyan} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Loading exercises...
              </Text>
            </View>
          ) : (
            <FlatList
              data={exercises}
              renderItem={renderExerciseLibraryCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.libraryList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Exercise Edit Modal */}
      <Modal
        visible={editingExercise !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent
        onRequestClose={() => setEditingExercise(null)}
      >
        <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.editModalBlur}>
          <View style={styles.editModalContainer}>
            <GlassCard style={styles.editModalCard}>
              <Text style={[styles.editModalTitle, { color: colors.text }]}>
                Edit Exercise
              </Text>

              {editingExercise?.exercise.type === 'strength' ? (
                <>
                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>
                      Sets
                    </Text>
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                      placeholder="3"
                      placeholderTextColor={colors.textMuted}
                      value={editSets}
                      onChangeText={setEditSets}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>
                      Reps
                    </Text>
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                      placeholder="8-12"
                      placeholderTextColor={colors.textMuted}
                      value={editReps}
                      onChangeText={setEditReps}
                    />
                  </View>

                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>
                      Rest
                    </Text>
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                      placeholder="60s"
                      placeholderTextColor={colors.textMuted}
                      value={editRest}
                      onChangeText={setEditRest}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>
                      Duration
                    </Text>
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                      placeholder="20 min"
                      placeholderTextColor={colors.textMuted}
                      value={editDuration}
                      onChangeText={setEditDuration}
                    />
                  </View>

                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>
                      Intensity
                    </Text>
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                      placeholder="Moderate"
                      placeholderTextColor={colors.textMuted}
                      value={editIntensity}
                      onChangeText={setEditIntensity}
                    />
                  </View>
                </>
              )}

              <View style={styles.editModalActions}>
                <TouchableOpacity
                  onPress={() => setEditingExercise(null)}
                  style={[styles.editModalButton, { backgroundColor: colors.glassCard }]}
                >
                  <Text style={[styles.editModalButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveExerciseEdit}
                  style={[styles.editModalButton, { backgroundColor: colors.accentCyan }]}
                >
                  <Text style={[styles.editModalButtonText, { color: colors.background }]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  inputCard: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    paddingVertical: Spacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dayCard: {
    marginBottom: Spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dayName: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  dayActionButton: {
    padding: Spacing.xs,
  },
  exerciseList: {
    gap: Spacing.sm,
  },
  exerciseCard: {
    marginBottom: Spacing.sm,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseCardInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  exerciseCardName: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  exerciseCardDetails: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  exerciseCardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  exerciseActionButton: {
    padding: Spacing.xs,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },
  addExerciseText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderRadius: 20,
    borderStyle: 'dashed',
    marginTop: Spacing.md,
  },
  addDayText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginTop: Spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    paddingVertical: 8,
  },
  libraryList: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  libraryExerciseCard: {
    marginBottom: Spacing.xs,
  },
  libraryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  libraryGifThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  libraryExerciseInfo: {
    flex: 1,
  },
  libraryExerciseName: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  libraryBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  libraryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  libraryBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  // Edit Modal Styles
  editModalBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  editModalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  editModalCard: {
    padding: Spacing.lg,
  },
  editModalTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  editInputGroup: {
    marginBottom: Spacing.md,
  },
  editInputLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.xs,
  },
  editInput: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  editModalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    alignItems: 'center',
  },
  editModalButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
