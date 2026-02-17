// Progressive Overload Tracking Page
// AI-powered strength progression tracking, weekly analysis, and plateau detection

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  TrendingUp,
  Dumbbell,
  Zap,
  Trophy,
  BarChart3,
} from 'lucide-react-native';
import Svg, { Polyline, Line, Text as SvgText, Rect } from 'react-native-svg';
import { GlassCard } from '../../components/GlassCard';
import { NumberText } from '../../components/NumberText';
import OverloadScoreBar from '../../components/training/OverloadScoreBar';
import ExerciseOverloadCard from '../../components/training/ExerciseOverloadCard';
import MuscleVolumeChart from '../../components/training/MuscleVolumeChart';
import WeeklyAnalysisModal from '../../components/training/WeeklyAnalysisModal';
import PlateauBreakerModal from '../../components/training/PlateauBreakerModal';
import WorkoutLoggerModal from '../../components/training/WorkoutLoggerModal';
import { useSettings } from '../../contexts/SettingsContext';
import { DarkColors, LightColors, Fonts } from '../../constants/Theme';
import { weightTrackingStorage } from '../../services/weightTrackingStorage';
import {
  generateWeeklyAnalysis,
  generatePlateauBreaker,
  generateSetRecommendations,
} from '../../services/progressiveOverloadAI';
import {
  ProgressiveOverloadEntry,
  AIWeeklyAnalysis,
  OverloadTrend,
  MuscleGroup,
} from '../../types/training';
import { lightImpact, mediumImpact } from '../../utils/haptics';

