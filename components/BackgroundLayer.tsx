// BackgroundLayer - Global background renderer for iOS 26 Liquid Glass aesthetic
// Renders selected background behind all app content
// Supports solid, gradient, animated, and SVG pattern backgrounds

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, AccessibilityInfo, useColorScheme, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../contexts/SettingsContext';

// Conditionally import Reanimated only on native platforms to avoid web infinite loops
// Provide no-op implementations for web to avoid conditional hook calls
let Animated: any = View;
let useSharedValue: any;
let useAnimatedStyle: any;
let withRepeat: any;
let withTiming: any;
let withSequence: any;
let Easing: any;

if (Platform.OS !== 'web') {
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default;
    useSharedValue = Reanimated.useSharedValue;
    useAnimatedStyle = Reanimated.useAnimatedStyle;
    withRepeat = Reanimated.withRepeat;
    withTiming = Reanimated.withTiming;
    withSequence = Reanimated.withSequence;
    Easing = Reanimated.Easing;
  } catch (e) {
    // Reanimated not available, will use fallback
  }
}

// Fallback implementations for web - no-op hooks that don't animate
if (!useSharedValue) {
  useSharedValue = (initialValue: any) => ({ value: initialValue });
  useAnimatedStyle = (callback: () => any) => callback();
  withTiming = (toValue: any) => toValue;
  withRepeat = (animation: any) => animation;
  withSequence = (...animations: any[]) => animations[0];
  Easing = {
    inOut: (easing: any) => easing,
    ease: 1,
  };
}
import {
  BackgroundId,
  getBackgroundById,
  getGradientColors,
  BACKGROUNDS,
  PatternType,
} from '../constants/backgrounds';
import { DarkColors, LightColors } from '../constants/Theme';
import { PatternBackground } from './patterns/PatternBackground';

interface BackgroundLayerProps {
  children: React.ReactNode;
}

// Animated gradient component for dynamic backgrounds
function AnimatedGradientBackground({ isDark }: { isDark: boolean }) {
  const background = getBackgroundById('dynamic');
  const colors = getGradientColors(background, isDark);

  // Always call hooks unconditionally (no-op on web)
  const animatedOpacity = useSharedValue(1);

  React.useEffect(() => {
    animatedOpacity.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [animatedOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
  }));

  // Use Animated.View on native, regular View on web
  const AnimatedViewComponent = Animated !== View ? Animated.View : View;

  return (
    <AnimatedViewComponent style={[StyleSheet.absoluteFill, animatedStyle]}>
      <LinearGradient
        colors={colors as any}
        locations={background?.colors?.locations as any}
        start={background?.colors?.start || { x: 0, y: 0 }}
        end={background?.colors?.end || { x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </AnimatedViewComponent>
  );
}

// Static gradient background
function GradientBackground({
  backgroundId,
  isDark,
}: {
  backgroundId: BackgroundId;
  isDark: boolean;
}) {
  const background = getBackgroundById(backgroundId);
  const colors = getGradientColors(background, isDark);

  if (!background?.colors) {
    return null;
  }

  return (
    <LinearGradient
      colors={colors as any}
      locations={background.colors.locations as any}
      start={background.colors.start || { x: 0, y: 0 }}
      end={background.colors.end || { x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

// Solid color background (default)
function SolidBackground({ isDark }: { isDark: boolean }) {
  const backgroundColor = isDark ? DarkColors.background : LightColors.background;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
  );
}

// Pattern background using SVG patterns
function PatternBackgroundWrapper({
  patternType,
  isDark,
}: {
  patternType: PatternType;
  isDark: boolean;
}) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <PatternBackground pattern={patternType} isDark={isDark} />
    </View>
  );
}

// Custom photo background from user's device with theme-aware overlay
function CustomPhotoBackground({ uri, isDark }: { uri: string; isDark: boolean }) {
  // Theme-aware overlay for better text readability on custom backgrounds
  // Dark mode: darker overlay to ensure light text is readable
  // Light mode: lighter overlay to ensure dark text is readable
  const overlayColor = isDark
    ? 'rgba(0, 0, 0, 0.45)' // Dark overlay for dark mode (light text)
    : 'rgba(255, 255, 255, 0.35)'; // Light overlay for light mode (dark text)

  return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Theme-aware overlay for consistent text readability */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: overlayColor }
        ]}
      />
    </View>
  );
}

export function BackgroundLayer({ children }: BackgroundLayerProps) {
  const { settings } = useSettings();

  // Determine if dark mode
  const isDark = settings.themeMode === 'dark';

  // Get selected background
  const backgroundId = (settings.backgroundImage || 'default') as BackgroundId;
  const background = getBackgroundById(backgroundId);

  // Check for reduced motion preference (accessibility)
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => subscription?.remove();
  }, []);

  // Render appropriate background
  const renderBackground = useMemo(() => {
    // Custom photo background from user's device
    if (backgroundId === 'custom' && settings.customBackgroundUri) {
      return <CustomPhotoBackground uri={settings.customBackgroundUri} isDark={isDark} />;
    }

    // Default solid background
    if (backgroundId === 'default' || !background) {
      return <SolidBackground isDark={isDark} />;
    }

    // Pattern background (SVG-based textures)
    if (background.type === 'pattern' && background.patternType) {
      return <PatternBackgroundWrapper patternType={background.patternType} isDark={isDark} />;
    }

    // Animated background (with fallback for reduced motion)
    if (background.type === 'animated') {
      if (reduceMotion) {
        // Fall back to static gradient when reduce motion is enabled
        return <GradientBackground backgroundId={backgroundId} isDark={isDark} />;
      }
      return <AnimatedGradientBackground isDark={isDark} />;
    }

    // Gradient background
    if (background.type === 'gradient') {
      return <GradientBackground backgroundId={backgroundId} isDark={isDark} />;
    }

    // Fallback
    return <SolidBackground isDark={isDark} />;
  }, [backgroundId, isDark, reduceMotion, background, settings.customBackgroundUri]);

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <View style={styles.backgroundContainer}>
        {renderBackground}
      </View>

      {/* Content Layer */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
});

export default BackgroundLayer;
