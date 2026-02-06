import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../contexts/SettingsContext';
import { fitnessMCP, FitnessProvider } from '../services/fitnessMCP';
import { appleHealthService } from '../services/appleHealthService';
import { api } from '../services/api';
import { triggerManualSync, getLastSyncTime } from '../services/backgroundSync';
import { Colors, Fonts, DarkColors, LightColors } from '../constants/Theme';
import { GlassCard } from './GlassCard';

export function WearablesSyncContent() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const [providers, setProviders] = useState<FitnessProvider[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Always allow Apple Health connection attempt on iOS
  const isAppleHealthAvailable = Platform.OS === 'ios';

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const providerList = await fitnessMCP.getProviders();
      setProviders(providerList);

      // Find most recent sync from providers
      const providerSyncTime = providerList
        .filter(p => p.lastSync)
        .map(p => new Date(p.lastSync!).getTime())
        .sort((a, b) => b - a)[0];

      // Also check background sync last sync time (iOS)
      let bgSyncTime: number | null = null;
      if (Platform.OS === 'ios') {
        const bgLastSync = await getLastSyncTime();
        if (bgLastSync) {
          bgSyncTime = new Date(bgLastSync).getTime();
        }
      }

      // Use the most recent sync time
      const mostRecentSync = Math.max(providerSyncTime || 0, bgSyncTime || 0);
      if (mostRecentSync > 0) {
        setLastSync(new Date(mostRecentSync).toLocaleTimeString());
      }
    } catch (error) {
      console.error('[WearablesSyncContent] Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (provider: FitnessProvider) => {
    if (provider.connected) {
      await syncProvider(provider);
    } else {
      await connectProvider(provider);
    }
  };

  const connectProvider = async (provider: FitnessProvider) => {
    try {
      let result;

      switch (provider.id) {
        case 'fitbit':
          result = await fitnessMCP.connectFitbit();
          if (result.success && result.authUrl) {
            Alert.alert(
              'Connect Fitbit',
              'You will be redirected to Fitbit to authorize the connection.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Continue',
                  onPress: () => {
                    Linking.openURL(result.authUrl!);
                  },
                },
              ]
            );
          }
          break;

        case 'google-fit':
          result = await fitnessMCP.connectGoogleFit();
          if (result.success && result.authUrl) {
            Alert.alert(
              'Connect Google Fit',
              'You will be redirected to Google to authorize the connection.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Continue',
                  onPress: () => {
                    Linking.openURL(result.authUrl!);
                  },
                },
              ]
            );
          }
          break;

        case 'apple-health':
          if (Platform.OS !== 'ios') {
            Alert.alert('Error', 'Apple Health is only available on iOS');
            break;
          }

          console.log('[WearablesSyncContent] Connecting to Apple Health...');

          if (!appleHealthService.isModuleAvailable()) {
            console.error('[WearablesSyncContent] Apple Health module not available');
            Alert.alert(
              'Apple Health Unavailable',
              'The Apple Health module could not be loaded. Please ensure the app was built with HealthKit entitlements enabled.',
              [{ text: 'OK' }]
            );
            break;
          }

          const available = await appleHealthService.isAvailable();
          console.log('[WearablesSyncContent] Apple Health available:', available);

          if (!available) {
            Alert.alert(
              'Apple Health Not Available',
              'Apple Health is not available on this device. Please check that Health app is installed.',
              [{ text: 'OK' }]
            );
            break;
          }

          const initialized = await appleHealthService.initialize();
          console.log('[WearablesSyncContent] Apple Health initialized:', initialized);

          if (initialized) {
            const appleProvider = providers.find(p => p.id === 'apple-health');
            if (appleProvider) {
              appleProvider.connected = true;
              appleProvider.lastSync = new Date().toISOString();
              setProviders([...providers]);
            }
            Alert.alert('Success', 'Apple Health connected! You can now sync your health data.');
          }
          break;
      }
    } catch (error) {
      console.error('[WearablesSyncContent] Connection error:', error);
      Alert.alert('Error', `Failed to connect ${provider.name}`);
    }
  };

  const syncProvider = async (provider: FitnessProvider) => {
    setSyncing(true);
    try {
      let data;
      const today = new Date().toISOString().split('T')[0];

      switch (provider.id) {
        case 'fitbit':
          data = await fitnessMCP.getFitbitData(today);
          break;
        case 'google-fit':
          data = await fitnessMCP.getGoogleFitData(today);
          break;
        case 'apple-health':
          const healthData = await appleHealthService.getTodayData();
          if (healthData) {
            data = {
              date: today,
              steps: healthData.steps,
              caloriesOut: healthData.caloriesOut,
            };
          }
          break;
      }

      if (data) {
        const success = await api.ingestHealthData({
          date: data.date,
          steps: data.steps,
          caloriesOut: data.caloriesOut,
        });

        if (success) {
          setLastSync(new Date().toLocaleTimeString());
          Alert.alert('Success', `Synced ${data.steps} steps from ${provider.name}`);
        } else {
          Alert.alert('Warning', 'Data retrieved but failed to save to backend');
        }
      } else {
        Alert.alert('No Data', `No data available from ${provider.name}`);
      }
    } catch (error) {
      console.error('[WearablesSyncContent] Sync error:', error);
      Alert.alert('Error', `Failed to sync ${provider.name}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (provider: FitnessProvider) => {
    Alert.alert(
      'Disconnect',
      `Disconnect from ${provider.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const success = await fitnessMCP.disconnectProvider(provider.id);
            if (success) {
              await loadProviders();
              Alert.alert('Success', `Disconnected from ${provider.name}`);
            }
          },
        },
      ]
    );
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let totalSteps = 0;
      let totalCalories = 0;
      const errors: string[] = [];

      // Sync Apple Health if on iOS using background sync service
      if (Platform.OS === 'ios') {
        try {
          const syncResult = await triggerManualSync();
          if (syncResult) {
            console.log('[WearablesSyncContent] Background sync completed successfully');
          }

          const healthData = await appleHealthService.getTodayData();
          if (healthData) {
            totalSteps += healthData.steps;
            totalCalories += healthData.caloriesOut;
          }
        } catch (error) {
          console.error('[WearablesSyncContent] Apple Health sync error:', error);
          errors.push('Apple Health sync failed');
        }
      }

      // Sync other providers via MCP
      const results = await fitnessMCP.syncAllProviders(today);

      if (results.fitbit) {
        totalSteps += results.fitbit.steps;
        totalCalories += results.fitbit.caloriesOut;
      }
      if (results.googleFit) {
        totalSteps += results.googleFit.steps;
        totalCalories += results.googleFit.caloriesOut;
      }

      // Send combined data to backend
      if (totalSteps > 0 || totalCalories > 0) {
        await api.ingestHealthData({
          date: today,
          steps: totalSteps,
          caloriesOut: totalCalories,
        });

        setLastSync(new Date().toLocaleTimeString());

        if (results.errors.length > 0) {
          Alert.alert(
            'Partial Success',
            `Synced data but encountered errors:\n${results.errors.join('\n')}`
          );
        } else {
          Alert.alert('Success', `Synced ${totalSteps} steps from all providers`);
        }
      } else {
        Alert.alert('No Data', 'No data available from any provider');
      }
    } catch (error) {
      console.error('[WearablesSyncContent] Sync all error:', error);
      Alert.alert('Error', 'Failed to sync providers');
    } finally {
      setSyncing(false);
    }
  };

  const connectedCount = providers.filter(p => p.connected).length;

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'apple-health':
        return 'heart';
      case 'fitbit':
        return 'fitness';
      case 'google-fit':
        return 'analytics';
      default:
        return 'watch';
    }
  };

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'apple-health':
        return '#FF2D55';
      case 'fitbit':
        return '#00B0B9';
      case 'google-fit':
        return '#4285F4';
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading providers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status Summary */}
      <Animated.View entering={FadeIn.delay(0).duration(300)}>
        <GlassCard style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Last Sync</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>{lastSync || 'Never'}</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Connected</Text>
              <Text style={[styles.statusValue, { color: connectedCount > 0 ? Colors.success : colors.text }]}>
                {connectedCount} source{connectedCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Provider List */}
      <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.providerSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Sources</Text>

        {providers.map((provider, index) => {
          const needsRebuild = provider.id === 'apple-health' && Platform.OS === 'ios' && !isAppleHealthAvailable;
          const providerColor = getProviderColor(provider.id);

          return (
            <Animated.View
              key={provider.id}
              entering={SlideInDown.delay(150 + index * 80).duration(300).springify()}
            >
              <GlassCard style={styles.providerCard}>
                <View style={styles.providerRow}>
                  <View style={[styles.providerIconContainer, { backgroundColor: `${providerColor}20` }]}>
                    <Ionicons name={getProviderIcon(provider.id) as any} size={24} color={providerColor} />
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={[styles.providerName, { color: colors.text }]}>{provider.name}</Text>
                    <Text
                      style={[
                        styles.providerStatus,
                        { color: colors.textMuted },
                        provider.connected && styles.providerConnected,
                        needsRebuild && styles.providerNeedsRebuild,
                      ]}
                    >
                      {needsRebuild ? 'Requires App Rebuild' : provider.connected ? 'Connected' : 'Not Connected'}
                    </Text>
                    {provider.lastSync && (
                      <Text style={[styles.lastSyncText, { color: colors.textMuted }]}>
                        Last sync: {new Date(provider.lastSync).toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.providerActions}>
                    {needsRebuild ? (
                      <View style={styles.unavailableButton}>
                        <Text style={styles.unavailableButtonText}>Unavailable</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          provider.connected
                            ? { backgroundColor: `${Colors.success}20` }
                            : { backgroundColor: colors.primary },
                        ]}
                        onPress={() => handleSync(provider)}
                        disabled={syncing}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            provider.connected ? { color: Colors.success } : { color: '#fff' },
                          ]}
                        >
                          {provider.connected ? 'Sync' : 'Connect'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {provider.connected && !needsRebuild && (
                      <TouchableOpacity
                        style={styles.disconnectButton}
                        onPress={() => handleDisconnect(provider)}
                        disabled={syncing}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Sync All Button */}
      {connectedCount > 0 && (
        <Animated.View entering={FadeIn.delay(400).duration(300)}>
          <TouchableOpacity
            style={[styles.syncAllButton, { backgroundColor: colors.primary }]}
            onPress={handleSyncAll}
            disabled={syncing}
            activeOpacity={0.8}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="sync" size={20} color="#fff" />
                <Text style={styles.syncAllText}>Sync All Providers</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* No Providers Connected Message */}
      {connectedCount === 0 && (
        <Animated.View entering={FadeIn.delay(400).duration(300)} style={styles.emptyStateContainer}>
          <View style={[styles.emptyStateIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="watch-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Devices Connected</Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textMuted }]}>
            Connect a wearable device above to start syncing your fitness data automatically
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  statusCard: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  providerSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
  },
  providerCard: {
    marginBottom: 12,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    marginBottom: 2,
  },
  providerStatus: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  providerConnected: {
    color: Colors.success,
  },
  providerNeedsRebuild: {
    color: '#FF9500',
  },
  lastSyncText: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    marginTop: 2,
    fontStyle: 'italic',
  },
  providerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  unavailableButton: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  unavailableButtonText: {
    color: '#FF9500',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  disconnectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  syncAllText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});
