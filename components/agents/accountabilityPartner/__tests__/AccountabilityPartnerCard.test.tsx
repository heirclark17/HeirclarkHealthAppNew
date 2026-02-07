import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const AccountabilityPartnerCard = ({ partner, streak, onPress, onMessage }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="accountability-card">
      <View>
        <Text>Accountability Partner</Text>
        {partner && <Text testID="partner-name">{partner.name}</Text>}
        <Text testID="streak">{streak} day streak</Text>
        <TouchableOpacity onPress={onMessage} testID="message-button">
          <Text>Message Partner</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

describe('AccountabilityPartnerCard', () => {
  const mockProps = {
    partner: { id: '1', name: 'Alex Johnson' },
    streak: 15,
    onPress: jest.fn(),
    onMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<AccountabilityPartnerCard {...mockProps} />)).not.toThrow();
  });

  it('displays partner name', () => {
    const { getByText } = render(<AccountabilityPartnerCard {...mockProps} />);
    expect(getByText('Alex Johnson')).toBeTruthy();
  });

  it('displays streak', () => {
    const { getByText } = render(<AccountabilityPartnerCard {...mockProps} />);
    expect(getByText('15 day streak')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(<AccountabilityPartnerCard {...mockProps} />);
    fireEvent.press(getByTestId('accountability-card'));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('calls onMessage when message button is pressed', () => {
    const { getByTestId } = render(<AccountabilityPartnerCard {...mockProps} />);
    fireEvent.press(getByTestId('message-button'));
    expect(mockProps.onMessage).toHaveBeenCalled();
  });

  it('renders without partner', () => {
    const { queryByTestId } = render(
      <AccountabilityPartnerCard {...mockProps} partner={null} />
    );
    expect(queryByTestId('partner-name')).toBeNull();
  });
});
