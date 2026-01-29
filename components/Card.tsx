import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Spacing, Typography } from '../constants/Theme';
import { lightImpact } from '../utils/haptics';

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
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * Card - iOS HIG Compliant Card Component
 *
 * A standardized card container following the 8-point grid system.
 *
 * @example
 * <Card title="DAILY BALANCE">
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
}: CardProps) {
  const cardStyles: ViewStyle[] = [
    styles.card,
    fullWidth && styles.fullWidth,
    noPadding && styles.noPadding,
    style,
  ].filter(Boolean) as ViewStyle[];

  const handlePress = async () => {
    if (onPress) {
      await lightImpact();
      onPress();
    }
  };

  const content = (
    <>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={handlePress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
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
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action && <View style={styles.headerAction}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent', // Let GlassCard handle background
    borderRadius: Spacing.radiusMD,         // 20pt - Extra round corners
    padding: Spacing.cardPadding,           // 16pt
    marginHorizontal: Spacing.screenMargin, // 16pt
    marginBottom: Spacing.md,               // 16pt
  },

  fullWidth: {
    marginHorizontal: 0,
  },

  noPadding: {
    padding: 0,
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
    fontSize: Typography.caption1.fontSize,  // 12pt
    fontFamily: Fonts.semiBold,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  subtitle: {
    fontSize: Typography.footnote.fontSize,  // 13pt
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default Card;
