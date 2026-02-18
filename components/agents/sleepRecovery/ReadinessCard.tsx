/**
 * Readiness Card Component
 * Displays Oura Ring readiness data: score, HRV, temperature, resting HR, stress, SpO2
 * Frosted Liquid Glass Design
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';
import { Fonts } from '../../../constants/Theme';
import { NumberText } from '../../../components/NumberText';
import { api } from '../../../services/api';

interface ReadinessLog {
  date: string;
  readiness_score: number | null;
  hrv_balance_score: number | null;
  temperature_deviation: number | null;
  resting_heart_rate: number | null;
  stress_high_seconds: number | null;
  recovery_high_seconds: number | null;
  resilience_level: string | null;
  spo2_avg: number | null;
  avg_hrv: number | null;
}

const RESILIENCE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  restored: { label: 'Restored', color: '#34C759', icon: 'checkmark-circle' },
  relaxed: { label: 'Relaxed', color: '#5AC8FA', icon: 'leaf' },
  engaged: { label: 'Engaged', color: '#FF9500', icon: 'flash' },
  stressed: { label: 'Stressed', color: '#FF3B30', icon: 'alert-circle' },
};

export default function ReadinessCard() {
  const { colors } = useGlassTheme();
  const [logs, setLogs] = useState<ReadinessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [hasOura, setHasOura] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { readinessLogs } = await api.getReadinessHistory(14);
      setLogs(readinessLogs || []);
      setHasOura(readinessLogs.length > 0);
    } catch (error) {
      console.error('[ReadinessCard] Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = logs[0] || null; // Most recent entry
  const score = today?.readiness_score;

  const getScoreColor = useCallback((s: number | null | undefined): string => {
    if (!s) return colors.textMuted;
    if (s >= 80) return '#34C759';
    if (s >= 60) return '#FF9500';
    return '#FF3B30';
  }, [colors]);

  const getScoreLabel = useCallback((s: number | null | undefined): string => {
    if (!s) return 'No Data';
    if (s >= 85) return 'Optimal';
    if (s >= 70) return 'Good';
    if (s >= 50) return 'Fair';
    return 'Low';
  }, []);

  const formatTemp = (dev: number | null | undefined): string => {
    if (dev === null || dev === undefined) return '--';
    const sign = dev >= 0 ? '+' : '';
    return `${sign}${Number(dev).toFixed(1)}°`;
  };

  const formatStress = (seconds: number | null | undefined): string => {
    if (!seconds) return '--';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const resilience = today?.resilience_level
    ? RESILIENCE_CONFIG[today.resilience_level] || RESILIENCE_CONFIG.engaged
    : null;

  // Don't show if no Oura data and not loading
  if (!isLoading && !hasOura) return null;

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#5E5CE620' }]}>
              <Ionicons name="fitness" size={20} color="#5E5CE6" />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Readiness</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Oura Ring
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.cardGlass }]}
            onPress={() => setShowHistoryModal(true)}
            accessibilityLabel="View readiness history"
            accessibilityRole="button"
          >
            <Text style={[styles.viewButtonText, { color: '#5E5CE6' }]}>History</Text>
            <Ionicons name="arrow-forward" size={14} color="#5E5CE6" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading readiness data...</Text>
          </View>
        ) : (
          <>
            {/* Score Ring + Label */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreRingContainer}>
                <View style={[styles.scoreRing, { borderColor: getScoreColor(score) }]}>
                  <NumberText weight="bold" style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                    {score ?? '--'}
                  </NumberText>
                </View>
                <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>
                  {getScoreLabel(score)}
                </Text>
              </View>

              {/* Key Vitals Column */}
              <View style={styles.vitalsColumn}>
                <View style={styles.vitalRow}>
                  <Ionicons name="heart" size={14} color="#FF2D55" />
                  <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Resting HR</Text>
                  <NumberText weight="semiBold" style={[styles.vitalValue, { color: colors.text }]}>
                    {today?.resting_heart_rate ?? '--'}
                    <Text style={[styles.vitalUnit, { color: colors.textMuted }]}> bpm</Text>
                  </NumberText>
                </View>
                <View style={styles.vitalRow}>
                  <Ionicons name="pulse" size={14} color="#5E5CE6" />
                  <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>HRV</Text>
                  <NumberText weight="semiBold" style={[styles.vitalValue, { color: colors.text }]}>
                    {today?.avg_hrv ? Math.round(Number(today.avg_hrv)) : '--'}
                    <Text style={[styles.vitalUnit, { color: colors.textMuted }]}> ms</Text>
                  </NumberText>
                </View>
                <View style={styles.vitalRow}>
                  <Ionicons name="thermometer" size={14} color="#FF9500" />
                  <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Temp</Text>
                  <NumberText weight="semiBold" style={[styles.vitalValue, {
                    color: today?.temperature_deviation
                      ? Math.abs(Number(today.temperature_deviation)) > 0.5 ? '#FF9500' : colors.text
                      : colors.textMuted
                  }]}>
                    {formatTemp(today?.temperature_deviation)}
                  </NumberText>
                </View>
                <View style={styles.vitalRow}>
                  <Ionicons name="water" size={14} color="#5AC8FA" />
                  <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>SpO2</Text>
                  <NumberText weight="semiBold" style={[styles.vitalValue, { color: colors.text }]}>
                    {today?.spo2_avg ? `${Math.round(Number(today.spo2_avg))}%` : '--'}
                  </NumberText>
                </View>
              </View>
            </View>

            {/* Stress / Resilience Row */}
            <View style={styles.bottomRow}>
              {resilience && (
                <View style={[styles.resilienceBadge, { backgroundColor: resilience.color + '18' }]}>
                  <Ionicons name={resilience.icon as any} size={14} color={resilience.color} />
                  <Text style={[styles.resilienceText, { color: resilience.color }]}>
                    {resilience.label}
                  </Text>
                </View>
              )}
              {today?.stress_high_seconds != null && (
                <View style={[styles.stressBadge, { backgroundColor: colors.cardGlass }]}>
                  <Ionicons name="alert-circle-outline" size={14} color="#FF9500" />
                  <Text style={[styles.stressText, { color: colors.textSecondary }]}>
                    Stress: {formatStress(today.stress_high_seconds)}
                  </Text>
                </View>
              )}
              {today?.recovery_high_seconds != null && (
                <View style={[styles.stressBadge, { backgroundColor: colors.cardGlass }]}>
                  <Ionicons name="leaf-outline" size={14} color="#34C759" />
                  <Text style={[styles.stressText, { color: colors.textSecondary }]}>
                    Recovery: {formatStress(today.recovery_high_seconds)}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </GlassCard>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Readiness History</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowHistoryModal(false)}
              accessibilityLabel="Close readiness history"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 7-Day Trend */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>7-Day Trend</Text>
            <View style={styles.trendRow}>
              {logs.slice(0, 7).reverse().map((log, i) => {
                const s = log.readiness_score;
                const barHeight = s ? Math.max(8, (s / 100) * 80) : 8;
                return (
                  <View key={log.date || i} style={styles.trendBarContainer}>
                    <View style={[styles.trendBar, {
                      height: barHeight,
                      backgroundColor: getScoreColor(s),
                    }]} />
                    <NumberText weight="medium" style={[styles.trendScore, { color: getScoreColor(s) }]}>
                      {s ?? '-'}
                    </NumberText>
                    <Text style={[styles.trendDay, { color: colors.textMuted }]}>
                      {log.date ? new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2) : ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Daily Entries */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
              Daily Details
            </Text>
            {logs.map((log, index) => {
              const r = log.resilience_level
                ? RESILIENCE_CONFIG[log.resilience_level] || RESILIENCE_CONFIG.engaged
                : null;
              return (
                <View key={log.date || index} style={[styles.historyEntry, { backgroundColor: colors.cardGlass }]}>
                  <View style={styles.historyEntryHeader}>
                    <Text style={[styles.historyDate, { color: colors.text }]}>
                      {log.date ? new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown'}
                    </Text>
                    <View style={styles.historyScoreContainer}>
                      <NumberText weight="bold" style={[styles.historyScore, { color: getScoreColor(log.readiness_score) }]}>
                        {log.readiness_score ?? '--'}
                      </NumberText>
                      {r && (
                        <View style={[styles.miniResilienceBadge, { backgroundColor: r.color + '18' }]}>
                          <Text style={[styles.miniResilienceText, { color: r.color }]}>{r.label}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.historyMetrics}>
                    <View style={styles.historyMetric}>
                      <Ionicons name="heart" size={12} color="#FF2D55" />
                      <Text style={[styles.historyMetricLabel, { color: colors.textMuted }]}>HR</Text>
                      <NumberText weight="medium" style={[styles.historyMetricValue, { color: colors.text }]}>
                        {log.resting_heart_rate ?? '--'}
                      </NumberText>
                    </View>
                    <View style={styles.historyMetric}>
                      <Ionicons name="pulse" size={12} color="#5E5CE6" />
                      <Text style={[styles.historyMetricLabel, { color: colors.textMuted }]}>HRV</Text>
                      <NumberText weight="medium" style={[styles.historyMetricValue, { color: colors.text }]}>
                        {log.avg_hrv ? Math.round(Number(log.avg_hrv)) : '--'}
                      </NumberText>
                    </View>
                    <View style={styles.historyMetric}>
                      <Ionicons name="thermometer" size={12} color="#FF9500" />
                      <Text style={[styles.historyMetricLabel, { color: colors.textMuted }]}>Temp</Text>
                      <NumberText weight="medium" style={[styles.historyMetricValue, { color: colors.text }]}>
                        {formatTemp(log.temperature_deviation)}
                      </NumberText>
                    </View>
                    <View style={styles.historyMetric}>
                      <Ionicons name="water" size={12} color="#5AC8FA" />
                      <Text style={[styles.historyMetricLabel, { color: colors.textMuted }]}>SpO2</Text>
                      <NumberText weight="medium" style={[styles.historyMetricValue, { color: colors.text }]}>
                        {log.spo2_avg ? `${Math.round(Number(log.spo2_avg))}%` : '--'}
                      </NumberText>
                    </View>
                  </View>
                </View>
              );
            })}

            {logs.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: colors.cardGlass }]}>
                <Ionicons name="fitness-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No readiness data yet. Connect your Oura Ring and sync to see readiness scores.
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontFamily: Fonts.semiBold },
  subtitle: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  viewButtonText: { fontSize: 13, fontFamily: Fonts.medium },

  loadingContainer: { alignItems: 'center', padding: 24, gap: 8 },
  loadingText: { fontSize: 12, fontFamily: Fonts.regular },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  scoreRingContainer: { alignItems: 'center' },
  scoreRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: { fontSize: 28 },
  scoreLabel: { fontSize: 11, fontFamily: Fonts.medium, marginTop: 4 },

  vitalsColumn: { flex: 1, gap: 8 },
  vitalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vitalLabel: { fontSize: 12, fontFamily: Fonts.regular, flex: 1 },
  vitalValue: { fontSize: 14 },
  vitalUnit: { fontSize: 10, fontFamily: Fonts.regular },

  bottomRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resilienceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  resilienceText: { fontSize: 12, fontFamily: Fonts.semiBold },
  stressBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  stressText: { fontSize: 12, fontFamily: Fonts.regular },

  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontFamily: Fonts.semiBold },
  closeButton: { width: 36, height: 36, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.semiBold, marginBottom: 12 },

  // Trend bars
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingHorizontal: 4 },
  trendBarContainer: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  trendBar: { width: 24, borderRadius: 6, minHeight: 8 },
  trendScore: { fontSize: 11, marginTop: 4 },
  trendDay: { fontSize: 10, fontFamily: Fonts.regular, marginTop: 2 },

  // History entries
  historyEntry: { padding: 14, borderRadius: 12, marginBottom: 10 },
  historyEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyDate: { fontSize: 13, fontFamily: Fonts.medium },
  historyScoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyScore: { fontSize: 20 },
  miniResilienceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  miniResilienceText: { fontSize: 10, fontFamily: Fonts.semiBold },
  historyMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  historyMetric: { alignItems: 'center', gap: 2 },
  historyMetricLabel: { fontSize: 10, fontFamily: Fonts.regular },
  historyMetricValue: { fontSize: 13 },

  emptyState: { alignItems: 'center', padding: 24, borderRadius: 12 },
  emptyText: { fontSize: 13, fontFamily: Fonts.regular, textAlign: 'center', marginTop: 12 },
});
