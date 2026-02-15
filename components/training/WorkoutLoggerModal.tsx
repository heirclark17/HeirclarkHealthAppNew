// Enhanced Workout Logger Modal
// Extends WeightInputModal patterns with AI recommendations and session comparison

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Plus, Trash2, ChevronDown } from 'lucide-react-native';
import GlassCard from '../GlassCard';
import NumberText from '../NumberText';
import { useSettings } from '../../contexts/SettingsContext';
import { DarkColors, SandLightColors, Fonts } from '../../constants/Theme';
import { SetLog, WeightLog, AISetRecommendation } from '../../types/training';
import { weightTrackingStorage } from '../../services/weightTrackingStorage';
import { calculateSmartWeight } from '../../services/progressiveOverloadAI';
import { lightImpact, mediumImpact } from '../../utils/haptics';

interface WorkoutLoggerModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  aiRecommendation?: AISetRecommendation | null;
  onSave?: (log: WeightLog) => void;
}

interface SetEntry {
  weight: string;
  reps: string;
  rpe: string;
  isWarmup: boolean;
}

export default function WorkoutLoggerModal({
  visible,
  onClose,
  exerciseId,
  exerciseName,
  aiRecommendation,
  onSave,
}: WorkoutLoggerModalProps) {
  const { settings: appSettings } = useSettings();
  const isDark = appSettings.themeMode === 'dark';
  const colors = isDark ? DarkColors : SandLightColors;

  const [sets, setSets] = useState<SetEntry[]>([
    { weight: '', reps: '', rpe: '', isWarmup: false },
    { weight: '', reps: '', rpe: '', isWarmup: false },
    { weight: '', reps: '', rpe: '', isWarmup: false },
  ]);
  const [notes, setNotes] = useState('');
  const [lastSession, setLastSession] = useState<WeightLog | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load last session data
  useEffect(() => {
    if (visible && exerciseId) {
      loadLastSession();
    }
  }, [visible, exerciseId]);

  const loadLastSession = async () => {
    const last = await weightTrackingStorage.getLastLogForExercise(exerciseId);
    setLastSession(last);

    // Pre-fill with AI recommendation or last session
    if (aiRecommendation) {
      const newSets = aiRecommendation.sets.map(s => ({
        weight: s.targetWeight.toString(),
        reps: s.targetReps.toString(),
        rpe: '',
        isWarmup: s.isWarmup,
      }));
      setSets(newSets);
    } else if (last) {
      const newSets = last.sets.map(s => ({
        weight: s.weight.toString(),
        reps: '',
        rpe: '',
        isWarmup: s.isWarmup || false,
      }));
      setSets(newSets.length > 0 ? newSets : [{ weight: '', reps: '', rpe: '', isWarmup: false }]);
    }
  };

  const addSet = () => {
    lightImpact();
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { weight: lastSet?.weight || '', reps: '', rpe: '', isWarmup: false }]);
  };

  const removeSet = (index: number) => {
    lightImpact();
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, field: keyof SetEntry, value: string | boolean) => {
    const updated = [...sets];
    (updated[index] as any)[field] = value;
    setSets(updated);
  };

  const handleSave = async () => {
    const validSets: SetLog[] = sets
      .filter(s => s.weight && s.reps)
      .map((s, i) => ({
        setNumber: i + 1,
        weight: parseFloat(s.weight) || 0,
        unit: 'lb' as const,
        reps: parseInt(s.reps) || 0,
        rpe: s.rpe ? parseFloat(s.rpe) : undefined,
        isWarmup: s.isWarmup,
      }));

    if (validSets.length === 0) {
      Alert.alert('No Sets', 'Please log at least one set with weight and reps.');
      return;
    }

    setIsSaving(true);
    try {
      const weekStart = weightTrackingStorage._getWeekStart(new Date().toISOString());
      const log = await weightTrackingStorage.saveWeightLog({
        exerciseId,
        exerciseName,
        date: new Date().toISOString(),
        weekNumber: 0,
        sets: validSets,
        notes: notes || undefined,
      });
      mediumImpact();
      onSave?.(log);
      onClose();
    } catch (error) {
      console.error('[WorkoutLogger] Error saving:', error);
      Alert.alert('Error', 'Failed to save workout log.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate running volume
  const runningVolume = sets.reduce((sum, s) => {
    if (s.isWarmup) return sum;
    const w = parseFloat(s.weight) || 0;
    const r = parseInt(s.reps) || 0;
    return sum + w * r;
  }, 0);

  const lastVolume = lastSession
    ? lastSession.sets.filter(s => !s.isWarmup).reduce((sum, s) => sum + s.weight * s.reps, 0)
    : 0;

  const volumeDiff = lastVolume > 0 ? Math.round(((runningVolume - lastVolume) / lastVolume) * 100) : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Log Workout</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {exerciseName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { lightImpact(); onClose(); }}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1a1a1a' : '#E5DDD2' }]}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* AI Recommendation Banner */}
            {aiRecommendation && (
              <GlassCard style={[styles.aiBanner, { borderColor: colors.accentPurple + '30' }]}>
                <Text style={[styles.aiLabel, { color: colors.accentPurple }]}>AI Recommendation</Text>
                <Text style={[styles.aiText, { color: colors.textSecondary }]}>
                  {aiRecommendation.reasoning}
                </Text>
              </GlassCard>
            )}

            {/* Last session reference */}
            {lastSession && (
              <View style={styles.lastSessionRow}>
                <Text style={[styles.lastLabel, { color: colors.textMuted }]}>Last session:</Text>
                <NumberText style={[styles.lastValue, { color: colors.textSecondary }]}>
                  {lastSession.sets.filter(s => !s.isWarmup).length} sets @ {lastSession.maxWeight}lb
                </NumberText>
              </View>
            )}

            {/* Column headers */}
            <View style={styles.headerRow}>
              <Text style={[styles.colHeader, { color: colors.textMuted, width: 32 }]}>Set</Text>
              <Text style={[styles.colHeader, { color: colors.textMuted, flex: 1 }]}>Weight (lb)</Text>
              <Text style={[styles.colHeader, { color: colors.textMuted, flex: 1 }]}>Reps</Text>
              <Text style={[styles.colHeader, { color: colors.textMuted, width: 50 }]}>RPE</Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Set rows */}
            {sets.map((set, index) => {
              const prevSet = lastSession?.sets[index];
              const weightDiff = prevSet && set.weight
                ? parseFloat(set.weight) - prevSet.weight
                : null;

              return (
                <View key={index} style={styles.setRow}>
                  <TouchableOpacity
                    style={[
                      styles.setLabel,
                      set.isWarmup && { backgroundColor: colors.warning + '20' },
                    ]}
                    onPress={() => updateSet(index, 'isWarmup', !set.isWarmup)}
                  >
                    <Text
                      style={[
                        styles.setLabelText,
                        { color: set.isWarmup ? colors.warning : colors.textMuted },
                      ]}
                    >
                      {set.isWarmup ? 'W' : index + 1}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          backgroundColor: isDark ? '#111' : '#F5EDE4',
                          borderColor: weightDiff !== null && weightDiff > 0
                            ? colors.success + '40'
                            : weightDiff !== null && weightDiff < 0
                              ? colors.error + '40'
                              : colors.border,
                        },
                      ]}
                      value={set.weight}
                      onChangeText={(v) => updateSet(index, 'weight', v)}
                      keyboardType="decimal-pad"
                      placeholder={prevSet ? prevSet.weight.toString() : '0'}
                      placeholderTextColor={colors.textMuted}
                    />
                    {weightDiff !== null && weightDiff !== 0 && (
                      <NumberText
                        style={[
                          styles.diffIndicator,
                          { color: weightDiff > 0 ? colors.success : colors.error },
                        ]}
                      >
                        {weightDiff > 0 ? '+' : ''}{weightDiff}
                      </NumberText>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          backgroundColor: isDark ? '#111' : '#F5EDE4',
                          borderColor: colors.border,
                        },
                      ]}
                      value={set.reps}
                      onChangeText={(v) => updateSet(index, 'reps', v)}
                      keyboardType="number-pad"
                      placeholder={prevSet ? prevSet.reps.toString() : '0'}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <TextInput
                    style={[
                      styles.rpeInput,
                      {
                        color: colors.text,
                        backgroundColor: isDark ? '#111' : '#F5EDE4',
                        borderColor: colors.border,
                      },
                    ]}
                    value={set.rpe}
                    onChangeText={(v) => updateSet(index, 'rpe', v)}
                    keyboardType="decimal-pad"
                    placeholder="-"
                    placeholderTextColor={colors.textMuted}
                  />

                  <TouchableOpacity onPress={() => removeSet(index)} style={styles.deleteBtn}>
                    <Trash2 size={16} color={colors.error + '60'} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Add set button */}
            <TouchableOpacity
              style={[styles.addSetBtn, { borderColor: colors.border }]}
              onPress={addSet}
            >
              <Plus size={16} color={colors.textSecondary} />
              <Text style={[styles.addSetText, { color: colors.textSecondary }]}>Add Set</Text>
            </TouchableOpacity>

            {/* Notes */}
            <TextInput
              style={[
                styles.notesInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#111' : '#F5EDE4',
                  borderColor: colors.border,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            {/* Running volume comparison */}
            <GlassCard style={styles.volumeCard}>
              <View style={styles.volumeRow}>
                <Text style={[styles.volumeLabel, { color: colors.textMuted }]}>Session Volume</Text>
                <NumberText style={[styles.volumeValue, { color: colors.text }]}>
                  {runningVolume.toLocaleString()} lb
                </NumberText>
              </View>
              {lastVolume > 0 && (
                <View style={styles.volumeRow}>
                  <Text style={[styles.volumeLabel, { color: colors.textMuted }]}>vs Last</Text>
                  <NumberText
                    style={[
                      styles.volumeDiff,
                      { color: volumeDiff >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {volumeDiff >= 0 ? '+' : ''}{volumeDiff}%
                  </NumberText>
                </View>
              )}
            </GlassCard>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Save button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={[styles.saveBtnText, { color: colors.primaryText }]}>Save Workout</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  aiBanner: {
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  aiLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  aiText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  lastSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  lastLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  lastValue: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  colHeader: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  setLabel: {
    width: 28,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLabelText: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: Fonts.numericRegular,
    textAlign: 'center',
  },
  diffIndicator: {
    position: 'absolute',
    right: 4,
    top: 2,
    fontSize: 9,
    fontFamily: Fonts.numericSemiBold,
  },
  rpeInput: {
    width: 46,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    fontSize: 14,
    fontFamily: Fonts.numericRegular,
    textAlign: 'center',
  },
  deleteBtn: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 16,
  },
  addSetText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  notesInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    fontFamily: Fonts.regular,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  volumeCard: {
    padding: 14,
    marginBottom: 16,
  },
  volumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  volumeLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  volumeValue: {
    fontSize: 16,
    fontFamily: Fonts.numericBold,
  },
  volumeDiff: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
