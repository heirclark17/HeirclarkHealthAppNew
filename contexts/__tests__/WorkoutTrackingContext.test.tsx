import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { WorkoutTrackingProvider, useWorkoutTracking } from '../WorkoutTrackingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

jest.mock('../../services/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkoutTrackingProvider>{children}</WorkoutTrackingProvider>
);

describe('WorkoutTrackingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();

    (api.logWorkout as jest.Mock).mockResolvedValue(true);
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useWorkoutTracking(), { wrapper });

    expect(result.current.state.workoutsThisWeek).toEqual([]);
    expect(result.current.state.currentStreak).toBe(0);
    expect(result.current.state.totalWorkoutsAllTime).toBe(0);
  });

  it('logs a workout', async () => {
    const { result } = renderHook(() => useWorkoutTracking(), { wrapper });

    const workout = {
      date: new Date().toISOString().split('T')[0],
      workoutType: 'Strength',
      workoutName: 'Upper Body',
      duration: 45,
      caloriesBurned: 350,
      exercisesCompleted: 8,
      totalExercises: 8,
    };

    await act(async () => {
      result.current.logWorkout(workout);
    });

    expect(result.current.state.workoutsThisWeek.length).toBe(1);
    expect(result.current.state.totalWorkoutsAllTime).toBe(1);
    expect(result.current.state.currentStreak).toBe(1);
    expect(api.logWorkout).toHaveBeenCalled();
  });

  it('increments streak on consecutive days', async () => {
    const { result } = renderHook(() => useWorkoutTracking(), { wrapper });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    await act(async () => {
      result.current.logWorkout({
        date: yesterdayStr,
        workoutType: 'Cardio',
        workoutName: 'Running',
        duration: 30,
        caloriesBurned: 250,
        exercisesCompleted: 1,
        totalExercises: 1,
      });
    });

    const today = new Date().toISOString().split('T')[0];

    await act(async () => {
      result.current.logWorkout({
        date: today,
        workoutType: 'Strength',
        workoutName: 'Leg Day',
        duration: 45,
        caloriesBurned: 350,
        exercisesCompleted: 6,
        totalExercises: 6,
      });
    });

    expect(result.current.state.currentStreak).toBe(2);
  });

  it('sets todays workout', () => {
    const { result } = renderHook(() => useWorkoutTracking(), { wrapper });

    act(() => {
      result.current.setTodaysWorkout({
        type: 'Upper Body',
        name: 'Push Day',
        isRestDay: false,
      });
    });

    expect(result.current.state.todaysWorkout).toEqual({
      type: 'Upper Body',
      name: 'Push Day',
      isRestDay: false,
      isCompleted: false,
    });
  });

  it('gets weekly workout count', async () => {
    const { result } = renderHook(() => useWorkoutTracking(), { wrapper });

    const today = new Date().toISOString().split('T')[0];

    await act(async () => {
      result.current.logWorkout({
        date: today,
        workoutType: 'Strength',
        workoutName: 'Workout 1',
        duration: 45,
        caloriesBurned: 350,
        exercisesCompleted: 5,
        totalExercises: 5,
      });

      result.current.logWorkout({
        date: today,
        workoutType: 'Cardio',
        workoutName: 'Workout 2',
        duration: 30,
        caloriesBurned: 200,
        exercisesCompleted: 1,
        totalExercises: 1,
      });
    });

    expect(result.current.getWeeklyWorkoutCount()).toBe(2);
  });

  it('persists state to AsyncStorage', async () => {
    const { result } = renderHook(() => useWorkoutTracking(), { wrapper });

    const workout = {
      date: new Date().toISOString().split('T')[0],
      workoutType: 'Strength',
      workoutName: 'Test',
      duration: 30,
      caloriesBurned: 200,
      exercisesCompleted: 3,
      totalExercises: 3,
    };

    await act(async () => {
      result.current.logWorkout(workout);
    });

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('hc_workout_tracking_state');
      expect(stored).toBeTruthy();
    });
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useWorkoutTracking());
    }).toThrow('useWorkoutTracking must be used within a WorkoutTrackingProvider');
  });
});
