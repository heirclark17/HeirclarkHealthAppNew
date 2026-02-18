/**
 * Sleep & Recovery Card Component
 * Frosted Liquid Glass Design
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { useSleepRecovery } from '../../../contexts/SleepRecoveryContext';
import { Fonts } from '../../../constants/Theme';
import { NumberText } from '../../../components/NumberText';
import { api } from '../../../services/api';

const QUALITY_OPTIONS = [
  { value: 1 as const, label: 'Poor', emoji: '😫' },
  { value: 2 as const, label: 'Fair', emoji: '😕' },
  { value: 3 as const, label: 'Okay', emoji: '😐' },
  { value: 4 as const, label: 'Good', emoji: '😊' },
  { value: 5 as const, label: 'Great', emoji: '😴' },
];

export default function SleepRecoveryCard() {
  const { colors } = useGlassTheme();
  const {
    state,
    logSleep,
    calculateRecoveryScore,
    getSleepTip,
    getTodaySleep,
  } = useSleepRecovery();

  const [showLogModal, setShowLogModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState('');
  const [tip, setTip] = useState('');
  const [todayRecovery, setTodayRecovery] = useState<number | null>(null);
  const [extendedSleep, setExtendedSleep] = useState<any[]>([]);

  const todaySleep = getTodaySleep();

  // Fetch extended sleep data from backend (includes Oura fields)
  useEffect(() => {
    const fetchExtendedSleep = async () => {
      try {
        const logs = await api.getSleepHistory(14);
        if (logs && logs.length > 0) {
          setExtendedSleep(logs);
        }
      } catch (error) {
        console.error('[SleepRecoveryCard] Extended sleep fetch error:', error);
      }
    };
    fetchExtendedSleep();
  }, [showStatsModal]);

  useEffect(() => {
    setTip(getSleepTip());

    // Get or calculate today's recovery score
    const today = new Date().toISOString().split('T')[0];
    const existingScore = state.recoveryScores.find((s) => s.date === today);
    if (existingScore) {
      setTodayRecovery(existingScore.score);
    }
  }, [getSleepTip, state.recoveryScores]);

  const calculateDuration = useCallback((bed: string, wake: string): number => {
    const [bedH, bedM] = bed.split(':').map(Number);
    const [wakeH, wakeM] = wake.split(':').map(Number);

    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;

    // If wake time is earlier than bedtime, it's the next day
    if (wakeMinutes <= bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    return wakeMinutes - bedMinutes;
  }, []);

  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }, []);

  const handleLogSleep = useCallback(async () => {
    const duration = calculateDuration(bedtime, wakeTime);
    const today = new Date().toISOString().split('T')[0];

    await logSleep({
      date: today,
      bedtime,
      wakeTime,
      duration,
      quality,
      notes,
    });

    // Calculate recovery score after logging sleep
    const score = await calculateRecoveryScore();
    setTodayRecovery(score.score);

    // Reset form
    setBedtime('22:30');
    setWakeTime('06:30');
    setQuality(3);
    setNotes('');
    setShowLogModal(false);
  }, [bedtime, wakeTime, quality, notes, logSleep, calculateDuration, calculateRecoveryScore]);

  const getRecoveryColor = useCallback((score: number): string => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary;
    if (score >= 40) return colors.warning;
    return colors.danger;
  }, [colors]);

  const getSleepDebtStatus = useCallback(() => {
    const debtHours = state.sleepDebt / 60;
    if (debtHours <= 0) return { text: 'No debt', color: colors.success };
    if (debtHours <= 2) return { text: `${debtHours.toFixed(1)}h debt`, color: colors.warning };
    return { text: `${debtHours.toFixed(1)}h debt`, color: colors.danger };
  }, [state.sleepDebt, colors]);

  const sleepDebtStatus = getSleepDebtStatus();

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="moon" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Sleep & Recovery</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Track your rest
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.cardGlass }]}
            onPress={() => setShowStatsModal(true)}
            accessibilityLabel={`View sleep statistics, average ${formatDuration(state.averageSleepDuration)} per night`}
            accessibilityRole="button"
            accessibilityHint="Opens detailed sleep statistics modal with weekly overview, recent sleep logs, and sleep goals"
          >
            <Text style={[styles.viewButtonText, { color: colors.primary }]}>Stats</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.cardGlass }]}>
            <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>
              {formatDuration(state.averageSleepDuration)}
            </NumberText>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg Sleep</Text>
          </View>

          {extendedSleep.length > 0 && extendedSleep[0].sleep_score != null ? (
            <View style={[styles.statBox, { backgroundColor: colors.cardGlass }]}>
              <NumberText weight="semiBold" style={[styles.statValue, { color: colors.primary }]}>
                {extendedSleep[0].sleep_score}
              </NumberText>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Sleep Score</Text>
            </View>
          ) : (
            <View style={[styles.statBox, { backgroundColor: colors.cardGlass }]}>
              <NumberText weight="semiBold" style={[styles.statValue, { color: sleepDebtStatus.color }]}>
                {sleepDebtStatus.text}
              </NumberText>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Sleep Debt</Text>
            </View>
          )}

          <View style={[styles.statBox, { backgroundColor: colors.cardGlass }]}>
            <NumberText
              weight="semiBold"
              style={[
                styles.statValue,
                { color: todayRecovery ? getRecoveryColor(todayRecovery) : colors.textMuted },
              ]}
            >
              {todayRecovery ? `${todayRecovery}%` : '--'}
            </NumberText>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Recovery</Text>
          </View>
        </View>

        {/* Today's Sleep */}
        {todaySleep ? (
          <View style={[styles.todaySleep, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <View style={styles.todaySleepInfo}>
              <NumberText weight="medium" style={[styles.todaySleepText, { color: colors.text }]}>
                Logged: {formatDuration(todaySleep.duration)}
              </NumberText>
              <Text style={[styles.todaySleepTime, { color: colors.textMuted }]}>
                {todaySleep.bedtime} → {todaySleep.wakeTime}
              </Text>
            </View>
            <Text style={styles.qualityEmoji}>
              {QUALITY_OPTIONS.find((q) => q.value === todaySleep.quality)?.emoji}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.logButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowLogModal(true)}
            accessibilityLabel="Log last night's sleep"
            accessibilityRole="button"
            accessibilityHint="Opens sleep logging form to enter bedtime, wake time, quality rating, and optional notes"
          >
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.logButtonText}>Log Last Night's Sleep</Text>
          </TouchableOpacity>
        )}

        {/* Tip */}
        <View style={[styles.tipContainer, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="bulb" size={16} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
        </View>
      </GlassCard>

      {/* Log Sleep Modal */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLogModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Log Sleep</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowLogModal(false)}
              accessibilityLabel="Close sleep logging form"
              accessibilityRole="button"
              accessibilityHint="Closes the sleep logging modal and returns to sleep & recovery card"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Bedtime */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Bedtime</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.cardGlass, color: colors.text, borderColor: colors.glassBorder }]}
              value={bedtime}
              onChangeText={setBedtime}
              placeholder="22:30"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />

            {/* Wake Time */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Wake Time</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.cardGlass, color: colors.text, borderColor: colors.glassBorder }]}
              value={wakeTime}
              onChangeText={setWakeTime}
              placeholder="06:30"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />

            {/* Duration Preview */}
            <View style={[styles.durationPreview, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="time" size={18} color={colors.primary} />
              <NumberText weight="medium" style={[styles.durationText, { color: colors.text }]}>
                Duration: {formatDuration(calculateDuration(bedtime, wakeTime))}
              </NumberText>
            </View>

            {/* Quality */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Sleep Quality</Text>
            <View style={styles.qualityGrid}>
              {QUALITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.qualityOption,
                    {
                      backgroundColor: quality === option.value ? colors.primary : colors.cardGlass,
                      borderColor: quality === option.value ? colors.primary : colors.glassBorder,
                    },
                  ]}
                  onPress={() => setQuality(option.value)}
                  accessibilityLabel={`Sleep quality ${option.label}${quality === option.value ? ', currently selected' : ''}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: quality === option.value }}
                  accessibilityHint={`Rates your sleep quality as ${option.label.toLowerCase()}`}
                >
                  <Text style={styles.qualityEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.qualityLabel,
                      { color: quality === option.value ? '#FFF' : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.notesInput,
                { backgroundColor: colors.cardGlass, color: colors.text, borderColor: colors.glassBorder },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did you sleep?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleLogSleep}
              accessibilityLabel={`Save sleep log: ${formatDuration(calculateDuration(bedtime, wakeTime))} duration, ${QUALITY_OPTIONS.find(q => q.value === quality)?.label.toLowerCase()} quality`}
              accessibilityRole="button"
              accessibilityHint="Saves your sleep log entry and calculates your recovery score for today"
            >
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Save Sleep Log</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sleep Statistics</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowStatsModal(false)}
              accessibilityLabel="Close sleep statistics"
              accessibilityRole="button"
              accessibilityHint="Closes the sleep statistics modal and returns to sleep & recovery card"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Weekly Overview */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>This Week</Text>
            <View style={styles.weeklyStats}>
              <View style={[styles.weeklyStat, { backgroundColor: colors.cardGlass }]}>
                <Ionicons name="bed" size={24} color={colors.primary} />
                <NumberText weight="semiBold" style={[styles.weeklyValue, { color: colors.text }]}>
                  {formatDuration(state.averageSleepDuration)}
                </NumberText>
                <Text style={[styles.weeklyLabel, { color: colors.textMuted }]}>Avg Duration</Text>
              </View>
              <View style={[styles.weeklyStat, { backgroundColor: colors.cardGlass }]}>
                <Ionicons name="trending-down" size={24} color={sleepDebtStatus.color} />
                <NumberText weight="semiBold" style={[styles.weeklyValue, { color: sleepDebtStatus.color }]}>
                  {sleepDebtStatus.text}
                </NumberText>
                <Text style={[styles.weeklyLabel, { color: colors.textMuted }]}>Sleep Debt</Text>
              </View>
            </View>

            {/* Extended Metrics (from Oura/wearable) */}
            {extendedSleep.length > 0 && extendedSleep[0].sleep_score != null && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
                  Sleep Insights
                </Text>

                {/* Sleep Score */}
                {extendedSleep[0].sleep_score != null && (
                  <View style={[styles.sleepScoreRow, { backgroundColor: colors.cardGlass }]}>
                    <View style={styles.sleepScoreLeft}>
                      <NumberText weight="bold" style={[styles.sleepScoreBig, { color: colors.primary }]}>
                        {extendedSleep[0].sleep_score}
                      </NumberText>
                      <Text style={[styles.sleepScoreUnit, { color: colors.textMuted }]}>/100</Text>
                    </View>
                    <Text style={[styles.sleepScoreLabel, { color: colors.text }]}>Last Night's Sleep Score</Text>
                  </View>
                )}

                {/* Sleep Stages Bar */}
                {(extendedSleep[0].deep_sleep_hours != null || extendedSleep[0].rem_sleep_hours != null || extendedSleep[0].light_sleep_hours != null) && (() => {
                  const latest = extendedSleep[0];
                  const deep = parseFloat(latest.deep_sleep_hours) || 0;
                  const rem = parseFloat(latest.rem_sleep_hours) || 0;
                  const light = parseFloat(latest.light_sleep_hours) || 0;
                  const total = deep + rem + light;
                  if (total === 0) return null;
                  const deepPct = (deep / total) * 100;
                  const remPct = (rem / total) * 100;
                  const lightPct = (light / total) * 100;
                  return (
                    <View style={[styles.stagesContainer, { backgroundColor: colors.cardGlass }]}>
                      <Text style={[styles.stagesTitle, { color: colors.text }]}>Sleep Stages</Text>
                      <View style={styles.stagesBar}>
                        {deepPct > 0 && (
                          <View style={[styles.stageSegment, { width: `${deepPct}%`, backgroundColor: '#5B21B6' }]} />
                        )}
                        {remPct > 0 && (
                          <View style={[styles.stageSegment, { width: `${remPct}%`, backgroundColor: '#7C3AED' }]} />
                        )}
                        {lightPct > 0 && (
                          <View style={[styles.stageSegment, { width: `${lightPct}%`, backgroundColor: '#A78BFA' }]} />
                        )}
                      </View>
                      <View style={styles.stagesLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#5B21B6' }]} />
                          <Text style={[styles.legendText, { color: colors.textMuted }]}>Deep</Text>
                          <NumberText weight="medium" style={[styles.legendValue, { color: colors.text }]}>
                            {(deep * 60).toFixed(0)}m
                          </NumberText>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
                          <Text style={[styles.legendText, { color: colors.textMuted }]}>REM</Text>
                          <NumberText weight="medium" style={[styles.legendValue, { color: colors.text }]}>
                            {(rem * 60).toFixed(0)}m
                          </NumberText>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#A78BFA' }]} />
                          <Text style={[styles.legendText, { color: colors.textMuted }]}>Light</Text>
                          <NumberText weight="medium" style={[styles.legendValue, { color: colors.text }]}>
                            {(light * 60).toFixed(0)}m
                          </NumberText>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* Vitals Grid */}
                <View style={styles.vitalsGrid}>
                  {extendedSleep[0].avg_hrv != null && (
                    <View style={[styles.vitalCard, { backgroundColor: colors.cardGlass }]}>
                      <Ionicons name="pulse" size={18} color="#10B981" />
                      <NumberText weight="semiBold" style={[styles.vitalValue, { color: colors.text }]}>
                        {Math.round(parseFloat(extendedSleep[0].avg_hrv))}
                      </NumberText>
                      <Text style={[styles.vitalUnit, { color: colors.textMuted }]}>ms</Text>
                      <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>HRV</Text>
                    </View>
                  )}
                  {extendedSleep[0].spo2_avg != null && (
                    <View style={[styles.vitalCard, { backgroundColor: colors.cardGlass }]}>
                      <Ionicons name="water" size={18} color="#3B82F6" />
                      <NumberText weight="semiBold" style={[styles.vitalValue, { color: colors.text }]}>
                        {Math.round(parseFloat(extendedSleep[0].spo2_avg))}
                      </NumberText>
                      <Text style={[styles.vitalUnit, { color: colors.textMuted }]}>%</Text>
                      <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>SpO2</Text>
                    </View>
                  )}
                  {extendedSleep[0].lowest_heart_rate != null && (
                    <View style={[styles.vitalCard, { backgroundColor: colors.cardGlass }]}>
                      <Ionicons name="heart" size={18} color="#EF4444" />
                      <NumberText weight="semiBold" style={[styles.vitalValue, { color: colors.text }]}>
                        {Math.round(parseFloat(extendedSleep[0].lowest_heart_rate))}
                      </NumberText>
                      <Text style={[styles.vitalUnit, { color: colors.textMuted }]}>bpm</Text>
                      <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Lowest HR</Text>
                    </View>
                  )}
                  {extendedSleep[0].avg_breathing_rate != null && (
                    <View style={[styles.vitalCard, { backgroundColor: colors.cardGlass }]}>
                      <Ionicons name="leaf" size={18} color="#8B5CF6" />
                      <NumberText weight="semiBold" style={[styles.vitalValue, { color: colors.text }]}>
                        {parseFloat(extendedSleep[0].avg_breathing_rate).toFixed(1)}
                      </NumberText>
                      <Text style={[styles.vitalUnit, { color: colors.textMuted }]}>br/m</Text>
                      <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Breathing</Text>
                    </View>
                  )}
                  {extendedSleep[0].sleep_efficiency != null && (
                    <View style={[styles.vitalCard, { backgroundColor: colors.cardGlass }]}>
                      <Ionicons name="analytics" size={18} color="#F59E0B" />
                      <NumberText weight="semiBold" style={[styles.vitalValue, { color: colors.text }]}>
                        {Math.round(parseFloat(extendedSleep[0].sleep_efficiency))}
                      </NumberText>
                      <Text style={[styles.vitalUnit, { color: colors.textMuted }]}>%</Text>
                      <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Efficiency</Text>
                    </View>
                  )}
                  {extendedSleep[0].sleep_latency_minutes != null && (
                    <View style={[styles.vitalCard, { backgroundColor: colors.cardGlass }]}>
                      <Ionicons name="timer" size={18} color="#6366F1" />
                      <NumberText weight="semiBold" style={[styles.vitalValue, { color: colors.text }]}>
                        {Math.round(parseFloat(extendedSleep[0].sleep_latency_minutes))}
                      </NumberText>
                      <Text style={[styles.vitalUnit, { color: colors.textMuted }]}>min</Text>
                      <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Fell Asleep</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Recent Sleep */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
              Recent Sleep Logs
            </Text>

            {/* Use extended data if available, otherwise fall back to context */}
            {(extendedSleep.length > 0 ? extendedSleep.slice(0, 7) : state.sleepEntries.slice(0, 7)).map((entry: any, index: number) => {
              const isExtended = extendedSleep.length > 0;
              const entryDate = isExtended ? entry.date : entry.date;
              const entryBedtime = isExtended ? entry.bed_time : entry.bedtime;
              const entryWakeTime = isExtended ? entry.wake_time : entry.wakeTime;
              const entryDuration = isExtended
                ? Math.round((parseFloat(entry.total_hours) || 0) * 60)
                : entry.duration;
              const entryQuality = isExtended ? entry.quality_score : entry.quality;
              const sleepScore = isExtended ? entry.sleep_score : null;
              const deep = isExtended ? parseFloat(entry.deep_sleep_hours) || 0 : 0;
              const rem = isExtended ? parseFloat(entry.rem_sleep_hours) || 0 : 0;
              const light = isExtended ? parseFloat(entry.light_sleep_hours) || 0 : 0;
              const stageTotal = deep + rem + light;

              return (
                <View key={entry.id || index} style={[styles.sleepEntry, { backgroundColor: colors.cardGlass }]}>
                  <View style={styles.entryLeft}>
                    <View style={styles.entryDateRow}>
                      <Text style={[styles.entryDate, { color: colors.text }]}>
                        {new Date(entryDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                      {sleepScore != null && (
                        <View style={[styles.entryScoreBadge, { backgroundColor: colors.primary + '20' }]}>
                          <NumberText weight="semiBold" style={[styles.entryScoreText, { color: colors.primary }]}>
                            {sleepScore}
                          </NumberText>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.entryTimes, { color: colors.textMuted }]}>
                      {entryBedtime || '--'} → {entryWakeTime || '--'}
                    </Text>
                    {stageTotal > 0 && (
                      <View style={styles.miniStagesBar}>
                        <View style={[styles.miniStageSegment, { width: `${(deep / stageTotal) * 100}%`, backgroundColor: '#5B21B6' }]} />
                        <View style={[styles.miniStageSegment, { width: `${(rem / stageTotal) * 100}%`, backgroundColor: '#7C3AED' }]} />
                        <View style={[styles.miniStageSegment, { width: `${(light / stageTotal) * 100}%`, backgroundColor: '#A78BFA' }]} />
                      </View>
                    )}
                  </View>
                  <View style={styles.entryRight}>
                    <NumberText weight="semiBold" style={[styles.entryDuration, { color: colors.primary }]}>
                      {formatDuration(entryDuration)}
                    </NumberText>
                    <Text style={styles.entryQuality}>
                      {QUALITY_OPTIONS.find((q) => q.value === entryQuality)?.emoji || ''}
                    </Text>
                  </View>
                </View>
              );
            })}

            {state.sleepEntries.length === 0 && extendedSleep.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: colors.cardGlass }]}>
                <Ionicons name="moon-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No sleep logs yet. Start tracking tonight!
                </Text>
              </View>
            )}

            {/* Sleep Goal */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Your Goal</Text>
            <View style={[styles.goalBox, { backgroundColor: colors.cardGlass }]}>
              <View style={styles.goalRow}>
                <Text style={[styles.goalLabel, { color: colors.textMuted }]}>Target Bedtime</Text>
                <NumberText weight="semiBold" style={[styles.goalValue, { color: colors.text }]}>{state.sleepGoal.targetBedtime}</NumberText>
              </View>
              <View style={styles.goalRow}>
                <Text style={[styles.goalLabel, { color: colors.textMuted }]}>Target Wake Time</Text>
                <NumberText weight="semiBold" style={[styles.goalValue, { color: colors.text }]}>{state.sleepGoal.targetWakeTime}</NumberText>
              </View>
              <View style={styles.goalRow}>
                <Text style={[styles.goalLabel, { color: colors.textMuted }]}>Target Duration</Text>
                <NumberText weight="semiBold" style={[styles.goalValue, { color: colors.text }]}>
                  {formatDuration(state.sleepGoal.targetDuration)}
                </NumberText>
              </View>
            </View>
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
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  viewButtonText: { fontSize: 13, fontFamily: Fonts.medium },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 15 },
  statLabel: { fontSize: 10, fontFamily: Fonts.regular, marginTop: 2 },
  todaySleep: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 10 },
  todaySleepInfo: { flex: 1 },
  todaySleepText: { fontSize: 13 },
  todaySleepTime: { fontSize: 11, fontFamily: Fonts.regular, marginTop: 2 },
  qualityEmoji: { fontSize: 20 },
  logButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginBottom: 12 },
  logButtonText: { color: '#FFF', fontSize: 14, fontFamily: Fonts.semiBold },
  tipContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  tipText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontFamily: Fonts.semiBold },
  closeButton: { width: 36, height: 36, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalContent: { flex: 1, padding: 16 },
  inputLabel: { fontSize: 14, fontFamily: Fonts.medium, marginBottom: 8, marginTop: 12 },
  input: { padding: 16, borderRadius: 12, fontSize: 16, fontFamily: Fonts.regular, borderWidth: 1 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  durationPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 12 },
  durationText: { fontSize: 14 },
  qualityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qualityOption: { alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, minWidth: 60 },
  qualityLabel: { fontSize: 11, fontFamily: Fonts.medium, marginTop: 4 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 24 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontFamily: Fonts.semiBold },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.semiBold, marginBottom: 12 },
  weeklyStats: { flexDirection: 'row', gap: 12 },
  weeklyStat: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 12 },
  weeklyValue: { fontSize: 18, marginTop: 8 },
  weeklyLabel: { fontSize: 11, fontFamily: Fonts.regular, marginTop: 4 },
  sleepEntry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  entryLeft: { flex: 1 },
  entryDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryDate: { fontSize: 13, fontFamily: Fonts.medium },
  entryScoreBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  entryScoreText: { fontSize: 11 },
  entryTimes: { fontSize: 11, fontFamily: Fonts.regular, marginTop: 2 },
  miniStagesBar: { flexDirection: 'row', height: 4, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  miniStageSegment: { height: 4 },
  entryRight: { alignItems: 'flex-end' },
  entryDuration: { fontSize: 14 },
  entryQuality: { fontSize: 16, marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 24, borderRadius: 12 },
  emptyText: { fontSize: 13, fontFamily: Fonts.regular, textAlign: 'center', marginTop: 12 },
  goalBox: { padding: 16, borderRadius: 12 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  goalLabel: { fontSize: 13, fontFamily: Fonts.regular },
  goalValue: { fontSize: 14 },
  // Extended sleep stats styles
  sleepScoreRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, gap: 12 },
  sleepScoreLeft: { flexDirection: 'row', alignItems: 'baseline' },
  sleepScoreBig: { fontSize: 36 },
  sleepScoreUnit: { fontSize: 14, fontFamily: Fonts.regular, marginLeft: 2 },
  sleepScoreLabel: { fontSize: 14, fontFamily: Fonts.medium, flex: 1 },
  stagesContainer: { padding: 16, borderRadius: 12, marginBottom: 12 },
  stagesTitle: { fontSize: 13, fontFamily: Fonts.medium, marginBottom: 10 },
  stagesBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  stageSegment: { height: 12 },
  stagesLegend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: Fonts.regular },
  legendValue: { fontSize: 11 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  vitalCard: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', padding: 12, borderRadius: 12 },
  vitalValue: { fontSize: 20, marginTop: 4 },
  vitalUnit: { fontSize: 10, fontFamily: Fonts.regular },
  vitalLabel: { fontSize: 10, fontFamily: Fonts.regular, marginTop: 2 },
});
