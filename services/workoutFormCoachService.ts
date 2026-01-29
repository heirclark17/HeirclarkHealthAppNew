/**
 * Workout Form Coach Service
 * Business logic for exercise form coaching and personalized tips
 */

import {
  Exercise,
  ExerciseHistory,
  FormCheckResult,
  DailyFormTip,
  CoachingSession,
  ExerciseCategory,
  DEFAULT_EXERCISES,
} from '../types/workoutFormCoach';

// ============ Exercise Lookup ============

/**
 * Get all exercises
 */
export function getAllExercises(): Exercise[] {
  return DEFAULT_EXERCISES;
}

/**
 * Get exercise by ID
 */
export function getExerciseById(exerciseId: string): Exercise | undefined {
  return DEFAULT_EXERCISES.find((e) => e.id === exerciseId);
}

/**
 * Get exercises by category
 */
export function getExercisesByCategory(category: ExerciseCategory): Exercise[] {
  return DEFAULT_EXERCISES.filter((e) => e.category === category);
}

/**
 * Search exercises by name
 */
export function searchExercises(query: string): Exercise[] {
  const lowerQuery = query.toLowerCase();
  return DEFAULT_EXERCISES.filter(
    (e) =>
      e.name.toLowerCase().includes(lowerQuery) ||
      e.musclesWorked.some((m) => m.toLowerCase().includes(lowerQuery)) ||
      e.category.toLowerCase().includes(lowerQuery)
  );
}

// ============ Form Check Generation ============

/**
 * Generate unique ID
 */
