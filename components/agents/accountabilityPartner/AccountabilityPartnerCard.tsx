/**
 * AI Accountability Coach Card
 * Shows AI-generated daily summary preview with stats row and "Chat with Coach" button.
 * Replaces the old static accountability partner card.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Colors, Fonts } from '../../../constants/Theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';

// Contexts
import { useGoalWizard } from '../../../contexts/GoalWizardContext';
import { useMealPlan } from '../../../contexts/MealPlanContext';
import { useTraining } from '../../../contexts/TrainingContext';
import { useHydration } from '../../../contexts/HydrationContext';
import { useSleepRecovery } from '../../../contexts/SleepRecoveryContext';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useCalorieBanking } from '../../../contexts/CalorieBankingContext';
import { useAccountabilityPartner } from '../../../contexts/AccountabilityPartnerContext';
import { useAuth } from '../../../contexts/AuthContext';

// Services
import {
  DailySnapshot,
  ChatMessage,
  buildDailySnapshot,
  getDailySummaryCache,
  saveDailySummaryCache,
} from '../../../services/accountabilityCoachService';
import { generateAccountabilitySummary } from '../../../services/openaiService';
import { api } from '../../../services/api';

// Modal
import AccountabilityCoachModal from './AccountabilityCoachModal';

export default function AccountabilityPartnerCard() {
  const { isDark, colors } = useGlassTheme();
  const { user } = useAuth();

  // All context hooks
  const { state: goalState } = useGoalWizard();
  const { state: mealState } = useMealPlan();
  const { state: trainingState, getTrainingDayForDate } = useTraining();
  const { state: hydrationState, getProgressPercent } = useHydration();
  const { state: sleepState, getTodaySleep } = useSleepRecovery();
  const { state: plannerState } = useDayPlanner();
  const { state: bankingState } = useCalorieBanking();
  const {
    state: accountabilityState,
    getActivityStreak,
    getConsistencyScore,
  } = useAccountabilityPartner();

  // Local state
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);

  const consistencyScore = useMemo(() => getConsistencyScore(), [getConsistencyScore]);

  // Build snapshot from all contexts + actual logged meals from API
  const buildSnapshot = useCallback(async (): Promise<DailySnapshot> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrainingDay = getTrainingDayForDate(todayStr);
    const todayMealPlan = mealState.weeklyPlan?.[mealState.selectedDayIndex];
    const todaySleep = getTodaySleep();
    const todayBankLog = bankingState.currentWeek?.dailyLogs.find(d => d.date === todayStr);
    const todayTimeline = plannerState.weeklyPlan?.days.find(d => d.date === todayStr);

    const todayBlocks = todayTimeline?.blocks ?? [];
    const actionableBlocks = todayBlocks.filter(b => b.type !== 'buffer' && b.type !== 'sleep');

    // Fetch ACTUALLY LOGGED meals from the backend API (same source as dashboard)
    let loggedMeals: { name: string; calories: number; mealType: string; protein: number; carbs: number; fat: number }[] = [];
    try {
      const apiMeals = await api.getMeals(todayStr);
      loggedMeals = apiMeals.map(m => ({
        name: m.name || 'Unknown',
        calories: m.calories || 0,
        mealType: m.mealType || 'snack',
        protein: m.protein || 0,
        carbs: m.carbs || 0,
        fat: m.fat || 0,
      }));
    } catch (error) {
      console.error('[AccountabilityCoach] Error fetching logged meals:', error);
    }

    const loggedTotals = loggedMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return buildDailySnapshot({
      goals: {
        primaryGoal: goalState.primaryGoal,
        calories: goalState.results?.calories ?? 2000,
        protein: goalState.results?.protein ?? 150,
        carbs: goalState.results?.carbs ?? 200,
        fat: goalState.results?.fat ?? 65,
        waterGoalOz: goalState.waterGoalOz,
        sleepGoalHours: goalState.sleepGoalHours,
        stepGoal: goalState.stepGoal,
        intermittentFasting: goalState.intermittentFasting,
        fastingStart: goalState.fastingStart,
        fastingEnd: goalState.fastingEnd,
      },
      loggedMeals: {
        meals: loggedMeals,
        totalCalories: loggedTotals.calories,
        totalProtein: loggedTotals.protein,
        totalCarbs: loggedTotals.carbs,
        totalFat: loggedTotals.fat,
      },
      plannedMeals: {
        meals: (todayMealPlan?.meals ?? []).map(m => ({
          name: m.name,
          calories: m.calories,
          mealType: m.mealType,
        })),
        count: todayMealPlan?.meals?.length ?? 0,
      },
      training: {
        workoutCompleted: todayTrainingDay?.completed ?? false,
        workoutName: todayTrainingDay?.workout?.name ?? null,
        completedThisWeek: trainingState.weeklyPlan?.completedWorkouts ?? 0,
        workoutStreak: getActivityStreak('workoutCompletion'),
      },
      hydration: {
        intakeOz: hydrationState.todayIntake,
        goalOz: hydrationState.todayGoal,
        progressPercent: getProgressPercent(),
      },
      sleep: {
        lastSleepHours: todaySleep ? todaySleep.duration / 60 : null,
        recoveryScore: sleepState.recoveryScores[0]?.score ?? null,
        sleepDebt: sleepState.sleepDebt,
      },
      banking: {
        weeklyRemaining: (bankingState.currentWeek?.weeklyTarget ?? 0) -
          (bankingState.currentWeek?.dailyLogs ?? []).reduce((s, d) => s + d.consumedCalories, 0),
        isOnTrack: (todayBankLog?.consumedCalories ?? 0) <= (todayBankLog?.targetCalories ?? 9999),
        bankedCalories: bankingState.currentWeek?.bankedCalories ?? 0,
      },
      planner: {
        scheduledBlocks: actionableBlocks.length,
        completedBlocks: actionableBlocks.filter(b => b.status === 'completed').length,
        skippedBlocks: actionableBlocks.filter(b => b.status === 'skipped').length,
      },
      streaks: {
        mealLogging: getActivityStreak('mealLogging'),
        weightLogging: getActivityStreak('weightLogging'),
        workoutCompletion: getActivityStreak('workoutCompletion'),
        waterIntake: getActivityStreak('waterIntake'),
        calorieGoalMet: getActivityStreak('calorieGoalMet'),
      },
      consistencyScore,
    });
  }, [
    goalState, mealState, trainingState, hydrationState, sleepState,
    plannerState, bankingState, accountabilityState, consistencyScore,
    getTrainingDayForDate, getTodaySleep, getProgressPercent, getActivityStreak,
  ]);

  // Load cached or generate fresh summary on mount
  useEffect(() => {
    let cancelled = false;

    async function loadOrGenerate() {
      // Check cache first
      const cached = await getDailySummaryCache();
      if (cached && !cancelled) {
        setSummary(cached.summary);
        setChatMessages(cached.messages);
        const snap = await buildSnapshot();
        if (!cancelled) setSnapshot(snap);
        return;
      }

      // Generate fresh
      if (cancelled) return;
      setIsGenerating(true);
      const snap = await buildSnapshot();
      if (cancelled) return;
      setSnapshot(snap);

      try {
        const result = await generateAccountabilitySummary(snap, user?.firstName || undefined);
        if (!cancelled) {
          setSummary(result);
          await saveDailySummaryCache(result, []);
        }
      } catch (error) {
        console.error('[AccountabilityCoach] Generation error:', error);
        if (!cancelled) {
          setSummary('Tap "Chat with Coach" to get your daily review.');
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    loadOrGenerate();
    return () => { cancelled = true; };
  }, []); // Run once on mount

  // Keep snapshot fresh when modal opens
  const handleOpenModal = useCallback(async () => {
    const snap = await buildSnapshot();
    setSnapshot(snap);
    setShowModal(true);
  }, [buildSnapshot]);

  // Compute quick stats from snapshot (uses actual logged meals, not planned)
  const caloriePercent = useMemo(() => {
    if (snapshot) {
      return snapshot.calorieTarget > 0
        ? Math.round((snapshot.caloriesConsumed / snapshot.calorieTarget) * 100)
        : 0;
    }
    return 0;
  }, [snapshot]);

  const hydrationPercent = useMemo(() => getProgressPercent(), [getProgressPercent]);

  // Get a 3-line preview of the summary
  const summaryPreview = useMemo(() => {
    if (!summary) return '';
    // Take first ~200 chars and trim to last complete sentence
    const preview = summary.substring(0, 200);
    const lastPeriod = preview.lastIndexOf('.');
    if (lastPeriod > 80) return preview.substring(0, lastPeriod + 1);
    return preview + '...';
  }, [summary]);

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="sparkles" size={26} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>AI Accountability Coach</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Daily review &bull; Resets at midnight
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Preview */}
        <View style={styles.summaryContainer}>
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Analyzing your day...
              </Text>
            </View>
          ) : (
            <Text
              style={[styles.summaryText, { color: colors.textSecondary }]}
              numberOfLines={4}
            >
              {summaryPreview || 'Tap below to get your daily accountability review.'}
            </Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="analytics" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.text }]}>{consistencyScore}%</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Consistency</Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: caloriePercent > 100 ? 'rgba(255,107,107,0.15)' : 'rgba(78,205,196,0.15)' }]}>
              <Ionicons name="flame" size={16} color={caloriePercent > 100 ? Colors.error : '#4ECDC4'} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.text }]}>{caloriePercent}%</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Calories</Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
              <Ionicons name="water" size={16} color="#6366F1" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.text }]}>{hydrationPercent}%</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Hydration</Text>
            </View>
          </View>
        </View>

        {/* Chat with Coach Button */}
        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: colors.primary }]}
          onPress={handleOpenModal}
          accessibilityLabel="Chat with AI Coach"
          accessibilityRole="button"
          accessibilityHint="Opens full-screen chat with your AI accountability coach showing today's detailed review"
        >
          <Ionicons name="chatbubbles" size={18} color={Colors.text} />
          <Text style={styles.chatButtonText}>Chat with Coach</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Coach Chat Modal */}
      {snapshot && (
        <AccountabilityCoachModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          snapshot={snapshot}
          initialSummary={summary}
          messages={chatMessages}
          onMessagesChange={setChatMessages}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  summaryContainer: {
    marginBottom: 14,
    minHeight: 60,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 15,
    fontFamily: Fonts.numericSemiBold,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 4,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  chatButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});
