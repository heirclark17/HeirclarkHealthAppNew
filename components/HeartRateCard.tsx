// HeartRateCard - Compact display for current heart rate with zones
// Matches the size of health metric cards (Steps, Active Energy, etc.)

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { Fonts, DarkColors, LightColors } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { useGoalWizard } from '../contexts/GoalWizardContext';
import { lightImpact } from '../utils/haptics';

// Heart Rate Zone Configuration
const HEART_RATE_ZONES = [
  { zone: 1, name: 'Rest', min: 0, max: 50, color: '#8E8E93', description: 'Resting state' },
  { zone: 2, name: 'Fat Burn', min: 50, max: 60, color: '#4ECDC4', description: 'Light activity, fat burning' },
  { zone: 3, name: 'Cardio', min: 60, max: 70, color: '#96CEB4', description: 'Moderate aerobic training' },
  { zone: 4, name: 'Aerobic', min: 70, max: 80, color: '#F39C12', description: 'Improved cardiovascular fitness' },
  { zone: 5, name: 'Peak', min: 80, max: 90, color: '#FF6B6B', description: 'High intensity, anaerobic' },
  { zone: 6, name: 'Max', min: 90, max: 100, color: '#E74C3C', description: 'Maximum effort' },
];

interface HeartRateCardProps {
  onPress?: () => void;
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
}

