// Landing Page Glass Button Component
import React from 'react';
import {
  Platform,
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  PressableProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { liquidGlass, radius, spacing, typography } from '../../constants/landingTheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface LandingGlassButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeConfig = {
  sm: {
    height: 36,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    iconSize: 16,
    gap: spacing.xs,
  },
  md: {
    height: 48,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    iconSize: 20,
    gap: spacing.sm,
  },
  lg: {
    height: 56,
    paddingHorizontal: spacing.xl,
    fontSize: 18,
    iconSize: 24,
    gap: spacing.sm,
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function LandingGlassButton({
  variant = 'primary',
  size = 'md',
  label,
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: LandingGlassButtonProps) {
  const config = sizeConfig[size];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 500 });
    opacity.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 500 });
    opacity.value = withSpring(1);
  };

  const isDisabled = disabled || loading;

  const buttonContent = (
    <View style={[styles.content, { gap: config.gap }]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : liquidGlass.text.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.label,
              {
                fontSize: config.fontSize,
                color: variant === 'primary' ? '#fff' : liquidGlass.text.primary,
              },
              isDisabled && styles.labelDisabled,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </View>
  );

  const baseStyle: any[] = [
    styles.button,
    {
      height: config.height,
      paddingHorizontal: config.paddingHorizontal,
      borderRadius: radius.lg,
    },
    fullWidth && styles.fullWidth,
    style,
  ];

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        style={[baseStyle, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        {...props}
      >
        <LinearGradient
          colors={
            isDisabled
              ? ['rgba(78, 205, 196, 0.3)', 'rgba(150, 206, 180, 0.3)']
              : [liquidGlass.accent.primary, liquidGlass.accent.secondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />
        {/* Specular overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'transparent']}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius.lg, height: '50%' },
          ]}
        />
        {buttonContent}
      </AnimatedPressable>
    );
  }

  if (variant === 'secondary') {
    const webStyles = Platform.OS === 'web' ? {
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
    } : {};

    return (
      <AnimatedPressable
        style={[
          baseStyle,
          animatedStyle,
          {
            backgroundColor: liquidGlass.glass.standard,
            borderWidth: 1,
            borderColor: isDisabled
              ? liquidGlass.border.subtle
              : liquidGlass.border.visible,
            ...webStyles,
          },
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        {...props}
      >
        {Platform.OS !== 'web' && (
          <BlurView
            intensity={40}
            tint="dark"
            style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
          />
        )}
        {buttonContent}
      </AnimatedPressable>
    );
  }

  // Ghost variant
  return (
    <AnimatedPressable
      style={[
        baseStyle,
        animatedStyle,
        {
          backgroundColor: 'transparent',
        },
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      {...props}
    >
      {buttonContent}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  labelDisabled: {
    opacity: 0.5,
  },
});
