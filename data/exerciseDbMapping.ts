/**
 * Exercise Name to ExerciseDB Mapping
 * Maps internal exercise names to ExerciseDB IDs and GIF URLs
 * Used to enrich exercises with animated form demonstrations
 */

export interface ExerciseDbMapping {
  id: string; // ExerciseDB ID
  gifUrl: string; // Animated GIF URL
  bodyPart: string;
  target: string;
  instructions: string[];
}

// Normalized exercise name lookup - handles variations in naming
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Comprehensive mapping of exercise names to ExerciseDB data
// Keys are normalized (lowercase, spaces) for flexible matching
export const EXERCISE_DB_MAPPING: Record<string, ExerciseDbMapping> = {
  // ==========================================
  // CHEST EXERCISES
  // ==========================================
  'bench press': {
    id: '0025',
    gifUrl: 'https://v2.exercisedb.io/image/0025.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Lie flat on a bench with feet flat on the floor.',
      'Grip the barbell slightly wider than shoulder-width.',
      'Unrack the bar and hold it above your chest.',
      'Lower the bar to mid-chest while keeping elbows at 45 degrees.',
      'Press the bar back up to starting position.',
      'Keep your back flat and core engaged throughout.',
    ],
  },
  'barbell bench press': {
    id: '0025',
    gifUrl: 'https://v2.exercisedb.io/image/0025.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Lie flat on a bench with feet flat on the floor.',
      'Grip the barbell slightly wider than shoulder-width.',
      'Unrack the bar and hold it above your chest.',
      'Lower the bar to mid-chest while keeping elbows at 45 degrees.',
      'Press the bar back up to starting position.',
      'Keep your back flat and core engaged throughout.',
    ],
  },
  'push ups': {
    id: '0662',
    gifUrl: 'https://v2.exercisedb.io/image/0662.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Start in a plank position with hands slightly wider than shoulders.',
      'Keep your body in a straight line from head to heels.',
      'Lower your chest toward the floor by bending elbows.',
      'Go down until chest nearly touches the ground.',
      'Push back up to starting position.',
      'Keep core tight throughout the movement.',
    ],
  },
  'push up': {
    id: '0662',
    gifUrl: 'https://v2.exercisedb.io/image/0662.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Start in a plank position with hands slightly wider than shoulders.',
      'Keep your body in a straight line from head to heels.',
      'Lower your chest toward the floor by bending elbows.',
      'Go down until chest nearly touches the ground.',
      'Push back up to starting position.',
      'Keep core tight throughout the movement.',
    ],
  },
  'dumbbell chest press': {
    id: '0289',
    gifUrl: 'https://v2.exercisedb.io/image/0289.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Lie on a flat bench holding dumbbells at chest level.',
      'Press dumbbells up until arms are fully extended.',
      'Lower dumbbells with control to chest level.',
      'Keep feet flat on the floor for stability.',
      'Maintain a slight arch in lower back.',
    ],
  },
  'dumbbell bench press': {
    id: '0289',
    gifUrl: 'https://v2.exercisedb.io/image/0289.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Lie on a flat bench holding dumbbells at chest level.',
      'Press dumbbells up until arms are fully extended.',
      'Lower dumbbells with control to chest level.',
      'Keep feet flat on the floor for stability.',
      'Maintain a slight arch in lower back.',
    ],
  },
  'incline dumbbell press': {
    id: '0227',
    gifUrl: 'https://v2.exercisedb.io/image/0227.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Set bench to 30-45 degree incline.',
      'Hold dumbbells at shoulder level.',
      'Press weights up until arms are extended.',
      'Lower with control to starting position.',
      'Focus on upper chest contraction.',
    ],
  },
  'incline press': {
    id: '0227',
    gifUrl: 'https://v2.exercisedb.io/image/0227.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Set bench to 30-45 degree incline.',
      'Hold dumbbells at shoulder level.',
      'Press weights up until arms are extended.',
      'Lower with control to starting position.',
      'Focus on upper chest contraction.',
    ],
  },
  'dumbbell fly': {
    id: '0251',
    gifUrl: 'https://v2.exercisedb.io/image/0251.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Lie on a flat bench with dumbbells above chest.',
      'Keep a slight bend in elbows throughout.',
      'Lower weights out to sides in an arc motion.',
      'Feel the stretch in your chest.',
      'Bring weights back together above chest.',
    ],
  },
  'chest fly': {
    id: '0251',
    gifUrl: 'https://v2.exercisedb.io/image/0251.gif',
    bodyPart: 'chest',
    target: 'pectorals',
    instructions: [
      'Lie on a flat bench with dumbbells above chest.',
      'Keep a slight bend in elbows throughout.',
      'Lower weights out to sides in an arc motion.',
      'Feel the stretch in your chest.',
      'Bring weights back together above chest.',
    ],
  },

  // ==========================================
  // BACK EXERCISES
  // ==========================================
  'pull ups': {
    id: '0652',
    gifUrl: 'https://v2.exercisedb.io/image/0652.gif',
    bodyPart: 'back',
    target: 'lats',
    instructions: [
      'Grip the bar slightly wider than shoulder-width.',
      'Hang with arms fully extended.',
      'Pull yourself up until chin is above the bar.',
      'Focus on driving elbows down toward hips.',
      'Lower with control to starting position.',
      'Avoid swinging or kipping.',
    ],
  },
  'pull up': {
    id: '0652',
    gifUrl: 'https://v2.exercisedb.io/image/0652.gif',
    bodyPart: 'back',
    target: 'lats',
    instructions: [
      'Grip the bar slightly wider than shoulder-width.',
      'Hang with arms fully extended.',
      'Pull yourself up until chin is above the bar.',
      'Focus on driving elbows down toward hips.',
      'Lower with control to starting position.',
      'Avoid swinging or kipping.',
    ],
  },
  'bent over rows': {
    id: '0027',
    gifUrl: 'https://v2.exercisedb.io/image/0027.gif',
    bodyPart: 'back',
    target: 'lats',
    instructions: [
      'Stand with feet hip-width apart, holding barbell.',
      'Hinge at hips until torso is nearly parallel to floor.',
      'Let the bar hang at arms length.',
      'Pull the bar to your lower chest/upper abs.',
      'Squeeze shoulder blades together at top.',
      'Lower with control and repeat.',
    ],
  },
  'barbell bent over row': {
    id: '0027',
    gifUrl: 'https://v2.exercisedb.io/image/0027.gif',
    bodyPart: 'back',
    target: 'lats',
    instructions: [
      'Stand with feet hip-width apart, holding barbell.',
      'Hinge at hips until torso is nearly parallel to floor.',
      'Let the bar hang at arms length.',
      'Pull the bar to your lower chest/upper abs.',
      'Squeeze shoulder blades together at top.',
      'Lower with control and repeat.',
    ],
  },
  'lat pulldown': {
    id: '0580',
    gifUrl: 'https://v2.exercisedb.io/image/0580.gif',
    bodyPart: 'back',
    target: 'lats',
    instructions: [
      'Sit at lat pulldown machine and grip bar wide.',
      'Lean back slightly and pull bar to upper chest.',
      'Focus on driving elbows down and back.',
      'Squeeze lats at the bottom of the movement.',
      'Control the weight back to starting position.',
    ],
  },
  'dumbbell rows': {
    id: '0293',
    gifUrl: 'https://v2.exercisedb.io/image/0293.gif',
    bodyPart: 'back',
    target: 'lats',
    instructions: [
      'Place one knee and hand on a bench for support.',
      'Hold dumbbell in opposite hand, arm hanging.',
      'Pull dumbbell up toward hip.',
      'Keep elbow close to body.',
      'Squeeze back muscles at top.',
      'Lower with control and repeat.',
    ],
  },
  'dumbbell row': {
    id: '0293',
    gifUrl: 'https://v2.exercisedb.io/image/0293.gif',
    bodyPart: 'back',
    target: 'lats',
    instructions: [
      'Place one knee and hand on a bench for support.',
      'Hold dumbbell in opposite hand, arm hanging.',
      'Pull dumbbell up toward hip.',
      'Keep elbow close to body.',
      'Squeeze back muscles at top.',
      'Lower with control and repeat.',
    ],
  },
  'seated cable row': {
    id: '0861',
    gifUrl: 'https://v2.exercisedb.io/image/0861.gif',
    bodyPart: 'back',
    target: 'lats',
    instructions: [
      'Sit at cable row machine with feet on platform.',
      'Grip handle with arms extended.',
      'Pull handle to your midsection.',
      'Keep back straight and chest up.',
      'Squeeze shoulder blades together.',
      'Extend arms with control.',
    ],
  },
  'deadlift': {
    id: '0017',
    gifUrl: 'https://v2.exercisedb.io/image/0017.gif',
    bodyPart: 'back',
    target: 'spine',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot.',
      'Bend at hips and knees to grip bar.',
      'Keep back flat and chest up.',
      'Drive through heels to stand up with the bar.',
      'Keep bar close to body throughout.',
      'Reverse the movement to lower the bar.',
    ],
  },
  'barbell deadlift': {
    id: '0017',
    gifUrl: 'https://v2.exercisedb.io/image/0017.gif',
    bodyPart: 'back',
    target: 'spine',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot.',
      'Bend at hips and knees to grip bar.',
      'Keep back flat and chest up.',
      'Drive through heels to stand up with the bar.',
      'Keep bar close to body throughout.',
      'Reverse the movement to lower the bar.',
    ],
  },

  // ==========================================
  // SHOULDER EXERCISES
  // ==========================================
  'shoulder press': {
    id: '0561',
    gifUrl: 'https://v2.exercisedb.io/image/0561.gif',
    bodyPart: 'shoulders',
    target: 'deltoids',
    instructions: [
      'Sit or stand holding dumbbells at shoulder level.',
      'Press weights overhead until arms are extended.',
      'Keep core tight throughout movement.',
      'Lower weights with control to shoulders.',
      'Avoid arching lower back excessively.',
    ],
  },
  'dumbbell shoulder press': {
    id: '0561',
    gifUrl: 'https://v2.exercisedb.io/image/0561.gif',
    bodyPart: 'shoulders',
    target: 'deltoids',
    instructions: [
      'Sit or stand holding dumbbells at shoulder level.',
      'Press weights overhead until arms are extended.',
      'Keep core tight throughout movement.',
      'Lower weights with control to shoulders.',
      'Avoid arching lower back excessively.',
    ],
  },
  'overhead press': {
    id: '0041',
    gifUrl: 'https://v2.exercisedb.io/image/0041.gif',
    bodyPart: 'shoulders',
    target: 'deltoids',
    instructions: [
      'Start with bar at shoulder level, grip slightly wider than shoulders.',
      'Press bar straight overhead.',
      'Lock out arms at the top.',
      'Move head back slightly as bar passes face.',
      'Lower with control to starting position.',
    ],
  },
  'barbell overhead press': {
    id: '0041',
    gifUrl: 'https://v2.exercisedb.io/image/0041.gif',
    bodyPart: 'shoulders',
    target: 'deltoids',
    instructions: [
      'Start with bar at shoulder level, grip slightly wider than shoulders.',
      'Press bar straight overhead.',
      'Lock out arms at the top.',
      'Move head back slightly as bar passes face.',
      'Lower with control to starting position.',
    ],
  },
  'lateral raises': {
    id: '0310',
    gifUrl: 'https://v2.exercisedb.io/image/0310.gif',
    bodyPart: 'shoulders',
    target: 'deltoids',
    instructions: [
      'Stand holding dumbbells at sides.',
      'Raise arms out to sides until parallel to floor.',
      'Keep a slight bend in elbows.',
      'Lead with elbows, not hands.',
      'Lower with control and repeat.',
    ],
  },
  'dumbbell lateral raise': {
    id: '0310',
    gifUrl: 'https://v2.exercisedb.io/image/0310.gif',
    bodyPart: 'shoulders',
    target: 'deltoids',
    instructions: [
      'Stand holding dumbbells at sides.',
      'Raise arms out to sides until parallel to floor.',
      'Keep a slight bend in elbows.',
      'Lead with elbows, not hands.',
      'Lower with control and repeat.',
    ],
  },
  'front raises': {
    id: '0306',
    gifUrl: 'https://v2.exercisedb.io/image/0306.gif',
    bodyPart: 'shoulders',
    target: 'deltoids',
    instructions: [
      'Stand holding dumbbells in front of thighs.',
      'Raise one or both arms forward to shoulder height.',
      'Keep arms straight or slightly bent.',
      'Lower with control and repeat.',
      'Avoid swinging or using momentum.',
    ],
  },
  'face pulls': {
    id: '0315',
    gifUrl: 'https://v2.exercisedb.io/image/0315.gif',
    bodyPart: 'shoulders',
    target: 'deltoids',
    instructions: [
      'Set cable at face height with rope attachment.',
      'Pull rope toward face, separating hands.',
      'Focus on rear delt and upper back squeeze.',
      'Keep elbows high throughout movement.',
      'Control the weight on the return.',
    ],
  },

  // ==========================================
  // LEG EXERCISES
  // ==========================================
  'squats': {
    id: '0043',
    gifUrl: 'https://v2.exercisedb.io/image/0043.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Position bar on upper back, feet shoulder-width apart.',
      'Brace core and begin descent by bending knees.',
      'Lower until thighs are parallel to floor or below.',
      'Keep chest up and knees tracking over toes.',
      'Drive through feet to stand back up.',
      'Keep back neutral throughout.',
    ],
  },
  'barbell squats': {
    id: '0043',
    gifUrl: 'https://v2.exercisedb.io/image/0043.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Position bar on upper back, feet shoulder-width apart.',
      'Brace core and begin descent by bending knees.',
      'Lower until thighs are parallel to floor or below.',
      'Keep chest up and knees tracking over toes.',
      'Drive through feet to stand back up.',
      'Keep back neutral throughout.',
    ],
  },
  'barbell squat': {
    id: '0043',
    gifUrl: 'https://v2.exercisedb.io/image/0043.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Position bar on upper back, feet shoulder-width apart.',
      'Brace core and begin descent by bending knees.',
      'Lower until thighs are parallel to floor or below.',
      'Keep chest up and knees tracking over toes.',
      'Drive through feet to stand back up.',
      'Keep back neutral throughout.',
    ],
  },
  'goblet squat': {
    id: '0388',
    gifUrl: 'https://v2.exercisedb.io/image/0388.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Hold dumbbell vertically at chest level.',
      'Stand with feet wider than shoulder-width.',
      'Squat down keeping chest up.',
      'Keep weight in heels and mid-foot.',
      'Push knees out over toes.',
      'Stand by driving through floor.',
    ],
  },
  'leg press': {
    id: '0594',
    gifUrl: 'https://v2.exercisedb.io/image/0594.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Sit in leg press machine with back flat against pad.',
      'Place feet hip-width apart on platform.',
      'Release safety and lower weight by bending knees.',
      'Lower until knees are at 90 degrees.',
      'Push through feet to extend legs.',
      'Do not lock knees at top.',
    ],
  },
  'leg extension': {
    id: '0585',
    gifUrl: 'https://v2.exercisedb.io/image/0585.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Sit in machine with back against pad.',
      'Hook ankles under roller pad.',
      'Extend legs until straight.',
      'Squeeze quads at top.',
      'Lower with control.',
      'Keep movements controlled, not explosive.',
    ],
  },
  'leg curl': {
    id: '0584',
    gifUrl: 'https://v2.exercisedb.io/image/0584.gif',
    bodyPart: 'upper legs',
    target: 'hamstrings',
    instructions: [
      'Lie face down on leg curl machine.',
      'Position ankles under roller pad.',
      'Curl heels toward glutes.',
      'Squeeze hamstrings at top.',
      'Lower with control.',
      'Keep hips pressed into pad.',
    ],
  },
  'lunges': {
    id: '0334',
    gifUrl: 'https://v2.exercisedb.io/image/0334.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Stand holding dumbbells at sides.',
      'Step forward with one leg.',
      'Lower hips until both knees at 90 degrees.',
      'Front knee should not pass toes.',
      'Push through front heel to return.',
      'Alternate legs or complete one side first.',
    ],
  },
  'walking lunges': {
    id: '0334',
    gifUrl: 'https://v2.exercisedb.io/image/0334.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Stand holding dumbbells at sides.',
      'Step forward with one leg.',
      'Lower hips until both knees at 90 degrees.',
      'Front knee should not pass toes.',
      'Push through front heel to return.',
      'Alternate legs or complete one side first.',
    ],
  },
  'romanian deadlift': {
    id: '0420',
    gifUrl: 'https://v2.exercisedb.io/image/0420.gif',
    bodyPart: 'upper legs',
    target: 'hamstrings',
    instructions: [
      'Stand holding dumbbells in front of thighs.',
      'Keep slight bend in knees throughout.',
      'Hinge at hips pushing hips back.',
      'Lower weights along legs toward floor.',
      'Feel stretch in hamstrings.',
      'Drive hips forward to stand.',
    ],
  },
  'hip thrust': {
    id: '0495',
    gifUrl: 'https://v2.exercisedb.io/image/0495.gif',
    bodyPart: 'upper legs',
    target: 'glutes',
    instructions: [
      'Sit on ground with upper back against bench.',
      'Roll barbell over hips, pad bar for comfort.',
      'Feet flat on floor, knees bent.',
      'Drive through heels to lift hips.',
      'Squeeze glutes at top.',
      'Lower hips with control.',
    ],
  },
  'glute bridge': {
    id: '0389',
    gifUrl: 'https://v2.exercisedb.io/image/0389.gif',
    bodyPart: 'upper legs',
    target: 'glutes',
    instructions: [
      'Lie on back with knees bent, feet flat.',
      'Arms at sides for stability.',
      'Push through heels to lift hips.',
      'Squeeze glutes at top.',
      'Create straight line from knees to shoulders.',
      'Lower with control.',
    ],
  },
  'calf raises': {
    id: '0088',
    gifUrl: 'https://v2.exercisedb.io/image/0088.gif',
    bodyPart: 'lower legs',
    target: 'calves',
    instructions: [
      'Stand on calf raise machine with shoulders under pads.',
      'Balls of feet on platform, heels hanging off.',
      'Lower heels below platform for full stretch.',
      'Push through balls of feet to raise heels.',
      'Squeeze calves at top.',
      'Lower with control.',
    ],
  },

  // ==========================================
  // ARM EXERCISES - BICEPS
  // ==========================================
  'bicep curls': {
    id: '0294',
    gifUrl: 'https://v2.exercisedb.io/image/0294.gif',
    bodyPart: 'upper arms',
    target: 'biceps',
    instructions: [
      'Stand holding dumbbells at sides, palms forward.',
      'Curl weights up toward shoulders.',
      'Keep elbows stationary at sides.',
      'Squeeze biceps at top.',
      'Lower with control.',
      'Can alternate arms or curl together.',
    ],
  },
  'dumbbell bicep curl': {
    id: '0294',
    gifUrl: 'https://v2.exercisedb.io/image/0294.gif',
    bodyPart: 'upper arms',
    target: 'biceps',
    instructions: [
      'Stand holding dumbbells at sides, palms forward.',
      'Curl weights up toward shoulders.',
      'Keep elbows stationary at sides.',
      'Squeeze biceps at top.',
      'Lower with control.',
      'Can alternate arms or curl together.',
    ],
  },
  'barbell curl': {
    id: '0023',
    gifUrl: 'https://v2.exercisedb.io/image/0023.gif',
    bodyPart: 'upper arms',
    target: 'biceps',
    instructions: [
      'Stand holding barbell with underhand grip.',
      'Keep elbows close to sides.',
      'Curl bar up toward shoulders.',
      'Squeeze biceps at top.',
      'Lower with control.',
      'Avoid swinging body for momentum.',
    ],
  },
  'hammer curls': {
    id: '0406',
    gifUrl: 'https://v2.exercisedb.io/image/0406.gif',
    bodyPart: 'upper arms',
    target: 'biceps',
    instructions: [
      'Stand holding dumbbells with neutral grip (palms facing each other).',
      'Curl weights up keeping palms facing in.',
      'Keep elbows close to body.',
      'Squeeze at top of movement.',
      'Lower with control.',
    ],
  },
  'preacher curls': {
    id: '0410',
    gifUrl: 'https://v2.exercisedb.io/image/0410.gif',
    bodyPart: 'upper arms',
    target: 'biceps',
    instructions: [
      'Sit at preacher bench, lean forward slightly.',
      'Brace upper arms against pad.',
      'Curl weight up toward shoulder.',
      'Squeeze bicep at top.',
      'Lower with control.',
      'Focus on strict form with no momentum.',
    ],
  },

  // ==========================================
  // ARM EXERCISES - TRICEPS
  // ==========================================
  'tricep pushdowns': {
    id: '0083',
    gifUrl: 'https://v2.exercisedb.io/image/0083.gif',
    bodyPart: 'upper arms',
    target: 'triceps',
    instructions: [
      'Stand facing cable machine with rope or bar attachment.',
      'Grip handle with elbows at sides.',
      'Push handle down until arms are extended.',
      'Keep upper arms stationary.',
      'Squeeze triceps at bottom.',
      'Control weight back up.',
    ],
  },
  'cable tricep pushdown': {
    id: '0083',
    gifUrl: 'https://v2.exercisedb.io/image/0083.gif',
    bodyPart: 'upper arms',
    target: 'triceps',
    instructions: [
      'Stand facing cable machine with rope or bar attachment.',
      'Grip handle with elbows at sides.',
      'Push handle down until arms are extended.',
      'Keep upper arms stationary.',
      'Squeeze triceps at bottom.',
      'Control weight back up.',
    ],
  },
  'tricep extension': {
    id: '0187',
    gifUrl: 'https://v2.exercisedb.io/image/0187.gif',
    bodyPart: 'upper arms',
    target: 'triceps',
    instructions: [
      'Stand or sit holding one dumbbell with both hands.',
      'Raise weight overhead with arms extended.',
      'Lower weight behind head by bending elbows.',
      'Keep upper arms close to head.',
      'Extend arms back up squeezing triceps.',
    ],
  },
  'overhead tricep extension': {
    id: '0187',
    gifUrl: 'https://v2.exercisedb.io/image/0187.gif',
    bodyPart: 'upper arms',
    target: 'triceps',
    instructions: [
      'Stand or sit holding one dumbbell with both hands.',
      'Raise weight overhead with arms extended.',
      'Lower weight behind head by bending elbows.',
      'Keep upper arms close to head.',
      'Extend arms back up squeezing triceps.',
    ],
  },
  'skull crushers': {
    id: '0187',
    gifUrl: 'https://v2.exercisedb.io/image/0187.gif',
    bodyPart: 'upper arms',
    target: 'triceps',
    instructions: [
      'Lie on bench holding barbell or dumbbells above chest.',
      'Lower weight toward forehead by bending elbows.',
      'Keep upper arms vertical and still.',
      'Extend arms back up squeezing triceps.',
      'Control the movement throughout.',
    ],
  },
  'dips': {
    id: '0274',
    gifUrl: 'https://v2.exercisedb.io/image/0274.gif',
    bodyPart: 'upper arms',
    target: 'triceps',
    instructions: [
      'Grip parallel bars and lift body up.',
      'Start with arms fully extended.',
      'Lower body by bending elbows.',
      'Keep slight forward lean for chest, upright for triceps.',
      'Lower until upper arms are parallel to floor.',
      'Push back up to starting position.',
    ],
  },
  'tricep dips': {
    id: '0274',
    gifUrl: 'https://v2.exercisedb.io/image/0274.gif',
    bodyPart: 'upper arms',
    target: 'triceps',
    instructions: [
      'Grip parallel bars and lift body up.',
      'Start with arms fully extended.',
      'Lower body by bending elbows.',
      'Keep slight forward lean for chest, upright for triceps.',
      'Lower until upper arms are parallel to floor.',
      'Push back up to starting position.',
    ],
  },
  'close grip bench press': {
    id: '0812',
    gifUrl: 'https://v2.exercisedb.io/image/0812.gif',
    bodyPart: 'upper arms',
    target: 'triceps',
    instructions: [
      'Lie on bench and grip bar with hands shoulder-width or closer.',
      'Unrack bar and hold above chest.',
      'Lower bar to lower chest keeping elbows close to body.',
      'Press bar back up to starting position.',
      'Focus on tricep contraction.',
    ],
  },

  // ==========================================
  // CORE EXERCISES
  // ==========================================
  'plank': {
    id: '0628',
    gifUrl: 'https://v2.exercisedb.io/image/0628.gif',
    bodyPart: 'waist',
    target: 'abs',
    instructions: [
      'Start in push-up position on forearms.',
      'Keep body in straight line from head to heels.',
      'Engage core and squeeze glutes.',
      'Keep hips level, not sagging or raised.',
      'Hold position for prescribed time.',
      'Breathe steadily throughout.',
    ],
  },
  'crunches': {
    id: '0214',
    gifUrl: 'https://v2.exercisedb.io/image/0214.gif',
    bodyPart: 'waist',
    target: 'abs',
    instructions: [
      'Lie on back with knees bent, feet flat.',
      'Place hands behind head or across chest.',
      'Lift shoulders off floor by contracting abs.',
      'Keep lower back pressed into floor.',
      'Lower with control.',
      'Avoid pulling on neck.',
    ],
  },
  'leg raises': {
    id: '0464',
    gifUrl: 'https://v2.exercisedb.io/image/0464.gif',
    bodyPart: 'waist',
    target: 'abs',
    instructions: [
      'Hang from pull-up bar with arms extended.',
      'Keep legs straight or slightly bent.',
      'Raise legs up toward chest.',
      'Control movement using abs.',
      'Lower legs with control.',
      'Avoid swinging.',
    ],
  },
  'hanging leg raises': {
    id: '0464',
    gifUrl: 'https://v2.exercisedb.io/image/0464.gif',
    bodyPart: 'waist',
    target: 'abs',
    instructions: [
      'Hang from pull-up bar with arms extended.',
      'Keep legs straight or slightly bent.',
      'Raise legs up toward chest.',
      'Control movement using abs.',
      'Lower legs with control.',
      'Avoid swinging.',
    ],
  },
  'russian twist': {
    id: '0727',
    gifUrl: 'https://v2.exercisedb.io/image/0727.gif',
    bodyPart: 'waist',
    target: 'abs',
    instructions: [
      'Sit with knees bent, lean back slightly.',
      'Lift feet off floor if able.',
      'Rotate torso side to side.',
      'Touch floor beside hip each side.',
      'Keep core engaged throughout.',
      'Can hold weight for added resistance.',
    ],
  },
  'bicycle crunches': {
    id: '0491',
    gifUrl: 'https://v2.exercisedb.io/image/0491.gif',
    bodyPart: 'waist',
    target: 'abs',
    instructions: [
      'Lie on back with hands behind head.',
      'Lift shoulders off floor.',
      'Bring one knee toward chest while extending other leg.',
      'Rotate torso to bring opposite elbow to knee.',
      'Alternate sides in pedaling motion.',
      'Keep lower back pressed to floor.',
    ],
  },
  'dead bug': {
    id: '0547',
    gifUrl: 'https://v2.exercisedb.io/image/0547.gif',
    bodyPart: 'waist',
    target: 'abs',
    instructions: [
      'Lie on back with arms extended toward ceiling.',
      'Lift legs with knees bent at 90 degrees.',
      'Lower opposite arm and leg toward floor.',
      'Keep lower back pressed into floor.',
      'Return to start and repeat other side.',
      'Move slowly with control.',
    ],
  },

  // ==========================================
  // CARDIO / HIIT EXERCISES
  // ==========================================
  'burpees': {
    id: '0201',
    gifUrl: 'https://v2.exercisedb.io/image/0201.gif',
    bodyPart: 'cardio',
    target: 'cardiovascular system',
    instructions: [
      'Start standing, then squat down.',
      'Place hands on floor and jump feet back to plank.',
      'Perform a push-up (optional).',
      'Jump feet back to hands.',
      'Explosively jump up reaching arms overhead.',
      'Land and immediately begin next rep.',
    ],
  },
  'mountain climbers': {
    id: '0513',
    gifUrl: 'https://v2.exercisedb.io/image/0513.gif',
    bodyPart: 'cardio',
    target: 'cardiovascular system',
    instructions: [
      'Start in push-up position.',
      'Drive one knee toward chest.',
      'Quickly switch legs.',
      'Continue alternating at rapid pace.',
      'Keep hips level throughout.',
      'Core stays engaged.',
    ],
  },
  'jumping jacks': {
    id: '0514',
    gifUrl: 'https://v2.exercisedb.io/image/0514.gif',
    bodyPart: 'cardio',
    target: 'cardiovascular system',
    instructions: [
      'Stand with feet together, arms at sides.',
      'Jump while spreading legs and raising arms overhead.',
      'Jump back to starting position.',
      'Keep movements rhythmic and controlled.',
      'Land softly on balls of feet.',
    ],
  },
  'high knees': {
    id: '0471',
    gifUrl: 'https://v2.exercisedb.io/image/0471.gif',
    bodyPart: 'cardio',
    target: 'cardiovascular system',
    instructions: [
      'Stand with feet hip-width apart.',
      'Drive one knee up toward chest.',
      'Quickly alternate legs.',
      'Pump arms opposite to legs.',
      'Stay on balls of feet.',
      'Keep core engaged throughout.',
    ],
  },
  'jump squats': {
    id: '0514',
    gifUrl: 'https://v2.exercisedb.io/image/0514.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Stand with feet shoulder-width apart.',
      'Lower into squat position.',
      'Explosively jump up extending legs.',
      'Land softly returning to squat.',
      'Immediately begin next rep.',
      'Keep core engaged throughout.',
    ],
  },
  'box jumps': {
    id: '0514',
    gifUrl: 'https://v2.exercisedb.io/image/0514.gif',
    bodyPart: 'upper legs',
    target: 'quads',
    instructions: [
      'Stand facing a sturdy box or platform.',
      'Swing arms back and bend knees.',
      'Explosively jump onto the box.',
      'Land softly with knees slightly bent.',
      'Step or jump back down.',
      'Reset and repeat.',
    ],
  },
  'kettlebell swings': {
    id: '0286',
    gifUrl: 'https://v2.exercisedb.io/image/0286.gif',
    bodyPart: 'upper legs',
    target: 'glutes',
    instructions: [
      'Stand with feet wider than shoulder-width.',
      'Hold kettlebell with both hands.',
      'Hinge at hips swinging bell between legs.',
      'Drive hips forward to swing bell up.',
      'Let bell float to chest height.',
      'Control swing back between legs.',
    ],
  },
};

