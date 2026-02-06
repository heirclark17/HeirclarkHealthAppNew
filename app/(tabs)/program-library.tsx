import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';
import { useSettings } from '../../contexts/SettingsContext';
import { useTraining } from '../../contexts/TrainingContext';
import { ProgramCard, ProgramPreviewModal } from '../../components/training';
import { lightImpact, mediumImpact } from '../../utils/haptics';

export default function ProgramLibraryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showProgramPreview, setShowProgramPreview] = useState(false);
  const [previewProgram, setPreviewProgram] = useState<any>(null);
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Training context
  const {
    state: trainingState,
    selectProgramAndGenerate,
    getEnhancedPrograms,
    loadCachedPlan,
  } = useTraining();

  const { selectedProgram, isGenerating, weeklyPlan } = trainingState;

  // Get all available programs
  const allPrograms = getEnhancedPrograms();

  // Handle program tap - shows preview modal
  const handleProgramTap = useCallback((program: any) => {
    console.log('[ProgramLibrary] User tapped program:', program.name);
    lightImpact();
    setPreviewProgram(program);
    setShowProgramPreview(true);
  }, []);

  // Handle confirming program selection - generates the plan
  const handleConfirmProgram = useCallback(async () => {
    if (!previewProgram) return;

    console.log('[ProgramLibrary] User confirmed program:', previewProgram.name);
    mediumImpact();
    setShowProgramPreview(false);

    // Generate a new training plan using the selected program
    const success = await selectProgramAndGenerate(previewProgram);
    console.log('[ProgramLibrary] Plan generated with selected program:', success);

    if (!success) {
      console.error('[ProgramLibrary] Failed to generate plan with selected program');
    }

    setPreviewProgram(null);
  }, [previewProgram, selectProgramAndGenerate]);

  // Handle closing preview modal
  const handleClosePreview = useCallback(() => {
    setShowProgramPreview(false);
  }, []);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCachedPlan();
    setRefreshing(false);
  }, [loadCachedPlan]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Programs</Text>
        </View>

        {/* Current Program Section */}
        {selectedProgram && weeklyPlan && (
          <View style={styles.currentSection}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CURRENT PROGRAM</Text>
            <GlassCard style={styles.currentProgramCard} interactive>
              <View style={styles.currentProgramContent}>
                <View style={[styles.programIconContainer, { backgroundColor: isDark ? 'rgba(76, 217, 100, 0.2)' : 'rgba(76, 217, 100, 0.15)' }]}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.protein} />
                </View>
                <View style={styles.currentProgramInfo}>
                  <Text style={[styles.currentProgramName, { color: colors.text }]}>
                    {selectedProgram.name}
                  </Text>
                  <Text style={[styles.currentProgramDesc, { color: colors.textMuted }]}>
                    {selectedProgram.duration} • {selectedProgram.difficulty}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Program Library */}
        <View style={styles.librarySection}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {selectedProgram ? 'SWITCH PROGRAM' : 'CHOOSE A PROGRAM'}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Tap a program to preview details and start training
          </Text>

          <View style={styles.programsGrid}>
            {allPrograms.map((program, index) => (
              <ProgramCard
                key={program.id}
                program={program}
                isSelected={previewProgram ? previewProgram.id === program.id : selectedProgram?.id === program.id}
                onSelect={() => handleProgramTap(program)}
                index={index}
              />
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <GlassCard style={styles.infoCard} interactive>
            <View style={styles.infoContent}>
              <View style={[styles.infoIconContainer, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)' }]}>
                <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Personalized Programs</Text>
                <Text style={[styles.infoDesc, { color: colors.textMuted }]}>
                  Each program adapts to your goals and fitness level. You can switch programs anytime.
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Program Preview Modal */}
      <ProgramPreviewModal
        visible={showProgramPreview}
        program={previewProgram}
        onClose={handleClosePreview}
        onConfirm={handleConfirmProgram}
        isGenerating={isGenerating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    color: Colors.text,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  currentSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 16,
  },
  currentProgramCard: {
    padding: 16,
  },
  currentProgramContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  currentProgramInfo: {
    flex: 1,
  },
  currentProgramName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  currentProgramDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  librarySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  programsGrid: {
    // ProgramCard has marginBottom: 12 built in
  },
  infoSection: {
    paddingHorizontal: 16,
  },
  infoCard: {
    padding: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
