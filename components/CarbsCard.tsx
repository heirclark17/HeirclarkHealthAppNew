// CarbsCard - Compact display for carbs intake
// Matches the design of health metric cards

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Wheat } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { Fonts, Colors, DarkColors, LightColors } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { lightImpact } from '../utils/haptics';

interface CarbsCardProps {
  onPress?: () => void;
  current?: number;
  goal?: number;
}

export function CarbsCard({
  onPress,
  current = 0,
  goal = 200,
}: CarbsCardProps) {
  const { settings } = useSettings();
  const [showModal, setShowModal] = useState(false);

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const percentage = useMemo(() => {
    if (goal <= 0) return 0;
    return Math.min((current / goal) * 100, 100);
  }, [current, goal]);

  const handlePress = async () => {
    await lightImpact();
    if (onPress) {
      onPress();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={{ flex: 1 }}
        accessibilityLabel={`Carbohydrates intake: ${Math.round(current)} grams of ${goal} gram goal, ${percentage.toFixed(0)}% complete`}
        accessibilityRole="button"
        accessibilityHint="Opens detailed view with carbohydrate information and importance for energy and brain function"
      >
        <GlassCard style={styles.card} interactive>
          <View style={styles.innerContainer}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Wheat size={24} color={colors.text} />
            </View>

            {/* Label */}
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
              CARBS
            </Text>

            {/* Value */}
            <Text style={[styles.value, { color: colors.text }]}>
              {Math.round(current)}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              of {goal}g
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* Detail Modal */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
          accessibilityLabel="Close carbohydrates detail modal"
          accessibilityRole="button"
          accessibilityHint="Dismisses the carbohydrates information view and returns to the main screen"
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.modalContent, { backgroundColor: isDark ? Colors.card : Colors.text }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <View style={[styles.modalIconContainer, { backgroundColor: `${Colors.carbs}20` }]}>
                  <Wheat size={32} color={Colors.carbs} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Carbs</Text>
                <Text style={[styles.modalValue, { color: Colors.carbs }]}>
                  {Math.round(current)}g
                </Text>
                <View style={[styles.progressBadge, { backgroundColor: `${Colors.carbs}20` }]}>
                  <Text style={[styles.progressBadgeText, { color: Colors.carbs }]}>
                    {percentage.toFixed(0)}% of Daily Goal
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: `${Colors.carbs}10` }]}>
                <Ionicons name="information-circle" size={20} color={Colors.carbs} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Why Carbs Matter</Text>
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    Carbohydrates are your body's primary energy source, especially important for brain function and
                    athletic performance. Focus on complex carbs from whole grains, fruits, and vegetables for sustained energy.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => setShowModal(false)}
                accessibilityLabel="Close carbohydrates detail modal"
                accessibilityRole="button"
                accessibilityHint="Returns to the main screen"
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  gaugeContainer: {
    marginTop: 4,
  },
  value: {
    fontSize: 24,
    fontFamily: Fonts.numericRegular,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: Fonts.numericRegular,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    borderRadius: 24,
    padding: 24,
  },
  modalSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 36,
    fontFamily: Fonts.numericBold,
    marginBottom: 8,
  },
  progressBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  progressBadgeText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  closeButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});

export default CarbsCard;