/**
 * Get ExerciseDB mapping for an exercise name
 * Handles various naming conventions and returns null if not found
 */
export function getExerciseDbMapping(exerciseName: string): ExerciseDbMapping | null {
  const normalized = normalizeExerciseName(exerciseName);

  // Direct match
  if (EXERCISE_DB_MAPPING[normalized]) {
    return EXERCISE_DB_MAPPING[normalized];
  }

  // Try partial matches for common variations
  const keys = Object.keys(EXERCISE_DB_MAPPING);
  for (const key of keys) {
    // Check if the normalized name contains the key or vice versa
    if (normalized.includes(key) || key.includes(normalized)) {
      return EXERCISE_DB_MAPPING[key];
    }
  }

  return null;
}

/**
 * Get just the GIF URL for an exercise (convenience function)
 */
export function getExerciseGifUrl(exerciseName: string): string | null {
  const mapping = getExerciseDbMapping(exerciseName);
  return mapping?.gifUrl || null;
}

/**
 * Get instructions for an exercise
 */
export function getExerciseInstructions(exerciseName: string): string[] | null {
  const mapping = getExerciseDbMapping(exerciseName);
  return mapping?.instructions || null;
}

// Export list of all mapped exercise names for reference
export const MAPPED_EXERCISE_NAMES = Object.keys(EXERCISE_DB_MAPPING);
