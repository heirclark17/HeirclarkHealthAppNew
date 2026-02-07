import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SmartMealLoggerProvider, useSmartMealLogger } from '../SmartMealLoggerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

jest.mock('../../services/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SmartMealLoggerProvider>{children}</SmartMealLoggerProvider>
);

describe('SmartMealLoggerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();

    (api.logMeal as jest.Mock).mockResolvedValue(true);
  });

  it('provides initial state', async () => {
    const { result } = renderHook(() => useSmartMealLogger(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    expect(result.current.state.frequentMeals).toEqual([]);
  });

  it('gets current meal type', () => {
    const { result } = renderHook(() => useSmartMealLogger(), { wrapper });

    const mealType = result.current.getCurrentMealType();
    expect(['breakfast', 'lunch', 'dinner', 'snack']).toContain(mealType);
  });

  it('gets suggestions', async () => {
    const { result } = renderHook(() => useSmartMealLogger(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    const suggestions = result.current.getSuggestions();
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it('refreshes suggestions', async () => {
    const { result } = renderHook(() => useSmartMealLogger(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshSuggestions('breakfast');
    });

    expect(result.current.state.suggestions).toBeDefined();
  });

  it('logs a new meal', async () => {
    const { result } = renderHook(() => useSmartMealLogger(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    const meal = {
      name: 'Chicken Salad',
      calories: 350,
      protein: 30,
      carbs: 20,
      fat: 15,
      mealType: 'lunch' as const,
      source: 'manual' as const,
    };

    let frequentMeal;
    await act(async () => {
      frequentMeal = await result.current.logNewMeal(meal);
    });

    expect(frequentMeal).toBeTruthy();
  });

  it('gets insights', async () => {
    const { result } = renderHook(() => useSmartMealLogger(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    let insights;
    await act(async () => {
      insights = await result.current.getInsights();
    });

    expect(insights).toBeTruthy();
    expect(insights).toHaveProperty('totalMealsLogged');
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useSmartMealLogger());
    }).toThrow('useSmartMealLogger must be used within a SmartMealLoggerProvider');
  });
});
