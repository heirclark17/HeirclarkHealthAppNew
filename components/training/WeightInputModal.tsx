// Weight Input Modal - For logging progressive overload weights
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
// Animations removed
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { mediumImpact, lightImpact, selectionFeedback } from '../../utils/haptics';
import {
  WorkoutExercise,
  WeightUnit,
  SetLog,
  WeightLog,
  ExerciseProgress,
} from '../../types/training';
import { weightTrackingStorage, convertWeight } from '../../services/weightTrackingStorage';

interface WeightInputModalProps {
  visible: boolean;
  exercise: WorkoutExercise | null;
  weekNumber: number;
  onClose: () => void;
  onSave: (log: WeightLog) => void;
}

export function WeightInputModal({
  visible,
  exercise,
  weekNumber,
  onClose,
  onSave,
}: WeightInputModalProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // State
  const [unit, setUnit] = useState<WeightUnit>('lb');
  const [sets, setSets] = useState<SetLog[]>([]);
  const [notes, setNotes] = useState('');
  const [lastLog, setLastLog] = useState<WeightLog | null>(null);
  const [progress, setProgress] = useState<ExerciseProgress | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize sets based on exercise prescription
  useEffect(() => {
    if (exercise && visible) {
      loadPreviousData();
      initializeSets();
    }
  }, [exercise, visible]);

  const loadPreviousData = async () => {
    if (!exercise) return;

    try {
      const [lastLogData, progressData, settingsData] = await Promise.all([
        weightTrackingStorage.getLastLogForExercise(exercise.exerciseId),
        weightTrackingStorage.getExerciseProgress(exercise.exerciseId, exercise.exercise.name),
        weightTrackingStorage.getSettings(),
      ]);

      setLastLog(lastLogData);
      setProgress(progressData);
      setUnit(settingsData.preferredUnit);
    } catch (error) {
      console.error('[WeightInput] Error loading previous data:', error);
    }
  };

  const initializeSets = () => {
    if (!exercise) return;

    const numSets = exercise.sets || 3;
    const initialSets: SetLog[] = [];

    for (let i = 1; i <= numSets; i++) {
      // Pre-fill with last logged weight if available
      const lastWeight = lastLog?.sets.find(s => s.setNumber === i)?.weight || 0;
      const lastReps = lastLog?.sets.find(s => s.setNumber === i)?.reps || parseReps(exercise.reps);

      initialSets.push({
        setNumber: i,
        weight: lastWeight,
        unit,
        reps: lastReps,
        isWarmup: false,
      });
    }

    setSets(initialSets);
  };

  const parseReps = (repsString: string): number => {
    // Parse "8-12" or "10" or "30 sec" etc.
    const match = repsString.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
  };

  const updateSet = (setIndex: number, field: 'weight' | 'reps', value: string) => {
    const numValue = parseFloat(value) || 0;
    setSets(prev =>
      prev.map((s, i) =>
        i === setIndex ? { ...s, [field]: numValue, unit } : s
      )
    );
  };

  const toggleUnit = async () => {
    const newUnit = unit === 'lb' ? 'kg' : 'lb';
    selectionFeedback();

    // Convert all weights to new unit
    setSets(prev =>
      prev.map(s => ({
        ...s,
        weight: s.weight ? convertWeight(s.weight, unit, newUnit) : 0,
        unit: newUnit,
      }))
    );

    setUnit(newUnit);
    await weightTrackingStorage.saveSettings({ preferredUnit: newUnit });
  };

  const handleSave = async () => {
    if (!exercise) return;

    setLoading(true);
    mediumImpact();

    try {
      const validSets = sets.filter(s => s.weight > 0 && s.reps > 0);

      if (validSets.length === 0) {
        // No valid sets to save
        setLoading(false);
        onClose();
        return;
      }

      const log = await weightTrackingStorage.saveWeightLog({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exercise.name,
        date: new Date().toISOString(),
        weekNumber,
        sets: validSets,
        notes: notes.trim() || undefined,
      });

      onSave(log);
      onClose();
    } catch (error) {
      console.error('[WeightInput] Error saving weight log:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    lightImpact();
    onClose();
    // Reset state
    setSets([]);
    setNotes('');
    setLastLog(null);
    setProgress(null);
  };

  if (!exercise) return null;

  const inputBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView intensity={isDark ? 20 : 35} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <GlassCard style={styles.closeButtonGlass} interactive>
                <Ionicons name="close" size={24} color={colors.text} />
              </GlassCard>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Log Weight</Text>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
              <GlassCard style={styles.saveButtonGlass} interactive>
                <Text style={[styles.saveButtonText, { color: Colors.protein }]}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          </View>

          {/* Exercise Info */}
          <GlassCard style={styles.exerciseCard} interactive>
            <Text style={[styles.exerciseName, { color: colors.text }]}>
              {exercise.exercise.name}
            </Text>
            <Text style={[styles.exercisePrescription, { color: colors.textMuted }]}>
              {exercise.sets} sets × {exercise.reps}
            </Text>

            {/* Previous Performance */}
            {lastLog && (
              <View style={[styles.previousPerformance, { borderTopColor: inputBorder }]}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.previousText, { color: colors.textMuted }]}>
                  Last: {lastLog.maxWeight}{lastLog.sets[0]?.unit || 'lb'} × {lastLog.sets[0]?.reps || 0} reps
                </Text>
                {lastLog.personalRecord && (
                  <View style={styles.prBadge}>
                    <Text style={styles.prBadgeText}>PR</Text>
                  </View>
                )}
              </View>
            )}

            {/* Progressive Overload Suggestion */}
            {progress && progress.suggestedNextWeight > progress.currentMax && (
              <View style={[styles.suggestion, { backgroundColor: isDark ? 'rgba(76, 217, 100, 0.15)' : 'rgba(76, 217, 100, 0.1)' }]}>
                <Ionicons name="trending-up" size={16} color="#4CD964" />
                <Text style={[styles.suggestionText, { color: '#4CD964' }]}>
                  Ready to progress! Try {progress.suggestedNextWeight}{unit}
                </Text>
              </View>
            )}
          </GlassCard>

          {/* Unit Toggle */}
          <View style={styles.unitToggle}>
            <Text style={[styles.unitLabel, { color: colors.textMuted }]}>Unit:</Text>
            <TouchableOpacity
              style={[
                styles.unitButton,
                { backgroundColor: inputBg, borderColor: inputBorder },
              ]}
              onPress={toggleUnit}
            >
              <Text style={[styles.unitButtonText, { color: colors.text }]}>
                {unit === 'lb' ? 'Pounds (lb)' : 'Kilograms (kg)'}
              </Text>
              <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Sets Input */}
          <ScrollView style={styles.setsContainer} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SETS</Text>

            {sets.map((set, index) => (
              <View
                key={set.setNumber}
                style={[styles.setRow, { backgroundColor: inputBg, borderColor: inputBorder }]}
              >
                <View style={styles.setNumber}>
                  <Text style={[styles.setNumberText, { color: colors.textMuted }]}>
                    {set.setNumber}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: inputBorder }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={set.weight > 0 ? set.weight.toString() : ''}
                    onChangeText={(value) => updateSet(index, 'weight', value)}
                  />
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{unit}</Text>
                </View>

                <Text style={[styles.separator, { color: colors.textMuted }]}>×</Text>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: inputBorder }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={set.reps > 0 ? set.reps.toString() : ''}
                    onChangeText={(value) => updateSet(index, 'reps', value)}
                  />
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>reps</Text>
                </View>
              </View>
            ))}

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[
                  styles.notesInput,
                  { color: colors.text, backgroundColor: inputBg, borderColor: inputBorder },
                ]}
                placeholder="How did it feel? Any observations..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Progress Summary */}
            {progress && progress.totalSessions > 1 && (
              <GlassCard style={styles.progressCard} interactive>
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  Your Progress
                </Text>
                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <Text style={[styles.progressStatValue, { color: Colors.protein }]}>
                      {progress.allTimeMax}{progress.currentMaxUnit}
                    </Text>
                    <Text style={[styles.progressStatLabel, { color: colors.textMuted }]}>
                      Personal Best
                    </Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Text style={[styles.progressStatValue, { color: colors.text }]}>
                      {progress.totalSessions}
                    </Text>
                    <Text style={[styles.progressStatLabel, { color: colors.textMuted }]}>
                      Sessions
                    </Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Text
                      style={[
                        styles.progressStatValue,
                        {
                          color:
                            progress.trend === 'increasing'
                              ? '#4CD964'
                              : progress.trend === 'decreasing'
                              ? Colors.errorStrong
                              : colors.textMuted,
                        },
                      ]}
                    >
                      {progress.progressPercentage > 0 ? '+' : ''}
                      {progress.progressPercentage}%
                    </Text>
                    <Text style={[styles.progressStatLabel, { color: colors.textMuted }]}>
                      Progress
                    </Text>
                  </View>
                </View>
              </GlassCard>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButton: {
    width: 44,
  },
  closeButtonGlass: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  saveButton: {
    width: 70,
  },
  saveButtonGlass: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  exerciseCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 20,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  exercisePrescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  previousPerformance: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  previousText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  prBadge: {
    backgroundColor: Colors.accentGold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.background,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  unitLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  unitButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  setsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 18,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    width: 30,
  },
  separator: {
    fontSize: 18,
    fontFamily: Fonts.light,
  },
  notesSection: {
    marginTop: 16,
  },
  notesInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlignVertical: 'top',
  },
  progressCard: {
    marginTop: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
  },
  progressStatLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
});
