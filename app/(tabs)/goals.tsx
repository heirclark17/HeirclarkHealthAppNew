import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  GoalWizardProvider,
  useGoalWizard,
} from '../../contexts/GoalWizardContext';
import { useMealPlan } from '../../contexts/MealPlanContext';
import { useTraining } from '../../contexts/TrainingContext';
import { StepProgressBar } from '../../components/goals/StepProgressBar';
import { PrimaryGoalStep } from '../../components/goals/PrimaryGoalStep';
import { BodyMetricsStep } from '../../components/goals/BodyMetricsStep';
import { ActivityLifestyleStep } from '../../components/goals/ActivityLifestyleStep';
import { NutritionPreferencesStep } from '../../components/goals/NutritionPreferencesStep';
import { PlanPreviewStep } from '../../components/goals/PlanPreviewStep';
import { SuccessScreen } from '../../components/goals/SuccessScreen';
import { CoachingModal } from '../../components/goals/CoachingModal';
import { lightImpact } from '../../utils/haptics';

// Animated wrapper for step transitions
interface AnimatedStepProps {
  children: React.ReactNode;
  direction: 'forward' | 'backward';
  stepKey: number;
}

function AnimatedStep({ children, direction, stepKey }: AnimatedStepProps) {
  return (
    <Animated.View
      key={stepKey}
      entering={direction === 'forward' ? SlideInRight.duration(300) : SlideInLeft.duration(300)}
      exiting={direction === 'forward' ? SlideOutLeft.duration(300) : SlideOutRight.duration(300)}
      style={styles.stepContainer}
    >
      {children}
    </Animated.View>
  );
}

