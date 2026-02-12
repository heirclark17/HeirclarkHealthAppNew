import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
// Animations removed
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { NumberText } from '../NumberText';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { ProgramTemplate, TrainingProgram } from '../../types/training';
import { mediumImpact, lightImpact } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgramPreviewModalProps {
  visible: boolean;
  program: ProgramTemplate | TrainingProgram | null;
  onClose: () => void;
  onConfirm: () => void;
  isGenerating?: boolean;
}

export function ProgramPreviewModal({
  visible,
  program,
  onClose,
  onConfirm,
  isGenerating = false,
}: ProgramPreviewModalProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const accentBg = isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.12)';
  const greenColor = Colors.success;

  if (!program) return null;

  const getProgramIcon = (id: string) => {
    if (id.includes('fat-loss') || id.includes('hiit')) return 'flame-outline';
    if (id.includes('muscle') || id.includes('strength')) return 'barbell-outline';
    if (id.includes('health') || id.includes('wellness')) return 'heart-outline';
    return 'fitness-outline';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return greenColor;
      case 'intermediate':
        return colors.protein || Colors.warningOrange;
      case 'advanced':
        return colors.calories || Colors.error;
      default:
        return colors.textMuted;
    }
  };

  // Check if program has enhanced template data
  const isEnhanced = 'weeklyStructure' in program || 'philosophy' in program;
  const enhancedProgram = program as ProgramTemplate;

  const handleConfirm = () => {
    mediumImpact();
    onConfirm();
  };

  const handleClose = () => {
    lightImpact();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView
          intensity={isDark ? 25 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Header with Close Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButtonWrapper}>
            <GlassCard style={styles.closeButton} interactive>
              <Ionicons name="close" size={22} color={colors.text} />
            </GlassCard>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Program Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Program Header Card */}
          <View>
            <GlassCard style={styles.programHeader} interactive>
              <View style={styles.programHeaderRow}>
                <View style={[styles.iconContainer, { backgroundColor: accentBg }]}>
                  <Ionicons
                    name={getProgramIcon(program.id) as any}
                    size={32}
                    color={greenColor}
                  />
                </View>
                <View style={styles.programHeaderText}>
                  <Text style={[styles.programName, { color: colors.text }]}>{program.name}</Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: `${getDifficultyColor(program.difficulty)}20` },
                      ]}
                    >
                      <Text
                        style={[styles.difficultyText, { color: getDifficultyColor(program.difficulty) }]}
                      >
                        {program.difficulty}
                      </Text>
                    </View>
                    {isEnhanced && enhancedProgram.shortName && (
                      <View style={[styles.shortNameBadge, { backgroundColor: cardBg }]}>
                        <Text style={[styles.shortNameText, { color: colors.textMuted }]}>
                          {enhancedProgram.shortName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Description */}
          <View>
            <GlassCard style={styles.section} interactive>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About This Program</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {program.description}
              </Text>
              {isEnhanced && enhancedProgram.philosophy && (
                <View style={[styles.philosophyBox, { backgroundColor: cardBg }]}>
                  <Ionicons name="bulb-outline" size={16} color={colors.protein} />
                  <Text style={[styles.philosophyText, { color: colors.textSecondary }]}>
                    {enhancedProgram.philosophy}
                  </Text>
                </View>
              )}
            </GlassCard>
          </View>

          {/* Program Stats */}
          <View>
            <GlassCard style={styles.section} interactive>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Program Overview</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: cardBg }]}>
                  <Ionicons name="calendar-outline" size={20} color={greenColor} />
                  <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>{program.duration}</NumberText>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Weeks</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg }]}>
                  <Ionicons name="repeat-outline" size={20} color={greenColor} />
                  <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>{program.daysPerWeek}</NumberText>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Days/Week</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg }]}>
                  <Ionicons name="time-outline" size={20} color={greenColor} />
                  <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>45-60</NumberText>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Min/Session</Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Weekly Structure Preview */}
          <View>
            <GlassCard style={styles.section} interactive>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Structure</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Here's what your typical week will look like
              </Text>

              {isEnhanced && enhancedProgram.weeklyStructure ? (
                <View style={styles.weeklyGrid}>
                  {enhancedProgram.weeklyStructure.map((day, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dayPreview,
                        { backgroundColor: cardBg },
                        day.workoutType === 'rest' && { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                      ]}
                    >
                      <Text style={[styles.dayLabel, { color: colors.textMuted }]}>
                        Day {day.day}
                      </Text>
                      <Text
                        style={[
                          styles.dayName,
                          { color: colors.text },
                          day.workoutType === 'rest' && { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {day.name}
                      </Text>
                      {day.workoutType !== 'rest' && (
                        <View style={styles.muscleTagsRow}>
                          {day.muscleGroups.slice(0, 2).map((muscle, i) => (
                            <View
                              key={i}
                              style={[styles.muscleTag, { backgroundColor: accentBg }]}
                            >
                              <Text style={[styles.muscleTagText, { color: greenColor }]}>
                                {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {day.workoutType === 'rest' && (
                        <Ionicons name="bed-outline" size={16} color={colors.textMuted} style={{ marginTop: 4 }} />
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                // Fallback for basic TrainingProgram
                <View style={styles.weeklyGrid}>
                  {Array.from({ length: 7 }, (_, index) => {
                    const isWorkoutDay = index < program.daysPerWeek;
                    const dayNames = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Rest'];
                    return (
                      <View
                        key={index}
                        style={[
                          styles.dayPreview,
                          { backgroundColor: cardBg },
                          !isWorkoutDay && { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                        ]}
                      >
                        <Text style={[styles.dayLabel, { color: colors.textMuted }]}>
                          Day {index + 1}
                        </Text>
                        <Text
                          style={[
                            styles.dayName,
                            { color: isWorkoutDay ? colors.text : colors.textMuted },
                          ]}
                        >
                          {isWorkoutDay ? dayNames[index % program.daysPerWeek] : 'Rest'}
                        </Text>
                        {!isWorkoutDay && (
                          <Ionicons name="bed-outline" size={16} color={colors.textMuted} style={{ marginTop: 4 }} />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </GlassCard>
          </View>

          {/* Focus Areas */}
          <View>
            <GlassCard style={styles.section} interactive>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Focus Areas</Text>
              <View style={styles.tagsContainer}>
                {program.focus.map((tag, index) => (
                  <View key={index} style={[styles.focusTag, { backgroundColor: cardBg }]}>
                    <Text style={[styles.focusTagText, { color: colors.textSecondary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>

          {/* Cardio Integration */}
          {isEnhanced && enhancedProgram.cardioIntegration && (
            <View>
              <GlassCard style={styles.section} interactive>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Cardio Integration</Text>
                <View style={[styles.cardioBox, { backgroundColor: cardBg }]}>
                  <View style={styles.cardioRow}>
                    <Ionicons name="heart-outline" size={18} color={colors.calories} />
                    <Text style={[styles.cardioLabel, { color: colors.textSecondary }]}>
                      {enhancedProgram.cardioIntegration.type.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={[styles.cardioDetail, { color: colors.textMuted }]}>
                    {enhancedProgram.cardioIntegration.frequency} • {enhancedProgram.cardioIntegration.duration}
                  </Text>
                </View>
              </GlassCard>
            </View>
          )}

          {/* Spacer for button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Confirm Button - Fixed at bottom */}
        <View style={[styles.bottomContainer, { backgroundColor: 'transparent' }]}>
          <BlurView
            intensity={isDark ? 50 : 70}
            tint={isDark ? 'dark' : 'light'}
            style={styles.bottomBlur}
          />
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={isGenerating}
            activeOpacity={0.8}
            style={styles.confirmButtonWrapper}
          >
            <GlassCard
              style={[styles.confirmButton, { backgroundColor: accentBg }]}
              interactive
            >
              {isGenerating ? (
                <Text style={[styles.confirmButtonText, { color: greenColor }]}>
                  Generating Plan...
                </Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={greenColor} />
                  <Text style={[styles.confirmButtonText, { color: greenColor }]}>
                    Select This Program
                  </Text>
                </>
              )}
            </GlassCard>
          </TouchableOpacity>
        </View>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButtonWrapper: {
    width: 40,
    height: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  programHeader: {
    marginBottom: 16,
  },
  programHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programHeaderText: {
    flex: 1,
    marginLeft: 16,
  },
  programName: {
    fontSize: 22,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    textTransform: 'capitalize',
  },
  shortNameBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shortNameText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    marginBottom: 12,
  },
  philosophyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  philosophyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weeklyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPreview: {
    width: (SCREEN_WIDTH - 32 - 16 - 24) / 4,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dayName: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  muscleTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    justifyContent: 'center',
  },
  muscleTag: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  muscleTagText: {
    fontSize: 8,
    fontFamily: Fonts.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  focusTagText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  cardioBox: {
    padding: 14,
    borderRadius: 12,
  },
  cardioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardioLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    textTransform: 'capitalize',
  },
  cardioDetail: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginLeft: 26,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
  },
  bottomBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  confirmButtonWrapper: {
    zIndex: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    borderRadius: Spacing.borderRadius,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});

export default ProgramPreviewModal;
