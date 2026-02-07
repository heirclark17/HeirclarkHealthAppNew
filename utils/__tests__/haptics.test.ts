import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  lightImpact,
  mediumImpact,
  heavyImpact,
  softImpact,
  rigidImpact,
  selectionFeedback,
  successNotification,
  warningNotification,
  errorNotification,
  haptics,
} from '../haptics';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Soft: 'soft',
    Rigid: 'rigid',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

// ============================================
// Tests
// ============================================
describe('haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('lightImpact', () => {
    it('calls impactAsync with Light style on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      await lightImpact();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('does nothing on Android', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      await lightImpact();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('does nothing on web', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
        configurable: true,
      });

      await lightImpact();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('Haptics unavailable'));

      await expect(lightImpact()).resolves.not.toThrow();
    });
  });

  describe('mediumImpact', () => {
    it('calls impactAsync with Medium style on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      await mediumImpact();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('does nothing on non-iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      await mediumImpact();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('heavyImpact', () => {
    it('calls impactAsync with Heavy style on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      await heavyImpact();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('does nothing on non-iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      await heavyImpact();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('softImpact', () => {
    it('calls impactAsync with Soft style on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      await softImpact();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Soft);
    });

    it('does nothing on non-iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      await softImpact();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('rigidImpact', () => {
    it('calls impactAsync with Rigid style on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      await rigidImpact();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Rigid);
    });

    it('does nothing on non-iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      await rigidImpact();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('selectionFeedback', () => {
    it('calls selectionAsync on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      await selectionFeedback();

      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });

    it('does nothing on non-iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      await selectionFeedback();

      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    });
  });

  describe('successNotification', () => {
    it('calls notificationAsync with Success type on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      await successNotification();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('does nothing on non-iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      await successNotification();

      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('warningNotification', () => {
    it('calls notificationAsync with Warning type on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      await warningNotification();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    it('does nothing on non-iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      await warningNotification();

      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('errorNotification', () => {
    it('calls notificationAsync with Error type on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      await errorNotification();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    it('does nothing on non-iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      await errorNotification();

      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('haptics convenience object', () => {
    it('has all expected keys', () => {
      expect(haptics).toHaveProperty('light');
      expect(haptics).toHaveProperty('medium');
      expect(haptics).toHaveProperty('heavy');
      expect(haptics).toHaveProperty('selection');
      expect(haptics).toHaveProperty('success');
      expect(haptics).toHaveProperty('warning');
      expect(haptics).toHaveProperty('error');
      expect(haptics).toHaveProperty('soft');
      expect(haptics).toHaveProperty('rigid');
    });

    it('all values are functions', () => {
      expect(typeof haptics.light).toBe('function');
      expect(typeof haptics.medium).toBe('function');
      expect(typeof haptics.heavy).toBe('function');
      expect(typeof haptics.selection).toBe('function');
      expect(typeof haptics.success).toBe('function');
      expect(typeof haptics.warning).toBe('function');
      expect(typeof haptics.error).toBe('function');
      expect(typeof haptics.soft).toBe('function');
      expect(typeof haptics.rigid).toBe('function');
    });

    it('functions match exported functions', () => {
      expect(haptics.light).toBe(lightImpact);
      expect(haptics.medium).toBe(mediumImpact);
      expect(haptics.heavy).toBe(heavyImpact);
      expect(haptics.selection).toBe(selectionFeedback);
      expect(haptics.success).toBe(successNotification);
      expect(haptics.warning).toBe(warningNotification);
      expect(haptics.error).toBe(errorNotification);
      expect(haptics.soft).toBe(softImpact);
      expect(haptics.rigid).toBe(rigidImpact);
    });
  });
});
