/**
 * CalendarPermissionStep - Request calendar sync permission
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
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
  const surfaceColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const surfaceBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

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
          <TouchableOpacity
            onPress={onPrevious}
            style={[styles.actionButton, { backgroundColor: surfaceColor, borderColor: surfaceBorder, borderWidth: 1 }]}
          >
            <Text style={[styles.actionButtonText, { color: themeColors.text }]}>Back</Text>
          </TouchableOpacity>

          {permissionGranted ? (
            <TouchableOpacity
              onPress={handleContinue}
              style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
            >
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleSkip}
                style={[styles.actionButton, { backgroundColor: surfaceColor, borderColor: surfaceBorder, borderWidth: 1 }]}
              >
                <Text style={[styles.actionButtonText, { color: themeColors.text }]}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRequestPermission}
                disabled={isRequesting}
                style={[styles.actionButton, { backgroundColor: themeColors.primary, opacity: isRequesting ? 0.5 : 1 }]}
              >
                {isRequesting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.actionButtonText, { color: '#fff' }]}>Allow Access</Text>
                )}
              </TouchableOpacity>
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
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.light,
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
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  successBanner: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  actionButtonText: {
    fontFamily: Fonts.light,
    fontSize: 16,
    fontWeight: '200' as const,
  },
});
