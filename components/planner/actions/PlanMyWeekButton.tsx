/**
 * PlanMyWeekButton - Floating action button to regenerate entire week's schedule with AI
 *
 * Features:
 * - Prominent FAB with liquid glass design
 * - Triggers AI re-planning for all 7 days
 * - Loading animation during generation
 * - Conflict resolution UI if issues detected
 * - Success confirmation with haptic feedback
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Sparkles, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { NumberText } from '../../NumberText';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

export function PlanMyWeekButton() {
  const { actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  const [isPlanning, setIsPlanning] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [planningState, setPlanningState] = useState<'idle' | 'planning' | 'success' | 'conflicts'>('idle');
  const [conflicts, setConflicts] = useState<string[]>([]);

  const handlePlanWeek = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsModalVisible(true);
      setPlanningState('planning');
      setIsPlanning(true);

      // Trigger regeneration for all 7 days
      console.log('[PlanMyWeek] Starting AI planning for entire week...');
      await actions.generateWeeklyPlan();

      // Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPlanningState('success');
      setIsPlanning(false);

      // Auto-dismiss after 2 seconds
      setTimeout(() => {
        setIsModalVisible(false);
        setPlanningState('idle');
      }, 2000);
    } catch (error: any) {
      console.error('[PlanMyWeek] Planning failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Check if error contains conflicts
      const errorMessage = error.message || String(error);
      if (errorMessage.includes('conflict') || errorMessage.includes('overlap')) {
        setPlanningState('conflicts');
        setConflicts([errorMessage]);
      } else {
        setPlanningState('idle');
        setIsModalVisible(false);
      }
      setIsPlanning(false);
    }
  };

  const handleRetryWithManualFix = () => {
    // Close modal and let user manually adjust calendar
    setIsModalVisible(false);
    setPlanningState('idle');
    setConflicts([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <>
      {/* Floating Action Button */}
      <View style={[styles.fabContainer, { bottom: Platform.OS === 'ios' ? 100 : 80 }]}>
        <GlassCard style={styles.fabGlass} interactive>
          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: isDark
                  ? 'rgba(139, 92, 246, 0.2)'
                  : 'rgba(139, 92, 246, 0.15)',
              },
            ]}
            onPress={handlePlanWeek}
            activeOpacity={0.8}
            disabled={isPlanning}
          >
            {isPlanning ? (
              <ActivityIndicator size="small" color="#a855f7" />
            ) : (
              <>
                <Sparkles size={24} color="#a855f7" />
                <Text style={styles.fabText}>Plan My Week</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>
      </View>

      {/* Planning Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isPlanning) {
            setIsModalVisible(false);
            setPlanningState('idle');
          }
        }}
      >
        <BlurView
          intensity={isDark ? 80 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.overlay}
        >
          <View style={styles.modalContainer}>
            <GlassCard style={styles.modalCard}>
              {/* Planning State */}
              {planningState === 'planning' && (
                <>
                  <ActivityIndicator size="large" color="#a855f7" style={styles.spinner} />
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                    Planning Your Week
                  </Text>
                  <Text style={[styles.modalDescription, { color: themeColors.textSecondary }]}>
                    AI is analyzing your calendar, workouts, meals, and preferences to create the optimal schedule...
                  </Text>
                </>
              )}

              {/* Success State */}
              {planningState === 'success' && (
                <>
                  <CheckCircle2 size={64} color={Colors.protein} style={styles.icon} />
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                    Week Planned!
                  </Text>
                  <Text style={[styles.modalDescription, { color: themeColors.textSecondary }]}>
                    Your schedule is ready. Swipe through the week to see your personalized timeline.
                  </Text>
                </>
              )}

              {/* Conflicts State */}
              {planningState === 'conflicts' && (
                <>
                  <AlertCircle size={64} color={Colors.fat} style={styles.icon} />
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                    Scheduling Conflicts Detected
                  </Text>
                  <Text style={[styles.modalDescription, { color: themeColors.textSecondary }]}>
                    Some calendar events are preventing optimal scheduling:
                  </Text>

                  {/* Conflict List */}
                  <View style={styles.conflictList}>
                    {conflicts.map((conflict, index) => (
                      <Text key={index} style={[styles.conflictText, { color: Colors.fat }]}>
                        • {conflict}
                      </Text>
                    ))}
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: Colors.protein }]}
                      onPress={handleRetryWithManualFix}
                    >
                      <Text style={styles.primaryButtonText}>
                        Adjust Calendar & Retry
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        {
                          borderColor: isDark
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(0,0,0,0.2)',
                        },
                      ]}
                      onPress={() => {
                        setIsModalVisible(false);
                        setPlanningState('idle');
                        setConflicts([]);
                      }}
                    >
                      <Text style={[styles.secondaryButtonText, { color: themeColors.text }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </GlassCard>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  fabGlass: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  fabText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    color: '#a855f7',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    padding: 24,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  icon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  conflictList: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  conflictText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
});
