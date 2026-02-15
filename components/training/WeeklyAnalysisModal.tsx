// Weekly Analysis Modal
// Full-screen modal showing AI-generated weekly training report

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { X, TrendingUp, TrendingDown, Minus, Star, AlertTriangle, Zap } from 'lucide-react-native';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import OverloadScoreBar from './OverloadScoreBar';
import MuscleVolumeChart from './MuscleVolumeChart';
import { useSettings } from '../../contexts/SettingsContext';
import { DarkColors, SandLightColors, Fonts } from '../../constants/Theme';
import { AIWeeklyAnalysis, OverloadStatus } from '../../types/training';
import { lightImpact } from '../../utils/haptics';

interface WeeklyAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  analysis: AIWeeklyAnalysis | null;
  isLoading?: boolean;
}

const STATUS_ICONS: Record<OverloadStatus, any> = {
  progressing: TrendingUp,
  maintaining: Minus,
  stalling: AlertTriangle,
  regressing: TrendingDown,
  deload_recommended: AlertTriangle,
  new_exercise: Zap,
  pr_set: Star,
};

export default function WeeklyAnalysisModal({
  visible,
  onClose,
  analysis,
  isLoading,
}: WeeklyAnalysisModalProps) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : SandLightColors;

  const getStatusColor = (status: OverloadStatus) => {
    switch (status) {
      case 'progressing': return colors.success;
      case 'pr_set': return colors.accentGold;
      case 'maintaining': return colors.warning;
      case 'stalling': return colors.warningOrange;
      case 'regressing': return colors.error;
      case 'new_exercise': return colors.accentCyan;
      default: return colors.textMuted;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Weekly Analysis</Text>
          <TouchableOpacity
            onPress={() => { lightImpact(); onClose(); }}
            style={[styles.closeBtn, { backgroundColor: isDark ? '#1a1a1a' : '#E5DDD2' }]}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Analyzing your training data...
              </Text>
            </View>
          ) : analysis ? (
            <>
              {/* Score Section */}
              <GlassCard style={styles.section}>
                <OverloadScoreBar score={analysis.overallScore} label="Overload Score" />
                <Text style={[styles.headline, { color: colors.text }]}>
                  {analysis.headline}
                </Text>
              </GlassCard>

              {/* Exercise Breakdowns */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercise Analysis</Text>
              {analysis.exerciseAnalyses.map((ex, i) => {
                const Icon = STATUS_ICONS[ex.status] || Minus;
                const statusColor = getStatusColor(ex.status);
                return (
                  <GlassCard key={i} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Icon size={16} color={statusColor} />
                      <Text style={[styles.exerciseCardName, { color: colors.text }]}>
                        {ex.exerciseName}
                      </Text>
                    </View>
                    <View style={styles.exerciseStats}>
                      <View style={styles.statPill}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Vol</Text>
                        <NumberText
                          style={[
                            styles.statValue,
                            { color: ex.volumeChange >= 0 ? colors.success : colors.error },
                          ]}
                        >
                          {ex.volumeChange >= 0 ? '+' : ''}{ex.volumeChange}%
                        </NumberText>
                      </View>
                      <View style={styles.statPill}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Str</Text>
                        <NumberText
                          style={[
                            styles.statValue,
                            { color: ex.strengthChange >= 0 ? colors.success : colors.error },
                          ]}
                        >
                          {ex.strengthChange >= 0 ? '+' : ''}{ex.strengthChange}%
                        </NumberText>
                      </View>
                    </View>
                    <Text style={[styles.recommendation, { color: colors.textSecondary }]}>
                      {ex.recommendation}
                    </Text>
                  </GlassCard>
                );
              })}

              {/* Muscle Volume Audit */}
              {analysis.muscleVolumeAudit.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Muscle Volume Audit
                  </Text>
                  <GlassCard style={styles.section}>
                    <MuscleVolumeChart
                      data={analysis.muscleVolumeAudit.map(m => ({
                        muscleGroup: m.muscleGroup,
                        weeklySets: m.weeklySets,
                        mev: m.mev,
                        mrv: m.mrv,
                      }))}
                    />
                  </GlassCard>
                </>
              )}

              {/* Recovery & Nutrition */}
              <GlassCard style={styles.section}>
                <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Recovery</Text>
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                  {analysis.recoveryAssessment}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.text, marginTop: 12 }]}>
                  Nutrition
                </Text>
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                  {analysis.nutritionNote}
                </Text>
              </GlassCard>

              {/* Achievements */}
              {analysis.achievements.length > 0 && (
                <GlassCard style={styles.section}>
                  <Text style={[styles.sectionSubtitle, { color: colors.accentGold }]}>
                    Achievements
                  </Text>
                  {analysis.achievements.map((a, i) => (
                    <View key={i} style={styles.achievementRow}>
                      <Star size={14} color={colors.accentGold} />
                      <Text style={[styles.achievementText, { color: colors.text }]}>{a}</Text>
                    </View>
                  ))}
                </GlassCard>
              )}

              <View style={{ height: 40 }} />
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                No analysis available. Log workouts to generate your weekly report.
              </Text>
            </View>
          )}
        </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    marginBottom: 6,
  },
  headline: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    marginTop: 12,
    lineHeight: 21,
  },
  exerciseCard: {
    padding: 14,
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  exerciseCardName: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  statValue: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
  },
  recommendation: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 17,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 19,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  achievementText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
});
