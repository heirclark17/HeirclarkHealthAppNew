/**
 * Form Coach Modal
 * Full-screen modal showing exercise form guidance with ExerciseDB integration
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Colors } from '../../../constants/Theme';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exerciseDbService } from '../../../services/exerciseDbService';
import { NumberText } from '../../NumberText';
import { ExerciseDBExercise } from '../../../types/ai';
import { Exercise, FormCue, CommonMistake } from '../../../types/workoutFormCoach';
import { useGlassTheme } from '../../liquidGlass';
import { mediumImpact } from '../../../utils/haptics';

interface FormCoachModalProps {
  visible: boolean;
  onClose: () => void;
  exercise?: Exercise | null;
  exerciseName?: string;
}

export function FormCoachModal({
  visible,
  onClose,
  exercise,
  exerciseName,
}: FormCoachModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useGlassTheme();

  const [exerciseDbData, setExerciseDbData] = useState<ExerciseDBExercise | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'mistakes' | 'variations'>('form');
  const [imageError, setImageError] = useState(false);

  // Load ExerciseDB data when modal opens
  useEffect(() => {
    if (visible && (exercise || exerciseName)) {
      loadExerciseData();
    }
  }, [visible, exercise, exerciseName]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setActiveTab('form');
      setImageError(false);
    }
  }, [visible]);

  const loadExerciseData = async () => {
    setIsLoading(true);
    setExerciseDbData(null);

    try {
      const searchName = exercise?.name || exerciseName || '';
      const results = await exerciseDbService.searchExercisesByName(searchName);

      if (results.length > 0) {
        // Find best match by name similarity
        const lowerName = searchName.toLowerCase();
        const bestMatch = results.find(e => e.name.toLowerCase() === lowerName) ||
                          results.find(e => e.name.toLowerCase().includes(lowerName)) ||
                          results[0];
        setExerciseDbData(bestMatch);
      }
    } catch (error) {
      console.error('Error loading exercise data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = exercise?.name || exerciseName || 'Exercise';

  // Get target muscles from either source
  const targetMuscles = useMemo(() => {
    if (exerciseDbData) {
      const muscles = [exerciseDbData.target];
      if (exerciseDbData.secondaryMuscles) {
        muscles.push(...exerciseDbData.secondaryMuscles);
      }
      return muscles;
    }
    return exercise?.musclesWorked || [];
  }, [exerciseDbData, exercise]);

  // Get equipment info
  const equipment = exerciseDbData?.equipment || exercise?.equipment?.join(', ') || 'Body weight';

  // Get instructions from either source
  const instructions = useMemo(() => {
    if (exerciseDbData?.instructions) {
      return exerciseDbData.instructions;
    }
    return exercise?.formCues.map(cue => cue.cue) || [];
  }, [exerciseDbData, exercise]);

  const renderTabButton = (tab: 'form' | 'mistakes' | 'variations', label: string, icon: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          {
            backgroundColor: isActive ? colors.primary : 'rgba(255,255,255,0.1)',
          },
        ]}
        onPress={() => {
          mediumImpact();
          setActiveTab(tab);
        }}
      >
        <Ionicons
          name={icon as any}
          size={16}
          color={isActive ? Colors.text : colors.textSecondary}
        />
        <Text
          style={[
            styles.tabButtonText,
            { color: isActive ? Colors.text : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFormCues = () => {
    const cues = exercise?.formCues || [];

    if (cues.length === 0 && instructions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="information-circle-outline" size={32} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No form cues available for this exercise
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.cuesList}>
        {(cues.length > 0 ? cues : instructions.map((instr, i) => ({ id: `instr_${i}`, cue: instr, order: i + 1 }))).map((cue, index) => (
          <View key={cue.id || index} style={styles.cueItem}>
            <View style={[styles.cueNumber, { backgroundColor: colors.primary + '20' }]}>
              <NumberText weight="semiBold" style={[styles.cueNumberText, { color: colors.primary }]}>
                {cue.order || index + 1}
              </NumberText>
            </View>
            <View style={styles.cueContent}>
              <Text style={[styles.cueText, { color: colors.text }]}>
                {cue.cue}
              </Text>
              {cue.muscleActivation && (
                <Text style={[styles.cueDetail, { color: colors.textSecondary }]}>
                  {cue.muscleActivation}
                </Text>
              )}
              {cue.breathingTip && (
                <View style={styles.breathingTip}>
                  <Ionicons name="fitness-outline" size={12} color={colors.primary} />
                  <Text style={[styles.breathingText, { color: colors.primary }]}>
                    {cue.breathingTip}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderMistakes = () => {
    const mistakes = exercise?.commonMistakes || [];

    if (mistakes.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={32} color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No common mistakes documented
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.mistakesList}>
        {mistakes.map((mistake, index) => (
          <View key={mistake.id || index} style={[styles.mistakeItem, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <View style={styles.mistakeHeader}>
              <Ionicons
                name="warning"
                size={16}
                color={mistake.severity === 'serious' ? '#ef4444' : mistake.severity === 'moderate' ? Colors.warningOrange : '#6b7280'}
              />
              <Text style={[styles.mistakeTitle, { color: colors.text }]}>
                {mistake.mistake}
              </Text>
            </View>
            <Text style={[styles.mistakeConsequence, { color: colors.textSecondary }]}>
              {mistake.consequence}
            </Text>
            <View style={[styles.correctionBox, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={[styles.correctionText, { color: colors.primary }]}>
                {mistake.correction}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderVariations = () => {
    const variations = exercise?.variations || [];
    const alternatives = exercise?.alternatives || [];

    if (variations.length === 0 && alternatives.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="shuffle-outline" size={32} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No variations documented
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.variationsList}>
        {variations.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Variations</Text>
            {variations.map((variation, index) => (
              <View key={index} style={[styles.variationItem, { borderBottomColor: colors.glassBorder }]}>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                <Text style={[styles.variationText, { color: colors.text }]}>{variation}</Text>
              </View>
            ))}
          </>
        )}
        {alternatives.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>Alternatives</Text>
            {alternatives.map((alt, index) => (
              <View key={index} style={[styles.variationItem, { borderBottomColor: colors.glassBorder }]}>
                <Ionicons name="swap-horizontal" size={16} color={colors.textSecondary} />
                <Text style={[styles.variationText, { color: colors.text }]}>{alt}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <BlurView
          intensity={80}
          tint="dark"
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.headerSpacer} />
        </BlurView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise Animation/Image */}
          <View style={styles.mediaContainer}>
            {isLoading ? (
              <View style={[styles.mediaPlaceholder, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading exercise demo...
                </Text>
              </View>
            ) : exerciseDbData?.gifUrl && !imageError ? (
              <Image
                source={{ uri: exerciseDbData.gifUrl }}
                style={styles.exerciseGif}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.mediaPlaceholder, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <Ionicons name="barbell-outline" size={64} color={colors.textTertiary} />
                <Text style={[styles.noMediaText, { color: colors.textSecondary }]}>
                  Animation not available
                </Text>
              </View>
            )}
          </View>

          {/* Target Muscles & Equipment */}
          <View style={styles.infoRow}>
            <View style={[styles.infoCard, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="body-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Target</Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
                {targetMuscles.slice(0, 3).join(', ')}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="barbell-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Equipment</Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
                {equipment}
              </Text>
            </View>
          </View>

          {/* Tab Buttons */}
          <View style={styles.tabBar}>
            {renderTabButton('form', 'Form Cues', 'list-outline')}
            {renderTabButton('mistakes', 'Mistakes', 'warning-outline')}
            {renderTabButton('variations', 'Variations', 'shuffle-outline')}
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'form' && renderFormCues()}
            {activeTab === 'mistakes' && renderMistakes()}
            {activeTab === 'variations' && renderVariations()}
          </View>
        </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  mediaContainer: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  exerciseGif: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.card,
  },
  mediaPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  noMediaText: {
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabContent: {
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  cuesList: {
    gap: 12,
  },
  cueItem: {
    flexDirection: 'row',
    gap: 12,
  },
  cueNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cueNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cueContent: {
    flex: 1,
    paddingTop: 2,
  },
  cueText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  cueDetail: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  breathingTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  breathingText: {
    fontSize: 11,
    fontWeight: '500',
  },
  mistakesList: {
    gap: 12,
  },
  mistakeItem: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  mistakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mistakeTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  mistakeConsequence: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 24,
  },
  correctionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  correctionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  variationsList: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  variationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  variationText: {
    flex: 1,
    fontSize: 14,
  },
});

export default FormCoachModal;
