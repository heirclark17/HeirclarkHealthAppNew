// Verification Details Modal Component
// Shows detailed verification information with liquid glass design

import React from 'react';
import { Colors, Fonts } from '../../../constants/Theme';
import { NumberText } from '../../NumberText';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { GlassCard } from '../../liquidGlass/GlassCard';
import { useGlassTheme } from '../../liquidGlass/useGlassTheme';
import { NutritionVerificationResult, NutritionFlag, VerificationSource } from '../../../types/nutritionAccuracy';

interface VerificationDetailsModalProps {
  visible: boolean;
  verification: NutritionVerificationResult | null;
  onClose: () => void;
  onApplyAdjustments?: () => void;
}

const CONFIDENCE_CONFIG = {
  high: { color: Colors.successStrong, label: 'High Confidence', icon: 'shield-checkmark' as const },
  medium: { color: Colors.restingEnergy, label: 'Medium Confidence', icon: 'shield-half' as const },
  low: { color: Colors.warningOrange, label: 'Low Confidence', icon: 'warning' as const },
};

export default function VerificationDetailsModal({
  visible,
  verification,
  onClose,
  onApplyAdjustments,
}: VerificationDetailsModalProps) {
  const { isDark, colors } = useGlassTheme();

  if (!verification) return null;

  const textColor = isDark ? Colors.text : Colors.card;
  const subtextColor = isDark ? Colors.textMuted : Colors.textMuted;
  const mutedColor = isDark ? Colors.textMuted : Colors.textMuted;
  const config = CONFIDENCE_CONFIG[verification.confidence];

  const renderFlag = (flag: NutritionFlag, index: number) => {
    const flagColors = {
      error: Colors.error,
      warning: Colors.warningOrange,
      info: Colors.restingEnergy,
    };
    const flagIcons = {
      error: 'close-circle' as const,
      warning: 'alert-circle' as const,
      info: 'information-circle' as const,
    };

    return (
      <View key={index} style={[styles.flagItem, { backgroundColor: `${flagColors[flag.type]}10` }]}>
        <Ionicons name={flagIcons[flag.type]} size={16} color={flagColors[flag.type]} />
        <View style={styles.flagContent}>
          <Text style={[styles.flagMessage, { color: textColor }]}>{flag.message}</Text>
          <Text style={[styles.flagCode, { color: mutedColor }]}>{flag.code}</Text>
        </View>
      </View>
    );
  };

  const renderSource = (source: VerificationSource, index: number) => {
    const sourceIcons = {
      usda: 'library' as const,
      open_food_facts: 'globe' as const,
      ai_estimate: 'sparkles' as const,
      user_input: 'person' as const,
      barcode: 'barcode' as const,
    };

    return (
      <View key={index} style={[styles.sourceItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
        <View style={styles.sourceHeader}>
          <Ionicons name={sourceIcons[source.type]} size={16} color={subtextColor} />
          <Text style={[styles.sourceName, { color: textColor }]}>{source.name}</Text>
          <View style={[styles.confidenceBadge, { backgroundColor: `${config.color}15` }]}>
            <NumberText weight="semiBold" style={[styles.confidenceText, { color: config.color }]}>{source.confidence}%</NumberText>
          </View>
        </View>
        {source.matchScore !== undefined && (
          <NumberText weight="regular" style={[styles.matchScore, { color: mutedColor }]}>Match score: {source.matchScore}%</NumberText>
        )}
        {source.data && (
          <View style={styles.sourceData}>
            <NumberText weight="regular" style={[styles.sourceDataText, { color: subtextColor }]}>
              {source.data.calories} cal • {source.data.protein}p • {source.data.carbs}c • {source.data.fat}f
            </NumberText>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          style={styles.modalContainer}
        >
          <GlassCard variant="elevated" material="thick" style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
                <Ionicons name={config.icon} size={24} color={config.color} />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={subtextColor} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: textColor }]}>Nutrition Verification</Text>
            <View style={[styles.confidenceDisplay, { backgroundColor: `${config.color}10` }]}>
              <NumberText weight="semiBold" style={[styles.confidenceLabel, { color: config.color }]}>{config.label}</NumberText>
              <NumberText weight="bold" style={[styles.confidenceScore, { color: config.color }]}>{verification.confidenceScore}%</NumberText>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Original vs Verified */}
              {verification.adjustments.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Suggested Adjustments</Text>
                  {verification.adjustments.map((adj, i) => (
                    <View key={i} style={[styles.adjustmentItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Text style={[styles.adjustmentField, { color: textColor }]}>
                        {adj.field.charAt(0).toUpperCase() + adj.field.slice(1)}
                      </Text>
                      <View style={styles.adjustmentValues}>
                        <NumberText weight="regular" style={[styles.originalValue, { color: mutedColor }]}>{adj.originalValue}</NumberText>
                        <Ionicons name="arrow-forward" size={12} color={mutedColor} />
                        <NumberText weight="semiBold" style={[styles.adjustedValue, { color: Colors.successStrong }]}>{adj.adjustedValue}</NumberText>
                        <NumberText weight="regular" style={[
                          styles.percentChange,
                          { color: adj.percentChange > 0 ? Colors.warningOrange : Colors.successStrong }
                        ]}>
                          ({adj.percentChange > 0 ? '+' : ''}{adj.percentChange}%)
                        </NumberText>
                      </View>
                      <Text style={[styles.adjustmentReason, { color: subtextColor }]}>{adj.reason}</Text>
                    </View>
                  ))}

                  {onApplyAdjustments && (
                    <TouchableOpacity
                      style={[styles.applyButton, { backgroundColor: Colors.successStrong }]}
                      onPress={onApplyAdjustments}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={Colors.text} />
                      <Text style={styles.applyButtonText}>Apply Adjustments</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Flags */}
              {verification.flags.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Validation Flags</Text>
                  {verification.flags.map((flag, i) => renderFlag(flag, i))}
                </View>
              )}

              {/* Sources */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Verification Sources</Text>
                {verification.sources.map((source, i) => renderSource(source, i))}
              </View>

              {/* Nutrition Comparison */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Nutrition Data</Text>
                <View style={[styles.nutritionTable, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <View style={styles.nutritionRow}>
                    <Text style={[styles.nutritionLabel, { color: mutedColor }]}>Nutrient</Text>
                    <Text style={[styles.nutritionLabel, { color: mutedColor }]}>Original</Text>
                    <Text style={[styles.nutritionLabel, { color: mutedColor }]}>Verified</Text>
                  </View>
                  {['calories', 'protein', 'carbs', 'fat'].map((field) => {
                    const orig = verification.originalData[field as keyof typeof verification.originalData];
                    const verified = verification.verifiedData[field as keyof typeof verification.verifiedData];
                    const isDifferent = orig !== verified;

                    return (
                      <View key={field} style={styles.nutritionRow}>
                        <Text style={[styles.nutritionField, { color: textColor }]}>
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </Text>
                        <NumberText weight="regular" style={[styles.nutritionValue, { color: isDifferent ? mutedColor : textColor }]}>
                          {orig}{field !== 'calories' ? 'g' : ''}
                        </NumberText>
                        <NumberText weight="regular" style={[styles.nutritionValue, { color: isDifferent ? Colors.successStrong : textColor }]}>
                          {verified}{field !== 'calories' ? 'g' : ''}
                        </NumberText>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeBottomButton, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
              onPress={onClose}
            >
              <Text style={[styles.closeBottomText, { color: subtextColor }]}>Close</Text>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    maxHeight: '85%',
  },
  modalCard: {
    padding: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.numericBold,
    marginBottom: 12,
  },
  confidenceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
  },
  confidenceScore: {
    fontSize: 20,
    fontFamily: Fonts.numericBold,
  },
  scrollContent: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    marginBottom: 10,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  flagContent: {
    flex: 1,
  },
  flagMessage: {
    fontSize: 13,
    marginBottom: 2,
  },
  flagCode: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  sourceItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceName: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontFamily: Fonts.numericSemiBold,
  },
  matchScore: {
    fontSize: 11,
    marginTop: 4,
  },
  sourceData: {
    marginTop: 6,
  },
  sourceDataText: {
    fontSize: 12,
  },
  adjustmentItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  adjustmentField: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
    marginBottom: 4,
  },
  adjustmentValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  originalValue: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  adjustedValue: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
  },
  percentChange: {
    fontSize: 12,
  },
  adjustmentReason: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  applyButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
  },
  nutritionTable: {
    padding: 12,
    borderRadius: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  nutritionLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  nutritionField: {
    flex: 1,
    fontSize: 13,
  },
  nutritionValue: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  closeBottomButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
  },
  closeBottomText: {
    fontSize: 14,
    fontFamily: Fonts.numericMedium,
  },
});
