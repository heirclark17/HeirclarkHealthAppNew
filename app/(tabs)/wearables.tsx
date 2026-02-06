/**
 * Wearables Connection Screen
 * Connect and manage wearable device integrations
 * Supports: Apple Health, Fitbit, Garmin, Oura, Strava, Whoop, Withings
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../../components/GlassCard';

interface WearableProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  lastSync?: string;
}

// Map provider IDs to Ionicons
const PROVIDER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  apple_health: 'heart',
  fitbit: 'watch-outline',
  garmin: 'fitness-outline',
  oura: 'ellipse-outline',
  strava: 'bicycle-outline',
  whoop: 'pulse-outline',
  withings: 'scale-outline',
};

// Provider brand colors
const PROVIDER_COLORS: Record<string, string> = {
  apple_health: '#FF3B30',
  fitbit: '#00B0B9',
  garmin: '#007CC3',
  oura: '#8B5CF6',
  strava: '#FC4C02',
  whoop: '#000000',
  withings: '#00A9CE',
};

export default function WearablesScreen() {
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // State
  const [providers, setProviders] = useState<WearableProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    try {
      const result = await api.getWearableProviders();
      setProviders(result.providers);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProviders();
    setRefreshing(false);
  }, [fetchProviders]);

  // Handle connect
  const handleConnect = useCallback(async (provider: WearableProvider) => {
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
      setTimeout(fetchProviders, 2000);
    }
  }, [fetchProviders]);

  // Handle disconnect
  const handleDisconnect = useCallback(async (provider: WearableProvider) => {
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
              fetchProviders();
            } else {
              Alert.alert('Error', 'Failed to disconnect. Please try again.');
            }
          },
        },
      ]
    );
  }, [fetchProviders]);

  // Handle sync
  const handleSync = useCallback(async (provider: WearableProvider) => {
    setSyncingId(provider.id);
    try {
      const result = await api.syncWearable(provider.id);
      if (result.success) {
        Alert.alert('Sync Complete', result.message || `${provider.name} data synced successfully.`);
        fetchProviders();
      } else {
        Alert.alert('Sync Failed', result.message || 'Unable to sync. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Sync failed. Please try again.');
    } finally {
      setSyncingId(null);
    }
  }, [fetchProviders]);

  // Render provider card
  const renderProvider = useCallback((provider: WearableProvider) => {
    const iconName = PROVIDER_ICONS[provider.id] || 'hardware-chip-outline';
    const brandColor = PROVIDER_COLORS[provider.id] || colors.primary;
    const isConnecting = connectingId === provider.id;
    const isSyncing = syncingId === provider.id;

    return (
      <GlassCard
        key={provider.id}
        style={styles.providerCard}
        interactive
      >
        <View style={styles.providerContent}>
          {/* Icon */}
          <View style={[
            styles.providerIcon,
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

          {/* Info */}
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

          {/* Actions */}
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
                  <Ionicons name="unlink-outline" size={18} color="#ef4444" />
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
    );
  }, [colors, isDark, connectingId, syncingId, handleConnect, handleDisconnect, handleSync]);

  // Connected count
  const connectedCount = providers.filter(p => p.connected).length;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading wearables...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Wearables</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Connect your devices for automatic health tracking
          </Text>
        </View>

        {/* Connection Status */}
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
                color={connectedCount > 0 ? '#22c55e' : colors.textMuted}
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

        {/* Providers List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Available Integrations
          </Text>
          {providers.map(renderProvider)}
        </View>

        {/* Info Card */}
        <GlassCard style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Connected devices sync data automatically. Manual sync is available for immediate updates.
            Your health data is encrypted and stored securely.
          </Text>
        </GlassCard>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerCard: {
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
  },
  providerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  providerName: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  connectedText: {
    fontSize: 10,
    fontFamily: Fonts.medium,
  },
  providerDescription: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  lastSyncText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  providerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  connectButtonText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
});
