import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGoalWizard } from './GoalWizardContext';
import { trainingService } from '../services/trainingService';
import {
  WeeklyTrainingPlan,
  TrainingDay,
  Workout,
  WorkoutExercise,
  TrainingPreferences,
  TrainingProgram,
  GoalWorkoutAlignment,
  DifficultyLevel,
} from '../types/training';

const STORAGE_KEY = 'hc_training_plan_cache';

interface TrainingState {
  weeklyPlan: WeeklyTrainingPlan | null;
  currentWeek: number;
  selectedProgram: TrainingProgram | null;
  isGenerating: boolean;
  error: string | null;
  goalAlignment: GoalWorkoutAlignment | null;
  selectedDayIndex: number;
  lastGeneratedAt: string | null;
  preferences: TrainingPreferences | null;
}

interface TrainingContextType {
  state: TrainingState;
  generateWeeklyPlan: () => Promise<boolean>;
  regeneratePlan: () => Promise<boolean>;
  selectProgram: (program: TrainingProgram) => void;
  setSelectedDay: (index: number) => void;
  markExerciseComplete: (dayIndex: number, exerciseId: string) => void;
  markWorkoutComplete: (dayIndex: number) => void;
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  swapExercise: (dayIndex: number, exerciseId: string) => void;
  getAllPrograms: () => TrainingProgram[];
  clearPlan: () => void;
  loadCachedPlan: () => Promise<void>;
}

