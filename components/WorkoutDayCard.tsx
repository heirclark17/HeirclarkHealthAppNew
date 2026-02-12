import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Spacing } from '../constants/Theme';
import { ExerciseCard } from './ExerciseCard';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  completed: boolean;
  notes?: string;
}

interface WorkoutDay {
  id: string;
  day: string;
  name: string;
  duration: string;
  exercises: Exercise[];
  completed: boolean;
}

interface WorkoutDayCardProps {
  day: WorkoutDay;
  isExpanded: boolean;
  onToggle: () => void;
  completedExercises: number;
  totalExercises: number;
}

export function WorkoutDayCard({
  day,
  isExpanded,
  onToggle,
  completedExercises,
  totalExercises,
}: WorkoutDayCardProps) {
  const progressPercent = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, day.completed && styles.headerCompleted]}
        onPress={onToggle}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.checkbox, day.completed && styles.checkboxCompleted]}>
            {day.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.dayName}>{day.day}</Text>
            <Text style={styles.workoutName}>{day.name}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.duration}>{day.duration}</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Progress Bar */}
          {totalExercises > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressText}>
                  {completedExercises} / {totalExercises} exercises
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          )}

          {/* Exercise List */}
          {day.exercises.length > 0 ? (
            day.exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))
          ) : (
            <Text style={styles.noExercisesText}>Rest day - no exercises scheduled</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerCompleted: {
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkmark: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  headerInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
    fontFamily: Fonts.regular,
  },
  workoutName: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
    fontFamily: Fonts.regular,
  },
  expandIcon: {
    fontSize: 20,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  progressSection: {
    marginBottom: 16,
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
  },
  progressText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  noExercisesText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
  },
});
