import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Spacing } from '../constants/Theme';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  completed: boolean;
  notes?: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [isCompleted, setIsCompleted] = useState(exercise.completed);

  const toggleComplete = () => {
    setIsCompleted(!isCompleted);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainContent}
        onPress={toggleComplete}
      >
        <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>

        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, isCompleted && styles.exerciseNameCompleted]}>
            {exercise.name}
          </Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Sets</Text>
              <Text style={styles.detailValue}>{exercise.sets}</Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Reps</Text>
              <Text style={styles.detailValue}>{exercise.reps}</Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Rest</Text>
              <Text style={styles.detailValue}>{exercise.rest}</Text>
            </View>
          </View>

          {exercise.notes && (
            <Text style={styles.notes}>💡 {exercise.notes}</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius - 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainContent: {
    flexDirection: 'row',
    padding: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkmark: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  exerciseNameCompleted: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius - 6,
    padding: 8,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
    fontFamily: Fonts.regular,
  },
  detailValue: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  detailDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  notes: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
  },
});
