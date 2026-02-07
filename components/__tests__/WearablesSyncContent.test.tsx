import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { WearablesSyncContent } from '../WearablesSyncContent';

// Mock SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock API
const mockProviders = [
  {
    id: 'apple_health',
    name: 'Apple Health',
    icon: 'heart',
    description: 'Sync steps, calories, and activity data',
    connected: true,
    lastSync: '2025-01-15T10:00:00Z',
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: 'watch',
    description: 'Connect your Fitbit device',
    connected: false,
    lastSync: null,
  },
  {
    id: 'garmin',
    name: 'Garmin',
    icon: 'fitness',
    description: 'Sync from Garmin devices',
    connected: false,
    lastSync: null,
  },
];

jest.mock('../../services/api', () => ({
  api: {
    getWearableProviders: jest.fn().mockResolvedValue({ providers: mockProviders }),
    connectWearable: jest.fn().mockResolvedValue({ authUrl: 'https://example.com/auth' }),
    disconnectWearable: jest.fn().mockResolvedValue({ success: true }),
    syncWearable: jest.fn().mockResolvedValue({ success: true, message: 'Synced!' }),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      Text,
      createAnimatedComponent: (comp: any) => comp,
    },
    FadeIn: { delay: () => ({ duration: () => ({}) }) },
    SlideInDown: { delay: () => ({ duration: () => ({ springify: () => ({}) }) }) },
  };
});

// Mock GlassCard
jest.mock('../GlassCard', () => ({
  GlassCard: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('WearablesSyncContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<WearablesSyncContent />)).not.toThrow();
  });

  it('shows loading state initially', () => {
    const { getByText } = render(<WearablesSyncContent />);
    expect(getByText('Loading providers...')).toBeTruthy();
  });

  it('displays provider names after loading', async () => {
    const { getByText } = render(<WearablesSyncContent />);
    await waitFor(() => {
      expect(getByText('Apple Health')).toBeTruthy();
      expect(getByText('Fitbit')).toBeTruthy();
      expect(getByText('Garmin')).toBeTruthy();
    });
  });

  it('displays connected device count', async () => {
    const { getByText } = render(<WearablesSyncContent />);
    await waitFor(() => {
      expect(getByText('1 Device Connected')).toBeTruthy();
    });
  });

  it('displays Available Integrations section title', async () => {
    const { getByText } = render(<WearablesSyncContent />);
    await waitFor(() => {
      expect(getByText('Available Integrations')).toBeTruthy();
    });
  });

  it('displays Connected badge for connected providers', async () => {
    const { getByText } = render(<WearablesSyncContent />);
    await waitFor(() => {
      expect(getByText('Connected')).toBeTruthy();
    });
  });

  it('displays Connect button for disconnected providers', async () => {
    const { getAllByText } = render(<WearablesSyncContent />);
    await waitFor(() => {
      const connectButtons = getAllByText('Connect');
      expect(connectButtons.length).toBe(2); // Fitbit and Garmin
    });
  });

  it('displays provider descriptions', async () => {
    const { getByText } = render(<WearablesSyncContent />);
    await waitFor(() => {
      expect(getByText('Sync steps, calories, and activity data')).toBeTruthy();
      expect(getByText('Connect your Fitbit device')).toBeTruthy();
      expect(getByText('Sync from Garmin devices')).toBeTruthy();
    });
  });

  it('shows sync info text', async () => {
    const { getByText } = render(<WearablesSyncContent />);
    await waitFor(() => {
      expect(getByText(/Connected devices sync data automatically/)).toBeTruthy();
    });
  });

  it('shows status message when devices are connected', async () => {
    const { getByText } = render(<WearablesSyncContent />);
    await waitFor(() => {
      expect(getByText('Your health data syncs automatically in the background')).toBeTruthy();
    });
  });
});
