// Plateau Breaker Modal
// Bottom sheet showing AI-generated plateau-breaking strategies

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Zap, Check, Clock } from 'lucide-react-native';
import { GlassCard } from '../GlassCard';
import { useSettings } from '../../contexts/SettingsContext';
import { DarkColors, SandLightColors, Fonts } from '../../constants/Theme';
import { lightImpact, mediumImpact } from '../../utils/haptics';

interface Strategy {
  name: string;
  description: string;
  duration: string;
  isRecommended: boolean;
}

interface PlateauBreakerModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseName: string;
  diagnosis: string;
  strategies: Strategy[];
  isLoading?: boolean;
  onApplyStrategy?: (strategy: Strategy) => void;
}

export default function PlateauBreakerModal({
  visible,
  onClose,
  exerciseName,
  diagnosis,
  strategies,
  isLoading,
  onApplyStrategy,
}: PlateauBreakerModalProps) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : SandLightColors;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Zap size={20} color={colors.warningOrange} />
              <Text style={[styles.title, { color: colors.text }]}>Plateau Breaker</Text>
            </View>
            <TouchableOpacity
              onPress={() => { lightImpact(); onClose(); }}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1a1a1a' : '#E5DDD2' }]}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.warningOrange} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Analyzing your {exerciseName} plateau...
                </Text>
              </View>
            ) : (
              <>
                {/* Exercise name */}
                <Text style={[styles.exerciseName, { color: colors.text }]}>{exerciseName}</Text>

                {/* Diagnosis */}
                <GlassCard style={styles.diagnosisCard}>
                  <Text style={[styles.diagnosisLabel, { color: colors.warningOrange }]}>
                    Diagnosis
                  </Text>
                  <Text style={[styles.diagnosisText, { color: colors.textSecondary }]}>
                    {diagnosis}
                  </Text>
                </GlassCard>

                {/* Strategies */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Strategies</Text>

                {strategies.map((strategy, i) => (
                  <GlassCard
                    key={i}
                    style={[
                      styles.strategyCard,
                      strategy.isRecommended && {
                        borderColor: colors.success + '40',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    {strategy.isRecommended && (
                      <View style={[styles.recommendedBadge, { backgroundColor: colors.success + '20' }]}>
                        <Check size={12} color={colors.success} />
                        <Text style={[styles.recommendedText, { color: colors.success }]}>
                          Recommended
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.strategyName, { color: colors.text }]}>
                      {strategy.name}
                    </Text>
                    <Text style={[styles.strategyDesc, { color: colors.textSecondary }]}>
                      {strategy.description}
                    </Text>
                    <View style={styles.durationRow}>
                      <Clock size={12} color={colors.textMuted} />
                      <Text style={[styles.durationText, { color: colors.textMuted }]}>
                        {strategy.duration}
                      </Text>
                    </View>
                    {onApplyStrategy && (
                      <TouchableOpacity
                        style={[
                          styles.applyBtn,
                          {
                            backgroundColor: strategy.isRecommended
                              ? colors.success + '15'
                              : isDark ? '#1a1a1a' : '#E5DDD2',
                            borderColor: strategy.isRecommended ? colors.success + '30' : colors.border,
                          },
                        ]}
                        onPress={() => {
                          mediumImpact();
                          onApplyStrategy(strategy);
                        }}
                      >
                        <Text
                          style={[
                            styles.applyText,
                            { color: strategy.isRecommended ? colors.success : colors.textSecondary },
                          ]}
                        >
                          Apply Strategy
                        </Text>
                      </TouchableOpacity>
                    )}
                  </GlassCard>
                ))}
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  exerciseName: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
  },
  diagnosisCard: {
    padding: 16,
    marginBottom: 16,
  },
  diagnosisLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  diagnosisText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  strategyCard: {
    padding: 16,
    marginBottom: 10,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendedText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  strategyName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 6,
  },
  strategyDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 19,
    marginBottom: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  durationText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  applyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
});
