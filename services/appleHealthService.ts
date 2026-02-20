// Apple Health Integration Service
// Enhanced with workouts, historical data, and background sync support
// Syncs steps, calories, workouts, and other health data from Apple Health

import { Platform, Alert, NativeModules } from 'react-native';

// Import the fixed react-native-health module
// Only load on iOS - web and Android don't support this
let AppleHealthKit: any = null;

if (Platform.OS === 'ios') {
  try {
    // Use require to import (more reliable with patched module)
    AppleHealthKit = require('react-native-health').default || require('react-native-health');

    // Also check NativeModules directly as fallback
    if (!AppleHealthKit && NativeModules.AppleHealthKit) {
      AppleHealthKit = NativeModules.AppleHealthKit;
      // Manually attach constants if needed
      const { Activities, Observers, Permissions, Units } = require('react-native-health/src/constants');
      AppleHealthKit.Constants = { Activities, Observers, Permissions, Units };
    }

    console.log('[AppleHealth] Module loaded successfully');
    console.log('[AppleHealth] Available methods:', Object.keys(AppleHealthKit || {}));
  } catch (error) {
    console.error('[AppleHealth] Failed to load module:', error);
  }
} else {
  console.log('[AppleHealth] Skipping module load - not iOS platform');
}

const getPermissions = () => {
  if (!AppleHealthKit || !AppleHealthKit.Constants) {
    console.warn('[AppleHealth] Constants not available');
    return {
      permissions: {
        read: [],
        write: [],
      },
    };
  }

  return {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.Steps,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
        AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.Weight,
        AppleHealthKit.Constants.Permissions.Workout,
        AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
        AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
        AppleHealthKit.Constants.Permissions.SleepAnalysis,
        AppleHealthKit.Constants.Permissions.HeartRateVariability,
      ],
      write: [],
    },
  };
};

export interface SleepSample {
  startDate: string;
  endDate: string;
  value: 'ASLEEP' | 'INBED' | 'AWAKE';
}

export interface Workout {
  activityName: string;
  calories: number;
  duration: number; // minutes
  startDate: string;
  endDate: string;
}

export interface HealthData {
  steps: number;
  caloriesOut: number;
  activeCalories: number;
  restingEnergy: number;
  totalCaloriesOut: number;
  distance: number;
  heartRate?: number;
  weight?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  workouts: Workout[];
  date: string;
}

class AppleHealthService {
  private initialized: boolean = false;

  // Check if the native module is loaded
  isModuleAvailable(): boolean {
    if (Platform.OS !== 'ios') {
      console.log('[AppleHealth] Not iOS platform');
      return false;
    }

    // Check if module is loaded
    if (!AppleHealthKit) {
      console.error('[AppleHealth] AppleHealthKit module is null');
      return false;
    }

    if (typeof AppleHealthKit.initHealthKit !== 'function') {
      console.error('[AppleHealth] initHealthKit is not a function');
      console.error('[AppleHealth] AppleHealthKit type:', typeof AppleHealthKit);
      console.error('[AppleHealth] AppleHealthKit keys:', Object.keys(AppleHealthKit));
      return false;
    }

    console.log('[AppleHealth] Module is available and ready');
    return true;
  }

