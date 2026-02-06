import { useGoalWizard, WizardState } from '../contexts/GoalWizardContext';

/**
 * Safe wrapper for useGoalWizard that handles context unavailability gracefully.
 * Returns null state instead of throwing when the GoalWizardProvider is not available.
 */
export function useSafeGoalWizard(): { state: WizardState | null } {
  try {
    const { state } = useGoalWizard();
    return { state };
  } catch (e) {
    // Context not available - return null state
    return { state: null };
  }
}
