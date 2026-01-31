// MidnightGoldGlassCard - iOS 26 Liquid Glass with Midnight Gold theme
// Designed to pair with the Midnight Gold Luxe Leopard print background
// Features gold-tinted frosted glass with enhanced blur for premium look

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ViewProps, Platform, InteractionManager } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Spacing, MidnightGoldColors, LiquidGlass } from '../constants/Theme';

// Try to import Liquid Glass (only works after rebuild)
let LiquidGlassView: any = null;
let isLiquidGlassSupported = false;
try {
  const liquidGlass = require('@callstack/liquid-glass');
  LiquidGlassView = liquidGlass.LiquidGlassView;
  isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported;
} catch (e) {
  // Liquid Glass not available yet (needs rebuild)
}

interface MidnightGoldGlassCardProps extends ViewProps {
  intensity?: number;
  children?: React.ReactNode;
  interactive?: boolean;
  selected?: boolean;
  glowEffect?: boolean; // Enable subtle gold glow
}

export const MidnightGoldGlassCard: React.FC<MidnightGoldGlassCardProps> = ({
  intensity,
  children,
  style,
  interactive = false,
  selected = false,
  glowEffect = false,
  ...rest
}) => {
  // Track when content is ready before rendering BlurView
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

  // Handle layout to trigger blur update
  const handleLayout = useCallback(() => {
    if (isContentReady) {
      setBlurKey(prev => prev + 1);
    }
  }, [isContentReady]);

  // Midnight Gold: Higher blur intensity for better gold contrast
  const effectiveIntensity = intensity ?? LiquidGlass.blurIntensity.midnightGold;

  // Midnight Gold glass colors
  const glassColors = useMemo(() => ({
    background: selected ? MidnightGoldColors.glassSelected : MidnightGoldColors.glassCard,
    border: selected ? MidnightGoldColors.glassSelectedBorder : MidnightGoldColors.glassBorder,
  }), [selected]);

  // Extract layout styles to pass to inner content View
  const flatStyle = StyleSheet.flatten(style) || {};
  const contentLayoutStyle = {
    flexDirection: flatStyle.flexDirection,
    alignItems: flatStyle.alignItems,
    justifyContent: flatStyle.justifyContent,
    gap: flatStyle.gap,
    flexWrap: flatStyle.flexWrap,
  };

  // iOS: Use Liquid Glass if available, otherwise BlurView
  if (Platform.OS === 'ios') {
    // Use authentic iOS 26 Liquid Glass if available
    if (LiquidGlassView && isLiquidGlassSupported) {
      return (
        <LiquidGlassView
          effect="regular"
          interactive={interactive}
          colorScheme="dark"
          style={[
            styles.glassCard,
            glowEffect && styles.goldGlow,
            style,
          ]}
          {...rest}
        >
          <View style={[styles.content, contentLayoutStyle]}>
            {children}
          </View>
        </LiquidGlassView>
      );
    }

    // BlurView fallback with gold-tinted styling
    return (
      <View
        style={[
          styles.glassCardWrapper,
          {
            borderRadius: 24,
            borderWidth: 1,
            borderColor: glassColors.border,
          },
          glowEffect && styles.goldGlow,
          style,
        ]}
        onLayout={handleLayout}
        {...rest}
      >
        {/* Content renders FIRST */}
        <View style={[styles.content, { backgroundColor: glassColors.background }, contentLayoutStyle]}>
          {children}
        </View>

        {/* BlurView renders AFTER content is ready */}
        {isContentReady && (
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.blurOverlay, animatedBlurStyle]}
            pointerEvents="none"
          >
            <BlurView
              key={`blur-${blurKey}`}
              intensity={effectiveIntensity}
              tint="dark"
              style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
            />
          </Animated.View>
        )}
      </View>
    );
  }

  // Android/Web fallback - Midnight Gold styling
  return (
    <View
      style={[
        styles.fallbackCard,
        {
          backgroundColor: glassColors.background,
          borderColor: glassColors.border,
          borderWidth: 1,
        },
        glowEffect && styles.goldGlowFallback,
        style,
        contentLayoutStyle,
      ]}
      {...rest}
    >
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
  // Gold glow effect for iOS
  goldGlow: {
    shadowColor: MidnightGoldColors.goldPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  // Gold glow fallback for Android/Web
  goldGlowFallback: {
    elevation: 8,
  },
});

export default MidnightGoldGlassCard;
