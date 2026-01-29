/**
 * Shared Styles - iOS HIG Compliant Layout Patterns
 *
 * Standard patterns for cards, lists, and buttons following
 * Apple's Human Interface Guidelines.
 */

import { StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, Typography } from './Theme';

/**
 * Standard Card Styles
 * Use for content containers, dashboard cards, info panels
 */
export const CardStyles = StyleSheet.create({
  // Standard card with border
  card: {
    backgroundColor: Colors.card,
    borderRadius: Spacing.radiusMD,      // 12pt
    padding: Spacing.cardPadding,        // 16pt
    marginHorizontal: Spacing.screenMargin,  // 16pt
    marginBottom: Spacing.md,            // 16pt
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Card without horizontal margins (for full-width)
  cardFullWidth: {
    backgroundColor: Colors.card,
    borderRadius: Spacing.radiusMD,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Card header row (title + action)
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  // Card title (small caps style)
  cardTitle: {
    fontSize: Typography.caption1.fontSize,  // 12pt
    fontFamily: Fonts.semiBold,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Card subtitle
  cardSubtitle: {
    fontSize: Typography.footnote.fontSize,  // 13pt
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

/**
 * Standard List Item Styles
 * Use for settings rows, meal items, provider lists
 */
export const ListStyles = StyleSheet.create({
  // Standard list item row
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,         // 16pt
    paddingHorizontal: Spacing.screenMargin,  // 16pt
    minHeight: Spacing.touchTarget,      // 44pt minimum
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  // List item without padding (for use in cards)
  listItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    minHeight: Spacing.touchTarget,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  // List item content container (flexible)
  listItemContent: {
    flex: 1,
  },

  // List item title
  listItemTitle: {
    fontSize: Typography.body.fontSize,   // 17pt
    fontFamily: Fonts.medium,
    color: Colors.text,
  },

  // List item subtitle/description
  listItemSubtitle: {
    fontSize: Typography.footnote.fontSize,  // 13pt
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // List item right accessory (chevron, value, etc.)
  listItemAccessory: {
    marginLeft: Spacing.sm,
    alignItems: 'flex-end',
  },

  // List item value text (right side)
  listItemValue: {
    fontSize: Typography.body.fontSize,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
});

/**
 * Standard Button Styles
 * Use for actions, form submissions, CTAs
 */
export const ButtonStyles = StyleSheet.create({
  // Primary button (filled, white background)
  primary: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,         // 8pt
    paddingHorizontal: Spacing.lg,       // 24pt
    borderRadius: Spacing.radiusSM,      // 8pt
    minHeight: Spacing.touchTarget,      // 44pt minimum
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryText: {
    color: Colors.primaryText,
    fontSize: Typography.headline.fontSize,  // 17pt
    fontFamily: Fonts.semiBold,
  },

  // Secondary button (outline)
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm - 1,     // Account for border
    paddingHorizontal: Spacing.lg - 1,
    borderRadius: Spacing.radiusSM,
    minHeight: Spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryText: {
    color: Colors.text,
    fontSize: Typography.headline.fontSize,
    fontFamily: Fonts.semiBold,
  },

  // Tertiary button (text only)
  tertiary: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: Spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tertiaryText: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontFamily: Fonts.medium,
  },

  // Small button variant
  small: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusXS,
    minHeight: 32,
  },

  smallText: {
    fontSize: Typography.footnote.fontSize,
    fontFamily: Fonts.medium,
  },

  // Full width button
  fullWidth: {
    width: '100%',
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Destructive button (for delete actions)
  destructive: {
    backgroundColor: Colors.error,
  },

  destructiveText: {
    color: Colors.primaryText,
  },
});

/**
 * Standard Input Styles
 * Use for form inputs, search fields
 */
export const InputStyles = StyleSheet.create({
  // Standard text input
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Spacing.radiusMD,
    padding: Spacing.md,
    fontSize: Typography.body.fontSize,
    fontFamily: Fonts.regular,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: Spacing.touchTarget,
  },

  // Input with label
  inputContainer: {
    marginBottom: Spacing.md,
  },

  // Input label
  inputLabel: {
    fontSize: Typography.footnote.fontSize,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },

  // Input error state
  inputError: {
    borderColor: Colors.error,
  },

  // Input error message
  errorMessage: {
    fontSize: Typography.caption1.fontSize,
    fontFamily: Fonts.regular,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});

/**
 * Standard Section Styles
 * Use for screen sections, grouping content
 */
export const SectionStyles = StyleSheet.create({
  // Section container
  section: {
    marginBottom: Spacing.sectionGap,    // 24pt
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: Spacing.screenMargin,
    marginBottom: Spacing.sm,
  },

  // Section title
  sectionTitle: {
    fontSize: Typography.caption1.fontSize,
    fontFamily: Fonts.semiBold,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Section subtitle
  sectionSubtitle: {
    fontSize: Typography.footnote.fontSize,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

/**
 * Standard Modal Styles
 * Use for overlays, dialogs, bottom sheets
 */
export const ModalStyles = StyleSheet.create({
  // Modal overlay background
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },

  // Modal overlay centered
  overlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal content container (bottom sheet)
  contentBottomSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Spacing.radiusXL,  // 24pt
    borderTopRightRadius: Spacing.radiusXL,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Modal content container (centered)
  contentCentered: {
    backgroundColor: Colors.card,
    borderRadius: Spacing.radiusMD,
    padding: Spacing.lg,
    marginHorizontal: Spacing.screenMargin,
    maxWidth: 400,
    width: '100%',
  },

  // Modal title
  title: {
    fontSize: Typography.title3.fontSize,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  // Modal button row
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },

  // Modal button (flex)
  buttonFlex: {
    flex: 1,
  },
});

/**
 * Standard Progress Styles
 * Use for progress bars, gauges
 */
export const ProgressStyles = StyleSheet.create({
  // Progress bar background
  barBackground: {
    height: 8,
    backgroundColor: Colors.gaugeBg,
    borderRadius: Spacing.radiusXS,
  },

  // Progress bar fill
  barFill: {
    height: '100%',
    borderRadius: Spacing.radiusXS,
  },

  // Progress bar with label
  barContainer: {
    marginBottom: Spacing.md,
  },

  // Progress label row
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },

  // Progress label
  barLabel: {
    fontSize: Typography.footnote.fontSize,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },

  // Progress value
  barValue: {
    fontSize: Typography.footnote.fontSize,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
});

// Export all styles as a single object for convenience
export const SharedStyles = {
  card: CardStyles,
  list: ListStyles,
  button: ButtonStyles,
  input: InputStyles,
  section: SectionStyles,
  modal: ModalStyles,
  progress: ProgressStyles,
};

export default SharedStyles;
