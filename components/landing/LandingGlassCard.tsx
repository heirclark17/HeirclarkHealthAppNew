// Landing Page Glass Card Component
// FIXED: Proper render order for frosted glass borders
import React, { useState, useEffect, useCallback } from 'react';
import { Platform, View, ViewProps, StyleSheet, Pressable, InteractionManager } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { liquidGlass, glassBlur, radius } from '../../constants/landingTheme';
import { GLASS_SPRING } from '../../constants/Animations';

type GlassTier = 'subtle' | 'standard' | 'elevated';

interface LandingGlassCardProps extends ViewProps {
  tier?: GlassTier;
  hasSpecular?: boolean;
  hasGlow?: boolean;
  glowColor?: string;
  interactive?: boolean;
  borderRadius?: number;
  onPress?: () => void;
  children: React.ReactNode;
}

const tierConfig = {
  subtle: {
    blur: glassBlur.subtle,
    bg: liquidGlass.glass.subtle,
    border: liquidGlass.border.subtle,
    shadow: 0.08,
  },
  standard: {
    blur: glassBlur.standard,
    bg: liquidGlass.glass.standard,
    border: liquidGlass.border.standard,
    shadow: 0.12,
  },
  elevated: {
    blur: glassBlur.elevated,
    bg: liquidGlass.glass.elevated,
    border: liquidGlass.border.visible,
    shadow: 0.2,
  },
};

function SpecularHighlight({ borderRadius: br }: { borderRadius: number }) {
  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: br,
          height: '50%',
          pointerEvents: 'none',
        },
      ]}
    />
  );
}

export function LandingGlassCard({
  tier = 'standard',
  hasSpecular = false,
  hasGlow = false,
  glowColor = liquidGlass.accent.glow,
  interactive = false,
  borderRadius: br = radius.xl,
  onPress,
  children,
  style,
  ...props
}: LandingGlassCardProps) {
  const config = tierConfig[tier];
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  // CRITICAL FIX: Track when content is ready before rendering BlurView
  const [isContentReady, setIsContentReady] = useState(false);
  const [blurKey, setBlurKey] = useState(0);
  const blurOpacity = useSharedValue(0);

  // Wait for interactions to complete before rendering blur
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      // Small delay to ensure content has rendered first
      setTimeout(() => {
        setIsContentReady(true);
        setBlurKey(prev => prev + 1);
        // Smooth fade-in for blur effect
        blurOpacity.value = withSpring(1, GLASS_SPRING);
      }, 50);
    });

    return () => handle.cancel();
  }, []);

  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  // Handle layout changes to force blur recalculation
  const handleLayout = useCallback(() => {
    if (isContentReady) {
      setBlurKey(prev => prev + 1);
    }
  }, [isContentReady]);

  const animatedStyle = useAnimatedStyle((): any => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = () => {
    if (!interactive) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    if (!interactive) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleHoverIn = () => {
    if (!interactive) return;
    scale.value = withSpring(1.02, { damping: 15, stiffness: 400 });
    translateY.value = withSpring(-4, { damping: 15, stiffness: 400 });
  };

  const handleHoverOut = () => {
    if (!interactive) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 400 });
  };

  const containerStyle = [
    styles.container,
    { borderRadius: br },
    hasGlow && Platform.select({
      ios: {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      default: {
        boxShadow: `0px 8px 24px ${glowColor}99`,
      },
    }),
    style,
  ];

  const content = (
    <>
      {hasSpecular && <SpecularHighlight borderRadius={br} />}
      {children}
    </>
  );

  if (Platform.OS === 'web') {
    const webStyles = {
      backgroundColor: config.bg,
      borderWidth: 1,
      borderColor: config.border,
      backdropFilter: `blur(${config.blur}px) saturate(200%)`,
      WebkitBackdropFilter: `blur(${config.blur}px) saturate(200%)`,
      boxShadow: hasGlow
        ? `0 8px 32px ${glowColor}, 0 4px 16px rgba(0,0,0,${config.shadow})`
        : `0 4px 16px rgba(0,0,0,${config.shadow})`,
      cursor: interactive || onPress ? 'pointer' : 'default',
      transition: 'box-shadow 0.3s ease, transform 0.3s ease',
    };

    if (onPress) {
      return (
        <Pressable onPress={onPress}>
          <Animated.View
            style={[containerStyle, animatedStyle, webStyles as any]}
            // @ts-ignore web-only
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
            onTouchStart={handlePressIn}
            onTouchEnd={handlePressOut}
            {...props}
          >
            {content}
          </Animated.View>
        </Pressable>
      );
    }

    return (
      <Animated.View
        style={[containerStyle, animatedStyle, webStyles as any]}
        // @ts-ignore web-only
        onMouseEnter={interactive ? handleHoverIn : undefined}
        onMouseLeave={interactive ? handleHoverOut : undefined}
        {...props}
      >
        {content}
      </Animated.View>
    );
  }

  // CRITICAL FIX: Native implementation with proper render order
  // Content renders FIRST, BlurView renders AFTER content is ready
  const CardWrapper = interactive || onPress ? Animated.View : View;
  const wrapperStyle = interactive || onPress ? [containerStyle, animatedStyle] : containerStyle;

  const nativeContent = (
    <CardWrapper
      style={wrapperStyle}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onLayout={handleLayout}
      {...props}
    >
      {/* Border overlay - renders first for immediate visual feedback */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: br,
            borderWidth: 1,
            borderColor: config.border,
            backgroundColor: config.bg,
            zIndex: 0,
          },
        ]}
      />

      {/* Content renders BEFORE blur - CRITICAL for blur to capture */}
      <View style={{ zIndex: 2 }}>
        {content}
      </View>

      {/* BlurView renders AFTER content is ready with animated fade-in */}
      {isContentReady && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 1, overflow: 'hidden', borderRadius: br },
            animatedBlurStyle,
          ]}
          pointerEvents="none"
        >
          <BlurView
            key={`blur-${blurKey}`}
            intensity={config.blur}
            tint="dark"
            style={[
              StyleSheet.absoluteFill,
              { overflow: 'hidden' },
            ]}
          />
        </Animated.View>
      )}
    </CardWrapper>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{nativeContent}</Pressable>;
  }

  return nativeContent;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
