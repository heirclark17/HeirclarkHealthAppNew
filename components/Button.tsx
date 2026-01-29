import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Fonts, Spacing, Typography } from '../constants/Theme';
import { lightImpact, mediumImpact, successNotification } from '../utils/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type ButtonSize = 'default' | 'small' | 'large';
type HapticType = 'light' | 'medium' | 'success' | 'none';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  haptic?: HapticType;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Button - iOS HIG Compliant Button Component
 *
 * A standardized button component with proper touch targets (44pt minimum),
 * haptic feedback, and accessibility support.
 *
 * @example
 * <Button
 *   title="Save"
 *   onPress={handleSave}
 *   variant="primary"
 *   haptic="success"
 *   accessibilityLabel="Save changes"
 * />
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  fullWidth = false,
  haptic = 'light',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const handlePress = async () => {
    if (disabled || loading) return;

    // Trigger haptic feedback
    switch (haptic) {
      case 'light':
        await lightImpact();
        break;
      case 'medium':
        await mediumImpact();
        break;
      case 'success':
        await successNotification();
        break;
      case 'none':
      default:
        break;
    }

    onPress();
  };

  const buttonStyles: ViewStyle[] = [styles.base];
  const textStyles: TextStyle[] = [styles.text];

  // Apply variant styles
  switch (variant) {
    case 'primary':
      buttonStyles.push(styles.primary);
      textStyles.push(styles.primaryText);
      break;
    case 'secondary':
      buttonStyles.push(styles.secondary);
      textStyles.push(styles.secondaryText);
      break;
    case 'tertiary':
      buttonStyles.push(styles.tertiary);
      textStyles.push(styles.tertiaryText);
      break;
    case 'destructive':
      buttonStyles.push(styles.destructive);
      textStyles.push(styles.destructiveText);
      break;
  }

  // Apply size styles
  switch (size) {
    case 'small':
      buttonStyles.push(styles.small);
      textStyles.push(styles.smallText);
      break;
    case 'large':
      buttonStyles.push(styles.large);
      textStyles.push(styles.largeText);
      break;
    default:
      break;
  }

  // Apply modifiers
  if (fullWidth) {
    buttonStyles.push(styles.fullWidth);
  }

  if (disabled || loading) {
    buttonStyles.push(styles.disabled);
  }

  if (style) {
    buttonStyles.push(style);
  }

  if (textStyle) {
    textStyles.push(textStyle);
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? Colors.primaryText : Colors.text}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.radiusSM,
    minHeight: Spacing.touchTarget,  // 44pt iOS minimum
  },

  // Variant styles
  primary: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm - 1,
    paddingHorizontal: Spacing.lg - 1,
  },

  tertiary: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },

  destructive: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  // Text styles
  text: {
    fontFamily: Fonts.semiBold,
  },

  primaryText: {
    color: Colors.primaryText,
    fontSize: Typography.headline.fontSize,
  },

  secondaryText: {
    color: Colors.text,
    fontSize: Typography.headline.fontSize,
  },

  tertiaryText: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
  },

  destructiveText: {
    color: Colors.primaryText,
    fontSize: Typography.headline.fontSize,
  },

  // Size styles
  small: {
    minHeight: 32,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusXS,
  },

  smallText: {
    fontSize: Typography.footnote.fontSize,
  },

  large: {
    minHeight: Spacing.touchTargetLarge,  // 48pt
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  largeText: {
    fontSize: Typography.title3.fontSize,
  },

  // Modifiers
  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
  },
});

export default Button;
