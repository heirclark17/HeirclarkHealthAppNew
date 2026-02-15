/**
 * CalendarPermissionStep - Request calendar sync permission
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Calendar from 'expo-calendar';
import { CalendarCheck, Lock, Shield } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { colors } from '@/constants/Theme';

interface Props {
  onGranted: () => void;
  onSkipped: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

export function CalendarPermissionStep({
  onGranted,
  onSkipped,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
}: Props) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);

      if (granted) {
        onGranted();
      }
    } catch (error) {
      console.error('[CalendarPermission] Error requesting permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onSkipped();
    onNext();
  };

  const handleContinue = () => {
    if (permissionGranted) {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <CalendarCheck size={48} color={colors.primary} />
          <Text style={styles.title}>Sync with your calendar?</Text>
          <Text style={styles.subtitle}>
            Import your calendar events to avoid scheduling conflicts
          </Text>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacy}>
          <View style={styles.privacyItem}>
            <Lock size={20} color={colors.protein} />
            <Text style={styles.privacyText}>
              Calendar data stays on your device
            </Text>
          </View>
          <View style={styles.privacyItem}>
            <Shield size={20} color={colors.carbs} />
            <Text style={styles.privacyText}>
              Never shared with our servers
            </Text>
          </View>
        </View>

        {/* Permission Status */}
        {permissionGranted && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              ✓ Calendar access granted
            </Text>
          </View>
        )}

        {/* Progress */}
        <Text style={styles.progress}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Back"
            onPress={onPrevious}
            variant="secondary"
            style={{ flex: 1 }}
          />

          {permissionGranted ? (
            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              style={{ flex: 1 }}
            />
          ) : (
            <>
              <Button
                title="Skip"
                onPress={handleSkip}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title={isRequesting ? '' : 'Allow Access'}
                onPress={handleRequestPermission}
                variant="primary"
                style={{ flex: 1 }}
                disabled={isRequesting}
              >
                {isRequesting && (
                  <ActivityIndicator size="small" color={colors.background} />
                )}
              </Button>
            </>
          )}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Urbanist_700Bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Urbanist_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  privacy: {
    gap: 12,
    paddingVertical: 8,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyText: {
    fontSize: 14,
    fontFamily: 'Urbanist_500Medium',
    color: colors.text,
  },
  successBanner: {
    backgroundColor: colors.protein + '20',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    color: colors.protein,
  },
  progress: {
    fontSize: 14,
    fontFamily: 'Urbanist_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
