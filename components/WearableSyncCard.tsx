import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { fitnessMCP, FitnessProvider } from '../services/fitnessMCP';
import { api } from '../services/api';
import { appleHealthService } from '../services/appleHealthService';
import { useSettings } from '../contexts/SettingsContext';

interface WearableSyncCardProps {
  onSync?: () => void | Promise<void>;
}

export const WearableSyncCard: React.FC<WearableSyncCardProps> = ({ onSync }) => {
  const [providers, setProviders] = useState<FitnessProvider[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Always allow Apple Health connection attempt on iOS - let the actual connection show errors
  const isAppleHealthAvailable = Platform.OS === 'ios';

  // Load provider status on mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const providerList = await fitnessMCP.getProviders();
      setProviders(providerList);

      // Find most recent sync
      const lastSyncTime = providerList
        .filter(p => p.lastSync)
        .map(p => new Date(p.lastSync!).getTime())
        .sort((a, b) => b - a)[0];

      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime).toLocaleTimeString());
      }
    } catch (error) {
      // console.error('Error loading providers:', error);
      Alert.alert('Error', 'Failed to load provider status');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (provider: FitnessProvider) => {
    if (provider.connected) {
      // Already connected, sync data
      await syncProvider(provider);
    } else {
      // Not connected, initiate connection
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

          console.log('[WearableSync] Connecting to Apple Health...');

          // Check if the native module is available
          if (!appleHealthService.isModuleAvailable()) {
            console.error('[WearableSync] Apple Health module not available');
            Alert.alert(
              'Apple Health Unavailable',
              'The Apple Health module could not be loaded. Please ensure the app was built with HealthKit entitlements enabled.',
              [{ text: 'OK' }]
            );
            break;
          }

          const available = await appleHealthService.isAvailable();
          console.log('[WearableSync] Apple Health available:', available);

          if (!available) {
            Alert.alert(
              'Apple Health Not Available',
              'Apple Health is not available on this device. Please check that Health app is installed.',
              [{ text: 'OK' }]
            );
            break;
          }

          const initialized = await appleHealthService.initialize();
          console.log('[WearableSync] Apple Health initialized:', initialized);

          if (initialized) {
            // Update provider status
            const appleProvider = providers.find(p => p.id === 'apple-health');
            if (appleProvider) {
              appleProvider.connected = true;
              appleProvider.lastSync = new Date().toISOString();
              setProviders([...providers]);
            }
            Alert.alert('Success', 'Apple Health connected! You can now sync your health data.');

            // Trigger parent refresh to fetch Apple Health data
            if (onSync) {
              await onSync();
            }
          }
          // Note: initialize() already shows an alert on failure
          break;
      }
    } catch (error) {
      // console.error('Connection error:', error);
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
        // Send data to backend
        const success = await api.ingestHealthData({
          date: data.date,
          steps: data.steps,
          caloriesOut: data.caloriesOut,
        });

        if (success) {
          setLastSync(new Date().toLocaleTimeString());
          Alert.alert('Success', `Synced ${data.steps} steps from ${provider.name}`);

          // Trigger parent refresh
          if (onSync) {
            await onSync();
          }
        } else {
          Alert.alert('Warning', 'Data retrieved but failed to save to backend');
        }
      } else {
        Alert.alert('No Data', `No data available from ${provider.name}`);
      }
    } catch (error) {
      // console.error('Sync error:', error);
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

      // Sync Apple Health if on iOS
      if (Platform.OS === 'ios') {
        try {
          const healthData = await appleHealthService.getTodayData();
          if (healthData) {
            totalSteps += healthData.steps;
            totalCalories += healthData.caloriesOut;
          }
        } catch (error) {
          console.error('Apple Health sync error:', error);
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

        // Trigger parent refresh
        if (onSync) {
          await onSync();
        }
      } else {
        Alert.alert('No Data', 'No data available from any provider');
      }
    } catch (error) {
      // console.error('Sync all error:', error);
      Alert.alert('Error', 'Failed to sync providers');
    } finally {
      setSyncing(false);
    }
  };

  const connectedCount = providers.filter(p => p.connected).length;

  if (loading) {
    return (
      <GlassCard style={styles.card} interactive>
        <ActivityIndicator size="large" color={Colors.primary} />
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card} interactive>
      {/* Collapsible Header */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.header}
        accessible={true}
        accessibilityLabel={`Wearable Sync card, ${isExpanded ? 'expanded' : 'collapsed'}`}
        accessibilityHint="Tap to expand or collapse"
        accessibilityRole="button"
      >
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>WEARABLE SYNC</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Click to expand • Sync fitness data</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {/* Expandable Content */}
      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.statusRow}>
            <View>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Last Sync:</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>{lastSync || 'Never'}</Text>
            </View>
            <View>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Data Sources:</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>{connectedCount} connected</Text>
            </View>
          </View>

          {providers.map((provider, index) => {
            // Check if Apple Health needs rebuild
            const needsRebuild = provider.id === 'apple-health' && Platform.OS === 'ios' && !isAppleHealthAvailable;

            return (
            <View key={index} style={styles.providerRow}>
              <View style={styles.providerInfo}>
                <Text style={[styles.providerName, { color: colors.text }]}>{provider.name}</Text>
                <Text style={[styles.providerStatus, { color: colors.textMuted }, provider.connected && styles.providerConnected, needsRebuild && styles.providerNeedsRebuild]}>
                  {needsRebuild ? 'Requires App Rebuild' : provider.connected ? 'Connected' : 'Not Connected'}
                </Text>
                {provider.lastSync && (
                  <Text style={styles.lastSyncText}>
                    Last sync: {new Date(provider.lastSync).toLocaleTimeString()}
                  </Text>
                )}
                {needsRebuild && (
                  <Text style={styles.rebuildHint}>
                    Run: eas build --platform ios
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
                  style={[styles.syncButton, provider.connected && styles.syncButtonConnected]}
                  onPress={() => handleSync(provider)}
                  disabled={syncing}
                  accessible={true}
                  accessibilityLabel={provider.connected ? `Sync ${provider.name}` : `Connect to ${provider.name}`}
                  accessibilityHint={provider.connected ? `Syncs fitness data from ${provider.name}` : `Connects your ${provider.name} account`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: syncing }}
                >
                  <Text style={[styles.syncButtonText, provider.connected && styles.syncButtonTextConnected]}>
                    {provider.connected ? 'Sync' : 'Connect'}
                  </Text>
                </TouchableOpacity>
                )}
                {provider.connected && (
                  <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={() => handleDisconnect(provider)}
                    disabled={syncing}
                    accessible={true}
                    accessibilityLabel={`Disconnect ${provider.name}`}
                    accessibilityHint={`Disconnects your ${provider.name} account`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: syncing }}
                  >
                    <Text style={styles.disconnectButtonText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
          })}

          {connectedCount > 0 && (
            <TouchableOpacity
              style={styles.syncAllButton}
              onPress={handleSyncAll}
              disabled={syncing}
              accessible={true}
              accessibilityLabel={syncing ? "Syncing all providers" : "Sync all providers"}
              accessibilityHint="Syncs fitness data from all connected providers"
              accessibilityRole="button"
              accessibilityState={{ disabled: syncing, busy: syncing }}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={Colors.primaryText} />
              ) : (
                <Text style={styles.syncAllText}>Sync All Providers</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.sectionMargin,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  content: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
  },
  statusLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
    fontFamily: Fonts.regular,
  },
  statusValue: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 4,
    fontFamily: Fonts.medium,
  },
  providerStatus: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  providerConnected: {
    color: Colors.success,
  },
  providerNeedsRebuild: {
    color: '#FF9500',
  },
  rebuildHint: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 2,
    fontStyle: 'italic',
  },
  unavailableButton: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  unavailableButtonText: {
    color: '#FF9500',
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  lastSyncText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
  },
  providerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  syncButtonConnected: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  syncButtonText: {
    color: Colors.primaryText,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  syncButtonTextConnected: {
    color: Colors.success,
  },
  disconnectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: Colors.primaryText,
    fontSize: 20,
    fontFamily: Fonts.bold,
    lineHeight: 20,
  },
  syncAllButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  syncAllText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
});
