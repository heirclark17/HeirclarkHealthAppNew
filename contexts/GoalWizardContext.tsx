import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityLevel, GoalType, Sex, CalculatedResults } from '../constants/goals';
import { calculateGoals } from '../utils/goalCalculations';
import { api } from '../services/api';

// Extended types for new wizard
export type PrimaryGoal = 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_health' | 'custom';
export type DietStyle = 'standard' | 'keto' | 'high_protein' | 'vegetarian' | 'vegan' | 'custom';
export type WeightUnit = 'lb' | 'kg';
export type HeightUnit = 'ft_in' | 'cm';
export type CardioPreference = 'walking' | 'running' | 'hiit';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type StrengthLevel = 'never_lifted' | 'beginner' | 'intermediate' | 'advanced';

export interface WizardState {
  // Step 1: Primary Goal
  primaryGoal: PrimaryGoal | null;

  // Step 2: Body Metrics
  currentWeight: number;
  targetWeight: number;
  weightUnit: WeightUnit;
  heightFt: number;
  heightIn: number;
  heightCm: number;
  heightUnit: HeightUnit;
  age: number;
  sex: Sex;
  startDate: string | null; // When user wants to start (ISO date string)
  targetDate: string | null; // When user wants to reach goal (ISO date string)

  // Step 3: Activity & Lifestyle
  activityLevel: ActivityLevel;
  workoutsPerWeek: number;
  workoutDuration: 15 | 30 | 45 | 60;
  cardioPreference: CardioPreference;
  fitnessLevel: FitnessLevel;

  // Step 3c: Strength Baseline (for training personalization)
  hasLiftingExperience: boolean;
  strengthLevel: StrengthLevel;
  benchPress1RM: number | null; // Optional, in pounds
  squat1RM: number | null;
  deadlift1RM: number | null;

  // Step 4: Nutrition Preferences
  dietStyle: DietStyle;
  mealsPerDay: number;
  intermittentFasting: boolean;
  fastingStart: string; // "12:00"
  fastingEnd: string;   // "20:00"
  allergies: string[];

  // Step 3b: Workout Equipment & Limitations
  availableEquipment: string[];
  injuries: string[];

  // Daily Goals (customizable)
  waterGoalOz: number;
  sleepGoalHours: number;
  stepGoal: number;

  // Calculated Results
  results: CalculatedResults | null;

  // Step 5: Program Selection
  selectedProgramId: string | null;
  selectedProgramName: string | null;

  // Wizard state
  currentStep: number;
  isComplete: boolean;
  isSaving: boolean;
}

interface GoalWizardContextType {
  state: WizardState;

  // Step navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  startEditing: () => void; // Reset isComplete and go back to step 1 to allow editing

  // Step 1
  setPrimaryGoal: (goal: PrimaryGoal) => void;

  // Step 2
  setCurrentWeight: (weight: number) => void;
  setTargetWeight: (weight: number) => void;
  setWeightUnit: (unit: WeightUnit) => void;
  setHeightFt: (ft: number) => void;
  setHeightIn: (inches: number) => void;
  setHeightCm: (cm: number) => void;
  setHeightUnit: (unit: HeightUnit) => void;
  setAge: (age: number) => void;
  setSex: (sex: Sex) => void;
  setStartDate: (date: string | null) => void;
  setTargetDate: (date: string | null) => void;

  // Step 3
  setActivityLevel: (level: ActivityLevel) => void;
  setWorkoutsPerWeek: (count: number) => void;
  setWorkoutDuration: (duration: 15 | 30 | 45 | 60) => void;
  setCardioPreference: (preference: CardioPreference) => void;
  setFitnessLevel: (level: FitnessLevel) => void;

  // Step 3c: Strength Baseline
  setHasLiftingExperience: (hasExperience: boolean) => void;
  setStrengthLevel: (level: StrengthLevel) => void;
  setBenchPress1RM: (weight: number | null) => void;
  setSquat1RM: (weight: number | null) => void;
  setDeadlift1RM: (weight: number | null) => void;

