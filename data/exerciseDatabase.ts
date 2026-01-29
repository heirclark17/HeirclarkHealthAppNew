// Comprehensive Exercise Database with Equipment Variations
// Every primary exercise has 5-8 equipment alternatives

import {
  Exercise,
  ExerciseAlternative,
  MuscleGroup,
  ExerciseCategory,
  Equipment,
  DifficultyLevel,
} from '../types/training';

// Helper to create exercise alternatives
const createAlternative = (
  id: string,
  name: string,
  equipment: Equipment,
  difficultyModifier: 'easier' | 'same' | 'harder',
  muscleActivationNotes: string,
  whenToUse: string[],
  formCues?: string[]
): ExerciseAlternative => ({
  id,
  name,
  equipment,
  difficultyModifier,
  muscleActivationNotes,
  whenToUse,
  formCues,
});

// ==========================================
// CHEST EXERCISES
// ==========================================

export const BENCH_PRESS_ALTERNATIVES: ExerciseAlternative[] = [
  createAlternative(
    'bench-barbell',
    'Barbell Bench Press',
    'barbell',
    'same',
    'Maximum load capacity, full chest activation, triceps and front delts engaged',
    ['Full gym access', 'Strength training', 'Progressive overload focus'],
    ['Retract shoulder blades', 'Arch back slightly', 'Drive feet into floor']
  ),
  createAlternative(
    'bench-dumbbell',
    'Dumbbell Bench Press',
    'dumbbells',
    'same',
    'Greater ROM, addresses imbalances, deeper stretch at bottom',
    ['Home gym', 'Fixing strength imbalances', 'Shoulder issues with barbell'],
    ['Control the descent', 'Touch dumbbells at top', 'Keep wrists straight']
  ),
  createAlternative(
    'bench-machine',
    'Chest Press Machine',
    'cable_machine',
    'easier',
    'Fixed path reduces stabilization, safe to train to failure',
    ['Beginners', 'Training alone', 'Isolation focus', 'Injury prevention'],
    ['Adjust seat height', 'Keep back against pad', 'Full range of motion']
  ),
  createAlternative(
    'bench-pushup',
    'Push-Up',
    'bodyweight',
    'easier',
    'Functional pressing, core engagement, anywhere/anytime',
    ['No equipment', 'Traveling', 'Warm-up', 'Burnout sets'],
    ['Hands shoulder-width', 'Body in straight line', 'Chest to floor']
  ),
  createAlternative(
    'bench-band',
    'Resistance Band Chest Press',
    'resistance_bands',
    'easier',
    'Accommodating resistance, joint-friendly, constant tension',
    ['Home workout', 'Rehabilitation', 'Travel', 'Warm-up'],
    ['Anchor at chest height', 'Step forward for more resistance']
  ),
  createAlternative(
    'bench-cable',
    'Cable Chest Press',
    'cable_machine',
    'same',
    'Constant tension throughout ROM, unilateral option',
    ['Muscle building', 'Mind-muscle connection', 'Variety'],
    ['Set cables at chest height', 'Squeeze at contraction']
  ),
  createAlternative(
    'bench-smith',
    'Smith Machine Bench Press',
    'smith_machine',
    'easier',
    'Fixed bar path, safer for training alone, easier to bail',
    ['Training alone', 'Beginners', 'Focusing on chest isolation'],
    ['Position bench correctly', 'Unrack with rotation', 'Control descent']
  ),
  createAlternative(
    'bench-floor',
    'Floor Press',
    'barbell',
    'same',
    'Limited ROM protects shoulders, triceps emphasis',
    ['Shoulder issues', 'Triceps focus', 'No bench available'],
    ['Elbows touch floor each rep', 'Pause at bottom', 'Drive up explosively']
  ),
];

