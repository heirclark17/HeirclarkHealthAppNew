/**
 * iOS 26 Liquid Glass Component Library
 *
 * Unified glass components that adapt to light/dark mode
 * and provide consistent Liquid Glass styling across the app.
 *
 * Components:
 * - GlassView: Base glass container with blur effect
 * - GlassContainer: Container for grouping glass elements
 * - GlassCard: Content cards with variants (standard, elevated, compact, flat)
 * - GlassButton: Buttons with press states (primary, secondary, ghost, accent)
 * - GlassInput: Text inputs with glass styling
 * - GlassNavBar: Navigation bar with blur effect
 * - GlassTabBar: Bottom tab bar with blur effect
 * - GlassModal: Modal/sheet overlays
 * - GlassSegmentedControl: Segmented controls/tabs
 * - AdaptiveText: Text that auto-adjusts for legibility
 * - AdaptiveIcon: Icons that auto-adjust for visibility
 *
 * Hook:
 * - useGlassTheme: Access theme colors, materials, and helper functions
 */

// Base Components
export { GlassView, GlassContainer, isLiquidGlassAvailable } from './GlassView';
export type { GlassViewProps, GlassContainerProps } from './GlassView';

// Card Component
export { GlassCard } from './GlassCard';
export type { GlassCardProps, GlassCardVariant } from './GlassCard';

// Button Component
export { GlassButton } from './GlassButton';
export type { GlassButtonProps, GlassButtonVariant, GlassButtonSize } from './GlassButton';

// Input Component
export { GlassInput } from './GlassInput';
export type { GlassInputProps, GlassInputVariant, GlassInputSize } from './GlassInput';

// Navigation Components
export { GlassNavBar } from './GlassNavBar';
export type { GlassNavBarProps, GlassNavBarVariant } from './GlassNavBar';

export { GlassTabBar } from './GlassTabBar';
export type { GlassTabBarProps, GlassTabItem } from './GlassTabBar';

// Modal Component
export { GlassModal } from './GlassModal';
export type { GlassModalProps, GlassModalVariant, GlassModalSize } from './GlassModal';

// Segmented Control Component
export { GlassSegmentedControl } from './GlassSegmentedControl';
export type { GlassSegmentedControlProps, GlassSegmentedControlSize, SegmentItem } from './GlassSegmentedControl';

// Adaptive Components
export { AdaptiveText, LargeTitle, Title1, Title2, Title3, Headline, Body, Callout, Subheadline, Footnote, Caption } from './AdaptiveText';
export type { AdaptiveTextProps, TextVariant, TextColorVariant } from './AdaptiveText';

export { AdaptiveIcon, AdaptiveIconButton } from './AdaptiveIcon';
export type { AdaptiveIconProps, AdaptiveIconButtonProps, IconColorVariant } from './AdaptiveIcon';

// Theme Hook
export { useGlassTheme } from './useGlassTheme';
