import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGoalWizard } from './GoalWizardContext';
import { trainingService } from '../services/trainingService';
import { planGenerator } from '../services/planGenerator';
import { trainingStorage } from '../services/trainingStorage';
import { weightTrackingStorage } from '../services/weightTrackingStorage';
import { aiService } from '../services/aiService';
import { api } from '../services/api';
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
  generateAIWorkoutPlan: () => Promise<boolean>;
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

  // Extract specific goal values to use in dependencies (avoids object reference issues)
  const goalPrimaryGoal = goalWizardContext?.state?.primaryGoal;
  const goalActivityLevel = goalWizardContext?.state?.activityLevel;
  const goalWorkoutsPerWeek = goalWizardContext?.state?.workoutsPerWeek;
  const goalWorkoutDuration = goalWizardContext?.state?.workoutDuration;
  const goalCardioPreference = goalWizardContext?.state?.cardioPreference;
  const goalAvailableEquipment = goalWizardContext?.state?.availableEquipment;
  const goalInjuries = goalWizardContext?.state?.injuries;
  const goalFitnessLevel = goalWizardContext?.state?.fitnessLevel;

  // Build training preferences from goals
  const buildPreferencesFromGoals = useCallback((): TrainingPreferences => {
    console.log('[Training] buildPreferencesFromGoals - goalState:', {
      primaryGoal: goalPrimaryGoal,
      cardioPreference: goalCardioPreference,
      activityLevel: goalActivityLevel,
      workoutsPerWeek: goalWorkoutsPerWeek,
      availableEquipment: goalAvailableEquipment,
      injuries: goalInjuries,
      fitnessLevel: goalFitnessLevel,
    });

    // Map primary goal
    let primaryGoal: TrainingPreferences['primaryGoal'] = 'maintain';
    if (goalPrimaryGoal === 'lose_weight') primaryGoal = 'lose_weight';
    else if (goalPrimaryGoal === 'build_muscle') primaryGoal = 'build_muscle';
    else if (goalPrimaryGoal === 'improve_health') primaryGoal = 'improve_health';
    else if (goalPrimaryGoal === 'maintain') primaryGoal = 'maintain';

    // Map activity level
    let activityLevel: TrainingPreferences['activityLevel'] = goalActivityLevel || 'moderate';

    // Use user-selected fitness level from goals, or determine from activity/workouts
    let fitnessLevel: DifficultyLevel = (goalFitnessLevel as DifficultyLevel) || 'intermediate';
    const workoutsPerWeek = goalWorkoutsPerWeek || 3;

    // Only override if no fitness level set
    if (!goalFitnessLevel) {
      if (workoutsPerWeek >= 5 && activityLevel === 'very_active') {
        fitnessLevel = 'advanced';
      } else if (workoutsPerWeek >= 3 || activityLevel === 'active' || activityLevel === 'moderate') {
        fitnessLevel = 'intermediate';
      } else {
        fitnessLevel = 'beginner';
      }
    }

    // Get cardio preference - this is critical for workout generation
    const cardioPreference = goalCardioPreference || 'walking';
    console.log('[Training] Using cardio preference:', cardioPreference);

    // Get available equipment from user preferences (default to bodyweight if none selected)
    const availableEquipment = goalAvailableEquipment?.length > 0
      ? goalAvailableEquipment
      : ['bodyweight'];
    console.log('[Training] Using available equipment:', availableEquipment);

    // Get injuries from user preferences (for exercise modifications)
    const injuries = goalInjuries || [];
    console.log('[Training] User injuries/limitations:', injuries);

    return {
      primaryGoal,
      workoutsPerWeek,
      workoutDuration: goalWorkoutDuration || 30,
      activityLevel,
      fitnessLevel,
      availableEquipment, // User-selected equipment from Goals
      injuries, // User-selected injuries/limitations from Goals
      cardioPreference, // User's preferred cardio type
    };
  }, [goalPrimaryGoal, goalActivityLevel, goalWorkoutsPerWeek, goalWorkoutDuration, goalCardioPreference, goalAvailableEquipment, goalInjuries, goalFitnessLevel]);

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

      // *** Sync workout plan to backend ***
      try {
        console.log('[Training] 🔄 Syncing workout plan to backend...');
        const syncSuccess = await api.saveWorkoutPlan(
          { weeklyPlan, preferences, summary, lastGeneratedAt },
          program.id,
          program.name
        );
        if (syncSuccess) {
          console.log('[Training] ✅ Workout plan synced to backend');
        } else {
          console.warn('[Training] ⚠️ Backend sync failed - plan saved locally');
        }
      } catch (syncError) {
        console.error('[Training] ❌ Backend sync error:', syncError);
      }

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
  }, [buildPreferencesFromGoals, state.currentWeek, goalPrimaryGoal, goalActivityLevel, goalWorkoutsPerWeek]);

  // Generate AI-powered workout plan using OpenAI
  const generateAIWorkoutPlan = useCallback(async (): Promise<boolean> => {
    console.log('[Training] generateAIWorkoutPlan called');
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      console.log('[Training] Building preferences from goals...');
      const preferences = buildPreferencesFromGoals();

      // Convert to AI service format - use actual user preferences from Goal Wizard
      const aiPreferences = {
        fitnessGoal: preferences.primaryGoal || 'general_fitness',
        experienceLevel: preferences.fitnessLevel || 'intermediate',
        daysPerWeek: preferences.workoutsPerWeek || 3,
        sessionDuration: preferences.workoutDuration || 45,
        availableEquipment: preferences.availableEquipment || ['bodyweight'],
        injuries: preferences.injuries || [], // User-selected injuries from Goals
        cardioPreference: preferences.cardioPreference || 'walking',
      };

      console.log('[Training] AI preferences from user settings:', JSON.stringify(aiPreferences, null, 2));

      console.log('[Training] Calling AI service for workout plan...');
      const aiPlan = await aiService.generateAIWorkoutPlan(aiPreferences, 2); // 2 weeks for faster generation

      if (aiPlan) {
        // Get the first week's workouts from AI plan
        const firstWeek = aiPlan.weeks?.[0];
        const workouts = firstWeek?.workouts || [];

        // Day names for mapping
        const dayNames: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> =
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        // Calculate start date (most recent Monday)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);

        // Convert AI plan to app format - create 7 days for the week
        const days: TrainingDay[] = dayNames.map((dayName, index) => {
          const dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + index);
          const dateStr = dayDate.toISOString().split('T')[0];

          // Find matching workout from AI plan (by day name or index)
          const aiWorkout = workouts.find((w: any) => {
            const wDay = w.day || w.dayOfWeek || '';
            return wDay.toLowerCase().startsWith(dayName.toLowerCase().slice(0, 3));
          });

          // Create workout if AI provided one for this day
          const workout: Workout | null = aiWorkout ? {
            id: `ai-workout-${Date.now()}-${index}`,
            name: aiWorkout.workoutType || aiWorkout.name || 'Training Session',
            type: aiWorkout.workoutType || 'strength',
            duration: aiWorkout.duration || 60,
            difficulty: preferences.difficultyLevel || 'intermediate' as DifficultyLevel,
            estimatedCaloriesBurned: aiWorkout.duration ? Math.round(aiWorkout.duration * 8) : 400,
            exercises: (aiWorkout.exercises || []).map((ex: any, exIndex: number) => ({
              id: `ai-ex-${Date.now()}-${index}-${exIndex}`,
              exerciseId: `ai-ex-${Date.now()}-${index}-${exIndex}`,
              exercise: {
                id: `ai-ex-${Date.now()}-${index}-${exIndex}`,
                name: ex.name || 'Exercise',
                category: 'Strength',
                muscleGroups: [],
                primaryMuscles: [],
                secondaryMuscles: [],
                equipment: [],
                difficulty: 'intermediate' as DifficultyLevel,
                instructions: [],
              },
              sets: ex.sets || 3,
              reps: ex.reps || '10',
              restSeconds: ex.restSeconds || 60,
              notes: ex.notes || '',
              isCompleted: false,
              weight: undefined,
            })),
            isCompleted: false,
          } : null;

          return {
            id: `day-${dateStr}`,
            dayOfWeek: dayName,
            dayNumber: index + 1,
            date: dateStr,
            workout,
            isRestDay: !workout,
            completed: false,
          };
        });

        // Calculate totals
        const totalWorkouts = days.filter(d => d.workout !== null).length;
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        // Create properly structured WeeklyTrainingPlan
        const weeklyPlan: WeeklyTrainingPlan = {
          id: `plan-${Date.now()}`,
          weekNumber: 1,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days,
          totalWorkouts,
          completedWorkouts: 0,
          totalCaloriesBurned: 0,
          focusAreas: [],
        };

        // Create a basic program reference
        const program: ProgramTemplate = {
          id: 'ai-generated',
          name: 'AI-Powered Workout Plan',
          description: aiPlan.progressionGuidelines || 'Personalized AI workout plan',
          difficulty: preferences.difficultyLevel || 'intermediate',
          duration: 4,
          daysPerWeek: preferences.workoutsPerWeek || 3,
          goal: preferences.fitnessGoal || 'general_fitness',
          muscleGroups: [],
          equipment: [],
        };

        // Calculate goal alignment
        console.log('[Training] Calculating goal alignment...');
        const alignment = trainingService.calculateGoalAlignment(preferences, weeklyPlan);

        // Get plan summary
        const summary = trainingService.getPlanSummary(weeklyPlan, preferences);

        // Use dayOfWeek already calculated above for todayIndex
        const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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

        // Cache the plan
        console.log('[Training] Caching AI plan...');
        await trainingStorage.savePlanCache({
          weeklyPlan,
          selectedProgram: program,
          goalAlignment: alignment,
          currentWeek: state.currentWeek,
          lastGeneratedAt,
          preferences,
          planSummary: summary,
        });

        // *** Sync AI workout plan to backend ***
        try {
          console.log('[Training] 🔄 Syncing AI workout plan to backend...');
          const syncSuccess = await api.saveWorkoutPlan(
            { weeklyPlan, preferences, summary, lastGeneratedAt },
            program.id,
            program.name
          );
          if (syncSuccess) {
            console.log('[Training] ✅ AI workout plan synced to backend');
          } else {
            console.warn('[Training] ⚠️ Backend sync failed - AI plan saved locally');
          }
        } catch (syncError) {
          console.error('[Training] ❌ Backend sync error:', syncError);
        }

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: 'Failed to generate AI workout plan',
        }));
        return false;
      }
    } catch (error) {
      console.error('[Training] AI workout generation failed:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'AI workout generation failed',
      }));
      return false;
    }
  }, [buildPreferencesFromGoals, state.currentWeek]);

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
  const markWorkoutComplete = useCallback(async (dayIndex: number) => {
    let workoutToSync: any = null;

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

        const completedAt = new Date().toISOString();

        updatedDays[dayIndex] = {
          ...day,
          completed: true,
          workout: {
            ...day.workout,
            exercises: updatedExercises,
            completed: true,
            completedAt,
          },
        };

        // Capture workout data for backend sync
        workoutToSync = {
          sessionName: day.workout.name,
          workoutType: day.workout.type,
          durationMinutes: day.workout.duration || 0,
          caloriesBurned: day.workout.estimatedCaloriesBurned || 0,
          exercises: updatedExercises.map(ex => ({
            name: ex.exercise?.name || 'Unknown',
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
          })),
          completedAt,
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

      // Save to local storage
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

    // *** NEW: Sync completed workout to backend ***
    if (workoutToSync) {
      try {
        console.log('[Training] 🔄 Syncing workout completion to backend...');
        const syncSuccess = await api.logWorkout(workoutToSync);
        if (syncSuccess) {
          console.log('[Training] ✅ Workout synced to backend successfully!');
        } else {
          console.warn('[Training] ⚠️ Backend sync failed - workout saved locally only');
        }
      } catch (syncError) {
        console.error('[Training] ❌ Backend sync error:', syncError);
      }
    }
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

  // Load cached plan (local first, then backend fallback)
  const loadCachedPlan = useCallback(async () => {
    try {
      // First try local storage
      const cached = await trainingStorage.loadPlanCache();
      if (cached) {
        console.log('[Training] ✅ Loaded plan from local cache');
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
        return;
      }

      // No local cache - try backend
      console.log('[Training] 🔄 No local cache, checking backend...');
      const backendPlan = await api.getWorkoutPlan();
      if (backendPlan && backendPlan.planData) {
        console.log('[Training] ✅ Loaded plan from backend');
        const { planData, programId, programName } = backendPlan;

        // Find matching program or create a placeholder
        const programs = getEnhancedPrograms();
        const matchedProgram = programs.find(p => p.id === programId) ||
          (programId ? { id: programId, name: programName || 'Saved Plan' } : null);

        setState(prev => ({
          ...prev,
          weeklyPlan: planData.weeklyPlan || null,
          selectedProgram: matchedProgram,
          preferences: planData.preferences || null,
          planSummary: planData.summary || null,
          lastGeneratedAt: planData.lastGeneratedAt,
        }));

        // Cache locally for future use
        if (planData.weeklyPlan) {
          await trainingStorage.savePlanCache({
            weeklyPlan: planData.weeklyPlan,
            selectedProgram: matchedProgram,
            preferences: planData.preferences,
            planSummary: planData.summary,
            lastGeneratedAt: planData.lastGeneratedAt,
          });
          console.log('[Training] ✅ Cached backend plan locally');
        }
      } else {
        console.log('[Training] No plan found (local or backend)');
      }
    } catch (error) {
      console.error('[Training] Error loading cached training plan:', error);
    }
  }, [getEnhancedPrograms]);

  // Check if plan exists
  const hasPlan = useCallback((): boolean => {
    return state.weeklyPlan !== null;
  }, [state.weeklyPlan]);

  // Get plan summary
  const getPlanSummary = useCallback((): PlanSummary | null => {
    return state.planSummary;
  }, [state.planSummary]);

  // Load cached data on mount and sync PRs from backend
  useEffect(() => {
    loadCachedPlan();

    // Sync personal records from backend (in case user logged weights on another device)
    weightTrackingStorage.syncPersonalRecordsFromBackend().catch(err => {
      console.log('[Training] PR sync from backend failed (non-critical):', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount

  // Check if goals changed and plan should be regenerated
  // Use a ref to track whether we've already checked to avoid repeated checks
  const goalCheckRef = useRef<string | null>(null);
  useEffect(() => {
    const checkGoalChanges = async () => {
      if (goalWizardContext?.state && state.weeklyPlan) {
        // Create a stable hash of goal state to avoid repeated checks
        const goalHash = JSON.stringify({
          primaryGoal: goalWizardContext.state.primaryGoal,
          activityLevel: goalWizardContext.state.activityLevel,
          workoutsPerWeek: goalWizardContext.state.workoutsPerWeek,
        });

        // Skip if we already checked this goal state
        if (goalCheckRef.current === goalHash) {
          return;
        }
        goalCheckRef.current = goalHash;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalWizardContext?.state?.primaryGoal, goalWizardContext?.state?.activityLevel, goalWizardContext?.state?.workoutsPerWeek]);

  const value = useMemo<TrainingContextType>(() => ({
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
    generateAIWorkoutPlan,
  }), [
    state,
    generateWeeklyPlan,
    generateAIWorkoutPlan,
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
  ]);

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
