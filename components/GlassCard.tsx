import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewProps, Platform, InteractionManager } from 'react-native';
import { BlurView } from 'expo-blur';
import { Spacing } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';

// Conditionally import Reanimated only on iOS to avoid web infinite loops
let Animated: any = View;
let useSharedValue: any = null;
let useAnimatedStyle: any = null;
let withTiming: any = null;

if (Platform.OS === 'ios') {
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default;
    useSharedValue = Reanimated.useSharedValue;
    useAnimatedStyle = Reanimated.useAnimatedStyle;
    withTiming = Reanimated.withTiming;
  } catch (e) {
    // Reanimated not available, will use fallback
  }
}

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
  const effectiveIntensity = intensity ?? (isDark ? 20 : 35);
  const effectiveTint = tint || (isDark ? 'dark' : 'light');

  // Track when content is ready before rendering BlurView
  const [isContentReady, setIsContentReady] = useState(false);
  const blurOpacity = useSharedValue ? useSharedValue(0) : { value: 0 };
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const handle = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setIsContentReady(true);
        if (withTiming) {
          blurOpacity.value = withTiming(1, { duration: 200 });
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

  // BlurView fallback with proper render order
  const blurTintColor = tintColor || (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)');
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';

  // Determine if we should use Animated.View or regular View
  const AnimatedViewComponent = Animated !== View ? Animated.View : View;

  return (
    <View
      style={[
        styles.glassCardWrapper,
        { borderRadius: 24 },
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
  const fallbackBg = tintColor || (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)');
  const fallbackBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';

  return (
    <View
      style={[
        styles.fallbackCard,
        {
          backgroundColor: fallbackBg,
          borderColor: fallbackBorder,
          borderWidth: 1,
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
