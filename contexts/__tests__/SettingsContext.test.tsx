import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SettingsProvider, useSettings } from '../SettingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  AndroidImportance: { MAX: 5 },
  AndroidNotificationPriority: { HIGH: 1 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('SettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides default settings', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    expect(result.current.settings.liveAvatar).toBe(true);
    expect(result.current.settings.themeMode).toBe('dark');
    expect(result.current.settings.unitSystem).toBe('imperial');
    expect(result.current.settings.dailyWaterGoal).toBe(64);
  });

  it('toggles live avatar', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setLiveAvatar(false);
    });

    expect(result.current.settings.liveAvatar).toBe(false);

    act(() => {
      result.current.setLiveAvatar(true);
    });

    expect(result.current.settings.liveAvatar).toBe(true);
  });

  it('changes theme mode', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setThemeMode('light');
    });

    expect(result.current.settings.themeMode).toBe('light');
  });

  it('changes unit system and converts water goal', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    expect(result.current.settings.unitSystem).toBe('imperial');
    expect(result.current.settings.dailyWaterGoal).toBe(64);

    act(() => {
      result.current.setUnitSystem('metric');
    });

    expect(result.current.settings.unitSystem).toBe('metric');
    expect(result.current.settings.dailyWaterGoal).toBeGreaterThan(1000); // Should be in ml now
  });

  it('sets custom background URI', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    const testUri = 'file:///test/image.jpg';

    act(() => {
      result.current.setCustomBackgroundUri(testUri);
    });

    expect(result.current.settings.customBackgroundUri).toBe(testUri);
  });

  it('sets profile image URI', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    const testUri = 'file:///test/profile.jpg';

    act(() => {
      result.current.setProfileImageUri(testUri);
    });

    expect(result.current.settings.profileImageUri).toBe(testUri);
  });

  it('converts weight correctly', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    // Imperial to metric
    const kgWeight = result.current.convertWeight(220, 'imperial');
    expect(kgWeight).toBeCloseTo(100, 0);

    // Change to metric
    act(() => {
      result.current.setUnitSystem('metric');
    });

    // Metric to imperial
    const lbWeight = result.current.convertWeight(100, 'metric');
    expect(lbWeight).toBeCloseTo(220, 0);
  });

  it('returns correct units', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    expect(result.current.getWeightUnit()).toBe('lbs');
    expect(result.current.getWaterUnit()).toBe('oz');

    act(() => {
      result.current.setUnitSystem('metric');
    });

    expect(result.current.getWeightUnit()).toBe('kg');
    expect(result.current.getWaterUnit()).toBe('ml');
  });

  it('resets settings to defaults', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setThemeMode('light');
      result.current.setLiveAvatar(false);
    });

    expect(result.current.settings.themeMode).toBe('light');
    expect(result.current.settings.liveAvatar).toBe(false);

    act(() => {
      result.current.resetSettings();
    });

    expect(result.current.settings.themeMode).toBe('dark');
    expect(result.current.settings.liveAvatar).toBe(true);
  });

  it('persists settings to AsyncStorage', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setThemeMode('light');
    });

    // Wait for async save to complete
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('hc_app_settings');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.themeMode).toBe('light');
    }, { timeout: 3000 });
  });

  it('loads saved settings on mount', async () => {
    const savedSettings = {
      themeMode: 'light',
      liveAvatar: false,
      unitSystem: 'metric',
      dailyWaterGoal: 2000,
    };

    await AsyncStorage.setItem('hc_app_settings', JSON.stringify(savedSettings));

    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    expect(result.current.settings.themeMode).toBe('light');
    expect(result.current.settings.liveAvatar).toBe(false);
    expect(result.current.settings.unitSystem).toBe('metric');
  });

  it('sets captions and autoplay settings', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setCaptions(true);
      result.current.setAutoplayCoach(false);
    });

    expect(result.current.settings.captions).toBe(true);
    expect(result.current.settings.autoplayCoach).toBe(false);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useSettings());
    }).toThrow('useSettings must be used within a SettingsProvider');
  });
});
