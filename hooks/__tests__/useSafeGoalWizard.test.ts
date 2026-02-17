// @ts-nocheck
import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { useSafeGoalWizard } from '../useSafeGoalWizard';
import { useGoalWizard, WizardState } from '../../contexts/GoalWizardContext';

// Mock the GoalWizardContext
jest.mock('../../contexts/GoalWizardContext');

const mockUseGoalWizard = useGoalWizard as jest.MockedFunction<typeof useGoalWizard>;

describe('useSafeGoalWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when GoalWizardProvider is available', () => {
    it('returns state from context when provider is available', () => {
      const mockState: WizardState = {
        primaryGoal: 'lose_weight',
        currentWeight: 180,
        targetWeight: 160,
        weightUnit: 'lb',
        heightFt: 5,
        heightIn: 10,
        heightCm: 178,
        heightUnit: 'ft_in',
        age: 30,
        sex: 'male',
        startDate: '2026-01-01',
        targetDate: '2026-06-01',
        activityLevel: 'moderate',
        workoutsPerWeek: 4,
        workoutDuration: 45,
        cardioPreference: 'running',
        fitnessLevel: 'intermediate',
        dietStyle: 'high_protein',
        mealsPerDay: 3,
        intermittentFasting: false,
        fastingStart: '12:00',
        fastingEnd: '20:00',
        allergies: [],
        availableEquipment: ['dumbbells', 'resistance_bands'],
        injuries: [],
        waterGoalOz: 64,
        sleepGoalHours: 8,
        stepGoal: 10000,
        results: null,
        currentStep: 1,
        isComplete: false,
        isSaving: false,
      };

      mockUseGoalWizard.mockReturnValue({
        state: mockState,
        nextStep: jest.fn(),
        prevStep: jest.fn(),
        goToStep: jest.fn(),
        startEditing: jest.fn(),
        setPrimaryGoal: jest.fn(),
        setCurrentWeight: jest.fn(),
        setTargetWeight: jest.fn(),
        setWeightUnit: jest.fn(),
        setHeightFt: jest.fn(),
        setHeightIn: jest.fn(),
        setHeightCm: jest.fn(),
        setHeightUnit: jest.fn(),
        setAge: jest.fn(),
        setSex: jest.fn(),
        setStartDate: jest.fn(),
        setTargetDate: jest.fn(),
        setActivityLevel: jest.fn(),
        setWorkoutsPerWeek: jest.fn(),
        setWorkoutDuration: jest.fn(),
        setCardioPreference: jest.fn(),
        setFitnessLevel: jest.fn(),
        setDietStyle: jest.fn(),
        setMealsPerDay: jest.fn(),
        setIntermittentFasting: jest.fn(),
        setFastingStart: jest.fn(),
        setFastingEnd: jest.fn(),
        setAllergies: jest.fn(),
        addAllergy: jest.fn(),
        removeAllergy: jest.fn(),
        setAvailableEquipment: jest.fn(),
        toggleEquipment: jest.fn(),
        setInjuries: jest.fn(),
        addInjury: jest.fn(),
        removeInjury: jest.fn(),
        setWaterGoalOz: jest.fn(),
        setSleepGoalHours: jest.fn(),
        setStepGoal: jest.fn(),
        calculateAndSave: jest.fn(),
      });

      const { result } = renderHook(() => useSafeGoalWizard());

      expect(result.current.state).toEqual(mockState);
    });

    it('returns all expected fields from wizard state', () => {
      const mockState: WizardState = {
        primaryGoal: 'build_muscle',
        currentWeight: 150,
        targetWeight: 170,
        weightUnit: 'lb',
        heightFt: 6,
        heightIn: 0,
        heightCm: 183,
        heightUnit: 'ft_in',
        age: 25,
        sex: 'male',
        startDate: '2026-02-01',
        targetDate: '2026-08-01',
        activityLevel: 'very_active',
        workoutsPerWeek: 5,
        workoutDuration: 60,
        cardioPreference: 'hiit',
        fitnessLevel: 'advanced',
        dietStyle: 'high_protein',
        mealsPerDay: 4,
        intermittentFasting: false,
        fastingStart: '12:00',
        fastingEnd: '20:00',
        allergies: ['peanuts'],
        availableEquipment: ['barbell', 'dumbbells', 'squat_rack'],
        injuries: [],
        waterGoalOz: 100,
        sleepGoalHours: 8,
        stepGoal: 12000,
        results: {
          bmr: 1800,
          tdee: 2700,
          targetCalories: 2900,
          protein: 170,
          carbs: 325,
          fat: 80,
          weeklyWeightChange: 0.5,
        },
        currentStep: 5,
        isComplete: true,
        isSaving: false,
      };

      mockUseGoalWizard.mockReturnValue({
        state: mockState,
        nextStep: jest.fn(),
        prevStep: jest.fn(),
        goToStep: jest.fn(),
        startEditing: jest.fn(),
        setPrimaryGoal: jest.fn(),
        setCurrentWeight: jest.fn(),
        setTargetWeight: jest.fn(),
        setWeightUnit: jest.fn(),
        setHeightFt: jest.fn(),
        setHeightIn: jest.fn(),
        setHeightCm: jest.fn(),
        setHeightUnit: jest.fn(),
        setAge: jest.fn(),
        setSex: jest.fn(),
        setStartDate: jest.fn(),
        setTargetDate: jest.fn(),
        setActivityLevel: jest.fn(),
        setWorkoutsPerWeek: jest.fn(),
        setWorkoutDuration: jest.fn(),
        setCardioPreference: jest.fn(),
        setFitnessLevel: jest.fn(),
        setDietStyle: jest.fn(),
        setMealsPerDay: jest.fn(),
        setIntermittentFasting: jest.fn(),
        setFastingStart: jest.fn(),
        setFastingEnd: jest.fn(),
        setAllergies: jest.fn(),
        addAllergy: jest.fn(),
        removeAllergy: jest.fn(),
        setAvailableEquipment: jest.fn(),
        toggleEquipment: jest.fn(),
        setInjuries: jest.fn(),
        addInjury: jest.fn(),
        removeInjury: jest.fn(),
        setWaterGoalOz: jest.fn(),
        setSleepGoalHours: jest.fn(),
        setStepGoal: jest.fn(),
        calculateAndSave: jest.fn(),
      });

      const { result } = renderHook(() => useSafeGoalWizard());

      expect(result.current.state).toHaveProperty('primaryGoal', 'build_muscle');
      expect(result.current.state).toHaveProperty('currentWeight', 150);
      expect(result.current.state).toHaveProperty('targetWeight', 170);
      expect(result.current.state).toHaveProperty('weightUnit', 'lb');
      expect(result.current.state).toHaveProperty('age', 25);
      expect(result.current.state).toHaveProperty('sex', 'male');
      expect(result.current.state).toHaveProperty('activityLevel', 'very_active');
      expect(result.current.state).toHaveProperty('workoutsPerWeek', 5);
      expect(result.current.state).toHaveProperty('dietStyle', 'high_protein');
      expect(result.current.state).toHaveProperty('mealsPerDay', 4);
      expect(result.current.state).toHaveProperty('waterGoalOz', 100);
      expect(result.current.state).toHaveProperty('sleepGoalHours', 8);
      expect(result.current.state).toHaveProperty('stepGoal', 12000);
      expect(result.current.state).toHaveProperty('currentStep', 5);
      expect(result.current.state).toHaveProperty('isComplete', true);
      expect(result.current.state).toHaveProperty('isSaving', false);
      expect(result.current.state).toHaveProperty('results');
    });

    it('returns state with results when calculation is complete', () => {
      const mockResults = {
        bmr: 1650,
        tdee: 2310,
        targetCalories: 1810,
        protein: 140,
        carbs: 180,
        fat: 50,
        weeklyWeightChange: -1,
      };

      const mockState: WizardState = {
        primaryGoal: 'lose_weight',
        currentWeight: 180,
        targetWeight: 160,
        weightUnit: 'lb',
        heightFt: 5,
        heightIn: 8,
        heightCm: 173,
        heightUnit: 'ft_in',
        age: 32,
        sex: 'female',
        startDate: '2026-01-15',
        targetDate: '2026-07-15',
        activityLevel: 'moderate',
        workoutsPerWeek: 3,
        workoutDuration: 30,
        cardioPreference: 'walking',
        fitnessLevel: 'beginner',
        dietStyle: 'standard',
        mealsPerDay: 3,
        intermittentFasting: false,
        fastingStart: '12:00',
        fastingEnd: '20:00',
        allergies: [],
        availableEquipment: [],
        injuries: [],
        waterGoalOz: 64,
        sleepGoalHours: 8,
        stepGoal: 8000,
        results: mockResults,
        currentStep: 5,
        isComplete: true,
        isSaving: false,
      };

      mockUseGoalWizard.mockReturnValue({
        state: mockState,
        nextStep: jest.fn(),
        prevStep: jest.fn(),
        goToStep: jest.fn(),
        startEditing: jest.fn(),
        setPrimaryGoal: jest.fn(),
        setCurrentWeight: jest.fn(),
        setTargetWeight: jest.fn(),
        setWeightUnit: jest.fn(),
        setHeightFt: jest.fn(),
        setHeightIn: jest.fn(),
        setHeightCm: jest.fn(),
        setHeightUnit: jest.fn(),
        setAge: jest.fn(),
        setSex: jest.fn(),
        setStartDate: jest.fn(),
        setTargetDate: jest.fn(),
        setActivityLevel: jest.fn(),
        setWorkoutsPerWeek: jest.fn(),
        setWorkoutDuration: jest.fn(),
        setCardioPreference: jest.fn(),
        setFitnessLevel: jest.fn(),
        setDietStyle: jest.fn(),
        setMealsPerDay: jest.fn(),
        setIntermittentFasting: jest.fn(),
        setFastingStart: jest.fn(),
        setFastingEnd: jest.fn(),
        setAllergies: jest.fn(),
        addAllergy: jest.fn(),
        removeAllergy: jest.fn(),
        setAvailableEquipment: jest.fn(),
        toggleEquipment: jest.fn(),
        setInjuries: jest.fn(),
        addInjury: jest.fn(),
        removeInjury: jest.fn(),
        setWaterGoalOz: jest.fn(),
        setSleepGoalHours: jest.fn(),
        setStepGoal: jest.fn(),
        calculateAndSave: jest.fn(),
      });

      const { result } = renderHook(() => useSafeGoalWizard());

      expect(result.current.state?.results).toEqual(mockResults);
    });
  });

  describe('when GoalWizardProvider is NOT available', () => {
    it('returns null state when context throws error', () => {
      mockUseGoalWizard.mockImplementation(() => {
        throw new Error('GoalWizardContext not available');
      });

      const { result } = renderHook(() => useSafeGoalWizard());

      expect(result.current.state).toBeNull();
    });

    it('returns null state when context is undefined', () => {
      mockUseGoalWizard.mockImplementation(() => {
        throw new Error('useGoalWizard must be used within GoalWizardProvider');
      });

      const { result } = renderHook(() => useSafeGoalWizard());

      expect(result.current.state).toBeNull();
    });

    it('does not throw error when context is unavailable', () => {
      mockUseGoalWizard.mockImplementation(() => {
        throw new Error('Context not found');
      });

      expect(() => {
        renderHook(() => useSafeGoalWizard());
      }).not.toThrow();
    });

    it('returns object with state property even when context unavailable', () => {
      mockUseGoalWizard.mockImplementation(() => {
        throw new Error('No provider');
      });

      const { result } = renderHook(() => useSafeGoalWizard());

      expect(result.current).toHaveProperty('state');
      expect(result.current.state).toBeNull();
    });
  });

  describe('return value structure', () => {
    it('always returns an object with state property', () => {
      const mockState: WizardState = {
        primaryGoal: null,
        currentWeight: 0,
        targetWeight: 0,
        weightUnit: 'lb',
        heightFt: 0,
        heightIn: 0,
        heightCm: 0,
        heightUnit: 'ft_in',
        age: 0,
        sex: 'male',
        startDate: null,
        targetDate: null,
        activityLevel: 'moderate',
        workoutsPerWeek: 0,
        workoutDuration: 30,
        cardioPreference: 'walking',
        fitnessLevel: 'beginner',
        dietStyle: 'standard',
        mealsPerDay: 3,
        intermittentFasting: false,
        fastingStart: '12:00',
        fastingEnd: '20:00',
        allergies: [],
        availableEquipment: [],
        injuries: [],
        waterGoalOz: 64,
        sleepGoalHours: 8,
        stepGoal: 10000,
        results: null,
        currentStep: 1,
        isComplete: false,
        isSaving: false,
      };

      mockUseGoalWizard.mockReturnValue({
        state: mockState,
        nextStep: jest.fn(),
        prevStep: jest.fn(),
        goToStep: jest.fn(),
        startEditing: jest.fn(),
        setPrimaryGoal: jest.fn(),
        setCurrentWeight: jest.fn(),
        setTargetWeight: jest.fn(),
        setWeightUnit: jest.fn(),
        setHeightFt: jest.fn(),
        setHeightIn: jest.fn(),
        setHeightCm: jest.fn(),
        setHeightUnit: jest.fn(),
        setAge: jest.fn(),
        setSex: jest.fn(),
        setStartDate: jest.fn(),
        setTargetDate: jest.fn(),
        setActivityLevel: jest.fn(),
        setWorkoutsPerWeek: jest.fn(),
        setWorkoutDuration: jest.fn(),
        setCardioPreference: jest.fn(),
        setFitnessLevel: jest.fn(),
        setDietStyle: jest.fn(),
        setMealsPerDay: jest.fn(),
        setIntermittentFasting: jest.fn(),
        setFastingStart: jest.fn(),
        setFastingEnd: jest.fn(),
        setAllergies: jest.fn(),
        addAllergy: jest.fn(),
        removeAllergy: jest.fn(),
        setAvailableEquipment: jest.fn(),
        toggleEquipment: jest.fn(),
        setInjuries: jest.fn(),
        addInjury: jest.fn(),
        removeInjury: jest.fn(),
        setWaterGoalOz: jest.fn(),
        setSleepGoalHours: jest.fn(),
        setStepGoal: jest.fn(),
        calculateAndSave: jest.fn(),
      });

      const { result } = renderHook(() => useSafeGoalWizard());

      expect(typeof result.current).toBe('object');
      expect(result.current).toHaveProperty('state');
    });

    it('returns state type matching WizardState or null', () => {
      mockUseGoalWizard.mockImplementation(() => {
        throw new Error('Context unavailable');
      });

      const { result } = renderHook(() => useSafeGoalWizard());

      // Should be null
      expect(result.current.state).toBeNull();
    });
  });
});
