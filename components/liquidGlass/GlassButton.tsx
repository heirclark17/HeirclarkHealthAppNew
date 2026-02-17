/**
 * GlassButton - Button Component with Liquid Glass Effect
 *
 * A button component with Liquid Glass styling and press animations.
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassRadius, GlassSpacing, GlassShadows } from '../../theme/liquidGlass';
import { useGlassTheme } from './useGlassTheme';
import { AdaptiveText } from './AdaptiveText';
import { AdaptiveIcon } from './AdaptiveIcon';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export type GlassButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent';
export type GlassButtonSize = 'small' | 'medium' | 'large';

export interface GlassButtonProps {
  /** Button text */
  title?: string;

  /** Icon name (Ionicons) */
  icon?: React.ComponentProps<typeof AdaptiveIcon>['name'];

  /** Icon position */
  iconPosition?: 'left' | 'right';

  /** Button variant */
  variant?: GlassButtonVariant;

  /** Button size */
  size?: GlassButtonSize;

  /** Disabled state */
  disabled?: boolean;

  /** Loading state */
  loading?: boolean;

  /** Full width */
  fullWidth?: boolean;

  /** Custom style */
  style?: ViewStyle;

  /** On press handler */
  onPress?: () => void;

  /** Accessibility label */
  accessibilityLabel?: string;

  /** Accessibility hint */
  accessibilityHint?: string;
}

const getSizeStyles = (size: GlassButtonSize) => {
  switch (size) {
    case 'small':
      return {
        paddingVertical: GlassSpacing.sm,
        paddingHorizontal: GlassSpacing.md,
        iconSize: 16,
        fontSize: 14,
      };
    case 'large':
      return {
        paddingVertical: GlassSpacing.lg,
        paddingHorizontal: GlassSpacing.xxl,
        iconSize: 24,
        fontSize: 18,
      };
    case 'medium':
    default:
      return {
        paddingVertical: GlassSpacing.md,
        paddingHorizontal: GlassSpacing.xl,
        iconSize: 20,
        fontSize: 16,
      };
  }
};

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { isDark, colors, getGlassBackground, getGlassBorder } = useGlassTheme();
  const sizeStyles = getSizeStyles(size);

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(0.8, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.90)',
          textColor: isDark ? colors.textNested.inverse : colors.textNested.inverse,
          iconColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: getGlassBackground('thin'),
          textColor: colors.textNested.primary,
          iconColor: colors.icon.primary,
          borderWidth: 1,
          borderColor: getGlassBorder('thin'),
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: colors.textNested.primary,
          iconColor: colors.icon.primary,
          borderWidth: 0,
        };
      case 'accent':
        return {
          backgroundColor: colors.semantic.info,
          textColor: Colors.text,
          iconColor: Colors.text,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: getGlassBackground('regular'),
          textColor: colors.text.primary,
          iconColor: colors.icon.primary,
          borderWidth: 0,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const buttonStyle: ViewStyle[] = [
    styles.button,
    {
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      backgroundColor: variantStyles.backgroundColor,
      borderWidth: variantStyles.borderWidth,
      borderColor: variantStyles.borderColor,
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const renderContent = () => (
    <View style={styles.content}>
      {icon && iconPosition === 'left' && (
        <AdaptiveIcon
          name={icon}
          size={sizeStyles.iconSize}
          customColor={variantStyles.iconColor}
          style={title ? styles.iconLeft : undefined}
        />
      )}
      {title && (
        <AdaptiveText
          variant={size === 'small' ? 'footnote' : 'callout'}
          customColor={variantStyles.textColor}
          weight="600"
        >
          {title}
        </AdaptiveText>
      )}
      {icon && iconPosition === 'right' && (
        <AdaptiveIcon
          name={icon}
          size={sizeStyles.iconSize}
          customColor={variantStyles.iconColor}
          style={title ? styles.iconRight : undefined}
        />
      )}
    </View>
  );

  return (
    <AnimatedTouchable
      style={[buttonStyle, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={1}
      accessibilityLabel={accessibilityLabel || title || 'Button'}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: GlassRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    ...GlassShadows.subtle,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: GlassSpacing.sm,
  },
  iconRight: {
    marginLeft: GlassSpacing.sm,
  },
});

export default GlassButton;
