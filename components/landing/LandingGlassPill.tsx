// Landing Page Glass Pill Component
import React from 'react';
import { Platform, View, Text, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { liquidGlass, radius, spacing } from '../../constants/landingTheme';

interface LandingGlassPillProps extends ViewProps {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'accent';
  size?: 'sm' | 'md';
}

export function LandingGlassPill({
  label,
  icon,
  variant = 'default',
  size = 'md',
  style,
  ...props
}: LandingGlassPillProps) {
  const isAccent = variant === 'accent';
  const isSm = size === 'sm';

  const webStyles = Platform.OS === 'web' ? {
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
  } : {};

  return (
    <View
      style={[
        styles.container,
        isSm && styles.containerSm,
        isAccent && styles.containerAccent,
        webStyles as any,
        style,
      ]}
      {...props}
    >
      {Platform.OS !== 'web' && (
        <BlurView
          intensity={40}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
        />
      )}
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.label,
          isSm && styles.labelSm,
          isAccent && styles.labelAccent,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: liquidGlass.glass.standard,
    borderWidth: 1,
    borderColor: liquidGlass.border.subtle,
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  containerAccent: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  icon: {
    opacity: 0.8,
  },
  label: {
    color: liquidGlass.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  labelSm: {
    fontSize: 12,
  },
  labelAccent: {
    color: liquidGlass.accent.primary,
  },
});
