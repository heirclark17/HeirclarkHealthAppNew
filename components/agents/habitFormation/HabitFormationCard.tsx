/**
 * Habit Formation Card
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Colors } from '../../../constants/Theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';
import { useHabitFormation } from '../../../contexts/HabitFormationContext';
import { useGoalWizard } from '../../../contexts/GoalWizardContext';
import { useHydration } from '../../../contexts/HydrationContext';
import { useSleepRecovery } from '../../../contexts/SleepRecoveryContext';
import { useTraining } from '../../../contexts/TrainingContext';
import { useMealPlan } from '../../../contexts/MealPlanContext';
import { useAdaptiveTDEE } from '../../../contexts/AdaptiveTDEEContext';
import {
  Habit,
  HabitCategory,
  SuggestedHabit,
  UserHabitContext,
  SUGGESTED_HABITS,
  CATEGORY_ICONS,
} from '../../../types/habitFormation';
import { Fonts } from '../../../constants/Theme';
import { NumberText } from '../../../components/NumberText';

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

export default function HabitFormationCard() {
  const { colors } = useGlassTheme();
  const {
    state, aiSuggestions, isGeneratingSuggestions,
    addHabit, completeHabit, skipHabit, getTodayHabits, getHabitStreak, generateAISuggestions,
  } = useHabitFormation();

  // External context hooks for building UserHabitContext
  const { state: goalState } = useGoalWizard();
  const { state: hydrationState, getAverageIntake } = useHydration();
  const { state: sleepState } = useSleepRecovery();
  const { state: trainingState } = useTraining();
  const { state: mealState } = useMealPlan();
  const { state: tdeeState, getRecommendedCalories } = useAdaptiveTDEE();

  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('custom');
  const hasRequestedAI = useRef(false);

  const todayHabits = useMemo(() => getTodayHabits(), [getTodayHabits]);
  const summary = state.todaySummary;

  // Build UserHabitContext from all contexts
  const userHabitContext = useMemo((): UserHabitContext => {
    // Compute weight trend from TDEE weight history
    let weightTrend: 'losing' | 'gaining' | 'stable' | 'unknown' = 'unknown';
    const history = tdeeState.weightHistory;
    if (history && history.length >= 3) {
      const recent = history.slice(-3);
      const first = recent[0]?.weight ?? 0;
      const last = recent[recent.length - 1]?.weight ?? 0;
      const diff = last - first;
      if (diff < -0.5) weightTrend = 'losing';
      else if (diff > 0.5) weightTrend = 'gaining';
      else weightTrend = 'stable';
    }

    // Compute sleep averages from entries
    let sleepAvgHours = 0;
    let sleepAvgQuality = 3;
    const sleepEntries = sleepState.sleepEntries || [];
    if (sleepEntries.length > 0) {
      const totalMin = sleepEntries.reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
      sleepAvgHours = Math.round((totalMin / sleepEntries.length / 60) * 10) / 10;
      const totalQuality = sleepEntries.reduce((sum: number, e: any) => sum + (e.quality || 3), 0);
      sleepAvgQuality = Math.round((totalQuality / sleepEntries.length) * 10) / 10;
    }

    return {
      primaryGoal: goalState.primaryGoal || 'not_set',
      currentWeight: goalState.currentWeight || 0,
      targetWeight: goalState.targetWeight || 0,
      activityLevel: goalState.activityLevel || 'moderate',
      dietStyle: goalState.dietStyle || 'standard',
      isFasting: goalState.intermittentFasting || false,
      fastingWindow: goalState.intermittentFasting
        ? { start: goalState.fastingStart || '12:00', end: goalState.fastingEnd || '20:00' }
        : undefined,
      hydrationGoalOz: hydrationState.todayGoal || 64,
      hydrationAvgOz: Math.round(getAverageIntake()),
      hydrationStreak: hydrationState.streak?.currentStreak || 0,
      sleepGoalHours: (sleepState.sleepGoal?.targetDuration || 480) / 60,
      sleepAvgHours,
      sleepDebtMinutes: sleepState.sleepDebt || 0,
      sleepAvgQuality,
      hasTrainingPlan: trainingState.weeklyPlan !== null,
      workoutsPerWeek: trainingState.preferences?.workoutsPerWeek || 0,
      trainingWeekIndex: trainingState.currentWeekIndex || 0,
      hasMealPlan: mealState.weeklyPlan !== null,
      mealsPerDay: goalState.mealsPerDay || 3,
      calorieTarget: getRecommendedCalories(),
      existingHabitNames: state.habits.map((h) => h.name),
      habitCompletionRate: summary?.completionRate || 0,
      weightTrend,
    };
  }, [
    goalState, hydrationState, sleepState, trainingState, mealState, tdeeState,
    state.habits, summary, getAverageIntake, getRecommendedCalories,
  ]);

  // Trigger AI suggestions when Add modal opens
  useEffect(() => {
    if (showAddModal && !hasRequestedAI.current && aiSuggestions.length === 0 && !isGeneratingSuggestions) {
      hasRequestedAI.current = true;
      generateAISuggestions(userHabitContext);
    }
  }, [showAddModal, aiSuggestions.length, isGeneratingSuggestions, generateAISuggestions, userHabitContext]);

  const handleAddHabit = useCallback(async () => {
    if (!newHabitName.trim()) return;

    await addHabit({
      name: newHabitName.trim(),
      description: '',
      category: newHabitCategory,
      icon: CATEGORY_ICONS[newHabitCategory],
      frequency: 'daily',
      reminderEnabled: false,
    });

    setNewHabitName('');
    setShowAddModal(false);
  }, [newHabitName, newHabitCategory, addHabit]);

  const handleAddSuggested = useCallback(async (habit: typeof SUGGESTED_HABITS[0]) => {
    await addHabit(habit);
  }, [addHabit]);

  const handleAddAISuggestion = useCallback(async (suggestion: SuggestedHabit) => {
    await addHabit({
      name: suggestion.name,
      description: suggestion.description,
      category: suggestion.category,
      icon: suggestion.icon,
      frequency: suggestion.frequency,
      reminderEnabled: false,
    });
  }, [addHabit]);

  // Filter AI suggestions to exclude already-added habits
  const filteredAISuggestions = useMemo(() => {
    return aiSuggestions.filter(
      (s) => !state.habits.some((h) => h.name.toLowerCase() === s.name.toLowerCase())
    );
  }, [aiSuggestions, state.habits]);

  const renderHabitItem = ({ habit, completion }: { habit: Habit; completion: any }) => {
    const streak = getHabitStreak(habit.id);
    const isCompleted = completion?.status === 'completed';
    const isSkipped = completion?.status === 'skipped';

    return (
      <View key={habit.id} style={styles.habitItem}>
        <View style={[styles.habitIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={habit.icon as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.habitInfo}>
          <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
          {streak && streak.currentStreak > 0 && (
            <NumberText weight="regular" style={[styles.habitStreak, { color: colors.textMuted }]}>
              {streak.currentStreak} day streak
            </NumberText>
          )}
        </View>
        <View style={styles.habitActions}>
          {!isCompleted && !isSkipped ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => completeHabit(habit.id)}
                accessibilityLabel={`Mark ${habit.name} as complete`}
                accessibilityRole="button"
                accessibilityHint={`Records completion of ${habit.name} for today${streak && streak.currentStreak > 0 ? ` and extends your ${streak.currentStreak} day streak` : ''}`}
              >
                <Ionicons name="checkmark" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.skipButton, { backgroundColor: colors.cardGlass }]}
                onPress={() => skipHabit(habit.id)}
                accessibilityLabel={`Skip ${habit.name} today`}
                accessibilityRole="button"
                accessibilityHint={`Marks ${habit.name} as skipped for today${streak && streak.currentStreak > 0 ? ' and breaks your current streak' : ''}`}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: isCompleted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(107, 114, 128, 0.15)' }]}>
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : 'remove-circle'}
                size={18}
                color={isCompleted ? Colors.successStrong : colors.textMuted}
              />
              <Text style={{ color: isCompleted ? Colors.successStrong : colors.textMuted, fontSize: 11, marginLeft: 4, fontFamily: Fonts.medium }}>
                {isCompleted ? 'Done' : 'Skipped'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSkeletonRow = (index: number) => (
    <View key={`skeleton-${index}`} style={[styles.suggestedItem, { borderBottomColor: colors.glassBorder }]}>
      <View style={[styles.habitIcon, { backgroundColor: colors.cardGlass }]} />
      <View style={styles.suggestedInfo}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.cardGlass, width: 120 }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.cardGlass, width: 200, marginTop: 6 }]} />
      </View>
    </View>
  );

  const renderAISuggestion = (suggestion: SuggestedHabit, index: number) => (
    <TouchableOpacity
      key={`ai-${index}`}
      style={[styles.suggestedItem, { borderBottomColor: colors.glassBorder }]}
      onPress={() => handleAddAISuggestion(suggestion)}
      accessibilityLabel={`Add ${suggestion.name} habit`}
      accessibilityRole="button"
      accessibilityHint={`Adds ${suggestion.name} to your daily habits: ${suggestion.reason}`}
    >
      <View style={styles.aiSuggestionLeft}>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[suggestion.priority] }]} />
        <View style={[styles.habitIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={suggestion.icon as any} size={18} color={colors.primary} />
        </View>
      </View>
      <View style={styles.suggestedInfo}>
        <Text style={[styles.suggestedName, { color: colors.text }]}>{suggestion.name}</Text>
        <Text style={[styles.suggestedDesc, { color: colors.textMuted }]}>{suggestion.description}</Text>
        <Text style={[styles.aiReason, { color: colors.primary }]}>{suggestion.reason}</Text>
      </View>
      <Ionicons name="add-circle" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="checkmark-done" size={26} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Habits</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {summary?.completedHabits || 0}/{summary?.totalHabits || 0} today
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
            accessibilityLabel="Add new habit"
            accessibilityRole="button"
            accessibilityHint="Opens form to create a custom habit or choose from suggested habits"
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        {summary && summary.totalHabits > 0 && (
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: colors.cardGlass }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${summary.completionRate}%` },
                ]}
              />
            </View>
            <NumberText weight="regular" style={[styles.progressText, { color: colors.textMuted }]}>
              {summary.completionRate}% complete
            </NumberText>
          </View>
        )}

        {/* Today's Habits Preview */}
        {todayHabits.length > 0 ? (
          <View style={styles.habitsPreview}>
            {todayHabits.slice(0, 3).map((item) => renderHabitItem(item))}
            {todayHabits.length > 3 && (
              <TouchableOpacity
                style={[styles.viewAllButton, { borderColor: colors.glassBorder }]}
                onPress={() => setShowHabitsModal(true)}
                accessibilityLabel={`View all ${todayHabits.length} habits for today`}
                accessibilityRole="button"
                accessibilityHint="Opens full list of today's habits with completion status and streaks"
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View all {todayHabits.length} habits
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No habits yet. Add one to get started!
            </Text>
          </View>
        )}
      </GlassCard>

      {/* All Habits Modal */}
      <Modal
        visible={showHabitsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHabitsModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Today's Habits</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowHabitsModal(false)}
              accessibilityLabel="Close habits list"
              accessibilityRole="button"
              accessibilityHint="Dismisses the full habits list and returns to the habits card"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {todayHabits.map((item) => renderHabitItem(item))}
          </ScrollView>
        </View>
      </Modal>

      {/* Add Habit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Habit</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowAddModal(false)}
              accessibilityLabel="Close add habit form"
              accessibilityRole="button"
              accessibilityHint="Dismisses the add habit form without saving and returns to the habits card"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {/* Custom Habit Input */}
            <GlassCard style={styles.inputCard}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Create Custom Habit</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, color: colors.text, borderColor: colors.glassBorder }]}
                placeholder="Habit name..."
                placeholderTextColor={colors.textMuted}
                value={newHabitName}
                onChangeText={setNewHabitName}
              />
              <View style={styles.categoryPicker}>
                {(['nutrition', 'fitness', 'sleep', 'mindfulness', 'hydration', 'custom'] as HabitCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: newHabitCategory === cat ? colors.primary : colors.cardGlass,
                        borderColor: newHabitCategory === cat ? colors.primary : colors.glassBorder,
                      },
                    ]}
                    onPress={() => setNewHabitCategory(cat)}
                    accessibilityLabel={`${cat} category${newHabitCategory === cat ? ', currently selected' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: newHabitCategory === cat }}
                    accessibilityHint={`Selects ${cat} as the category for your new habit`}
                  >
                    <Text style={{ color: newHabitCategory === cat ? '#FFF' : colors.textMuted, fontSize: 11, fontFamily: Fonts.medium }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary, opacity: newHabitName.trim() ? 1 : 0.5 }]}
                onPress={handleAddHabit}
                disabled={!newHabitName.trim()}
                accessibilityLabel={newHabitName.trim() ? `Create ${newHabitName} habit in ${newHabitCategory} category` : 'Create habit'}
                accessibilityRole="button"
                accessibilityState={{ disabled: !newHabitName.trim() }}
                accessibilityHint={newHabitName.trim() ? `Creates a new ${newHabitCategory} habit called ${newHabitName} for daily tracking` : 'Enter a habit name first to create a new habit'}
              >
                <Text style={styles.createButtonText}>Create Habit</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* AI Personalized Suggestions */}
            <View style={styles.aiSectionHeader}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 6 }]}>
                Personalized For You
              </Text>
            </View>
            {isGeneratingSuggestions ? (
              <View style={styles.aiLoadingSection}>
                {[0, 1, 2].map(renderSkeletonRow)}
                <View style={styles.aiLoadingIndicator}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.aiLoadingText, { color: colors.textMuted }]}>
                    Analyzing your data...
                  </Text>
                </View>
              </View>
            ) : filteredAISuggestions.length > 0 ? (
              <View style={styles.aiSuggestionsSection}>
                {filteredAISuggestions.map(renderAISuggestion)}
              </View>
            ) : aiSuggestions.length > 0 ? (
              <Text style={[styles.emptyAIText, { color: colors.textMuted }]}>
                All personalized suggestions have been added!
              </Text>
            ) : null}

            {/* General Suggested Habits */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>General Suggestions</Text>
            {SUGGESTED_HABITS.filter((sh) => !state.habits.some((h) => h.name === sh.name)).map((habit, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestedItem, { borderBottomColor: colors.glassBorder }]}
                onPress={() => handleAddSuggested(habit)}
                accessibilityLabel={`Add ${habit.name} habit`}
                accessibilityRole="button"
                accessibilityHint={`Adds ${habit.name} to your daily habits: ${habit.description}`}
              >
                <View style={[styles.habitIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={habit.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={styles.suggestedInfo}>
                  <Text style={[styles.suggestedName, { color: colors.text }]}>{habit.name}</Text>
                  <Text style={[styles.suggestedDesc, { color: colors.textMuted }]}>{habit.description}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontFamily: Fonts.semiBold },
  subtitle: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  addButton: { width: 36, height: 36, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  progressSection: { marginBottom: 12 },
  progressBar: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, marginTop: 4 },
  habitsPreview: {},
  habitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  habitIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  habitInfo: { flex: 1, marginLeft: 12 },
  habitName: { fontSize: 13, fontFamily: Fonts.medium },
  habitStreak: { fontSize: 11, marginTop: 2 },
  habitActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  skipButton: { width: 28, height: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 8 },
  viewAllText: { fontSize: 13, fontFamily: Fonts.medium },
  emptyState: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, fontFamily: Fonts.regular },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontFamily: Fonts.semiBold },
  closeButton: { width: 36, height: 36, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalContent: { flex: 1, padding: 16 },
  inputCard: { padding: 16, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontFamily: Fonts.semiBold, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: Fonts.regular, marginBottom: 12 },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  createButton: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  createButtonText: { color: '#FFF', fontSize: 14, fontFamily: Fonts.semiBold },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.semiBold, marginBottom: 12 },
  suggestedItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  suggestedInfo: { flex: 1, marginLeft: 12 },
  suggestedName: { fontSize: 14, fontFamily: Fonts.medium },
  suggestedDesc: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  // AI suggestion styles
  aiSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiSuggestionsSection: { marginBottom: 8 },
  aiLoadingSection: { marginBottom: 8 },
  aiLoadingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  aiLoadingText: { fontSize: 12, fontFamily: Fonts.regular },
  aiSuggestionLeft: { flexDirection: 'row', alignItems: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  aiReason: { fontSize: 11, fontFamily: Fonts.regular, fontStyle: 'italic', marginTop: 4 },
  skeletonLine: { height: 12, borderRadius: 6 },
  emptyAIText: { fontSize: 12, fontFamily: Fonts.regular, textAlign: 'center', paddingVertical: 12 },
});
