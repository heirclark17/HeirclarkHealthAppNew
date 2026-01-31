/**
 * Workout Form Coach Card
 * Dashboard card showing daily tip, form tracking, and exercise guidance
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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';
import { useWorkoutFormCoach } from '../../../contexts/WorkoutFormCoachContext';
import { Exercise, ExerciseCategory } from '../../../types/workoutFormCoach';
import { Fonts } from '../../../constants/Theme';

// Category icons
const CATEGORY_ICONS: Record<ExerciseCategory, keyof typeof Ionicons.glyphMap> = {
  chest: 'body',
  back: 'body',
  shoulders: 'body',
  biceps: 'body',
  triceps: 'body',
  legs: 'walk',
  core: 'fitness',
  glutes: 'body',
  compound: 'barbell',
  cardio: 'bicycle',
};

export default function WorkoutFormCoachCard() {
  const { colors } = useGlassTheme();
  const {
    state,
    getExercise,
    getExercisesByCategory,
    getPersonalizedTips,
    getAverageScore,
    isFavorite,
    toggleFavorite,
    markTipSeen,
    getRecommendations,
  } = useWorkoutFormCoach();

  const [showExercisesModal, setShowExercisesModal] = useState(false);
  const [showExerciseDetailModal, setShowExerciseDetailModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);

  // Get recommendations
  const recommendations = useMemo(() => getRecommendations(), [getRecommendations]);

  // Categories list
  const categories: ExerciseCategory[] = [
    'chest', 'back', 'shoulders', 'legs', 'core', 'compound'
  ];

  // Handle exercise tap
  const handleExerciseTap = useCallback((exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseDetailModal(true);
    setShowExercisesModal(false);
  }, []);

  // Handle daily tip tap
  const handleTipTap = useCallback(() => {
    if (state.dailyTip) {
      const exercise = getExercise(state.dailyTip.exerciseId);
      if (exercise) {
        handleExerciseTap(exercise);
        markTipSeen();
      }
    }
  }, [state.dailyTip, getExercise, handleExerciseTap, markTipSeen]);

  // Render exercise item
  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const avgScore = getAverageScore(item.id);
    const favorite = isFavorite(item.id);

    return (
      <TouchableOpacity
        style={[styles.exerciseItem, { borderBottomColor: colors.glassBorder }]}
        onPress={() => handleExerciseTap(item)}
      >
        <View style={[styles.exerciseIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons
            name={CATEGORY_ICONS[item.category]}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.exerciseMuscles, { color: colors.textMuted }]}>
            {item.musclesWorked.slice(0, 2).join(', ')}
          </Text>
        </View>
        <View style={styles.exerciseRight}>
          {avgScore !== null && (
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(avgScore) + '20' }]}>
              <Text style={[styles.scoreText, { color: getScoreColor(avgScore) }]}>
                {avgScore}%
              </Text>
            </View>
          )}
          {favorite && (
            <Ionicons name="heart" size={16} color={colors.primary} />
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  // Render form cue
  const renderFormCue = (cue: { id: string; order: number; cue: string; muscleActivation?: string }, index: number) => (
    <View key={cue.id} style={styles.cueItem}>
      <View style={[styles.cueNumber, { backgroundColor: colors.primary }]}>
        <Text style={styles.cueNumberText}>{cue.order}</Text>
      </View>
      <View style={styles.cueContent}>
        <Text style={[styles.cueText, { color: colors.text }]}>{cue.cue}</Text>
        {cue.muscleActivation && (
          <Text style={[styles.cueMuscle, { color: colors.textMuted }]}>
            {cue.muscleActivation}
          </Text>
        )}
      </View>
    </View>
  );

  // Render mistake item
  const renderMistake = (mistake: { id: string; mistake: string; correction: string; severity: string }) => (
    <View key={mistake.id} style={[styles.mistakeItem, { backgroundColor: getSeverityColor(mistake.severity) + '10' }]}>
      <View style={styles.mistakeHeader}>
        <Ionicons name="warning" size={16} color={getSeverityColor(mistake.severity)} />
        <Text style={[styles.mistakeText, { color: getSeverityColor(mistake.severity) }]}>
          {mistake.mistake}
        </Text>
      </View>
      <Text style={[styles.correctionText, { color: colors.textSecondary }]}>
        Fix: {mistake.correction}
      </Text>
    </View>
  );

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="fitness" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Form Coach</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {state.exercises.length} exercises
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.browseButton, { backgroundColor: colors.cardGlass }]}
            onPress={() => setShowExercisesModal(true)}
          >
            <Text style={[styles.browseButtonText, { color: colors.primary }]}>Browse</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Daily Tip */}
        {state.dailyTip && (
          <TouchableOpacity
            style={[styles.dailyTipCard, { backgroundColor: colors.primary + '15' }]}
            onPress={handleTipTap}
          >
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={18} color={colors.primary} />
              <Text style={[styles.tipLabel, { color: colors.primary }]}>TIP OF THE DAY</Text>
              {!state.dailyTip.seen && (
                <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tipExercise, { color: colors.text }]}>
              {state.dailyTip.exerciseName}
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {state.dailyTip.tip}
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
              onPress={() => {
                setSelectedCategory(category);
                setShowExercisesModal(true);
              }}
            >
              <Ionicons name={CATEGORY_ICONS[category]} size={14} color={colors.text} />
              <Text style={[styles.categoryText, { color: colors.text }]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recommended Exercises */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>RECOMMENDED</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommendations.slice(0, 3).map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={[styles.recommendedCard, { backgroundColor: colors.cardGlass }]}
                  onPress={() => handleExerciseTap(exercise)}
                >
                  <Text style={[styles.recommendedName, { color: colors.text }]} numberOfLines={1}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.recommendedCategory, { color: colors.textMuted }]}>
                    {exercise.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </GlassCard>

      {/* Exercises Modal */}
      <Modal
        visible={showExercisesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExercisesModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedCategory
                ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Exercises`
                : 'All Exercises'}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => {
                setShowExercisesModal(false);
                setSelectedCategory(null);
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={selectedCategory ? getExercisesByCategory(selectedCategory) : state.exercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.exercisesList}
          />
        </View>
      </Modal>

      {/* Exercise Detail Modal */}
      <Modal
        visible={showExerciseDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseDetailModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
              {selectedExercise?.name}
            </Text>
            <View style={styles.modalHeaderRight}>
              {selectedExercise && (
                <TouchableOpacity
                  style={[styles.favoriteButton, { backgroundColor: colors.cardGlass }]}
                  onPress={() => toggleFavorite(selectedExercise.id)}
                >
                  <Ionicons
                    name={isFavorite(selectedExercise.id) ? 'heart' : 'heart-outline'}
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
                onPress={() => setShowExerciseDetailModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {selectedExercise && (
            <ScrollView style={styles.detailContent}>
              {/* Basic Info */}
              <GlassCard style={styles.infoCard}>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {selectedExercise.description}
                </Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Muscles</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {selectedExercise.musclesWorked.join(', ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Equipment</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {selectedExercise.equipment.join(', ')}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Difficulty</Text>
                    <Text style={[styles.infoValue, { color: colors.primary }]}>
                      {selectedExercise.difficulty.charAt(0).toUpperCase() + selectedExercise.difficulty.slice(1)}
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Form Cues */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Form Cues</Text>
                {selectedExercise.formCues.map(renderFormCue)}
              </View>

              {/* Common Mistakes */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Common Mistakes</Text>
                {selectedExercise.commonMistakes.map(renderMistake)}
              </View>

              {/* Variations */}
              {selectedExercise.variations.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Variations</Text>
                  <View style={styles.chipContainer}>
                    {selectedExercise.variations.map((v, i) => (
                      <View key={i} style={[styles.variationChip, { backgroundColor: colors.cardGlass }]}>
                        <Text style={[styles.chipText, { color: colors.textSecondary }]}>{v}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Personalized Tips */}
              {getPersonalizedTips(selectedExercise.id).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Tips</Text>
                  {getPersonalizedTips(selectedExercise.id).map((tip, i) => (
                    <View key={i} style={[styles.personalTip, { backgroundColor: colors.primary + '10' }]}>
                      <Ionicons name="star" size={14} color={colors.primary} />
                      <Text style={[styles.personalTipText, { color: colors.textSecondary }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

// Helper functions
function getScoreColor(score: number): string {
  if (score >= 80) return Colors.successStrong;
  if (score >= 60) return Colors.warningOrange;
  return '#EF4444';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'serious': return '#EF4444';
    case 'moderate': return Colors.warningOrange;
    default: return '#6B7280';
  }
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontFamily: Fonts.semiBold },
  subtitle: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  browseButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  browseButtonText: { fontSize: 13, fontFamily: Fonts.medium },
  dailyTipCard: { padding: 14, borderRadius: 12, marginBottom: 12 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tipLabel: { fontSize: 10, fontFamily: Fonts.semiBold, letterSpacing: 0.5 },
  newBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' },
  newBadgeText: { color: '#FFF', fontSize: 9, fontFamily: Fonts.semiBold },
  tipExercise: { fontSize: 14, fontFamily: Fonts.semiBold, marginBottom: 4 },
  tipText: { fontSize: 12, fontFamily: Fonts.regular, lineHeight: 18 },
  categoriesScroll: { marginBottom: 12 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  categoryText: { fontSize: 12, fontFamily: Fonts.medium },
  recommendationsSection: { marginTop: 4 },
  sectionLabel: { fontSize: 10, fontFamily: Fonts.semiBold, letterSpacing: 0.5, marginBottom: 8 },
  recommendedCard: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginRight: 8, minWidth: 100 },
  recommendedName: { fontSize: 12, fontFamily: Fonts.semiBold },
  recommendedCategory: { fontSize: 10, fontFamily: Fonts.regular, marginTop: 2 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 18, fontFamily: Fonts.semiBold, flex: 1 },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  favoriteButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  exercisesList: { padding: 16 },
  exerciseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  exerciseIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exerciseInfo: { flex: 1, marginLeft: 12 },
  exerciseName: { fontSize: 14, fontFamily: Fonts.semiBold },
  exerciseMuscles: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  exerciseRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scoreText: { fontSize: 11, fontFamily: Fonts.semiBold },
  detailContent: { flex: 1, padding: 16 },
  infoCard: { padding: 16, marginBottom: 16 },
  description: { fontSize: 13, fontFamily: Fonts.regular, lineHeight: 20, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 10, fontFamily: Fonts.semiBold, letterSpacing: 0.3, marginBottom: 4 },
  infoValue: { fontSize: 12, fontFamily: Fonts.medium },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.semiBold, marginBottom: 12 },
  cueItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cueNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cueNumberText: { color: '#FFF', fontSize: 12, fontFamily: Fonts.semiBold },
  cueContent: { flex: 1, marginLeft: 12 },
  cueText: { fontSize: 13, fontFamily: Fonts.medium, lineHeight: 18 },
  cueMuscle: { fontSize: 11, fontFamily: Fonts.regular, marginTop: 2, fontStyle: 'italic' },
  mistakeItem: { padding: 12, borderRadius: 10, marginBottom: 8 },
  mistakeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  mistakeText: { fontSize: 13, fontFamily: Fonts.semiBold },
  correctionText: { fontSize: 12, fontFamily: Fonts.regular, marginLeft: 22 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variationChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  chipText: { fontSize: 12, fontFamily: Fonts.medium },
  personalTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 8, marginBottom: 8 },
  personalTipText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular, lineHeight: 18 },
});
