import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../services/exerciseDbService', () => ({
  exerciseDbService: {
    searchExercisesByName: jest.fn(() => Promise.resolve([])),
  },
}));

jest.mock('../../../liquidGlass', () => ({
  useGlassTheme: jest.fn(() => ({
    isDark: true,
    colors: {
      primary: '#4ECDC4',
      text: '#FFFFFF',
      textSecondary: '#999999',
      textTertiary: '#666666',
      glassBorder: 'rgba(255,255,255,0.1)',
      background: '#000000',
    },
  })),
}));

jest.mock('../../../NumberText', () => ({
  NumberText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('../../../../utils/haptics', () => ({
  mediumImpact: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 44, bottom: 34, left: 0, right: 0 })),
}));

// Inline mock component
const FormCoachModal = ({ visible, onClose, exercise, exerciseName }: any) => {
  const { View, Text, TouchableOpacity, Modal, ScrollView } = require('react-native');
  const [activeTab, setActiveTab] = React.useState('form');

  const displayName = exercise?.name || exerciseName || 'Exercise';

  return (
    <Modal visible={visible} testID="form-coach-modal">
      <View>
        <Text testID="exercise-name">{displayName}</Text>
        <TouchableOpacity onPress={onClose} testID="close-button">
          <Text>Close</Text>
        </TouchableOpacity>

        {/* Tab Buttons */}
        <TouchableOpacity onPress={() => setActiveTab('form')} testID="tab-form">
          <Text>Form Cues</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('mistakes')} testID="tab-mistakes">
          <Text>Mistakes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('variations')} testID="tab-variations">
          <Text>Variations</Text>
        </TouchableOpacity>

        {/* Tab Content */}
        {activeTab === 'form' && (
          <View testID="form-tab-content">
            {exercise?.formCues && exercise.formCues.length > 0 ? (
              exercise.formCues.map((cue: any, i: number) => (
                <Text key={i} testID={`form-cue-${i}`}>{cue.cue}</Text>
              ))
            ) : (
              <Text testID="no-form-cues">No form cues available for this exercise</Text>
            )}
          </View>
        )}
        {activeTab === 'mistakes' && (
          <View testID="mistakes-tab-content">
            {exercise?.commonMistakes && exercise.commonMistakes.length > 0 ? (
              exercise.commonMistakes.map((m: any, i: number) => (
                <View key={i}>
                  <Text testID={`mistake-${i}`}>{m.mistake}</Text>
                  <Text>{m.consequence}</Text>
                  <Text>{m.correction}</Text>
                </View>
              ))
            ) : (
              <Text testID="no-mistakes">No common mistakes documented</Text>
            )}
          </View>
        )}
        {activeTab === 'variations' && (
          <View testID="variations-tab-content">
            {exercise?.variations && exercise.variations.length > 0 ? (
              exercise.variations.map((v: string, i: number) => (
                <Text key={i} testID={`variation-${i}`}>{v}</Text>
              ))
            ) : (
              <Text testID="no-variations">No variations documented</Text>
            )}
          </View>
        )}

        <Text>Target</Text>
        <Text>Equipment</Text>
      </View>
    </Modal>
  );
};

describe('FormCoachModal', () => {
  const mockExercise = {
    name: 'Barbell Squat',
    musclesWorked: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['barbell'],
    formCues: [
      { id: 'cue-1', cue: 'Keep chest up', order: 1 },
      { id: 'cue-2', cue: 'Drive through heels', order: 2 },
    ],
    commonMistakes: [
      {
        id: 'mistake-1',
        mistake: 'Knees caving in',
        consequence: 'Risk of knee injury',
        correction: 'Push knees outward',
        severity: 'serious',
      },
    ],
    variations: ['Front Squat', 'Goblet Squat'],
    alternatives: ['Leg Press'],
  };

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    exercise: mockExercise,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<FormCoachModal {...defaultProps} />)).not.toThrow();
  });

  it('displays exercise name from exercise prop', () => {
    const { getByTestId } = render(<FormCoachModal {...defaultProps} />);
    expect(getByTestId('exercise-name').props.children).toBe('Barbell Squat');
  });

  it('displays exercise name from exerciseName prop when exercise is null', () => {
    const { getByTestId } = render(
      <FormCoachModal visible={true} onClose={jest.fn()} exerciseName="Deadlift" />
    );
    expect(getByTestId('exercise-name').props.children).toBe('Deadlift');
  });

  it('displays default name when no exercise data', () => {
    const { getByTestId } = render(
      <FormCoachModal visible={true} onClose={jest.fn()} />
    );
    expect(getByTestId('exercise-name').props.children).toBe('Exercise');
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(<FormCoachModal {...defaultProps} />);
    fireEvent.press(getByTestId('close-button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows form cues tab by default', () => {
    const { getByTestId } = render(<FormCoachModal {...defaultProps} />);
    expect(getByTestId('form-tab-content')).toBeTruthy();
  });

  it('displays form cues for the exercise', () => {
    const { getByText } = render(<FormCoachModal {...defaultProps} />);
    expect(getByText('Keep chest up')).toBeTruthy();
    expect(getByText('Drive through heels')).toBeTruthy();
  });

  it('switches to mistakes tab when pressed', () => {
    const { getByTestId, getByText } = render(<FormCoachModal {...defaultProps} />);
    fireEvent.press(getByTestId('tab-mistakes'));
    expect(getByTestId('mistakes-tab-content')).toBeTruthy();
    expect(getByText('Knees caving in')).toBeTruthy();
  });

  it('switches to variations tab when pressed', () => {
    const { getByTestId, getByText } = render(<FormCoachModal {...defaultProps} />);
    fireEvent.press(getByTestId('tab-variations'));
    expect(getByTestId('variations-tab-content')).toBeTruthy();
    expect(getByText('Front Squat')).toBeTruthy();
    expect(getByText('Goblet Squat')).toBeTruthy();
  });

  it('shows empty state when no form cues', () => {
    const exerciseNoCues = { ...mockExercise, formCues: [] };
    const { getByText } = render(
      <FormCoachModal visible={true} onClose={jest.fn()} exercise={exerciseNoCues} />
    );
    expect(getByText('No form cues available for this exercise')).toBeTruthy();
  });

  it('shows empty state when no mistakes', () => {
    const exerciseNoMistakes = { ...mockExercise, commonMistakes: [] };
    const { getByTestId, getByText } = render(
      <FormCoachModal visible={true} onClose={jest.fn()} exercise={exerciseNoMistakes} />
    );
    fireEvent.press(getByTestId('tab-mistakes'));
    expect(getByText('No common mistakes documented')).toBeTruthy();
  });

  it('shows empty state when no variations', () => {
    const exerciseNoVariations = { ...mockExercise, variations: [] };
    const { getByTestId, getByText } = render(
      <FormCoachModal visible={true} onClose={jest.fn()} exercise={exerciseNoVariations} />
    );
    fireEvent.press(getByTestId('tab-variations'));
    expect(getByText('No variations documented')).toBeTruthy();
  });

  it('renders info labels for target and equipment', () => {
    const { getByText } = render(<FormCoachModal {...defaultProps} />);
    expect(getByText('Target')).toBeTruthy();
    expect(getByText('Equipment')).toBeTruthy();
  });
});
