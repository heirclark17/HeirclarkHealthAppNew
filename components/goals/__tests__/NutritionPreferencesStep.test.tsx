import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock contexts
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark' },
  }),
}));

const mockGoalWizardState = {
  dietStyle: 'standard',
  mealsPerDay: 3,
  intermittentFasting: false,
  allergies: [] as string[],
  mealVariety: 'moderate',
  snackPreference: 'sometimes',
  cheatDays: [] as string[],
  cookingSkill: 'intermediate',
  dailyWaterGoal: 8,
  dailySleepGoal: 8,
  dailyStepsGoal: 10000,
};

jest.mock('../../../contexts/GoalWizardContext', () => ({
  useGoalWizard: () => ({
    state: mockGoalWizardState,
    setDietStyle: jest.fn(),
    setMealsPerDay: jest.fn(),
    setIntermittentFasting: jest.fn(),
    toggleAllergy: jest.fn(),
    setMealVariety: jest.fn(),
    setSnackPreference: jest.fn(),
    toggleCheatDay: jest.fn(),
    setCookingSkill: jest.fn(),
    setDailyWaterGoal: jest.fn(),
    setDailySleepGoal: jest.fn(),
    setDailyStepsGoal: jest.fn(),
  }),
}));

jest.mock('../../../contexts/FoodPreferencesContext', () => ({
  useFoodPreferencesSafe: () => ({
    preferences: {
      proteins: [],
      vegetables: [],
      starches: [],
      snacks: [],
      cuisines: [],
      dislikedFoods: [],
    },
    setPreferences: jest.fn(),
    updatePreference: jest.fn(),
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
    FadeInDown: { delay: () => ({ springify: () => ({}) }) },
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

// Mock NumberText
jest.mock('../../NumberText', () => ({
  NumberText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

import { NutritionPreferencesStep } from '../NutritionPreferencesStep';

describe('NutritionPreferencesStep', () => {
  const mockProps = {
    onNext: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<NutritionPreferencesStep {...mockProps} />)).not.toThrow();
  });

  it('displays the title', () => {
    const { getByText } = render(<NutritionPreferencesStep {...mockProps} />);
    expect(getByText('Nutrition Preferences')).toBeTruthy();
  });

  it('displays diet style section', () => {
    const { getByText } = render(<NutritionPreferencesStep {...mockProps} />);
    expect(getByText('DIET STYLE')).toBeTruthy();
  });

  it('displays meals per day section', () => {
    const { getByText } = render(<NutritionPreferencesStep {...mockProps} />);
    expect(getByText('MEALS PER DAY')).toBeTruthy();
  });

  it('displays intermittent fasting option', () => {
    const { getByText } = render(<NutritionPreferencesStep {...mockProps} />);
    expect(getByText('Intermittent Fasting')).toBeTruthy();
  });

  it('displays back and continue buttons', () => {
    const { getByText } = render(<NutritionPreferencesStep {...mockProps} />);
    expect(getByText('BACK')).toBeTruthy();
    expect(getByText('CONTINUE')).toBeTruthy();
  });

  it('calls onBack when BACK is pressed', () => {
    const { getByText } = render(<NutritionPreferencesStep {...mockProps} />);
    fireEvent.press(getByText('BACK'));
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('calls onNext when CONTINUE is pressed', () => {
    const { getByText } = render(<NutritionPreferencesStep {...mockProps} />);
    fireEvent.press(getByText('CONTINUE'));
    expect(mockProps.onNext).toHaveBeenCalled();
  });
});
