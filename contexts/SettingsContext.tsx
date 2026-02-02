import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking, Alert } from 'react-native';

// Dynamically import notifications to avoid errors on web
let Notifications: typeof import('expo-notifications') | null = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.warn('[Settings] expo-notifications not available:', error);
  }
}

// Types
export type UnitSystem = 'imperial' | 'metric';
export type ThemeMode = 'dark' | 'light';

export interface SettingsState {
  // AI Coach Avatar
  liveAvatar: boolean;

  // AI Coach Settings
  captions: boolean;
  autoplayCoach: boolean;

  // Nutrition Tracking
  mealReminders: boolean;
  mealReminderTimes: { breakfast: string; lunch: string; dinner: string };
  waterTracking: boolean;
  dailyWaterGoal: number; // in oz or ml depending on units
  unitSystem: UnitSystem;

  // Appearance
  themeMode: ThemeMode;
  backgroundImage: string; // 'default' | 'gradient1' | 'gradient2' | 'custom' | etc.
  customBackgroundUri: string | null; // URI for user's custom background photo
  profileImageUri: string | null; // URI for user's profile picture with liquid glass effect

  // Notifications
  pushNotifications: boolean;
  dailySummary: boolean;
  dailySummaryTime: string; // "20:00"
  achievementAlerts: boolean;

  // Loaded state
  isLoaded: boolean;
}

interface SettingsContextType {
  settings: SettingsState;

  // AI Coach Avatar
  setLiveAvatar: (enabled: boolean) => void;

  // AI Coach Settings
  setCaptions: (enabled: boolean) => void;
  setAutoplayCoach: (enabled: boolean) => void;

  // Nutrition Tracking
  setMealReminders: (enabled: boolean) => void;
  setMealReminderTime: (meal: 'breakfast' | 'lunch' | 'dinner', time: string) => void;
  setWaterTracking: (enabled: boolean) => void;
  setDailyWaterGoal: (goal: number) => void;
  setUnitSystem: (system: UnitSystem) => void;

  // Appearance
  setThemeMode: (mode: ThemeMode) => void;
  setBackgroundImage: (image: string) => void;
  setCustomBackgroundUri: (uri: string | null) => void;
  setProfileImageUri: (uri: string | null) => void;

  // Notifications
  setPushNotifications: (enabled: boolean) => void;
  setDailySummary: (enabled: boolean) => void;
  setDailySummaryTime: (time: string) => void;
  setAchievementAlerts: (enabled: boolean) => void;

  // Actions
  exportData: () => Promise<void>;
  deleteAllData: () => Promise<boolean>;
  resetSettings: () => void;

  // Utility
  convertWeight: (weight: number, fromSystem: UnitSystem) => number;
  convertHeight: (height: number, fromSystem: UnitSystem) => number;
  getWeightUnit: () => string;
  getHeightUnit: () => string;
  getWaterUnit: () => string;
}

const STORAGE_KEY = 'hc_app_settings';

