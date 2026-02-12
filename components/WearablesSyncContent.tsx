import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../contexts/SettingsContext';
import { api } from '../services/api';
import { Colors, Fonts, DarkColors, LightColors, WearableBrands } from '../constants/Theme';
import { GlassCard } from './GlassCard';

interface WearableProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  lastSync?: string;
}

// Map provider IDs to Ionicons (matching wearables page)
const PROVIDER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  apple_health: 'heart',
  fitbit: 'watch-outline',
  garmin: 'fitness-outline',
  oura: 'ellipse-outline',
  strava: 'bicycle-outline',
  whoop: 'pulse-outline',
  withings: 'scale-outline',
};

// Provider brand colors (from Theme.ts)
const PROVIDER_COLORS = WearableBrands;

export function WearablesSyncContent() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const [providers, setProviders] = useState<WearableProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const result = await api.getWearableProviders();
      setProviders(result.providers);
    } catch (error) {
      console.error('[WearablesSyncContent] Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: WearableProvider) => {
    // Special handling for Apple Health - use native integration
    if (provider.id === 'apple_health') {
      Alert.alert(
        'Apple Health',
        'Apple Health integration is managed through your device settings. Make sure you\'ve granted health data permissions to this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openURL('app-settings:'),
          },
        ]
      );
      return;
    }

    setConnectingId(provider.id);
    try {
      const result = await api.connectWearable(provider.id);
      if (result.authUrl) {
        // Open OAuth URL in browser
        const supported = await Linking.canOpenURL(result.authUrl);
        if (supported) {
          await Linking.openURL(result.authUrl);
        } else {
          Alert.alert('Error', 'Unable to open authentication page');
        }
      } else if (result.error) {
        Alert.alert('Connection Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect. Please try again.');
    } finally {
      setConnectingId(null);
      // Refresh providers after connection attempt
      setTimeout(loadProviders, 2000);
    }
  };

  const handleDisconnect = async (provider: WearableProvider) => {
    Alert.alert(
      `Disconnect ${provider.name}`,
      'Are you sure you want to disconnect this device? Your historical data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const result = await api.disconnectWearable(provider.id);
            if (result.success) {
              loadProviders();
            } else {
              Alert.alert('Error', 'Failed to disconnect. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSync = async (provider: WearableProvider) => {
    setSyncingId(provider.id);
    try {
      const result = await api.syncWearable(provider.id);
      if (result.success) {
        Alert.alert('Sync Complete', result.message || `${provider.name} data synced successfully.`);
        loadProviders();
      } else {
        Alert.alert('Sync Failed', result.message || 'Unable to sync. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Sync failed. Please try again.');
    } finally {
      setSyncingId(null);
    }
  };

  const connectedCount = providers.filter(p => p.connected).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading providers...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Summary */}
      <Animated.View entering={FadeIn.delay(0).duration(300)}>
        <GlassCard style={styles.statusCard}>
          <View style={styles.statusContent}>
            <View style={[
              styles.statusIcon,
              {
                backgroundColor: connectedCount > 0
                  ? 'rgba(34, 197, 94, 0.15)'
                  : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
              }
            ]}>
              <Ionicons
                name={connectedCount > 0 ? 'checkmark-circle' : 'watch-outline'}
                size={28}
                color={connectedCount > 0 ? Colors.successStrong : colors.textMuted}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {connectedCount === 0 ? 'No Devices Connected' : `${connectedCount} Device${connectedCount > 1 ? 's' : ''} Connected`}
              </Text>
              <Text style={[styles.statusSubtitle, { color: colors.textMuted }]}>
                {connectedCount === 0
                  ? 'Connect a device to sync your health data automatically'
                  : 'Your health data syncs automatically in the background'
                }
              </Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Provider List */}
      <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.providerSection}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Available Integrations</Text>

        {providers.map((provider, index) => {
          const iconName = PROVIDER_ICONS[provider.id] || 'hardware-chip-outline';
          const brandColor = PROVIDER_COLORS[provider.id] || colors.primary;
          const isConnecting = connectingId === provider.id;
          const isSyncing = syncingId === provider.id;

          return (
            <Animated.View
              key={provider.id}
              entering={SlideInDown.delay(150 + index * 50).duration(300).springify()}
            >
              <GlassCard style={styles.providerCard}>
                <View style={styles.providerRow}>
                  <View style={[
                    styles.providerIconContainer,
                    {
                      backgroundColor: provider.connected
                        ? `${brandColor}20`
                        : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
                    }
                  ]}>
                    <Ionicons
                      name={iconName as any}
                      size={24}
                      color={provider.connected ? brandColor : colors.textMuted}
                    />
                  </View>
                  <View style={styles.providerInfo}>
                    <View style={styles.providerHeader}>
                      <Text style={[styles.providerName, { color: colors.text }]}>
                        {provider.name}
                      </Text>
                      {provider.connected && (
                        <View style={[styles.connectedBadge, { backgroundColor: `${brandColor}20` }]}>
                          <Ionicons name="checkmark-circle" size={12} color={brandColor} />
                          <Text style={[styles.connectedText, { color: brandColor }]}>Connected</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.providerDescription, { color: colors.textMuted }]}>
                      {provider.description}
                    </Text>
                    {provider.lastSync && provider.connected && (
                      <Text style={[styles.lastSyncText, { color: colors.textMuted }]}>
                        Last synced: {new Date(provider.lastSync).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.providerActions}>
                    {provider.connected ? (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}
                          onPress={() => handleSync(provider)}
                          disabled={isSyncing}
                        >
                          {isSyncing ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Ionicons name="sync-outline" size={18} color={colors.text} />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                          onPress={() => handleDisconnect(provider)}
                        >
                          <Ionicons name="unlink-outline" size={18} color={Colors.error} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[styles.connectButton, { backgroundColor: `${brandColor}15` }]}
                        onPress={() => handleConnect(provider)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <ActivityIndicator size="small" color={brandColor} />
                        ) : (
                          <>
                            <Ionicons name="link-outline" size={16} color={brandColor} />
                            <Text style={[styles.connectButtonText, { color: brandColor }]}>Connect</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Info Message */}
      <Animated.View entering={FadeIn.delay(400).duration(300)}>
        <GlassCard style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Connected devices sync data automatically. Manual sync is available for immediate updates.
            Your health data is encrypted and stored securely.
          </Text>
        </GlassCard>
      </Animated.View>
    </ScrollView>
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
    color: 'Colors.warningOrange',
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
    color: 'Colors.warningOrange',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  disconnectButton: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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