export const INCLINE_PRESS_ALTERNATIVES: ExerciseAlternative[] = [
  createAlternative(
    'incline-barbell',
    'Incline Barbell Press',
    'barbell',
    'same',
    'Upper chest emphasis, front delt involvement, heavy loading',
    ['Upper chest development', 'Strength focus'],
    ['30-45 degree angle', 'Touch upper chest', 'Keep elbows at 45 degrees']
  ),
  createAlternative(
    'incline-dumbbell',
    'Incline Dumbbell Press',
    'dumbbells',
    'same',
    'Better upper chest stretch, addresses imbalances',
    ['Muscle building', 'Home gym', 'Shoulder-friendly'],
    ['Control the negative', 'Squeeze at top', 'Full stretch at bottom']
  ),
  createAlternative(
    'incline-machine',
    'Incline Chest Press Machine',
    'cable_machine',
    'easier',
    'Fixed path, safe failure, upper chest isolation',
    ['Beginners', 'Training alone', 'High rep work'],
    ['Adjust seat for upper chest emphasis', 'Full ROM']
  ),
  createAlternative(
    'incline-pushup',
    'Decline Push-Up',
    'bodyweight',
    'same',
    'Upper chest focus with feet elevated, core engagement',
    ['No equipment', 'Progressive bodyweight training'],
    ['Feet on elevated surface', 'Hands wider than shoulders']
  ),
  createAlternative(
    'incline-cable',
    'Low-to-High Cable Fly',
    'cable_machine',
    'same',
    'Constant tension, upper chest squeeze, great pump',
    ['Finishing exercise', 'Mind-muscle connection'],
    ['Set cables at lowest position', 'Arc hands up and together']
  ),
  createAlternative(
    'incline-band',
    'Incline Band Press',
    'resistance_bands',
    'easier',
    'Accommodating resistance, joint-friendly',
    ['Home workout', 'Travel', 'Warm-up'],
    ['Anchor behind and below', 'Press up and forward']
  ),
];

// ==========================================
// BACK EXERCISES
// ==========================================

export const BARBELL_ROW_ALTERNATIVES: ExerciseAlternative[] = [
  createAlternative(
    'row-barbell',
    'Barbell Bent-Over Row',
    'barbell',
    'same',
    'Heavy loading, full back development, hip hinge practice',
    ['Strength training', 'Full back development', 'Compound movement'],
    ['Hinge at hips', 'Pull to lower chest', 'Squeeze shoulder blades']
  ),
  createAlternative(
    'row-dumbbell',
    'One-Arm Dumbbell Row',
    'dumbbells',
    'same',
    'Unilateral, better stretch, supports lower back',
    ['Fixing imbalances', 'Lower back issues', 'Home gym'],
    ['Support with opposite hand', 'Pull to hip', 'Full stretch at bottom']
  ),
  createAlternative(
    'row-cable',
    'Seated Cable Row',
    'cable_machine',
    'easier',
    'Constant tension, back supported, safe for beginners',
    ['Beginners', 'High rep work', 'Mind-muscle connection'],
    ['Sit tall', 'Pull to belly button', 'Squeeze and hold']
  ),
  createAlternative(
    'row-machine',
    'Chest-Supported Row Machine',
    'cable_machine',
    'easier',
    'Lower back fully supported, pure back isolation',
    ['Lower back issues', 'Isolation focus', 'Training to failure'],
    ['Chest against pad', 'Full ROM', 'Control the negative']
  ),
  createAlternative(
    'row-inverted',
    'Inverted Row',
    'bodyweight',
    'easier',
    'Bodyweight pulling, scalable difficulty, core engagement',
    ['Home workout', 'Beginners', 'Pull-up progression'],
    ['Body straight like plank', 'Pull chest to bar', 'Lower with control']
  ),
  createAlternative(
    'row-band',
    'Resistance Band Row',
    'resistance_bands',
    'easier',
    'Anywhere training, good for warm-up and burnout',
    ['Travel', 'Home workout', 'Warm-up', 'Rehabilitation'],
    ['Anchor at mid height', 'Pull to waist', 'Squeeze back muscles']
  ),
  createAlternative(
    'row-tbar',
    'T-Bar Row',
    'barbell',
    'same',
    'Neutral grip, easier on shoulders, heavy loading',
    ['Shoulder-friendly rowing', 'Thickness building'],
    ['Straddle the bar', 'Pull to chest', 'Keep back flat']
  ),
  createAlternative(
    'row-meadows',
    'Meadows Row',
    'barbell',
    'harder',
    'Unique angle, great lat stretch and contraction',
    ['Advanced training', 'Lat development'],
    ['Landmine setup', 'Pull across body', 'Full stretch']
  ),
];

