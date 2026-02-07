import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileStep } from '../ProfileStep';

// Mock SettingsContext
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

describe('ProfileStep', () => {
  const mockProps = {
    age: '',
    setAge: jest.fn(),
    sex: 'male' as const,
    setSex: jest.fn(),
    heightFt: '',
    setHeightFt: jest.fn(),
    heightIn: '',
    setHeightIn: jest.fn(),
    weight: '',
    setWeight: jest.fn(),
    onNext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ProfileStep {...mockProps} />)).not.toThrow();
  });

  it('renders title and description', () => {
    const { getByText } = render(<ProfileStep {...mockProps} />);
    expect(getByText('Tell Us About Yourself')).toBeTruthy();
    expect(getByText(/This information helps us calculate/)).toBeTruthy();
  });

  it('renders age input', () => {
    const { getByPlaceholderText } = render(<ProfileStep {...mockProps} />);
    expect(getByPlaceholderText('25')).toBeTruthy();
  });

  it('calls setAge when age input changes', () => {
    const { getByPlaceholderText } = render(<ProfileStep {...mockProps} />);
    fireEvent.changeText(getByPlaceholderText('25'), '30');
    expect(mockProps.setAge).toHaveBeenCalledWith('30');
  });

  it('renders sex toggle buttons', () => {
    const { getByText } = render(<ProfileStep {...mockProps} />);
    expect(getByText('Male')).toBeTruthy();
    expect(getByText('Female')).toBeTruthy();
  });

  it('calls setSex when male button is pressed', () => {
    const { getByText } = render(<ProfileStep {...mockProps} />);
    fireEvent.press(getByText('Male'));
    expect(mockProps.setSex).toHaveBeenCalledWith('male');
  });

  it('calls setSex when female button is pressed', () => {
    const { getByText } = render(<ProfileStep {...mockProps} />);
    fireEvent.press(getByText('Female'));
    expect(mockProps.setSex).toHaveBeenCalledWith('female');
  });

  it('renders height inputs', () => {
    const { getByPlaceholderText } = render(<ProfileStep {...mockProps} />);
    expect(getByPlaceholderText('5')).toBeTruthy();
    expect(getByPlaceholderText('10')).toBeTruthy();
  });

  it('calls setHeightFt when feet input changes', () => {
    const { getByPlaceholderText } = render(<ProfileStep {...mockProps} />);
    fireEvent.changeText(getByPlaceholderText('5'), '6');
    expect(mockProps.setHeightFt).toHaveBeenCalledWith('6');
  });

  it('calls setHeightIn when inches input changes', () => {
    const { getByPlaceholderText } = render(<ProfileStep {...mockProps} />);
    fireEvent.changeText(getByPlaceholderText('10'), '2');
    expect(mockProps.setHeightIn).toHaveBeenCalledWith('2');
  });

  it('renders weight input', () => {
    const { getByPlaceholderText } = render(<ProfileStep {...mockProps} />);
    expect(getByPlaceholderText('180')).toBeTruthy();
  });

  it('calls setWeight when weight input changes', () => {
    const { getByPlaceholderText } = render(<ProfileStep {...mockProps} />);
    fireEvent.changeText(getByPlaceholderText('180'), '200');
    expect(mockProps.setWeight).toHaveBeenCalledWith('200');
  });

  it('renders continue button', () => {
    const { getByText } = render(<ProfileStep {...mockProps} />);
    expect(getByText('CONTINUE')).toBeTruthy();
  });

  it('calls onNext when continue button is pressed', () => {
    const { getByText } = render(<ProfileStep {...mockProps} />);
    fireEvent.press(getByText('CONTINUE'));
    expect(mockProps.onNext).toHaveBeenCalledTimes(1);
  });

  it('displays provided values', () => {
    const propsWithValues = {
      ...mockProps,
      age: '30',
      weight: '200',
      heightFt: '6',
      heightIn: '2',
    };
    const { getByDisplayValue } = render(<ProfileStep {...propsWithValues} />);
    expect(getByDisplayValue('30')).toBeTruthy();
    expect(getByDisplayValue('200')).toBeTruthy();
    expect(getByDisplayValue('6')).toBeTruthy();
    expect(getByDisplayValue('2')).toBeTruthy();
  });

  it('renders input units', () => {
    const { getAllByText } = render(<ProfileStep {...mockProps} />);
    expect(getAllByText('years')).toBeTruthy();
    expect(getAllByText('ft')).toBeTruthy();
    expect(getAllByText('in')).toBeTruthy();
    expect(getAllByText('lbs')).toBeTruthy();
  });
});
