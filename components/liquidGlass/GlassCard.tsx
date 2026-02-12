/**
 * GlassCard - Card Component with Liquid Glass Effect
 *
 * A card component that renders with Liquid Glass styling,
 * supporting multiple variants and sizes.
 *
 * FIXED: Proper render order to ensure frosted glass borders render on initial load
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ViewProps, Platform, InteractionManager } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  GlassMaterials,
  GlassMaterialType,
  GlassRadius,
  GlassRadiusType,
  GlassSpacing,
  GlassShadows,
  GlassShadowType,
} from '../../theme/liquidGlass';
import { useGlassTheme } from './useGlassTheme';
import { GlassView, isLiquidGlassAvailable } from './GlassView';
import { GLASS_SPRING } from '../../constants/Animations';

export type GlassCardVariant = 'standard' | 'elevated' | 'compact' | 'flat';

export interface GlassCardProps extends ViewProps {
  /** Card variant */
  variant?: GlassCardVariant;

  /** Glass material type */
  material?: GlassMaterialType;

  /** Corner radius */
  radius?: GlassRadiusType | number;

  /** Shadow level */
  shadow?: GlassShadowType | 'none';

  /** Custom padding */
  padding?: number;

  /** Remove padding entirely */
  noPadding?: boolean;

  /** Enable interactive press effects */
  interactive?: boolean;

  /** Animate entrance */
  animated?: boolean;

  /** Animation delay (ms) */
  animationDelay?: number;

  /** Children elements */
  children?: React.ReactNode;
}

/**
 * Get variant-specific defaults
 */
function getVariantDefaults(variant: GlassCardVariant) {
  switch (variant) {
    case 'elevated':
      return {
        material: 'thick' as GlassMaterialType,
        radius: 'xlarge' as GlassRadiusType,
        shadow: 'elevated' as GlassShadowType,
        padding: GlassSpacing.lg,
      };
    case 'compact':
      return {
        material: 'thin' as GlassMaterialType,
        radius: 'medium' as GlassRadiusType,
        shadow: 'subtle' as GlassShadowType,
        padding: GlassSpacing.md,
      };
    case 'flat':
      return {
        material: 'ultraThin' as GlassMaterialType,
        radius: 'large' as GlassRadiusType,
        shadow: 'none' as const,
        padding: GlassSpacing.lg,
      };
    case 'standard':
    default:
      return {
        material: 'regular' as GlassMaterialType,
        radius: 'large' as GlassRadiusType,
        shadow: 'standard' as GlassShadowType,
        padding: GlassSpacing.cardPadding,
      };
  }
}

/**
 * GlassCard Component
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'standard',
  material,
  radius,
  shadow,
  padding,
  noPadding = false,
  interactive = false,
  animated = false,
  animationDelay = 0,
  children,
  style,
  ...rest
}) => {
  const { isDark, getGlassBackground, getGlassBorder } = useGlassTheme();
  const defaults = getVariantDefaults(variant);

  // Resolve props with defaults
  const resolvedMaterial = material || defaults.material;
  const resolvedRadius = typeof radius === 'number'
    ? radius
    : GlassRadius[radius || defaults.radius];
  const resolvedShadow = shadow !== undefined ? shadow : defaults.shadow;
  const resolvedPadding = noPadding ? 0 : (padding !== undefined ? padding : defaults.padding);

  // CRITICAL FIX: Track when content is ready before rendering BlurView
  const [isContentReady, setIsContentReady] = useState(false);
  const [blurKey, setBlurKey] = useState(0);
  const blurOpacity = useSharedValue(0);

  // Wait for interactions to complete before rendering blur
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setIsContentReady(true);
        setBlurKey(prev => prev + 1);
        blurOpacity.value = withSpring(1, GLASS_SPRING);
      }, 50);
    });

    return () => handle.cancel();
  }, []);

  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  // Handle layout to trigger blur recalculation
  const handleLayout = useCallback(() => {
    if (isContentReady) {
      setBlurKey(prev => prev + 1);
    }
  }, [isContentReady]);

  // Animation values
  const scale = useSharedValue(animated ? 0.95 : 1);
  const opacity = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      const delay = animationDelay;
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
      }, delay);
    }
  }, [animated, animationDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Get shadow style
  const shadowStyle = resolvedShadow !== 'none' ? GlassShadows[resolvedShadow] : {};

  // Common container style
  const containerStyle = [
    styles.container,
    {
      borderRadius: resolvedRadius,
      padding: resolvedPadding,
    },
    shadowStyle,
    style,
  ];

  // Render content based on platform and Liquid Glass availability
  const renderContent = () => {
    // iOS with native Liquid Glass
    if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
      return (
        <GlassView
          material={resolvedMaterial}
          interactive={interactive}
          style={containerStyle}
          {...rest}
        >
          {children}
        </GlassView>
      );
    }

    // CRITICAL FIX: iOS with BlurView fallback - proper render order
    // Content renders FIRST, BlurView renders AFTER content is ready
    if (Platform.OS === 'ios') {
      const materialSpec = GlassMaterials[resolvedMaterial];
      const blurTint = isDark ? 'dark' : 'light';
      const overlayColor = getGlassBackground(resolvedMaterial);
      const borderColor = getGlassBorder(resolvedMaterial);

      return (
        // Wrapper with overflow: hidden for proper borderRadius on BlurView
        <View
          style={[
            styles.blurWrapper,
            {
              borderRadius: resolvedRadius,
            },
            shadowStyle,
            style,
          ]}
          onLayout={handleLayout}
          {...rest}
        >
          {/* BlurView renders AFTER content is ready with animated fade-in */}
          {isContentReady && (
            <Animated.View
              style={[StyleSheet.absoluteFill, { zIndex: 1, overflow: 'hidden', borderRadius: resolvedRadius }, animatedBlurStyle]}
              pointerEvents="none"
            >
              <BlurView
                key={`blur-${blurKey}`}
                intensity={materialSpec.blurIntensity}
                tint={blurTint}
                style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
              />
            </Animated.View>
          )}

          {/* Content renders on top of blur */}
          <View style={[styles.content, { padding: resolvedPadding, backgroundColor: overlayColor, zIndex: 2 }]}>
            {children}
          </View>

          {/* Border layer renders LAST - on top of everything to ensure visibility */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: resolvedRadius,
                borderWidth: 1,
                borderColor,
                zIndex: 3,
              },
            ]}
            pointerEvents="none"
          />
        </View>
      );
    }

    // Android/Web fallback
    const backgroundColor = getGlassBackground(resolvedMaterial);
    const borderColor = getGlassBorder(resolvedMaterial);

    return (
      <View
        style={[
          styles.fallbackContainer,
          {
            borderRadius: resolvedRadius,
            padding: resolvedPadding,
            backgroundColor,
            borderColor,
          },
          shadowStyle,
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  };

  // Wrap in animated view if needed
  if (animated) {
    return (
      <Animated.View style={animatedStyle}>
        {renderContent()}
      </Animated.View>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  blurContainer: {
    overflow: 'hidden',
  },
  // CRITICAL FIX: Wrapper with overflow hidden for proper borderRadius on BlurView
  blurWrapper: {
    overflow: 'hidden', // CRITICAL: Required for borderRadius to work with BlurView
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  fallbackContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default GlassCard;
