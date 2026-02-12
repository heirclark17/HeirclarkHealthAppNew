/**
 * GlassInput - Text Input Component with Liquid Glass Effect
 *
 * A text input component with Liquid Glass styling and focus animations.
 */

import React, { useState, useRef } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GlassRadius, GlassSpacing, GlassShadows } from '../../theme/liquidGlass';
import { useGlassTheme } from './useGlassTheme';
import { AdaptiveText } from './AdaptiveText';
import { AdaptiveIcon } from './AdaptiveIcon';
import { GLASS_SPRING } from '../../constants/Animations';

export type GlassInputVariant = 'default' | 'filled' | 'outline';
export type GlassInputSize = 'small' | 'medium' | 'large';

export interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Input variant */
  variant?: GlassInputVariant;

  /** Input size */
  size?: GlassInputSize;

  /** Left icon name (Ionicons) */
  leftIcon?: React.ComponentProps<typeof AdaptiveIcon>['name'];

  /** Right icon name (Ionicons) */
  rightIcon?: React.ComponentProps<typeof AdaptiveIcon>['name'];

  /** On right icon press */
  onRightIconPress?: () => void;

  /** Error message */
  error?: string;

  /** Helper text */
  helperText?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Container style */
  containerStyle?: ViewStyle;

  /** Input style */
  style?: ViewStyle;
}

const getSizeStyles = (size: GlassInputSize) => {
  switch (size) {
    case 'small':
      return {
        paddingVertical: GlassSpacing.sm,
        paddingHorizontal: GlassSpacing.md,
        fontSize: 14,
        iconSize: 16,
        labelSize: 'caption1' as const,
      };
    case 'large':
      return {
        paddingVertical: GlassSpacing.lg,
        paddingHorizontal: GlassSpacing.xl,
        fontSize: 18,
        iconSize: 24,
        labelSize: 'callout' as const,
      };
    case 'medium':
    default:
      return {
        paddingVertical: GlassSpacing.md,
        paddingHorizontal: GlassSpacing.lg,
        fontSize: 16,
        iconSize: 20,
        labelSize: 'footnote' as const,
      };
  }
};

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  placeholder,
  variant = 'default',
  size = 'medium',
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  helperText,
  disabled = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { isDark, colors, getGlassBackground, getGlassBorder } = useGlassTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sizeStyles = getSizeStyles(size);

  // Animation values
  const borderOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderOpacity.value = withSpring(1, GLASS_SPRING);
    scale.value = withSpring(1.01, { damping: 15, stiffness: 300 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderOpacity.value = withSpring(0, GLASS_SPRING);
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onBlur?.(e);
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  // Variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: getGlassBackground('regular'),
          borderWidth: 0,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: getGlassBorder('regular'),
        };
      case 'default':
      default:
        return {
          backgroundColor: getGlassBackground('thin'),
          borderWidth: 1,
          borderColor: getGlassBorder('thin'),
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Colors
  const textColor = colors.text.primary;
  const placeholderColor = colors.text.muted;
  const focusBorderColor = error ? colors.semantic.error : colors.semantic.info;

  const inputContainerStyle: ViewStyle[] = [
    styles.inputContainer,
    {
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      backgroundColor: variantStyles.backgroundColor,
      borderWidth: variantStyles.borderWidth,
      borderColor: error ? colors.semantic.error : variantStyles.borderColor,
    },
    disabled && styles.disabled,
    style,
  ];

  return (
    <Animated.View style={[styles.container, animatedContainerStyle, containerStyle]}>
      {label && (
        <AdaptiveText
          variant={sizeStyles.labelSize}
          color="secondary"
          style={styles.label}
        >
          {label}
        </AdaptiveText>
      )}

      <View style={styles.inputWrapper}>
        <View style={inputContainerStyle}>
          {leftIcon && (
            <AdaptiveIcon
              name={leftIcon}
              size={sizeStyles.iconSize}
              color="secondary"
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                fontSize: sizeStyles.fontSize,
                color: textColor,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            {...rest}
          />

          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              style={styles.rightIcon}
            >
              <AdaptiveIcon
                name={rightIcon}
                size={sizeStyles.iconSize}
                color="secondary"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Focus border overlay */}
        <Animated.View
          style={[
            styles.focusBorder,
            {
              borderColor: focusBorderColor,
              borderRadius: GlassRadius.medium,
              pointerEvents: 'none',
            },
            animatedBorderStyle,
          ]}
        />
      </View>

      {(error || helperText) && (
        <AdaptiveText
          variant="caption1"
          customColor={error ? colors.semantic.error : colors.text.muted}
          style={styles.helperText}
        >
          {error || helperText}
        </AdaptiveText>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: GlassSpacing.xs,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: GlassRadius.medium,
    ...GlassShadows.subtle,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  leftIcon: {
    marginRight: GlassSpacing.sm,
  },
  rightIcon: {
    marginLeft: GlassSpacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  focusBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: GlassRadius.medium,
  },
  helperText: {
    marginTop: GlassSpacing.xs,
  },
});

export default GlassInput;
