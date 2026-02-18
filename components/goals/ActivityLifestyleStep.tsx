import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Monitor,
  PersonStanding,
  Bike,
  Dumbbell,
  Activity,
  Zap,
  CheckCircle2,
  Flame,
  Calendar,
  Info,
  Lightbulb,
  User,
  Circle,
  Minus,
  Network,
  Building2,
  Weight,
  TrendingUp
} from 'lucide-react-native';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard, CardioPreference, FitnessLevel, StrengthLevel } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ActivityLevel } from '../../constants/goals';
import { lightImpact, selectionFeedback } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { WizardHeader } from './WizardHeader';

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
  icon: React.ComponentType<any>;
  details: string;
  calorieInfo: string;
  frequency: string;
}

const CARDIO_OPTIONS: CardioOption[] = [
  {
    id: 'walking',
    title: 'Walking',
    description: 'Low intensity, sustainable cardio',
    icon: PersonStanding,
    details: 'Best for beginners and active recovery',
    calorieInfo: '150-250 cal/30min',
    frequency: '5-7 days/week',
  },
  {
    id: 'running',
    title: 'Running',
    description: 'Moderate-high intensity cardio',
    icon: Activity,
    details: 'Great for endurance and calorie burn',
    calorieInfo: '300-400 cal/30min',
    frequency: '3-5 days/week',
  },
  {
    id: 'hiit',
    title: 'HIIT Training',
    description: 'High intensity interval training',
    icon: Zap,
    details: 'Maximum efficiency with afterburn effect',
    calorieInfo: '250-320 cal/20min',
    frequency: '2-3 days/week max',
  },
];

interface ActivityOption {
  id: ActivityLevel;
  title: string;
  description: string;
  descriptionParts?: { text: string; isNumber: boolean }[];
  icon: React.ComponentType<any>;
  example: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
    icon: Monitor,
    example: 'Desk job, minimal walking',
  },
  {
    id: 'light',
    title: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    descriptionParts: [
      { text: 'Light exercise ', isNumber: false },
      { text: '1-3', isNumber: true },
      { text: ' days/week', isNumber: false },
    ],
    icon: PersonStanding,
    example: 'Daily walks, light stretching',
  },
  {
    id: 'moderate',
    title: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    descriptionParts: [
      { text: 'Moderate exercise ', isNumber: false },
      { text: '3-5', isNumber: true },
      { text: ' days/week', isNumber: false },
    ],
    icon: Bike,
    example: 'Regular gym, active hobbies',
  },
  {
    id: 'very',
    title: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    descriptionParts: [
      { text: 'Hard exercise ', isNumber: false },
      { text: '6-7', isNumber: true },
      { text: ' days/week', isNumber: false },
    ],
    icon: Dumbbell,
    example: 'Daily training, physical job',
  },
  {
    id: 'extra',
    title: 'Extremely Active',
    description: 'Very intense daily exercise',
    icon: Activity,
    example: 'Athletes, manual labor + gym',
  },
];

const WORKOUT_DURATIONS = [15, 30, 45, 60] as const;

// Equipment options for workout generation
interface EquipmentOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { id: 'bodyweight', label: 'Bodyweight', icon: User },
  { id: 'dumbbells', label: 'Dumbbells', icon: Dumbbell },
  { id: 'barbell', label: 'Barbell', icon: Activity },
  { id: 'kettlebell', label: 'Kettlebell', icon: Circle },
  { id: 'resistance_bands', label: 'Bands', icon: Circle },
  { id: 'pull_up_bar', label: 'Pull-up Bar', icon: Minus },
  { id: 'cable_machine', label: 'Cable Machine', icon: Network },
  { id: 'treadmill', label: 'Treadmill', icon: PersonStanding },
  { id: 'stationary_bike', label: 'Bike', icon: Bike },
  { id: 'full_gym', label: 'Full Gym', icon: Building2 },
];

// Common injury/limitation options
interface InjuryOption {
  id: string;
  label: string;
  description: string;
}

