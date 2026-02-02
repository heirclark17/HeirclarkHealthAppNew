import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewProps, Platform, InteractionManager } from 'react-native';
import { BlurView } from 'expo-blur';
import { Spacing } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';

// Conditionally import Reanimated only on native platforms to avoid web infinite loops
// Provide no-op implementations for web to avoid conditional hook calls
let Animated: any = View;
let useSharedValue: any;
let useAnimatedStyle: any;
let withTiming: any;
let withSpring: any;

if (Platform.OS !== 'web') {
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default;
    useSharedValue = Reanimated.useSharedValue;
    useAnimatedStyle = Reanimated.useAnimatedStyle;
    withTiming = Reanimated.withTiming;
    withSpring = Reanimated.withSpring;
  } catch (e) {
    // Reanimated not available, will use fallback
  }
}

// Fallback implementations for web - no-op hooks that don't animate
if (!useSharedValue) {
  useSharedValue = (initialValue: any) => ({ value: initialValue });
  useAnimatedStyle = (callback: () => any) => callback();
  withSpring = (toValue: any) => toValue;
  withTiming = (toValue: any) => toValue;
}

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// iOS 26 Liquid Glass colors - Fixed for authentic translucency
const GLASS_COLORS = {
  light: {
    background: 'rgba(255, 255, 255, 0.40)',  // Reduced opacity for lighter glass
    border: 'rgba(0, 0, 0, 0.08)',             // Dark border for light mode contrast
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    background: 'rgba(255, 255, 255, 0.15)',   // Increased opacity for visibility
    border: 'rgba(255, 255, 255, 0.15)',       // Slightly higher for definition
    shadow: 'rgba(0, 0, 0, 0.25)',
  },
};

// Try to import Liquid Glass (only works after rebuild)
let LiquidGlassView: any = null;
let LiquidGlassContainerView: any = null;
let isLiquidGlassSupported = false;
try {
  const liquidGlass = require('@callstack/liquid-glass');
  LiquidGlassView = liquidGlass.LiquidGlassView;
  LiquidGlassContainerView = liquidGlass.LiquidGlassContainerView;
  isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported;
} catch (e) {
  // Liquid Glass not available yet (needs rebuild)
}

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'default' | 'light' | 'dark';
  tintColor?: string;
  children?: React.ReactNode;
  interactive?: boolean; // iOS 26 Liquid Glass interactive prop
}

// iOS-specific GlassCard with animations and BlurView
const IOSGlassCard: React.FC<GlassCardProps & { isDark: boolean; contentLayoutStyle: any }> = ({
  intensity,
  tint,
  tintColor,
  children,
  style,
  interactive = false,
  isDark,
  contentLayoutStyle,
  ...rest
}) => {
  const effectiveIntensity = intensity ?? (isDark ? 40 : 35);  // Dark mode needs MORE blur for definition
  const effectiveTint = tint || (isDark ? 'dark' : 'light');

  // Track when content is ready before rendering BlurView
  const [isContentReady, setIsContentReady] = useState(false);
  const blurOpacity = useSharedValue(0);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const handle = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setIsContentReady(true);
        if (withSpring) {
          blurOpacity.value = withSpring(1, GLASS_SPRING);  // iOS 26 spring physics
        } else {
          blurOpacity.value = 1;
        }
      }, 50);
    });

    return () => handle.cancel();
  }, []);

  const animatedBlurStyle = useAnimatedStyle
    ? useAnimatedStyle(() => ({
        opacity: blurOpacity.value,
      }))
    : { opacity: 1 };

  // Use authentic iOS 26 Liquid Glass if available
  if (LiquidGlassView && isLiquidGlassSupported) {
    return (
      <LiquidGlassView
        effect="regular"
        interactive={interactive}
        colorScheme={effectiveTint === 'light' ? 'light' : 'dark'}
        style={[styles.glassCard, style]}
        {...rest}
      >
        <View style={[styles.content, contentLayoutStyle]}>
          {children}
        </View>
      </LiquidGlassView>
    );
  }

  // BlurView fallback with iOS 26 Liquid Glass styling
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;
  const blurTintColor = tintColor || glassColors.background;
  const borderColor = glassColors.border;

  // Determine if we should use Animated.View or regular View
  const AnimatedViewComponent = Animated !== View ? Animated.View : View;

  // iOS 26 soft shadow
  const shadowStyle = Platform.OS === 'ios' ? {
    shadowColor: glassColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  } : {
    elevation: 4,
  };

  return (
    <View
      style={[
        styles.glassCardWrapper,
        { borderRadius: 24 },
        shadowStyle,
        style,
      ]}
      {...rest}
    >
      {isContentReady && (
        <AnimatedViewComponent
          style={[StyleSheet.absoluteFill, styles.blurOverlay, animatedBlurStyle]}
          pointerEvents="none"
        >
          <BlurView
            intensity={effectiveIntensity}
            tint={effectiveTint}
            style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
          />
        </AnimatedViewComponent>
      )}

      <View style={[styles.content, { backgroundColor: blurTintColor }, contentLayoutStyle]}>
        {children}
      </View>

      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 24,
            borderWidth: 1,
            borderColor: borderColor,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
};

// Simple fallback GlassCard for Android/Web (no animations, no Reanimated)
const FallbackGlassCard: React.FC<GlassCardProps & { isDark: boolean; contentLayoutStyle: any }> = ({
  tintColor,
  children,
  style,
  isDark,
  contentLayoutStyle,
  ...rest
}) => {
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;
  const fallbackBg = tintColor || glassColors.background;
  const fallbackBorder = glassColors.border;

  return (
    <View
      style={[
        styles.fallbackCard,
        {
          backgroundColor: fallbackBg,
          borderColor: fallbackBorder,
          borderWidth: 1,
          // Soft shadow for depth
          elevation: 4,
        },
        style,
        contentLayoutStyle,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

// Main GlassCard component that routes to the appropriate implementation
export const GlassCard: React.FC<GlassCardProps> = (props) => {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';

  // Extract layout styles to pass to inner content View
  const flatStyle = StyleSheet.flatten(props.style) || {};
  const contentLayoutStyle = {
    flexDirection: flatStyle.flexDirection,
    alignItems: flatStyle.alignItems,
    justifyContent: flatStyle.justifyContent,
    gap: flatStyle.gap,
    flexWrap: flatStyle.flexWrap,
  };

  // Use platform-specific implementation
  if (Platform.OS === 'ios') {
    return <IOSGlassCard {...props} isDark={isDark} contentLayoutStyle={contentLayoutStyle} />;
  }

  return <FallbackGlassCard {...props} isDark={isDark} contentLayoutStyle={contentLayoutStyle} />;
};

// Glass Container for merging multiple glass elements (iOS 26 feature)
interface GlassContainerProps extends ViewProps {
  spacing?: number;
  children: React.ReactNode;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  spacing = 16,
  children,
  style,
  ...rest
}) => {
  if (Platform.OS === 'ios' && LiquidGlassContainerView && isLiquidGlassSupported) {
    return (
      <LiquidGlassContainerView spacing={spacing} style={style} {...rest}>
        {children}
      </LiquidGlassContainerView>
    );
  }

  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassCardWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  blurOverlay: {
    overflow: 'hidden',
    borderRadius: 24,
    zIndex: -1,
  },
  content: {
    padding: Spacing.cardPadding,
    zIndex: 1,
  },
  fallbackCard: {
    borderRadius: 24,
    padding: Spacing.cardPadding,
    overflow: 'hidden',
  },
});

export { isLiquidGlassSupported };
