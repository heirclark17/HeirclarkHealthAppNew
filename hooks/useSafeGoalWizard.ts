import { useGoalWizard, WizardState } from '../contexts/GoalWizardContext';

/**
 * Safe wrapper for useGoalWizard that handles context unavailability gracefully.
 * Returns null state instead of throwing when the GoalWizardProvider is not available.
 */
export function useSafeGoalWizard(): { state: WizardState | null; goToStep: ((step: number) => void) | null } {
  try {
    const { state, goToStep } = useGoalWizard();
    return { state, goToStep };
  } catch (e) {
    // Context not available - return null state
    return { state: null, goToStep: null };
  }
}