function generateId(): string {
  return `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a form check result
 */
export function createFormCheck(
  exercise: Exercise,
  cuesFollowed: string[],
  mistakesIdentified: string[],
  exerciseHistory?: ExerciseHistory
): FormCheckResult {
  // Calculate score based on cues followed and mistakes avoided
  const maxCues = exercise.formCues.length;
  const maxMistakes = exercise.commonMistakes.length;

  const cueScore = maxCues > 0 ? (cuesFollowed.length / maxCues) * 60 : 60;
  const mistakeScore = maxMistakes > 0
    ? ((maxMistakes - mistakesIdentified.length) / maxMistakes) * 40
    : 40;

  const overallScore = Math.round(cueScore + mistakeScore);

  // Generate personalized tips based on history and current performance
  const personalizedTips = generatePersonalizedTips(
    exercise,
    cuesFollowed,
    mistakesIdentified,
    exerciseHistory
  );

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    timestamp: Date.now(),
    overallScore,
    cuesFollowed,
    mistakesIdentified,
    personalizedTips,
  };
}

/**
 * Generate personalized tips based on history
 */
export function generatePersonalizedTips(
  exercise: Exercise,
  cuesFollowed: string[],
  mistakesIdentified: string[],
  history?: ExerciseHistory
): string[] {
  const tips: string[] = [];

  // Add tips for missed cues
  const missedCues = exercise.formCues.filter(
    (cue) => !cuesFollowed.includes(cue.id)
  );

  if (missedCues.length > 0) {
    const cue = missedCues[0];
    tips.push(`Focus on: ${cue.cue}`);
    if (cue.muscleActivation) {
      tips.push(`Why it matters: ${cue.muscleActivation}`);
    }
  }

  // Add correction tips for identified mistakes
  const mistakes = exercise.commonMistakes.filter((m) =>
    mistakesIdentified.includes(m.id)
  );

  for (const mistake of mistakes.slice(0, 2)) {
    tips.push(`Correction: ${mistake.correction}`);
  }

  // Add history-based tips
  if (history && history.formIssuesNoted.length > 0) {
    const recurringIssue = findRecurringIssue(history.formIssuesNoted, exercise);
    if (recurringIssue) {
      tips.push(`Recurring issue: ${recurringIssue}`);
    }
  }

  // Add breathing tip if not following
  const breathingCue = exercise.formCues.find((c) => c.breathingTip);
  if (breathingCue && !cuesFollowed.includes(breathingCue.id)) {
    tips.push(`Breathing: ${breathingCue.breathingTip}`);
  }

  return tips.slice(0, 4); // Max 4 tips
}

/**
 * Find recurring form issues from history
 */
function findRecurringIssue(issues: string[], exercise: Exercise): string | null {
  // Count occurrences of each mistake ID
  const counts: Record<string, number> = {};
  for (const issue of issues) {
    counts[issue] = (counts[issue] || 0) + 1;
  }

  // Find most common issue
  let maxCount = 0;
  let maxIssue = '';
  for (const [issue, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxIssue = issue;
    }
  }

  // Get the mistake details
  if (maxCount >= 2) {
    const mistake = exercise.commonMistakes.find((m) => m.id === maxIssue);
    if (mistake) {
      return `${mistake.mistake} - ${mistake.correction}`;
    }
  }

  return null;
}

// ============ Daily Tip Generation ============

/**
 * Generate a daily form tip
 */
export function generateDailyTip(
  exerciseHistory: ExerciseHistory[],
  favoriteExercises: string[]
): DailyFormTip {
  const today = new Date().toISOString().split('T')[0];

  // Prioritize exercises that need improvement or favorites
  let exercise: Exercise;

  // Check history for exercises with form issues
  const exercisesWithIssues = exerciseHistory
    .filter((h) => h.formIssuesNoted.length > 0)
    .sort((a, b) => b.formIssuesNoted.length - a.formIssuesNoted.length);

  if (exercisesWithIssues.length > 0) {
    const historyItem = exercisesWithIssues[0];
    exercise = getExerciseById(historyItem.exerciseId) || getRandomExercise();
  } else if (favoriteExercises.length > 0) {
    // Use a favorite exercise
    const favoriteId = favoriteExercises[Math.floor(Math.random() * favoriteExercises.length)];
    exercise = getExerciseById(favoriteId) || getRandomExercise();
  } else {
    // Random exercise
    exercise = getRandomExercise();
  }

  // Pick a random form cue as the tip
  const cueIndex = Math.floor(Math.random() * exercise.formCues.length);
  const cue = exercise.formCues[cueIndex];

  let tip = cue.cue;
  if (cue.muscleActivation) {
    tip += ` (${cue.muscleActivation})`;
  }

  return {
    id: generateId(),
    date: today,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    tip,
    category: exercise.category,
    seen: false,
  };
}

/**
 * Get a random exercise
 */
function getRandomExercise(): Exercise {
  const index = Math.floor(Math.random() * DEFAULT_EXERCISES.length);
  return DEFAULT_EXERCISES[index];
}

// ============ Coaching Session ============

/**
 * Create a coaching session
 */
export function createCoachingSession(
  exercise: Exercise,
  setsCompleted: number,
  formScore: number,
  cuesReviewed: string[],
  mistakesCorrected: string[],
  notes: string = ''
): CoachingSession {
  return {
    id: generateId(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    date: new Date().toISOString().split('T')[0],
    duration: 0, // Can be tracked if needed
    setsCompleted,
    formScore,
    cuesReviewed,
    mistakesCorrected,
    notes,
  };
}

// ============ Exercise Analysis ============

/**
 * Get form improvement suggestions for an exercise
 */
export function getImprovementSuggestions(
  exercise: Exercise,
  formChecks: FormCheckResult[]
): string[] {
  const suggestions: string[] = [];

  // Analyze recent form checks
  const recentChecks = formChecks.filter((c) => c.exerciseId === exercise.id).slice(0, 5);

  if (recentChecks.length === 0) {
    suggestions.push(`Start tracking your ${exercise.name} form to get personalized tips`);
    return suggestions;
  }

  // Calculate average score
  const avgScore =
    recentChecks.reduce((sum, c) => sum + c.overallScore, 0) / recentChecks.length;

  if (avgScore < 60) {
    suggestions.push('Focus on fundamentals - review all form cues before your next set');
  } else if (avgScore < 80) {
    suggestions.push('Good progress! Address the remaining issues one at a time');
  } else {
    suggestions.push('Excellent form! Consider adding weight or trying a variation');
  }

  // Find most common mistakes
  const mistakeCounts: Record<string, number> = {};
  for (const check of recentChecks) {
    for (const mistake of check.mistakesIdentified) {
      mistakeCounts[mistake] = (mistakeCounts[mistake] || 0) + 1;
    }
  }

  const sortedMistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]);
  if (sortedMistakes.length > 0) {
    const [mistakeId] = sortedMistakes[0];
    const mistake = exercise.commonMistakes.find((m) => m.id === mistakeId);
    if (mistake) {
      suggestions.push(`Common issue: ${mistake.correction}`);
    }
  }

  return suggestions;
}

/**
 * Get muscle activation cues for an exercise
 */
export function getMuscleActivationCues(exercise: Exercise): string[] {
  return exercise.formCues
    .filter((cue) => cue.muscleActivation)
    .map((cue) => `${cue.cue}: ${cue.muscleActivation}`);
}

/**
 * Get breathing pattern for an exercise
 */
export function getBreathingPattern(exercise: Exercise): string[] {
  return exercise.formCues
    .filter((cue) => cue.breathingTip)
    .map((cue) => cue.breathingTip!);
}

/**
 * Calculate average form score for an exercise
 */
export function calculateAverageFormScore(
  exerciseId: string,
  formChecks: FormCheckResult[]
): number | null {
  const checks = formChecks.filter((c) => c.exerciseId === exerciseId);
  if (checks.length === 0) return null;

  const sum = checks.reduce((acc, c) => acc + c.overallScore, 0);
  return Math.round(sum / checks.length);
}

/**
 * Get exercise recommendations based on history
 */
export function getExerciseRecommendations(
  exerciseHistory: ExerciseHistory[],
  favoriteExercises: string[]
): Exercise[] {
  const recommendations: Exercise[] = [];

  // Add exercises not tried yet
  const triedIds = new Set(exerciseHistory.map((h) => h.exerciseId));
  const newExercises = DEFAULT_EXERCISES.filter((e) => !triedIds.has(e.id));
  recommendations.push(...newExercises.slice(0, 2));

  // Add exercises that need form improvement
  const needsImprovement = exerciseHistory
    .filter((h) => h.formIssuesNoted.length > 0)
    .map((h) => getExerciseById(h.exerciseId))
    .filter((e): e is Exercise => e !== undefined);
  recommendations.push(...needsImprovement.slice(0, 2));

  // Add alternatives to favorites
  for (const favId of favoriteExercises.slice(0, 2)) {
    const fav = getExerciseById(favId);
    if (fav && fav.alternatives.length > 0) {
      const altName = fav.alternatives[0];
      const alt = DEFAULT_EXERCISES.find(
        (e) => e.name.toLowerCase() === altName.toLowerCase()
      );
      if (alt) {
        recommendations.push(alt);
      }
    }
  }

  // Remove duplicates
  const unique = recommendations.filter(
    (e, i, arr) => arr.findIndex((x) => x.id === e.id) === i
  );

  return unique.slice(0, 5);
}