export const PULLUP_ALTERNATIVES: ExerciseAlternative[] = [
  createAlternative(
    'pullup-standard',
    'Pull-Up',
    'pull_up_bar',
    'same',
    'King of back exercises, full lat development, grip strength',
    ['Full gym', 'Pull-up bar available', 'Bodyweight mastery'],
    ['Dead hang start', 'Pull until chin over bar', 'Control descent']
  ),
  createAlternative(
    'pullup-assisted',
    'Assisted Pull-Up Machine',
    'cable_machine',
    'easier',
    'Builds strength for full pull-ups, adjustable assistance',
    ['Beginners', 'Building up to pull-ups', 'High rep training'],
    ['Select appropriate weight', 'Full ROM', 'Gradual progression']
  ),
  createAlternative(
    'pullup-lat-pulldown',
    'Lat Pulldown',
    'cable_machine',
    'easier',
    'Similar movement pattern, adjustable weight, seated stability',
    ['Beginners', 'Can\'t do pull-ups yet', 'Hypertrophy focus'],
    ['Slight lean back', 'Pull to upper chest', 'Squeeze lats']
  ),
  createAlternative(
    'pullup-band-assisted',
    'Band-Assisted Pull-Up',
    'resistance_bands',
    'easier',
    'Progressive assistance, builds real pull-up strength',
    ['Working toward pull-ups', 'Home gym', 'Assistance when fatigued'],
    ['Loop band over bar', 'Step or kneel in band', 'Use less band over time']
  ),
  createAlternative(
    'pullup-negative',
    'Negative Pull-Up',
    'pull_up_bar',
    'same',
    'Eccentric overload, builds pulling strength fast',
    ['Can\'t do full pull-ups', 'Strength building'],
    ['Jump to top position', 'Lower slowly 3-5 seconds', 'Repeat']
  ),
  createAlternative(
    'pullup-chinup',
    'Chin-Up',
    'pull_up_bar',
    'same',
    'Supinated grip, more biceps, often easier than pull-ups',
    ['Biceps emphasis', 'Easier pulling variation', 'Beginner-friendly'],
    ['Palms facing you', 'Pull until chin over bar', 'Full hang at bottom']
  ),
  createAlternative(
    'pullup-neutral',
    'Neutral Grip Pull-Up',
    'pull_up_bar',
    'same',
    'Shoulder-friendly grip, balanced lat/bicep work',
    ['Shoulder issues', 'Wrist comfort', 'Variety'],
    ['Palms facing each other', 'Full ROM', 'Control the movement']
  ),
];

// ==========================================
// LEG EXERCISES
// ==========================================

