import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard, CardioPreference } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ActivityLevel } from '../../constants/goals';
import { lightImpact, selectionFeedback } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';

// Section wrapper using GlassCard
function GlassSection({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <GlassCard style={[styles.glassSection, style]} interactive>
      {children}
    </GlassCard>
  );
}

interface CardioOption {
  id: CardioPreference;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  details: string;
  calorieInfo: string;
  frequency: string;
}

const CARDIO_OPTIONS: CardioOption[] = [
  {
    id: 'walking',
    title: 'Walking',
    description: 'Low intensity, sustainable cardio',
    icon: 'walk-outline',
    details: 'Best for beginners and active recovery',
    calorieInfo: '150-250 cal/30min',
    frequency: '5-7 days/week',
  },
  {
    id: 'running',
    title: 'Running',
    description: 'Moderate-high intensity cardio',
    icon: 'fitness-outline',
    details: 'Great for endurance and calorie burn',
    calorieInfo: '300-400 cal/30min',
    frequency: '3-5 days/week',
  },
  {
    id: 'hiit',
    title: 'HIIT Training',
    description: 'High intensity interval training',
    icon: 'flash-outline',
    details: 'Maximum efficiency with afterburn effect',
    calorieInfo: '250-320 cal/20min',
    frequency: '2-3 days/week max',
  },
];

interface ActivityOption {
  id: ActivityLevel;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  example: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
    icon: 'desktop-outline',
    example: 'Desk job, minimal walking',
  },
  {
    id: 'light',
    title: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    icon: 'walk-outline',
    example: 'Daily walks, light stretching',
  },
  {
    id: 'moderate',
    title: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    icon: 'bicycle-outline',
    example: 'Regular gym, active hobbies',
  },
  {
    id: 'very',
    title: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    icon: 'barbell-outline',
    example: 'Daily training, physical job',
  },
  {
    id: 'extra',
    title: 'Extremely Active',
    description: 'Very intense daily exercise',
    icon: 'fitness-outline',
    example: 'Athletes, manual labor + gym',
  },
];

const WORKOUT_DURATIONS = [15, 30, 45, 60] as const;

interface ActivityCardProps {
  option: ActivityOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  colors: typeof DarkColors;
  isDark: boolean;
}

function ActivityCard({ option, isSelected, onSelect, index, colors, isDark }: ActivityCardProps) {
  const scale = useSharedValue(1);

  // Selected tint color
  const selectedBg = isDark ? 'rgba(78, 205, 196, 0.15)' : 'rgba(78, 205, 196, 0.12)';

  const handlePress = async () => {
    await selectionFeedback();
    scale.value = withSpring(0.98, { damping: 15 });
    scale.value = withSpring(1, { damping: 10 });
    onSelect();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={animatedStyle}>
          <GlassCard style={[isSelected && { backgroundColor: selectedBg }]} interactive>
            <View style={styles.activityCard}>
              <View style={styles.activityLeft}>
                <View style={[styles.activityIcon, isSelected && styles.activityIconSelected]}>
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={isSelected ? Colors.success : colors.textMuted}
                  />
                </View>
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }, isSelected && styles.activityTitleSelected]}>
                  {option.title}
                </Text>
                <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>{option.description}</Text>
                <Text style={[styles.activityExample, { color: colors.textMuted }]}>{option.example}</Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ChipProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  colors: typeof DarkColors;
}

