import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, AccessibilityRole } from 'react-native';
import { Spacing } from '../constants/Theme';
import { lightImpact, mediumImpact, heavyImpact, selectionFeedback } from '../utils/haptics';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'none';

interface TouchableWrapperProps extends TouchableOpacityProps {
  minSize?: number;
  haptic?: HapticType;
  children?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
}

/**
 * TouchableWrapper - iOS HIG Compliant Touch Target with Haptics & Accessibility
 *
 * Ensures all touch targets meet the iOS minimum of 44x44 points.
 * Includes optional haptic feedback and accessibility support.
 *
 * @param minSize - Minimum touch target size (default: 44pt iOS standard)
 * @param haptic - Haptic feedback type (default: 'light')
 * @param accessibilityLabel - VoiceOver label for the button
 * @param accessibilityHint - VoiceOver hint describing what happens when pressed
 * @param accessibilityRole - Accessibility role (default: 'button')
 * @param style - Additional styles to apply
 * @param children - Child components
 *
 * @example
 * <TouchableWrapper
 *   haptic="light"
 *   onPress={handlePress}
 *   accessibilityLabel="Close"
 *   accessibilityHint="Closes this dialog"
 * >
 *   <Icon name="close" />
 * </TouchableWrapper>
 *
 * <TouchableWrapper
 *   haptic="medium"
 *   onPress={handleSave}
 *   accessibilityLabel="Save changes"
 * >
 *   <Text>Save</Text>
 * </TouchableWrapper>
 */
export function TouchableWrapper({
  minSize = Spacing.touchTarget,
  haptic = 'light',
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  style,
  children,
  onPress,
  ...props
}: TouchableWrapperProps) {
  const handlePress = async (event: any) => {
    // Trigger haptic feedback
    switch (haptic) {
      case 'light':
        await lightImpact();
        break;
      case 'medium':
        await mediumImpact();
        break;
      case 'heavy':
        await heavyImpact();
        break;
      case 'selection':
        await selectionFeedback();
        break;
      case 'none':
      default:
        break;
    }

    // Call the original onPress handler
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          minWidth: minSize,
          minHeight: minSize
        },
        style
      ]}
      onPress={handlePress}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
