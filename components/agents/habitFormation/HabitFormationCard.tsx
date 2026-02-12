/**
 * Habit Formation Card
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Colors } from '../../../constants/Theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';
import { useHabitFormation } from '../../../contexts/HabitFormationContext';
import { Habit, HabitCategory, SUGGESTED_HABITS, CATEGORY_ICONS } from '../../../types/habitFormation';
import { Fonts } from '../../../constants/Theme';
import { NumberText } from '../../../components/NumberText';

export default function HabitFormationCard() {
  const { colors } = useGlassTheme();
  const { state, addHabit, completeHabit, skipHabit, getTodayHabits, getHabitStreak } = useHabitFormation();

  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('custom');

  const todayHabits = useMemo(() => getTodayHabits(), [getTodayHabits]);
  const summary = state.todaySummary;

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

  const renderHabitItem = ({ habit, completion }: { habit: Habit; completion: any }) => {
    const streak = getHabitStreak(habit.id);
    const isCompleted = completion?.status === 'completed';
    const isSkipped = completion?.status === 'skipped';

    return (
      <View key={habit.id} style={[styles.habitItem, { borderBottomColor: colors.glassBorder }]}>
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
              >
                <Ionicons name="checkmark" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.skipButton, { backgroundColor: colors.cardGlass }]}
                onPress={() => skipHabit(habit.id)}
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

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="checkmark-done" size={20} color={colors.primary} />
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
              >
                <Text style={styles.createButtonText}>Create Habit</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Suggested Habits */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested Habits</Text>
            {SUGGESTED_HABITS.filter((sh) => !state.habits.some((h) => h.name === sh.name)).map((habit, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestedItem, { borderBottomColor: colors.glassBorder }]}
                onPress={() => handleAddSuggested(habit)}
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
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontFamily: Fonts.semiBold },
  subtitle: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  addButton: { width: 36, height: 36, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  progressSection: { marginBottom: 12 },
  progressBar: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, marginTop: 4 },
  habitsPreview: {},
  habitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  habitIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  habitInfo: { flex: 1, marginLeft: 12 },
  habitName: { fontSize: 13, fontFamily: Fonts.medium },
  habitStreak: { fontSize: 11, marginTop: 2 },
  habitActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  skipButton: { width: 28, height: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderTopWidth: 1, marginTop: 8 },
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
});
