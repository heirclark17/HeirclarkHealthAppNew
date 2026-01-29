import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { TrainingProgram } from '../../types/training';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';

interface ProgramCardProps {
  program: TrainingProgram;
  isSelected: boolean;
  onSelect: () => void;
  index?: number;
}

export function ProgramCard({ program, isSelected, onSelect, index = 0 }: ProgramCardProps) {
  const { settings } = useSettings();
  const scale = useSharedValue(1);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds for inner elements
  const secondaryBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#2ECC71';
      case 'intermediate':
        return Colors.protein;
      case 'advanced':
        return Colors.calories;
      default:
        return Colors.textMuted;
    }
  };

  const getProgramIcon = (id: string) => {
    if (id.includes('fat-loss') || id.includes('hiit')) return 'flame-outline';
    if (id.includes('muscle') || id.includes('strength')) return 'barbell-outline';
    if (id.includes('health') || id.includes('wellness')) return 'heart-outline';
    return 'fitness-outline';
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => {
            mediumImpact();
            onSelect();
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
        <GlassCard style={[styles.card, isSelected && styles.cardSelected]} interactive>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: secondaryBg }, isSelected && { backgroundColor: colors.primary }]}>
              <Ionicons
                name={getProgramIcon(program.id)}
                size={24}
                color={isSelected ? colors.primaryText : colors.text}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.programName, { color: colors.text }]}>{program.name}</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(program.difficulty)}20` }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(program.difficulty) }]}>
                  {program.difficulty}
                </Text>
              </View>
            </View>
            {isSelected && (
              <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={18} color={colors.primaryText} />
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>{program.description}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>{program.duration} weeks</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="repeat-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>{program.daysPerWeek} days/week</Text>
            </View>
          </View>

          {/* Focus Tags */}
          <View style={styles.tagsRow}>
            {program.focus.slice(0, 3).map((tag, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: secondaryBg }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    // GlassCard handles styling
  },
  cardSelected: {
    // Selected state visual handled by icon badge
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  programName: {
    fontSize: 17,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'capitalize',
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
});
