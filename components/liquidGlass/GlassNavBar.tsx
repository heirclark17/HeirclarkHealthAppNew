/**
 * GlassNavBar - Navigation Bar Component with Liquid Glass Effect
 *
 * A navigation bar component with Liquid Glass styling for headers.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { GlassRadius, GlassSpacing, GlassShadows, GlassMaterials } from '../../theme/liquidGlass';
import { useGlassTheme } from './useGlassTheme';
import { AdaptiveText } from './AdaptiveText';
import { AdaptiveIcon } from './AdaptiveIcon';
import { GlassButton } from './GlassButton';

export type GlassNavBarVariant = 'default' | 'large' | 'transparent';

export interface GlassNavBarProps {
  /** Navigation title */
  title?: string;

  /** Large title (for large variant) */
  largeTitle?: string;

  /** Nav bar variant */
  variant?: GlassNavBarVariant;

  /** Left button icon */
  leftIcon?: React.ComponentProps<typeof AdaptiveIcon>['name'];

  /** Left button label */
  leftLabel?: string;

  /** On left button press */
  onLeftPress?: () => void;

  /** Right button icon */
  rightIcon?: React.ComponentProps<typeof AdaptiveIcon>['name'];

  /** Right button label */
  rightLabel?: string;

  /** On right button press */
  onRightPress?: () => void;

  /** Secondary right button icon */
  secondaryRightIcon?: React.ComponentProps<typeof AdaptiveIcon>['name'];

  /** On secondary right button press */
  onSecondaryRightPress?: () => void;

  /** Scroll offset for animation (optional) */
  scrollY?: SharedValue<number>;

  /** Custom center content */
  centerContent?: React.ReactNode;

  /** Container style */
  style?: ViewStyle;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const GlassNavBar: React.FC<GlassNavBarProps> = ({
  title,
  largeTitle,
  variant = 'default',
  leftIcon,
  leftLabel,
  onLeftPress,
  rightIcon,
  rightLabel,
  onRightPress,
  secondaryRightIcon,
  onSecondaryRightPress,
  scrollY,
  centerContent,
  style,
}) => {
  const { isDark, colors, getGlassBackground } = useGlassTheme();
  const insets = useSafeAreaInsets();

  const displayTitle = title || largeTitle;

  // Animated styles based on scroll
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: variant === 'transparent' ? 0 : 1 };

    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [variant === 'transparent' ? 0 : 0.5, 1],
      'clamp'
    );

    return { opacity };
  });

  const animatedTitleStyle = useAnimatedStyle(() => {
    if (!scrollY || variant !== 'large') return { opacity: 1, transform: [{ translateY: 0 }] };

    const opacity = interpolate(
      scrollY.value,
      [0, 50, 100],
      [0, 0.5, 1],
      'clamp'
    );

    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [10, 0],
      'clamp'
    );

    return { opacity, transform: [{ translateY }] };
  });

  const animatedLargeTitleStyle = useAnimatedStyle(() => {
    if (!scrollY || variant !== 'large') return { opacity: 1, transform: [{ scale: 1 }] };

    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0],
      'clamp'
    );

    const scale = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0.9],
      'clamp'
    );

    return { opacity, transform: [{ scale }] };
  });

  const blurTint = isDark ? 'dark' : 'light';
  const materialSpec = GlassMaterials.regular;

  const renderNavContent = () => (
    <View style={styles.navContent}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {(leftIcon || leftLabel) && onLeftPress && (
          <GlassButton
            icon={leftIcon}
            title={leftLabel}
            variant="ghost"
            size="small"
            onPress={onLeftPress}
          />
        )}
      </View>

      {/* Center Section */}
      <Animated.View style={[styles.centerSection, animatedTitleStyle]}>
        {centerContent || (
          displayTitle && (
            <AdaptiveText
              variant="headline"
              weight="600"
              numberOfLines={1}
            >
              {displayTitle}
            </AdaptiveText>
          )
        )}
      </Animated.View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {secondaryRightIcon && onSecondaryRightPress && (
          <GlassButton
            icon={secondaryRightIcon}
            variant="ghost"
            size="small"
            onPress={onSecondaryRightPress}
            style={styles.secondaryButton}
          />
        )}
        {(rightIcon || rightLabel) && onRightPress && (
          <GlassButton
            icon={rightIcon}
            title={rightLabel}
            variant="ghost"
            size="small"
            onPress={onRightPress}
          />
        )}
      </View>
    </View>
  );

  // Transparent variant
  if (variant === 'transparent') {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
          },
          animatedBackgroundStyle,
          style,
        ]}
      >
        {renderNavContent()}
      </Animated.View>
    );
  }

  // iOS with BlurView
  if (Platform.OS === 'ios') {
    return (
      <AnimatedBlurView
        intensity={materialSpec.blurIntensity}
        tint={blurTint}
        style={[
          styles.container,
          styles.blurContainer,
          {
            paddingTop: insets.top,
          },
          animatedBackgroundStyle,
          style,
        ]}
      >
        <View style={[styles.overlay, { backgroundColor: getGlassBackground('thin') }]}>
          {renderNavContent()}

          {/* Large Title */}
          {variant === 'large' && largeTitle && (
            <Animated.View style={[styles.largeTitleContainer, animatedLargeTitleStyle]}>
              <AdaptiveText variant="largeTitle" weight="700">
                {largeTitle}
              </AdaptiveText>
            </Animated.View>
          )}
        </View>
      </AnimatedBlurView>
    );
  }

  // Android/Web fallback
  return (
    <Animated.View
      style={[
        styles.container,
        styles.fallbackContainer,
        {
          paddingTop: insets.top,
          backgroundColor: getGlassBackground('regular'),
        },
        animatedBackgroundStyle,
        style,
      ]}
    >
      {renderNavContent()}

      {/* Large Title */}
      {variant === 'large' && largeTitle && (
        <Animated.View style={[styles.largeTitleContainer, animatedLargeTitleStyle]}>
          <AdaptiveText variant="largeTitle" weight="700">
            {largeTitle}
          </AdaptiveText>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurContainer: {
    overflow: 'hidden',
  },
  fallbackContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    ...GlassShadows.subtle,
  },
  overlay: {
    flex: 1,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: GlassSpacing.md,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  secondaryButton: {
    marginRight: GlassSpacing.xs,
  },
  largeTitleContainer: {
    paddingHorizontal: GlassSpacing.lg,
    paddingBottom: GlassSpacing.sm,
  },
});

export default GlassNavBar;
