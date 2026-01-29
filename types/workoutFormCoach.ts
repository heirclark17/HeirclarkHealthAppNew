/**
 * Workout Form Coach Agent Types
 * Provides exercise form tips, technique guidance, and common mistake tracking
 */

// Exercise categories
export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'core'
  | 'glutes'
  | 'compound'
  | 'cardio';

// Difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Form cue for an exercise
export interface FormCue {
  id: string;
  order: number;
  cue: string;
  muscleActivation?: string;
  breathingTip?: string;
}

// Common mistake for an exercise
export interface CommonMistake {
  id: string;
  mistake: string;
  consequence: string;
  correction: string;
  severity: 'minor' | 'moderate' | 'serious';
}

// Exercise definition
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  musclesWorked: string[];
  equipment: string[];
  difficulty: DifficultyLevel;
  description: string;
  formCues: FormCue[];
  commonMistakes: CommonMistake[];
  variations: string[];
  alternatives: string[];
  videoUrl?: string;
  imageUrl?: string;
}

// User's exercise history for personalization
export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  lastPerformed: string; // ISO date
  timesPerformed: number;
  personalBest: {
    weight?: number;
    reps?: number;
    time?: number; // seconds
  };
  notes: string[];
  formIssuesNoted: string[];
}

// Form check result
export interface FormCheckResult {
  exerciseId: string;
  exerciseName: string;
  timestamp: number;
  overallScore: number; // 0-100
  cuesFollowed: string[];
  mistakesIdentified: string[];
  personalizedTips: string[];
}

// Daily form tip
export interface DailyFormTip {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  tip: string;
  category: ExerciseCategory;
  seen: boolean;
}

// Coaching session for an exercise
export interface CoachingSession {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  duration: number; // seconds
  setsCompleted: number;
  formScore: number;
  cuesReviewed: string[];
  mistakesCorrected: string[];
  notes: string;
}

// Workout Form Coach state
export interface WorkoutFormCoachState {
  exercises: Exercise[];
  exerciseHistory: ExerciseHistory[];
  recentFormChecks: FormCheckResult[];
  dailyTip: DailyFormTip | null;
  coachingSessions: CoachingSession[];
  favoriteExercises: string[]; // exercise IDs
  isLoading: boolean;
  lastUpdated: number;
}

// Constants
export const FORM_COACH_CONSTANTS = {
  MAX_HISTORY_DAYS: 90,
  MAX_FORM_CHECKS: 50,
  MAX_COACHING_SESSIONS: 100,
  TIP_REFRESH_HOURS: 24,
};

