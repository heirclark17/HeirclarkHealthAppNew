import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AIMealLogger } from '../AIMealLogger';

// Mock SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock AdaptiveTDEEContext
jest.mock('../../contexts/AdaptiveTDEEContext', () => ({
  useAdaptiveTDEE: () => ({
    logCalories: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock SmartMealLoggerContext
jest.mock('../../contexts/SmartMealLoggerContext', () => ({
  useSmartMealLogger: () => ({
    logNewMeal: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setAudioModeAsync: jest.fn(),
    Recording: {
      createAsync: jest.fn().mockResolvedValue({
        recording: {
          stopAndUnloadAsync: jest.fn(),
          getURI: jest.fn().mockReturnValue('file://audio.m4a'),
        },
      }),
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  },
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}));

// Mock GlassCard
jest.mock('../GlassCard', () => ({
  GlassCard: ({ children }: any) => <>{children}</>,
}));

// Mock aiService
jest.mock('../../services/aiService', () => ({
  aiService: {
    analyzeMealText: jest.fn().mockResolvedValue(null),
    analyzeMealPhoto: jest.fn().mockResolvedValue(null),
    lookupBarcode: jest.fn().mockResolvedValue(null),
    transcribeVoice: jest.fn().mockResolvedValue('test food'),
  },
  NutritionAnalysis: {},
}));

// Mock api service
jest.mock('../../services/api', () => ({
  api: {
    logMeal: jest.fn().mockResolvedValue(true),
  },
  MealData: {},
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('AIMealLogger', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    selectedDate: '2025-01-15',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when visible', () => {
    expect(() => render(<AIMealLogger {...defaultProps} />)).not.toThrow();
  });

  it('does not show content when not visible', () => {
    const { queryByText } = render(
      <AIMealLogger {...defaultProps} visible={false} />
    );
    expect(queryByText('Log Meal')).toBeFalsy();
  });

  it('displays header title', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    expect(getByText('Log Meal')).toBeTruthy();
  });

  it('displays mode selection prompt', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    expect(getByText('How would you like to log your meal?')).toBeTruthy();
  });

  it('displays Text Description mode card', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    expect(getByText('Text Description')).toBeTruthy();
    expect(getByText('Describe your meal in words')).toBeTruthy();
  });

  it('displays Voice Recording mode card', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    expect(getByText('Voice Recording')).toBeTruthy();
    expect(getByText('Say what you ate')).toBeTruthy();
  });

  it('displays AI Camera mode card', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    expect(getByText('AI Camera')).toBeTruthy();
    expect(getByText('Snap a photo of your food')).toBeTruthy();
  });

  it('displays Barcode Scanner mode card', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    expect(getByText('Barcode Scanner')).toBeTruthy();
    expect(getByText('Scan packaged food')).toBeTruthy();
  });

  it('displays Dining Out mode card', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    expect(getByText('Dining Out')).toBeTruthy();
    expect(getByText('Log restaurant meals')).toBeTruthy();
  });

  it('displays Food Search mode card', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    expect(getByText('Food Search')).toBeTruthy();
    expect(getByText('Search nutrition database')).toBeTruthy();
  });

  it('switches to manual entry mode when Text Description is pressed', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    fireEvent.press(getByText('Text Description'));
    expect(getByText('Describe your meal')).toBeTruthy();
    expect(getByText('Analyze with AI')).toBeTruthy();
  });

  it('switches to voice mode when Voice Recording is pressed', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    fireEvent.press(getByText('Voice Recording'));
    expect(getByText('Tap to speak')).toBeTruthy();
    expect(getByText('Tap to record')).toBeTruthy();
  });

  it('switches to photo mode when AI Camera is pressed', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    fireEvent.press(getByText('AI Camera'));
    expect(getByText('Capture your meal')).toBeTruthy();
    expect(getByText('Open Camera')).toBeTruthy();
    expect(getByText('Choose from Gallery')).toBeTruthy();
  });

  it('switches to barcode mode when Barcode Scanner is pressed', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    fireEvent.press(getByText('Barcode Scanner'));
    expect(getByText('Scan product barcode')).toBeTruthy();
    expect(getByText('Open Scanner')).toBeTruthy();
  });

  it('switches to dining out mode when Dining Out is pressed', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    fireEvent.press(getByText('Dining Out'));
    expect(getByText('Describe your restaurant meal')).toBeTruthy();
  });

  it('shows Back button in non-select modes', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    fireEvent.press(getByText('Text Description'));
    expect(getByText('Back')).toBeTruthy();
  });

  it('returns to mode selection when Back is pressed', () => {
    const { getByText } = render(<AIMealLogger {...defaultProps} />);
    fireEvent.press(getByText('Text Description'));
    fireEvent.press(getByText('Back'));
    expect(getByText('How would you like to log your meal?')).toBeTruthy();
  });
});
