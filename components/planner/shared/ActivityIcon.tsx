/**
 * ActivityIcon - Icon mapping for time block types
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
import { BlockType } from '../../../types/planner';

interface Props {
  type: BlockType;
  size?: number;
  color?: string;
}

export function ActivityIcon({ type, size = 20, color }: Props) {
  switch (type) {
    case 'workout':
      return <Dumbbell size={size} color={color} />;
    case 'meal_prep':
      return <ChefHat size={size} color={color} />;
    case 'meal_eating':
      return <Utensils size={size} color={color} />;
    case 'work':
      return <Briefcase size={size} color={color} />;
    case 'sleep':
      return <Moon size={size} color={color} />;
    case 'personal':
      return <User size={size} color={color} />;
    case 'commute':
      return <Car size={size} color={color} />;
    case 'calendar_event':
      return <Calendar size={size} color={color} />;
    case 'buffer':
      return <Clock size={size} color={color} />;
    default:
      return <Clock size={size} color={color} />;
  }
}
