import React, { useMemo, useState } from 'react';
import { Dumbbell, Hand, Flame, Heart, Activity, CheckCircle2, Calendar, Repeat, ChevronRight } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { useSettings } from '../../contexts/SettingsContext';
import { useTraining } from '../../contexts/TrainingContext';
import { TrainingProgram, ProgramTemplate } from '../../types/training';
import { ProgramPreviewModal } from '../training/ProgramPreviewModal';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { WizardHeader } from './WizardHeader';

interface ProgramSelectionStepProps {
  onContinue: (programId: string, programName: string) => void;
  onBack: () => void;
}

export function ProgramSelectionStep({ onContinue, onBack }: ProgramSelectionStepProps) {
  const { settings } = useSettings();
  const { getEnhancedPrograms } = useTraining();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewProgram, setPreviewProgram] = useState<ProgramTemplate | null>(null);

  // Get all available programs
  const programs = useMemo(() => getEnhancedPrograms(), [getEnhancedPrograms]);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware colors
  const secondaryBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const greenColor = Colors.success;
  const greenBgLight = isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(16, 185, 129, 0.10)';
  const greenBgMedium = isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(16, 185, 129, 0.15)';
  const greenBorder = isDark ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.30)';

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return Colors.success;
      case 'intermediate':
        return isDark ? Colors.warning : Colors.warningOrange;
      case 'advanced':
        return Colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getProgramIcon = (id: string) => {
    if (id.includes('fat-loss') || id.includes('hiit')) return Flame;
    if (id.includes('muscle') || id.includes('strength')) return Dumbbell;
    if (id.includes('health') || id.includes('wellness')) return Heart;
    return Activity;
  };

  const handleShowPreview = (program: TrainingProgram | ProgramTemplate) => {
    mediumImpact();
    setPreviewProgram(program as ProgramTemplate);
    setShowPreviewModal(true);
  };

  const handleClosePreview = () => {
    lightImpact();
    setShowPreviewModal(false);
  };

  const handleConfirmProgram = () => {
    if (previewProgram) {
      mediumImpact();
      setSelectedProgramId(previewProgram.id);
      setShowPreviewModal(false);
      // Automatically continue to next step after selection
      onContinue(previewProgram.id, previewProgram.name);
    }
  };

  const handleContinue = () => {
    mediumImpact();

    // If a program was selected, pass it to the next step
    if (selectedProgramId) {
      const selectedProgram = programs.find(p => p.id === selectedProgramId);
      if (selectedProgram) {
        onContinue(selectedProgram.id, selectedProgram.name);
        return;
      }
    }

    // Continue anyway - program selection is optional (can be done in modal)
    onContinue('', '');
  };

  return (
    <>
      <View style={styles.container}>
        {/* Header with Title and Icon */}
        <WizardHeader
          currentStep={5}
          totalSteps={6}
          title="Training Program"
          icon={<Dumbbell size={36} color={isDark ? '#FFFFFF' : '#000000'} />}
          onBack={onBack}
          isDark={isDark}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Spacer for header */}
          <View style={{ height: Platform.OS === 'ios' ? 200 : 170 }} />

          <View style={styles.subtitle}>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              Select a program that aligns with your goals and fitness level. Your AI workout plan will be generated based on this selection.
            </Text>
          </View>

        {/* Program Cards */}
        <View style={styles.programsContainer}>
          {programs.map((program) => {
            const isSelected = selectedProgramId === program.id;

            return (
              <TouchableOpacity
                key={program.id}
                onPress={() => handleShowPreview(program)}
                activeOpacity={0.9}
                accessibilityLabel={`${program.name}, ${program.difficulty} level program`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint="Tap to view program details and select in modal"
              >
                <GlassCard
                  style={[
                    styles.programCard,
                    isSelected && {
                      backgroundColor: greenBgLight,
                      borderColor: greenBorder,
                      borderWidth: 1.5,
                    },
                  ]}
                  interactive
                >
                  {/* Header */}
                  <View style={styles.programHeader}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: isSelected ? greenBgMedium : secondaryBg },
                      ]}
                    >
                      {React.createElement(getProgramIcon(program.id), {
                        size: 24,
                        color: isSelected ? greenColor : colors.text,
                      })}
                    </View>
                    <View style={styles.headerText}>
                      <Text
                        style={[
                          styles.programName,
                          { color: isSelected ? greenColor : colors.text },
                        ]}
                      >
                        {program.name}
                      </Text>
                      <View
                        style={[
                          styles.difficultyBadge,
                          { backgroundColor: `${getDifficultyColor(program.difficulty)}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyText,
                            { color: getDifficultyColor(program.difficulty) },
                          ]}
                        >
                          {program.difficulty}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: greenBgMedium }]}>
                        <CheckCircle2 size={22} color={greenColor} />
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  <Text
                    style={[
                      styles.description,
                      { color: isSelected ? colors.text : colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {program.description}
                  </Text>

                  {/* Stats Row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Calendar
                        size={15}
                        color={isSelected ? greenColor : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.statText,
                          { color: isSelected ? greenColor : colors.textMuted },
                        ]}
                      >
                        <NumberText weight="regular">{program.duration}</NumberText> weeks
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Repeat
                        size={15}
                        color={isSelected ? greenColor : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.statText,
                          { color: isSelected ? greenColor : colors.textMuted },
                        ]}
                      >
                        <NumberText weight="regular">{program.daysPerWeek}</NumberText> days/week
                      </Text>
                    </View>
                  </View>

                  {/* Focus Tags */}
                  <View style={styles.tagsRow}>
                    {program.focus.slice(0, 3).map((tag, i) => (
                      <View
                        key={i}
                        style={[
                          styles.tag,
                          {
                            backgroundColor: isSelected ? greenBgLight : secondaryBg,
                            borderWidth: isSelected ? 1 : 0,
                            borderColor: isSelected ? greenBorder : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            { color: isSelected ? greenColor : colors.textSecondary },
                          ]}
                        >
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* View Details hint */}
                  <View style={styles.viewDetailsRow}>
                    <Text style={[styles.viewDetailsText, { color: colors.textMuted }]}>
                      Tap to preview full program details
                    </Text>
                    <ChevronRight size={14} color={colors.textMuted} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Spacing - extra space to prevent blending with buttons */}
        <View style={{ height: 180 }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                onBack();
              }}
              activeOpacity={0.7}
              accessibilityLabel="Back"
              accessibilityRole="button"
              accessibilityHint="Returns to previous step"
            >
              <GlassCard style={styles.backButton} interactive>
                <View style={{ transform: [{ rotate: '-90deg' }, { scaleX: -1 }] }}>
                  <Hand size={24} color={colors.text} />
                </View>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.7}
              accessibilityLabel="Continue"
              accessibilityRole="button"
              accessibilityHint="Proceeds to next step (program selection optional)"
            >
              <GlassCard style={styles.continueButton} interactive>
                <View style={{ transform: [{ rotate: '90deg' }] }}>
                  <Hand size={24} color={colors.primary} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Program Preview Modal */}
      <ProgramPreviewModal
        visible={showPreviewModal}
        program={previewProgram}
        onClose={handleClosePreview}
        onConfirm={handleConfirmProgram}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  subtitle: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
    lineHeight: 19,
    textAlign: 'center',
  },
  programsContainer: {
    gap: 12,
  },
  programCard: {
    marginBottom: 12,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: Colors.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  programName: {
    fontSize: 19,
    fontFamily: Fonts.numericSemiBold,
    marginBottom: 4,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontFamily: Fonts.numericSemiBold,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
    lineHeight: 19,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontFamily: Fonts.numericSemiBold,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 11,
    fontFamily: Fonts.numericSemiBold,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
  },
  continueButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
  },
});
