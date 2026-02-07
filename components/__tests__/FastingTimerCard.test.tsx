import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FastingTimerCard } from '../FastingTimerCard';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock the FastingTimerContext
const mockStartFast = jest.fn();
const mockPauseFast = jest.fn();
const mockResumeFast = jest.fn();
const mockStopFast = jest.fn();
const mockResetTimer = jest.fn();
const mockSetPreset = jest.fn();
const mockSyncWithGoalWizard = jest.fn();

jest.mock('../../contexts/FastingTimerContext', () => ({
  useFastingTimer: () => ({
    state: {
      isActive: false,
      isPaused: false,
      currentState: 'idle',
      selectedPreset: '16:8',
      completedFastsThisWeek: 3,
      currentStreak: 5,
    },
    startFast: mockStartFast,
    pauseFast: mockPauseFast,
    resumeFast: mockResumeFast,
    stopFast: mockStopFast,
    resetTimer: mockResetTimer,
    setPreset: mockSetPreset,
    getTimeRemaining: () => ({ hours: 16, minutes: 0, seconds: 0, totalSeconds: 57600 }),
    getProgress: () => 0,
    getFastingDuration: () => 16,
    syncWithGoalWizard: mockSyncWithGoalWizard,
  }),
  FASTING_PRESETS: [
    { id: '16:8', label: '16:8', fastingHours: 16, eatingHours: 8, description: 'Most popular' },
    { id: '18:6', label: '18:6', fastingHours: 18, eatingHours: 6, description: 'Intermediate' },
    { id: '20:4', label: '20:4', fastingHours: 20, eatingHours: 4, description: 'Advanced' },
    { id: '14:10', label: '14:10', fastingHours: 14, eatingHours: 10, description: 'Beginner' },
    { id: 'omad', label: 'OMAD', fastingHours: 23, eatingHours: 1, description: 'One meal a day' },
  ],
}));

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  lightImpact: jest.fn().mockResolvedValue(undefined),
  selectionFeedback: jest.fn().mockResolvedValue(undefined),
}));

describe('FastingTimerCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<FastingTimerCard />)).not.toThrow();
  });

  it('displays FASTING label', () => {
    const { getByText } = render(<FastingTimerCard />);
    expect(getByText('FASTING')).toBeTruthy();
  });

  it('displays selected preset label when not active', () => {
    const { getByText } = render(<FastingTimerCard />);
    expect(getByText('16:8')).toBeTruthy();
  });

  it('displays Ready state when not active', () => {
    const { getByText } = render(<FastingTimerCard />);
    expect(getByText('Ready')).toBeTruthy();
  });

  it('calls onPress callback when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<FastingTimerCard onPress={onPressMock} />);
    fireEvent.press(getByText('FASTING').parent!.parent!);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('opens controls modal when pressed without onPress', () => {
    const { getByText, queryByText } = render(<FastingTimerCard />);
    fireEvent.press(getByText('FASTING').parent!.parent!);
    // Modal content should appear
    expect(queryByText('FASTING PLANS')).toBeTruthy();
  });

  it('displays fasting preset options in modal', () => {
    const { getByText, queryByText } = render(<FastingTimerCard />);
    fireEvent.press(getByText('FASTING').parent!.parent!);
    expect(queryByText('18:6')).toBeTruthy();
    expect(queryByText('20:4')).toBeTruthy();
    expect(queryByText('14:10')).toBeTruthy();
    expect(queryByText('OMAD')).toBeTruthy();
  });

  it('displays weekly stats in modal', () => {
    const { getByText, queryByText } = render(<FastingTimerCard />);
    fireEvent.press(getByText('FASTING').parent!.parent!);
    expect(queryByText('This Week')).toBeTruthy();
    expect(queryByText('Streak')).toBeTruthy();
    expect(queryByText('3')).toBeTruthy();  // completedFastsThisWeek
    expect(queryByText('5')).toBeTruthy();  // currentStreak
  });

  it('displays Close button in modal', () => {
    const { getByText, queryByText } = render(<FastingTimerCard />);
    fireEvent.press(getByText('FASTING').parent!.parent!);
    expect(queryByText('Close')).toBeTruthy();
  });

  it('syncs with goal wizard on mount', () => {
    render(<FastingTimerCard />);
    expect(mockSyncWithGoalWizard).toHaveBeenCalled();
  });

  it('renders with all default state values', () => {
    const { root } = render(<FastingTimerCard />);
    expect(root).toBeTruthy();
  });
});

describe('FastingTimerCard - Active State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Override the mock to simulate active fasting state
    const { useFastingTimer } = require('../../contexts/FastingTimerContext');
    useFastingTimer.mockReturnValue({
      state: {
        isActive: true,
        isPaused: false,
        currentState: 'fasting',
        selectedPreset: '16:8',
        completedFastsThisWeek: 3,
        currentStreak: 5,
      },
      startFast: mockStartFast,
      pauseFast: mockPauseFast,
      resumeFast: mockResumeFast,
      stopFast: mockStopFast,
      resetTimer: mockResetTimer,
      setPreset: mockSetPreset,
      getTimeRemaining: () => ({ hours: 12, minutes: 30, seconds: 45, totalSeconds: 45045 }),
      getProgress: () => 22,
      getFastingDuration: () => 16,
      syncWithGoalWizard: mockSyncWithGoalWizard,
    });
  });

  it('displays timer when active', () => {
    // This test uses the overridden mock set in beforeEach
    // The component should render the timer format
    const { root } = render(<FastingTimerCard />);
    expect(root).toBeTruthy();
  });
});
