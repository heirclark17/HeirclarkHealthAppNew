/**
 * ActivityIcon - Icon mapping for time block types
 * Supports light/dark mode with theme-aware default color
 */

import React from 'react';
import {
  Dumbbell,
  ChefHat,
  Utensils,
  Briefcase,
  Moon,
  User,
  Car,
  Calendar,
  Clock,
} from 'lucide-react-native';
import { DarkColors, LightColors } from '../../../constants/Theme';
import { useSettings } from '../../../contexts/SettingsContext';
import { BlockType } from '../../../types/planner';

interface Props {
  type: BlockType;
  size?: number;
  color?: string;
}

export function ActivityIcon({ type, size = 20, color }: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  // Use provided color or fall back to theme-aware text color
  const iconColor = color ?? themeColors.text;

  switch (type) {
    case 'workout':
      return <Dumbbell size={size} color={iconColor} />;
    case 'meal_prep':
      return <ChefHat size={size} color={iconColor} />;
    case 'meal_eating':
      return <Utensils size={size} color={iconColor} />;
    case 'work':
      return <Briefcase size={size} color={iconColor} />;
    case 'sleep':
      return <Moon size={size} color={iconColor} />;
    case 'personal':
      return <User size={size} color={iconColor} />;
    case 'commute':
      return <Car size={size} color={iconColor} />;
    case 'calendar_event':
      return <Calendar size={size} color={iconColor} />;
    case 'buffer':
      return <Clock size={size} color={iconColor} />;
    default:
      return <Clock size={size} color={iconColor} />;
  }
}
