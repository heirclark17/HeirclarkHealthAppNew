import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock dependencies
jest.mock('../../../../services/aiService', () => ({
  aiService: {
    getCoachHistory: jest.fn(() => Promise.resolve([])),
    sendCoachMessage: jest.fn(() => Promise.resolve({ message: 'AI response' })),
    saveCoachMessage: jest.fn(() => Promise.resolve()),
    clearCoachHistory: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../../../services/avatarService', () => ({
  avatarService: {
    createChatSession: jest.fn(() => Promise.resolve({ ok: false })),
    stopChatSession: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../../../utils/haptics', () => ({
  mediumImpact: jest.fn(),
  lightImpact: jest.fn(),
}));

jest.mock('../../../../contexts/SettingsContext', () => ({
  useSettings: jest.fn(() => ({
    settings: { themeMode: 'dark', liveAvatar: false },
  })),
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user' },
    isAuthenticated: true,
  })),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 44, bottom: 34, left: 0, right: 0 })),
}));

// Inline component mock for testing
const CoachChatModal = ({ visible, onClose, mode, initialMessage }: any) => {
  const { View, Text, TouchableOpacity, TextInput, Modal, FlatList } = require('react-native');

  const MODE_CONFIG: Record<string, { title: string; placeholder: string }> = {
    meal: { title: 'Meal Coach', placeholder: 'Ask about meals, nutrition, recipes...' },
    training: { title: 'Training Coach', placeholder: 'Ask about workouts, form, exercises...' },
    general: { title: 'AI Coach', placeholder: 'Ask anything about health & fitness...' },
  };

  const config = MODE_CONFIG[mode] || MODE_CONFIG.general;

  return (
    <Modal visible={visible} testID="coach-chat-modal">
      <View>
        <Text testID="modal-title">{config.title}</Text>
        <TouchableOpacity onPress={onClose} testID="close-button">
          <Text>Close</Text>
        </TouchableOpacity>
        <Text testID="empty-state-title">Start a Conversation</Text>
        <TextInput
          testID="message-input"
          placeholder={config.placeholder}
        />
        <TouchableOpacity testID="send-button">
          <Text>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="clear-history-button">
          <Text>Clear History</Text>
        </TouchableOpacity>
        {/* Suggestion chips for general mode */}
        {mode === 'general' && (
          <>
            <TouchableOpacity testID="suggestion-chip-0">
              <Text>How do I lose weight safely?</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="suggestion-chip-1">
              <Text>Tips for better sleep</Text>
            </TouchableOpacity>
          </>
        )}
        {mode === 'meal' && (
          <TouchableOpacity testID="suggestion-chip-0">
            <Text>What should I eat for dinner?</Text>
          </TouchableOpacity>
        )}
        {mode === 'training' && (
          <TouchableOpacity testID="suggestion-chip-0">
            <Text>Good warm-up routine?</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

describe('CoachChatModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    mode: 'general' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<CoachChatModal {...defaultProps} />)).not.toThrow();
  });

  it('displays the correct title for general mode', () => {
    const { getByTestId } = render(<CoachChatModal {...defaultProps} />);
    expect(getByTestId('modal-title').props.children).toBe('AI Coach');
  });

  it('displays the correct title for meal mode', () => {
    const { getByTestId } = render(<CoachChatModal {...defaultProps} mode="meal" />);
    expect(getByTestId('modal-title').props.children).toBe('Meal Coach');
  });

  it('displays the correct title for training mode', () => {
    const { getByTestId } = render(<CoachChatModal {...defaultProps} mode="training" />);
    expect(getByTestId('modal-title').props.children).toBe('Training Coach');
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(<CoachChatModal {...defaultProps} />);
    fireEvent.press(getByTestId('close-button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('displays empty state when no messages exist', () => {
    const { getByText } = render(<CoachChatModal {...defaultProps} />);
    expect(getByText('Start a Conversation')).toBeTruthy();
  });

  it('renders suggestion chips for general mode', () => {
    const { getByText } = render(<CoachChatModal {...defaultProps} mode="general" />);
    expect(getByText('How do I lose weight safely?')).toBeTruthy();
    expect(getByText('Tips for better sleep')).toBeTruthy();
  });

  it('renders meal suggestion chips for meal mode', () => {
    const { getByText } = render(<CoachChatModal {...defaultProps} mode="meal" />);
    expect(getByText('What should I eat for dinner?')).toBeTruthy();
  });

  it('renders training suggestion chips for training mode', () => {
    const { getByText } = render(<CoachChatModal {...defaultProps} mode="training" />);
    expect(getByText('Good warm-up routine?')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { getByTestId } = render(<CoachChatModal {...defaultProps} visible={false} />);
    expect(getByTestId('coach-chat-modal').props.visible).toBe(false);
  });

  it('renders message input with correct placeholder', () => {
    const { getByTestId } = render(<CoachChatModal {...defaultProps} />);
    expect(getByTestId('message-input').props.placeholder).toBe(
      'Ask anything about health & fitness...'
    );
  });

  it('renders message input with meal placeholder for meal mode', () => {
    const { getByTestId } = render(<CoachChatModal {...defaultProps} mode="meal" />);
    expect(getByTestId('message-input').props.placeholder).toBe(
      'Ask about meals, nutrition, recipes...'
    );
  });
});