const INJURY_OPTIONS: InjuryOption[] = [
  { id: 'lower_back', label: 'Lower Back', description: 'Avoid heavy spinal loading' },
  { id: 'knee', label: 'Knee', description: 'Modify jumping and deep squats' },
  { id: 'shoulder', label: 'Shoulder', description: 'Limit overhead movements' },
  { id: 'neck', label: 'Neck', description: 'Avoid cervical strain exercises' },
  { id: 'hip', label: 'Hip', description: 'Modify hip-hinge movements' },
  { id: 'wrist', label: 'Wrist', description: 'Limit push-up variations' },
  { id: 'ankle', label: 'Ankle', description: 'Modify impact exercises' },
  { id: 'elbow', label: 'Elbow', description: 'Limit pressing movements' },
];

interface ActivityCardProps {
  option: ActivityOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  colors: typeof DarkColors;
  isDark: boolean;
}

function ActivityCard({ option, isSelected, onSelect, index, colors, isDark }: ActivityCardProps) {
  // Selected tint color
  const selectedBg = isDark ? 'rgba(78, 205, 196, 0.15)' : 'rgba(78, 205, 196, 0.12)';

  const handlePress = async () => {
    await selectionFeedback();
    onSelect();
  };

  const IconComponent = option.icon;

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel={`${option.title}: ${option.description}, ${option.example}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityHint={`Select ${option.title} activity level`}
      >
        <View>
          <GlassCard style={[isSelected && { backgroundColor: selectedBg }]} interactive>
            <View style={styles.activityCard}>
              <View style={styles.activityLeft}>
                <View style={[styles.activityIcon, isSelected && styles.activityIconSelected]}>
                  <IconComponent
                    size={22}
                    color={isSelected ? Colors.success : colors.textMuted}
                  />
                </View>
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }, isSelected && styles.activityTitleSelected]}>
                  {option.title}
                </Text>
                <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                  {option.descriptionParts ? (
                    option.descriptionParts.map((part, index) =>
                      part.isNumber ? (
                        <NumberText
                          key={index}
                          weight="light"
                          style={[styles.activityDescription, { color: colors.textSecondary }]}
                        >
                          {part.text}
                        </NumberText>
                      ) : (
                        <Text key={index}>{part.text}</Text>
                      )
                    )
                  ) : (
                    option.description
                  )}
                </Text>
                <Text style={[styles.activityExample, { color: colors.textMuted }]}>{option.example}</Text>
              </View>
              {isSelected && (
                <CheckCircle2 size={24} color={Colors.success} />
              )}
            </View>
          </GlassCard>
        </View>
      </TouchableOpacity>
    </View>
  );
}

interface ChipProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  colors: typeof DarkColors;
  isDark?: boolean;
}

function Chip({ label, isSelected, onSelect, colors, isDark }: ChipProps) {
  const selectedBg = isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)';

  return (
    <TouchableOpacity
      onPress={async () => {
        await selectionFeedback();
        onSelect();
      }}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <GlassCard style={[styles.chip, isSelected && { backgroundColor: selectedBg }]} interactive>
        <Text style={[styles.chipText, { color: colors.text }]}>
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
  // Selected tint color
  const selectedBg = isDark ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 107, 107, 0.12)';

  const handlePress = async () => {
    await selectionFeedback();
    onSelect();
  };

  const IconComponent = option.icon;

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel={`${option.title}: ${option.description}, ${option.calorieInfo}, ${option.frequency}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityHint={`Select ${option.title} as preferred cardio type`}
      >
        <View>
          <GlassCard style={[isSelected && { backgroundColor: selectedBg }]} interactive>
            <View style={styles.cardioCard}>
              <View style={styles.cardioLeft}>
                <View style={[styles.cardioIcon, isSelected && styles.cardioIconSelected]}>
                  <IconComponent
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
                    <Flame size={12} color={colors.textMuted} />
                    <NumberText weight="light" style={[styles.cardioMetaText, { color: colors.textMuted }]}>{option.calorieInfo}</NumberText>
                  </View>
                  <View style={styles.cardioMetaItem}>
                    <Calendar size={12} color={colors.textMuted} />
                    <NumberText weight="light" style={[styles.cardioMetaText, { color: colors.textMuted }]}>{option.frequency}</NumberText>
                  </View>
                </View>
              </View>
              {isSelected && (
                <CheckCircle2 size={24} color={Colors.error} />
              )}
            </View>
          </GlassCard>
        </View>
      </TouchableOpacity>
    </View>
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
    setFitnessLevel,
    setHasLiftingExperience,
    setStrengthLevel,
    setBenchPress1RM,
    setSquat1RM,
    setDeadlift1RM,
    toggleEquipment,
    toggleInjury,
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
    <View style={styles.container}>
      {/* Modern Liquid Glass Sticky Header */}
      <WizardHeader
        currentStep={3}
        totalSteps={6}
        title="Activity & Lifestyle"
        onBack={onBack}
        isDark={isDark}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Spacer for sticky header */}
        <View style={{ height: Platform.OS === 'ios' ? 220 : 170 }} />

        <View style={styles.subtitle}>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
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
        <Text style={styles.sectionTitle}>WORKOUTS PER WEEK</Text>
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
                accessibilityLabel={`${num} workouts per week`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint="Sets weekly workout frequency"
              >
                <GlassCard
                  style={[
                    styles.workoutChip,
                    isSelected && { backgroundColor: selectedBg }
                  ]}
                  interactive
                >
                  <NumberText
                    weight="light"
                    style={[
                      styles.workoutChipText,
                      { color: colors.text },
                      isSelected && styles.workoutChipTextSelected,
                    ]}
                  >
                    {num}
                  </NumberText>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Workout Duration */}
      <GlassSection>
        <Text style={styles.sectionTitle}>TYPICAL WORKOUT DURATION</Text>
        <View style={styles.durationChips}>
          {WORKOUT_DURATIONS.map((duration) => {
            const isSelected = state.workoutDuration === duration;
            const selectedBg = isSelected ? Colors.success : undefined;
            return (
              <TouchableOpacity
                key={duration}
                onPress={async () => {
                  await selectionFeedback();
                  setWorkoutDuration(duration);
                }}
                activeOpacity={0.7}
                accessibilityLabel={`${duration} minutes workout duration`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint="Sets typical workout session length"
              >
                <GlassCard style={[styles.chip, isSelected && { backgroundColor: selectedBg }, { borderWidth: 0 }]} borderColor="transparent" interactive>
                  <Text style={[styles.chipText, { color: colors.text }, isSelected && styles.chipTextSelected]}>
                    <NumberText weight="light" style={[{ fontSize: 14 }, { color: colors.text }, isSelected && styles.chipTextSelected]}>
                      {duration}
                    </NumberText>
                    {' min'}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
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

      {/* Fitness Level */}
      <GlassSection>
        <Text style={styles.sectionTitle}>FITNESS EXPERIENCE LEVEL</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Help us tailor workout intensity and complexity
        </Text>
        <View style={styles.durationChips}>
          {[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ].map((level) => (
            <Chip
              key={level.value}
              label={level.label}
              isSelected={state.fitnessLevel === level.value}
              onSelect={() => setFitnessLevel(level.value as 'beginner' | 'intermediate' | 'advanced')}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      </GlassSection>

      {/* Strength Training Baseline */}
      <GlassSection>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Weight size={16} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>STRENGTH TRAINING BASELINE</Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Help us personalize weight recommendations for strength workouts
        </Text>

        {/* Has Lifting Experience */}
        <Text style={[styles.strengthSubheading, { color: colors.textMuted }]}>
          Do you have weight lifting experience?
        </Text>
        <View style={styles.durationChips}>
          <Chip
            label="Never Lifted"
            isSelected={!state.hasLiftingExperience}
            onSelect={() => setHasLiftingExperience(false)}
            colors={colors}
            isDark={isDark}
          />
          <Chip
            label="Yes, I Lift"
            isSelected={state.hasLiftingExperience}
            onSelect={() => setHasLiftingExperience(true)}
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* Strength Level (only if has experience) */}
        {state.hasLiftingExperience && (
          <>
            <Text style={[styles.strengthSubheading, { color: colors.textMuted, marginTop: 16 }]}>
              What's your strength training level?
            </Text>
            <View style={styles.durationChips}>
              {[
                { value: 'beginner', label: 'Beginner', desc: '<1 year' },
                { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
                { value: 'advanced', label: 'Advanced', desc: '3+ years' },
              ].map((level) => (
                <TouchableOpacity
                  key={level.value}
                  onPress={async () => {
                    await selectionFeedback();
                    setStrengthLevel(level.value as StrengthLevel);
                  }}
                  accessibilityLabel={`${level.label}: ${level.desc}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: state.strengthLevel === level.value }}
                  accessibilityHint={`Select ${level.label} strength training level`}
                >
                  <GlassCard
                    style={[
                      styles.strengthLevelChip,
                      state.strengthLevel === level.value && { backgroundColor: primaryGlassBg }
                    ]}
                    interactive
                  >
                    <Text style={[styles.strengthLevelLabel, { color: colors.text }]}>
                      {level.label}
                    </Text>
                    <Text style={[styles.strengthLevelDesc, { color: colors.textMuted }]}>
                      {level.desc}
                    </Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>

            {/* 1RM Input (only if intermediate or advanced) */}
            {(state.strengthLevel === 'intermediate' || state.strengthLevel === 'advanced') && (
              <>
                <Text style={[styles.strengthSubheading, { color: colors.textMuted, marginTop: 16 }]}>
                  Optional: Enter your 1-rep max (1RM) for key lifts
                </Text>
                <Text style={[styles.strengthNote, { color: colors.textMuted }]}>
                  This helps us recommend appropriate starting weights. Leave blank if unsure.
                </Text>
                <View style={styles.oneRMContainer}>
                  {/* Bench Press 1RM */}
                  <View style={styles.oneRMInput}>
                    <Text style={[styles.oneRMLabel, { color: colors.text }]}>Bench Press</Text>
                    <View style={styles.oneRMInputRow}>
                      <GlassCard style={styles.oneRMField} interactive>
                        <TextInput
                          keyboardType="numeric"
                          placeholder="185"
                          placeholderTextColor={colors.textMuted}
                          value={state.benchPress1RM?.toString() || ''}
                          onChangeText={(text) => setBenchPress1RM(text ? Number(text) : null)}
                          style={{
                            fontSize: 16,
                            fontFamily: Fonts.numericRegular,
                            color: colors.text,
                            textAlign: 'center',
                          }}
                        />
                      </GlassCard>
                      <Text style={[styles.oneRMUnit, { color: colors.textMuted }]}>lbs</Text>
                    </View>
                  </View>

                  {/* Squat 1RM */}
                  <View style={styles.oneRMInput}>
                    <Text style={[styles.oneRMLabel, { color: colors.text }]}>Squat</Text>
                    <View style={styles.oneRMInputRow}>
                      <GlassCard style={styles.oneRMField} interactive>
                        <TextInput
                          keyboardType="numeric"
                          placeholder="225"
                          placeholderTextColor={colors.textMuted}
                          value={state.squat1RM?.toString() || ''}
                          onChangeText={(text) => setSquat1RM(text ? Number(text) : null)}
                          style={{
                            fontSize: 16,
                            fontFamily: Fonts.numericRegular,
                            color: colors.text,
                            textAlign: 'center',
                          }}
                        />
                      </GlassCard>
                      <Text style={[styles.oneRMUnit, { color: colors.textMuted }]}>lbs</Text>
                    </View>
                  </View>

                  {/* Deadlift 1RM */}
                  <View style={styles.oneRMInput}>
                    <Text style={[styles.oneRMLabel, { color: colors.text }]}>Deadlift</Text>
                    <View style={styles.oneRMInputRow}>
                      <GlassCard style={styles.oneRMField} interactive>
                        <TextInput
                          keyboardType="numeric"
                          placeholder="275"
                          placeholderTextColor={colors.textMuted}
                          value={state.deadlift1RM?.toString() || ''}
                          onChangeText={(text) => setDeadlift1RM(text ? Number(text) : null)}
                          style={{
                            fontSize: 16,
                            fontFamily: Fonts.numericRegular,
                            color: colors.text,
                            textAlign: 'center',
                          }}
                        />
                      </GlassCard>
                      <Text style={[styles.oneRMUnit, { color: colors.textMuted }]}>lbs</Text>
                    </View>
                  </View>
                </View>
                <GlassCard style={styles.oneRMNote} interactive>
                  <TrendingUp size={18} color={Colors.accentCyan} />
                  <Text style={[styles.oneRMNoteText, { color: colors.textSecondary }]}>
                    We'll use these values to calculate appropriate training weights (usually 60-85% of 1RM)
                  </Text>
                </GlassCard>
              </>
            )}
          </>
        )}
      </GlassSection>

      {/* Available Equipment */}
      <GlassSection>
        <Text style={styles.sectionTitle}>AVAILABLE EQUIPMENT</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Select all equipment you have access to (select multiple)
        </Text>
        <View style={styles.equipmentGrid}>
          {EQUIPMENT_OPTIONS.map((equipment) => {
            const isSelected = state.availableEquipment.includes(equipment.id);
            const selectedBg = isSelected ? Colors.primary : undefined;
            const IconComponent = equipment.icon;
            return (
              <TouchableOpacity
                key={equipment.id}
                onPress={async () => {
                  await selectionFeedback();
                  toggleEquipment(equipment.id);
                }}
                accessibilityLabel={`${equipment.label}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${equipment.label} as available equipment`}
              >
                <GlassCard
                  style={[
                    styles.equipmentChip,
                    isSelected && { backgroundColor: selectedBg }
                  ]}
                  interactive
                >
                  <IconComponent
                    size={18}
                    color={isSelected ? Colors.background : colors.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.equipmentChipText,
                      { color: colors.text },
                      isSelected && styles.equipmentChipTextSelected,
                    ]}
                  >
                    {equipment.label}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
        {state.availableEquipment.length === 0 && (
          <Text style={[styles.warningText, { color: Colors.warning }]}>
            Please select at least one equipment option
          </Text>
        )}
      </GlassSection>

      {/* Injuries / Limitations */}
      <GlassSection>
        <Text style={styles.sectionTitle}>INJURIES OR LIMITATIONS</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Select any areas to avoid or modify exercises for (optional)
        </Text>
        <View style={styles.injuryGrid}>
          {INJURY_OPTIONS.map((injury) => {
            const isSelected = state.injuries.includes(injury.id);
            const selectedBg = isSelected ? Colors.warning : undefined;
            return (
              <TouchableOpacity
                key={injury.id}
                onPress={async () => {
                  await selectionFeedback();
                  toggleInjury(injury.id);
                }}
                accessibilityLabel={`${injury.label}: ${injury.description}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${injury.label} injury or limitation`}
              >
                <GlassCard
                  style={[
                    styles.injuryChip,
                    isSelected && { backgroundColor: selectedBg }
                  ]}
                  interactive
                >
                  <View>
                    <Text
                      style={[
                        styles.injuryChipLabel,
                        { color: colors.text },
                        isSelected && styles.injuryChipLabelSelected,
                      ]}
                    >
                      {injury.label}
                    </Text>
                    <Text
                      style={[
                        styles.injuryChipDescription,
                        { color: colors.textMuted },
                        isSelected && styles.injuryChipDescriptionSelected,
                      ]}
                    >
                      {injury.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <CheckCircle2 size={20} color={Colors.background} style={{ marginLeft: 8 }} />
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
        {state.injuries.length > 0 && (
          <GlassCard style={styles.injuryNote} interactive>
            <Info size={20} color={Colors.accentCyan} />
            <Text style={[styles.injuryNoteText, { color: colors.textSecondary }]}>
              Workouts will be modified to avoid or reduce stress on these areas.
            </Text>
          </GlassCard>
        )}
      </GlassSection>

      {/* Summary Card */}
      <GlassCard style={styles.summaryCard} interactive>
        <View style={styles.summaryCardInner}>
          <Lightbulb size={28} color={Colors.warning} />
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            Based on your activity level, we'll calculate your Total Daily Energy Expenditure (TDEE)
            to determine the right calorie target for your goal.
          </Text>
        </View>
      </GlassCard>

      {/* Bottom Spacing - extra space to prevent blending with buttons */}
      <View style={{ height: 180 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={{ flex: 1 }}
            accessibilityLabel="Back"
            accessibilityRole="button"
            accessibilityHint="Returns to previous step"
          >
            <GlassCard style={styles.backButton} interactive>
              <Text style={[styles.backButtonText, { color: colors.text }]}>BACK</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.7}
            style={{ flex: 2 }}
            accessibilityLabel="Continue"
            accessibilityRole="button"
            accessibilityHint="Saves activity preferences and proceeds to next step"
          >
            <GlassCard style={[styles.continueButton, { backgroundColor: primaryGlassBg }]} interactive>
              <Text style={[styles.continueButtonText, { color: colors.primary }]}>CONTINUE</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  subtitle: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
  },
  glassSection: {
    marginBottom: 24,
    marginHorizontal: 16,
    padding: 16,
  },
  activityList: {
    gap: 8,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0, // GlassCard provides padding
  },
  activityLeft: {
    marginRight: 16,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 24,
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
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  activityTitleSelected: {
    color: Colors.success,
  },
  activityDescription: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  activityExample: {
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1.5,
    color: Colors.text,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
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
    gap: 8,
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
    marginHorizontal: 16,
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
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    marginHorizontal: 16,
  },
  cardioSectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1.5,
    color: Colors.text,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardioSectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.light,
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
    marginRight: 16,
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
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  cardioTitleSelected: {
    color: Colors.error,
  },
  cardioDescription: {
    fontSize: 13,
    fontFamily: Fonts.light,
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
    fontFamily: Fonts.light,
    color: Colors.textMuted,
  },
  // Equipment styles
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  equipmentChipText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },
  equipmentChipTextSelected: {
    color: Colors.background,
  },
  warningText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    marginTop: 12,
    fontStyle: 'italic',
  },
  // Injury styles
  injuryGrid: {
    gap: 8,
  },
  injuryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  injuryChipLabel: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    marginBottom: 2,
  },
  injuryChipLabelSelected: {
    color: Colors.background,
  },
  injuryChipDescription: {
    fontSize: 11,
    fontFamily: Fonts.light,
  },
  injuryChipDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  injuryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
  },
  injuryNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.light,
    lineHeight: 18,
  },
  // Strength baseline styles
  strengthSubheading: {
    fontSize: 13,
    fontFamily: Fonts.light,
    marginBottom: 12,
    marginTop: 4,
  },
  strengthLevelChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  strengthLevelLabel: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    marginBottom: 2,
  },
  strengthLevelDesc: {
    fontSize: 11,
    fontFamily: Fonts.light,
  },
  strengthNote: {
    fontSize: 12,
    fontFamily: Fonts.light,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  oneRMContainer: {
    gap: 12,
  },
  oneRMInput: {
    marginBottom: 12,
  },
  oneRMLabel: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200',
    marginBottom: 8,
  },
  oneRMInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oneRMField: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  oneRMUnit: {
    fontSize: 13,
    fontFamily: Fonts.light,
  },
  oneRMNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
  },
  oneRMNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.light,
    lineHeight: 18,
  },
});
