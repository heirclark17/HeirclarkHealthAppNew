import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgramCard } from '../ProgramCard';

describe('ProgramCard', () => {
  const mockProgram = {
    id: 'prog-1',
    name: 'Hypertrophy Program',
    description: 'A 12-week muscle building program focused on progressive overload.',
    weeks: 12,
    daysPerWeek: 4,
    difficulty: 'Intermediate' as const,
    focus: 'Muscle Growth & Strength',
  };

  const defaultProps = {
    program: mockProgram,
    isActive: false,
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ProgramCard {...defaultProps} />)).not.toThrow();
  });

  it('displays the program name', () => {
    const { getByText } = render(<ProgramCard {...defaultProps} />);
    expect(getByText('Hypertrophy Program')).toBeTruthy();
  });

  it('displays the program description', () => {
    const { getByText } = render(<ProgramCard {...defaultProps} />);
    expect(getByText('A 12-week muscle building program focused on progressive overload.')).toBeTruthy();
  });

  it('displays the difficulty badge', () => {
    const { getByText } = render(<ProgramCard {...defaultProps} />);
    expect(getByText('Intermediate')).toBeTruthy();
  });

  it('displays the focus area', () => {
    const { getByText } = render(<ProgramCard {...defaultProps} />);
    expect(getByText('Focus: ')).toBeTruthy();
    expect(getByText('Muscle Growth & Strength')).toBeTruthy();
  });

  it('displays week count', () => {
    const { getByText } = render(<ProgramCard {...defaultProps} />);
    expect(getByText('12 weeks')).toBeTruthy();
  });

  it('displays days per week', () => {
    const { getByText } = render(<ProgramCard {...defaultProps} />);
    expect(getByText('4 days/week')).toBeTruthy();
  });

  it('displays Select Program button when not active', () => {
    const { getByText } = render(<ProgramCard {...defaultProps} />);
    expect(getByText('Select Program')).toBeTruthy();
  });

  it('calls onSelect when Select Program button is pressed', () => {
    const onSelectMock = jest.fn();
    const { getByText } = render(
      <ProgramCard {...defaultProps} onSelect={onSelectMock} />
    );
    fireEvent.press(getByText('Select Program'));
    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when card is pressed', () => {
    const onSelectMock = jest.fn();
    const { getByText } = render(
      <ProgramCard {...defaultProps} onSelect={onSelectMock} />
    );
    fireEvent.press(getByText('Hypertrophy Program'));
    expect(onSelectMock).toHaveBeenCalled();
  });

  it('shows Active badge when isActive is true', () => {
    const { getByText } = render(
      <ProgramCard {...defaultProps} isActive={true} />
    );
    expect(getByText(/Active/)).toBeTruthy();
  });

  it('hides Select Program button when active', () => {
    const { queryByText } = render(
      <ProgramCard {...defaultProps} isActive={true} />
    );
    expect(queryByText('Select Program')).toBeFalsy();
  });

  it('renders beginner difficulty correctly', () => {
    const beginnerProgram = { ...mockProgram, difficulty: 'Beginner' as const };
    const { getByText } = render(
      <ProgramCard {...defaultProps} program={beginnerProgram} />
    );
    expect(getByText('Beginner')).toBeTruthy();
  });

  it('renders advanced difficulty correctly', () => {
    const advancedProgram = { ...mockProgram, difficulty: 'Advanced' as const };
    const { getByText } = render(
      <ProgramCard {...defaultProps} program={advancedProgram} />
    );
    expect(getByText('Advanced')).toBeTruthy();
  });

  it('renders with different program data', () => {
    const differentProgram = {
      id: 'prog-2',
      name: 'Cardio Blast',
      description: 'High-intensity cardio program for fat loss.',
      weeks: 8,
      daysPerWeek: 5,
      difficulty: 'Beginner' as const,
      focus: 'Cardiovascular Endurance',
    };
    const { getByText } = render(
      <ProgramCard {...defaultProps} program={differentProgram} />
    );
    expect(getByText('Cardio Blast')).toBeTruthy();
    expect(getByText('8 weeks')).toBeTruthy();
    expect(getByText('5 days/week')).toBeTruthy();
    expect(getByText('Cardiovascular Endurance')).toBeTruthy();
  });
});
