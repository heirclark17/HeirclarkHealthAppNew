/**
 * Notification Context - Expo Push Notifications
 * Handles permission requests, token registration, and notification handling
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  requestPermission: () => Promise<boolean>;
  scheduleLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
  scheduleNotificationAtDate: (title: string, body: string, date: Date, data?: any) => Promise<string | null>;
  cancelScheduledNotification: (identifier: string) => Promise<void>;
  scheduleBlockReminders: (blocks: { id: string; title: string; startTime: string; type: string; icon: string; isAllDay?: boolean }[], dateStr: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    let token;

    // Must use physical device for push notifications
    if (!Device.isDevice) {
      console.warn('[Notifications] Must use physical device for push notifications');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission denied');
      setPermissionStatus('denied');
      return null;
    }

    setPermissionStatus('granted');

    // Get push token
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-expo-project-id',
      })).data;
      console.log('[Notifications] Expo push token:', token);
    } catch (error) {
      console.error('[Notifications] Failed to get push token:', error);
      return null;
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
      });
    }

    return token;
  }, []);

  // Save push token to backend
  const savePushToken = useCallback(async (token: string) => {
    if (!isAuthenticated) {
      console.log('[Notifications] User not authenticated, skipping token save');
      return;
    }

    try {
      const success = await api.savePushToken(token, Platform.OS);
      if (success) {
        console.log('[Notifications] Push token saved to backend');
      } else {
        console.warn('[Notifications] Failed to save push token to backend');
      }
    } catch (error) {
      console.error('[Notifications] Error saving push token:', error);
    }
  }, [isAuthenticated]);

  // Request permission explicitly (for settings screen)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert(
        'Not Available',
        'Push notifications are not available on simulators. Please use a physical device.'
      );
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') {
      setPermissionStatus('granted');
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status === 'granted' ? 'granted' : 'denied');

    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'You can enable notifications in Settings if you change your mind.'
      );
      return false;
    }

    // Register and save token if permission granted
    const token = await registerForPushNotifications();
    if (token) {
      setExpoPushToken(token);
      await savePushToken(token);
    }

    return true;
  }, [registerForPushNotifications, savePushToken]);

  // Schedule local notification (for reminders, habit tracking, etc.)
  const scheduleLocalNotification = useCallback(async (
    title: string,
    body: string,
    data?: any
  ) => {
    if (permissionStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted, cannot schedule notification');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds: 1 },
      });
      console.log('[Notifications] Local notification scheduled');
    } catch (error) {
      console.error('[Notifications] Failed to schedule notification:', error);
    }
  }, [permissionStatus]);

  /**
   * Tier 3a: Schedule a notification at a specific date/time.
   * Returns the notification identifier for later cancellation.
   */
  const scheduleNotificationAtDate = useCallback(async (
    title: string,
    body: string,
    date: Date,
    data?: any
  ): Promise<string | null> => {
    if (permissionStatus !== 'granted') return null;

    // Don't schedule notifications in the past
    if (date.getTime() <= Date.now()) return null;

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { date },
      });
      return identifier;
    } catch (error) {
      console.error('[Notifications] Failed to schedule dated notification:', error);
      return null;
    }
  }, [permissionStatus]);

  /**
   * Tier 3a: Cancel a specific scheduled notification by identifier.
   */
  const cancelScheduledNotification = useCallback(async (identifier: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('[Notifications] Failed to cancel notification:', error);
    }
  }, []);

  /**
   * Tier 3b: Schedule 15-minute-before reminders for all blocks in a day.
   */
  const scheduleBlockReminders = useCallback(async (
    blocks: { id: string; title: string; startTime: string; type: string; icon: string; isAllDay?: boolean }[],
    dateStr: string
  ) => {
    if (permissionStatus !== 'granted') return;

    // Cancel all existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    const BLOCK_EMOJI: Record<string, string> = {
      workout: '\uD83C\uDFCB\uFE0F',      // weight lifter
      meal_eating: '\uD83C\uDF7D\uFE0F',   // plate
      meal_prep: '\uD83D\uDC68\u200D\uD83C\uDF73',     // cooking
      sleep: '\uD83C\uDF19',               // moon
      personal: '\uD83D\uDE4F',            // folded hands
      calendar_event: '\uD83D\uDCC5',       // calendar
    };

    const [year, month, day] = dateStr.split('-').map(Number);

    for (const block of blocks) {
      // Skip buffers, sleep blocks, and all-day events
      if (block.type === 'buffer' || block.type === 'sleep' || block.isAllDay) continue;

      const [hours, minutes] = block.startTime.split(':').map(Number);
      const blockDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

      // Schedule 15 minutes before
      const reminderDate = new Date(blockDate.getTime() - 15 * 60 * 1000);

      const emoji = BLOCK_EMOJI[block.type] || '\u23F0';
      await scheduleNotificationAtDate(
        `${emoji} ${block.title}`,
        'Starting in 15 minutes',
        reminderDate,
        { blockId: block.id, screen: 'planner' }
      );
    }

    console.log(`[Notifications] Scheduled reminders for ${blocks.length} blocks on ${dateStr}`);
  }, [permissionStatus, scheduleNotificationAtDate]);

  // Cancel all scheduled notifications
  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[Notifications] All scheduled notifications cancelled');
    } catch (error) {
      console.error('[Notifications] Failed to cancel notifications:', error);
    }
  }, []);

  // Setup: Register for push notifications on mount
  useEffect(() => {
    // Skip push notification registration in development mode
    if (__DEV__) {
      console.log('[Notifications] Skipping push notification registration in dev mode');
      return;
    }

    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        savePushToken(token);
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Notification received:', notification);
      setNotification(notification);
    });

    // Listen for notification interactions (user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Notifications] Notification tapped:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Navigate to specific screen
        console.log('[Notifications] Navigate to:', data.screen);
        // TODO: Implement navigation handler
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Re-save push token when user signs in
  useEffect(() => {
    if (isAuthenticated && expoPushToken) {
      // Inline the token save logic to avoid circular dependency
      api.savePushToken(expoPushToken, Platform.OS).then(success => {
        if (success) {
          console.log('[Notifications] Push token saved to backend');
        } else {
          console.warn('[Notifications] Failed to save push token to backend');
        }
      }).catch(error => {
        console.error('[Notifications] Error saving push token:', error);
      });
    }
  }, [isAuthenticated, expoPushToken]);

  const value = useMemo<NotificationContextType>(() => ({
    expoPushToken,
    notification,
    permissionStatus,
    requestPermission,
    scheduleLocalNotification,
    scheduleNotificationAtDate,
    cancelScheduledNotification,
    scheduleBlockReminders,
    cancelAllNotifications,
  }), [
    expoPushToken,
    notification,
    permissionStatus,
    requestPermission,
    scheduleLocalNotification,
    scheduleNotificationAtDate,
    cancelScheduledNotification,
    scheduleBlockReminders,
    cancelAllNotifications,
  ]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
