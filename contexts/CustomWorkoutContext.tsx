import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio';
  sets?: number;
  reps?: string;
  rest?: string;
  duration?: string;
  distance?: string;
  intensity?: string;
  equipment?: string;
  bodyPart?: string;
  target?: string;
  gifUrl?: string;
}

export interface WorkoutDay {
  dayName: string;
  exercises: Exercise[];
}

export interface WorkoutStructure {
  days: WorkoutDay[];
}

export interface CustomWorkout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  workout_structure: WorkoutStructure;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface CustomWorkoutState {
  customWorkouts: CustomWorkout[];
  currentWorkout: CustomWorkout | null;
  isBuilding: boolean;
  selectedExercises: Exercise[];
  isLoading: boolean;
  error: string | null;
}

interface CustomWorkoutContextType {
  state: CustomWorkoutState;
  startNewWorkout: (name?: string, description?: string) => void;
  addExercise: (exercise: Exercise, dayIndex: number) => void;
  removeExercise: (exerciseId: string, dayIndex: number) => void;
  updateExercise: (exerciseId: string, dayIndex: number, updates: Partial<Exercise>) => void;
  addDay: (dayName?: string) => void;
  removeDay: (dayIndex: number) => void;
  updateDayName: (dayIndex: number, newName: string) => void;
  saveCustomWorkout: () => Promise<boolean>;
  loadCustomWorkouts: () => Promise<void>;
  activateWorkout: (workoutId: string) => Promise<boolean>;
  deleteWorkout: (workoutId: string) => Promise<boolean>;
  editWorkout: (workout: CustomWorkout) => void;
  cancelBuilding: () => void;
  updateWorkoutMetadata: (name: string, description?: string) => void;
}

// ============================================
// CONTEXT CREATION
// ============================================

const CustomWorkoutContext = createContext<CustomWorkoutContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

