import { Colors, Fonts } from '../constants/Theme';

import React from 'react';
import { Text, TextStyle, StyleSheet, TextProps } from 'react-native';

interface RoundedNumeralProps extends Omit<TextProps, 'children'> {
  value: string | number;
  size?: 'small' | 'medium' | 'large';
  weight?: 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'heavy';
  unit?: string;
  style?: TextStyle;
  showCommas?: boolean;
  decimals?: number;
  allowFontScaling?: boolean;
}

const SIZE_CONFIG = {
  small: { fontSize: 24, lineHeight: 26 },
  medium: { fontSize: 32, lineHeight: 35 },
  large: { fontSize: 48, lineHeight: 53 },
} as const;

const WEIGHT_MAP = {
  light: Fonts.numericLight,
  regular: Fonts.numericRegular,
  medium: Fonts.numericMedium,
  semiBold: Fonts.numericSemiBold,
  bold: Fonts.numericBold,
  heavy: Fonts.numericHeavy,
} as const;

export const RoundedNumeral: React.FC<RoundedNumeralProps> = ({
  value,
  size = 'medium',
  weight = 'regular',
  unit,
  style,
  showCommas = true,
  decimals = 0,
  allowFontScaling = true,
  ...textProps
}) => {
  const formatNumber = (val: string | number): string => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numVal)) return String(val);

    if (showCommas) {
      return numVal.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return decimals > 0 ? numVal.toFixed(decimals) : Math.round(numVal).toString();
  };

  const formattedValue = formatNumber(value);
  const displayText = unit ? `${formattedValue} ${unit}` : formattedValue;
  const sizeConfig = SIZE_CONFIG[size];

  const fontFamily = WEIGHT_MAP[weight];

  return (
    <Text
      {...textProps}
      style={[styles.base, sizeConfig, { fontFamily }, style]}
      allowFontScaling={allowFontScaling}
      accessible={true}
      accessibilityLabel={`${formattedValue} ${unit || ''}`}
      accessibilityRole="text"
    >
      {displayText}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.numericRegular,
    color: Colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
});
