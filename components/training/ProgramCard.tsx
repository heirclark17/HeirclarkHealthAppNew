import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { TrainingProgram, ProgramTemplate } from '../../types/training';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';

interface ProgramCardProps {
  program: TrainingProgram | ProgramTemplate;
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

  // Theme-aware colors
  const secondaryBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  // Green selection colors for liquid glass effect
  const greenColor = Colors.success;
  const greenBgLight = isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(16, 185, 129, 0.10)';
  const greenBgMedium = isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(16, 185, 129, 0.15)';
  const greenBorder = isDark ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.30)';

  // Difficulty colors (theme-aware)
  const successColor = Colors.success;
  const warningColor = isDark ? Colors.warning : Colors.warningOrange;
  const dangerColor = Colors.error;

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
        return successColor;
      case 'intermediate':
        return warningColor;
      case 'advanced':
        return dangerColor;
      default:
        return colors.textMuted;
    }
  };

  const getProgramIcon = (id: string): keyof typeof Ionicons.glyphMap => {
    if (id.includes('fat-loss') || id.includes('hiit')) return 'flame-outline';
    if (id.includes('muscle') || id.includes('strength')) return 'barbell-outline';
    if (id.includes('health') || id.includes('wellness')) return 'heart-outline';
    return 'fitness-outline';
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => {
            mediumImpact();
            onSelect();
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessibilityLabel={`${program.name}, ${program.difficulty} level program`}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          accessibilityHint={`Select ${program.name} training program`}
        >
          <GlassCard
            style={[
              styles.card,
              isSelected && [
                styles.cardSelected,
                {
                  backgroundColor: greenBgLight,
                  borderColor: greenBorder,
                  borderWidth: 1.5,
                },
              ],
            ]}
            interactive
          >
            {/* Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isSelected ? greenBgMedium : secondaryBg },
                ]}
              >
                <Ionicons
                  name={getProgramIcon(program.id)}
                  size={24}
                  color={isSelected ? greenColor : colors.text}
                />
              </View>
              <View style={styles.headerText}>
                <Text
                  style={[
                    styles.programName,
                    { color: isSelected ? greenColor : colors.text },
                  ]}
                >
                  {program.name}
                </Text>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: `${getDifficultyColor(program.difficulty)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(program.difficulty) },
                    ]}
                  >
                    {program.difficulty}
                  </Text>
                </View>
              </View>
              {isSelected && (
                <View style={[styles.selectedBadge, { backgroundColor: greenBgMedium }]}>
                  <Ionicons name="checkmark-circle" size={22} color={greenColor} />
                </View>
              )}
            </View>

            {/* Description */}
            <Text
              style={[
                styles.description,
                { color: isSelected ? colors.text : colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {program.description}
            </Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={isSelected ? greenColor : colors.textMuted}
                />
                <Text
                  style={[
                    styles.statText,
                    { color: isSelected ? greenColor : colors.textMuted },
                  ]}
                >
                  <NumberText weight="regular">{program.duration}</NumberText> weeks
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name="repeat-outline"
                  size={15}
                  color={isSelected ? greenColor : colors.textMuted}
                />
                <Text
                  style={[
                    styles.statText,
                    { color: isSelected ? greenColor : colors.textMuted },
                  ]}
                >
                  <NumberText weight="regular">{program.daysPerWeek}</NumberText> days/week
                </Text>
              </View>
            </View>

            {/* Focus Tags */}
            <View style={styles.tagsRow}>
              {program.focus.slice(0, 3).map((tag, i) => (
                <View
                  key={i}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: isSelected ? greenBgLight : secondaryBg,
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: isSelected ? greenBorder : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: isSelected ? greenColor : colors.textSecondary },
                    ]}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>

            {/* View Details hint */}
            <View style={styles.viewDetailsRow}>
              <Text style={[styles.viewDetailsText, { color: colors.textMuted }]}>
                Tap to preview program details
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          </GlassCard>
        </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: Colors.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardSelected: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  programName: {
    fontSize: 16,
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
    fontSize: 10,
    fontFamily: Fonts.medium,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 19,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  viewDetailsText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
});

export default ProgramCard;
