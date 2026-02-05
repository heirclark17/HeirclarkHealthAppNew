/**
 * Background Sync Service
 * Syncs Apple Health data to backend every 15 minutes in the background
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import { appleHealthService, HealthData } from './appleHealthService';
import { Platform } from 'react-native';

const BACKGROUND_SYNC_TASK = 'HEIRCLARK_HEALTH_SYNC';
const BACKEND_URL = 'https://heirclarkinstacartbackend-production.up.railway.app';
const AUTH_TOKEN_KEY = '@heirclark_auth_token';
const LAST_SYNC_KEY = '@heirclark_last_sync';

/**
 * Sync health data to the backend
 */
async function syncHealthDataToBackend(healthData: HealthData): Promise<boolean> {
  try {
    // Get auth token from secure storage
    const authToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (!authToken) {
      console.log('[BackgroundSync] No auth token, skipping sync');
      return false;
    }

    const payload = {
      date: healthData.date,
      steps: Math.round(healthData.steps),
      activeCalories: Math.round(healthData.activeCalories),
      restingEnergy: Math.round(healthData.restingEnergy),
      caloriesOut: Math.round(healthData.totalCaloriesOut),
      workouts: healthData.workouts.length,
      source: 'heirclark-ios-app',
    };

    console.log('[BackgroundSync] Syncing health data:', payload);

    const response = await fetch(`${BACKEND_URL}/api/v1/health/ingest-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[BackgroundSync] Sync failed:', response.status);
      return false;
    }

    console.log('[BackgroundSync] Sync successful');
    return true;
  } catch (error) {
    console.error('[BackgroundSync] Error syncing data:', error);
    return false;
  }
}

/**
 * Define the background task
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('[BackgroundSync] Running background sync task...');

    // Only run on iOS
    if (Platform.OS !== 'ios') {
      console.log('[BackgroundSync] Not iOS, skipping');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Fetch health data
    const healthData = await appleHealthService.getTodayData();
    if (!healthData) {
      console.log('[BackgroundSync] No health data available, skipping');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Sync to backend
    const success = await syncHealthDataToBackend(healthData);

    if (success) {
      // Store last sync time
      await SecureStore.setItemAsync(LAST_SYNC_KEY, new Date().toISOString());
      console.log('[BackgroundSync] Background sync completed successfully');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      console.error('[BackgroundSync] Background sync failed');
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  } catch (error) {
    console.error('[BackgroundSync] Background sync error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background sync task
 * Call this on app startup after user authentication
 */
export async function registerBackgroundSync(): Promise<boolean> {
  try {
    // Only available on iOS
    if (Platform.OS !== 'ios') {
      console.log('[BackgroundSync] Background sync only available on iOS');
      return false;
    }

    // Check if background fetch is available
    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
      console.log('[BackgroundSync] Background fetch is restricted by the system');
      return false;
    }

    if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.log('[BackgroundSync] Background fetch permission denied');
      return false;
    }

    // Register the task with 15-minute minimum interval
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed on iOS)
      stopOnTerminate: false, // Continue running when app is terminated
      startOnBoot: true, // Start task when device boots
    });

    console.log('[BackgroundSync] Background sync registered successfully');
    return true;
  } catch (error) {
    console.error('[BackgroundSync] Registration error:', error);
    return false;
  }
}

/**
 * Unregister background sync task
 * Call this when user logs out or disables health sync
 */
export async function unregisterBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await isBackgroundSyncRegistered();
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('[BackgroundSync] Background sync unregistered');
    }
  } catch (error) {
    console.error('[BackgroundSync] Unregister error:', error);
  }
}

/**
 * Check if background sync is registered
 */
export async function isBackgroundSyncRegistered(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  } catch (error) {
    console.error('[BackgroundSync] Error checking registration:', error);
    return false;
  }
}

/**
 * Get the last sync timestamp
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(LAST_SYNC_KEY);
  } catch (error) {
    console.error('[BackgroundSync] Error getting last sync time:', error);
    return null;
  }
}

/**
 * Manually trigger a sync (for pull-to-refresh)
 */
export async function triggerManualSync(): Promise<boolean> {
  try {
    console.log('[BackgroundSync] Manual sync triggered...');

    // Fetch health data
    const healthData = await appleHealthService.getTodayData();
    if (!healthData) {
      console.log('[BackgroundSync] No health data available');
      return false;
    }

    // Sync to backend
    const success = await syncHealthDataToBackend(healthData);

    if (success) {
      await SecureStore.setItemAsync(LAST_SYNC_KEY, new Date().toISOString());
    }

    return success;
  } catch (error) {
    console.error('[BackgroundSync] Manual sync error:', error);
    return false;
  }
}

/**
 * Get background fetch status for debugging
 */
export async function getBackgroundFetchStatus(): Promise<string> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Available:
        return 'available';
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        return 'restricted';
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        return 'denied';
      default:
        return 'unknown';
    }
  } catch (error) {
    return 'error';
  }
}