  // Step 4
  setDietStyle: (style: DietStyle) => void;
  setMealsPerDay: (meals: number) => void;
  setIntermittentFasting: (enabled: boolean) => void;
  setFastingWindow: (start: string, end: string) => void;
  toggleAllergy: (allergy: string) => void;
  toggleEquipment: (equipment: string) => void;
  toggleInjury: (injury: string) => void;

  // Daily Goals
  setWaterGoalOz: (oz: number) => void;
  setSleepGoalHours: (hours: number) => void;
  setStepGoal: (steps: number) => void;

  // Step 5: Program Selection
  setSelectedProgram: (programId: string, programName: string) => void;

  // Actions
  calculateResults: () => void;
  saveGoals: () => Promise<boolean>;
  resetWizard: () => void;
  loadSavedProgress: () => Promise<void>;
}

const STORAGE_KEY = 'hc_goal_wizard_progress';

const initialState: WizardState = {
  primaryGoal: null,
  currentWeight: 180,
  targetWeight: 170,
  weightUnit: 'lb',
  heightFt: 5,
  heightIn: 10,
  heightCm: 178,
  heightUnit: 'ft_in',
  age: 30,
  sex: 'male',
  startDate: new Date().toISOString().split('T')[0],
  targetDate: null,
  activityLevel: 'moderate',
  workoutsPerWeek: 3,
  workoutDuration: 30,
  cardioPreference: 'walking',
  fitnessLevel: 'intermediate',
  hasLiftingExperience: false,
  strengthLevel: 'never_lifted',
  benchPress1RM: null,
  squat1RM: null,
  deadlift1RM: null,
  dietStyle: 'standard',
  mealsPerDay: 3,
  intermittentFasting: false,
  fastingStart: '12:00',
  fastingEnd: '20:00',
  allergies: [],
  availableEquipment: ['bodyweight'], // Default to bodyweight only
  injuries: [],
  waterGoalOz: 64,
  sleepGoalHours: 8,
  stepGoal: 10000,
  results: null,
  selectedProgramId: null,
  selectedProgramName: null,
  currentStep: 1,
  isComplete: false,
  isSaving: false,
};

const GoalWizardContext = createContext<GoalWizardContextType | undefined>(undefined);

