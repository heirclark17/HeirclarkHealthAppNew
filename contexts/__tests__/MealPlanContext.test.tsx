import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { MealPlanProvider, useMealPlan } from '../MealPlanContext';
import { GoalWizardProvider } from '../GoalWizardContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { mealPlanService } from '../../services/mealPlanService';

jest.mock('../../services/api');
jest.mock('../../services/mealPlanService');
jest.mock('../../services/instacartService');
jest.mock('../../services/aiService');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GoalWizardProvider>
    <MealPlanProvider>{children}</MealPlanProvider>
  </GoalWizardProvider>
);

describe('MealPlanContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();

    (api.getGoals as jest.Mock).mockResolvedValue({
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyCarbs: 200,
      dailyFat: 65,
    });
    (api.saveMealPlan as jest.Mock).mockResolvedValue(true);
    (api.getMealPlan as jest.Mock).mockResolvedValue(null);
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useMealPlan(), { wrapper });

    expect(result.current.state.weeklyPlan).toBeNull();
    expect(result.current.state.isGenerating).toBe(false);
    expect(result.current.state.selectedDayIndex).toBe(0);
  });

  it('generates meal plan successfully', async () => {
    const mockPlan = {
      success: true,
      weeklyPlan: [{ dayNumber: 1, meals: [] }],
      groceryList: [],
      weekSummary: { avgDailyCalories: 2000 },
    };

    (mealPlanService.generateMealPlan as jest.Mock).mockResolvedValue(mockPlan);

    const { result } = renderHook(() => useMealPlan(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.generateMealPlan();
    });

    expect(success).toBe(true);
    expect(result.current.state.weeklyPlan).toBeTruthy();
    expect(api.saveMealPlan).toHaveBeenCalled();
  });

  it('handles meal plan generation failure', async () => {
    (mealPlanService.generateMealPlan as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Generation failed',
    });

    const { result } = renderHook(() => useMealPlan(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.generateMealPlan();
    });

    expect(success).toBe(false);
    expect(result.current.state.error).toBeTruthy();
  });

  it('sets selected day', () => {
    const { result } = renderHook(() => useMealPlan(), { wrapper });

    act(() => {
      result.current.setSelectedDay(3);
    });

    expect(result.current.state.selectedDayIndex).toBe(3);
  });

  it('clears plan', () => {
    const { result } = renderHook(() => useMealPlan(), { wrapper });

    act(() => {
      result.current.clearPlan();
    });

    expect(result.current.state.weeklyPlan).toBeNull();
    expect(result.current.state.groceryList).toBeNull();
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useMealPlan());
    }).toThrow('useMealPlan must be used within a MealPlanProvider');
  });
});
