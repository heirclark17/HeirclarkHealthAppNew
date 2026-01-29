import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Utilities
 *
 * iOS HIG-compliant haptic feedback for user interactions.
 * Only triggers on iOS; no-op on Android/Web.
 *
 * Reference: https://developer.apple.com/design/human-interface-guidelines/playing-haptics
 */

/**
 * Light impact - for subtle UI feedback
 * Use for: Tab selection, toggle switches, small button taps
 */
export const lightImpact = async () => {
  if (Platform.OS === 'ios') {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics not available
    }
  }
};

/**
 * Medium impact - for more noticeable feedback
 * Use for: Important button presses, completing actions
 */
export const mediumImpact = async () => {
  if (Platform.OS === 'ios') {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Haptics not available
    }
  }
};

/**
 * Heavy impact - for significant actions
 * Use for: Delete confirmations, major state changes
 */
export const heavyImpact = async () => {
  if (Platform.OS === 'ios') {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      // Haptics not available
    }
  }
};

/**
 * Selection feedback - for picker/selection changes
 * Use for: Date pickers, scrolling selections, segment controls
 */
export const selectionFeedback = async () => {
  if (Platform.OS === 'ios') {
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      // Haptics not available
    }
  }
};

/**
 * Success notification - for successful completions
 * Use for: Save success, goal achieved, workout complete
 */
export const successNotification = async () => {
  if (Platform.OS === 'ios') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Haptics not available
    }
  }
};

/**
 * Warning notification - for warnings/alerts
 * Use for: Warning messages, approaching limits
 */
export const warningNotification = async () => {
  if (Platform.OS === 'ios') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      // Haptics not available
    }
  }
};

/**
 * Error notification - for errors/failures
 * Use for: Validation errors, failed actions, blocked operations
 */
export const errorNotification = async () => {
  if (Platform.OS === 'ios') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      // Haptics not available
    }
  }
};

/**
 * Soft impact - for very subtle feedback (iOS 17+)
 * Use for: Scrolling, very light interactions
 */
export const softImpact = async () => {
  if (Platform.OS === 'ios') {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } catch (e) {
      // Haptics not available
    }
  }
};

/**
 * Rigid impact - for firm feedback (iOS 17+)
 * Use for: Snapping into place, rigid UI elements
 */
export const rigidImpact = async () => {
  if (Platform.OS === 'ios') {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    } catch (e) {
      // Haptics not available
    }
  }
};

// Convenience object for all haptic types
export const haptics = {
  light: lightImpact,
  medium: mediumImpact,
  heavy: heavyImpact,
  selection: selectionFeedback,
  success: successNotification,
  warning: warningNotification,
  error: errorNotification,
  soft: softImpact,
  rigid: rigidImpact,
};

export default haptics;
