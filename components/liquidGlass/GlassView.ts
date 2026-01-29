/**
 * GlassView - Base Liquid Glass Component
 *
 * Provides native iOS 26 Liquid Glass effect when available,
 * with graceful fallbacks for older iOS, Android, and Web.
 */

import React from 'react';
import { View, StyleSheet, ViewProps, Platform, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassMaterials, GlassMaterialType, GlassRadius } from '../../theme/liquidGlass';
import { useGlassTheme } from './useGlassTheme';

// Dynamic imports for native Liquid Glass (iOS 26+)
let NativeLiquidGlassView: any = null;
let NativeLiquidGlassContainerView: any = null;
let nativeLiquidGlassSupported = false;

// Try @callstack/liquid-glass first
try {
  const liquidGlass = require('@callstack/liquid-glass');
  NativeLiquidGlassView = liquidGlass.LiquidGlassView;
  NativeLiquidGlassContainerView = liquidGlass.LiquidGlassContainerView;
  nativeLiquidGlassSupported = liquidGlass.isLiquidGlassSupported === true;
} catch (e) {
  // Try expo-glass-effect as fallback
  try {
    const expoGlass = require('expo-glass-effect');
    NativeLiquidGlassView = expoGlass.GlassView;
    NativeLiquidGlassContainerView = expoGlass.GlassContainer;
    nativeLiquidGlassSupported = expoGlass.isLiquidGlassAvailable?.() === true;
  } catch (e2) {
    // Native Liquid Glass not available
  }
}

/**
 * Check if native Liquid Glass is available
 */
export function isLiquidGlassAvailable(): boolean {
  return nativeLiquidGlassSupported && Platform.OS === 'ios';
}

// =============================================================================
// GLASS VIEW COMPONENT
// =============================================================================

export interface GlassViewProps extends ViewProps {
  /** Glass material variant */
  material?: GlassMaterialType;

  /** Enable interactive press effects (iOS 26 only) */
  interactive?: boolean;

  /** Override tint color */
  tintColor?: string;

  /** Children elements */
  children?: React.ReactNode;
}

/**
 * GlassView Component
 *
 * Renders a glass surface with proper blur and styling.
 * Uses native iOS 26 Liquid Glass when available.
 */
export const GlassView: React.FC<GlassViewProps> = ({
  material = 'regular',
  interactive = false,
  tintColor,
  children,
  style,
  ...rest
}) => {
  const { isDark, colors, getGlassBackground, getGlassBorder } = useGlassTheme();
  const materialSpec = GlassMaterials[material];
  const colorScheme = isDark ? 'dark' : 'light';

  // Use native Liquid Glass on iOS 26+
  if (Platform.OS === 'ios' && NativeLiquidGlassView && nativeLiquidGlassSupported) {
    return React.createElement(
      NativeLiquidGlassView,
      {
        effect: materialSpec.effect,
        interactive,
        colorScheme,
        tintColor,
        style: [styles.glassBase, style],
        ...rest,
      },
      children
    );
  }

  // iOS fallback with BlurView
  if (Platform.OS === 'ios') {
    const blurTint = isDark ? 'dark' : 'light';
    const overlayColor = tintColor || getGlassBackground(material);

    return React.createElement(
      BlurView,
      {
        intensity: materialSpec.blurIntensity,
        tint: blurTint,
        style: [styles.glassBase, style],
        ...rest,
      },
      React.createElement(
        View,
        { style: [styles.overlay, { backgroundColor: overlayColor }] },
        children
      )
    );
  }

  // Android/Web fallback with semi-transparent background
  const fallbackBg = tintColor || getGlassBackground(material);
  const borderColor = getGlassBorder(material);

  return React.createElement(
    View,
    {
      style: [
        styles.glassBase,
        styles.fallback,
        {
          backgroundColor: fallbackBg,
          borderColor,
        },
        style,
      ],
      ...rest,
    },
    children
  );
};

// =============================================================================
// GLASS CONTAINER COMPONENT
// =============================================================================

export interface GlassContainerProps extends ViewProps {
  /** Spacing at which glass elements merge (iOS 26 only) */
  spacing?: number;

  /** Children elements */
  children: React.ReactNode;
}

/**
 * GlassContainer Component
 *
 * Container for grouping glass elements that can merge together.
 * On iOS 26+, glass elements within will morph when close together.
 */
export const GlassContainer: React.FC<GlassContainerProps> = ({
  spacing = 16,
  children,
  style,
  ...rest
}) => {
  // Use native container on iOS 26+
  if (Platform.OS === 'ios' && NativeLiquidGlassContainerView && nativeLiquidGlassSupported) {
    return React.createElement(
      NativeLiquidGlassContainerView,
      {
        spacing,
        style,
        ...rest,
      },
      children
    );
  }

  // Fallback: regular View (no merging effect)
  return React.createElement(
    View,
    {
      style,
      ...rest,
    },
    children
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  glassBase: {
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
  },
  fallback: {
    borderWidth: 1,
  },
});

export default GlassView;
