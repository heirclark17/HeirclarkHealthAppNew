import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../../constants/Theme';
import { useGoalWizard, CardioPreference } from '../../contexts/GoalWizardContext';
import { ActivityLevel } from '../../constants/goals';
import { lightImpact, selectionFeedback } from '../../utils/haptics';

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
}

function ActivityCard({ option, isSelected, onSelect, index }: ActivityCardProps) {
  const scale = useSharedValue(1);
  const selected = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    selected.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected, selected]);

  const handlePress = async () => {
    await selectionFeedback();
    scale.value = withSpring(0.98, { damping: 15 });
    scale.value = withSpring(1, { damping: 10 });
    onSelect();
  };

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selected.value,
      [0, 1],
      ['rgba(26, 26, 26, 0.6)', 'rgba(78, 205, 196, 0.15)']
    );
    const borderColor = interpolateColor(
      selected.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.08)', '#4ECDC4']
    );
    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={[styles.activityCard, animatedStyle]}>
          <View style={styles.activityLeft}>
            <View style={[styles.activityIcon, isSelected && styles.activityIconSelected]}>
              <Ionicons
                name={option.icon}
                size={22}
                color={isSelected ? '#4ECDC4' : Colors.textMuted}
              />
            </View>
          </View>
          <View style={styles.activityContent}>
            <Text style={[styles.activityTitle, isSelected && styles.activityTitleSelected]}>
              {option.title}
            </Text>
            <Text style={styles.activityDescription}>{option.description}</Text>
            <Text style={styles.activityExample}>{option.example}</Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ChipProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

function Chip({ label, isSelected, onSelect }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={async () => {
        await selectionFeedback();
        onSelect();
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface CardioCardProps {
  option: CardioOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function CardioCard({ option, isSelected, onSelect, index }: CardioCardProps) {
  const scale = useSharedValue(1);
  const selected = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    selected.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected, selected]);

  const handlePress = async () => {
    await selectionFeedback();
    scale.value = withSpring(0.98, { damping: 15 });
    scale.value = withSpring(1, { damping: 10 });
    onSelect();
  };

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selected.value,
      [0, 1],
      ['rgba(26, 26, 26, 0.6)', 'rgba(255, 107, 107, 0.15)']
    );
    const borderColor = interpolateColor(
      selected.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.08)', '#FF6B6B']
    );
    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={[styles.cardioCard, animatedStyle]}>
          <View style={styles.cardioLeft}>
            <View style={[styles.cardioIcon, isSelected && styles.cardioIconSelected]}>
              <Ionicons
                name={option.icon}
                size={24}
                color={isSelected ? '#FF6B6B' : Colors.textMuted}
              />
            </View>
          </View>
          <View style={styles.cardioContent}>
            <Text style={[styles.cardioTitle, isSelected && styles.cardioTitleSelected]}>
              {option.title}
            </Text>
            <Text style={styles.cardioDescription}>{option.description}</Text>
            <View style={styles.cardioMeta}>
              <View style={styles.cardioMetaItem}>
                <Ionicons name="flame-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.cardioMetaText}>{option.calorieInfo}</Text>
              </View>
              <View style={styles.cardioMetaItem}>
                <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.cardioMetaText}>{option.frequency}</Text>
              </View>
            </View>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#FF6B6B" />
          )}
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

  const handleContinue = async () => {
    await lightImpact();
    onNext();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Level</Text>
        <Text style={styles.subtitle}>
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
          />
        ))}
      </View>

      {/* Workouts Per Week */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WORKOUTS PER WEEK</Text>
        <View style={styles.workoutChips}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.workoutChip,
                state.workoutsPerWeek === num && styles.workoutChipSelected,
              ]}
              onPress={async () => {
                await selectionFeedback();
                setWorkoutsPerWeek(num);
              }}
            >
              <Text
                style={[
                  styles.workoutChipText,
                  state.workoutsPerWeek === num && styles.workoutChipTextSelected,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Workout Duration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TYPICAL WORKOUT DURATION</Text>
        <View style={styles.durationChips}>
          {WORKOUT_DURATIONS.map((duration) => (
            <Chip
              key={duration}
              label={`${duration} min`}
              isSelected={state.workoutDuration === duration}
              onSelect={() => setWorkoutDuration(duration)}
            />
          ))}
        </View>
      </View>

      {/* Cardio Preference */}
      <View style={styles.cardioSection}>
        <Text style={styles.cardioSectionTitle}>PREFERRED CARDIO TYPE</Text>
        <Text style={styles.cardioSectionSubtitle}>
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
            />
          ))}
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Ionicons name="bulb-outline" size={20} color="#FFD93D" />
        <Text style={styles.summaryText}>
          Based on your activity level, we'll calculate your Total Daily Energy Expenditure (TDEE)
          to determine the right calorie target for your goal.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>CONTINUE</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.primaryText} />
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
  activityList: {
    gap: 10,
    marginBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#4ECDC4',
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
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workoutChipSelected: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  workoutChipText: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  workoutChipTextSelected: {
    color: '#000',
  },
  durationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  chipText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  chipTextSelected: {
    color: '#000',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.2)',
    marginBottom: 24,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
    color: Colors.text,
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
    color: Colors.primaryText,
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
    color: '#FF6B6B',
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
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#FF6B6B',
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