  // Initialize Apple Health
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.warn('[AppleHealth] Only available on iOS');
      return false;
    }

    if (!this.isModuleAvailable()) {
      console.error('[AppleHealth] Native module not available');
      Alert.alert(
        'Apple Health Unavailable',
        'The Apple Health module could not be loaded. Please ensure the app was built with HealthKit entitlements enabled and try rebuilding the app.',
        [{ text: 'OK' }]
      );
      return false;
    }

    console.log('[AppleHealth] Initializing HealthKit...');

    const permissions = getPermissions();
    console.log('[AppleHealth] Requesting permissions:', JSON.stringify(permissions, null, 2));

    return new Promise((resolve) => {
      try {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            console.error('[AppleHealth] Initialization error:', error);
            Alert.alert(
              'Apple Health Error',
              `Failed to initialize: ${error}\n\nPlease check that you have granted Health permissions in Settings > Privacy & Security > Health.`,
              [{ text: 'OK' }]
            );
            this.initialized = false;
            resolve(false);
          } else {
            console.log('[AppleHealth] ✅ Initialized successfully');
            this.initialized = true;
            resolve(true);
          }
        });
      } catch (error) {
        console.error('[AppleHealth] Exception during initialization:', error);
        Alert.alert(
          'Apple Health Error',
          `Unexpected error: ${error}`,
          [{ text: 'OK' }]
        );
        resolve(false);
      }
    });
  }

  // Check if Apple Health is available on this device
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    if (!this.isModuleAvailable()) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        AppleHealthKit.isAvailable((error: Object, available: boolean) => {
          if (error) {
            console.error('[AppleHealth] Availability check error:', error);
            resolve(false);
          } else {
            console.log('[AppleHealth] Available:', available);
            resolve(available);
          }
        });
      } catch (error) {
        console.error('[AppleHealth] Exception checking availability:', error);
        resolve(false);
      }
    });
  }

  // Get today's health data (enhanced with workouts)
  async getTodayData(): Promise<HealthData | null> {
    if (!this.isModuleAvailable()) {
      return null;
    }

    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return null;
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

    try {
      const [steps, activeEnergy, basalEnergy, distance, heartRate, bloodPressure, workouts] = await Promise.all([
        this.getSteps(startOfDay),
        this.getActiveEnergy(startOfDay),
        this.getBasalEnergy(startOfDay),
        this.getDistance(startOfDay),
        this.getHeartRate(),
        this.getBloodPressure(),
        this.getWorkouts(startOfDay),
      ]);

      const activeCalories = Math.round(activeEnergy || 0);
      const restingEnergy = Math.round(basalEnergy || 0);

      return {
        steps: steps || 0,
        caloriesOut: activeCalories + restingEnergy,
        activeCalories,
        restingEnergy,
        totalCaloriesOut: activeCalories + restingEnergy,
        distance: distance || 0,
        heartRate: heartRate || 0,
        bloodPressureSystolic: bloodPressure?.systolic || 0,
        bloodPressureDiastolic: bloodPressure?.diastolic || 0,
        workouts: workouts || [],
        date: today.toISOString().split('T')[0],
      };
    } catch (error) {
      console.error('[AppleHealth] Error fetching health data:', error);
      return null;
    }
  }

  // Get workouts for a specific date
  private async getWorkouts(startDate: Date): Promise<Workout[]> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get workouts - module not initialized');
      return [];
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        type: 'Workout',
      };

      AppleHealthKit.getSamples(options, (error: Object, results: any[]) => {
        if (error) {
          console.warn('[AppleHealth] Workouts unavailable:', JSON.stringify(error));
          resolve([]);
          return;
        }

        if (!Array.isArray(results)) {
          resolve([]);
          return;
        }

        const workouts: Workout[] = results.map((workout: any) => ({
          activityName: workout.activityName || 'Unknown',
          calories: workout.calories || 0,
          duration: workout.duration ? Math.round(workout.duration / 60) : 0,
          startDate: workout.startDate,
          endDate: workout.endDate,
        }));

        resolve(workouts);
      });
    });
  }

  // Get historical data for a date range
  async getHistoricalData(days: number): Promise<HealthData[]> {
    if (!this.isModuleAvailable()) {
      return [];
    }

    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return [];
    }

    const results: HealthData[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const data = await this.getDataForDate(date);
      if (data) {
        results.push(data);
      }
    }

    return results;
  }

  // Get data for a specific date
  private async getDataForDate(date: Date): Promise<HealthData | null> {
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    try {
      const [steps, activeEnergy, basalEnergy, distance, workouts] = await Promise.all([
        this.getStepsForRange(date, endDate),
        this.getActiveEnergyForRange(date, endDate),
        this.getBasalEnergyForRange(date, endDate),
        this.getDistanceForRange(date, endDate),
        this.getWorkoutsForRange(date, endDate),
      ]);

      const activeCalories = Math.round(activeEnergy || 0);
      const restingEnergy = Math.round(basalEnergy || 0);

      return {
        steps: steps || 0,
        caloriesOut: activeCalories + restingEnergy,
        activeCalories,
        restingEnergy,
        totalCaloriesOut: activeCalories + restingEnergy,
        distance: distance || 0,
        workouts: workouts || [],
        date: date.toISOString().split('T')[0],
      };
    } catch (error) {
      console.error('[AppleHealth] Error fetching data for date:', error);
      return null;
    }
  }

  private getStepsForRange(startDate: Date, endDate: Date): Promise<number> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get steps for range - module not initialized');
      return Promise.resolve(0);
    }

    return new Promise((resolve) => {
      AppleHealthKit.getStepCount(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err: Object, results: any) => {
          resolve(err ? 0 : results?.value || 0);
        }
      );
    });
  }

  private getActiveEnergyForRange(startDate: Date, endDate: Date): Promise<number> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get active energy for range - module not initialized');
      return Promise.resolve(0);
    }

    return new Promise((resolve) => {
      AppleHealthKit.getActiveEnergyBurned(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err: Object, results: any[]) => {
          if (err || !Array.isArray(results)) {
            resolve(0);
            return;
          }
          resolve(results.reduce((sum, e) => sum + (e?.value || 0), 0));
        }
      );
    });
  }

  private getBasalEnergyForRange(startDate: Date, endDate: Date): Promise<number> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get basal energy for range - module not initialized');
      return Promise.resolve(0);
    }

    return new Promise((resolve) => {
      AppleHealthKit.getBasalEnergyBurned(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err: Object, results: any[]) => {
          if (err || !Array.isArray(results)) {
            resolve(0);
            return;
          }
          resolve(results.reduce((sum, e) => sum + (e?.value || 0), 0));
        }
      );
    });
  }

  private getDistanceForRange(startDate: Date, endDate: Date): Promise<number> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get distance for range - module not initialized');
      return Promise.resolve(0);
    }

    return new Promise((resolve) => {
      AppleHealthKit.getDistanceWalkingRunning(
        { date: startDate.toISOString() },
        (err: Object, results: any) => {
          if (err) {
            resolve(0);
            return;
          }
          const meters = results?.value || 0;
          const miles = meters * 0.000621371;
          resolve(miles);
        }
      );
    });
  }

  private getWorkoutsForRange(startDate: Date, endDate: Date): Promise<Workout[]> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get workouts for range - module not initialized');
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      AppleHealthKit.getSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: 'Workout',
        },
        (err: Object, results: any[]) => {
          if (err || !Array.isArray(results)) {
            resolve([]);
            return;
          }
          resolve(
            results.map((w: any) => ({
              activityName: w.activityName || 'Unknown',
              calories: w.calories || 0,
              duration: w.duration ? Math.round(w.duration / 60) : 0,
              startDate: w.startDate,
              endDate: w.endDate,
            }))
          );
        }
      );
    });
  }

  // Get most recent heart rate
  private async getHeartRate(): Promise<number> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get heart rate - module not initialized');
      return 0;
    }

    return new Promise((resolve) => {
      const options = {
        unit: 'bpm',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        endDate: new Date().toISOString(),
        ascending: false,
        limit: 1,
      };

      AppleHealthKit.getHeartRateSamples(options, (error: Object, result: any[]) => {
        if (error) {
          console.warn('[AppleHealth] Heart rate unavailable:', JSON.stringify(error));
          resolve(0);
        } else {
          // Get the most recent heart rate sample
          const latestSample = Array.isArray(result) && result.length > 0 ? result[0] : null;
          resolve(latestSample?.value || 0);
        }
      });
    });
  }

  // Get most recent blood pressure reading
  private async getBloodPressure(): Promise<{ systolic: number; diastolic: number }> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get blood pressure - module not initialized');
      return { systolic: 0, diastolic: 0 };
    }

    return new Promise((resolve) => {
      const options = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        endDate: new Date().toISOString(),
        ascending: false,
        limit: 1,
      };

      AppleHealthKit.getBloodPressureSamples(options, (error: Object, result: any[]) => {
        if (error) {
          console.warn('[AppleHealth] Blood pressure unavailable:', JSON.stringify(error));
          resolve({ systolic: 0, diastolic: 0 });
        } else {
          // Get the most recent blood pressure sample
          const latestSample = Array.isArray(result) && result.length > 0 ? result[0] : null;
          resolve({
            systolic: latestSample?.bloodPressureSystolicValue || 0,
            diastolic: latestSample?.bloodPressureDiastolicValue || 0,
          });
        }
      });
    });
  }

  // Get steps for a specific date
  private async getSteps(startDate: Date): Promise<number> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get steps - module not initialized');
      return 0;
    }

    return new Promise((resolve) => {
      const options = {
        date: startDate.toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (error: Object, result: any) => {
        if (error) {
          console.warn('[AppleHealth] Steps unavailable:', JSON.stringify(error));
          resolve(0);
        } else {
          resolve(result?.value || 0);
        }
      });
    });
  }

  // Get active energy burned
  private async getActiveEnergy(startDate: Date): Promise<number> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get active energy - module not initialized');
      return 0;
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getActiveEnergyBurned(options, (error: Object, result: any[]) => {
        if (error) {
          console.warn('[AppleHealth] Active energy unavailable:', JSON.stringify(error));
          resolve(0);
        } else {
          const total = Array.isArray(result)
            ? result.reduce((sum, item) => sum + (item?.value || 0), 0)
            : 0;
          resolve(total);
        }
      });
    });
  }

  // Get basal (resting) energy
  private async getBasalEnergy(startDate: Date): Promise<number> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get basal energy - module not initialized');
      return 0;
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getBasalEnergyBurned(options, (error: Object, result: any[]) => {
        if (error) {
          console.warn('[AppleHealth] Basal energy unavailable:', JSON.stringify(error));
          resolve(0);
        } else {
          const total = Array.isArray(result)
            ? result.reduce((sum, item) => sum + (item?.value || 0), 0)
            : 0;
          resolve(total);
        }
      });
    });
  }

  // Get walking/running distance
  private async getDistance(startDate: Date): Promise<number> {
    // Safety check: ensure module is available and initialized
    if (!this.isModuleAvailable() || !this.initialized) {
      console.warn('[AppleHealth] Cannot get distance - module not initialized');
      return 0;
    }

    return new Promise((resolve) => {
      const options = {
        date: startDate.toISOString(),
      };

      AppleHealthKit.getDistanceWalkingRunning(options, (error: Object, result: any) => {
        if (error) {
          console.warn('[AppleHealth] Distance unavailable:', JSON.stringify(error));
          resolve(0);
        } else {
          // Convert meters to miles
          const meters = result?.value || 0;
          const miles = meters * 0.000621371;
          resolve(miles);
        }
      });
    });
  }

  /**
   * Get sleep samples for a date range.
   * Returns array of sleep segments with ASLEEP/INBED/AWAKE values
   * and computed totalSleepMinutes (sum of ASLEEP segments).
   */
  async getSleepData(startDate: Date, endDate: Date): Promise<{ samples: SleepSample[]; totalSleepMinutes: number }> {
    if (!this.isModuleAvailable()) {
      return { samples: [], totalSleepMinutes: 0 };
    }

    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return { samples: [], totalSleepMinutes: 0 };
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getSleepSamples(options, (error: Object, results: any[]) => {
        if (error || !Array.isArray(results)) {
          console.warn('[AppleHealth] Sleep data unavailable:', JSON.stringify(error));
          resolve({ samples: [], totalSleepMinutes: 0 });
          return;
        }

        const samples: SleepSample[] = results.map((s: any) => ({
          startDate: s.startDate,
          endDate: s.endDate,
          value: s.value === 'ASLEEP' ? 'ASLEEP' : s.value === 'INBED' ? 'INBED' : 'AWAKE',
        }));

        // Sum ASLEEP segments in minutes
        const totalSleepMinutes = samples
          .filter((s) => s.value === 'ASLEEP')
          .reduce((sum, s) => {
            const start = new Date(s.startDate).getTime();
            const end = new Date(s.endDate).getTime();
            return sum + (end - start) / (1000 * 60);
          }, 0);

        resolve({ samples, totalSleepMinutes });
      });
    });
  }

  /**
   * Get Heart Rate Variability (HRV) data for a date range.
   * Returns the latest HRV value in ms (SDNN).
   */
  async getHRVData(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isModuleAvailable()) {
      return null;
    }

    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return null;
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
        limit: 1,
      };

      AppleHealthKit.getHeartRateVariabilitySamples(options, (error: Object, results: any[]) => {
        if (error || !Array.isArray(results) || results.length === 0) {
          if (error) console.warn('[AppleHealth] HRV data unavailable:', JSON.stringify(error));
          resolve(null);
          return;
        }

        // HRV value in ms (SDNN)
        const latestHRV = results[0]?.value;
        resolve(typeof latestHRV === 'number' ? latestHRV : null);
      });
    });
  }

  /**
   * Get step count for a specific date (public wrapper for recovery scoring).
   */
  async getStepCount(date: Date): Promise<number> {
    if (!this.isModuleAvailable()) return 0;
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return 0;
    }
    return this.getSteps(date);
  }

  // Get latest weight
  async getLatestWeight(): Promise<number | null> {
    if (!this.isModuleAvailable()) {
      return null;
    }

    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return null;
    }

    return new Promise((resolve) => {
      const options = {
        unit: 'pound',
      };

      AppleHealthKit.getLatestWeight(options, (error: Object, result: any) => {
        if (error) {
          console.warn('[AppleHealth] Weight unavailable:', JSON.stringify(error));
          resolve(null);
        } else {
          resolve(result?.value || null);
        }
      });
    });
  }
}

// Export singleton instance
export const appleHealthService = new AppleHealthService();
export default appleHealthService;
