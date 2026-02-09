import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { api } from '../services/api';
import { secureStorage, SECURE_KEYS } from '../services/secureStorage';

// User interface
interface User {
  id: string;
  email: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUserName: (fullName: string) => Promise<boolean>;
  isAppleSignInAvailable: boolean;
  needsNamePrompt: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@heirclark_auth_user';
const AUTH_TOKEN_KEY = 'heirclark_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  // Check if Apple Sign In is available
  useEffect(() => {
    const checkAvailability = async () => {
      if (Platform.OS === 'ios') {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setIsAppleSignInAvailable(isAvailable);
      }
    };
    checkAvailability();
  }, []);

  // Load saved user and verify token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // First check if we have a token (using secure storage)
        const token = await secureStorage.getAuthToken();
        if (token) {
          // Token exists - verify it with backend
          // Note: calling refreshAuth directly instead of from dependency
          const backendUser = await api.getCurrentUser();
          if (!backendUser) {
            console.warn('[Auth] Token invalid or expired, clearing session');
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            await secureStorage.clearAuthToken();
            setUser(null);
          } else {
            // Load local user data to merge with backend user
            const savedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            const parsed = savedUser ? JSON.parse(savedUser) : {};

            // Debug logging
            console.log('[Auth] Backend user data:', JSON.stringify(backendUser));
            console.log('[Auth] Cached user data:', JSON.stringify(parsed));

            // Get fullName from backend or local cache
            const fullName = backendUser.fullName || parsed.fullName || null;

            // Extract firstName from fullName if not available in cache
            let firstName = parsed.firstName || null;
            let lastName = parsed.lastName || null;

            if (!firstName && fullName) {
              const nameParts = fullName.trim().split(' ');
              firstName = nameParts[0] || null;
              lastName = nameParts.slice(1).join(' ') || null;
            }

            const mergedUser: User = {
              id: backendUser.id,
              email: backendUser.email || parsed.email || null,
              fullName,
              firstName,
              lastName,
            };

            // Save updated user to cache (with extracted firstName)
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mergedUser));
            setUser(mergedUser);
            console.log('[Auth] Token verified successfully, user:', firstName || backendUser.email || backendUser.id);
          }
        } else {
          // No token - load cached user info if available (for display purposes)
          const savedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            console.log('[Auth] Cached user data found (not authenticated):', parsedUser.firstName || parsedUser.email);
            // Don't set user state - they need to re-authenticate
          }
        }
      } catch (error) {
        console.error('[Auth] Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Sign in with Apple
  const signInWithApple = useCallback(async (): Promise<boolean> => {
    try {
      // Step 1: Get Apple credential from device
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Step 2: Build user object from Apple credential
      let newUser: User = {
        id: credential.user,
        email: credential.email,
        fullName: credential.fullName
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : null,
        firstName: credential.fullName?.givenName || null,
        lastName: credential.fullName?.familyName || null,
      };

      // Apple only provides name/email on FIRST sign-in
      // On subsequent sign-ins, we need to use cached data
      const existingUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (existingUser) {
        const parsed = JSON.parse(existingUser);
        // If the new credential doesn't have name/email, use existing
        if (!newUser.fullName && parsed.fullName) {
          newUser.fullName = parsed.fullName;
          newUser.firstName = parsed.firstName;
          newUser.lastName = parsed.lastName;
        }
        if (!newUser.email && parsed.email) {
          newUser.email = parsed.email;
        }
      }

      // Step 3: Authenticate with backend and get JWT token
      console.log('[Auth] Authenticating with backend...');
      const backendUser = await api.authenticateWithApple(
        credential.user,
        newUser.email || undefined,
        newUser.fullName || undefined
      );

      if (!backendUser) {
        console.error('[Auth] Backend authentication failed');
        Alert.alert('Authentication Failed', 'Could not verify your identity with the server. Please try again.');
        return false;
      }

      // Step 4: Merge backend user data with local user data
      // Backend returns: { id, email, fullName, avatarUrl }
      newUser = {
        id: backendUser.id,
        email: backendUser.email || newUser.email,
        fullName: backendUser.fullName || newUser.fullName,
        firstName: newUser.firstName, // Keep local firstName/lastName
        lastName: newUser.lastName,
      };

      // Extract firstName from fullName if not available
      if (!newUser.firstName && newUser.fullName) {
        const nameParts = newUser.fullName.trim().split(' ');
        newUser.firstName = nameParts[0] || null;
        newUser.lastName = nameParts.slice(1).join(' ') || null;
      }

      // Step 5: Save user to local storage
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);

      console.log('[Auth] Signed in successfully:', newUser.firstName || newUser.email || newUser.id);
      console.log('[Auth] JWT token received and stored');
      return true;
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled - not an error
        console.log('[Auth] Sign in canceled by user');
      } else {
        console.error('[Auth] Sign in error:', error);
        Alert.alert('Sign In Failed', 'There was an error signing in with Apple. Please try again.');
      }
      return false;
    }
  }, []);

  // Refresh authentication - verify token with backend
  const refreshAuth = useCallback(async () => {
    try {
      const token = await secureStorage.getAuthToken();
      if (!token) {
        console.log('[Auth] No token found, user not authenticated');
        setUser(null);
        return;
      }

      // Verify token with backend
      const backendUser = await api.getCurrentUser();
      if (!backendUser) {
        console.warn('[Auth] Token invalid or expired, clearing session');
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        await secureStorage.clearAuthToken();
        setUser(null);
        return;
      }

      // Load local user data to merge with backend user
      const savedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const parsed = savedUser ? JSON.parse(savedUser) : {};

      // Get fullName from backend or local cache
      const fullName = backendUser.fullName || parsed.fullName || null;

      // Extract firstName from fullName if not available in cache
      let firstName = parsed.firstName || null;
      let lastName = parsed.lastName || null;

      if (!firstName && fullName) {
        const nameParts = fullName.trim().split(' ');
        firstName = nameParts[0] || null;
        lastName = nameParts.slice(1).join(' ') || null;
      }

      const mergedUser: User = {
        id: backendUser.id,
        email: backendUser.email || parsed.email || null,
        fullName,
        firstName,
        lastName,
      };

      // Save updated user to cache (with extracted firstName)
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mergedUser));
      setUser(mergedUser);
      console.log('[Auth] Token refreshed successfully, user:', firstName || backendUser.email || backendUser.id);
    } catch (error) {
      console.error('[Auth] Token refresh error:', error);
      setUser(null);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      // Call backend logout endpoint
      await api.logout();

      // Clear local storage (user data)
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      // Clear secure storage (auth token and sensitive data)
      await secureStorage.clearAllAuthData();
      setUser(null);

      console.log('[Auth] Signed out successfully (secure storage cleared)');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      // Even if backend call fails, clear local state
      setUser(null);
    }
  }, []);

  // Update user's name (for when Apple didn't provide it)
  const updateUserName = useCallback(async (fullName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Extract firstName and lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(' ') || null;

      // Update backend
      const success = await api.updateProfile({ fullName });
      if (!success) {
        console.error('[Auth] Failed to update name on backend');
        return false;
      }

      // Update local state
      const updatedUser: User = {
        ...user,
        fullName,
        firstName,
        lastName,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);

      console.log('[Auth] Name updated successfully:', firstName);
      return true;
    } catch (error) {
      console.error('[Auth] Error updating name:', error);
      return false;
    }
  }, [user]);

  const isAuthenticated = !!user;

  // Check if user needs to provide their name
  const needsNamePrompt = isAuthenticated && !user?.firstName && !isLoading;

  // Periodic token refresh (every 15 minutes)
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const refreshInterval = setInterval(() => {
      console.log('[Auth] Periodic token refresh');
      refreshAuth();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, isLoading, refreshAuth]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated,
    isLoading,
    signInWithApple,
    signOut,
    refreshAuth,
    updateUserName,
    isAppleSignInAvailable,
    needsNamePrompt,
  }), [
    user,
    isAuthenticated,
    isLoading,
    signInWithApple,
    signOut,
    refreshAuth,
    updateUserName,
    isAppleSignInAvailable,
    needsNamePrompt,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
