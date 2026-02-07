import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { GoalWizardProvider, useGoalWizard } from '../GoalWizardContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the api module at the module level
jest.mock('../../services/api', () => ({
  api: {
    updateProfile: jest.fn(),
    updateGoals: jest.fn(),
    updatePreferences: jest.fn(),
    getPreferences: jest.fn(),
  },
}));

// Import api after mocking
import { api } from '../../services/api';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GoalWizardProvider>{children}</GoalWizardProvider>
);

describe('GoalWizardContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();

    // Default API mocks
    (api.updateProfile as jest.Mock).mockResolvedValue(true);
    (api.updateGoals as jest.Mock).mockResolvedValue(true);
    (api.updatePreferences as jest.Mock).mockResolvedValue(true);
    (api.getPreferences as jest.Mock).mockResolvedValue(null);
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.primaryGoal).toBeNull();
    expect(result.current.state.currentWeight).toBe(180);
    expect(result.current.state.weightUnit).toBe('lb');
    expect(result.current.state.isComplete).toBe(false);
  });

  it('navigates to next step', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.currentStep).toBe(2);

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.currentStep).toBe(3);
  });

  it('navigates to previous step', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.nextStep();
      result.current.nextStep();
    });

    expect(result.current.state.currentStep).toBe(3);

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.state.currentStep).toBe(2);
  });

  it('does not go below step 1', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.state.currentStep).toBe(1);
  });

  it('sets primary goal', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setPrimaryGoal('lose_weight');
    });

    expect(result.current.state.primaryGoal).toBe('lose_weight');
  });

  it('sets weight values', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setCurrentWeight(200);
      result.current.setTargetWeight(180);
    });

    expect(result.current.state.currentWeight).toBe(200);
    expect(result.current.state.targetWeight).toBe(180);
  });

  it('converts weight units from lb to kg', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    expect(result.current.state.weightUnit).toBe('lb');
    expect(result.current.state.currentWeight).toBe(180);

    act(() => {
      result.current.setWeightUnit('kg');
    });

    expect(result.current.state.weightUnit).toBe('kg');
    expect(result.current.state.currentWeight).toBeCloseTo(82, 0);
  });

  it('converts weight units from kg to lb', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setWeightUnit('kg');
    });

    expect(result.current.state.currentWeight).toBeCloseTo(82, 0);

    act(() => {
      result.current.setWeightUnit('lb');
    });

    expect(result.current.state.weightUnit).toBe('lb');
    expect(result.current.state.currentWeight).toBeCloseTo(180, 0);
  });

  it('converts height units from ft/in to cm', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    expect(result.current.state.heightUnit).toBe('ft_in');
    expect(result.current.state.heightFt).toBe(5);
    expect(result.current.state.heightIn).toBe(10);

    act(() => {
      result.current.setHeightUnit('cm');
    });

    expect(result.current.state.heightUnit).toBe('cm');
    expect(result.current.state.heightCm).toBeCloseTo(178, 0);
  });

  it('sets activity level and fitness level', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setActivityLevel('active');
      result.current.setFitnessLevel('advanced');
    });

    expect(result.current.state.activityLevel).toBe('active');
    expect(result.current.state.fitnessLevel).toBe('advanced');
  });

  it('sets cardio preference', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setCardioPreference('running');
    });

    expect(result.current.state.cardioPreference).toBe('running');
  });

  it('sets diet style and meals per day', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setDietStyle('keto');
      result.current.setMealsPerDay(4);
    });

    expect(result.current.state.dietStyle).toBe('keto');
    expect(result.current.state.mealsPerDay).toBe(4);
  });

  it('toggles allergies', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    expect(result.current.state.allergies).toEqual([]);

    act(() => {
      result.current.toggleAllergy('peanuts');
    });

    expect(result.current.state.allergies).toEqual(['peanuts']);

    act(() => {
      result.current.toggleAllergy('dairy');
    });

    expect(result.current.state.allergies).toEqual(['peanuts', 'dairy']);

    act(() => {
      result.current.toggleAllergy('peanuts');
    });

    expect(result.current.state.allergies).toEqual(['dairy']);
  });

  it('toggles available equipment', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    expect(result.current.state.availableEquipment).toEqual(['bodyweight']);

    act(() => {
      result.current.toggleEquipment('dumbbells');
    });

    expect(result.current.state.availableEquipment).toContain('dumbbells');

    act(() => {
      result.current.toggleEquipment('dumbbells');
    });

    expect(result.current.state.availableEquipment).not.toContain('dumbbells');
  });

  it('calculates results', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setPrimaryGoal('lose_weight');
      result.current.setCurrentWeight(200);
      result.current.setTargetWeight(180);
      result.current.setAge(30);
      result.current.setSex('male');
      result.current.calculateResults();
    });

    expect(result.current.state.results).toBeTruthy();
    expect(result.current.state.results?.calories).toBeGreaterThan(0);
  });

  it('saves goals successfully', async () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setPrimaryGoal('lose_weight');
      result.current.calculateResults();
    });

    let saveResult: boolean = false;
    await act(async () => {
      saveResult = await result.current.saveGoals();
    });

    expect(saveResult).toBe(true);
    expect(result.current.state.isComplete).toBe(true);
    expect(api.updateProfile).toHaveBeenCalled();
    expect(api.updateGoals).toHaveBeenCalled();
    expect(api.updatePreferences).toHaveBeenCalled();
  });

  it('persists state to AsyncStorage', async () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setPrimaryGoal('build_muscle');
      result.current.setCurrentWeight(170);
    });

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('hc_goal_wizard_progress');
      expect(stored).toBeTruthy();
    });
  });

  it('adjusts macros for keto diet', () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setPrimaryGoal('lose_weight');
      result.current.setDietStyle('keto');
      result.current.calculateResults();
    });

    expect(result.current.state.results).toBeTruthy();
    const results = result.current.state.results!;

    // Keto should have high fat, low carbs
    const fatCalories = results.fat * 9;
    const totalCalories = results.calories;
    const fatPercentage = (fatCalories / totalCalories) * 100;

    expect(fatPercentage).toBeGreaterThan(60);
  });

  it('resets wizard', async () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    act(() => {
      result.current.setPrimaryGoal('build_muscle');
      result.current.setCurrentWeight(200);
    });

    await act(async () => {
      result.current.resetWizard();
    });

    expect(result.current.state.primaryGoal).toBeNull();
    expect(result.current.state.currentWeight).toBe(180);
    expect(result.current.state.currentStep).toBe(1);
  });

  it('starts editing after completion', async () => {
    const { result } = renderHook(() => useGoalWizard(), { wrapper });

    await waitFor(() => {
      expect(result.current.state).toBeDefined();
    });

    // First complete the wizard properly
    act(() => {
      result.current.setPrimaryGoal('lose_weight');
      result.current.calculateResults();
    });

    await act(async () => {
      await result.current.saveGoals();
    });

    // Now start editing
    act(() => {
      result.current.startEditing();
    });

    expect(result.current.state.isComplete).toBe(false);
    expect(result.current.state.currentStep).toBe(1);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useGoalWizard());
    }).toThrow('useGoalWizard must be used within a GoalWizardProvider');
  });
});
