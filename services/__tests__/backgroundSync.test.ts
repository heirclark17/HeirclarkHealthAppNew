/**
 * Tests for backgroundSync.ts
 * Background sync service for Apple Health data
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Mock appleHealthService
jest.mock('../appleHealthService', () => ({
  appleHealthService: {
    getTodayData: jest.fn(),
  },
}));

import { appleHealthService } from '../appleHealthService';
import {
  registerBackgroundSync,
  unregisterBackgroundSync,
  isBackgroundSyncRegistered,
  getLastSyncTime,
  triggerManualSync,
  getBackgroundFetchStatus,
} from '../backgroundSync';

// Helper to mock fetch
function mockFetch(data: any, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe('backgroundSync', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform });
  });

  // ============ registerBackgroundSync ============

  describe('registerBackgroundSync', () => {
    it('should return false when not on iOS', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'android' });

      const result = await registerBackgroundSync();

      expect(result).toBe(false);
      expect(BackgroundFetch.registerTaskAsync).not.toHaveBeenCalled();
    });

    it('should return false when background fetch is restricted', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
      (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(
        BackgroundFetch.BackgroundFetchStatus.Restricted
      );

      const result = await registerBackgroundSync();

      expect(result).toBe(false);
    });

    it('should return false when background fetch is denied', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
      (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(
        BackgroundFetch.BackgroundFetchStatus.Denied
      );

      const result = await registerBackgroundSync();

      expect(result).toBe(false);
    });

    it('should register task and return true when available', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
      (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(
        BackgroundFetch.BackgroundFetchStatus.Available
      );

      const result = await registerBackgroundSync();

      expect(result).toBe(true);
      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
        'HEIRCLARK_HEALTH_SYNC',
        expect.objectContaining({
          minimumInterval: 15 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        })
      );
    });

    it('should return false on registration error', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
      (BackgroundFetch.getStatusAsync as jest.Mock).mockRejectedValue(
        new Error('Registration failed')
      );

      const result = await registerBackgroundSync();

      expect(result).toBe(false);
    });
  });

  // ============ unregisterBackgroundSync ============

  describe('unregisterBackgroundSync', () => {
    it('should unregister task when registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValue(true);

      await unregisterBackgroundSync();

      expect(BackgroundFetch.unregisterTaskAsync).toHaveBeenCalledWith('HEIRCLARK_HEALTH_SYNC');
    });

    it('should not unregister when task is not registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValue(false);

      await unregisterBackgroundSync();

      expect(BackgroundFetch.unregisterTaskAsync).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockRejectedValue(
        new Error('Check failed')
      );

      // Should not throw
      await expect(unregisterBackgroundSync()).resolves.toBeUndefined();
    });
  });

  // ============ isBackgroundSyncRegistered ============

  describe('isBackgroundSyncRegistered', () => {
    it('should return true when task is registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValue(true);

      const result = await isBackgroundSyncRegistered();

      expect(result).toBe(true);
      expect(TaskManager.isTaskRegisteredAsync).toHaveBeenCalledWith('HEIRCLARK_HEALTH_SYNC');
    });

    it('should return false when task is not registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValue(false);

      const result = await isBackgroundSyncRegistered();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockRejectedValue(
        new Error('Error')
      );

      const result = await isBackgroundSyncRegistered();

      expect(result).toBe(false);
    });
  });

  // ============ getLastSyncTime ============

  describe('getLastSyncTime', () => {
    it('should return sync time from secure store', async () => {
      const syncTime = '2025-01-15T12:00:00.000Z';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(syncTime);

      const result = await getLastSyncTime();

      expect(result).toBe(syncTime);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('@heirclark_last_sync');
    });

    it('should return null when no sync time stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await getLastSyncTime();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Keychain error'));

      const result = await getLastSyncTime();

      expect(result).toBeNull();
    });
  });

  // ============ triggerManualSync ============

  describe('triggerManualSync', () => {
    it('should sync health data and return true on success', async () => {
      const mockHealthData = {
        steps: 8000,
        activeCalories: 350,
        restingEnergy: 1500,
        totalCaloriesOut: 1850,
        caloriesOut: 1850,
        distance: 3.5,
        workouts: [{ activityName: 'Running' }],
        date: '2025-01-15',
      };

      (appleHealthService.getTodayData as jest.Mock).mockResolvedValue(mockHealthData);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('auth-token-123');
      mockFetch({ success: true });

      const result = await triggerManualSync();

      expect(result).toBe(true);
      expect(appleHealthService.getTodayData).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/health/ingest-simple'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer auth-token-123',
          }),
        })
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        '@heirclark_last_sync',
        expect.any(String)
      );
    });

    it('should return false when no health data available', async () => {
      (appleHealthService.getTodayData as jest.Mock).mockResolvedValue(null);

      const result = await triggerManualSync();

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false when no auth token', async () => {
      const mockHealthData = {
        steps: 8000,
        activeCalories: 350,
        restingEnergy: 1500,
        totalCaloriesOut: 1850,
        caloriesOut: 1850,
        distance: 3.5,
        workouts: [],
        date: '2025-01-15',
      };

      (appleHealthService.getTodayData as jest.Mock).mockResolvedValue(mockHealthData);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await triggerManualSync();

      expect(result).toBe(false);
    });

    it('should return false when backend returns error', async () => {
      const mockHealthData = {
        steps: 8000,
        activeCalories: 350,
        restingEnergy: 1500,
        totalCaloriesOut: 1850,
        caloriesOut: 1850,
        distance: 3.5,
        workouts: [],
        date: '2025-01-15',
      };

      (appleHealthService.getTodayData as jest.Mock).mockResolvedValue(mockHealthData);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('auth-token');
      mockFetch({ error: 'Server error' }, false, 500);

      const result = await triggerManualSync();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      (appleHealthService.getTodayData as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await triggerManualSync();

      expect(result).toBe(false);
    });
  });

  // ============ getBackgroundFetchStatus ============

  describe('getBackgroundFetchStatus', () => {
    it('should return "available" when status is Available', async () => {
      (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(
        BackgroundFetch.BackgroundFetchStatus.Available
      );

      const result = await getBackgroundFetchStatus();

      expect(result).toBe('available');
    });

    it('should return "restricted" when status is Restricted', async () => {
      (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(
        BackgroundFetch.BackgroundFetchStatus.Restricted
      );

      const result = await getBackgroundFetchStatus();

      expect(result).toBe('restricted');
    });

    it('should return "denied" when status is Denied', async () => {
      (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(
        BackgroundFetch.BackgroundFetchStatus.Denied
      );

      const result = await getBackgroundFetchStatus();

      expect(result).toBe('denied');
    });

    it('should return "unknown" for unexpected status', async () => {
      (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(99);

      const result = await getBackgroundFetchStatus();

      expect(result).toBe('unknown');
    });

    it('should return "error" on exception', async () => {
      (BackgroundFetch.getStatusAsync as jest.Mock).mockRejectedValue(
        new Error('Unknown error')
      );

      const result = await getBackgroundFetchStatus();

      expect(result).toBe('error');
    });
  });

  // ============ TaskManager.defineTask ============

  describe('background task definition', () => {
    it('should register the background task with TaskManager', () => {
      expect(TaskManager.defineTask).toHaveBeenCalledWith(
        'HEIRCLARK_HEALTH_SYNC',
        expect.any(Function)
      );
    });
  });
});