export function HeartRateCard({
  onPress,
  heartRate = 0,
  systolic = 0,
  diastolic = 0,
}: HeartRateCardProps) {
  const { settings } = useSettings();
  const { state: goalState } = useGoalWizard();
  const [showModal, setShowModal] = useState(false);

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Calculate max heart rate using 220 - age formula
  const maxHeartRate = useMemo(() => {
    const age = goalState?.age || 30; // Default to 30 if not set
    return 220 - age;
  }, [goalState?.age]);

  // Calculate current heart rate percentage of max
  const heartRatePercentage = useMemo(() => {
    if (heartRate <= 0 || maxHeartRate <= 0) return 0;
    return (heartRate / maxHeartRate) * 100;
  }, [heartRate, maxHeartRate]);

  // Determine current zone based on percentage
  const currentZone = useMemo(() => {
    if (heartRate <= 0) return null;

    for (let i = HEART_RATE_ZONES.length - 1; i >= 0; i--) {
      if (heartRatePercentage >= HEART_RATE_ZONES[i].min) {
        return HEART_RATE_ZONES[i];
      }
    }
    return HEART_RATE_ZONES[0];
  }, [heartRatePercentage]);

  // Get zone color
  const displayColor = currentZone?.color || colors.textMuted;

  // Calculate zone boundaries in BPM for display
  const getZoneBPMRange = (zone: typeof HEART_RATE_ZONES[0]) => {
    const minBPM = Math.round((zone.min / 100) * maxHeartRate);
    const maxBPM = Math.round((zone.max / 100) * maxHeartRate);
    return { minBPM, maxBPM };
  };

  // Blood pressure classification
  const getBPClassification = () => {
    if (systolic <= 0 || diastolic <= 0) return { status: 'No Data', color: colors.textMuted };
    if (systolic < 120 && diastolic < 80) return { status: 'Normal', color: '#96CEB4' };
    if (systolic < 130 && diastolic < 80) return { status: 'Elevated', color: '#F39C12' };
    if (systolic < 140 || diastolic < 90) return { status: 'High (Stage 1)', color: '#FF6B6B' };
    if (systolic >= 140 || diastolic >= 90) return { status: 'High (Stage 2)', color: '#E74C3C' };
    return { status: 'Unknown', color: colors.textMuted };
  };

  const bpClassification = getBPClassification();

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
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={{ flex: 1 }}>
        <GlassCard style={styles.card} interactive>
          <View style={styles.innerContainer}>
            {/* Label */}
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
              HEART RATE
            </Text>

            {/* Heart Rate Value */}
            <View style={styles.valueContainer}>
              <Text style={[styles.value, { color: displayColor }]}>
                {heartRate > 0 ? `${Math.round(heartRate)}` : '--'}
              </Text>
              {currentZone && heartRate > 0 ? (
                <Text style={[styles.zoneLabel, { color: displayColor }]}>
                  Zone {currentZone.zone} • {currentZone.name}
                </Text>
              ) : (
                <Text style={[styles.unit, { color: colors.textMuted }]}>
                  BPM
                </Text>
              )}
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* Heart Rate & Blood Pressure Detail Modal */}
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
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Heart Rate Section */}
              <View style={styles.modalSection}>
                <View style={[styles.modalIconContainer, { backgroundColor: `${displayColor}20` }]}>
                  <Ionicons name="heart" size={32} color={displayColor} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Heart Rate</Text>
                <Text style={[styles.modalValue, { color: displayColor }]}>
                  {heartRate > 0 ? `${Math.round(heartRate)} BPM` : 'No Data'}
                </Text>
                {currentZone && heartRate > 0 && (
                  <View style={[styles.zoneBadge, { backgroundColor: `${displayColor}20` }]}>
                    <Text style={[styles.zoneBadgeText, { color: displayColor }]}>
                      Zone {currentZone.zone} • {currentZone.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* Zone Guide */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>HEART RATE ZONES</Text>
              <View style={[styles.zonesContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                {HEART_RATE_ZONES.slice(1).map((zone) => {
                  const { minBPM, maxBPM } = getZoneBPMRange(zone);
                  const isCurrentZone = currentZone?.zone === zone.zone;
                  return (
                    <View
                      key={zone.zone}
                      style={[
                        styles.zoneRow,
                        isCurrentZone && { backgroundColor: `${zone.color}15` }
                      ]}
                    >
                      <View style={styles.zoneInfo}>
                        <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                        <View>
                          <Text style={[styles.zoneName, { color: colors.text }]}>
                            Zone {zone.zone}: {zone.name}
                          </Text>
                          <Text style={[styles.zoneDesc, { color: colors.textMuted }]}>
                            {zone.description}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.zoneBPM, { color: zone.color }]}>
                        {minBPM}-{maxBPM}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Blood Pressure Section */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>BLOOD PRESSURE</Text>
              <View style={[styles.bpContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.bpRow}>
                  <View style={styles.bpItem}>
                    <Text style={[styles.bpLabel, { color: colors.textMuted }]}>Systolic</Text>
                    <Text style={[styles.bpValue, { color: colors.text }]}>
                      {systolic > 0 ? systolic : '--'}
                    </Text>
                    <Text style={[styles.bpUnit, { color: colors.textMuted }]}>mmHg</Text>
                  </View>
                  <View style={[styles.bpDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                  <View style={styles.bpItem}>
                    <Text style={[styles.bpLabel, { color: colors.textMuted }]}>Diastolic</Text>
                    <Text style={[styles.bpValue, { color: colors.text }]}>
                      {diastolic > 0 ? diastolic : '--'}
                    </Text>
                    <Text style={[styles.bpUnit, { color: colors.textMuted }]}>mmHg</Text>
                  </View>
                </View>
                <View style={[styles.bpStatus, { backgroundColor: `${bpClassification.color}15` }]}>
                  <Ionicons
                    name={bpClassification.status === 'Normal' ? 'checkmark-circle' : 'alert-circle'}
                    size={16}
                    color={bpClassification.color}
                  />
                  <Text style={[styles.bpStatusText, { color: bpClassification.color }]}>
                    {bpClassification.status}
                  </Text>
                </View>
              </View>

              {/* Info Note */}
              <Text style={[styles.infoNote, { color: colors.textMuted }]}>
                Heart rate zones are calculated using your age ({goalState?.age || 30}) with max HR of {maxHeartRate} BPM.
                Tap to refresh data from your connected devices.
              </Text>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => setShowModal(false)}
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
    width: '100%',
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 12,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 32,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  unit: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  zoneLabel: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Modal styles
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
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  zoneBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  zoneBadgeText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  zonesContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  zoneName: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  zoneDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  zoneBPM: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  bpContainer: {
    borderRadius: 16,
    padding: 16,
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  bpItem: {
    alignItems: 'center',
    flex: 1,
  },
  bpDivider: {
    width: 1,
    height: 50,
  },
  bpLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  bpValue: {
    fontSize: 28,
    fontFamily: Fonts.bold,
  },
  bpUnit: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  bpStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  bpStatusText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  infoNote: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
    lineHeight: 16,
  },
  closeButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});

export default HeartRateCard;
