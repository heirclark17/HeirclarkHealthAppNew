// Export all context providers
export {
  GoalWizardProvider,
  useGoalWizard,
  type PrimaryGoal,
  type DietStyle,
  type WeightUnit,
  type HeightUnit,
  type WizardState,
} from './GoalWizardContext';

export {
  MealPlanProvider,
  useMealPlan,
  type MealPlanState,
} from './MealPlanContext';

export {
  TrainingProvider,
  useTraining,
} from './TrainingContext';

export {
  CustomWorkoutProvider,
  useCustomWorkout,
  type Exercise,
  type WorkoutDay,
  type WorkoutStructure,
  type CustomWorkout,
} from './CustomWorkoutContext';

export {
  SettingsProvider,
  useSettings,
  type SettingsState,
  type UnitSystem,
  type ThemeMode,
} from './SettingsContext';

export {
  FastingTimerProvider,
  useFastingTimer,
  FASTING_PRESETS,
  type FastingTimerState,
  type FastingState,
  type FastingPresetId,
} from './FastingTimerContext';

export {
  WorkoutTrackingProvider,
  useWorkoutTracking,
  type WorkoutTrackingState,
  type WorkoutLog,
} from './WorkoutTrackingContext';

export {
  AdaptiveTDEEProvider,
  useAdaptiveTDEE,
} from './AdaptiveTDEEContext';

export {
  SmartMealLoggerProvider,
  useSmartMealLogger,
} from './SmartMealLoggerContext';

export {
  CalorieBankingProvider,
  useCalorieBanking,
} from './CalorieBankingContext';

export {
  AccountabilityPartnerProvider,
  useAccountabilityPartner,
} from './AccountabilityPartnerContext';

export {
  ProgressPredictionProvider,
  useProgressPrediction,
} from './ProgressPredictionContext';

export {
  WorkoutFormCoachProvider,
  useWorkoutFormCoach,
} from './WorkoutFormCoachContext';

export {
  HabitFormationProvider,
  useHabitFormation,
} from './HabitFormationContext';

export {
  RestaurantMenuProvider,
  useRestaurantMenu,
} from './RestaurantMenuContext';

export {
  SleepRecoveryProvider,
  useSleepRecovery,
} from './SleepRecoveryContext';

export {
  HydrationProvider,
  useHydration,
} from './HydrationContext';

export {
  FoodPreferencesProvider,
  useFoodPreferences,
  useFoodPreferencesSafe,
  type FoodPreferences,
} from './FoodPreferencesContext';
