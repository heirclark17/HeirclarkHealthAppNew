import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { CalorieBankingProvider, useCalorieBanking } from '../CalorieBankingContext';
import { GoalWizardProvider } from '../GoalWizardContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the api module at the module level
jest.mock('../../services/api', () => ({
  api: {
    calculateCalorieBanking: jest.fn(),
    updateProfile: jest.fn(),
    updateGoals: jest.fn(),
    updatePreferences: jest.fn(),
    getPreferences: jest.fn(),
  },
}));

// Import api after mocking
import { api } from '../../services/api';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GoalWizardProvider>
    <CalorieBankingProvider>{children}</CalorieBankingProvider>
  </GoalWizardProvider>
);

describe('CalorieBankingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();

    // Mock all API methods used by CalorieBankingContext and GoalWizardContext
    (api.calculateCalorieBanking as jest.Mock).mockResolvedValue({});
    (api.updateProfile as jest.Mock).mockResolvedValue(true);
    (api.updateGoals as jest.Mock).mockResolvedValue(true);
    (api.updatePreferences as jest.Mock).mockResolvedValue(true);
    (api.getPreferences as jest.Mock).mockResolvedValue(null);
  });

  it('provides initial state', async () => {
    const { result } = renderHook(() => useCalorieBanking(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    expect(result.current.state.settings.isEnabled).toBe(true);
  });

  it('initializes a week', async () => {
    const { result } = renderHook(() => useCalorieBanking(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.initializeWeek();
    });

    expect(result.current.state.currentWeek).toBeTruthy();
  });

  it('gets recommendation', async () => {
    const { result } = renderHook(() => useCalorieBanking(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    let recommendation;
    await act(async () => {
      recommendation = await result.current.getRecommendation(1800);
    });

    expect(recommendation).toBeTruthy();
  });

  it('banks calories', async () => {
    const { result } = renderHook(() => useCalorieBanking(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.initializeWeek();
      await result.current.bankToday(200);
    });

    expect(result.current.state.currentWeek).toBeTruthy();
  });

  it('borrows calories', async () => {
    const { result } = renderHook(() => useCalorieBanking(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.initializeWeek();
      await result.current.borrowToday(200);
    });

    expect(result.current.state.currentWeek).toBeTruthy();
  });

  it('completes a day', async () => {
    const { result } = renderHook(() => useCalorieBanking(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.initializeWeek();
      await result.current.completeToday(1950);
    });

    expect(api.calculateCalorieBanking).toHaveBeenCalled();
  });

  it('updates settings', async () => {
    const { result } = renderHook(() => useCalorieBanking(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ isEnabled: false });
    });

    expect(result.current.state.settings.isEnabled).toBe(false);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useCalorieBanking());
    }).toThrow('useCalorieBanking must be used within a CalorieBankingProvider');
  });
});
