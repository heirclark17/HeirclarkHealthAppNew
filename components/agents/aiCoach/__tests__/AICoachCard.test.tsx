import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const AICoachCard = ({ lastMessage, onPress, onChat }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="ai-coach-card">
      <View>
        <Text>AI Coach</Text>
        <Text testID="last-message">{lastMessage}</Text>
        <TouchableOpacity onPress={onChat} testID="chat-button">
          <Text>Chat Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

describe('AICoachCard', () => {
  const mockProps = {
    lastMessage: 'Great progress this week!',
    onPress: jest.fn(),
    onChat: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<AICoachCard {...mockProps} />)).not.toThrow();
  });

  it('displays last message', () => {
    const { getByText } = render(<AICoachCard {...mockProps} />);
    expect(getByText('Great progress this week!')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(<AICoachCard {...mockProps} />);
    fireEvent.press(getByTestId('ai-coach-card'));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('calls onChat when chat button is pressed', () => {
    const { getByTestId } = render(<AICoachCard {...mockProps} />);
    fireEvent.press(getByTestId('chat-button'));
    expect(mockProps.onChat).toHaveBeenCalled();
  });
});