export const SQUAT_ALTERNATIVES: ExerciseAlternative[] = [
  createAlternative(
    'squat-barbell-back',
    'Barbell Back Squat',
    'barbell',
    'same',
    'King of leg exercises, full lower body + core, maximum loading',
    ['Full gym', 'Strength focus', 'Overall development'],
    ['Bar on upper traps', 'Sit back and down', 'Knees track over toes', 'Drive through heels']
  ),
  createAlternative(
    'squat-barbell-front',
    'Front Squat',
    'barbell',
    'harder',
    'Quad emphasis, more upright torso, core intensive',
    ['Quad focus', 'Olympic lifting crossover', 'Upper back strength'],
    ['Elbows high', 'Sit straight down', 'Stay upright']
  ),
  createAlternative(
    'squat-goblet',
    'Goblet Squat',
    'dumbbells',
    'easier',
    'Great for learning squat pattern, self-correcting form',
    ['Beginners', 'Home gym', 'Mobility work', 'Warm-up'],
    ['Hold weight at chest', 'Elbows inside knees', 'Sit between legs']
  ),
  createAlternative(
    'squat-leg-press',
    'Leg Press',
    'cable_machine',
    'easier',
    'Back supported, heavy quad loading, adjustable foot position',
    ['Lower back issues', 'Quad isolation', 'High volume'],
    ['Feet shoulder width', 'Lower with control', 'Don\'t lock knees']
  ),
  createAlternative(
    'squat-hack',
    'Hack Squat Machine',
    'cable_machine',
    'easier',
    'Fixed path, quad focus, safe heavy loading',
    ['Quad development', 'Training alone', 'Back issues'],
    ['Shoulders under pads', 'Feet forward on platform', 'Full depth']
  ),
  createAlternative(
    'squat-bodyweight',
    'Bodyweight Squat',
    'bodyweight',
    'easier',
    'Fundamental movement, anywhere training, high reps',
    ['No equipment', 'Warm-up', 'Conditioning', 'Beginners'],
    ['Arms forward for balance', 'Full depth', 'Heels down']
  ),
  createAlternative(
    'squat-bulgarian',
    'Bulgarian Split Squat',
    'dumbbells',
    'harder',
    'Unilateral, balance challenge, huge quad stretch',
    ['Single leg work', 'Imbalance correction', 'Home gym'],
    ['Rear foot elevated', 'Torso upright', 'Front knee over toe']
  ),
  createAlternative(
    'squat-smith',
    'Smith Machine Squat',
    'smith_machine',
    'easier',
    'Fixed bar path, easier balance, safe for beginners',
    ['Beginners', 'Training alone', 'Rehab'],
    ['Feet slightly forward', 'Control descent', 'Full ROM']
  ),
];

export const DEADLIFT_ALTERNATIVES: ExerciseAlternative[] = [
  createAlternative(
    'deadlift-conventional',
    'Conventional Deadlift',
    'barbell',
    'same',
    'Ultimate posterior chain, full body strength, grip work',
    ['Strength training', 'Full gym', 'Overall development'],
    ['Hips hinge back', 'Bar close to body', 'Chest up', 'Lock out hips']
  ),
  createAlternative(
    'deadlift-sumo',
    'Sumo Deadlift',
    'barbell',
    'same',
    'Wider stance, shorter ROM, more quad involvement',
    ['Hip mobility', 'Quad emphasis', 'Different stimulus'],
    ['Wide stance', 'Toes out', 'Grip inside knees', 'Push floor away']
  ),
  createAlternative(
    'deadlift-romanian',
    'Romanian Deadlift',
    'barbell',
    'same',
    'Hamstring and glute focus, hip hinge pattern',
    ['Hamstring development', 'Hip hinge learning', 'Accessory work'],
    ['Slight knee bend', 'Push hips back', 'Feel hamstring stretch']
  ),
  createAlternative(
    'deadlift-dumbbell',
    'Dumbbell Romanian Deadlift',
    'dumbbells',
    'same',
    'Home gym friendly, unilateral option, good for beginners',
    ['Home gym', 'Beginners', 'Lighter loading'],
    ['Weights close to legs', 'Hinge at hips', 'Squeeze glutes at top']
  ),
  createAlternative(
    'deadlift-trap-bar',
    'Trap Bar Deadlift',
    'trap_bar',
    'easier',
    'Neutral grip, more quad involvement, beginner-friendly',
    ['Beginners', 'Back issues', 'Athletic training'],
    ['Stand in center', 'Grip handles', 'Drive through floor']
  ),
  createAlternative(
    'deadlift-kettlebell',
    'Kettlebell Deadlift',
    'kettlebell',
    'easier',
    'Learning tool, home gym option, lighter loads',
    ['Beginners', 'Home workout', 'Technique practice'],
    ['Straddle kettlebell', 'Hinge at hips', 'Keep back flat']
  ),
  createAlternative(
    'deadlift-single-leg',
    'Single Leg Romanian Deadlift',
    'dumbbells',
    'harder',
    'Unilateral, balance challenge, hamstring focus',
    ['Imbalance correction', 'Athletic training', 'Home gym'],
    ['Hinge on one leg', 'Back leg extends behind', 'Keep hips square']
  ),
  createAlternative(
    'deadlift-good-morning',
    'Good Morning',
    'barbell',
    'same',
    'Posterior chain, hamstring stretch, lower back strength',
    ['Accessory work', 'Hamstring focus', 'Powerlifting'],
    ['Bar on back', 'Slight knee bend', 'Hinge until parallel']
  ),
];