function Chip({ label, isSelected, onSelect, colors }: ChipProps) {
  const selectedBg = isSelected ? Colors.success : undefined;

  return (
    <TouchableOpacity
      onPress={async () => {
        await selectionFeedback();
        onSelect();
      }}
      activeOpacity={0.7}
    >
      <GlassCard style={[styles.chip, isSelected && { backgroundColor: selectedBg }]} interactive>
        <Text style={[styles.chipText, { color: colors.text }, isSelected && styles.chipTextSelected]}>
          {label}
        </Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

interface CardioCardProps {
  option: CardioOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  colors: typeof DarkColors;
  isDark: boolean;
}

function CardioCard({ option, isSelected, onSelect, index, colors, isDark }: CardioCardProps) {
  const scale = useSharedValue(1);

  // Selected tint color
  const selectedBg = isDark ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 107, 107, 0.12)';

  const handlePress = async () => {
    await selectionFeedback();
    scale.value = withSpring(0.98, { damping: 15 });
    scale.value = withSpring(1, { damping: 10 });
    onSelect();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={animatedStyle}>
          <GlassCard style={[isSelected && { backgroundColor: selectedBg }]} interactive>
            <View style={styles.cardioCard}>
              <View style={styles.cardioLeft}>
                <View style={[styles.cardioIcon, isSelected && styles.cardioIconSelected]}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={isSelected ? Colors.error : colors.textMuted}
                  />
                </View>
              </View>
              <View style={styles.cardioContent}>
                <Text style={[styles.cardioTitle, { color: colors.text }, isSelected && styles.cardioTitleSelected]}>
                  {option.title}
                </Text>
                <Text style={[styles.cardioDescription, { color: colors.textSecondary }]}>{option.description}</Text>
                <View style={styles.cardioMeta}>
                  <View style={styles.cardioMetaItem}>
                    <Ionicons name="flame-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.cardioMetaText, { color: colors.textMuted }]}>{option.calorieInfo}</Text>
                  </View>
                  <View style={styles.cardioMetaItem}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.cardioMetaText, { color: colors.textMuted }]}>{option.frequency}</Text>
                  </View>
                </View>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.error} />
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ActivityLifestyleStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ActivityLifestyleStep({ onNext, onBack }: ActivityLifestyleStepProps) {
  const {
    state,
    setActivityLevel,
    setWorkoutsPerWeek,
    setWorkoutDuration,
    setCardioPreference,
  } = useGoalWizard();
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Translucent primary color for active button
  const primaryGlassBg = isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)';

  const handleContinue = async () => {
    await lightImpact();
    onNext();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Activity Level</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tell us about your typical day and exercise habits for accurate calorie calculations.
        </Text>
      </View>

      {/* Activity Level Selection */}
      <View style={styles.activityList}>
        {ACTIVITY_OPTIONS.map((option, index) => (
          <ActivityCard
            key={option.id}
            option={option}
            isSelected={state.activityLevel === option.id}
            onSelect={() => setActivityLevel(option.id)}
            index={index}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>

      {/* Workouts Per Week */}
      <GlassSection>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>WORKOUTS PER WEEK</Text>
        <View style={styles.workoutChips}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isSelected = state.workoutsPerWeek === num;
            const selectedBg = isSelected ? Colors.success : undefined;
            return (
              <TouchableOpacity
                key={num}
                onPress={async () => {
                  await selectionFeedback();
                  setWorkoutsPerWeek(num);
                }}
              >
                <GlassCard
                  style={[
                    styles.workoutChip,
                    isSelected && { backgroundColor: selectedBg }
                  ]}
                  interactive
                >
                  <Text
                    style={[
                      styles.workoutChipText,
                      { color: colors.text },
                      isSelected && styles.workoutChipTextSelected,
                    ]}
                  >
                    {num}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Workout Duration */}
      <GlassSection>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TYPICAL WORKOUT DURATION</Text>
        <View style={styles.durationChips}>
          {WORKOUT_DURATIONS.map((duration) => (
            <Chip
              key={duration}
              label={`${duration} min`}
              isSelected={state.workoutDuration === duration}
              onSelect={() => setWorkoutDuration(duration)}
              colors={colors}
            />
          ))}
        </View>
      </GlassSection>

      {/* Cardio Preference */}
      <View style={styles.cardioSection}>
        <Text style={styles.cardioSectionTitle}>PREFERRED CARDIO TYPE</Text>
        <Text style={[styles.cardioSectionSubtitle, { color: colors.textSecondary }]}>
          Choose your preferred style of cardiovascular exercise
        </Text>
        <View style={styles.cardioList}>
          {CARDIO_OPTIONS.map((option, index) => (
            <CardioCard
              key={option.id}
              option={option}
              isSelected={state.cardioPreference === option.id}
              onSelect={() => setCardioPreference(option.id)}
              index={index}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      </View>

      {/* Summary Card */}
      <GlassCard style={styles.summaryCard} interactive>
        <View style={styles.summaryCardInner}>
          <Ionicons name="bulb-outline" size={28} color={Colors.warning} />
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            Based on your activity level, we'll calculate your Total Daily Energy Expenditure (TDEE)
            to determine the right calorie target for your goal.
          </Text>
        </View>
      </GlassCard>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={onBack} style={{ flex: 1 }}>
          <GlassCard style={styles.backButton} interactive>
            <Text style={[styles.backButtonText, { color: colors.text }]}>BACK</Text>
          </GlassCard>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleContinue} style={{ flex: 2 }}>
          <GlassCard style={[styles.continueButton, { backgroundColor: primaryGlassBg }]} interactive>
            <Text style={[styles.continueButtonText, { color: colors.primary }]}>CONTINUE</Text>
          </GlassCard>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  glassSection: {
    marginBottom: 24,
    padding: 16,
  },
  activityList: {
    gap: 10,
    marginBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0, // GlassCard provides padding
  },
  activityLeft: {
    marginRight: 14,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 2,
  },
  activityTitleSelected: {
    color: Colors.success,
  },
  activityDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  activityExample: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  workoutChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  workoutChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0, // Critical: override GlassCard's default padding
  },
  workoutChipText: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 18, // Match fontSize for precise centering
  },
  workoutChipTextSelected: {
    color: Colors.background,
  },
  durationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.background,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 0, // GlassCard provides padding
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
  },
  // Cardio preference styles
  cardioSection: {
    marginBottom: 24,
  },
  cardioSectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.error,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardioSectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  cardioList: {
    gap: 12,
  },
  cardioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0, // GlassCard provides padding
  },
  cardioLeft: {
    marginRight: 14,
  },
  cardioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardioIconSelected: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  cardioContent: {
    flex: 1,
  },
  cardioTitle: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 2,
  },
  cardioTitleSelected: {
    color: Colors.error,
  },
  cardioDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  cardioMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  cardioMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardioMetaText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
});