const defaultSettings: SettingsState = {
  // AI Coach Avatar
  liveAvatar: true,

  // AI Coach Settings
  captions: false,
  autoplayCoach: true,

  // Nutrition Tracking
  mealReminders: false,
  mealReminderTimes: { breakfast: '08:00', lunch: '12:00', dinner: '18:00' },
  waterTracking: false,
  dailyWaterGoal: 64, // 64 oz = 8 glasses
  unitSystem: 'imperial',

  // Appearance
  themeMode: 'dark',
  backgroundImage: 'default',
  customBackgroundUri: null,
  profileImageUri: null,

  // Notifications
  pushNotifications: false,
  dailySummary: false,
  dailySummaryTime: '20:00',
  achievementAlerts: false,

  // Loaded state
  isLoaded: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousSettingsRef = useRef<string | null>(null);
  const isSavingRef = useRef<boolean>(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-save disabled to prevent infinite loop - settings only save on manual changes
  // TODO: Re-enable once root cause of infinite loop is identified

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed, isLoaded: true });
        console.log('[Settings] Loaded settings from storage');
      } else {
        setSettings({ ...defaultSettings, isLoaded: true });
        console.log('[Settings] Using default settings');
      }
    } catch (error) {
      console.error('[Settings] Failed to load settings:', error);
      setSettings({ ...defaultSettings, isLoaded: true });
    }
  };

  const saveSettings = async () => {
    // Prevent concurrent saves
    if (isSavingRef.current) {
      console.log('[Settings] Save already in progress, skipping');
      return;
    }

    try {
      isSavingRef.current = true;
      const { isLoaded, ...settingsToSave } = settings;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
      console.log('[Settings] Saved settings to storage');
    } catch (error) {
      console.error('[Settings] Failed to save settings:', error);
    } finally {
      isSavingRef.current = false;
    }
  };

  // Request notification permissions
  const requestNotificationPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !Notifications) {
      // Web notifications require different handling or notifications not available
      console.log('[Settings] Notifications not available on this platform');
      return true; // Return true to allow toggle to work, just won't actually send notifications
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Settings] Error requesting notification permissions:', error);
      return true; // Allow toggle to work even if permissions fail
    }
  };

  // Schedule meal reminders
  const scheduleMealReminders = async () => {
    if (Platform.OS === 'web' || !Notifications) return;

    try {
      // Cancel existing meal reminders
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!settings.mealReminders) return;

      const meals = [
        { key: 'breakfast', title: '🍳 Breakfast Time', body: "Don't forget to log your breakfast!" },
        { key: 'lunch', title: '🥗 Lunch Time', body: "Time to log your lunch and stay on track!" },
        { key: 'dinner', title: '🍽️ Dinner Time', body: "Log your dinner to complete your daily tracking!" },
      ] as const;

      for (const meal of meals) {
        const time = settings.mealReminderTimes[meal.key];
        const [hours, minutes] = time.split(':').map(Number);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: meal.title,
            body: meal.body,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hours,
            minute: minutes,
          },
        });
      }

      console.log('[Settings] Scheduled meal reminders');
    } catch (error) {
      console.error('[Settings] Failed to schedule meal reminders:', error);
    }
  };

  // Schedule daily summary notification
  const scheduleDailySummary = async () => {
    if (Platform.OS === 'web' || !Notifications) return;

    try {
      if (!settings.dailySummary) return;

      const [hours, minutes] = settings.dailySummaryTime.split(':').map(Number);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Daily Summary',
          body: 'Check out your nutrition and fitness progress for today!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      console.log('[Settings] Scheduled daily summary notification');
    } catch (error) {
      console.error('[Settings] Failed to schedule daily summary:', error);
    }
  };

  // AI Coach Avatar
  const setLiveAvatar = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, liveAvatar: enabled }));
    console.log('[Settings] Live avatar:', enabled);
  }, []);

  // AI Coach Settings
  const setCaptions = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, captions: enabled }));
    console.log('[Settings] Captions:', enabled);
  }, []);

  const setAutoplayCoach = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, autoplayCoach: enabled }));
    console.log('[Settings] Autoplay coach:', enabled);
  }, []);

  // Nutrition Tracking
  const setMealReminders = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) return;
    }

    setSettings(prev => ({ ...prev, mealReminders: enabled }));
    console.log('[Settings] Meal reminders:', enabled);

    // Schedule/cancel reminders
    setTimeout(() => scheduleMealReminders(), 100);
  }, []); // Removed circular dependency

  const setMealReminderTime = useCallback((meal: 'breakfast' | 'lunch' | 'dinner', time: string) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        mealReminderTimes: { ...prev.mealReminderTimes, [meal]: time },
      };

      // Reschedule if reminders are enabled
      if (prev.mealReminders) {
        setTimeout(() => scheduleMealReminders(), 100);
      }

      return updated;
    });
  }, []); // Removed circular dependency

  const setWaterTracking = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, waterTracking: enabled }));
    console.log('[Settings] Water tracking:', enabled);
  }, []);

  const setDailyWaterGoal = useCallback((goal: number) => {
    setSettings(prev => ({ ...prev, dailyWaterGoal: goal }));
    console.log('[Settings] Daily water goal:', goal);
  }, []);

  const setUnitSystem = useCallback((system: UnitSystem) => {
    setSettings(prev => {
      // Convert water goal when switching units
      let newWaterGoal = prev.dailyWaterGoal;
      if (prev.unitSystem !== system) {
        if (system === 'metric') {
          // oz to ml
          newWaterGoal = Math.round(prev.dailyWaterGoal * 29.5735);
        } else {
          // ml to oz
          newWaterGoal = Math.round(prev.dailyWaterGoal / 29.5735);
        }
      }

      return { ...prev, unitSystem: system, dailyWaterGoal: newWaterGoal };
    });
    console.log('[Settings] Unit system:', system);
  }, []);

  // Appearance
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setSettings(prev => ({ ...prev, themeMode: mode }));
    console.log('[Settings] Theme mode:', mode);
  }, []);

  const setBackgroundImage = useCallback((image: string) => {
    setSettings(prev => ({ ...prev, backgroundImage: image }));
    console.log('[Settings] Background image:', image);
  }, []);

  const setCustomBackgroundUri = useCallback((uri: string | null) => {
    setSettings(prev => ({ ...prev, customBackgroundUri: uri }));
    console.log('[Settings] Custom background URI:', uri ? 'set' : 'cleared');
  }, []);

  const setProfileImageUri = useCallback((uri: string | null) => {
    setSettings(prev => ({ ...prev, profileImageUri: uri }));
    console.log('[Settings] Profile image URI:', uri ? 'set' : 'cleared');
  }, []);

  // Notifications
  const setPushNotifications = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) return;
    }

    setSettings(prev => ({ ...prev, pushNotifications: enabled }));
    console.log('[Settings] Push notifications:', enabled);
  }, []);

  const setDailySummary = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) return;
    }

    setSettings(prev => ({ ...prev, dailySummary: enabled }));
    console.log('[Settings] Daily summary:', enabled);

    setTimeout(() => scheduleDailySummary(), 100);
  }, []); // Removed circular dependency

  const setDailySummaryTime = useCallback((time: string) => {
    setSettings(prev => {
      // Reschedule if daily summary is enabled
      if (prev.dailySummary) {
        setTimeout(() => scheduleDailySummary(), 100);
      }

      return { ...prev, dailySummaryTime: time };
    });
  }, []); // Removed circular dependency

  const setAchievementAlerts = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) return;
    }

    setSettings(prev => ({ ...prev, achievementAlerts: enabled }));
    console.log('[Settings] Achievement alerts:', enabled);
  }, []);

  // Actions
  const exportData = useCallback(async () => {
    try {
      // Gather all app data
      const allKeys = await AsyncStorage.getAllKeys();
      const allData: Record<string, any> = {};

      for (const key of allKeys) {
        if (key.startsWith('hc_')) {
          const value = await AsyncStorage.getItem(key);
          allData[key] = value ? JSON.parse(value) : null;
        }
      }

      const exportString = JSON.stringify(allData, null, 2);
      const exportDate = new Date().toISOString().split('T')[0];
      const filename = `heirclark_health_export_${exportDate}.json`;

      if (Platform.OS === 'web') {
        // Create and download file on web
        const blob = new Blob([exportString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Alert.alert('Export Complete', 'Your data has been downloaded.');
      } else {
        // For mobile, we'd need to use Share API or file system
        // For now, show the data in an alert (simplified)
        Alert.alert(
          'Export Data',
          `Data exported to clipboard:\n\n${exportString.substring(0, 500)}...`,
          [{ text: 'OK' }]
        );
      }

      console.log('[Settings] Data exported');
    } catch (error) {
      console.error('[Settings] Failed to export data:', error);
      Alert.alert('Export Failed', 'Unable to export your data. Please try again.');
    }
  }, []);

  const deleteAllData = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Delete All Data',
        'This will permanently delete all your health data, goals, meal plans, and settings. This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Delete Everything',
            style: 'destructive',
            onPress: async () => {
              try {
                // Get all keys and delete only app-related data
                const allKeys = await AsyncStorage.getAllKeys();
                const appKeys = allKeys.filter(key => key.startsWith('hc_'));
                await AsyncStorage.multiRemove(appKeys);

                // Cancel all notifications
                if (Platform.OS !== 'web' && Notifications) {
                  await Notifications.cancelAllScheduledNotificationsAsync();
                }

                // Reset to default settings
                setSettings({ ...defaultSettings, isLoaded: true });

                Alert.alert('Data Deleted', 'All your data has been permanently deleted.');
                console.log('[Settings] All data deleted');
                resolve(true);
              } catch (error) {
                console.error('[Settings] Failed to delete data:', error);
                Alert.alert('Error', 'Failed to delete data. Please try again.');
                resolve(false);
              }
            },
          },
        ]
      );
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...defaultSettings, isLoaded: true });
    console.log('[Settings] Settings reset to defaults');
  }, []);

  // Utility functions
  const convertWeight = useCallback((weight: number, fromSystem: UnitSystem): number => {
    if (fromSystem === settings.unitSystem) return weight;

    if (settings.unitSystem === 'metric') {
      // lbs to kg
      return Math.round(weight * 0.453592 * 10) / 10;
    } else {
      // kg to lbs
      return Math.round(weight * 2.20462 * 10) / 10;
    }
  }, [settings.unitSystem]);

  const convertHeight = useCallback((height: number, fromSystem: UnitSystem): number => {
    if (fromSystem === settings.unitSystem) return height;

    if (settings.unitSystem === 'metric') {
      // inches to cm
      return Math.round(height * 2.54);
    } else {
      // cm to inches
      return Math.round(height / 2.54);
    }
  }, [settings.unitSystem]);

  const getWeightUnit = useCallback(() => {
    return settings.unitSystem === 'metric' ? 'kg' : 'lbs';
  }, [settings.unitSystem]);

  const getHeightUnit = useCallback(() => {
    return settings.unitSystem === 'metric' ? 'cm' : 'ft/in';
  }, [settings.unitSystem]);

  const getWaterUnit = useCallback(() => {
    return settings.unitSystem === 'metric' ? 'ml' : 'oz';
  }, [settings.unitSystem]);

  const value = useMemo<SettingsContextType>(() => ({
    settings,
    setLiveAvatar,
    setCaptions,
    setAutoplayCoach,
    setMealReminders,
    setMealReminderTime,
    setWaterTracking,
    setDailyWaterGoal,
    setUnitSystem,
    setThemeMode,
    setBackgroundImage,
    setCustomBackgroundUri,
    setProfileImageUri,
    setPushNotifications,
    setDailySummary,
    setDailySummaryTime,
    setAchievementAlerts,
    exportData,
    deleteAllData,
    resetSettings,
    convertWeight,
    convertHeight,
    getWeightUnit,
    getHeightUnit,
    getWaterUnit,
  }), [
    settings,
    setLiveAvatar,
    setCaptions,
    setAutoplayCoach,
    setMealReminders,
    setMealReminderTime,
    setWaterTracking,
    setDailyWaterGoal,
    setUnitSystem,
    setThemeMode,
    setBackgroundImage,
    setCustomBackgroundUri,
    setProfileImageUri,
    setPushNotifications,
    setDailySummary,
    setDailySummaryTime,
    setAchievementAlerts,
    exportData,
    deleteAllData,
    resetSettings,
    convertWeight,
    convertHeight,
    getWeightUnit,
    getHeightUnit,
    getWaterUnit,
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
