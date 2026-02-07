import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { TrainingProvider, useTraining } from '../TrainingContext';
import { GoalWizardProvider } from '../GoalWizardContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

jest.mock('../../services/api');
jest.mock('../../services/aiService');

// Mock trainingService
jest.mock('../../services/trainingService', () => ({
  trainingService: {
    calculateGoalAlignment: jest.fn().mockReturnValue({}),
    getPlanSummary: jest.fn().mockReturnValue({}),
    getAllPrograms: jest.fn().mockReturnValue([]),
    getAllExercises: jest.fn().mockReturnValue([]),
  },
}));

// Mock planGenerator
jest.mock('../../services/planGenerator', () => ({
  planGenerator: {
    generateCompletePlan: jest.fn().mockReturnValue({
      weeklyPlan: { days: [] },
      program: { id: 'test', name: 'Test Program' },
      summary: {},
    }),
    getAllPrograms: jest.fn().mockReturnValue([]),
  },
}));

// Mock trainingStorage
jest.mock('../../services/trainingStorage', () => ({
  trainingStorage: {
    loadPlanCache: jest.fn().mockResolvedValue(null),
    savePlanCache: jest.fn().mockResolvedValue(undefined),
    clearPlan: jest.fn().mockResolvedValue(undefined),
    haveGoalsChanged: jest.fn().mockResolvedValue(false),
    updateGoalHash: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock weightTrackingStorage
jest.mock('../../services/weightTrackingStorage', () => ({
  weightTrackingStorage: {
    syncPersonalRecordsFromBackend: jest.fn().mockResolvedValue(undefined),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GoalWizardProvider>
    <TrainingProvider>{children}</TrainingProvider>
  </GoalWizardProvider>
);

describe('TrainingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();

    (api.saveWorkoutPlan as jest.Mock).mockResolvedValue(true);
    (api.saveTrainingState as jest.Mock).mockResolvedValue(true);
    (api.getWorkoutPlan as jest.Mock).mockResolvedValue(null);
  });

  it('provides initial state', async () => {
    const { result } = renderHook(() => useTraining(), { wrapper });

    expect(result.current.state.weeklyPlan).toBeNull();
    expect(result.current.state.isGenerating).toBe(false);
    expect(result.current.state.currentWeek).toBe(1);
  });

  it('checks if plan exists', () => {
    const { result } = renderHook(() => useTraining(), { wrapper });

    const hasPlan = result.current.hasPlan();
    expect(typeof hasPlan).toBe('boolean');
  });

  it('clears plan', () => {
    const { result } = renderHook(() => useTraining(), { wrapper });

    act(() => {
      result.current.clearPlan();
    });

    expect(result.current.state.weeklyPlan).toBeNull();
  });

  it('navigates weeks', () => {
    const { result } = renderHook(() => useTraining(), { wrapper });

    expect(result.current.state.currentWeek).toBe(1);

    act(() => {
      result.current.goToNextWeek();
    });

    expect(result.current.state.currentWeek).toBe(2);

    act(() => {
      result.current.goToPreviousWeek();
    });

    expect(result.current.state.currentWeek).toBe(1);
  });

  it('sets selected day', () => {
    const { result } = renderHook(() => useTraining(), { wrapper });

    act(() => {
      result.current.setSelectedDay(3);
    });

    expect(result.current.state.selectedDayIndex).toBe(3);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useTraining());
    }).toThrow('useTraining must be used within a TrainingProvider');
  });
});
