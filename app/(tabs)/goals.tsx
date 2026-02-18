import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';

import { useRouter } from 'expo-router';
import { Colors, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePostHog } from '../../contexts/PostHogContext';
import {
  GoalWizardProvider,
  useGoalWizard,
} from '../../contexts/GoalWizardContext';
import { useMealPlan } from '../../contexts/MealPlanContext';
import { useTraining } from '../../contexts/TrainingContext';
import { PrimaryGoalStep } from '../../components/goals/PrimaryGoalStep';
import { BodyMetricsStep } from '../../components/goals/BodyMetricsStep';
import { ActivityLifestyleStep } from '../../components/goals/ActivityLifestyleStep';
import { NutritionPreferencesStep } from '../../components/goals/NutritionPreferencesStep';
import { ProgramSelectionStep } from '../../components/goals/ProgramSelectionStep';
import { PlanPreviewStep } from '../../components/goals/PlanPreviewStep';
import { SuccessScreen } from '../../components/goals/SuccessScreen';
import { CoachingModal } from '../../components/goals/CoachingModal';


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
  const { state, nextStep, prevStep, loadSavedProgress, resetWizard, startEditing, setSelectedProgram } = useGoalWizard();
  const { generateAIMealPlan, state: mealPlanState } = useMealPlan();
  const { generateAIWorkoutPlan, state: trainingState, selectProgram, selectProgramAndGenerate, getEnhancedPrograms } = useTraining();
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingSuccess, setIsLoadingSuccess] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
  const [isGeneratingTrainingPlan, setIsGeneratingTrainingPlan] = useState(false);
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();
  const { capture } = usePostHog();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  useEffect(() => {
    // Load any saved progress when component mounts
    loadSavedProgress();

    // Track screen view
    capture('screen_viewed', {
      screen_name: 'Goal Wizard',
      screen_type: 'tab',
    });
  }, [loadSavedProgress]);

  const getStepName = (step: number) => {
    const stepNames = [
      'Primary Goal',
      'Body Metrics',
      'Activity Lifestyle',
      'Nutrition Preferences',
      'Program Selection',
      'Plan Preview',
    ];
    return stepNames[step - 1] || 'Unknown';
  };

  const handleNext = () => {
    setDirection('forward');
    capture('goal_wizard_step_completed', {
      screen_name: 'Goal Wizard',
      current_step: state.currentStep,
      step_name: getStepName(state.currentStep),
    });
    nextStep();
  };

  const handleBack = () => {
    if (state.currentStep === 1) {
      router.replace('/');
    } else {
      setDirection('backward');
      prevStep();
    }
  };

  const handleProgramSelect = (programId: string, programName: string) => {
    setSelectedProgram(programId, programName);
    handleNext();
  };

  const handleConfirm = () => {
    // Show loading screen while calculating results
    setIsLoadingSuccess(true);

    // Simulate calculation time (5 seconds for longer anticipation)
    setTimeout(() => {
      setIsLoadingSuccess(false);
      setShowSuccess(true);
    }, 5000);
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
        // Delay navigation to ensure router is ready
        setTimeout(() => {
          router.push('/meals');
        }, 100);
      } else {
        Alert.alert(
          'Generation Started',
          'Your AI meal plan is being created. Head to the Meals tab to see it!',
          [{
            text: 'Go to Meals',
            onPress: () => {
              setTimeout(() => {
                router.push('/meals');
              }, 100);
            }
          }]
        );
      }
    } catch (error) {
      console.error('Failed to generate AI meal plan:', error);
      Alert.alert(
        'Could not generate plan',
        'Would you like to try again or go to Meals to generate manually?',
        [
          { text: 'Try Again', onPress: handleStartMealPlan },
          {
            text: 'Go to Meals',
            onPress: () => {
              setTimeout(() => {
                router.push('/meals');
              }, 100);
            }
          },
        ]
      );
    } finally {
      setIsGeneratingMealPlan(false);
    }
  };

  const handleStartTrainingPlan = async () => {
    // Select the program from goal wizard, then generate a detailed workout plan
    setIsGeneratingTrainingPlan(true);
    try {
      let success = false;

      // Use the selected program to generate a detailed multi-week plan
      if (state.selectedProgramId) {
        const programs = getEnhancedPrograms();
        const selectedProgram = programs.find(p => p.id === state.selectedProgramId);

        if (selectedProgram) {
          console.log('[Goals] Generating plan with selected program:', selectedProgram.name);
          // selectProgramAndGenerate selects the program AND generates a multi-week plan
          success = await selectProgramAndGenerate(selectedProgram);
        }
      }

      // Fallback: if no program selected, generate a generic AI plan
      if (!success && !state.selectedProgramId) {
        console.log('[Goals] No program selected, generating generic AI plan');
        success = await generateAIWorkoutPlan();
      }

      if (success) {
        // Delay navigation to ensure router is ready
        setTimeout(() => {
          router.push('/programs');
        }, 100);
      } else {
        Alert.alert(
          'Generation Started',
          'Your AI training plan is being created. Head to the Programs tab to see it!',
          [{
            text: 'Go to Programs',
            onPress: () => {
              setTimeout(() => {
                router.push('/programs');
              }, 100);
            }
          }]
        );
      }
    } catch (error) {
      console.error('Failed to generate workout plan:', error);
      Alert.alert(
        'Could not generate plan',
        'Would you like to try again or go to Programs to generate manually?',
        [
          { text: 'Try Again', onPress: handleStartTrainingPlan },
          {
            text: 'Go to Programs',
            onPress: () => {
              setTimeout(() => {
                router.push('/programs');
              }, 100);
            }
          },
        ]
      );
    } finally {
      setIsGeneratingTrainingPlan(false);
    }
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

  // Loading screen (transition)
  if (isLoadingSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            {/* Colorful animated circles */}
            <View style={styles.circlesContainer}>
              <Animated.View
                entering={SlideInRight.duration(600).delay(0)}
                style={[styles.colorCircle, { backgroundColor: '#FF6B6B' }]}
              />
              <Animated.View
                entering={SlideInRight.duration(600).delay(100)}
                style={[styles.colorCircle, { backgroundColor: '#4ECDC4' }]}
              />
              <Animated.View
                entering={SlideInRight.duration(600).delay(200)}
                style={[styles.colorCircle, { backgroundColor: '#45B7D1' }]}
              />
              <Animated.View
                entering={SlideInRight.duration(600).delay(300)}
                style={[styles.colorCircle, { backgroundColor: '#F9CA24' }]}
              />
              <Animated.View
                entering={SlideInRight.duration(600).delay(400)}
                style={[styles.colorCircle, { backgroundColor: '#6AB04C' }]}
              />
            </View>

            {/* Main icon */}
            <Animated.View
              entering={SlideInRight.duration(600).delay(500)}
              style={styles.loadingIconContainer}
            >
              <View style={[styles.loadingCircle, { backgroundColor: colors.primary }]}>
                <CheckCircle2 size={56} color={Colors.background} />
              </View>
            </Animated.View>

            {/* Text content */}
            <Animated.Text
              entering={SlideInRight.duration(600).delay(700)}
              style={[styles.loadingTitle, { color: colors.text }]}
            >
              ✨ Preparing Your Plan...
            </Animated.Text>
            <Animated.Text
              entering={SlideInRight.duration(600).delay(900)}
              style={[styles.loadingSubtitle, { color: colors.textSecondary }]}
            >
              Calculating personalized targets
            </Animated.Text>
            <Animated.Text
              entering={SlideInRight.duration(600).delay(1100)}
              style={[styles.loadingDetail, { color: colors.textMuted }]}
            >
              Optimizing for your goals
            </Animated.Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            <ProgramSelectionStep onContinue={handleProgramSelect} onBack={handleBack} />
          </AnimatedStep>
        );
      case 6:
        return (
          <AnimatedStep direction={direction} stepKey={6}>
            <PlanPreviewStep onBack={handleBack} onConfirm={handleConfirm} />
          </AnimatedStep>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Step Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={100}
      >
        {renderStep()}
      </KeyboardAvoidingView>
    </View>
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
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingContent: {
    alignItems: 'center',
    gap: 20,
  },
  circlesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.8,
  },
  loadingIconContainer: {
    marginBottom: 24,
  },
  loadingCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  loadingSubtitle: {
    fontSize: 17,
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '500',
  },
  loadingDetail: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 8,
  },
});
