// Verification Details Modal Component
// Shows detailed verification information with liquid glass design

import React from 'react';
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
  high: { color: '#4ADE80', label: 'High Confidence', icon: 'shield-checkmark' as const },
  medium: { color: '#60A5FA', label: 'Medium Confidence', icon: 'shield-half' as const },
  low: { color: '#FB923C', label: 'Low Confidence', icon: 'warning' as const },
};

export default function VerificationDetailsModal({
  visible,
  verification,
  onClose,
  onApplyAdjustments,
}: VerificationDetailsModalProps) {
  const { isDark, colors } = useGlassTheme();

  if (!verification) return null;

  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const subtextColor = isDark ? '#999999' : '#666666';
  const mutedColor = isDark ? '#666666' : '#999999';
  const config = CONFIDENCE_CONFIG[verification.confidence];

  const renderFlag = (flag: NutritionFlag, index: number) => {
    const flagColors = {
      error: '#EF4444',
      warning: '#FB923C',
      info: '#60A5FA',
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
            <Text style={[styles.confidenceText, { color: config.color }]}>{source.confidence}%</Text>
          </View>
        </View>
        {source.matchScore !== undefined && (
          <Text style={[styles.matchScore, { color: mutedColor }]}>Match score: {source.matchScore}%</Text>
        )}
        {source.data && (
          <View style={styles.sourceData}>
            <Text style={[styles.sourceDataText, { color: subtextColor }]}>
              {source.data.calories} cal • {source.data.protein}p • {source.data.carbs}c • {source.data.fat}f
            </Text>
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
              <Text style={[styles.confidenceLabel, { color: config.color }]}>{config.label}</Text>
              <Text style={[styles.confidenceScore, { color: config.color }]}>{verification.confidenceScore}%</Text>
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
                        <Text style={[styles.originalValue, { color: mutedColor }]}>{adj.originalValue}</Text>
                        <Ionicons name="arrow-forward" size={12} color={mutedColor} />
                        <Text style={[styles.adjustedValue, { color: '#4ADE80' }]}>{adj.adjustedValue}</Text>
                        <Text style={[
                          styles.percentChange,
                          { color: adj.percentChange > 0 ? '#FB923C' : '#4ADE80' }
                        ]}>
                          ({adj.percentChange > 0 ? '+' : ''}{adj.percentChange}%)
                        </Text>
                      </View>
                      <Text style={[styles.adjustmentReason, { color: subtextColor }]}>{adj.reason}</Text>
                    </View>
                  ))}

                  {onApplyAdjustments && (
                    <TouchableOpacity
                      style={[styles.applyButton, { backgroundColor: '#4ADE80' }]}
                      onPress={onApplyAdjustments}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
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
                        <Text style={[styles.nutritionValue, { color: isDifferent ? mutedColor : textColor }]}>
                          {orig}{field !== 'calories' ? 'g' : ''}
                        </Text>
                        <Text style={[styles.nutritionValue, { color: isDifferent ? '#4ADE80' : textColor }]}>
                          {verified}{field !== 'calories' ? 'g' : ''}
                        </Text>
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  confidenceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceScore: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
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
    borderRadius: 10,
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
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
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
    borderRadius: 10,
    marginBottom: 8,
  },
  adjustmentField: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  adjustmentValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  originalValue: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  adjustedValue: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 10,
    marginTop: 8,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionTable: {
    padding: 12,
    borderRadius: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  nutritionLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
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
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
  },
  closeBottomText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
