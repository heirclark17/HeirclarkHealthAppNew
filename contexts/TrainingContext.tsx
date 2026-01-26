import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGoalWizard } from './GoalWizardContext';
import { trainingService } from '../services/trainingService';
import { planGenerator } from '../services/planGenerator';
import { trainingStorage } from '../services/trainingStorage';
import {
  WeeklyTrainingPlan,
  TrainingDay,
  Workout,
  WorkoutExercise,
  TrainingPreferences,
  TrainingProgram,
  GoalWorkoutAlignment,
  DifficultyLevel,
  PlanSummary,
  ProgramTemplate,
  Exercise,
  ExerciseAlternative,
} from '../types/training';

const STORAGE_KEY = 'hc_training_plan_cache';

interface TrainingState {
  weeklyPlan: WeeklyTrainingPlan | null;
  currentWeek: number;
  selectedProgram: TrainingProgram | ProgramTemplate | null;
  isGenerating: boolean;
  error: string | null;
  goalAlignment: GoalWorkoutAlignment | null;
  selectedDayIndex: number;
  lastGeneratedAt: string | null;
  preferences: TrainingPreferences | null;
  planSummary: PlanSummary | null;
  selectedExercise: Exercise | null;
  showAlternativesModal: boolean;
}

interface TrainingContextType {
  state: TrainingState;
  generateWeeklyPlan: (programId?: string) => Promise<boolean>;
  regeneratePlan: () => Promise<boolean>;
  selectProgram: (program: TrainingProgram | ProgramTemplate) => void;
  selectProgramAndGenerate: (program: TrainingProgram | ProgramTemplate) => Promise<boolean>;
  setSelectedDay: (index: number) => void;
  markExerciseComplete: (dayIndex: number, exerciseId: string) => void;
  markWorkoutComplete: (dayIndex: number) => void;
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  swapExercise: (dayIndex: number, exerciseId: string) => void;
  swapExerciseWithAlternative: (dayIndex: number, exerciseId: string, alternative: ExerciseAlternative) => void;
  getAllPrograms: () => (TrainingProgram | ProgramTemplate)[];
  getEnhancedPrograms: () => ProgramTemplate[];
  clearPlan: () => void;
  loadCachedPlan: () => Promise<void>;
  showExerciseAlternatives: (exercise: Exercise) => void;
  hideExerciseAlternatives: () => void;
  hasPlan: () => boolean;
  getPlanSummary: () => PlanSummary | null;
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
  planSummary: null,
  selectedExercise: null,
  showAlternativesModal: false,
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

  // Generate weekly training plan with enhanced plan generator
  // If programId is provided, use that specific program
  const generateWeeklyPlan = useCallback(async (programId?: string): Promise<boolean> => {
    console.log('[Training] generateWeeklyPlan called', programId ? `with program: ${programId}` : '');
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      console.log('[Training] Building preferences from goals...');
      const preferences = buildPreferencesFromGoals();
      console.log('[Training] Preferences:', JSON.stringify(preferences, null, 2));
      console.log('[Training] Cardio preference:', preferences.cardioPreference);

      // Use the enhanced plan generator to get plan with summary
      // Pass programId to use specific program if provided
      console.log('[Training] Using planGenerator for enhanced plan...');
      const { weeklyPlan, program, summary } = planGenerator.generateCompletePlan(preferences, undefined, programId);
      console.log('[Training] Plan generated with program:', program.name);

      // Calculate goal alignment
      console.log('[Training] Calculating goal alignment...');
      const alignment = trainingService.calculateGoalAlignment(preferences, weeklyPlan);
      console.log('[Training] Alignment score:', alignment?.overallAlignment);

      // Determine selected day (today or first workout day)
      const today = new Date().getDay();
      const todayIndex = today === 0 ? 6 : today - 1; // Convert to Monday = 0

      console.log('[Training] Updating state with new plan...');
      const lastGeneratedAt = new Date().toISOString();

      setState(prev => ({
        ...prev,
        weeklyPlan,
        selectedProgram: program,
        goalAlignment: alignment,
        isGenerating: false,
        selectedDayIndex: todayIndex,
        lastGeneratedAt,
        preferences,
        planSummary: summary,
      }));

      // Cache the plan using trainingStorage
      console.log('[Training] Caching plan...');
      await trainingStorage.savePlanCache({
        weeklyPlan,
        selectedProgram: program,
        goalAlignment: alignment,
        currentWeek: state.currentWeek,
        lastGeneratedAt,
        preferences,
        planSummary: summary,
      });

      // Update goal hash to track changes
      await trainingStorage.updateGoalHash(goalWizardContext?.state);

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
  }, [buildPreferencesFromGoals, state.currentWeek, goalWizardContext?.state]);

  // Regenerate plan with current settings
  const regeneratePlan = useCallback(async (): Promise<boolean> => {
    return generateWeeklyPlan();
  }, [generateWeeklyPlan]);

  // Select a specific program (state only - doesn't regenerate)
  const selectProgram = useCallback((program: TrainingProgram | ProgramTemplate) => {
    setState(prev => ({ ...prev, selectedProgram: program }));
  }, []);

  // Select a program AND generate a new plan with it
  const selectProgramAndGenerate = useCallback(async (program: TrainingProgram | ProgramTemplate): Promise<boolean> => {
    console.log('[Training] selectProgramAndGenerate called with:', program.name);
    setState(prev => ({ ...prev, selectedProgram: program }));
    // Generate plan with the specific program
    return generateWeeklyPlan(program.id);
  }, [generateWeeklyPlan]);

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

