/**
 * Secure Storage Service
 * Encrypted storage for sensitive data using expo-secure-store
 * Provides fallback to AsyncStorage for non-sensitive data or Expo Go
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamically import SecureStore to avoid crash in Expo Go
let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch (error) {
  console.warn('[SecureStorage] expo-secure-store not available, using AsyncStorage fallback');
}

// Keys for secure storage (alphanumeric, ".", "-", "_" only - no "@" allowed)
export const SECURE_KEYS = {
  AUTH_TOKEN: 'heirclark_auth_token',
  CUSTOMER_ID: 'heirclark_customer_id',
  APPLE_ID: 'heirclark_apple_id',
  LAST_SYNC: 'heirclark_last_sync',
  REFRESH_TOKEN: 'heirclark_refresh_token',
} as const;

// Maximum value length for SecureStore (2048 bytes)
const MAX_SECURE_VALUE_LENGTH = 2048;

class SecureStorageService {
  private isSecureStoreAvailable: boolean = false;

  constructor() {
    // Run availability check first, then migrate
    // Both are async but fire-and-forget in constructor
    this.checkAvailability().then(() => this.migrateOldKeys()).catch(() => {});
  }

  /**
   * Migrate data from old @ keys to new valid keys
   */
  private async migrateOldKeys(): Promise<void> {
    const oldToNewKeys: Record<string, string> = {
      '@heirclark_auth_token': SECURE_KEYS.AUTH_TOKEN,
      '@heirclark_customer_id': SECURE_KEYS.CUSTOMER_ID,
      '@heirclark_apple_id': SECURE_KEYS.APPLE_ID,
      '@heirclark_last_sync': SECURE_KEYS.LAST_SYNC,
      '@heirclark_refresh_token': SECURE_KEYS.REFRESH_TOKEN,
    };

    try {
      for (const [oldKey, newKey] of Object.entries(oldToNewKeys)) {
        const oldValue = await AsyncStorage.getItem(oldKey);
        if (oldValue) {
          const newValue = await AsyncStorage.getItem(newKey);
          if (!newValue) {
            console.log(`[SecureStorage] Migrating ${oldKey} to ${newKey}`);
            await AsyncStorage.setItem(newKey, oldValue);
          }
          // Remove old key after migration
          await AsyncStorage.removeItem(oldKey);
        }
      }
    } catch (error) {
      console.warn('[SecureStorage] Old key migration error:', error);
    }
  }

  /**
   * Check if SecureStore is available on this platform
   */
  private async checkAvailability(): Promise<void> {
    try {
      // SecureStore is only available on iOS and Android
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Try a test operation to verify it's working
        await SecureStore.getItemAsync('__test__');
        this.isSecureStoreAvailable = true;
        console.log('[SecureStorage] SecureStore is available');
      } else {
        this.isSecureStoreAvailable = false;
        console.log('[SecureStorage] SecureStore not available on this platform, using AsyncStorage');
      }
    } catch (error) {
      this.isSecureStoreAvailable = false;
      console.warn('[SecureStorage] SecureStore not available, falling back to AsyncStorage');
    }
  }

  /**
   * Securely store a value
   * Uses SecureStore on iOS/Android, AsyncStorage as fallback
   */
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (this.isSecureStoreAvailable && value.length <= MAX_SECURE_VALUE_LENGTH) {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        console.log(`[SecureStorage] Stored ${key} securely`);
      } else {
        // Fallback to AsyncStorage for large values or unsupported platforms
        await AsyncStorage.setItem(key, value);
        console.log(`[SecureStorage] Stored ${key} in AsyncStorage`);
      }
      return true;
    } catch (error) {
      console.error(`[SecureStorage] Error storing ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve a securely stored value
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isSecureStoreAvailable) {
        const value = await SecureStore.getItemAsync(key);
        if (value) return value;
      }
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[SecureStorage] Error retrieving ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a securely stored value
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      if (this.isSecureStoreAvailable) {
        await SecureStore.deleteItemAsync(key);
      }
      // Also clear from AsyncStorage in case it was stored there
      await AsyncStorage.removeItem(key);
      console.log(`[SecureStorage] Removed ${key}`);
      return true;
    } catch (error) {
      console.error(`[SecureStorage] Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Store authentication token securely
   */
  async setAuthToken(token: string): Promise<boolean> {
    return this.setItem(SECURE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Get authentication token
   */
  async getAuthToken(): Promise<string | null> {
    return this.getItem(SECURE_KEYS.AUTH_TOKEN);
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken(): Promise<boolean> {
    return this.removeItem(SECURE_KEYS.AUTH_TOKEN);
  }

  /**
   * Store customer ID securely
   */
  async setCustomerId(customerId: string): Promise<boolean> {
    return this.setItem(SECURE_KEYS.CUSTOMER_ID, customerId);
  }

  /**
   * Get customer ID
   */
  async getCustomerId(): Promise<string | null> {
    return this.getItem(SECURE_KEYS.CUSTOMER_ID);
  }

  /**
   * Store Apple ID securely
   */
  async setAppleId(appleId: string): Promise<boolean> {
    return this.setItem(SECURE_KEYS.APPLE_ID, appleId);
  }

  /**
   * Get Apple ID
   */
  async getAppleId(): Promise<string | null> {
    return this.getItem(SECURE_KEYS.APPLE_ID);
  }

  /**
   * Clear all authentication data (for logout)
   */
  async clearAllAuthData(): Promise<void> {
    await Promise.all([
      this.removeItem(SECURE_KEYS.AUTH_TOKEN),
      this.removeItem(SECURE_KEYS.CUSTOMER_ID),
      this.removeItem(SECURE_KEYS.APPLE_ID),
      this.removeItem(SECURE_KEYS.REFRESH_TOKEN),
    ]);
    console.log('[SecureStorage] All auth data cleared');
  }

  /**
   * Migrate data from AsyncStorage to SecureStore
   * Call this during app upgrade to migrate existing users
   */
  async migrateFromAsyncStorage(): Promise<void> {
    if (!this.isSecureStoreAvailable) {
      console.log('[SecureStorage] SecureStore not available, skipping migration');
      return;
    }

    try {
      // List of keys to migrate
      const keysToMigrate = Object.values(SECURE_KEYS);

      for (const key of keysToMigrate) {
        // Check if value exists in AsyncStorage but not in SecureStore
        const asyncValue = await AsyncStorage.getItem(key);
        const secureValue = await SecureStore.getItemAsync(key);

        if (asyncValue && !secureValue) {
          console.log(`[SecureStorage] Migrating ${key} to SecureStore`);
          await SecureStore.setItemAsync(key, asyncValue, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
          });
          // Optionally remove from AsyncStorage after migration
          // await AsyncStorage.removeItem(key);
        }
      }

      console.log('[SecureStorage] Migration complete');
    } catch (error) {
      console.error('[SecureStorage] Migration error:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService();
export default secureStorage;