// ============================================================================
// Helper: Get week date range string
// ============================================================================
function getWeekLabel(weekStartDate: string): string {
  const start = new Date(weekStartDate + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// ============================================================================
// Custom SVG Line Chart for Strength Trends
// ============================================================================
interface TrendChartProps {
  data: { label: string; value: number }[];
  color: string;
  height?: number;
  isDark: boolean;
}

function TrendLineChart({ data, color, height = 140, isDark }: TrendChartProps) {
  if (data.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: isDark ? '#888' : '#86868B', fontFamily: Fonts.regular, fontSize: 12 }}>
          Need at least 2 weeks of data
        </Text>
      </View>
    );
  }

  const width = 320;
  const padding = { top: 10, bottom: 24, left: 40, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH - ((d.value - min) / range) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  // Y-axis labels
  const yLabels = [min, min + range / 2, max].map(v => Math.round(v));

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = padding.top + chartH - ((v - min) / range) * chartH;
        return (
          <React.Fragment key={i}>
            <Line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke={isDark ? '#222' : '#E5E5E5'}
              strokeWidth={1}
            />
            <SvgText
              x={padding.left - 4}
              y={y + 4}
              textAnchor="end"
              fill={isDark ? '#666' : '#86868B'}
              fontSize={10}
              fontFamily={Fonts.numericRegular}
            >
              {v}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (data.length > 8 && i % 2 !== 0) return null;
        const x = padding.left + (i / (data.length - 1)) * chartW;
        return (
          <SvgText
            key={i}
            x={x}
            y={height - 4}
            textAnchor="middle"
            fill={isDark ? '#666' : '#86868B'}
            fontSize={9}
            fontFamily={Fonts.numericRegular}
          >
            {d.label}
          </SvgText>
        );
      })}

      {/* Data line */}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartW;
        const y = padding.top + chartH - ((d.value - min) / range) * chartH;
        return (
          <React.Fragment key={`dot-${i}`}>
            <Rect
              x={x - 3}
              y={y - 3}
              width={6}
              height={6}
              rx={3}
              fill={color}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================
export default function ProgressiveOverloadPage() {
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // State
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStart());
  const [exerciseEntries, setExerciseEntries] = useState<ProgressiveOverloadEntry[]>([]);
  const [muscleVolumes, setMuscleVolumes] = useState<{ muscleGroup: MuscleGroup; weeklySets: number }[]>([]);
  const [trendDataMap, setTrendDataMap] = useState<Record<string, OverloadTrend>>({});
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<AIWeeklyAnalysis | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trendRange, setTrendRange] = useState<4 | 8 | 12>(8);

  // Modal states
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showPlateauModal, setShowPlateauModal] = useState(false);
  const [showLoggerModal, setShowLoggerModal] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isPlateauLoading, setIsPlateauLoading] = useState(false);
  const [plateauExercise, setPlateauExercise] = useState('');
  const [plateauDiagnosis, setPlateauDiagnosis] = useState('');
  const [plateauStrategies, setPlateauStrategies] = useState<any[]>([]);
  const [loggerExerciseId, setLoggerExerciseId] = useState('');
  const [loggerExerciseName, setLoggerExerciseName] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    try {
      const exercises = await weightTrackingStorage.getExercisesForWeek(currentWeekStart);
      const sessions = await weightTrackingStorage.getWeekSessionCount(currentWeekStart);
      setSessionCount(sessions);

      // Load overload entries for each exercise
      const entries: ProgressiveOverloadEntry[] = [];
      const trends: Record<string, OverloadTrend> = {};

      for (const ex of exercises) {
        const weeklyEntries = await weightTrackingStorage.getWeeklyOverloadEntries(ex.exerciseId, trendRange);
        const currentEntry = weeklyEntries.find(e => e.weekStartDate === currentWeekStart);
        if (currentEntry) {
          entries.push(currentEntry);
        }
        const trend = await weightTrackingStorage.getOverloadTrends(ex.exerciseId, trendRange);
        if (trend) {
          trends[ex.exerciseId] = trend;
        }
      }

      // Sort: stalling first, then maintaining, then progressing, then PRs
      const statusOrder: Record<string, number> = {
        regressing: 0,
        stalling: 1,
        deload_recommended: 2,
        maintaining: 3,
        new_exercise: 4,
        progressing: 5,
        pr_set: 6,
      };
      entries.sort((a, b) => (statusOrder[a.overloadStatus] || 3) - (statusOrder[b.overloadStatus] || 3));

      setExerciseEntries(entries);
      setTrendDataMap(trends);

      // Load muscle volumes
      const volumes = await weightTrackingStorage.getMuscleGroupVolume(currentWeekStart);
      setMuscleVolumes(volumes);

      // Check for cached analysis
      const cached = await weightTrackingStorage.getAIAnalysisCache(currentWeekStart);
      if (cached) setWeeklyAnalysis(cached);
    } catch (error) {
      console.error('[ProgressiveOverload] Error loading data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentWeekStart, trendRange]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  // Week navigation
  const navigateWeek = (direction: -1 | 1) => {
    lightImpact();
    const date = new Date(currentWeekStart + 'T00:00:00');
    date.setDate(date.getDate() + direction * 7);
    const newWeekStart = date.toISOString().split('T')[0];
    // Don't navigate to the future
    if (newWeekStart <= getCurrentWeekStart()) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  // Calculate overload score
  const overloadScore = (() => {
    if (exerciseEntries.length === 0) return 0;
    let score = 0;
    for (const e of exerciseEntries) {
      switch (e.overloadStatus) {
        case 'pr_set': score += 100; break;
        case 'progressing': score += 80; break;
        case 'maintaining': score += 50; break;
        case 'new_exercise': score += 60; break;
        case 'stalling': score += 30; break;
        case 'regressing': score += 10; break;
        case 'deload_recommended': score += 20; break;
      }
    }
    return Math.round(score / exerciseEntries.length);
  })();

  const prCount = exerciseEntries.filter(e => e.overloadStatus === 'pr_set').length;
  const progressingCount = exerciseEntries.filter(e => e.overloadStatus === 'progressing').length;
  const stallingCount = exerciseEntries.filter(
    e => e.overloadStatus === 'stalling' || e.overloadStatus === 'regressing'
  ).length;

  // AI Analysis
  const handleAIAnalysis = async () => {
    mediumImpact();
    setShowAnalysisModal(true);
    if (weeklyAnalysis) return; // Use cached

    setIsAnalysisLoading(true);
    try {
      const profile = await weightTrackingStorage.getUserProgressionProfile();
      const analysis = await generateWeeklyAnalysis(
        exerciseEntries,
        [],
        profile,
        muscleVolumes
      );
      if (analysis) {
        setWeeklyAnalysis(analysis);
        await weightTrackingStorage.saveAIAnalysisCache(currentWeekStart, analysis);
      }
    } catch (error) {
      console.error('[ProgressiveOverload] AI analysis error:', error);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Plateau breaker
  const handleBreakPlateau = async (exerciseName: string, exerciseId: string) => {
    mediumImpact();
    setPlateauExercise(exerciseName);
    setShowPlateauModal(true);
    setIsPlateauLoading(true);

    try {
      const entries = await weightTrackingStorage.getWeeklyOverloadEntries(exerciseId, 6);
      const profile = await weightTrackingStorage.getUserProgressionProfile();
      const result = await generatePlateauBreaker(exerciseName, entries, profile);
      if (result) {
        setPlateauDiagnosis(result.diagnosis);
        setPlateauStrategies(result.strategies);
      }
    } catch (error) {
      console.error('[ProgressiveOverload] Plateau breaker error:', error);
    } finally {
      setIsPlateauLoading(false);
    }
  };

  // Log workout
  const handleLogWorkout = (exerciseId: string, exerciseName: string) => {
    lightImpact();
    setLoggerExerciseId(exerciseId);
    setLoggerExerciseName(exerciseName);
    setShowLoggerModal(true);
  };

  // Trend chart data (first compound exercise or most logged)
  const trendExercise = exerciseEntries[0];
  const trendData = trendExercise
    ? trendDataMap[trendExercise.exerciseId]?.dataPoints.map(d => ({
        label: `W${d.weekNumber}`,
        value: d.estimated1RM,
      })) || []
    : [];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: 'transparent' }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.success} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); loadData(); }}
            tintColor={colors.success}
          />
        }
      >
        {/* Page Title */}
        <Text style={[styles.pageTitle, { color: colors.text }]}>Progressive Overload</Text>

        {/* ============================================================ */}
        {/* SECTION 1: Weekly Dashboard Hero */}
        {/* ============================================================ */}
        <GlassCard style={styles.heroCard}>
          {/* Week navigator */}
          <View style={styles.weekNav}>
            <TouchableOpacity onPress={() => navigateWeek(-1)}>
              <ChevronLeft size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.weekLabel, { color: colors.text }]}>
              Week of {getWeekLabel(currentWeekStart)}
            </Text>
            <TouchableOpacity
              onPress={() => navigateWeek(1)}
              disabled={currentWeekStart >= getCurrentWeekStart()}
            >
              <ChevronRight
                size={24}
                color={
                  currentWeekStart >= getCurrentWeekStart()
                    ? colors.textMuted + '30'
                    : colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>

          {/* Overload Score */}
          <OverloadScoreBar score={overloadScore} label="Overload Score" />

          {/* Quick stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Dumbbell size={14} color={colors.textMuted} />
              <NumberText style={[styles.quickStatValue, { color: colors.text }]}>
                {sessionCount}
              </NumberText>
              <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Sessions</Text>
            </View>
            <View style={styles.quickStat}>
              <TrendingUp size={14} color={colors.success} />
              <NumberText style={[styles.quickStatValue, { color: colors.success }]}>
                {progressingCount}
              </NumberText>
              <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Progressed</Text>
            </View>
            <View style={styles.quickStat}>
              <Zap size={14} color={colors.warningOrange} />
              <NumberText style={[styles.quickStatValue, { color: colors.warningOrange }]}>
                {stallingCount}
              </NumberText>
              <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Stalling</Text>
            </View>
            <View style={styles.quickStat}>
              <Trophy size={14} color={colors.accentGold} />
              <NumberText style={[styles.quickStatValue, { color: colors.accentGold }]}>
                {prCount}
              </NumberText>
              <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>PRs</Text>
            </View>
          </View>

          {/* AI Analysis button */}
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: colors.accentPurple + '15' }]}
            onPress={handleAIAnalysis}
          >
            <Brain size={16} color={colors.accentPurple} />
            <Text style={[styles.aiButtonText, { color: colors.accentPurple }]}>
              AI Weekly Analysis
            </Text>
          </TouchableOpacity>
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 2: Exercise Overload Cards */}
        {/* ============================================================ */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercise Breakdown</Text>

        {exerciseEntries.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Dumbbell size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No workouts logged this week
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Log a workout to see your overload tracking
            </Text>
          </GlassCard>
        ) : (
          exerciseEntries.map((entry) => (
            <ExerciseOverloadCard
              key={entry.exerciseId}
              current={entry}
              trendData={
                trendDataMap[entry.exerciseId]?.dataPoints || []
              }
              onViewHistory={() => handleLogWorkout(entry.exerciseId, entry.exerciseName)}
              onBreakPlateau={
                entry.overloadStatus === 'stalling' || entry.overloadStatus === 'regressing'
                  ? () => handleBreakPlateau(entry.exerciseName, entry.exerciseId)
                  : undefined
              }
              onGetAIPlan={() => handleLogWorkout(entry.exerciseId, entry.exerciseName)}
            />
          ))
        )}

        {/* ============================================================ */}
        {/* SECTION 3: Muscle Group Volume */}
        {/* ============================================================ */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Muscle Volume</Text>
        <GlassCard style={styles.muscleCard}>
          <MuscleVolumeChart
            data={muscleVolumes.map(v => ({
              muscleGroup: v.muscleGroup,
              weeklySets: v.weeklySets,
              mev: 10,
              mrv: 20,
            }))}
          />
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 4: Strength Trends */}
        {/* ============================================================ */}
        {trendData.length >= 2 && (
          <>
            <View style={styles.trendHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Strength Trends
              </Text>
              <View style={styles.trendToggle}>
                {([4, 8, 12] as const).map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[
                      styles.trendToggleBtn,
                      trendRange === w && { backgroundColor: colors.success + '20' },
                    ]}
                    onPress={() => { lightImpact(); setTrendRange(w); }}
                  >
                    <NumberText
                      style={[
                        styles.trendToggleText,
                        { color: trendRange === w ? colors.success : colors.textMuted },
                      ]}
                    >
                      {w}W
                    </NumberText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <GlassCard style={styles.chartCard}>
              <Text style={[styles.chartLabel, { color: colors.textMuted }]}>
                Est. 1RM - {trendExercise?.exerciseName}
              </Text>
              <TrendLineChart
                data={trendData}
                color={colors.success}
                isDark={isDark}
              />
            </GlassCard>
          </>
        )}

        {/* ============================================================ */}
        {/* Floating Log Workout Button (inline) */}
        {/* ============================================================ */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            mediumImpact();
            // Open logger with first exercise or empty
            const first = exerciseEntries[0];
            handleLogWorkout(first?.exerciseId || '', first?.exerciseName || 'New Exercise');
          }}
        >
          <GlassCard
            style={[
              styles.logButton,
              { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)' },
            ]}
            interactive
          >
            <Text style={[styles.logButtonText, { color: colors.primary }]}>LOG WORKOUT</Text>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}
      <WeeklyAnalysisModal
        visible={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        analysis={weeklyAnalysis}
        isLoading={isAnalysisLoading}
      />

      <PlateauBreakerModal
        visible={showPlateauModal}
        onClose={() => setShowPlateauModal(false)}
        exerciseName={plateauExercise}
        diagnosis={plateauDiagnosis}
        strategies={plateauStrategies}
        isLoading={isPlateauLoading}
      />

      <WorkoutLoggerModal
        visible={showLoggerModal}
        onClose={() => setShowLoggerModal(false)}
        exerciseId={loggerExerciseId}
        exerciseName={loggerExerciseName}
        onSave={() => {
          setShowLoggerModal(false);
          loadData();
        }}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  pageTitle: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  // Hero Card
  heroCard: {
    padding: 20,
    marginBottom: 32,
  },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekLabel: {
    fontSize: 15,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  quickStat: {
    alignItems: 'center',
    gap: 4,
  },
  quickStatValue: {
    fontSize: 20,
    fontFamily: Fonts.numericRegular,
  },
  quickStatLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0,
  },
  aiButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },

  // Sections
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.light,
    fontWeight: '200',
    marginTop: 12,
    marginBottom: 16,
  },

  // Empty state
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },

  // Muscle volume
  muscleCard: {
    padding: 16,
    marginBottom: 32,
  },

  // Trends
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  trendToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendToggleText: {
    fontSize: 12,
    fontFamily: Fonts.numericRegular,
  },
  chartCard: {
    padding: 16,
    marginBottom: 32,
  },
  chartLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },

  // Log button
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  logButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
  },
});