// Default exercises database
export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'bench_press',
    name: 'Barbell Bench Press',
    category: 'chest',
    musclesWorked: ['Chest', 'Front Deltoids', 'Triceps'],
    equipment: ['Barbell', 'Bench'],
    difficulty: 'intermediate',
    description: 'A fundamental compound exercise for building chest strength and size.',
    formCues: [
      { id: 'bp1', order: 1, cue: 'Plant feet firmly on the floor', muscleActivation: 'Leg drive for stability' },
      { id: 'bp2', order: 2, cue: 'Squeeze shoulder blades together', muscleActivation: 'Creates stable base' },
      { id: 'bp3', order: 3, cue: 'Grip bar slightly wider than shoulder width' },
      { id: 'bp4', order: 4, cue: 'Lower bar to mid-chest level', breathingTip: 'Inhale on the way down' },
      { id: 'bp5', order: 5, cue: 'Drive through heels and press up', breathingTip: 'Exhale on the way up' },
      { id: 'bp6', order: 6, cue: 'Keep wrists straight and elbows at 45-75 degrees' },
    ],
    commonMistakes: [
      { id: 'bpm1', mistake: 'Flaring elbows to 90 degrees', consequence: 'Shoulder strain and injury risk', correction: 'Keep elbows at 45-75 degree angle', severity: 'serious' },
      { id: 'bpm2', mistake: 'Bouncing bar off chest', consequence: 'Reduces muscle engagement', correction: 'Pause briefly at chest', severity: 'moderate' },
      { id: 'bpm3', mistake: 'Lifting hips off bench', consequence: 'Lower back strain', correction: 'Keep glutes pressed into bench', severity: 'moderate' },
      { id: 'bpm4', mistake: 'Uneven bar path', consequence: 'Muscle imbalances', correction: 'Focus on straight vertical path', severity: 'minor' },
    ],
    variations: ['Incline Bench Press', 'Decline Bench Press', 'Close Grip Bench Press'],
    alternatives: ['Dumbbell Bench Press', 'Push-ups', 'Machine Chest Press'],
  },
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    category: 'legs',
    musclesWorked: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    equipment: ['Barbell', 'Squat Rack'],
    difficulty: 'intermediate',
    description: 'The king of all exercises for building lower body strength.',
    formCues: [
      { id: 'sq1', order: 1, cue: 'Position bar on upper traps, not neck', muscleActivation: 'Creates shelf with traps' },
      { id: 'sq2', order: 2, cue: 'Stance slightly wider than shoulder width' },
      { id: 'sq3', order: 3, cue: 'Toes pointed slightly outward (15-30 degrees)' },
      { id: 'sq4', order: 4, cue: 'Brace core like expecting a punch', muscleActivation: 'Protects spine' },
      { id: 'sq5', order: 5, cue: 'Break at hips and knees simultaneously', breathingTip: 'Big breath before descent' },
      { id: 'sq6', order: 6, cue: 'Descend until hip crease below knee' },
      { id: 'sq7', order: 7, cue: 'Drive through whole foot, not just heels', breathingTip: 'Exhale as you stand' },
      { id: 'sq8', order: 8, cue: 'Keep chest up and back neutral' },
    ],
    commonMistakes: [
      { id: 'sqm1', mistake: 'Knees caving inward', consequence: 'Knee injury risk', correction: 'Push knees out over toes', severity: 'serious' },
      { id: 'sqm2', mistake: 'Excessive forward lean', consequence: 'Lower back strain', correction: 'Keep chest up, core tight', severity: 'moderate' },
      { id: 'sqm3', mistake: 'Heels coming off floor', consequence: 'Balance issues, reduced power', correction: 'Work on ankle mobility', severity: 'moderate' },
      { id: 'sqm4', mistake: 'Not hitting depth', consequence: 'Reduced muscle activation', correction: 'Hip crease below knee level', severity: 'minor' },
    ],
    variations: ['Front Squat', 'Box Squat', 'Pause Squat', 'High Bar Squat'],
    alternatives: ['Leg Press', 'Goblet Squat', 'Bulgarian Split Squat'],
  },
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    category: 'compound',
    musclesWorked: ['Back', 'Glutes', 'Hamstrings', 'Core', 'Grip'],
    equipment: ['Barbell'],
    difficulty: 'intermediate',
    description: 'Full body posterior chain exercise for building overall strength.',
    formCues: [
      { id: 'dl1', order: 1, cue: 'Feet hip-width apart, bar over mid-foot' },
      { id: 'dl2', order: 2, cue: 'Grip bar just outside legs', muscleActivation: 'Mixed or double overhand grip' },
      { id: 'dl3', order: 3, cue: 'Shoulders slightly in front of bar' },
      { id: 'dl4', order: 4, cue: 'Take slack out of bar before lifting', breathingTip: 'Big breath, brace core' },
      { id: 'dl5', order: 5, cue: 'Push floor away with legs to initiate' },
      { id: 'dl6', order: 6, cue: 'Keep bar close to body (drag up legs)' },
      { id: 'dl7', order: 7, cue: 'Lockout with hips, not lower back', breathingTip: 'Exhale at top' },
      { id: 'dl8', order: 8, cue: 'Control descent, hinge at hips first' },
    ],
    commonMistakes: [
      { id: 'dlm1', mistake: 'Rounding lower back', consequence: 'Serious injury risk', correction: 'Keep neutral spine throughout', severity: 'serious' },
      { id: 'dlm2', mistake: 'Bar drifting away from body', consequence: 'Lower back strain', correction: 'Drag bar up legs', severity: 'serious' },
      { id: 'dlm3', mistake: 'Jerking the weight up', consequence: 'Bicep tear risk', correction: 'Take slack out first, smooth pull', severity: 'serious' },
      { id: 'dlm4', mistake: 'Hyperextending at lockout', consequence: 'Lower back compression', correction: 'Stand tall, squeeze glutes', severity: 'moderate' },
    ],
    variations: ['Sumo Deadlift', 'Romanian Deadlift', 'Trap Bar Deadlift'],
    alternatives: ['Hip Hinge', 'Good Mornings', 'Rack Pulls'],
  },
  {
    id: 'pullup',
    name: 'Pull-up',
    category: 'back',
    musclesWorked: ['Lats', 'Biceps', 'Rear Deltoids', 'Core'],
    equipment: ['Pull-up Bar'],
    difficulty: 'intermediate',
    description: 'Fundamental bodyweight exercise for back development.',
    formCues: [
      { id: 'pu1', order: 1, cue: 'Grip slightly wider than shoulder width' },
      { id: 'pu2', order: 2, cue: 'Start from dead hang, shoulders engaged' },
      { id: 'pu3', order: 3, cue: 'Initiate by pulling shoulder blades down', muscleActivation: 'Activate lats first' },
      { id: 'pu4', order: 4, cue: 'Drive elbows down toward hips', breathingTip: 'Exhale as you pull up' },
      { id: 'pu5', order: 5, cue: 'Pull until chin clears bar' },
      { id: 'pu6', order: 6, cue: 'Control the descent', breathingTip: 'Inhale on the way down' },
    ],
    commonMistakes: [
      { id: 'pum1', mistake: 'Kipping or swinging', consequence: 'Reduces muscle engagement', correction: 'Use strict form', severity: 'minor' },
      { id: 'pum2', mistake: 'Not using full range', consequence: 'Limited muscle development', correction: 'Full dead hang to chin over bar', severity: 'moderate' },
      { id: 'pum3', mistake: 'Leading with chin', consequence: 'Neck strain', correction: 'Lead with chest to bar', severity: 'moderate' },
    ],
    variations: ['Chin-up', 'Wide Grip Pull-up', 'Neutral Grip Pull-up'],
    alternatives: ['Lat Pulldown', 'Assisted Pull-up Machine', 'Inverted Rows'],
  },
  {
    id: 'overhead_press',
    name: 'Overhead Press',
    category: 'shoulders',
    musclesWorked: ['Front Deltoids', 'Side Deltoids', 'Triceps', 'Core'],
    equipment: ['Barbell', 'Dumbbells'],
    difficulty: 'intermediate',
    description: 'Compound pressing movement for shoulder development.',
    formCues: [
      { id: 'op1', order: 1, cue: 'Start with bar at collarbone level' },
      { id: 'op2', order: 2, cue: 'Grip slightly wider than shoulder width' },
      { id: 'op3', order: 3, cue: 'Brace core, squeeze glutes', muscleActivation: 'Creates stable base' },
      { id: 'op4', order: 4, cue: 'Press bar in straight line overhead', breathingTip: 'Exhale as you press' },
      { id: 'op5', order: 5, cue: 'Move head back slightly as bar passes face' },
      { id: 'op6', order: 6, cue: 'Lockout with arms directly over shoulders' },
    ],
    commonMistakes: [
      { id: 'opm1', mistake: 'Excessive back arch', consequence: 'Lower back strain', correction: 'Keep core tight, ribs down', severity: 'serious' },
      { id: 'opm2', mistake: 'Pressing forward instead of up', consequence: 'Inefficient movement', correction: 'Bar path should be straight vertical', severity: 'moderate' },
      { id: 'opm3', mistake: 'Not locking out fully', consequence: 'Missing tricep engagement', correction: 'Full lockout overhead', severity: 'minor' },
    ],
    variations: ['Push Press', 'Seated Overhead Press', 'Arnold Press'],
    alternatives: ['Dumbbell Shoulder Press', 'Machine Shoulder Press', 'Landmine Press'],
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'core',
    musclesWorked: ['Rectus Abdominis', 'Transverse Abdominis', 'Obliques', 'Back'],
    equipment: ['None'],
    difficulty: 'beginner',
    description: 'Fundamental core stability exercise.',
    formCues: [
      { id: 'pl1', order: 1, cue: 'Forearms on ground, elbows under shoulders' },
      { id: 'pl2', order: 2, cue: 'Body forms straight line head to heels' },
      { id: 'pl3', order: 3, cue: 'Squeeze glutes and brace core', muscleActivation: 'Posterior pelvic tilt' },
      { id: 'pl4', order: 4, cue: 'Push forearms into ground', muscleActivation: 'Activate serratus anterior' },
      { id: 'pl5', order: 5, cue: 'Keep neck neutral, look at floor', breathingTip: 'Breathe steadily throughout' },
    ],
    commonMistakes: [
      { id: 'plm1', mistake: 'Hips sagging down', consequence: 'Lower back strain', correction: 'Squeeze glutes, tuck pelvis', severity: 'serious' },
      { id: 'plm2', mistake: 'Hips piking up', consequence: 'Reduces core engagement', correction: 'Lower hips to straight line', severity: 'moderate' },
      { id: 'plm3', mistake: 'Holding breath', consequence: 'Dizziness, reduced endurance', correction: 'Breathe steadily', severity: 'moderate' },
    ],
    variations: ['Side Plank', 'High Plank', 'Plank with Shoulder Tap'],
    alternatives: ['Dead Bug', 'Bird Dog', 'Hollow Body Hold'],
  },
];
