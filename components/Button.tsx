import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Typography } from '../constants/Theme';
import { lightImpact, mediumImpact, successNotification } from '../utils/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'glass';
type ButtonSize = 'default' | 'small' | 'large';
type HapticType = 'light' | 'medium' | 'success' | 'none';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// iOS 26 Liquid Glass colors
const GLASS_COLORS = {
  light: {
    primary: 'rgba(0, 122, 255, 0.85)',
    primaryText: Colors.text,
    secondary: 'rgba(255, 255, 255, 0.6)',
    secondaryBorder: 'rgba(0, 0, 0, 0.08)',
    tertiary: 'rgba(255, 255, 255, 0.4)',
    destructive: 'rgba(255, 59, 48, 0.85)',
    glass: 'rgba(255, 255, 255, 0.5)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    primary: 'rgba(10, 132, 255, 0.85)',
    primaryText: Colors.text,
    secondary: 'rgba(255, 255, 255, 0.12)',
    secondaryBorder: 'rgba(255, 255, 255, 0.15)',
    tertiary: 'rgba(255, 255, 255, 0.08)',
    destructive: 'rgba(255, 69, 58, 0.85)',
    glass: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
  },
};

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
  /** Enable glass blur effect (default: true for glass variant) */
  useBlur?: boolean;
}

/**
 * Button - iOS 26 Liquid Glass Button Component
 *
 * A standardized button component with proper touch targets (44pt minimum),
 * spring animations, haptic feedback, glass morphism, and accessibility support.
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
  useBlur = false,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  // Spring animation for press state
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, GLASS_SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, GLASS_SPRING);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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

  // Get variant-specific styles
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: glassColors.primary,
            shadowColor: isDark ? '#0A84FF' : '#007AFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 3,
          },
          text: { color: glassColors.primaryText },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: glassColors.secondary,
            borderWidth: 1,
            borderColor: glassColors.secondaryBorder,
          },
          text: { color: isDark ? Colors.text : Colors.text },
        };
      case 'tertiary':
        return {
          container: {
            backgroundColor: glassColors.tertiary,
          },
          text: { color: isDark ? 'rgba(255, 255, 255, 0.8)' : Colors.text },
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: glassColors.destructive,
            shadowColor: Colors.errorStrong,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 3,
          },
          text: { color: Colors.text },
        };
      case 'glass':
        return {
          container: {
            backgroundColor: glassColors.glass,
            borderWidth: 1,
            borderColor: glassColors.glassBorder,
            shadowColor: Colors.background,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          },
          text: { color: isDark ? Colors.text : Colors.text },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  // Get size-specific styles
  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: {
            minHeight: 32,
            paddingVertical: Spacing.xs,
            paddingHorizontal: Spacing.md,
            borderRadius: Spacing.radiusXS,
          },
          text: { fontSize: Typography.footnote.fontSize },
        };
      case 'large':
        return {
          container: {
            minHeight: Spacing.touchTargetLarge,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.xl,
            borderRadius: Spacing.radiusMD,
          },
          text: { fontSize: Typography.title3.fontSize },
        };
      default:
        return {
          container: {
            minHeight: Spacing.touchTarget,
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.lg,
            borderRadius: Spacing.radiusSM,
          },
          text: { fontSize: Typography.headline.fontSize },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyles: ViewStyle[] = [
    styles.base,
    sizeStyles.container,
    variantStyles.container,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    sizeStyles.text,
    variantStyles.text,
    (disabled || loading) && styles.disabledText,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  const shouldUseBlur = useBlur || variant === 'glass';
  const blurIntensity = isDark ? 25 : 40;

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color as string}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </>
  );

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={containerStyles}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
        }}
      >
        {shouldUseBlur && (
          <BlurView
            intensity={blurIntensity}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.content}>
          {buttonContent}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  text: {
    fontFamily: Fonts.semiBold,
  },

  fullWidth: {
    width: '100%',
  },

  // Use rgba for disabled state instead of opacity property
  disabled: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
  },

  disabledText: {
    color: 'rgba(128, 128, 128, 0.6)',
  },
});

export default Button;