const initialState: TrainingState = {
  weeklyPlan: null,
  currentWeek: 1,
  selectedProgram: null,
  isGenerating: false,
  error: null,
  goalAlignment: null,
  selectedDayIndex: 0,
  lastGeneratedAt: null,
  preferences: null,
};

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TrainingState>(initialState);

  // Get goal wizard context for user preferences
  let goalWizardContext: any = null;
  try {
    goalWizardContext = useGoalWizard();
  } catch (e) {
    // GoalWizard context may not be available
  }

  // Build training preferences from goals
  const buildPreferencesFromGoals = useCallback((): TrainingPreferences => {
    const goalState = goalWizardContext?.state;

    console.log('[Training] buildPreferencesFromGoals - goalState:', {
      primaryGoal: goalState?.primaryGoal,
      cardioPreference: goalState?.cardioPreference,
      activityLevel: goalState?.activityLevel,
      workoutsPerWeek: goalState?.workoutsPerWeek,
    });

    // Map primary goal
    let primaryGoal: TrainingPreferences['primaryGoal'] = 'maintain';
    if (goalState?.primaryGoal === 'lose_weight') primaryGoal = 'lose_weight';
    else if (goalState?.primaryGoal === 'build_muscle') primaryGoal = 'build_muscle';
    else if (goalState?.primaryGoal === 'improve_health') primaryGoal = 'improve_health';
    else if (goalState?.primaryGoal === 'maintain') primaryGoal = 'maintain';

    // Map activity level
    let activityLevel: TrainingPreferences['activityLevel'] = 'moderate';
    if (goalState?.activityLevel) {
      activityLevel = goalState.activityLevel;
    }

    // Determine fitness level based on activity and workouts per week
    let fitnessLevel: DifficultyLevel = 'beginner';
    const workoutsPerWeek = goalState?.workoutsPerWeek || 3;
    if (workoutsPerWeek >= 5 && activityLevel === 'very_active') {
      fitnessLevel = 'advanced';
    } else if (workoutsPerWeek >= 3 || activityLevel === 'active' || activityLevel === 'moderate') {
      fitnessLevel = 'intermediate';
    }

    // Get cardio preference - this is critical for workout generation
    const cardioPreference = goalState?.cardioPreference || 'walking';
    console.log('[Training] Using cardio preference:', cardioPreference);

    return {
      primaryGoal,
      workoutsPerWeek,
      workoutDuration: goalState?.workoutDuration || 30,
      activityLevel,
      fitnessLevel,
      availableEquipment: ['dumbbells', 'barbell', 'bodyweight', 'cable_machine'], // Default equipment
      cardioPreference, // User's preferred cardio type
    };
  }, [goalWizardContext?.state]);

  // Generate weekly training plan
  const generateWeeklyPlan = useCallback(async (): Promise<boolean> => {
    console.log('[Training] generateWeeklyPlan called');
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      console.log('[Training] Building preferences from goals...');
      const preferences = buildPreferencesFromGoals();
      console.log('[Training] Preferences:', JSON.stringify(preferences, null, 2));
      console.log('[Training] Cardio preference:', preferences.cardioPreference);

      // Get recommended program
      console.log('[Training] Getting recommended program...');
      const program = state.selectedProgram || trainingService.getRecommendedProgram(preferences);
      console.log('[Training] Program selected:', program?.name);

      // Generate the weekly plan
      console.log('[Training] Generating weekly plan...');
      const weeklyPlan = trainingService.generateWeeklyPlan(preferences, state.currentWeek);
      console.log('[Training] Weekly plan generated:', weeklyPlan?.days?.length, 'days');

      // Calculate goal alignment
      console.log('[Training] Calculating goal alignment...');
      const alignment = trainingService.calculateGoalAlignment(preferences, weeklyPlan);
      console.log('[Training] Alignment score:', alignment?.overallAlignment);

      // Determine selected day (today or first workout day)
      const today = new Date().getDay();
      const todayIndex = today === 0 ? 6 : today - 1; // Convert to Monday = 0

      console.log('[Training] Updating state with new plan...');
      setState(prev => ({
        ...prev,
        weeklyPlan,
        selectedProgram: program,
        goalAlignment: alignment,
        isGenerating: false,
        selectedDayIndex: todayIndex,
        lastGeneratedAt: new Date().toISOString(),
        preferences,
      }));

      // Cache the plan
      console.log('[Training] Caching plan to AsyncStorage...');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        weeklyPlan,
        selectedProgram: program,
        goalAlignment: alignment,
        currentWeek: state.currentWeek,
        lastGeneratedAt: new Date().toISOString(),
        preferences,
      }));

      console.log('[Training] ✅ Training plan generated successfully!');
      return true;
    } catch (error) {
      console.error('[Training] ❌ Error generating training plan:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'Failed to generate training plan. Please try again.',
      }));
      return false;
    }
  }, [buildPreferencesFromGoals, state.selectedProgram, state.currentWeek]);

  // Regenerate plan with current settings
  const regeneratePlan = useCallback(async (): Promise<boolean> => {
    return generateWeeklyPlan();
  }, [generateWeeklyPlan]);

  // Select a specific program
  const selectProgram = useCallback((program: TrainingProgram) => {
    setState(prev => ({ ...prev, selectedProgram: program }));
  }, []);

  // Set selected day
  const setSelectedDay = useCallback((index: number) => {
    setState(prev => ({ ...prev, selectedDayIndex: Math.max(0, Math.min(6, index)) }));
  }, []);

  // Mark exercise as complete
  const markExerciseComplete = useCallback((dayIndex: number, exerciseId: string) => {
    setState(prev => {
      if (!prev.weeklyPlan) return prev;

      const updatedDays = [...prev.weeklyPlan.days];
      const day = updatedDays[dayIndex];

      if (day.workout) {
        const updatedExercises = day.workout.exercises.map(ex =>
          ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
        );

        updatedDays[dayIndex] = {
          ...day,
          workout: {
            ...day.workout,
            exercises: updatedExercises,
          },
        };
      }

      const updatedPlan = { ...prev.weeklyPlan, days: updatedDays };

      // Save to storage
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...prev,
        weeklyPlan: updatedPlan,
      }));

      return { ...prev, weeklyPlan: updatedPlan };
    });
  }, []);

  // Mark entire workout as complete
  const markWorkoutComplete = useCallback((dayIndex: number) => {
    setState(prev => {
      if (!prev.weeklyPlan) return prev;

      const updatedDays = [...prev.weeklyPlan.days];
      const day = updatedDays[dayIndex];

      if (day.workout) {
        // Mark all exercises as complete
        const updatedExercises = day.workout.exercises.map(ex => ({
          ...ex,
          completed: true,
        }));

        updatedDays[dayIndex] = {
          ...day,
          completed: true,
          workout: {
            ...day.workout,
            exercises: updatedExercises,
            completed: true,
            completedAt: new Date().toISOString(),
          },
        };
      } else {
        updatedDays[dayIndex] = { ...day, completed: true };
      }

      const completedCount = updatedDays.filter(d => d.completed && d.workout).length;
      const updatedPlan = {
        ...prev.weeklyPlan,
        days: updatedDays,
        completedWorkouts: completedCount,
      };

      // Save to storage
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...prev,
        weeklyPlan: updatedPlan,
      }));

      return { ...prev, weeklyPlan: updatedPlan };
    });
  }, []);

  // Navigate weeks
  const goToNextWeek = useCallback(() => {
    setState(prev => ({ ...prev, currentWeek: prev.currentWeek + 1 }));
  }, []);

  const goToPreviousWeek = useCallback(() => {
    setState(prev => ({ ...prev, currentWeek: Math.max(1, prev.currentWeek - 1) }));
  }, []);

  // Swap exercise for an alternative
  const swapExercise = useCallback((dayIndex: number, exerciseId: string) => {
    setState(prev => {
      if (!prev.weeklyPlan || !prev.preferences) return prev;

      const updatedDays = [...prev.weeklyPlan.days];
      const day = updatedDays[dayIndex];

      if (day.workout) {
        const exerciseIndex = day.workout.exercises.findIndex(ex => ex.id === exerciseId);
        if (exerciseIndex === -1) return prev;

        const currentExercise = day.workout.exercises[exerciseIndex];
        const muscleGroups = currentExercise.exercise.muscleGroups;

        // Find alternative exercise
        const allExercises = trainingService.getAllExercises();
        const alternatives = allExercises.filter(ex =>
          ex.id !== currentExercise.exerciseId &&
          ex.muscleGroups.some(mg => muscleGroups.includes(mg))
        );

        if (alternatives.length === 0) return prev;

        const newExercise = alternatives[Math.floor(Math.random() * alternatives.length)];

        const updatedExercises = [...day.workout.exercises];
        updatedExercises[exerciseIndex] = {
          ...currentExercise,
          exerciseId: newExercise.id,
          exercise: newExercise,
          completed: false,
        };

        updatedDays[dayIndex] = {
          ...day,
          workout: {
            ...day.workout,
            exercises: updatedExercises,
          },
        };
      }

      const updatedPlan = { ...prev.weeklyPlan, days: updatedDays };

      return { ...prev, weeklyPlan: updatedPlan };
    });
  }, []);

  // Get all programs
  const getAllPrograms = useCallback((): TrainingProgram[] => {
    return trainingService.getAllPrograms();
  }, []);

  // Clear plan
  const clearPlan = useCallback(() => {
    setState(initialState);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  // Load cached plan
  const loadCachedPlan = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setState(prev => ({
          ...prev,
          weeklyPlan: parsed.weeklyPlan,
          selectedProgram: parsed.selectedProgram,
          goalAlignment: parsed.goalAlignment,
          currentWeek: parsed.currentWeek || 1,
          lastGeneratedAt: parsed.lastGeneratedAt,
          preferences: parsed.preferences,
        }));
      }
    } catch (error) {
      console.error('Error loading cached training plan:', error);
    }
  }, []);

  // Load cached data on mount
  useEffect(() => {
    loadCachedPlan();
  }, [loadCachedPlan]);

  const value: TrainingContextType = {
    state,
    generateWeeklyPlan,
    regeneratePlan,
    selectProgram,
    setSelectedDay,
    markExerciseComplete,
    markWorkoutComplete,
    goToNextWeek,
    goToPreviousWeek,
    swapExercise,
    getAllPrograms,
    clearPlan,
    loadCachedPlan,
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
}
