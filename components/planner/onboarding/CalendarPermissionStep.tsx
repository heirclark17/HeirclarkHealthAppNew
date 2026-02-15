/**
 * CalendarPermissionStep - Request calendar sync permission
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
// Lazy load to avoid crash when native module isn't built yet
let _Calendar: any = null;
let _calendarChecked = false;
function getCalendar(): any {
  if (_calendarChecked) return _Calendar;
  _calendarChecked = true;
  try {
    // Probe for native module without triggering Metro's global error handler
    const core = require('expo-modules-core');
    if (core.requireOptionalNativeModule) {
      const nativeMod = core.requireOptionalNativeModule('ExpoCalendar');
      if (!nativeMod) {
        _Calendar = null;
        return null;
      }
    }
    _Calendar = require('expo-' + 'calendar');
  } catch {
    _Calendar = null;
  }
  return _Calendar;
}
import { CalendarCheck, Lock, Shield } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { Button } from '../../Button';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

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

  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

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
          <CalendarCheck size={48} color={themeColors.primary} />
          <Text style={[styles.title, { color: themeColors.text }]}>Sync with your calendar?</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Import your calendar events to avoid scheduling conflicts
          </Text>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacy}>
          <View style={styles.privacyItem}>
            <Lock size={20} color={Colors.protein} />
            <Text style={[styles.privacyText, { color: themeColors.text }]}>
              Calendar data stays on your device
            </Text>
          </View>
          <View style={styles.privacyItem}>
            <Shield size={20} color={Colors.carbs} />
            <Text style={[styles.privacyText, { color: themeColors.text }]}>
              Never shared with our servers
            </Text>
          </View>
        </View>

        {/* Permission Status */}
        {permissionGranted && (
          <View style={[styles.successBanner, { backgroundColor: Colors.protein + '20' }]}>
            <Text style={[styles.successText, { color: Colors.protein }]}>
              Calendar access granted
            </Text>
          </View>
        )}

        {/* Progress */}
        <Text style={[styles.progress, { color: themeColors.textSecondary }]}>
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
                  <ActivityIndicator size="small" color={themeColors.primaryText} />
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
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.medium,
  },
  successBanner: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
