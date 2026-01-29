// Animated Liquid Background Effect
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { liquidGlass } from '../../constants/landingTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrbConfig {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
}

const orbs: OrbConfig[] = [
  {
    color: liquidGlass.accent.primary,
    size: 400,
    initialX: -100,
    initialY: 100,
    duration: 20000,
    delay: 0,
  },
  {
    color: liquidGlass.accent.secondary,
    size: 350,
    initialX: SCREEN_WIDTH - 150,
    initialY: 300,
    duration: 25000,
    delay: 2000,
  },
  {
    color: liquidGlass.accent.tertiary,
    size: 300,
    initialX: SCREEN_WIDTH / 2 - 150,
    initialY: SCREEN_HEIGHT - 400,
    duration: 22000,
    delay: 4000,
  },
  {
    color: '#FF69B4', // Pink from macros
    size: 250,
    initialX: 100,
    initialY: SCREEN_HEIGHT - 200,
    duration: 18000,
    delay: 1000,
  },
];

function AnimatedOrb({ config }: { config: OrbConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: config.duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: config.duration,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      );
    };

    const timeout = setTimeout(startAnimation, config.delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 0.25, 0.5, 0.75, 1],
      [0, 50, 30, -30, 0]
    );
    const translateY = interpolate(
      progress.value,
      [0, 0.25, 0.5, 0.75, 1],
      [0, -40, -60, -20, 0]
    );
    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [1, 1.1, 1]
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.initialX,
          top: config.initialY,
          width: config.size,
          height: config.size,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[config.color, 'transparent']}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: config.size / 2,
          opacity: 0.4,
        }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </Animated.View>
  );
}

export function LiquidBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Base gradient */}
      <LinearGradient
        colors={[liquidGlass.deepSpace, liquidGlass.ambient, liquidGlass.deepSpace]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Animated orbs */}
      {orbs.map((config, index) => (
        <AnimatedOrb key={index} config={config} />
      ))}

      {/* Blur overlay to soften orbs */}
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={80}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              // @ts-ignore
              backdropFilter: 'blur(80px)',
              WebkitBackdropFilter: 'blur(80px)',
            },
          ]}
        />
      )}

      {/* Noise texture overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: 0.03,
            backgroundColor: 'transparent',
          },
        ]}
      />
    </View>
  );
}