export function GoalWizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  // Convert primary goal to GoalType for calculation
  const getGoalType = (primaryGoal: PrimaryGoal | null): GoalType => {
    switch (primaryGoal) {
      case 'lose_weight':
        return 'lose';
      case 'build_muscle':
        return 'gain';
      default:
        return 'maintain';
    }
  };

  // Convert weight to lbs for calculation
  const getWeightInLbs = (weight: number, unit: WeightUnit): number => {
    return unit === 'kg' ? weight * 2.20462 : weight;
  };

  // Convert height to ft/in for calculation
  const getHeightInFtIn = (state: WizardState): { ft: number; inches: number } => {
    if (state.heightUnit === 'cm') {
      const totalInches = state.heightCm / 2.54;
      return { ft: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
    }
    return { ft: state.heightFt, inches: state.heightIn };
  };

  // Step navigation
  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 5) }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 1) }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: Math.max(1, Math.min(step, 5)) }));
  }, []);

  // Start editing - reset isComplete and go back to step 1 (keeps all data)
  const startEditing = useCallback(() => {
    setState(prev => ({ ...prev, isComplete: false, currentStep: 1 }));
  }, []);

  // Step 1 setters
  const setPrimaryGoal = useCallback((goal: PrimaryGoal) => {
    setState(prev => ({ ...prev, primaryGoal: goal }));
  }, []);

  // Step 2 setters
  const setCurrentWeight = useCallback((weight: number) => {
    setState(prev => ({ ...prev, currentWeight: weight }));
  }, []);

  const setTargetWeight = useCallback((weight: number) => {
    setState(prev => ({ ...prev, targetWeight: weight }));
  }, []);

  const setWeightUnit = useCallback((unit: WeightUnit) => {
    setState(prev => {
      // Convert values when switching units
      if (prev.weightUnit !== unit) {
        const conversionFactor = unit === 'kg' ? 0.453592 : 2.20462;
        return {
          ...prev,
          weightUnit: unit,
          currentWeight: Math.round(prev.currentWeight * conversionFactor),
          targetWeight: Math.round(prev.targetWeight * conversionFactor),
        };
      }
      return prev;
    });
  }, []);

  const setHeightFt = useCallback((ft: number) => {
    setState(prev => ({ ...prev, heightFt: ft }));
  }, []);

  const setHeightIn = useCallback((inches: number) => {
    setState(prev => ({ ...prev, heightIn: inches }));
  }, []);

  const setHeightCm = useCallback((cm: number) => {
    setState(prev => ({ ...prev, heightCm: cm }));
  }, []);

  const setHeightUnit = useCallback((unit: HeightUnit) => {
    setState(prev => {
      if (prev.heightUnit !== unit) {
        if (unit === 'cm') {
          // Convert ft/in to cm
          const totalInches = prev.heightFt * 12 + prev.heightIn;
          return { ...prev, heightUnit: unit, heightCm: Math.round(totalInches * 2.54) };
        } else {
          // Convert cm to ft/in
          const totalInches = prev.heightCm / 2.54;
          return {
            ...prev,
            heightUnit: unit,
            heightFt: Math.floor(totalInches / 12),
            heightIn: Math.round(totalInches % 12),
          };
        }
      }
      return prev;
    });
  }, []);

  const setAge = useCallback((age: number) => {
    setState(prev => ({ ...prev, age }));
  }, []);

  const setSex = useCallback((sex: Sex) => {
    setState(prev => ({ ...prev, sex }));
  }, []);

  const setStartDate = useCallback((date: string | null) => {
    setState(prev => ({ ...prev, startDate: date }));
  }, []);

  const setTargetDate = useCallback((date: string | null) => {
    setState(prev => ({ ...prev, targetDate: date }));
  }, []);

  // Step 3 setters
  const setActivityLevel = useCallback((level: ActivityLevel) => {
    setState(prev => ({ ...prev, activityLevel: level }));
  }, []);

  const setWorkoutsPerWeek = useCallback((count: number) => {
    setState(prev => ({ ...prev, workoutsPerWeek: count }));
  }, []);

  const setWorkoutDuration = useCallback((duration: 15 | 30 | 45 | 60) => {
    setState(prev => ({ ...prev, workoutDuration: duration }));
  }, []);

  const setCardioPreference = useCallback((preference: CardioPreference) => {
    console.log('[GoalWizard] Setting cardio preference to:', preference);
    setState(prev => ({ ...prev, cardioPreference: preference }));
  }, []);

  const setFitnessLevel = useCallback((level: FitnessLevel) => {
    console.log('[GoalWizard] Setting fitness level to:', level);
    setState(prev => ({ ...prev, fitnessLevel: level }));
  }, []);

  // Step 3c: Strength Baseline setters
  const setHasLiftingExperience = useCallback((hasExperience: boolean) => {
    console.log('[GoalWizard] Setting lifting experience to:', hasExperience);
    setState(prev => ({
      ...prev,
      hasLiftingExperience: hasExperience,
      // Reset strength data if user has no experience
      ...(hasExperience ? {} : {
        strengthLevel: 'never_lifted',
        benchPress1RM: null,
        squat1RM: null,
        deadlift1RM: null,
      }),
    }));
  }, []);

  const setStrengthLevel = useCallback((level: StrengthLevel) => {
    console.log('[GoalWizard] Setting strength level to:', level);
    setState(prev => ({ ...prev, strengthLevel: level }));
  }, []);

  const setBenchPress1RM = useCallback((weight: number | null) => {
    setState(prev => ({ ...prev, benchPress1RM: weight }));
  }, []);

  const setSquat1RM = useCallback((weight: number | null) => {
    setState(prev => ({ ...prev, squat1RM: weight }));
  }, []);

  const setDeadlift1RM = useCallback((weight: number | null) => {
    setState(prev => ({ ...prev, deadlift1RM: weight }));
  }, []);

  // Step 4 setters
  const setDietStyle = useCallback((style: DietStyle) => {
    setState(prev => ({ ...prev, dietStyle: style }));
  }, []);

  const setMealsPerDay = useCallback((meals: number) => {
    setState(prev => ({ ...prev, mealsPerDay: meals }));
  }, []);

  const setIntermittentFasting = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, intermittentFasting: enabled }));
  }, []);

  const setFastingWindow = useCallback((start: string, end: string) => {
    setState(prev => ({ ...prev, fastingStart: start, fastingEnd: end }));
  }, []);

  const toggleAllergy = useCallback((allergy: string) => {
    setState(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  }, []);

  const toggleEquipment = useCallback((equipment: string) => {
    setState(prev => ({
      ...prev,
      availableEquipment: prev.availableEquipment.includes(equipment)
        ? prev.availableEquipment.filter(e => e !== equipment)
        : [...prev.availableEquipment, equipment],
    }));
  }, []);

  const toggleInjury = useCallback((injury: string) => {
    setState(prev => ({
      ...prev,
      injuries: prev.injuries.includes(injury)
        ? prev.injuries.filter(i => i !== injury)
        : [...prev.injuries, injury],
    }));
  }, []);

  // Daily Goals setters
  const setWaterGoalOz = useCallback((oz: number) => {
    setState(prev => ({ ...prev, waterGoalOz: oz }));
  }, []);

  const setSleepGoalHours = useCallback((hours: number) => {
    setState(prev => ({ ...prev, sleepGoalHours: hours }));
  }, []);

  const setStepGoal = useCallback((steps: number) => {
    setState(prev => ({ ...prev, stepGoal: steps }));
  }, []);

  const setSelectedProgram = useCallback((programId: string, programName: string) => {
    setState(prev => ({ ...prev, selectedProgramId: programId, selectedProgramName: programName }));
  }, []);

  // Calculate results - using a ref to avoid infinite loops
  const calculateResults = useCallback(() => {
    setState(prev => {
      const height = getHeightInFtIn(prev);
      const weightLbs = getWeightInLbs(prev.currentWeight, prev.weightUnit);
      const targetLbs = getWeightInLbs(prev.targetWeight, prev.weightUnit);
      const goalType = getGoalType(prev.primaryGoal);

      // Use user-specified start date or today
      const startDate = prev.startDate ? new Date(prev.startDate) : new Date();
      let endDate: Date;

      if (prev.targetDate) {
        endDate = new Date(prev.targetDate);
      } else {
        endDate = new Date(startDate);
        if (goalType === 'lose') {
          // Assume 1 lb/week loss rate
          const lbsToLose = weightLbs - targetLbs;
          endDate.setDate(endDate.getDate() + Math.ceil(lbsToLose * 7));
        } else if (goalType === 'gain') {
          // Assume 0.5 lb/week gain rate
          const lbsToGain = targetLbs - weightLbs;
          endDate.setDate(endDate.getDate() + Math.ceil(lbsToGain * 14));
        } else {
          endDate.setDate(endDate.getDate() + 84); // 12 weeks for maintenance
        }
      }

      const profile = {
        age: prev.age,
        sex: prev.sex,
        heightFt: height.ft,
        heightIn: height.inches,
        weight: weightLbs,
        targetWeight: targetLbs,
        activity: prev.activityLevel,
        goalType,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      const results = calculateGoals(profile);

      // Adjust macros based on diet style
      let adjustedResults = { ...results };

      switch (prev.dietStyle) {
        case 'keto':
          // Keto: 70% fat, 25% protein, 5% carbs
          adjustedResults.fat = Math.round((results.calories * 0.70) / 9);
          adjustedResults.protein = Math.round((results.calories * 0.25) / 4);
          adjustedResults.carbs = Math.round((results.calories * 0.05) / 4);
          break;
        case 'high_protein':
          // High protein: 40% protein, 30% carbs, 30% fat
          adjustedResults.protein = Math.round((results.calories * 0.40) / 4);
          adjustedResults.carbs = Math.round((results.calories * 0.30) / 4);
          adjustedResults.fat = Math.round((results.calories * 0.30) / 9);
          break;
        // Other diets use default calculation
      }

      return { ...prev, results: adjustedResults };
    });
  }, []);

  // Save goals to backend and AsyncStorage
  const saveGoals = useCallback(async (): Promise<boolean> => {
    if (!state.results) return false;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      // Save to AsyncStorage for local persistence first (always works)
      console.log('[GoalWizard] Saving goals to AsyncStorage with cardioPreference:', state.cardioPreference);
      const stateToSave = { ...state, isComplete: true };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

      // Calculate weights in kg for backend profile
      const currentWeightKg = state.weightUnit === 'kg'
        ? state.currentWeight
        : state.currentWeight * 0.453592;
      const targetWeightKg = state.weightUnit === 'kg'
        ? state.targetWeight
        : state.targetWeight * 0.453592;
      const heightCm = state.heightUnit === 'cm'
        ? state.heightCm
        : (state.heightFt * 12 + state.heightIn) * 2.54;

      // Save profile data to backend (includes targetWeight & targetDate for weight goal alignment)
      try {
        const profileSuccess = await api.updateProfile({
          heightCm,
          weightKg: currentWeightKg,
          age: state.age,
          sex: state.sex,
          activityLevel: state.activityLevel,
          goalType: state.primaryGoal === 'lose_weight' ? 'lose'
                   : state.primaryGoal === 'build_muscle' ? 'gain'
                   : 'maintain',
          targetWeightKg,
          targetDate: state.targetDate || undefined,
        });

        if (profileSuccess) {
          console.log('[GoalWizard] Profile synced to backend (including targetWeight & targetDate)');
        } else {
          console.warn('[GoalWizard] Profile sync failed - profile data saved locally only');
        }
      } catch (profileError) {
        console.warn('[GoalWizard] Profile sync error:', profileError);
      }

      // Save nutritional goals to backend
      const goalsToSave: any = {
        dailyCalories: state.results.calories,
        dailyProtein: state.results.protein,
        dailyCarbs: state.results.carbs,
        dailyFat: state.results.fat,
        dailySteps: state.stepGoal,
        dailyWaterOz: state.waterGoalOz,
        sleepHours: state.sleepGoalHours,
        workoutDaysPerWeek: state.workoutsPerWeek || 3,
      };

      console.log('[GoalWizard] Saving goals to API:', JSON.stringify(goalsToSave, null, 2));

      // Try to sync goals with backend
      let goalsSuccess = false;
      try {
        console.log('[GoalWizard] 🔄 Attempting to save goals to backend...');
        goalsSuccess = await api.updateGoals(goalsToSave);
        if (goalsSuccess) {
          console.log('[GoalWizard] ✅ Goals synced to backend successfully!');
        } else {
          console.warn('[GoalWizard] ❌ Goals sync failed - saved locally only');
        }
      } catch (apiError) {
        console.error('[GoalWizard] ❌ Goals sync error:', apiError);
      }

      // *** NEW: Save user preferences to backend (cardio, fitness level, diet, allergies, etc.) ***
      const preferencesToSave = {
        cardioPreference: state.cardioPreference,
        fitnessLevel: state.fitnessLevel,
        workoutDuration: state.workoutDuration,
        workoutsPerWeek: state.workoutsPerWeek,
        dietStyle: state.dietStyle,
        mealsPerDay: state.mealsPerDay,
        intermittentFasting: state.intermittentFasting,
        fastingStart: state.fastingStart,
        fastingEnd: state.fastingEnd,
        allergies: state.allergies,
        // Equipment and injuries for workout generation
        availableEquipment: state.availableEquipment,
        injuries: state.injuries,
        // Customizable daily goals
        waterGoalOz: state.waterGoalOz,
        sleepGoalHours: state.sleepGoalHours,
        stepGoal: state.stepGoal,
        // Strength baseline for training personalization
        hasLiftingExperience: state.hasLiftingExperience,
        strengthLevel: state.strengthLevel,
        benchPress1RM: state.benchPress1RM,
        squat1RM: state.squat1RM,
        deadlift1RM: state.deadlift1RM,
        // Selected training program from goal wizard
        selectedProgramId: state.selectedProgramId,
        selectedProgramName: state.selectedProgramName,
      };

      try {
        console.log('[GoalWizard] 🎯 Saving user preferences to backend...');
        console.log('[GoalWizard] 📋 Preferences payload:', JSON.stringify(preferencesToSave, null, 2));
        const prefsSuccess = await api.updatePreferences(preferencesToSave);
        if (prefsSuccess) {
          console.log('[GoalWizard] ✅ Preferences synced to backend successfully!');
          console.log('[GoalWizard] 💾 Saved preferences:', {
            cardioPreference: preferencesToSave.cardioPreference,
            fitnessLevel: preferencesToSave.fitnessLevel,
            dietStyle: preferencesToSave.dietStyle,
            allergies: preferencesToSave.allergies,
          });
        } else {
          console.warn('[GoalWizard] ❌ Preferences sync failed - saved locally only');
        }
      } catch (prefsError) {
        console.error('[GoalWizard] ❌ Preferences sync error:', prefsError);
      }

      // Always mark as complete since local storage succeeded
      setState(prev => ({ ...prev, isSaving: false, isComplete: true }));
      return true; // Return true since local save succeeded
    } catch (error) {
      console.error('[GoalWizard] Failed to save goals:', error);
      setState(prev => ({ ...prev, isSaving: false }));
      return false;
    }
  }, [state]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setState(initialState);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  // Load saved progress
  const loadSavedProgress = useCallback(async () => {
    try {
      // First, load from local storage
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Always restore saved data (both complete and incomplete)
        // This ensures goals are available throughout the app
        setState(prev => ({ ...prev, ...parsed }));
        console.log('[GoalWizard] Loaded saved progress from local storage:', {
          primaryGoal: parsed.primaryGoal,
          cardioPreference: parsed.cardioPreference,
          activityLevel: parsed.activityLevel,
          isComplete: parsed.isComplete
        });
      }

      // Then, try to load preferences from backend (will override local if available)
      try {
        console.log('[GoalWizard] 🔄 Fetching preferences from backend...');
        const backendPrefs = await api.getPreferences();
        if (backendPrefs) {
          console.log('[GoalWizard] ✅ Loaded preferences from backend:', backendPrefs);
          setState(prev => ({
            ...prev,
            cardioPreference: backendPrefs.cardioPreference || prev.cardioPreference,
            fitnessLevel: (backendPrefs.fitnessLevel as any) || prev.fitnessLevel,
            workoutDuration: (backendPrefs.workoutDuration as any) || prev.workoutDuration,
            workoutsPerWeek: backendPrefs.workoutsPerWeek || prev.workoutsPerWeek,
            dietStyle: (backendPrefs.dietStyle as any) || prev.dietStyle,
            mealsPerDay: backendPrefs.mealsPerDay || prev.mealsPerDay,
            intermittentFasting: backendPrefs.intermittentFasting ?? prev.intermittentFasting,
            fastingStart: backendPrefs.fastingStart || prev.fastingStart,
            fastingEnd: backendPrefs.fastingEnd || prev.fastingEnd,
            allergies: backendPrefs.allergies || prev.allergies,
            availableEquipment: backendPrefs.availableEquipment || prev.availableEquipment,
            injuries: backendPrefs.injuries || prev.injuries,
            // Strength baseline
            hasLiftingExperience: backendPrefs.hasLiftingExperience ?? prev.hasLiftingExperience,
            strengthLevel: (backendPrefs.strengthLevel as any) || prev.strengthLevel,
            benchPress1RM: backendPrefs.benchPress1RM ?? prev.benchPress1RM,
            squat1RM: backendPrefs.squat1RM ?? prev.squat1RM,
            deadlift1RM: backendPrefs.deadlift1RM ?? prev.deadlift1RM,
          }));
        }
      } catch (backendError) {
        console.warn('[GoalWizard] Could not fetch backend preferences (may not be authenticated):', backendError);
      }
    } catch (error) {
      console.error('[GoalWizard] Failed to load saved progress:', error);
    }
  }, []);

  // Load saved goals on mount
  useEffect(() => {
    console.log('[GoalWizard] Provider mounted, loading saved goals...');
    loadSavedProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-save progress on state change
  useEffect(() => {
    if (state.currentStep > 1 && !state.isComplete) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const value = useMemo<GoalWizardContextType>(() => ({
    state,
    nextStep,
    prevStep,
    goToStep,
    startEditing,
    setPrimaryGoal,
    setCurrentWeight,
    setTargetWeight,
    setWeightUnit,
    setHeightFt,
    setHeightIn,
    setHeightCm,
    setHeightUnit,
    setAge,
    setSex,
    setStartDate,
    setTargetDate,
    setActivityLevel,
    setWorkoutsPerWeek,
    setWorkoutDuration,
    setCardioPreference,
    setFitnessLevel,
    setHasLiftingExperience,
    setStrengthLevel,
    setBenchPress1RM,
    setSquat1RM,
    setDeadlift1RM,
    setDietStyle,
    setMealsPerDay,
    setIntermittentFasting,
    setFastingWindow,
    toggleAllergy,
    toggleEquipment,
    toggleInjury,
    setWaterGoalOz,
    setSleepGoalHours,
    setStepGoal,
    setSelectedProgram,
    calculateResults,
    saveGoals,
    resetWizard,
    loadSavedProgress,
  }), [
    state,
    nextStep,
    prevStep,
    goToStep,
    startEditing,
    setPrimaryGoal,
    setCurrentWeight,
    setTargetWeight,
    setWeightUnit,
    setHeightFt,
    setHeightIn,
    setHeightCm,
    setHeightUnit,
    setAge,
    setSex,
    setStartDate,
    setTargetDate,
    setActivityLevel,
    setWorkoutsPerWeek,
    setWorkoutDuration,
    setCardioPreference,
    setFitnessLevel,
    setHasLiftingExperience,
    setStrengthLevel,
    setBenchPress1RM,
    setSquat1RM,
    setDeadlift1RM,
    setDietStyle,
    setMealsPerDay,
    setIntermittentFasting,
    setFastingWindow,
    toggleAllergy,
    toggleEquipment,
    toggleInjury,
    setWaterGoalOz,
    setSleepGoalHours,
    setStepGoal,
    setSelectedProgram,
    calculateResults,
    saveGoals,
    resetWizard,
    loadSavedProgress,
  ]);

  return (
    <GoalWizardContext.Provider value={value}>
      {children}
    </GoalWizardContext.Provider>
  );
}

export function useGoalWizard() {
  const context = useContext(GoalWizardContext);
  if (!context) {
    throw new Error('useGoalWizard must be used within a GoalWizardProvider');
  }
  return context;
}
