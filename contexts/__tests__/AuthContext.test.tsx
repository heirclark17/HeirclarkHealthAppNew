import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider, useAuth } from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { api } from '../../services/api';
import { secureStorage } from '../../services/secureStorage';

// Mock dependencies
jest.mock('expo-apple-authentication');
jest.mock('../../services/api');
jest.mock('../../services/secureStorage');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();

    // Default mock implementations
    (secureStorage.getAuthToken as jest.Mock).mockResolvedValue(null);
    (secureStorage.clearAuthToken as jest.Mock).mockResolvedValue(undefined);
    (secureStorage.clearAllAuthData as jest.Mock).mockResolvedValue(undefined);
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true);
  });

  it('provides initial state correctly', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.needsNamePrompt).toBe(false);
  });

  it('signs in with Apple successfully', async () => {
    const mockCredential = {
      user: 'test-user-id',
      email: 'test@example.com',
      fullName: {
        givenName: 'John',
        familyName: 'Doe',
      },
    };

    const mockBackendUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: 'John Doe',
    };

    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue(mockCredential);
    (api.authenticateWithApple as jest.Mock).mockResolvedValue(mockBackendUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let signInResult: boolean = false;
    await act(async () => {
      signInResult = await result.current.signInWithApple();
    });

    expect(signInResult).toBe(true);
    expect(result.current.user).toEqual(expect.objectContaining({
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
    }));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles Apple sign in failure', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue(new Error('Sign in failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let signInResult: boolean = false;
    await act(async () => {
      signInResult = await result.current.signInWithApple();
    });

    expect(signInResult).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles user canceling Apple sign in', async () => {
    const cancelError: any = new Error('User canceled');
    cancelError.code = 'ERR_REQUEST_CANCELED';

    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue(cancelError);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let signInResult: boolean = false;
    await act(async () => {
      signInResult = await result.current.signInWithApple();
    });

    expect(signInResult).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('signs out successfully', async () => {
    // Setup authenticated state
    const mockBackendUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: 'John Doe',
    };

    (secureStorage.getAuthToken as jest.Mock).mockResolvedValue('mock-token');
    (api.getCurrentUser as jest.Mock).mockResolvedValue(mockBackendUser);
    (api.logout as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(secureStorage.clearAllAuthData).toHaveBeenCalled();
    expect(api.logout).toHaveBeenCalled();
  });

  it('refreshes auth token successfully', async () => {
    const mockBackendUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: 'John Doe',
    };

    (secureStorage.getAuthToken as jest.Mock).mockResolvedValue('mock-token');
    (api.getCurrentUser as jest.Mock).mockResolvedValue(mockBackendUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.refreshAuth();
    });

    expect(result.current.user).toEqual(expect.objectContaining({
      id: 'test-user-id',
      email: 'test@example.com',
    }));
  });

  it('clears user when token is invalid during refresh', async () => {
    (secureStorage.getAuthToken as jest.Mock).mockResolvedValue('invalid-token');
    (api.getCurrentUser as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(secureStorage.clearAuthToken).toHaveBeenCalled();
  });

  it('updates user name successfully', async () => {
    // Setup authenticated state
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: null,
      firstName: null,
      lastName: null,
    };

    (secureStorage.getAuthToken as jest.Mock).mockResolvedValue('mock-token');
    (api.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (api.updateProfile as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    let updateResult: boolean = false;
    await act(async () => {
      updateResult = await result.current.updateUserName('Jane Smith');
    });

    expect(updateResult).toBe(true);
    expect(result.current.user).toEqual(expect.objectContaining({
      fullName: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
    }));
  });

  it('identifies when user needs name prompt', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: null,
      firstName: null,
      lastName: null,
    };

    (secureStorage.getAuthToken as jest.Mock).mockResolvedValue('mock-token');
    (api.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.needsNamePrompt).toBe(true);
  });

  it('persists user to AsyncStorage on sign in', async () => {
    const mockCredential = {
      user: 'test-user-id',
      email: 'test@example.com',
      fullName: {
        givenName: 'John',
        familyName: 'Doe',
      },
    };

    const mockBackendUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: 'John Doe',
    };

    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue(mockCredential);
    (api.authenticateWithApple as jest.Mock).mockResolvedValue(mockBackendUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signInWithApple();
    });

    const stored = await AsyncStorage.getItem('@heirclark_auth_user');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.id).toBe('test-user-id');
    expect(parsed.fullName).toBe('John Doe');
  });

  it('throws error when useAuth is called outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('handles backend authentication failure', async () => {
    const mockCredential = {
      user: 'test-user-id',
      email: 'test@example.com',
      fullName: {
        givenName: 'John',
        familyName: 'Doe',
      },
    };

    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue(mockCredential);
    (api.authenticateWithApple as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let signInResult: boolean = false;
    await act(async () => {
      signInResult = await result.current.signInWithApple();
    });

    expect(signInResult).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
