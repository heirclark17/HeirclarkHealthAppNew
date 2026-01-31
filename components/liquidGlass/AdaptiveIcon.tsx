/**
 * AdaptiveIcon - Icon Component with Automatic Visibility
 *
 * Icon component that automatically adapts its color based on
 * the current theme mode, ensuring visibility on glass surfaces.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlassTheme } from './useGlassTheme';
import { Colors } from '../../constants/Theme';

export type IconColorVariant = 'primary' | 'secondary' | 'tertiary' | 'accent';

// All Ionicons names
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export interface AdaptiveIconProps {
  /** Icon name from Ionicons */
  name: IoniconsName;

  /** Icon size */
  size?: number;

  /** Color variant */
  color?: IconColorVariant;

  /** Custom color override */
  customColor?: string;

  /** Add shadow for better visibility on glass */
  glassShadow?: boolean;

  /** Container style */
  style?: ViewStyle;

  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * AdaptiveIcon Component
 *
 * @example
 * ```tsx
 * <AdaptiveIcon name="heart" size={24} color="primary" />
 *
 * <AdaptiveIcon
 *   name="settings-outline"
 *   size={20}
 *   color="secondary"
 *   glassShadow
 * />
 * ```
 */
export const AdaptiveIcon: React.FC<AdaptiveIconProps> = ({
  name,
  size = 24,
  color = 'primary',
  customColor,
  glassShadow = false,
  style,
  accessibilityLabel,
}) => {
  const { isDark, colors } = useGlassTheme();

  // Get icon color
  const iconColor = customColor || colors.icon[color];

  // Shadow style for glass surfaces
  const shadowStyle = glassShadow
    ? Platform.select({
        ios: {
          shadowColor: isDark ? Colors.background : Colors.text,
          shadowOffset: { width: 0, height: 0.5 },
          shadowOpacity: isDark ? 0.5 : 0.3,
          shadowRadius: 1,
        },
        android: {
          elevation: 1,
        },
        default: {
          boxShadow: isDark
            ? '0px 0.5px 1px rgba(0, 0, 0, 0.5)'
            : '0px 0.5px 1px rgba(255, 255, 255, 0.3)',
        },
      })
    : {};

  return (
    <View
      style={[styles.container, shadowStyle, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Ionicons name={name} size={size} color={iconColor} />
    </View>
  );
};

/**
 * Icon Button variant with background
 */
export interface AdaptiveIconButtonProps extends AdaptiveIconProps {
  /** Button size (icon will be sized proportionally) */
  buttonSize?: number;

  /** Show background circle */
  showBackground?: boolean;

  /** Background opacity */
  backgroundOpacity?: number;

  /** On press handler */
  onPress?: () => void;
}

export const AdaptiveIconButton: React.FC<AdaptiveIconButtonProps> = ({
  name,
  size = 20,
  buttonSize = 44,
  color = 'primary',
  customColor,
  showBackground = true,
  backgroundOpacity = 0.1,
  glassShadow = false,
  style,
  accessibilityLabel,
}) => {
  const { isDark, colors } = useGlassTheme();

  // Get icon color
  const iconColor = customColor || colors.icon[color];

  // Background color
  const backgroundColor = showBackground
    ? isDark
      ? `rgba(255, 255, 255, ${backgroundOpacity})`
      : `rgba(0, 0, 0, ${backgroundOpacity})`
    : 'transparent';

  return (
    <View
      style={[
        styles.iconButton,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <AdaptiveIcon
        name={name}
        size={size}
        color={color}
        customColor={customColor}
        glassShadow={glassShadow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AdaptiveIcon;
