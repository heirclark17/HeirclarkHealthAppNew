// Apple Health Integration Service
// Syncs steps, calories, and other health data from Apple Health

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
      ],
      write: [],
    },
  };
};

export interface HealthData {
  steps: number;
  caloriesOut: number;
  restingEnergy: number;
  distance: number;
  heartRate?: number;
  weight?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
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

  // Get today's health data
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
      const [steps, activeEnergy, basalEnergy, distance, heartRate, bloodPressure] = await Promise.all([
        this.getSteps(startOfDay),
        this.getActiveEnergy(startOfDay),
        this.getBasalEnergy(startOfDay),
        this.getDistance(startOfDay),
        this.getHeartRate(),
        this.getBloodPressure(),
      ]);

      return {
        steps: steps || 0,
        caloriesOut: Math.round((activeEnergy || 0) + (basalEnergy || 0)),
        restingEnergy: Math.round(basalEnergy || 0),
        distance: distance || 0,
        heartRate: heartRate || 0,
        bloodPressureSystolic: bloodPressure?.systolic || 0,
        bloodPressureDiastolic: bloodPressure?.diastolic || 0,
      };
    } catch (error) {
      console.error('[AppleHealth] Error fetching health data:', error);
      return null;
    }
  }

  // Get most recent heart rate
  private async getHeartRate(): Promise<number> {
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
          console.error('[AppleHealth] Error getting heart rate:', error);
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
    return new Promise((resolve) => {
      const options = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        endDate: new Date().toISOString(),
        ascending: false,
        limit: 1,
      };

      AppleHealthKit.getBloodPressureSamples(options, (error: Object, result: any[]) => {
        if (error) {
          console.error('[AppleHealth] Error getting blood pressure:', error);
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
    return new Promise((resolve) => {
      const options = {
        date: startDate.toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (error: Object, result: any) => {
        if (error) {
          console.error('[AppleHealth] Error getting steps:', error);
          resolve(0);
        } else {
          resolve(result?.value || 0);
        }
      });
    });
  }

  // Get active energy burned
  private async getActiveEnergy(startDate: Date): Promise<number> {
    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getActiveEnergyBurned(options, (error: Object, result: any[]) => {
        if (error) {
          console.error('[AppleHealth] Error getting active energy:', error);
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
    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getBasalEnergyBurned(options, (error: Object, result: any[]) => {
        if (error) {
          console.error('[AppleHealth] Error getting basal energy:', error);
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
    return new Promise((resolve) => {
      const options = {
        date: startDate.toISOString(),
      };

      AppleHealthKit.getDistanceWalkingRunning(options, (error: Object, result: any) => {
        if (error) {
          console.error('[AppleHealth] Error getting distance:', error);
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
          console.error('[AppleHealth] Error getting weight:', error);
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
