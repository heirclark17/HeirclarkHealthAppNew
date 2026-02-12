import React from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';
import { Fonts } from '../constants/Theme';

interface NumberTextProps extends TextProps {
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'heavy' | 'black';
  children?: React.ReactNode;
}

/**
 * NumberText - Hybrid Font Component
 *
 * Uses SF Pro (System font) for numbers on iOS, Urbanist elsewhere.
 * Optimized for displaying numeric values with Apple's native font.
 *
 * @param weight - Font weight variant (default: 'regular')
 * @param style - Additional styles to apply
 * @param children - Text content (numbers or mixed)
 *
 * @example
 * <NumberText weight="bold" style={{ fontSize: 48 }}>1,450</NumberText>
 * <NumberText weight="semiBold">2,200 kcal</NumberText>
 */
export function NumberText({
  weight = 'regular',
  style,
  children,
  ...props
}: NumberTextProps) {
  const fontFamily = {
    ultralight: Fonts.numericUltralight,
    thin: Fonts.numericThin,
    light: Fonts.numericLight,
    regular: Fonts.numericRegular,
    medium: Fonts.numericMedium,
    semiBold: Fonts.numericSemiBold,
    bold: Fonts.numericBold,
    heavy: Fonts.numericHeavy,
    black: Fonts.numericBlack,
  }[weight];

  return (
    <Text
      style={[
        styles.text,
        {
          fontFamily,
          // On iOS, use tabular-nums variant for monospaced numbers
          ...(Platform.OS === 'ios' && {
            fontVariant: ['tabular-nums'],
          }),
        },
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    // Base text styles
  },
});
