/**
 * CalendarPermissionStep - Request calendar sync permission
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
// Lazy load to avoid crash when native module isn't built yet
let _Calendar: any = null;
function getCalendar(): any {
  if (_Calendar !== null) return _Calendar;
  try {
    _Calendar = require('expo-' + 'calendar');
  } catch {
    _Calendar = false;
  }
  return _Calendar || null;
}
import { CalendarCheck, Lock, Shield } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { Button } from '../../Button';
import { Colors } from '../../../constants/Theme';

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
      const Cal = getCalendar();
      if (!Cal) {
        console.warn('[CalendarPermission] expo-calendar not available');
        return;
      }
      const { status } = await Cal.requestCalendarPermissionsAsync();
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
          <CalendarCheck size={48} color={Colors.primary} />
          <Text style={styles.title}>Sync with your calendar?</Text>
          <Text style={styles.subtitle}>
            Import your calendar events to avoid scheduling conflicts
          </Text>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacy}>
          <View style={styles.privacyItem}>
            <Lock size={20} color={Colors.protein} />
            <Text style={styles.privacyText}>
              Calendar data stays on your device
            </Text>
          </View>
          <View style={styles.privacyItem}>
            <Shield size={20} color={Colors.carbs} />
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
                  <ActivityIndicator size="small" color={Colors.background} />
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
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Urbanist_400Regular',
    color: Colors.textSecondary,
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
    color: Colors.text,
  },
  successBanner: {
    backgroundColor: Colors.protein + '20',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    color: Colors.protein,
  },
  progress: {
    fontSize: 14,
    fontFamily: 'Urbanist_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