// ==========================================
// SHOULDER EXERCISES
// ==========================================

export const OVERHEAD_PRESS_ALTERNATIVES: ExerciseAlternative[] = [
  createAlternative(
    'ohp-barbell',
    'Barbell Overhead Press',
    'barbell',
    'same',
    'Maximum shoulder loading, full delt development, core stability',
    ['Strength focus', 'Full gym', 'Compound pressing'],
    ['Grip just outside shoulders', 'Press straight up', 'Lock out overhead']
  ),
  createAlternative(
    'ohp-dumbbell',
    'Dumbbell Shoulder Press',
    'dumbbells',
    'same',
    'Unilateral, greater ROM, addresses imbalances',
    ['Home gym', 'Shoulder health', 'Muscle building'],
    ['Start at shoulder height', 'Press up and slightly in', 'Control descent']
  ),
  createAlternative(
    'ohp-seated',
    'Seated Dumbbell Press',
    'dumbbells',
    'easier',
    'Back supported, isolates shoulders, easier to control',
    ['Shoulder isolation', 'Lower back issues', 'Beginners'],
    ['Back against pad', 'Elbows at 90 degrees', 'Full extension']
  ),
  createAlternative(
    'ohp-machine',
    'Shoulder Press Machine',
    'cable_machine',
    'easier',
    'Fixed path, safe for beginners, easy to train to failure',
    ['Beginners', 'Training alone', 'High rep work'],
    ['Adjust seat height', 'Grip handles', 'Full ROM']
  ),
  createAlternative(
    'ohp-arnold',
    'Arnold Press',
    'dumbbells',
    'same',
    'Rotation adds front delt emphasis, full shoulder activation',
    ['Muscle building', 'Front delt focus', 'Variety'],
    ['Start palms facing you', 'Rotate as you press', 'Palms forward at top']
  ),
  createAlternative(
    'ohp-pike',
    'Pike Push-Up',
    'bodyweight',
    'easier',
    'Bodyweight overhead pressing, core engagement',
    ['No equipment', 'Beginner overhead work', 'Travel'],
    ['Hips high', 'Head between arms', 'Touch head to floor']
  ),
  createAlternative(
    'ohp-landmine',
    'Landmine Press',
    'barbell',
    'same',
    'Shoulder-friendly angle, unilateral option',
    ['Shoulder issues', 'Athletic training', 'Variety'],
    ['Anchor one end', 'Press at angle', 'Full extension']
  ),
  createAlternative(
    'ohp-band',
    'Resistance Band Overhead Press',
    'resistance_bands',
    'easier',
    'Joint-friendly, accommodating resistance',
    ['Home workout', 'Travel', 'Warm-up', 'Rehabilitation'],
    ['Stand on band', 'Press overhead', 'Control the negative']
  ),
];

