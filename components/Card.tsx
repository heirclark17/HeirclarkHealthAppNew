import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Typography } from '../constants/Theme';
import { lightImpact } from '../utils/haptics';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// iOS 26 Liquid Glass colors
const GLASS_COLORS = {
  light: {
    background: 'rgba(255, 255, 255, 0.6)',
    border: 'rgba(255, 255, 255, 0.4)',
    innerBorder: 'rgba(255, 255, 255, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.08)',
    title: 'rgba(60, 60, 67, 0.6)',
    subtitle: 'rgba(60, 60, 67, 0.4)',
  },
  dark: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.12)',
    innerBorder: 'rgba(255, 255, 255, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    title: 'rgba(235, 235, 245, 0.6)',
    subtitle: 'rgba(235, 235, 245, 0.4)',
  },
};

type CardVariant = 'default' | 'elevated' | 'subtle' | 'prominent';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  fullWidth?: boolean;
  noPadding?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Card variant for different visual emphasis */
  variant?: CardVariant;
  /** Enable blur effect (default: true) */
  useBlur?: boolean;
  /** Disable spring animation on press */
  disableAnimation?: boolean;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * Card - iOS 26 Liquid Glass Card Component
 *
 * A standardized card container with frosted glass effect, spring animations,
 * and proper iOS 26 Liquid Glass styling.
 *
 * @example
 * <Card title="DAILY BALANCE" variant="elevated">
 *   <CalorieGauge value={1450} max={2200} />
 * </Card>
 *
 * <Card onPress={handlePress} accessibilityLabel="View details">
 *   <Text>Tap to see more</Text>
 * </Card>
 */
export function Card({
  children,
  title,
  subtitle,
  onPress,
  fullWidth = false,
  noPadding = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  variant = 'default',
  useBlur = true,
  disableAnimation = false,
}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  // Spring animation for press state
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disableAnimation && onPress) {
      scale.value = withSpring(0.98, GLASS_SPRING);
    }
  };

  const handlePressOut = () => {
    if (!disableAnimation && onPress) {
      scale.value = withSpring(1, GLASS_SPRING);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (onPress) {
      await lightImpact();
      onPress();
    }
  };

  // Get variant-specific styles
  const getVariantStyles = (): { container: ViewStyle; blurIntensity: number } => {
    switch (variant) {
      case 'elevated':
        return {
          container: {
            shadowColor: glassColors.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 24,
            elevation: 8,
          },
          blurIntensity: isDark ? 30 : 50,
        };
      case 'subtle':
        return {
          container: {
            shadowColor: glassColors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 2,
          },
          blurIntensity: isDark ? 15 : 25,
        };
      case 'prominent':
        return {
          container: {
            shadowColor: glassColors.shadow,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 1,
            shadowRadius: 32,
            elevation: 12,
            borderWidth: 1.5,
            borderColor: glassColors.innerBorder,
          },
          blurIntensity: isDark ? 40 : 60,
        };
      default:
        return {
          container: {
            shadowColor: glassColors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.8,
            shadowRadius: 12,
            elevation: 4,
          },
          blurIntensity: isDark ? 25 : 40,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const cardStyles: ViewStyle[] = [
    styles.card,
    {
      backgroundColor: glassColors.background,
      borderColor: glassColors.border,
    },
    variantStyles.container,
    fullWidth && styles.fullWidth,
    noPadding && styles.noPadding,
    style,
  ].filter(Boolean) as ViewStyle[];

  const content = (
    <>
      {useBlur && (
        <BlurView
          intensity={variantStyles.blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.innerContent}>
        {title && (
          <View style={styles.header}>
            <Text style={[styles.title, { color: glassColors.title }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: glassColors.subtitle }]}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
        {children}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={cardStyles}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessible={true}
          accessibilityLabel={accessibilityLabel || title}
          accessibilityHint={accessibilityHint}
          accessibilityRole="button"
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View
      style={cardStyles}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </View>
  );
}

/**
 * CardHeader - Separate header component for custom layouts
 */
export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  return (
    <View style={styles.headerRow}>
      <View style={styles.headerContent}>
        <Text style={[styles.title, { color: glassColors.title }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: glassColors.subtitle }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {action && <View style={styles.headerAction}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.radiusMD, // 20pt - Extra round corners for glass
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: Spacing.screenMargin, // 16pt
    marginBottom: Spacing.md, // 16pt
  },

  innerContent: {
    padding: Spacing.cardPadding, // 16pt
  },

  fullWidth: {
    marginHorizontal: 0,
  },

  noPadding: {
    // Only remove inner padding, keep card structure
  },

  header: {
    marginBottom: Spacing.md,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },

  headerContent: {
    flex: 1,
  },

  headerAction: {
    marginLeft: Spacing.sm,
  },

  title: {
    fontSize: Typography.caption1.fontSize, // 12pt
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  subtitle: {
    fontSize: Typography.footnote.fontSize, // 13pt
    fontFamily: Fonts.regular,
    marginTop: Spacing.xs,
  },
});

export default Card;
