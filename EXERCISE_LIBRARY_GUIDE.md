# Exercise Library - Usage Guide

## Overview

The Exercise Library feature provides **two ways** to browse and select exercises:

1. **Exercises Tab** - Dedicated tab for browsing all 100+ exercises
2. **ExerciseLibraryModal** - Reusable modal component for workout screens

---

## 1. Exercises Tab

### Location
Navigate to the **Exercises** tab in the bottom navigation bar.

### Features
- ✅ Browse 100+ exercises from the database
- ✅ Search by name, muscle group, or category
- ✅ Filter by:
  - Muscle Group (chest, back, shoulders, arms, legs, core)
  - Equipment (bodyweight, dumbbells, barbell, cable, bands)
  - Difficulty (beginner, intermediate, advanced)
- ✅ View exercise details (instructions, tips, alternatives)
- ✅ Favorite exercises for quick access
- ✅ See equipment alternatives for each exercise

### User Flow
1. Open **Exercises** tab
2. Search or filter exercises
3. Tap exercise card → View full details
4. Browse alternatives, instructions, and tips
5. Tap heart icon to favorite

---

## 2. ExerciseLibraryModal Component

### Purpose
Reusable modal for selecting exercises from within workout screens.

### Import
```typescript
import { ExerciseLibraryModal } from '../../components/ExerciseLibraryModal';
```

### Basic Usage
```typescript
import { useState } from 'react';
import { ExerciseLibraryModal } from '../../components/ExerciseLibraryModal';
import type { Exercise } from '../../types/training';

function MyWorkoutScreen() {
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';

  const handleSelectExercise = (exercise: Exercise) => {
    console.log('Selected exercise:', exercise.name);
    // Add exercise to workout, swap exercise, etc.
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowExerciseModal(true)}>
        <Text>Add Exercise</Text>
      </TouchableOpacity>

      <ExerciseLibraryModal
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSelectExercise={handleSelectExercise}
        isDark={isDark}
      />
    </>
  );
}
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `visible` | `boolean` | ✅ | - | Controls modal visibility |
| `onClose` | `() => void` | ✅ | - | Called when modal closes |
| `onSelectExercise` | `(exercise: Exercise) => void` | ✅ | - | Called when exercise selected |
| `isDark` | `boolean` | ❌ | `false` | Dark mode toggle |
| `title` | `string` | ❌ | `"Exercise Library"` | Modal title |
| `equipmentFilter` | `Equipment[]` | ❌ | `undefined` | Pre-filter by equipment |

### Advanced Usage with Equipment Filter

```typescript
import { ExerciseLibraryModal } from '../../components/ExerciseLibraryModal';

function MyWorkoutScreen() {
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const userEquipment: Equipment[] = ['dumbbells', 'barbell', 'bodyweight'];

  const handleSelectExercise = (exercise: Exercise) => {
    // Add to workout
    addExerciseToWorkout(exercise);
  };

  return (
    <ExerciseLibraryModal
      visible={showExerciseModal}
      onClose={() => setShowExerciseModal(false)}
      onSelectExercise={handleSelectExercise}
      isDark={isDark}
      title="Choose Exercise"
      equipmentFilter={userEquipment} // Only show exercises matching user's equipment
    />
  );
}
```

---

## Exercise Data Structure

### Exercise Interface
```typescript
interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  category: ExerciseCategory;
  equipment: Equipment;
  difficulty: DifficultyLevel;
  caloriesPerMinute: number;
  instructions?: string[];
  tips?: string[];
  videoUrl?: string;
  alternatives?: ExerciseAlternative[];
  primaryMuscle?: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  movementPattern?: 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'rotation';
  exerciseDbId?: string;
  gifUrl?: string;
}
```

### Exercise Alternative Interface
```typescript
interface ExerciseAlternative {
  id: string;
  name: string;
  equipment: Equipment;
  difficultyModifier: 'easier' | 'same' | 'harder';
  muscleActivationNotes: string;
  whenToUse: string[];
  formCues?: string[];
}
```

---

## Integration Examples

### 1. Add Exercise to Workout
```typescript
const handleAddExercise = (exercise: Exercise) => {
  const newExercise: WorkoutExercise = {
    exerciseId: exercise.id,
    name: exercise.name,
    sets: 3,
    reps: 10,
    restSeconds: 60,
    weight: 0,
    weightUnit: 'lbs',
    completed: false,
    notes: '',
  };

  addToWorkout(newExercise);
  setShowExerciseModal(false);
};
```

### 2. Swap Exercise in Workout
```typescript
const handleSwapExercise = (newExercise: Exercise) => {
  swapExerciseInWorkout(currentExerciseId, newExercise);
  setShowExerciseModal(false);
};
```

### 3. Build Custom Workout
```typescript
const [customWorkout, setCustomWorkout] = useState<Exercise[]>([]);

const handleSelectExercise = (exercise: Exercise) => {
  setCustomWorkout(prev => [...prev, exercise]);
  setShowExerciseModal(false);
};
```

---

## Styling

Both the tab and modal use:
- **iOS 26 Liquid Glass** styling
- **GlassCard** components
- **Dynamic theming** (light/dark mode)
- **Smooth animations** and haptic feedback

---

## Database

### Location
`data/exerciseDatabase.ts`

### Helper Functions
```typescript
import {
  getExerciseById,
  getExerciseAlternatives,
  getExercisesForEquipment,
  getExercisesByMuscleGroup,
} from '../data/exerciseDatabase';

// Get single exercise
const exercise = getExerciseById('bench-press');

// Get exercises by muscle
const chestExercises = getExercisesByMuscleGroup('chest');

// Get exercises for user's equipment
const userEquipment: Equipment[] = ['dumbbells', 'bodyweight'];
const availableExercises = getExercisesForEquipment(userEquipment);

// Get alternatives for an exercise
const alternatives = getExerciseAlternatives('bench-press');
```

---

## Features Summary

### Exercises Tab
- 🔍 Full-text search
- 🎯 Multi-filter support
- ❤️ Favorites
- 📖 Detailed exercise info
- 🔄 Equipment alternatives

### ExerciseLibraryModal
- 🎨 Reusable component
- ⚙️ Configurable props
- 🏋️ Equipment filtering
- 🎯 Exercise selection callback
- 🌓 Dark mode support

---

## Future Enhancements

Potential improvements:
- [ ] Exercise GIFs/videos from ExerciseDB API
- [ ] Exercise history (last performed, PR tracking)
- [ ] Custom exercise creation
- [ ] Exercise collections/playlists
- [ ] AI exercise recommendations
- [ ] Form check integration
- [ ] Progress photos per exercise
- [ ] Social sharing of favorite exercises

---

## Troubleshooting

### Modal not opening?
- Verify `visible` prop is set to `true`
- Check state management in parent component

### No exercises showing?
- Clear filters
- Check `equipmentFilter` prop
- Verify `EXERCISE_DATABASE` is importing correctly

### Exercise not found?
- Ensure exercise exists in `data/exerciseDatabase.ts`
- Check exercise ID spelling

---

**Last Updated:** February 13, 2026
**Version:** 1.0
**Status:** Production Ready ✅
