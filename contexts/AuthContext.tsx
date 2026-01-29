import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';

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
  isAppleSignInAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@heirclark_auth_user';

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

  // Load saved user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          console.log('[Auth] Loaded saved user:', parsedUser.firstName || parsedUser.email);
        }
      } catch (error) {
        console.error('[Auth] Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Sign in with Apple
  const signInWithApple = useCallback(async (): Promise<boolean> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Build user object
      const newUser: User = {
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

      // Save user
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);

      console.log('[Auth] Signed in successfully:', newUser.firstName || newUser.email || newUser.id);
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

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      console.log('[Auth] Signed out');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    }
  }, []);

  const isAuthenticated = !!user;

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated,
    isLoading,
    signInWithApple,
    signOut,
    isAppleSignInAvailable,
  }), [
    user,
    isAuthenticated,
    isLoading,
    signInWithApple,
    signOut,
    isAppleSignInAvailable,
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
