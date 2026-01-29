// Exercise Alternatives Modal
// Shows all equipment variations for a given exercise

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { Exercise, ExerciseAlternative, DifficultyModifier } from '../../types/training';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';

interface ExerciseAlternativesModalProps {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onSelectAlternative: (alternative: ExerciseAlternative) => void;
}

// Get icon for equipment type
const getEquipmentIcon = (equipment: string): string => {
  const icons: Record<string, string> = {
    barbell: 'barbell-outline',
    dumbbells: 'fitness-outline',
    bodyweight: 'body-outline',
    cable_machine: 'git-network-outline',
    resistance_bands: 'ellipse-outline',
    kettlebell: 'disc-outline',
    smith_machine: 'grid-outline',
    pull_up_bar: 'arrow-up-outline',
    bench: 'bed-outline',
    none: 'hand-left-outline',
  };
  return icons[equipment] || 'help-outline';
};

// Get color for difficulty modifier
const getDifficultyColor = (modifier: DifficultyModifier): string => {
  switch (modifier) {
    case 'easier':
      return '#2ECC71'; // Green
    case 'same':
      return Colors.text;
    case 'harder':
      return Colors.calories; // Red
    default:
      return Colors.textMuted;
  }
};

// Get label for difficulty modifier
const getDifficultyLabel = (modifier: DifficultyModifier): string => {
  switch (modifier) {
    case 'easier':
      return 'Easier';
    case 'same':
      return 'Same';
    case 'harder':
      return 'Harder';
    default:
      return '';
  }
};

// Format equipment name
const formatEquipment = (equipment: string): string => {
  return equipment
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function AlternativeCard({
  alternative,
  index,
  onSelect,
  colors,
  isDark,
}: {
  alternative: ExerciseAlternative;
  index: number;
  onSelect: () => void;
  colors: any;
  isDark: boolean;
}) {
  const cardBg = isDark ? Colors.card : 'rgba(255, 255, 255, 0.9)';
  const borderColor = isDark ? Colors.border : 'rgba(0, 0, 0, 0.1)';
  const secondaryBg = isDark ? Colors.backgroundSecondary : 'rgba(0, 0, 0, 0.05)';
  return (
    <Animated.View entering={FadeInUp.delay(index * 50).springify().damping(15)}>
      <TouchableOpacity
        style={[styles.alternativeCard, { backgroundColor: cardBg, borderColor }]}
        onPress={() => {
          mediumImpact();
          onSelect();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: secondaryBg }]}>
            <Ionicons
              name={getEquipmentIcon(alternative.equipment) as any}
              size={24}
              color={colors.text}
            />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.alternativeName, { color: colors.text }]}>{alternative.name}</Text>
            <View style={styles.badges}>
              <View style={[styles.equipmentBadge, { backgroundColor: secondaryBg }]}>
                <Text style={[styles.equipmentBadgeText, { color: colors.textSecondary }]}>
                  {formatEquipment(alternative.equipment)}
                </Text>
              </View>
              <View
                style={[
                  styles.difficultyBadge,
                  { borderColor: getDifficultyColor(alternative.difficultyModifier) },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyBadgeText,
                    { color: getDifficultyColor(alternative.difficultyModifier) },
                  ]}
                >
                  {getDifficultyLabel(alternative.difficultyModifier)}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        <Text style={[styles.muscleActivation, { color: colors.textSecondary }]}>{alternative.muscleActivationNotes}</Text>

        <View style={styles.whenToUse}>
          <Text style={[styles.whenToUseLabel, { color: colors.textMuted }]}>WHEN TO USE</Text>
          <View style={styles.useCaseTags}>
            {alternative.whenToUse.map((useCase, i) => (
              <View key={i} style={[styles.useCaseTag, { backgroundColor: secondaryBg }]}>
                <Text style={[styles.useCaseText, { color: colors.textSecondary }]}>{useCase}</Text>
              </View>
            ))}
          </View>
        </View>

        {alternative.formCues && alternative.formCues.length > 0 && (
          <View style={styles.formCues}>
            <Text style={[styles.formCuesLabel, { color: colors.textMuted }]}>FORM CUES</Text>
            {alternative.formCues.map((cue, i) => (
              <View key={i} style={styles.formCueItem}>
                <Text style={styles.formCueBullet}>•</Text>
                <Text style={[styles.formCueText, { color: colors.textSecondary }]}>{cue}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ExerciseAlternativesModal({
  visible,
  exercise,
  onClose,
  onSelectAlternative,
}: ExerciseAlternativesModalProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds
  const cardBg = isDark ? Colors.card : 'rgba(255, 255, 255, 0.9)';

  if (!exercise) return null;

  const alternatives = exercise.alternatives || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: cardBg }]}
              onPress={() => {
                lightImpact();
                onClose();
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.modalTitle, { color: colors.textMuted }]}>Alternatives</Text>
              <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Description */}
          <View style={styles.description}>
            <Text style={[styles.descriptionText, { color: colors.textMuted }]}>
              Choose an alternative based on your available equipment and preferences.
              Each variation targets similar muscles with different equipment.
            </Text>
          </View>

          {/* Alternatives List */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {alternatives.length > 0 ? (
              alternatives.map((alt, index) => (
                <AlternativeCard
                  key={alt.id}
                  alternative={alt}
                  index={index}
                  onSelect={() => {
                    onSelectAlternative(alt);
                    onClose();
                  }}
                  colors={colors}
                  isDark={isDark}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No alternatives available for this exercise.
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exerciseName: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  description: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  alternativeCard: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  alternativeName: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  equipmentBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  equipmentBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  difficultyBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  muscleActivation: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  whenToUse: {
    marginBottom: Spacing.sm,
  },
  whenToUseLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    marginBottom: 6,
  },
  useCaseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  useCaseTag: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  useCaseText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  formCues: {
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  formCuesLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    marginBottom: 6,
  },
  formCueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  formCueBullet: {
    fontSize: 14,
    color: Colors.protein,
    fontFamily: Fonts.regular,
    marginRight: 8,
  },
  formCueText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

export default ExerciseAlternativesModal;
