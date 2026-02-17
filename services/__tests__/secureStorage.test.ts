// @ts-nocheck
/**
 * Tests for secureStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage, SECURE_KEYS } from '../secureStorage';
import { Platform } from 'react-native';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const SecureStore = require('expo-secure-store');

// Mock Platform to simulate iOS/Android
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('secureStorage', () => {
  beforeEach(() => {
    AsyncStorage.__resetStore();
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  describe('setItem', () => {
    it('should store item successfully', async () => {
      const result = await secureStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'test-token');
      expect(result).toBe(true);
    });

    it('should handle errors and return false', async () => {
      // Mock both SecureStore and AsyncStorage to fail
      SecureStore.setItemAsync.mockRejectedValueOnce(new Error('Storage error'));
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));
      const result = await secureStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'test-token');
      expect(result).toBe(false);
    });

    it('should fall back to AsyncStorage for large values', async () => {
      const largeValue = 'x'.repeat(3000); // Exceeds MAX_SECURE_VALUE_LENGTH
      await secureStorage.setItem(SECURE_KEYS.AUTH_TOKEN, largeValue);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(SECURE_KEYS.AUTH_TOKEN, largeValue);
    });

    it('should handle empty string values', async () => {
      const result = await secureStorage.setItem(SECURE_KEYS.AUTH_TOKEN, '');
      expect(result).toBe(true);
    });
  });

  describe('getItem', () => {
    it('should retrieve stored item from AsyncStorage', async () => {
      await AsyncStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'test-token');
      const result = await secureStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
      expect(result).toBe('test-token');
    });

    it('should return null when item does not exist', async () => {
      const result = await secureStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      // Mock both SecureStore and AsyncStorage to fail
      SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Storage error'));
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
      const result = await secureStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
      expect(result).toBeNull();
    });

    it('should retrieve from SecureStore when available', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce('secure-token');
      const result = await secureStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
      expect(result).toBe('secure-token');
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', async () => {
      await AsyncStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'test-token');
      const result = await secureStorage.removeItem(SECURE_KEYS.AUTH_TOKEN);
      expect(result).toBe(true);
      const item = await AsyncStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
      expect(item).toBeNull();
    });

    it('should handle errors and return false', async () => {
      // Mock both SecureStore and AsyncStorage to fail
      SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Remove error'));
      AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Remove error'));
      const result = await secureStorage.removeItem(SECURE_KEYS.AUTH_TOKEN);
      expect(result).toBe(false);
    });

    it('should remove from both SecureStore and AsyncStorage', async () => {
      await secureStorage.removeItem(SECURE_KEYS.AUTH_TOKEN);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(SECURE_KEYS.AUTH_TOKEN);
    });
  });

  describe('setAuthToken', () => {
    it('should store auth token', async () => {
      const result = await secureStorage.setAuthToken('auth-token-123');
      expect(result).toBe(true);
      const stored = await AsyncStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
      expect(stored).toBe('auth-token-123');
    });
  });

  describe('getAuthToken', () => {
    it('should retrieve auth token', async () => {
      await AsyncStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'auth-token-123');
      const result = await secureStorage.getAuthToken();
      expect(result).toBe('auth-token-123');
    });

    it('should return null when no token exists', async () => {
      const result = await secureStorage.getAuthToken();
      expect(result).toBeNull();
    });
  });

  describe('clearAuthToken', () => {
    it('should clear auth token', async () => {
      await AsyncStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'auth-token-123');
      const result = await secureStorage.clearAuthToken();
      expect(result).toBe(true);
      const token = await AsyncStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
      expect(token).toBeNull();
    });
  });

  describe('setCustomerId', () => {
    it('should store customer ID', async () => {
      const result = await secureStorage.setCustomerId('customer-456');
      expect(result).toBe(true);
      const stored = await AsyncStorage.getItem(SECURE_KEYS.CUSTOMER_ID);
      expect(stored).toBe('customer-456');
    });
  });

  describe('getCustomerId', () => {
    it('should retrieve customer ID', async () => {
      await AsyncStorage.setItem(SECURE_KEYS.CUSTOMER_ID, 'customer-456');
      const result = await secureStorage.getCustomerId();
      expect(result).toBe('customer-456');
    });
  });

  describe('setAppleId', () => {
    it('should store Apple ID', async () => {
      const result = await secureStorage.setAppleId('apple-id-789');
      expect(result).toBe(true);
      const stored = await AsyncStorage.getItem(SECURE_KEYS.APPLE_ID);
      expect(stored).toBe('apple-id-789');
    });
  });

  describe('getAppleId', () => {
    it('should retrieve Apple ID', async () => {
      await AsyncStorage.setItem(SECURE_KEYS.APPLE_ID, 'apple-id-789');
      const result = await secureStorage.getAppleId();
      expect(result).toBe('apple-id-789');
    });
  });

  describe('clearAllAuthData', () => {
    it('should clear all auth data', async () => {
      await AsyncStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'token');
      await AsyncStorage.setItem(SECURE_KEYS.CUSTOMER_ID, 'customer');
      await AsyncStorage.setItem(SECURE_KEYS.APPLE_ID, 'apple');
      await AsyncStorage.setItem(SECURE_KEYS.REFRESH_TOKEN, 'refresh');

      await secureStorage.clearAllAuthData();

      const token = await AsyncStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
      const customer = await AsyncStorage.getItem(SECURE_KEYS.CUSTOMER_ID);
      const apple = await AsyncStorage.getItem(SECURE_KEYS.APPLE_ID);
      const refresh = await AsyncStorage.getItem(SECURE_KEYS.REFRESH_TOKEN);

      expect(token).toBeNull();
      expect(customer).toBeNull();
      expect(apple).toBeNull();
      expect(refresh).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      await AsyncStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'token');
      const result = await secureStorage.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when no token exists', async () => {
      const result = await secureStorage.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return false when token is empty string', async () => {
      // Set in both stores to ensure it's found
      SecureStore.getItemAsync.mockResolvedValueOnce('');
      await AsyncStorage.setItem(SECURE_KEYS.AUTH_TOKEN, '');
      const result = await secureStorage.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('migrateFromAsyncStorage', () => {
    it('should skip migration when SecureStore not available', async () => {
      await secureStorage.migrateFromAsyncStorage();
      // Should not throw error
    });

    it('should handle errors gracefully during migration', async () => {
      SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Migration error'));
      await expect(secureStorage.migrateFromAsyncStorage()).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle null values', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const result = await secureStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
      expect(result).toBeNull();
    });

    it('should handle storage quota exceeded', async () => {
      // Mock both stores to fail with quota error
      SecureStore.setItemAsync.mockRejectedValueOnce(new Error('QuotaExceededError'));
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('QuotaExceededError'));
      const result = await secureStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'token');
      expect(result).toBe(false);
    });

    it('should handle multiple concurrent operations', async () => {
      const promises = [
        secureStorage.setItem(SECURE_KEYS.AUTH_TOKEN, 'token1'),
        secureStorage.setItem(SECURE_KEYS.CUSTOMER_ID, 'customer1'),
        secureStorage.setItem(SECURE_KEYS.APPLE_ID, 'apple1'),
      ];
      const results = await Promise.all(promises);
      expect(results).toEqual([true, true, true]);
    });
  });
});
