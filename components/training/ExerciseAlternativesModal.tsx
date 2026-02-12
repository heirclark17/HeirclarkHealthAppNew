// Exercise Alternatives Modal
// Shows all equipment variations for a given exercise
// iOS 26 Liquid Glass Design

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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { Exercise, ExerciseAlternative, DifficultyModifier } from '../../types/training';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// iOS 26 Liquid Glass colors
const GLASS_COLORS = {
  light: {
    background: '#F8F8F8',
    card: 'rgba(255, 255, 255, 0.75)',
    cardBorder: 'rgba(255, 255, 255, 0.5)',
    text: Colors.text,
    textMuted: 'rgba(60, 60, 67, 0.6)',
    textSecondary: 'rgba(60, 60, 67, 0.4)',
    border: 'rgba(0, 0, 0, 0.08)',
    buttonBg: 'rgba(255, 255, 255, 0.6)',
    secondaryBg: 'rgba(0, 0, 0, 0.04)',
  },
  dark: {
    background: '#0A0A0A',
    card: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    text: Colors.text,
    textMuted: 'rgba(235, 235, 245, 0.6)',
    textSecondary: 'rgba(235, 235, 245, 0.4)',
    border: 'rgba(255, 255, 255, 0.1)',
    buttonBg: 'rgba(255, 255, 255, 0.1)',
    secondaryBg: 'rgba(255, 255, 255, 0.06)',
  },
};

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
const getDifficultyColor = (modifier: DifficultyModifier, isDark: boolean): string => {
  switch (modifier) {
    case 'easier':
      return Colors.goalAchieved; // iOS Green
    case 'same':
      return isDark ? GLASS_COLORS.dark.text : GLASS_COLORS.light.text;
    case 'harder':
      return Colors.errorStrong; // iOS Red
    default:
      return isDark ? GLASS_COLORS.dark.textMuted : GLASS_COLORS.light.textMuted;
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
  glassColors,
  isDark,
}: {
  alternative: ExerciseAlternative;
  index: number;
  onSelect: () => void;
  glassColors: typeof GLASS_COLORS.dark;
  isDark: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    mediumImpact();
    scale.value = withSpring(0.98, GLASS_SPRING);
    setTimeout(() => {
      scale.value = withSpring(1, GLASS_SPRING);
    }, 100);
    onSelect();
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.alternativeCard, { backgroundColor: glassColors.card, borderColor: glassColors.cardBorder }]}
        onPress={handlePress}
        activeOpacity={1}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: glassColors.secondaryBg }]}>
            <Ionicons
              name={getEquipmentIcon(alternative.equipment) as any}
              size={24}
              color={glassColors.text}
            />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.alternativeName, { color: glassColors.text }]}>{alternative.name}</Text>
            <View style={styles.badges}>
              <View style={[styles.equipmentBadge, { backgroundColor: glassColors.secondaryBg }]}>
                <Text style={[styles.equipmentBadgeText, { color: glassColors.textSecondary }]}>
                  {formatEquipment(alternative.equipment)}
                </Text>
              </View>
              <View
                style={[
                  styles.difficultyBadge,
                  { borderColor: getDifficultyColor(alternative.difficultyModifier, isDark) },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyBadgeText,
                    { color: getDifficultyColor(alternative.difficultyModifier, isDark) },
                  ]}
                >
                  {getDifficultyLabel(alternative.difficultyModifier)}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={glassColors.textMuted} />
        </View>

        <Text style={[styles.muscleActivation, { color: glassColors.textSecondary }]}>{alternative.muscleActivationNotes}</Text>

        <View style={styles.whenToUse}>
          <Text style={[styles.whenToUseLabel, { color: glassColors.textMuted }]}>WHEN TO USE</Text>
          <View style={styles.useCaseTags}>
            {alternative.whenToUse.map((useCase, i) => (
              <View key={i} style={[styles.useCaseTag, { backgroundColor: glassColors.secondaryBg }]}>
                <Text style={[styles.useCaseText, { color: glassColors.textSecondary }]}>{useCase}</Text>
              </View>
            ))}
          </View>
        </View>

        {alternative.formCues && alternative.formCues.length > 0 && (
          <View style={styles.formCues}>
            <Text style={[styles.formCuesLabel, { color: glassColors.textMuted }]}>FORM CUES</Text>
            {alternative.formCues.map((cue, i) => (
              <View key={i} style={styles.formCueItem}>
                <Text style={[styles.formCueBullet, { color: Colors.success }]}>•</Text>
                <Text style={[styles.formCueText, { color: glassColors.textSecondary }]}>{cue}</Text>
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
  const isDark = settings.themeMode === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  // Close button animation
  const closeScale = useSharedValue(1);
  const closeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeScale.value }],
  }));

  const handleClose = () => {
    lightImpact();
    closeScale.value = withSpring(0.9, GLASS_SPRING);
    setTimeout(() => {
      closeScale.value = withSpring(1, GLASS_SPRING);
    }, 100);
    onClose();
  };

  if (!exercise) return null;

  const alternatives = exercise.alternatives || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: glassColors.background }]}>
        <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          {/* Header with Glass Effect */}
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.modalHeader, { borderBottomColor: glassColors.border }]}
          >
            <Animated.View style={closeAnimatedStyle}>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: glassColors.buttonBg, borderColor: glassColors.cardBorder }]}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color={glassColors.text} />
              </TouchableOpacity>
            </Animated.View>
            <View style={styles.headerCenter}>
              <Text style={[styles.modalTitle, { color: glassColors.textMuted }]}>Alternatives</Text>
              <Text style={[styles.exerciseName, { color: glassColors.text }]}>{exercise.name}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </BlurView>

          {/* Description */}
          <View style={styles.description}>
            <Text style={[styles.descriptionText, { color: glassColors.textMuted }]}>
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
                  glassColors={glassColors}
                  isDark={isDark}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color={glassColors.textMuted} />
                <Text style={[styles.emptyText, { color: glassColors.textMuted }]}>
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
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerCenter: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exerciseName: {
    fontSize: 18,
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
    borderRadius: 20,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    // Soft shadow
    shadowColor: Colors.background,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  alternativeName: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  equipmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  equipmentBadgeText: {
    fontSize: 11,
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
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  whenToUse: {
    marginBottom: Spacing.sm,
  },
  whenToUseLabel: {
    fontSize: 10,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  useCaseText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  formCues: {
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  formCuesLabel: {
    fontSize: 10,
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
    fontFamily: Fonts.regular,
    marginRight: 8,
  },
  formCueText: {
    fontSize: 13,
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
    fontFamily: Fonts.regular,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

export default ExerciseAlternativesModal;
