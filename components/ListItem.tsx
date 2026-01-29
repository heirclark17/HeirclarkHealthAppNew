import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Typography } from '../constants/Theme';
import { lightImpact, selectionFeedback } from '../utils/haptics';

type IconName = keyof typeof Ionicons.glyphMap;
type HapticType = 'light' | 'selection' | 'none';

interface ListItemProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: IconName;
  showChevron?: boolean;
  onPress?: () => void;
  haptic?: HapticType;
  disabled?: boolean;
  destructive?: boolean;
  isLast?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

/**
 * ListItem - iOS HIG Compliant List Item Component
 *
 * A standardized list item with proper touch targets (44pt minimum),
 * haptic feedback, and accessibility support.
 *
 * @example
 * <ListItem
 *   title="Profile"
 *   subtitle="Update your personal information"
 *   icon="person-outline"
 *   showChevron
 *   onPress={handleProfilePress}
 * />
 *
 * <ListItem
 *   title="Delete Account"
 *   icon="trash-outline"
 *   destructive
 *   onPress={handleDelete}
 * />
 */
export function ListItem({
  title,
  subtitle,
  value,
  icon,
  showChevron = false,
  onPress,
  haptic = 'light',
  disabled = false,
  destructive = false,
  isLast = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  leftAccessory,
  rightAccessory,
}: ListItemProps) {
  const handlePress = async () => {
    if (disabled || !onPress) return;

    switch (haptic) {
      case 'light':
        await lightImpact();
        break;
      case 'selection':
        await selectionFeedback();
        break;
      case 'none':
      default:
        break;
    }

    onPress();
  };

  const content = (
    <>
      {/* Left side: icon or custom accessory */}
      {(icon || leftAccessory) && (
        <View style={styles.leftContainer}>
          {leftAccessory || (
            <Ionicons
              name={icon!}
              size={24}
              color={destructive ? Colors.error : Colors.text}
            />
          )}
        </View>
      )}

      {/* Center: title and subtitle */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            destructive && styles.titleDestructive,
            disabled && styles.titleDisabled,
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, disabled && styles.subtitleDisabled]}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right side: value, chevron, or custom accessory */}
      <View style={styles.rightContainer}>
        {rightAccessory || (
          <>
            {value && <Text style={styles.value}>{value}</Text>}
            {showChevron && onPress && (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textMuted}
                style={styles.chevron}
              />
            )}
          </>
        )}
      </View>
    </>
  );

  const containerStyles: ViewStyle[] = [
    styles.container,
    !isLast && styles.border,
    disabled && styles.containerDisabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyles}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={containerStyles}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
    >
      {content}
    </View>
  );
}

/**
 * ListSection - Group of list items with optional header
 */
interface ListSectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ListSection({ title, children, style }: ListSectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,           // 16pt
    minHeight: Spacing.touchTarget,        // 44pt minimum
  },

  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  containerDisabled: {
    opacity: 0.5,
  },

  leftContainer: {
    marginRight: Spacing.md,
    width: 24,
    alignItems: 'center',
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: Typography.body.fontSize,     // 17pt
    fontFamily: Fonts.regular,
    color: Colors.text,
  },

  titleDestructive: {
    color: Colors.error,
  },

  titleDisabled: {
    color: Colors.textMuted,
  },

  subtitle: {
    fontSize: Typography.footnote.fontSize,  // 13pt
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  subtitleDisabled: {
    color: Colors.textMuted,
  },

  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },

  value: {
    fontSize: Typography.body.fontSize,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },

  chevron: {
    marginLeft: Spacing.xs,
  },

  // Section styles
  section: {
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.caption1.fontSize,
    fontFamily: Fonts.semiBold,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.screenMargin,
    marginBottom: Spacing.sm,
  },

  sectionContent: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.radiusMD,
    marginHorizontal: Spacing.screenMargin,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default ListItem;
