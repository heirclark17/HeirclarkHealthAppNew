import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { AuthProvider } from '../AuthContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { api } from '../../services/api';

jest.mock('expo-notifications');
jest.mock('expo-device');
jest.mock('../../services/api');
jest.mock('../../services/secureStorage');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <NotificationProvider>{children}</NotificationProvider>
  </AuthProvider>
);

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();

    // Mock Device
    (Device.isDevice as any) = true;

    // Disable __DEV__ to allow push notification registration in tests
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = false;

    // Mock Notifications
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[mock-token]' });
    (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue({});
    (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({ remove: jest.fn() });
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

    (api.savePushToken as jest.Mock).mockResolvedValue(true);
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.expoPushToken).toBeNull();
    expect(result.current.notification).toBeNull();
    expect(result.current.permissionStatus).toBe('undetermined');
  });

  it('requests permission successfully', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.requestPermission();
    });

    expect(success).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('handles permission denial', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.requestPermission();
    });

    expect(success).toBe(false);
    expect(result.current.permissionStatus).toBe('denied');
  });

  it('registers push token', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.expoPushToken).toBeTruthy();
    });
  });

  it('schedules local notification', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('granted');
    });

    await act(async () => {
      await result.current.scheduleLocalNotification('Test', 'Test message');
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('cancels all notifications', async () => {
    (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.cancelAllNotifications();
    });

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useNotifications());
    }).toThrow('useNotifications must be used within a NotificationProvider');
  });
});
