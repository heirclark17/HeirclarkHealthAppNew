import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Spacing } from '../constants/Theme';

interface Program {
  id: string;
  name: string;
  description: string;
  weeks: number;
  daysPerWeek: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  focus: string;
}

interface ProgramCardProps {
  program: Program;
  isActive: boolean;
  onSelect: () => void;
}

export function ProgramCard({ program, isActive, onSelect }: ProgramCardProps) {
  const getDifficultyColor = () => {
    switch (program.difficulty) {
      case 'Beginner':
        return Colors.success + '40';
      case 'Intermediate':
        return Colors.primary + '40';
      case 'Advanced':
        return Colors.warning + '40';
      default:
        return Colors.border;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.containerActive]}
      onPress={onSelect}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.programName}>{program.name}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() }]}>
            <Text style={styles.difficultyText}>{program.difficulty}</Text>
          </View>
        </View>
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>✓ Active</Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>{program.description}</Text>

      <View style={styles.focusContainer}>
        <Text style={styles.focusLabel}>Focus: </Text>
        <Text style={styles.focusText}>{program.focus}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statText}>{program.weeks} weeks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>💪</Text>
          <Text style={styles.statText}>{program.daysPerWeek} days/week</Text>
        </View>
      </View>

      {!isActive && (
        <TouchableOpacity style={styles.selectButton} onPress={onSelect}>
          <Text style={styles.selectButtonText}>Select Program</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  programName: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 9,
    color: Colors.text,
    letterSpacing: 0.5,
    fontFamily: Fonts.bold,
  },
  activeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: Fonts.regular,
  },
  focusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  focusLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
  },
  focusText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Spacing.borderRadius - 4,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  selectButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
  },
  selectButtonText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
});
