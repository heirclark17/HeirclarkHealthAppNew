// Nutrition Verification Badge Component
// Shows verification status with liquid glass design

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlassTheme } from '../../liquidGlass/useGlassTheme';
import { NutritionVerificationResult } from '../../../types/nutritionAccuracy';
import { Colors } from '../../../constants/Theme';

interface NutritionVerificationBadgeProps {
  verification: NutritionVerificationResult | null;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onPress?: () => void;
}

const CONFIDENCE_CONFIG = {
  high: {
    icon: 'shield-checkmark' as const,
    color: Colors.successStrong,
    label: 'Verified',
  },
  medium: {
    icon: 'shield-half' as const,
    color: Colors.restingEnergy,
    label: 'Partial',
  },
  low: {
    icon: 'warning' as const,
    color: Colors.warningOrange,
    label: 'Unverified',
  },
};

export default function NutritionVerificationBadge({
  verification,
  size = 'medium',
  showLabel = false,
  onPress,
}: NutritionVerificationBadgeProps) {
  const { isDark } = useGlassTheme();

  if (!verification) {
    return null;
  }

  const config = CONFIDENCE_CONFIG[verification.confidence];
  const hasFlags = verification.flags.filter(f => f.type === 'warning' || f.type === 'error').length > 0;

  const sizeConfig = {
    small: { iconSize: 12, fontSize: 9, padding: 3, gap: 2 },
    medium: { iconSize: 14, fontSize: 10, padding: 5, gap: 4 },
    large: { iconSize: 18, fontSize: 12, padding: 8, gap: 6 },
  }[size];

  const content = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${config.color}15`,
          paddingHorizontal: sizeConfig.padding + 2,
          paddingVertical: sizeConfig.padding,
          gap: sizeConfig.gap,
        },
      ]}
    >
      <Ionicons name={config.icon} size={sizeConfig.iconSize} color={config.color} />
      {showLabel && (
        <Text style={[styles.label, { color: config.color, fontSize: sizeConfig.fontSize }]}>
          {config.label}
        </Text>
      )}
      {hasFlags && size !== 'small' && (
        <View style={[styles.flagDot, { backgroundColor: Colors.warningOrange }]} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  label: {
    fontWeight: '600',
  },
  flagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
});
