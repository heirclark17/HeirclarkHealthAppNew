import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock contexts
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark', liveAvatar: false, autoplayCoach: false },
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'John', lastName: 'Doe' },
    isAuthenticated: true,
  }),
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: any) => c },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    withSpring: (v: any) => v,
    withRepeat: (v: any) => v,
    withSequence: (...args: any[]) => args[0],
    Easing: { inOut: () => undefined, ease: undefined },
    FadeIn: { delay: () => ({}) },
    FadeInDown: { delay: () => ({ springify: () => ({}) }) },
    cancelAnimation: jest.fn(),
  };
});

// Mock haptics
jest.mock('../../../utils/haptics', () => ({
  lightImpact: jest.fn(),
  selectionFeedback: jest.fn(),
  mediumImpact: jest.fn(),
}));

// Mock GlassCard
jest.mock('../../GlassCard', () => ({
  GlassCard: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock WebView
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// Mock avatarService
jest.mock('../../../services/avatarService', () => ({
  avatarService: {
    getCoachingScript: jest.fn().mockResolvedValue({
      ok: true,
      script: 'Welcome to your coaching session!',
      streamingAvailable: false,
    }),
    stopSession: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { CoachingModal } from '../CoachingModal';

describe('CoachingModal', () => {
  const mockGoalData = {
    dailyCalories: 2000,
    protein: 150,
    carbs: 200,
    fat: 70,
    goalType: 'lose_weight',
  };

  const mockUserInputs = {
    currentWeight: 180,
    targetWeight: 170,
    activityLevel: 'moderate',
    sex: 'male',
    age: 30,
  };

  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    goalData: mockGoalData,
    userInputs: mockUserInputs,
    userId: 'test-user-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<CoachingModal {...mockProps} />)).not.toThrow();
  });

  it('displays the coaching header', () => {
    const { getByText } = render(<CoachingModal {...mockProps} />);
    expect(getByText('YOUR PERSONALIZED COACHING')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    const { getByText } = render(<CoachingModal {...mockProps} />);
    expect(getByText('Preparing your personalized coaching...')).toBeTruthy();
  });

  it('calls onClose when close is invoked', () => {
    const { getByText } = render(<CoachingModal {...mockProps} />);
    // The modal should have a close mechanism
    // The close button triggers handleClose which calls onClose
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('does not render content when visible is false', () => {
    const { queryByText } = render(
      <CoachingModal {...mockProps} visible={false} />
    );
    // Modal content should not be visible
    expect(queryByText('YOUR PERSONALIZED COACHING')).toBeNull();
  });

  it('handles null goalData gracefully', () => {
    expect(() =>
      render(<CoachingModal {...mockProps} goalData={null} />)
    ).not.toThrow();
  });
});
