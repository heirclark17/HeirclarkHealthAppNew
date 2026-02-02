import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard, CardioPreference } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ActivityLevel } from '../../constants/goals';
import { lightImpact, selectionFeedback } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';

// Section wrapper using GlassCard
function GlassSection({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <GlassCard style={[styles.glassSection, style]} interactive>
      {children}
    </GlassCard>
  );
}

interface CardioOption {
  id: CardioPreference;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  details: string;
  calorieInfo: string;
  frequency: string;
}

const CARDIO_OPTIONS: CardioOption[] = [
  {
    id: 'walking',
    title: 'Walking',
    description: 'Low intensity, sustainable cardio',
    icon: 'walk-outline',
    details: 'Best for beginners and active recovery',
    calorieInfo: '150-250 cal/30min',
    frequency: '5-7 days/week',
  },
  {
    id: 'running',
    title: 'Running',
    description: 'Moderate-high intensity cardio',
    icon: 'fitness-outline',
    details: 'Great for endurance and calorie burn',
    calorieInfo: '300-400 cal/30min',
    frequency: '3-5 days/week',
  },
  {
    id: 'hiit',
    title: 'HIIT Training',
    description: 'High intensity interval training',
    icon: 'flash-outline',
    details: 'Maximum efficiency with afterburn effect',
    calorieInfo: '250-320 cal/20min',
    frequency: '2-3 days/week max',
  },
];

interface ActivityOption {
  id: ActivityLevel;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  example: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
    icon: 'desktop-outline',
    example: 'Desk job, minimal walking',
  },
  {
    id: 'light',
    title: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    icon: 'walk-outline',
    example: 'Daily walks, light stretching',
  },
  {
    id: 'moderate',
    title: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    icon: 'bicycle-outline',
    example: 'Regular gym, active hobbies',
  },
  {
    id: 'very',
    title: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    icon: 'barbell-outline',
    example: 'Daily training, physical job',
  },
  {
    id: 'extra',
    title: 'Extremely Active',
    description: 'Very intense daily exercise',
    icon: 'fitness-outline',
    example: 'Athletes, manual labor + gym',
  },
];

const WORKOUT_DURATIONS = [15, 30, 45, 60] as const;

interface ActivityCardProps {
  option: ActivityOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  colors: typeof DarkColors;
  isDark: boolean;
}

function ActivityCard({ option, isSelected, onSelect, index, colors, isDark }: ActivityCardProps) {
    onSelect();
  };

    onSelect();
  };

