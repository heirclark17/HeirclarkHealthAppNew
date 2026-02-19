import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';

function SparkleParticle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  const opacity = useSharedValue(0);
  const particleScale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 800 }),
        ),
        -1,
      ),
    );
    particleScale.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.back(2)) }),
          withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 800 }),
        ),
        -1,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#c084fc',
    opacity: opacity.value,
    transform: [{ scale: particleScale.value }],
  }));

  return <Animated.View style={style} />;
}

interface AnimatedSparkleIconProps {
  size?: number;
  color?: string;
  /** Size of the sparkle particle container (defaults to size + 30) */
  containerSize?: number;
  /** Custom icon component to render instead of Sparkles */
  icon?: React.ComponentType<{ size: number; color: string }>;
}

/**
 * Animated Sparkles icon with floating particle effect.
 * Drop-in replacement for static <Sparkles /> in FAB buttons.
 */
export function AnimatedSparkleIcon({ size = 22, color = '#a855f7', containerSize, icon: IconComponent }: AnimatedSparkleIconProps) {
  const scale = useSharedValue(1);
  const cSize = containerSize || size + 30;

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Particles positioned relative to container
  const sparkles = [
    { delay: 0, x: 2, y: 4, size: 4 },
    { delay: 600, x: cSize - 14, y: 2, size: 3 },
    { delay: 300, x: cSize - 12, y: cSize - 16, size: 4 },
    { delay: 900, x: 4, y: cSize - 14, size: 3 },
    { delay: 450, x: cSize / 2 - 2, y: 0, size: 3 },
    { delay: 750, x: 0, y: cSize / 2 - 2, size: 3 },
    { delay: 1050, x: cSize - 10, y: cSize / 2 - 4, size: 3 },
    { delay: 150, x: cSize / 2 - 4, y: cSize - 10, size: 3 },
  ];

  return (
    <View style={{ width: cSize, height: cSize, alignItems: 'center', justifyContent: 'center' }}>
      {sparkles.map((s, i) => (
        <SparkleParticle key={i} delay={s.delay} x={s.x} y={s.y} size={s.size} />
      ))}
      <Animated.View style={animatedIcon}>
        {IconComponent ? <IconComponent size={size} color={color} /> : <Sparkles size={size} color={color} />}
      </Animated.View>
    </View>
  );
}
