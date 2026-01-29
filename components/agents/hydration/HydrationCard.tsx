/**
 * Hydration Card Component
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';
import { useHydration } from '../../../contexts/HydrationContext';
import { QUICK_ADD_AMOUNTS, WATER_SOURCES } from '../../../types/hydration';
import { Fonts } from '../../../constants/Theme';

export default function HydrationCard() {
  const { colors } = useGlassTheme();
  const {
    state,
    addWater,
    removeEntry,
    getHydrationTip,
    getProgressPercent,
    getRemainingAmount,
  } = useHydration();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<typeof WATER_SOURCES[0]>(WATER_SOURCES[0]);
  const [customAmount, setCustomAmount] = useState('');
  const [tip, setTip] = useState('');
  const [progressAnim] = useState(new Animated.Value(0));

  const progressPercent = getProgressPercent();
  const remaining = getRemainingAmount();

  useEffect(() => {
    setTip(getHydrationTip());
  }, [getHydrationTip]);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progressPercent,
      useNativeDriver: false,
      tension: 30,
      friction: 8,
    }).start();
  }, [progressPercent, progressAnim]);

  const handleQuickAdd = useCallback(
    async (amount: number) => {
      await addWater(amount, selectedSource.id as any);
    },
    [addWater, selectedSource]
  );

  const formatAmount = useCallback((ml: number): string => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  }, []);

  const getProgressColor = useCallback(() => {
    if (progressPercent >= 100) return colors.success;
    if (progressPercent >= 70) return colors.primary;
    if (progressPercent >= 40) return '#FFB74D';
    return '#EF5350';
  }, [progressPercent, colors]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#4FC3F7' + '20' }]}>
              <Ionicons name="water" size={20} color="#4FC3F7" />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Hydration</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {state.streak.currentStreak > 0 ? `${state.streak.currentStreak} day streak` : 'Track your water'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.cardGlass }]}
            onPress={() => setShowHistoryModal(true)}
          >
            <Text style={[styles.viewButtonText, { color: colors.primary }]}>History</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Today's Progress</Text>
            <Text style={[styles.progressPercent, { color: getProgressColor() }]}>{progressPercent}%</Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.cardGlass }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth,
                  backgroundColor: getProgressColor(),
                },
              ]}
            />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="water" size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{formatAmount(state.todayIntake)}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>consumed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
            <View style={styles.statItem}>
              <Ionicons name="flag" size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{formatAmount(state.todayGoal)}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>goal</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
            <View style={styles.statItem}>
              <Ionicons name="hourglass" size={16} color={remaining > 0 ? '#FFB74D' : colors.success} />
              <Text style={[styles.statValue, { color: remaining > 0 ? colors.text : colors.success }]}>
                {remaining > 0 ? formatAmount(remaining) : 'Done!'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>remaining</Text>
            </View>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAddScroll}>
          {QUICK_ADD_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount.value}
              style={[styles.quickAddButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
              onPress={() => handleQuickAdd(amount.value)}
            >
              <Ionicons name="add" size={14} color={colors.primary} />
              <Text style={[styles.quickAddText, { color: colors.text }]}>{amount.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.quickAddButton, styles.customButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle" size={14} color="#FFF" />
            <Text style={[styles.quickAddText, { color: '#FFF' }]}>Custom</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Tip */}
        <View style={[styles.tipContainer, { backgroundColor: '#4FC3F7' + '10' }]}>
          <Ionicons name="bulb" size={16} color="#4FC3F7" />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
        </View>
      </GlassCard>

      {/* Add Water Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Water</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowAddModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Source Selector */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Beverage Type</Text>
            <View style={styles.sourceGrid}>
              {WATER_SOURCES.map((source) => (
                <TouchableOpacity
                  key={source.id}
                  style={[
                    styles.sourceButton,
                    {
                      backgroundColor: selectedSource.id === source.id ? source.color + '30' : colors.cardGlass,
                      borderColor: selectedSource.id === source.id ? source.color : colors.glassBorder,
                    },
                  ]}
                  onPress={() => setSelectedSource(source)}
                >
                  <Ionicons
                    name={source.icon as any}
                    size={22}
                    color={selectedSource.id === source.id ? source.color : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.sourceLabel,
                      { color: selectedSource.id === source.id ? source.color : colors.text },
                    ]}
                  >
                    {source.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Amounts */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Amount</Text>
            <View style={styles.amountGrid}>
              {QUICK_ADD_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount.value}
                  style={[styles.amountButton, { backgroundColor: colors.cardGlass }]}
                  onPress={() => {
                    handleQuickAdd(amount.value);
                    setShowAddModal(false);
                  }}
                >
                  <Text style={[styles.amountValue, { color: colors.text }]}>{amount.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Today's Entries */}
            {state.todayEntries.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
                  Today's Log ({state.todayEntries.length})
                </Text>
                {state.todayEntries.slice(0, 5).map((entry, index) => (
                  <View key={entry.id || index} style={[styles.entryItem, { backgroundColor: colors.cardGlass }]}>
                    <View style={styles.entryLeft}>
                      <Ionicons
                        name={WATER_SOURCES.find((s) => s.id === entry.source)?.icon as any || 'water'}
                        size={18}
                        color={WATER_SOURCES.find((s) => s.id === entry.source)?.color || '#4FC3F7'}
                      />
                      <View>
                        <Text style={[styles.entryAmount, { color: colors.text }]}>{formatAmount(entry.amount)}</Text>
                        <Text style={[styles.entryTime, { color: colors.textMuted }]}>
                          {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: colors.danger + '20' }]}
                      onPress={() => removeEntry(entry.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Hydration History</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowHistoryModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Streak */}
            <View style={styles.streakRow}>
              <View style={[styles.streakBox, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="flame" size={24} color={colors.primary} />
                <Text style={[styles.streakValue, { color: colors.text }]}>{state.streak.currentStreak}</Text>
                <Text style={[styles.streakLabel, { color: colors.textMuted }]}>Current Streak</Text>
              </View>
              <View style={[styles.streakBox, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="trophy" size={24} color={colors.success} />
                <Text style={[styles.streakValue, { color: colors.text }]}>{state.streak.longestStreak}</Text>
                <Text style={[styles.streakLabel, { color: colors.textMuted }]}>Best Streak</Text>
              </View>
            </View>

            {/* Weekly History */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>This Week</Text>
            {state.weeklyHistory.map((day, index) => {
              const isToday = index === 0;
              const percent = day.percentComplete;
              return (
                <View key={day.date} style={[styles.historyItem, { backgroundColor: colors.cardGlass }]}>
                  <View style={styles.historyLeft}>
                    <Text style={[styles.historyDate, { color: colors.text }]}>
                      {isToday
                        ? 'Today'
                        : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={[styles.historyIntake, { color: colors.textMuted }]}>
                      {formatAmount(day.totalIntake)} / {formatAmount(day.goal)}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <View style={[styles.miniProgressBar, { backgroundColor: colors.glassBorder }]}>
                      <View
                        style={[
                          styles.miniProgressFill,
                          {
                            width: `${Math.min(100, percent)}%`,
                            backgroundColor: day.goalMet ? colors.success : percent >= 70 ? colors.primary : '#FFB74D',
                          },
                        ]}
                      />
                    </View>
                    {day.goalMet && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
                  </View>
                </View>
              );
            })}

            {state.weeklyHistory.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: colors.cardGlass }]}>
                <Ionicons name="water-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Start tracking your hydration today!
                </Text>
              </View>
            )}

            {/* Goal Info */}
            <View style={[styles.goalInfo, { backgroundColor: colors.primary + '10', marginTop: 20 }]}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={[styles.goalInfoText, { color: colors.textSecondary }]}>
                Your daily goal is {formatAmount(state.todayGoal)}. Stay consistent for better health!
              </Text>
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
  progressSection: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontFamily: Fonts.regular },
  progressPercent: { fontSize: 14, fontFamily: Fonts.semiBold },
  progressBarContainer: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 14, fontFamily: Fonts.semiBold },
  statLabel: { fontSize: 10, fontFamily: Fonts.regular },
  statDivider: { width: 1, height: 30 },
  quickAddScroll: { marginBottom: 12 },
  quickAddButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  customButton: { borderWidth: 0 },
  quickAddText: { fontSize: 12, fontFamily: Fonts.medium },
  tipContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  tipText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontFamily: Fonts.semiBold },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.semiBold, marginBottom: 12 },
  sourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceButton: { alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, width: '31%', gap: 6 },
  sourceLabel: { fontSize: 11, fontFamily: Fonts.medium },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amountButton: { alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, minWidth: '30%' },
  amountValue: { fontSize: 16, fontFamily: Fonts.semiBold },
  entryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8 },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryAmount: { fontSize: 14, fontFamily: Fonts.semiBold },
  entryTime: { fontSize: 11, fontFamily: Fonts.regular },
  deleteButton: { padding: 8, borderRadius: 8 },
  streakRow: { flexDirection: 'row', gap: 12 },
  streakBox: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 12, gap: 4 },
  streakValue: { fontSize: 24, fontFamily: Fonts.semiBold },
  streakLabel: { fontSize: 11, fontFamily: Fonts.regular },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8 },
  historyLeft: { flex: 1 },
  historyDate: { fontSize: 13, fontFamily: Fonts.medium },
  historyIntake: { fontSize: 11, fontFamily: Fonts.regular, marginTop: 2 },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniProgressBar: { width: 60, height: 6, borderRadius: 3, overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 3 },
  emptyState: { alignItems: 'center', padding: 24, borderRadius: 12 },
  emptyText: { fontSize: 13, fontFamily: Fonts.regular, textAlign: 'center', marginTop: 12 },
  goalInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10 },
  goalInfoText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular },
});