export const CustomWorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CustomWorkoutState>({
    customWorkouts: [],
    currentWorkout: null,
    isBuilding: false,
    selectedExercises: [],
    isLoading: false,
    error: null,
  });

  // ============================================
  // INITIALIZATION - Load custom workouts on mount
  // ============================================
  useEffect(() => {
    loadCustomWorkouts();
  }, []);

  // ============================================
  // LOAD CUSTOM WORKOUTS (backend-first, local fallback)
  // ============================================
  const loadCustomWorkouts = useCallback(async () => {
    console.log('[CustomWorkout] Loading custom workouts...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Backend-first read
      const workouts = await api.getCustomWorkouts();
      if (workouts && workouts.length >= 0) {
        console.log(`[CustomWorkout] ✅ Loaded ${workouts.length} workouts from backend`);
        setState(prev => ({
          ...prev,
          customWorkouts: workouts,
          isLoading: false,
        }));
        // Save to local storage
        await AsyncStorage.setItem('customWorkouts', JSON.stringify(workouts));
        return;
      }
    } catch (error) {
      console.error('[CustomWorkout] API fetch error:', error);
    }

    // Fallback to local storage
    try {
      const localData = await AsyncStorage.getItem('customWorkouts');
      if (localData) {
        const workouts = JSON.parse(localData);
        console.log(`[CustomWorkout] Loaded ${workouts.length} workouts from local storage`);
        setState(prev => ({
          ...prev,
          customWorkouts: workouts,
          isLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('[CustomWorkout] Local storage read error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load custom workouts',
      }));
    }
  }, []);

  // ============================================
  // START NEW WORKOUT
  // ============================================
  const startNewWorkout = useCallback((name?: string, description?: string) => {
    console.log('[CustomWorkout] Starting new workout builder');
    const newWorkout: CustomWorkout = {
      id: `temp_${Date.now()}`, // Temporary ID until saved
      user_id: '', // Will be set by backend
      name: name || 'New Workout',
      description: description || '',
      workout_structure: {
        days: [
          {
            dayName: 'Day 1',
            exercises: [],
          },
        ],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: false,
    };

    setState(prev => ({
      ...prev,
      currentWorkout: newWorkout,
      isBuilding: true,
      error: null,
    }));
  }, []);

  // ============================================
  // UPDATE WORKOUT METADATA (name, description)
  // ============================================
  const updateWorkoutMetadata = useCallback((name: string, description?: string) => {
    setState(prev => {
      if (!prev.currentWorkout) return prev;
      return {
        ...prev,
        currentWorkout: {
          ...prev.currentWorkout,
          name,
          description: description || '',
          updated_at: new Date().toISOString(),
        },
      };
    });
  }, []);

  // ============================================
  // ADD DAY
  // ============================================
  const addDay = useCallback((dayName?: string) => {
    setState(prev => {
      if (!prev.currentWorkout) return prev;

      const dayCount = prev.currentWorkout.workout_structure.days.length;
      const newDay: WorkoutDay = {
        dayName: dayName || `Day ${dayCount + 1}`,
        exercises: [],
      };

      return {
        ...prev,
        currentWorkout: {
          ...prev.currentWorkout,
          workout_structure: {
            days: [...prev.currentWorkout.workout_structure.days, newDay],
          },
          updated_at: new Date().toISOString(),
        },
      };
    });
    console.log('[CustomWorkout] Added new day');
  }, []);

  // ============================================
  // REMOVE DAY
  // ============================================
  const removeDay = useCallback((dayIndex: number) => {
    setState(prev => {
      if (!prev.currentWorkout) return prev;

      const days = [...prev.currentWorkout.workout_structure.days];
      days.splice(dayIndex, 1);

      return {
        ...prev,
        currentWorkout: {
          ...prev.currentWorkout,
          workout_structure: { days },
          updated_at: new Date().toISOString(),
        },
      };
    });
    console.log(`[CustomWorkout] Removed day at index ${dayIndex}`);
  }, []);

  // ============================================
  // UPDATE DAY NAME
  // ============================================
  const updateDayName = useCallback((dayIndex: number, newName: string) => {
    setState(prev => {
      if (!prev.currentWorkout) return prev;

      const days = [...prev.currentWorkout.workout_structure.days];
      days[dayIndex] = { ...days[dayIndex], dayName: newName };

      return {
        ...prev,
        currentWorkout: {
          ...prev.currentWorkout,
          workout_structure: { days },
          updated_at: new Date().toISOString(),
        },
      };
    });
  }, []);

  // ============================================
  // ADD EXERCISE TO DAY
  // ============================================
  const addExercise = useCallback((exercise: Exercise, dayIndex: number) => {
    setState(prev => {
      if (!prev.currentWorkout) return prev;

      const days = [...prev.currentWorkout.workout_structure.days];
      const day = { ...days[dayIndex] };

      // Add default sets/reps if not provided
      const exerciseWithDefaults: Exercise = {
        ...exercise,
        sets: exercise.sets || (exercise.type === 'strength' ? 3 : undefined),
        reps: exercise.reps || (exercise.type === 'strength' ? '8-12' : undefined),
        rest: exercise.rest || (exercise.type === 'strength' ? '60s' : undefined),
        duration: exercise.duration || (exercise.type === 'cardio' ? '20 min' : undefined),
        intensity: exercise.intensity || (exercise.type === 'cardio' ? 'Moderate' : undefined),
      };

      day.exercises = [...day.exercises, exerciseWithDefaults];
      days[dayIndex] = day;

      return {
        ...prev,
        currentWorkout: {
          ...prev.currentWorkout,
          workout_structure: { days },
          updated_at: new Date().toISOString(),
        },
      };
    });
    console.log(`[CustomWorkout] Added exercise "${exercise.name}" to day ${dayIndex}`);
  }, []);

  // ============================================
  // REMOVE EXERCISE FROM DAY
  // ============================================
  const removeExercise = useCallback((exerciseId: string, dayIndex: number) => {
    setState(prev => {
      if (!prev.currentWorkout) return prev;

      const days = [...prev.currentWorkout.workout_structure.days];
      const day = { ...days[dayIndex] };
      day.exercises = day.exercises.filter(ex => ex.id !== exerciseId);
      days[dayIndex] = day;

      return {
        ...prev,
        currentWorkout: {
          ...prev.currentWorkout,
          workout_structure: { days },
          updated_at: new Date().toISOString(),
        },
      };
    });
    console.log(`[CustomWorkout] Removed exercise ${exerciseId} from day ${dayIndex}`);
  }, []);

  // ============================================
  // UPDATE EXERCISE (sets, reps, rest, etc.)
  // ============================================
  const updateExercise = useCallback(
    (exerciseId: string, dayIndex: number, updates: Partial<Exercise>) => {
      setState(prev => {
        if (!prev.currentWorkout) return prev;

        const days = [...prev.currentWorkout.workout_structure.days];
        const day = { ...days[dayIndex] };
        day.exercises = day.exercises.map(ex =>
          ex.id === exerciseId ? { ...ex, ...updates } : ex
        );
        days[dayIndex] = day;

        return {
          ...prev,
          currentWorkout: {
            ...prev.currentWorkout,
            workout_structure: { days },
            updated_at: new Date().toISOString(),
          },
        };
      });
      console.log(`[CustomWorkout] Updated exercise ${exerciseId} in day ${dayIndex}`);
    },
    []
  );

  // ============================================
  // SAVE CUSTOM WORKOUT
  // ============================================
  const saveCustomWorkout = useCallback(async (): Promise<boolean> => {
    if (!state.currentWorkout) {
      console.error('[CustomWorkout] No current workout to save');
      setState(prev => ({ ...prev, error: 'No workout to save' }));
      return false;
    }

    // Validation
    if (!state.currentWorkout.name || state.currentWorkout.name.trim() === '') {
      console.error('[CustomWorkout] Workout name is required');
      setState(prev => ({ ...prev, error: 'Workout name is required' }));
      return false;
    }

    if (state.currentWorkout.workout_structure.days.length === 0) {
      console.error('[CustomWorkout] At least one day is required');
      setState(prev => ({ ...prev, error: 'At least one day is required' }));
      return false;
    }

    const hasExercises = state.currentWorkout.workout_structure.days.some(
      day => day.exercises.length > 0
    );
    if (!hasExercises) {
      console.error('[CustomWorkout] At least one exercise is required');
      setState(prev => ({ ...prev, error: 'At least one exercise is required' }));
      return false;
    }

    console.log('[CustomWorkout] Saving custom workout:', state.currentWorkout.name);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const isEditing = !state.currentWorkout.id.startsWith('temp_');

      let savedWorkout: CustomWorkout | null = null;

      if (isEditing) {
        // Update existing workout
        savedWorkout = await api.updateCustomWorkout(state.currentWorkout.id, {
          name: state.currentWorkout.name,
          description: state.currentWorkout.description,
          workout_structure: state.currentWorkout.workout_structure,
        });
      } else {
        // Create new workout
        savedWorkout = await api.createCustomWorkout({
          name: state.currentWorkout.name,
          description: state.currentWorkout.description,
          workout_structure: state.currentWorkout.workout_structure,
        });
      }

      if (savedWorkout) {
        console.log('[CustomWorkout] ✅ Workout saved successfully');

        // Update local state
        setState(prev => {
          const updatedWorkouts = isEditing
            ? prev.customWorkouts.map(w => (w.id === savedWorkout!.id ? savedWorkout! : w))
            : [...prev.customWorkouts, savedWorkout!];

          // Save to AsyncStorage
          AsyncStorage.setItem('customWorkouts', JSON.stringify(updatedWorkouts)).catch(err =>
            console.error('[CustomWorkout] AsyncStorage save error:', err)
          );

          return {
            ...prev,
            customWorkouts: updatedWorkouts,
            currentWorkout: null,
            isBuilding: false,
            isLoading: false,
          };
        });

        return true;
      } else {
        throw new Error('Failed to save workout');
      }
    } catch (error) {
      console.error('[CustomWorkout] Save error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to save custom workout',
      }));
      return false;
    }
  }, [state.currentWorkout]);

  // ============================================
  // ACTIVATE WORKOUT (set as current active workout)
  // ============================================
  const activateWorkout = useCallback(async (workoutId: string): Promise<boolean> => {
    console.log('[CustomWorkout] Activating workout:', workoutId);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await api.activateCustomWorkout(workoutId);

      if (result) {
        console.log('[CustomWorkout] ✅ Workout activated successfully');

        // Update local state - deactivate all others, activate this one
        setState(prev => {
          const updatedWorkouts = prev.customWorkouts.map(w => ({
            ...w,
            is_active: w.id === workoutId,
          }));

          // Save to AsyncStorage
          AsyncStorage.setItem('customWorkouts', JSON.stringify(updatedWorkouts)).catch(err =>
            console.error('[CustomWorkout] AsyncStorage save error:', err)
          );

          return {
            ...prev,
            customWorkouts: updatedWorkouts,
            isLoading: false,
          };
        });

        return true;
      } else {
        throw new Error('Failed to activate workout');
      }
    } catch (error) {
      console.error('[CustomWorkout] Activate error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to activate workout',
      }));
      return false;
    }
  }, []);

  // ============================================
  // DELETE WORKOUT
  // ============================================
  const deleteWorkout = useCallback(async (workoutId: string): Promise<boolean> => {
    console.log('[CustomWorkout] Deleting workout:', workoutId);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await api.deleteCustomWorkout(workoutId);

      console.log('[CustomWorkout] ✅ Workout deleted successfully');

      // Update local state
      setState(prev => {
        const updatedWorkouts = prev.customWorkouts.filter(w => w.id !== workoutId);

        // Save to AsyncStorage
        AsyncStorage.setItem('customWorkouts', JSON.stringify(updatedWorkouts)).catch(err =>
          console.error('[CustomWorkout] AsyncStorage save error:', err)
        );

        return {
          ...prev,
          customWorkouts: updatedWorkouts,
          isLoading: false,
        };
      });

      return true;
    } catch (error) {
      console.error('[CustomWorkout] Delete error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to delete workout',
      }));
      return false;
    }
  }, []);

  // ============================================
  // EDIT WORKOUT (load into builder)
  // ============================================
  const editWorkout = useCallback((workout: CustomWorkout) => {
    console.log('[CustomWorkout] Editing workout:', workout.name);
    setState(prev => ({
      ...prev,
      currentWorkout: { ...workout },
      isBuilding: true,
      error: null,
    }));
  }, []);

  // ============================================
  // CANCEL BUILDING (discard current workout)
  // ============================================
  const cancelBuilding = useCallback(() => {
    console.log('[CustomWorkout] Canceling workout builder');
    setState(prev => ({
      ...prev,
      currentWorkout: null,
      isBuilding: false,
      error: null,
    }));
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value: CustomWorkoutContextType = {
    state,
    startNewWorkout,
    addExercise,
    removeExercise,
    updateExercise,
    addDay,
    removeDay,
    updateDayName,
    saveCustomWorkout,
    loadCustomWorkouts,
    activateWorkout,
    deleteWorkout,
    editWorkout,
    cancelBuilding,
    updateWorkoutMetadata,
  };

  return (
    <CustomWorkoutContext.Provider value={value}>
      {children}
    </CustomWorkoutContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================
export const useCustomWorkout = (): CustomWorkoutContextType => {
  const context = useContext(CustomWorkoutContext);
  if (!context) {
    throw new Error('useCustomWorkout must be used within CustomWorkoutProvider');
  }
  return context;
};