function GoalWizardContent() {
  const router = useRouter();
  const { state, nextStep, prevStep, loadSavedProgress, resetWizard, startEditing } = useGoalWizard();
  const { generateAIMealPlan, state: mealPlanState } = useMealPlan();
  const { generateAIWorkoutPlan, state: trainingState } = useTraining();
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
  const [isGeneratingTrainingPlan, setIsGeneratingTrainingPlan] = useState(false);
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  useEffect(() => {
    // Load any saved progress when component mounts
    loadSavedProgress();
  }, [loadSavedProgress]);

  const handleNext = () => {
    setDirection('forward');
    nextStep();
  };

  const handleBack = () => {
    if (state.currentStep === 1) {
      router.back();
    } else {
      setDirection('backward');
      prevStep();
    }
  };

  const handleConfirm = () => {
    setShowSuccess(true);
  };

  const handleAdjust = () => {
    // Go back to edit goals - reset isComplete and go to step 1
    setShowSuccess(false);
    setDirection('backward');
    startEditing(); // This resets isComplete to false and goes to step 1
  };

  const handleWatchCoaching = () => {
    // Open the AI coaching modal
    setShowCoachingModal(true);
  };

  const handleLogMeal = () => {
    // Navigate to dashboard and open the AI Meal Logger modal
    router.push('/?openMealModal=true');
  };

  const handleViewDashboard = () => {
    // Navigate to home/dashboard
    router.push('/');
  };

  const handleStartMealPlan = async () => {
    // Generate AI meal plan then navigate to meals tab
    setIsGeneratingMealPlan(true);
    try {
      const success = await generateAIMealPlan();
      if (success) {
        router.push('/meals');
      } else {
        Alert.alert(
          'Generation Started',
          'Your AI meal plan is being created. Head to the Meals tab to see it!',
          [{ text: 'Go to Meals', onPress: () => router.push('/meals') }]
        );
      }
    } catch (error) {
      console.error('Failed to generate AI meal plan:', error);
      Alert.alert(
        'Could not generate plan',
        'Would you like to try again or go to Meals to generate manually?',
        [
          { text: 'Try Again', onPress: handleStartMealPlan },
          { text: 'Go to Meals', onPress: () => router.push('/meals') },
        ]
      );
    } finally {
      setIsGeneratingMealPlan(false);
    }
  };

  const handleStartTrainingPlan = async () => {
    // Generate AI workout plan then navigate to programs tab
    setIsGeneratingTrainingPlan(true);
    try {
      const success = await generateAIWorkoutPlan();
      if (success) {
        router.push('/programs');
      } else {
        Alert.alert(
          'Generation Started',
          'Your AI training plan is being created. Head to the Programs tab to see it!',
          [{ text: 'Go to Programs', onPress: () => router.push('/programs') }]
        );
      }
    } catch (error) {
      console.error('Failed to generate AI workout plan:', error);
      Alert.alert(
        'Could not generate plan',
        'Would you like to try again or go to Programs to generate manually?',
        [
          { text: 'Try Again', onPress: handleStartTrainingPlan },
          { text: 'Go to Programs', onPress: () => router.push('/programs') },
        ]
      );
    } finally {
      setIsGeneratingTrainingPlan(false);
    }
  };

  const handleClose = async () => {
    await lightImpact();
    router.back();
  };

  // Prepare coaching data from state
  const coachingGoalData = state.results ? {
    calories: state.results.calories,
    protein: state.results.protein,
    carbs: state.results.carbs,
    fat: state.results.fat,
    bmr: state.results.bmr,
    tdee: state.results.tdee,
    bmi: state.results.bmi,
    dailyDelta: state.results.dailyDelta,
    weeklyChange: state.results.weeklyChange,
    totalWeeks: state.results.totalWeeks,
  } : null;

  const coachingUserInputs = {
    primaryGoal: state.primaryGoal || '',
    activityLevel: state.activityLevel || '',
    currentWeight: state.currentWeight,
    targetWeight: state.targetWeight,
    heightFt: state.heightFt,
    heightIn: state.heightIn,
    age: state.age,
    sex: state.sex,
    dietStyle: state.dietStyle || 'standard',
    workoutsPerWeek: state.workoutsPerWeek || 0,
    weightUnit: state.weightUnit || 'lbs',
    userName: isAuthenticated && user?.firstName ? user.firstName : null,
  };

  // Success screen
  if (showSuccess || state.isComplete) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <SuccessScreen
          onLogMeal={handleLogMeal}
          onViewDashboard={handleViewDashboard}
          onAdjust={handleAdjust}
          onViewAvatar={handleWatchCoaching}
          onStartMealPlan={handleStartMealPlan}
          onStartTrainingPlan={handleStartTrainingPlan}
          isGeneratingMealPlan={isGeneratingMealPlan}
          isGeneratingTrainingPlan={isGeneratingTrainingPlan}
        />
        <CoachingModal
          visible={showCoachingModal}
          onClose={() => setShowCoachingModal(false)}
          goalData={coachingGoalData}
          userInputs={coachingUserInputs}
        />
      </SafeAreaView>
    );
  }

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <AnimatedStep direction={direction} stepKey={1}>
            <PrimaryGoalStep onNext={handleNext} />
          </AnimatedStep>
        );
      case 2:
        return (
          <AnimatedStep direction={direction} stepKey={2}>
            <BodyMetricsStep onNext={handleNext} onBack={handleBack} />
          </AnimatedStep>
        );
      case 3:
        return (
          <AnimatedStep direction={direction} stepKey={3}>
            <ActivityLifestyleStep onNext={handleNext} onBack={handleBack} />
          </AnimatedStep>
        );
      case 4:
        return (
          <AnimatedStep direction={direction} stepKey={4}>
            <NutritionPreferencesStep onNext={handleNext} onBack={handleBack} />
          </AnimatedStep>
        );
      case 5:
        return (
          <AnimatedStep direction={direction} stepKey={5}>
            <PlanPreviewStep onBack={handleBack} onConfirm={handleConfirm} />
          </AnimatedStep>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Close goal wizard"
          accessibilityRole="button"
          accessibilityHint="Returns to previous screen"
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>SET YOUR GOALS</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Progress Bar */}
      <StepProgressBar
        currentStep={state.currentStep}
        totalSteps={5}
        labels={['Goal', 'Body', 'Activity', 'Nutrition', 'Review']}
      />

      {/* Step Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={100}
      >
        {renderStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function GoalsScreen() {
  return (
    <GoalWizardProvider>
      <GoalWizardContent />
    </GoalWizardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stepContainer: {
    flex: 1,
  },
});
