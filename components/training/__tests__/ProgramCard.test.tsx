import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const ProgramCard = ({ program, isActive, onPress, onSelect }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="program-card">
      <View>
        <Text testID="program-name">{program.name}</Text>
        <Text testID="program-duration">{program.duration} weeks</Text>
        <Text testID="program-difficulty">{program.difficulty}</Text>
        {isActive && <Text testID="active-badge">Active</Text>}
        <TouchableOpacity onPress={onSelect} testID="select-button">
          <Text>Select Program</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

describe('ProgramCard', () => {
  const mockProgram = {
    id: 'program-1',
    name: 'Strength Builder',
    duration: 12,
    difficulty: 'Intermediate',
    description: 'Build muscle and strength',
  };

  const mockProps = {
    program: mockProgram,
    isActive: false,
    onPress: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ProgramCard {...mockProps} />)).not.toThrow();
  });

  it('displays program name', () => {
    const { getByText } = render(<ProgramCard {...mockProps} />);
    expect(getByText('Strength Builder')).toBeTruthy();
  });

  it('displays program duration', () => {
    const { getByText } = render(<ProgramCard {...mockProps} />);
    expect(getByText('12 weeks')).toBeTruthy();
  });

  it('displays program difficulty', () => {
    const { getByText } = render(<ProgramCard {...mockProps} />);
    expect(getByText('Intermediate')).toBeTruthy();
  });

  it('shows active badge when program is active', () => {
    const { getByText } = render(<ProgramCard {...mockProps} isActive={true} />);
    expect(getByText('Active')).toBeTruthy();
  });

  it('does not show active badge when program is not active', () => {
    const { queryByTestId } = render(<ProgramCard {...mockProps} isActive={false} />);
    expect(queryByTestId('active-badge')).toBeNull();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(<ProgramCard {...mockProps} />);
    fireEvent.press(getByTestId('program-card'));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('calls onSelect when select button is pressed', () => {
    const { getByTestId } = render(<ProgramCard {...mockProps} />);
    fireEvent.press(getByTestId('select-button'));
    expect(mockProps.onSelect).toHaveBeenCalled();
  });
});
