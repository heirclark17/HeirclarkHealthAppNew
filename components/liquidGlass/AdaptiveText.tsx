/**
 * AdaptiveText - Text Component with Automatic Visibility
 *
 * Text component that automatically adapts its color based on
 * the current theme mode, ensuring legibility on glass surfaces.
 */

import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { GlassTypography, GlassTextShadow } from '../../theme/liquidGlass';
import { useGlassTheme } from './useGlassTheme';

export type TextVariant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption1'
  | 'caption2';

export type TextColorVariant = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'inverse';

export interface AdaptiveTextProps extends TextProps {
  /** Typography variant */
  variant?: TextVariant;

  /** Color variant */
  color?: TextColorVariant;

  /** Custom color override */
  customColor?: string;

  /** Add text shadow for better legibility on glass */
  glassShadow?: boolean;

  /** Font weight override */
  weight?: TextStyle['fontWeight'];

  /** Text alignment */
  align?: TextStyle['textAlign'];

  /** Children */
  children: React.ReactNode;
}

/**
 * AdaptiveText Component
 *
 * @example
 * ```tsx
 * <AdaptiveText variant="headline" color="primary">
 *   Hello World
 * </AdaptiveText>
 *
 * <AdaptiveText variant="body" color="secondary" glassShadow>
 *   This text has a shadow for glass surfaces
 * </AdaptiveText>
 * ```
 */
export const AdaptiveText: React.FC<AdaptiveTextProps> = ({
  variant = 'body',
  color = 'primary',
  customColor,
  glassShadow = false,
  weight,
  align,
  style,
  children,
  ...rest
}) => {
  const { isDark, colors, textShadow } = useGlassTheme();

  // Get typography styles for variant
  const typographyStyle = GlassTypography[variant];

  // Get text color
  const textColor = customColor || colors.text[color];

  // Build style
  const combinedStyle: TextStyle[] = [
    styles.base,
    typographyStyle,
    { color: textColor },
  ];

  // Add text shadow if requested
  if (glassShadow) {
    combinedStyle.push(textShadow);
  }

  // Add weight override
  if (weight) {
    combinedStyle.push({ fontWeight: weight });
  }

  // Add alignment
  if (align) {
    combinedStyle.push({ textAlign: align });
  }

  // Add custom styles last
  if (style) {
    combinedStyle.push(style as TextStyle);
  }

  return (
    <Text style={combinedStyle} {...rest}>
      {children}
    </Text>
  );
};

// Convenience components for common variants
export const LargeTitle: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="largeTitle" {...props} />
);

export const Title1: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="title1" {...props} />
);

export const Title2: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="title2" {...props} />
);

export const Title3: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="title3" {...props} />
);

export const Headline: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="headline" {...props} />
);

export const Body: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="body" {...props} />
);

export const Callout: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="callout" {...props} />
);

export const Subheadline: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="subheadline" {...props} />
);

export const Footnote: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="footnote" {...props} />
);

export const Caption: React.FC<Omit<AdaptiveTextProps, 'variant'>> = (props) => (
  <AdaptiveText variant="caption1" {...props} />
);

const styles = StyleSheet.create({
  base: {
    // Base styles applied to all text
  },
});

export default AdaptiveText;
