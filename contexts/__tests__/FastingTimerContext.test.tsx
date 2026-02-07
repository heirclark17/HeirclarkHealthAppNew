import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { FastingTimerProvider, useFastingTimer } from '../FastingTimerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

jest.mock('../../services/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FastingTimerProvider>{children}</FastingTimerProvider>
);

describe('FastingTimerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();

    (api.startFast as jest.Mock).mockResolvedValue(true);
    (api.endFast as jest.Mock).mockResolvedValue(true);
    (api.getCurrentFast as jest.Mock).mockResolvedValue(null);
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    expect(result.current.state.isActive).toBe(false);
    expect(result.current.state.selectedPreset).toBe('16:8');
    expect(result.current.state.currentStreak).toBe(0);
  });

  it('starts a fast', async () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    await act(async () => {
      await result.current.startFast();
    });

    expect(result.current.state.isActive).toBe(true);
    expect(result.current.state.currentState).toBe('fasting');
    expect(result.current.state.fastingStartTime).toBeTruthy();
    expect(api.startFast).toHaveBeenCalled();
  });

  it('pauses and resumes a fast', async () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    await act(async () => {
      await result.current.startFast();
    });

    act(() => {
      result.current.pauseFast();
    });

    expect(result.current.state.isPaused).toBe(true);

    act(() => {
      result.current.resumeFast();
    });

    expect(result.current.state.isPaused).toBe(false);
  });

  it('stops a fast', async () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    await act(async () => {
      await result.current.startFast();
    });

    await act(async () => {
      await result.current.stopFast();
    });

    expect(result.current.state.isActive).toBe(false);
    expect(result.current.state.currentState).toBe('idle');
    expect(api.endFast).toHaveBeenCalled();
  });

  it('changes preset', () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    act(() => {
      result.current.setPreset('18:6');
    });

    expect(result.current.state.selectedPreset).toBe('18:6');
  });

  it('calculates time remaining', async () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    await act(async () => {
      await result.current.startFast();
    });

    const timeRemaining = result.current.getTimeRemaining();
    expect(timeRemaining.totalSeconds).toBeGreaterThan(0);
  });

  it('calculates progress', async () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    await act(async () => {
      await result.current.startFast();
    });

    const progress = result.current.getProgress();
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it('returns correct fasting duration', () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    act(() => {
      result.current.setPreset('16:8');
    });

    expect(result.current.getFastingDuration()).toBe(16);

    act(() => {
      result.current.setPreset('18:6');
    });

    expect(result.current.getFastingDuration()).toBe(18);
  });

  it('sets custom eating window', () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    act(() => {
      result.current.setCustomWindow('10:00', '18:00');
    });

    expect(result.current.state.eatingWindowStart).toBe('10:00');
    expect(result.current.state.eatingWindowEnd).toBe('18:00');
  });

  it('persists state to AsyncStorage', async () => {
    const { result } = renderHook(() => useFastingTimer(), { wrapper });

    await act(async () => {
      await result.current.startFast();
    });

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('hc_fasting_timer_state');
      expect(stored).toBeTruthy();
    });
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useFastingTimer());
    }).toThrow('useFastingTimer must be used within a FastingTimerProvider');
  });
});