// ==========================================
// EXERCISE DATABASE
// ==========================================

export const EXERCISE_DATABASE: Exercise[] = [
  // CHEST - Primary
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 7,
    movementPattern: 'push',
    instructions: [
      'Lie on bench with eyes under bar',
      'Grip bar slightly wider than shoulders',
      'Unrack and position bar over chest',
      'Lower bar to mid-chest with control',
      'Press bar back up to starting position',
    ],
    tips: [
      'Keep shoulder blades retracted',
      'Maintain slight arch in lower back',
      'Drive feet into floor for stability',
    ],
    alternatives: BENCH_PRESS_ALTERNATIVES,
  },
  {
    id: 'incline-press',
    name: 'Incline Press',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
    movementPattern: 'push',
    instructions: [
      'Set bench to 30-45 degree angle',
      'Lie back with feet flat on floor',
      'Grip bar slightly wider than shoulders',
      'Lower to upper chest',
      'Press back to starting position',
    ],
    alternatives: INCLINE_PRESS_ALTERNATIVES,
  },

  // BACK - Primary
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    muscleGroups: ['back', 'biceps', 'core'],
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'core'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
    movementPattern: 'pull',
    instructions: [
      'Hinge at hips with slight knee bend',
      'Grip bar just outside knees',
      'Pull bar to lower chest/upper abs',
      'Squeeze shoulder blades at top',
      'Lower with control',
    ],
    alternatives: BARBELL_ROW_ALTERNATIVES,
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    muscleGroups: ['back', 'biceps', 'core'],
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'core'],
    category: 'compound',
    equipment: 'pull_up_bar',
    difficulty: 'intermediate',
    caloriesPerMinute: 8,
    movementPattern: 'pull',
    instructions: [
      'Hang from bar with overhand grip',
      'Pull yourself up until chin clears bar',
      'Lower with control to full hang',
    ],
    alternatives: PULLUP_ALTERNATIVES,
  },

  // LEGS - Primary
  {
    id: 'squat',
    name: 'Squat',
    muscleGroups: ['legs', 'glutes', 'core'],
    primaryMuscle: 'legs',
    secondaryMuscles: ['glutes', 'core'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 9,
    movementPattern: 'squat',
    instructions: [
      'Bar on upper traps, feet shoulder-width',
      'Brace core, sit back and down',
      'Descend until thighs parallel or below',
      'Drive through heels to stand',
    ],
    alternatives: SQUAT_ALTERNATIVES,
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscleGroups: ['back', 'legs', 'glutes', 'core'],
    primaryMuscle: 'back',
    secondaryMuscles: ['legs', 'glutes', 'core'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 10,
    movementPattern: 'hinge',
    instructions: [
      'Stand with feet hip-width, bar over mid-foot',
      'Hinge and grip bar just outside legs',
      'Flatten back, brace core',
      'Drive through floor, keeping bar close',
      'Lock out hips at top',
    ],
    alternatives: DEADLIFT_ALTERNATIVES,
  },

  // SHOULDERS - Primary
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscleGroups: ['shoulders', 'triceps', 'core'],
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps', 'core'],
    category: 'compound',
    equipment: 'barbell',
    difficulty: 'intermediate',
    caloriesPerMinute: 6,
    movementPattern: 'push',
    instructions: [
      'Grip bar just outside shoulders',
      'Bar rests on front delts',
      'Press straight up overhead',
      'Lock out arms at top',
      'Lower with control',
    ],
    alternatives: OVERHEAD_PRESS_ALTERNATIVES,
  },

  // ACCESSORY EXERCISES (with alternatives built in)
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    muscleGroups: ['shoulders'],
    primaryMuscle: 'shoulders',
    category: 'isolation',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
    instructions: ['Raise dumbbells to side until parallel with floor', 'Control the descent'],
    alternatives: [
      createAlternative('lat-raise-cable', 'Cable Lateral Raise', 'cable_machine', 'same', 'Constant tension', ['Better pump', 'Machine available']),
      createAlternative('lat-raise-band', 'Band Lateral Raise', 'resistance_bands', 'easier', 'Joint-friendly', ['Home workout', 'Warm-up']),
      createAlternative('lat-raise-machine', 'Lateral Raise Machine', 'cable_machine', 'easier', 'Fixed path', ['Beginners', 'Isolation']),
    ],
  },
  {
    id: 'bicep-curl',
    name: 'Bicep Curl',
    muscleGroups: ['biceps'],
    primaryMuscle: 'biceps',
    category: 'isolation',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
    instructions: ['Curl weights toward shoulders', 'Squeeze at top', 'Lower with control'],
    alternatives: [
      createAlternative('curl-barbell', 'Barbell Curl', 'barbell', 'same', 'Heavier loading', ['Strength focus']),
      createAlternative('curl-ez-bar', 'EZ Bar Curl', 'ez_bar', 'same', 'Wrist-friendly', ['Wrist issues']),
      createAlternative('curl-cable', 'Cable Curl', 'cable_machine', 'same', 'Constant tension', ['Pump focus']),
      createAlternative('curl-band', 'Band Curl', 'resistance_bands', 'easier', 'Anywhere training', ['Home', 'Travel']),
      createAlternative('curl-hammer', 'Hammer Curl', 'dumbbells', 'same', 'Forearm emphasis', ['Forearm development']),
    ],
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    muscleGroups: ['triceps'],
    primaryMuscle: 'triceps',
    category: 'isolation',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
    instructions: ['Push cable down until arms straight', 'Squeeze triceps', 'Control return'],
    alternatives: [
      createAlternative('tricep-dip', 'Tricep Dip', 'dip_station', 'harder', 'Compound movement', ['Strength focus']),
      createAlternative('tricep-overhead', 'Overhead Tricep Extension', 'dumbbells', 'same', 'Long head emphasis', ['Full development']),
      createAlternative('tricep-kickback', 'Tricep Kickback', 'dumbbells', 'easier', 'Isolation', ['Beginners']),
      createAlternative('tricep-band', 'Band Pushdown', 'resistance_bands', 'easier', 'Home training', ['No gym']),
      createAlternative('tricep-diamond', 'Diamond Push-Up', 'bodyweight', 'same', 'Bodyweight option', ['Home', 'Travel']),
    ],
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    muscleGroups: ['hamstrings'],
    primaryMuscle: 'hamstrings',
    category: 'isolation',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
    instructions: ['Curl weight toward glutes', 'Squeeze hamstrings', 'Lower with control'],
    alternatives: [
      createAlternative('leg-curl-nordic', 'Nordic Curl', 'bodyweight', 'harder', 'Intense eccentric', ['Advanced']),
      createAlternative('leg-curl-swiss', 'Swiss Ball Leg Curl', 'none', 'same', 'Core engagement', ['Home gym']),
      createAlternative('leg-curl-band', 'Band Leg Curl', 'resistance_bands', 'easier', 'Light resistance', ['Home', 'Travel']),
      createAlternative('leg-curl-rdl', 'Romanian Deadlift', 'dumbbells', 'same', 'Compound alternative', ['No machine']),
    ],
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    muscleGroups: ['quads'],
    primaryMuscle: 'quads',
    category: 'isolation',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
    instructions: ['Extend legs until straight', 'Squeeze quads at top', 'Lower with control'],
    alternatives: [
      createAlternative('leg-ext-sissy', 'Sissy Squat', 'bodyweight', 'harder', 'Intense quad stretch', ['Advanced']),
      createAlternative('leg-ext-spanish', 'Spanish Squat', 'resistance_bands', 'same', 'Knee-friendly', ['Knee issues']),
      createAlternative('leg-ext-wall', 'Wall Sit', 'bodyweight', 'easier', 'Isometric hold', ['Beginners', 'Home']),
    ],
  },
  {
    id: 'calf-raise',
    name: 'Calf Raise',
    muscleGroups: ['calves'],
    primaryMuscle: 'calves',
    category: 'isolation',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    caloriesPerMinute: 3,
    instructions: ['Rise onto toes', 'Squeeze calves at top', 'Lower with control'],
    alternatives: [
      createAlternative('calf-seated', 'Seated Calf Raise', 'cable_machine', 'same', 'Soleus focus', ['Full development']),
      createAlternative('calf-machine', 'Standing Calf Machine', 'cable_machine', 'same', 'Heavy loading', ['Strength']),
      createAlternative('calf-single', 'Single Leg Calf Raise', 'bodyweight', 'same', 'Unilateral', ['Imbalances']),
      createAlternative('calf-donkey', 'Donkey Calf Raise', 'bodyweight', 'same', 'Greater stretch', ['Variety']),
    ],
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    muscleGroups: ['shoulders', 'back'],
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    category: 'isolation',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
    instructions: ['Pull rope to face level', 'Spread hands apart', 'Squeeze rear delts'],
    alternatives: [
      createAlternative('face-band', 'Band Face Pull', 'resistance_bands', 'easier', 'Home training', ['No gym']),
      createAlternative('face-reverse-fly', 'Reverse Fly', 'dumbbells', 'same', 'Rear delt focus', ['Variety']),
      createAlternative('face-prone', 'Prone Y Raise', 'dumbbells', 'easier', 'Floor exercise', ['Home']),
    ],
  },

  // CORE EXERCISES
  {
    id: 'plank',
    name: 'Plank',
    muscleGroups: ['core'],
    primaryMuscle: 'core',
    category: 'isolation',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    caloriesPerMinute: 4,
    instructions: ['Hold push-up position on forearms', 'Keep body straight', 'Brace core'],
    alternatives: [
      createAlternative('plank-side', 'Side Plank', 'bodyweight', 'same', 'Oblique focus', ['Obliques']),
      createAlternative('plank-weighted', 'Weighted Plank', 'none', 'harder', 'Added resistance', ['Advanced']),
      createAlternative('plank-dead-bug', 'Dead Bug', 'bodyweight', 'easier', 'Core stability', ['Beginners', 'Back issues']),
    ],
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    muscleGroups: ['core'],
    primaryMuscle: 'core',
    category: 'isolation',
    equipment: 'cable_machine',
    difficulty: 'beginner',
    caloriesPerMinute: 5,
    instructions: ['Kneel at cable', 'Crunch down bringing elbows to thighs', 'Squeeze abs'],
    alternatives: [
      createAlternative('crunch-regular', 'Crunch', 'bodyweight', 'easier', 'Basic ab work', ['Beginners']),
      createAlternative('crunch-decline', 'Decline Crunch', 'bench', 'same', 'Increased ROM', ['Progression']),
      createAlternative('crunch-hanging', 'Hanging Leg Raise', 'pull_up_bar', 'harder', 'Lower ab focus', ['Advanced']),
    ],
  },
];

// Helper function to get exercise by ID
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find(ex => ex.id === id);
}

// Helper to get all alternatives for an exercise
export function getExerciseAlternatives(exerciseId: string): ExerciseAlternative[] {
  const exercise = getExerciseById(exerciseId);
  return exercise?.alternatives || [];
}

// Helper to filter exercises by equipment
export function getExercisesForEquipment(equipment: Equipment[]): Exercise[] {
  return EXERCISE_DATABASE.filter(ex => equipment.includes(ex.equipment));
}

// Helper to get exercises by muscle group
export function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Exercise[] {
  return EXERCISE_DATABASE.filter(ex => ex.muscleGroups.includes(muscleGroup));
}

export default EXERCISE_DATABASE;
