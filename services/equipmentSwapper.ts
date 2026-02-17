// Equipment Swapper Service
// Handles single-exercise, day-level, and program-level equipment switching

import {
  WorkoutExercise,
  ExerciseAlternative,
  Equipment,
  TrainingDay,
  Workout,
} from '../types/training';

export interface SwapResult {
  exerciseId: string;
  originalName: string;
  swappedTo: ExerciseAlternative;
}

export interface DaySwapResult {
  updatedDay: TrainingDay;
  swaps: SwapResult[];
  warnings: string[];
}

// Equipment type labels for UI
export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbells: 'Dumbbells',
  dumbbell: 'Dumbbells',
  bodyweight: 'Bodyweight',
  cable_machine: 'Cable Machine',
  cable: 'Cable Machine',
  machine: 'Machine',
  resistance_bands: 'Resistance Bands',
  kettlebell: 'Kettlebell',
  smith_machine: 'Smith Machine',
  pull_up_bar: 'Pull-Up Bar',
  bench: 'Bench',
  squat_rack: 'Squat Rack',
  none: 'No Equipment',
  cardio_machine: 'Cardio Machine',
  ez_bar: 'EZ Bar',
  trap_bar: 'Trap Bar',
  medicine_ball: 'Medicine Ball',
  dip_station: 'Dip Station',
};

// Normalize equipment strings for matching
function normalizeEquipment(eq: string): string {
  const normalized = eq.toLowerCase().replace(/\s+/g, '_');
  // Map common variations
  if (normalized === 'dumbbell') return 'dumbbells';
  if (normalized === 'cable') return 'cable_machine';
  if (normalized === 'machine') return 'cable_machine';
  return normalized;
}

/**
 * Find the best alternative for a given exercise matching target equipment.
 * Prefers 'same' difficulty, then 'easier', then 'harder'.
 */
export function swapExerciseEquipment(
  exercise: WorkoutExercise,
  targetEquipment: string
): ExerciseAlternative | null {
  const alternatives = exercise.exercise.alternatives;
  if (!alternatives || alternatives.length === 0) return null;

  const target = normalizeEquipment(targetEquipment);

  // Find all alternatives matching the target equipment
  const matches = alternatives.filter(
    alt => normalizeEquipment(alt.equipment) === target
  );

  if (matches.length === 0) return null;

  // Prefer 'same' difficulty, then 'easier', then 'harder'
  const sameLevel = matches.find(m => m.difficultyModifier === 'same');
  if (sameLevel) return sameLevel;
  const easier = matches.find(m => m.difficultyModifier === 'easier');
  if (easier) return easier;
  return matches[0];
}

/**
 * Swap all exercises in a day to use target equipment where possible.
 * Returns the updated day and a list of what was swapped.
 */
export function swapDayEquipment(
  day: TrainingDay,
  targetEquipment: string
): DaySwapResult {
  if (!day.workout || day.isRestDay) {
    return {
      updatedDay: day,
      swaps: [],
      warnings: ['This is a rest day - no exercises to swap.'],
    };
  }

  const swaps: SwapResult[] = [];
  const warnings: string[] = [];

  const updatedExercises = day.workout.exercises.map(ex => {
    // Skip if already using target equipment
    if (normalizeEquipment(ex.exercise.equipment) === normalizeEquipment(targetEquipment)) {
      return ex;
    }

    const alt = swapExerciseEquipment(ex, targetEquipment);
    if (alt) {
      swaps.push({
        exerciseId: ex.id,
        originalName: ex.exercise.name,
        swappedTo: alt,
      });

      // Create updated exercise with alternative's info
      return {
        ...ex,
        exercise: {
          ...ex.exercise,
          name: alt.name,
          equipment: alt.equipment,
          // Preserve the original alternatives list so user can swap back
        },
      };
    } else {
      warnings.push(`No ${EQUIPMENT_LABELS[normalizeEquipment(targetEquipment)] || targetEquipment} alternative for "${ex.exercise.name}"`);
      return ex;
    }
  });

  const updatedDay: TrainingDay = {
    ...day,
    workout: {
      ...day.workout,
      exercises: updatedExercises,
    },
  };

  return { updatedDay, swaps, warnings };
}

/**
 * Group alternatives by equipment type for the modal display.
 */
export function groupAlternativesByEquipment(
  alternatives: ExerciseAlternative[]
): { equipment: string; label: string; alternatives: ExerciseAlternative[] }[] {
  const groups = new Map<string, ExerciseAlternative[]>();

  for (const alt of alternatives) {
    const key = normalizeEquipment(alt.equipment);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(alt);
  }

  // Sort groups: barbell, dumbbells, cable, machine, bodyweight, others
  const order = ['barbell', 'dumbbells', 'cable_machine', 'kettlebell', 'bodyweight', 'resistance_bands', 'smith_machine'];
  const sorted = Array.from(groups.entries()).sort(([a], [b]) => {
    const aIdx = order.indexOf(a);
    const bIdx = order.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return sorted.map(([equipment, alts]) => ({
    equipment,
    label: EQUIPMENT_LABELS[equipment] || equipment.replace(/_/g, ' '),
    alternatives: alts,
  }));
}

/**
 * Get available equipment types from a day's exercise alternatives.
 */
export function getAvailableEquipmentForDay(day: TrainingDay): string[] {
  if (!day.workout) return [];

  const equipmentSet = new Set<string>();
  for (const ex of day.workout.exercises) {
    if (ex.exercise.alternatives) {
      for (const alt of ex.exercise.alternatives) {
        equipmentSet.add(normalizeEquipment(alt.equipment));
      }
    }
  }

  return Array.from(equipmentSet);
}
