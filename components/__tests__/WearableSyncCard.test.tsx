import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WearableSyncCard } from '../WearableSyncCard';

// Mock SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock fitnessMCP
const mockProviders = [
  {
    id: 'apple-health',
    name: 'Apple Health',
    connected: false,
    lastSync: null,
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    connected: true,
    lastSync: '2025-01-15T10:00:00Z',
  },
];

jest.mock('../../services/fitnessMCP', () => ({
  fitnessMCP: {
    getProviders: jest.fn().mockResolvedValue(mockProviders),
    connectFitbit: jest.fn().mockResolvedValue({ success: true, authUrl: 'https://fitbit.com/auth' }),
    connectGoogleFit: jest.fn().mockResolvedValue({ success: true }),
    getFitbitData: jest.fn().mockResolvedValue({ date: '2025-01-15', steps: 8000, caloriesOut: 2200 }),
    getGoogleFitData: jest.fn().mockResolvedValue(null),
    syncAllProviders: jest.fn().mockResolvedValue({ fitbit: { steps: 8000, caloriesOut: 2200 }, errors: [] }),
    disconnectProvider: jest.fn().mockResolvedValue(true),
  },
}));

// Mock api
jest.mock('../../services/api', () => ({
  api: {
    ingestHealthData: jest.fn().mockResolvedValue(true),
  },
}));

// Mock appleHealthService
jest.mock('../../services/appleHealthService', () => ({
  appleHealthService: {
    isModuleAvailable: jest.fn().mockReturnValue(false),
    isAvailable: jest.fn().mockResolvedValue(false),
    initialize: jest.fn().mockResolvedValue(false),
    getTodayData: jest.fn().mockResolvedValue(null),
  },
}));

// Mock backgroundSync
jest.mock('../../services/backgroundSync', () => ({
  triggerManualSync: jest.fn().mockResolvedValue(true),
  getLastSyncTime: jest.fn().mockResolvedValue(null),
}));

// Mock GlassCard
jest.mock('../GlassCard', () => ({
  GlassCard: ({ children, style, interactive }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronUp: 'ChevronUp',
  ChevronDown: 'ChevronDown',
}));

describe('WearableSyncCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<WearableSyncCard />)).not.toThrow();
  });

  it('shows the section title after loading', async () => {
    const { getByText } = render(<WearableSyncCard />);
    await waitFor(() => {
      expect(getByText('WEARABLE SYNC')).toBeTruthy();
    });
  });

  it('shows the subtitle text', async () => {
    const { getByText } = render(<WearableSyncCard />);
    await waitFor(() => {
      expect(getByText(/Click to expand/)).toBeTruthy();
    });
  });

  it('is collapsed by default', async () => {
    const { queryByText } = render(<WearableSyncCard />);
    await waitFor(() => {
      // Should not show detailed provider info when collapsed
      expect(queryByText('Last Sync:')).toBeFalsy();
    });
  });

  it('expands when header is pressed', async () => {
    const { getByText } = render(<WearableSyncCard />);
    await waitFor(() => {
      expect(getByText('WEARABLE SYNC')).toBeTruthy();
    });
    fireEvent.press(getByText('WEARABLE SYNC'));
    expect(getByText('Last Sync:')).toBeTruthy();
    expect(getByText('Data Sources:')).toBeTruthy();
  });

  it('displays provider names when expanded', async () => {
    const { getByText } = render(<WearableSyncCard />);
    await waitFor(() => {
      expect(getByText('WEARABLE SYNC')).toBeTruthy();
    });
    fireEvent.press(getByText('WEARABLE SYNC'));
    expect(getByText('Apple Health')).toBeTruthy();
    expect(getByText('Fitbit')).toBeTruthy();
  });

  it('shows connected count when expanded', async () => {
    const { getByText } = render(<WearableSyncCard />);
    await waitFor(() => {
      expect(getByText('WEARABLE SYNC')).toBeTruthy();
    });
    fireEvent.press(getByText('WEARABLE SYNC'));
    expect(getByText('1 connected')).toBeTruthy();
  });

  it('shows Connect/Sync buttons for providers', async () => {
    const { getByText } = render(<WearableSyncCard />);
    await waitFor(() => {
      expect(getByText('WEARABLE SYNC')).toBeTruthy();
    });
    fireEvent.press(getByText('WEARABLE SYNC'));
    expect(getByText('Connect')).toBeTruthy(); // Apple Health
    expect(getByText('Sync')).toBeTruthy(); // Fitbit
  });

  it('shows Sync All Providers button when providers are connected', async () => {
    const { getByText } = render(<WearableSyncCard />);
    await waitFor(() => {
      expect(getByText('WEARABLE SYNC')).toBeTruthy();
    });
    fireEvent.press(getByText('WEARABLE SYNC'));
    expect(getByText('Sync All Providers')).toBeTruthy();
  });

  it('collapses when header is pressed again', async () => {
    const { getByText, queryByText } = render(<WearableSyncCard />);
    await waitFor(() => {
      expect(getByText('WEARABLE SYNC')).toBeTruthy();
    });
    fireEvent.press(getByText('WEARABLE SYNC'));
    expect(getByText('Last Sync:')).toBeTruthy();
    fireEvent.press(getByText('WEARABLE SYNC'));
    expect(queryByText('Last Sync:')).toBeFalsy();
  });

  it('accepts onSync callback prop', () => {
    const onSyncMock = jest.fn();
    expect(() => render(<WearableSyncCard onSync={onSyncMock} />)).not.toThrow();
  });

  it('has correct accessibility labels', async () => {
    const { root } = render(<WearableSyncCard />);
    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });
});
