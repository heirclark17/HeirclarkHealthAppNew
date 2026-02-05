import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, RefreshControl, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { api } from '../../services/api';
import { Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { useGoalWizard } from '../../contexts/GoalWizardContext';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { BackgroundSelector } from '../../components/BackgroundSelector';
import { BACKGROUNDS, BackgroundId } from '../../constants/backgrounds';
import { LiquidGlassProfileImage } from '../../components/LiquidGlassProfileImage';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, ...settingsActions } = useSettings();
  const { resetWizard } = useGoalWizard();
  const { user, isAuthenticated, signInWithApple, signOut, isAppleSignInAvailable } = useAuth();

  // Get theme colors based on current setting
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);

  const [refreshing, setRefreshing] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);

  // Get current background name
  const currentBackgroundName = useMemo(() => {
    const bg = BACKGROUNDS.find((b) => b.id === (settings.backgroundImage || 'default'));
    return bg?.name || 'Default';
  }, [settings.backgroundImage]);

  // Check API health and fetch data
  const fetchData = async () => {
    try {
      // Check API health
      const health = await api.checkHealth();
      if (health && health.status === 'ok') {
        setApiStatus('connected');
      } else {
        setApiStatus('offline');
      }

      // Get connected devices
      const devices = await api.getConnectedDevices();
      setConnectedDevices(devices || []);
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnectDevice = async (deviceName: string) => {
    try {
      const success = await api.syncFitnessData(deviceName.toLowerCase().replace(' ', '_'), {
        action: 'connect',
      });
      if (success) {
        Alert.alert('Success', `${deviceName} connected successfully`);
        fetchData();
      } else {
        Alert.alert('Error', `Failed to connect ${deviceName}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to connect ${deviceName}`);
    }
  };

  const handleNavigateToGoals = () => {
    router.push('/goals');
  };

  const handleRedoGoalsSetup = () => {
    Alert.alert(
      'Redo Goals Setup',
      'This will restart the goals wizard. Your current goals will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            resetWizard();
            router.push('/goals');
          },
        },
      ]
    );
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@heirclark.com?subject=App Support Request');
  };

  const handleDataPrivacy = () => {
    Alert.alert(
      'Data Privacy',
      'Your health data is stored securely on your device and our encrypted servers. We never share your personal health information with third parties without your consent.\n\nYou can export or delete your data at any time.',
      [{ text: 'OK' }]
    );
  };

  const handleExportData = async () => {
    await settingsActions.exportData();
  };

  const handleDeleteAllData = async () => {
    await settingsActions.deleteAllData();
  };

  const handleToggleUnits = () => {
    const newSystem = settings.unitSystem === 'imperial' ? 'metric' : 'imperial';
    settingsActions.setUnitSystem(newSystem);
  };

  const SettingRow = ({
    label,
    value,
    onValueChange,
    description,
  }: {
    label: string;
    value: boolean;
    onValueChange: (val: boolean) => void;
    description?: string;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {description && <Text style={[styles.settingDesc, { color: colors.textMuted }]}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.success }}
        thumbColor={colors.text}
        ios_backgroundColor={colors.border}
      />
    </View>
  );

  const ConnectedApp = ({ name, connected }: { name: string; connected: boolean }) => (
    <TouchableOpacity
      style={[styles.appRow, { borderBottomColor: colors.border }]}
      onPress={() => !connected && handleConnectDevice(name)}
    >
      <Text style={[styles.appName, { color: colors.text }]}>{name}</Text>
      <View style={styles.appStatusContainer}>
        <Text style={[styles.appStatus, { color: connected ? colors.success : colors.textMuted }]}>
          {connected ? 'Connected' : 'Not Connected'}
        </Text>
        {!connected && <Text style={[styles.connectLink, { color: colors.accent }]}>Connect</Text>}
      </View>
    </TouchableOpacity>
  );

  const deviceList = [
    'Apple Health',
    'Fitbit',
    'Strava',
    'Oura Ring',
    'Withings',
    'Health Connect (Android)',
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Page Title */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Profile Picture with Liquid Glass Effect */}
        <GlassCard style={styles.profileSection}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Profile Picture</Text>
          <View style={styles.profileImageContainer}>
            <LiquidGlassProfileImage size={100} showEditButton={true} />
          </View>
        </GlassCard>

        {/* Appearance - Background Selection */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
          <SettingRow
            label="Dark Mode"
            value={settings.themeMode === 'dark'}
            onValueChange={(enabled) => settingsActions.setThemeMode(enabled ? 'dark' : 'light')}
          />
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={() => setShowBackgroundSelector(true)}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>Background</Text>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {currentBackgroundName}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* Account Section */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Account</Text>
          {isAuthenticated ? (
            <>
              <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Signed in as</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                  {user?.email || user?.fullName || 'Apple ID'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.signOutButton, { borderColor: colors.error }]}
                onPress={() => {
                  Alert.alert(
                    'Sign Out',
                    'Are you sure you want to sign out?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: async () => {
                          await signOut();
                          // Stay on settings page after sign out
                        }
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={[styles.signOutButtonText, { color: colors.error }]}>Sign Out</Text>
              </TouchableOpacity>

              {/* Nuclear option: Clear ALL auth data (debug) */}
              <TouchableOpacity
                style={[styles.signOutButton, { borderColor: '#ff9800', marginTop: 16 }]}
                onPress={() => {
                  Alert.alert(
                    'Clear All Auth Data',
                    'This will forcefully remove ALL authentication data including dev accounts. You will need to sign in again with your Apple ID.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear Everything',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            console.log('[Settings] Clearing ALL auth data...');

                            // Import AsyncStorage
                            const AsyncStorage = require('@react-native-async-storage/async-storage').default;

                            // Clear all possible auth keys
                            await AsyncStorage.removeItem('@heirclark_auth_token');
                            await AsyncStorage.removeItem('@heirclark_auth_user');
                            await AsyncStorage.removeItem('AUTH_TOKEN');
                            await AsyncStorage.removeItem('USER_DATA');

                            // Also call signOut to clear backend session
                            await signOut();

                            Alert.alert(
                              'Success',
                              'All authentication data cleared. The app will reload. Please sign in with your Apple ID.',
                              [{
                                text: 'OK',
                                onPress: () => {
                                  // Force reload by navigating to index
                                  router.replace('/(tabs)');
                                }
                              }]
                            );
                          } catch (error) {
                            console.error('[Settings] Clear auth error:', error);
                            Alert.alert('Error', 'Failed to clear auth data');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="nuclear-outline" size={18} color="#ff9800" style={{ marginRight: 8 }} />
                <Text style={[styles.signOutButtonText, { color: '#ff9800' }]}>🔧 Clear All Auth (Debug)</Text>
              </TouchableOpacity>
            </>
          ) : (
            Platform.OS === 'ios' && isAppleSignInAvailable ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={settings.themeMode === 'dark'
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={Spacing.borderRadius}
                style={styles.appleSignInButton}
                onPress={signInWithApple}
              />
            ) : (
              <TouchableOpacity
                style={[styles.signInButton, { backgroundColor: colors.text }]}
                onPress={signInWithApple}
              >
                <Text style={[styles.signInButtonText, { color: colors.background }]}>Sign in with Apple</Text>
              </TouchableOpacity>
            )
          )}
        </GlassCard>

        {/* Goals */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Goals</Text>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={handleNavigateToGoals}>
            <Text style={[styles.linkLabel, { color: colors.accent }]}>View Goals</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: 'transparent' }]} onPress={handleRedoGoalsSetup}>
            <Text style={[styles.linkLabel, { color: colors.accent }]}>Redo Goals Setup</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* About */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>About</Text>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Version</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>2.0.0</Text>
          </View>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: 'transparent' }]} onPress={handleContactSupport}>
            <Text style={[styles.linkLabel, { color: colors.accent }]}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard style={styles.section}>
          <TouchableOpacity style={[styles.dangerButton, { borderColor: colors.error }]} onPress={handleDeleteAllData}>
            <Ionicons name="trash-outline" size={18} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>Delete All Data</Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Background Selector Modal */}
      <BackgroundSelector
        visible={showBackgroundSelector}
        onClose={() => setShowBackgroundSelector(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 34,
    fontFamily: Fonts.bold,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  userHint: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 12,
    letterSpacing: 0.5,
    fontFamily: Fonts.semiBold,
  },
  connectedCount: {
    fontSize: 12,
    marginBottom: 12,
    fontFamily: Fonts.regular,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
    fontFamily: Fonts.regular,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  linkLabel: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  appName: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  appStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appStatus: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  connectLink: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  dangerButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  signOutButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  appleSignInButton: {
    width: '100%',
    height: 44,
  },
  signInButton: {
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  profileSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