      // Save to storage asynchronously
      trainingStorage.savePlanCache({
        weeklyPlan: updatedPlan,
        selectedProgram: prev.selectedProgram,
        goalAlignment: prev.goalAlignment,
        currentWeek: prev.currentWeek,
        lastGeneratedAt: prev.lastGeneratedAt || new Date().toISOString(),
        preferences: prev.preferences,
        planSummary: prev.planSummary,
      });

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
      trainingStorage.savePlanCache({
        weeklyPlan: updatedPlan,
        selectedProgram: prev.selectedProgram,
        goalAlignment: prev.goalAlignment,
        currentWeek: prev.currentWeek,
        lastGeneratedAt: prev.lastGeneratedAt || new Date().toISOString(),
        preferences: prev.preferences,
        planSummary: prev.planSummary,
      });

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

  // Swap exercise for a random alternative
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

  // Swap exercise with a specific alternative
  const swapExerciseWithAlternative = useCallback((
    dayIndex: number,
    exerciseId: string,
    alternative: ExerciseAlternative
  ) => {
    setState(prev => {
      if (!prev.weeklyPlan) return prev;

      const updatedDays = [...prev.weeklyPlan.days];
      const day = updatedDays[dayIndex];

      if (day.workout) {
        const exerciseIndex = day.workout.exercises.findIndex(ex => ex.id === exerciseId);
        if (exerciseIndex === -1) return prev;

        const currentExercise = day.workout.exercises[exerciseIndex];

        // Create a new exercise from the alternative
        const newExercise: Exercise = {
          id: alternative.id,
          name: alternative.name,
          equipment: alternative.equipment,
          muscleGroups: currentExercise.exercise.muscleGroups,
          category: currentExercise.exercise.category,
          difficulty: currentExercise.exercise.difficulty,
          caloriesPerMinute: currentExercise.exercise.caloriesPerMinute,
          instructions: alternative.formCues,
        };

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

      // Save the update
      trainingStorage.savePlanCache({
        weeklyPlan: updatedPlan,
        selectedProgram: prev.selectedProgram,
        goalAlignment: prev.goalAlignment,
        currentWeek: prev.currentWeek,
        lastGeneratedAt: prev.lastGeneratedAt || new Date().toISOString(),
        preferences: prev.preferences,
        planSummary: prev.planSummary,
      });

      return { ...prev, weeklyPlan: updatedPlan, showAlternativesModal: false };
    });
  }, []);

  // Show exercise alternatives modal
  const showExerciseAlternatives = useCallback((exercise: Exercise) => {
    setState(prev => ({
      ...prev,
      selectedExercise: exercise,
      showAlternativesModal: true,
    }));
  }, []);

  // Hide exercise alternatives modal
  const hideExerciseAlternatives = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedExercise: null,
      showAlternativesModal: false,
    }));
  }, []);

  // Get all programs (basic)
  const getAllPrograms = useCallback((): (TrainingProgram | ProgramTemplate)[] => {
    return trainingService.getAllPrograms();
  }, []);

  // Get enhanced program templates
  const getEnhancedPrograms = useCallback((): ProgramTemplate[] => {
    return planGenerator.getAllPrograms();
  }, []);

  // Clear plan
  const clearPlan = useCallback(() => {
    setState(initialState);
    trainingStorage.clearPlan();
  }, []);

  // Load cached plan
  const loadCachedPlan = useCallback(async () => {
    try {
      const cached = await trainingStorage.loadPlanCache();
      if (cached) {
        setState(prev => ({
          ...prev,
          weeklyPlan: cached.weeklyPlan,
          selectedProgram: cached.selectedProgram,
          goalAlignment: cached.goalAlignment,
          currentWeek: cached.currentWeek || 1,
          lastGeneratedAt: cached.lastGeneratedAt,
          preferences: cached.preferences,
          planSummary: cached.planSummary || null,
        }));
      }
    } catch (error) {
      console.error('Error loading cached training plan:', error);
    }
  }, []);

  // Check if plan exists
  const hasPlan = useCallback((): boolean => {
    return state.weeklyPlan !== null;
  }, [state.weeklyPlan]);

  // Get plan summary
  const getPlanSummary = useCallback((): PlanSummary | null => {
    return state.planSummary;
  }, [state.planSummary]);

  // Load cached data on mount
  useEffect(() => {
    loadCachedPlan();
  }, [loadCachedPlan]);

  // Check if goals changed and plan should be regenerated
  useEffect(() => {
    const checkGoalChanges = async () => {
      if (goalWizardContext?.state && state.weeklyPlan) {
        const changed = await trainingStorage.haveGoalsChanged(goalWizardContext.state);
        if (changed) {
          console.log('[Training] Goals changed - clearing plan for regeneration');
          // Don't auto-regenerate, just clear so user can generate new plan
          await trainingStorage.clearPlan();
          setState(prev => ({
            ...prev,
            weeklyPlan: null,
            planSummary: null,
          }));
        }
      }
    };

    checkGoalChanges();
  }, [goalWizardContext?.state]);

  const value: TrainingContextType = {
    state,
    generateWeeklyPlan,
    regeneratePlan,
    selectProgram,
    selectProgramAndGenerate,
    setSelectedDay,
    markExerciseComplete,
    markWorkoutComplete,
    goToNextWeek,
    goToPreviousWeek,
    swapExercise,
    swapExerciseWithAlternative,
    getAllPrograms,
    getEnhancedPrograms,
    clearPlan,
    loadCachedPlan,
    showExerciseAlternatives,
    hideExerciseAlternatives,
    hasPlan,
    getPlanSummary,
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
