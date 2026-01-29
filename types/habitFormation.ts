/**
 * Habit Formation Agent Types
 * Helps users build and track healthy habits
 */

// Habit categories
export type HabitCategory = 'nutrition' | 'fitness' | 'sleep' | 'mindfulness' | 'hydration' | 'custom';

// Habit frequency
export type HabitFrequency = 'daily' | 'weekly' | 'specific_days';

// Habit status for a day
export type HabitStatus = 'completed' | 'skipped' | 'pending';

// Habit definition
export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  icon: string;
  frequency: HabitFrequency;
  specificDays?: number[]; // 0-6 for specific days
  targetTime?: string; // HH:mm format
  reminderEnabled: boolean;
  createdAt: number;
  isActive: boolean;
}

// Habit completion record
export interface HabitCompletion {
  habitId: string;
  date: string; // ISO date
  status: HabitStatus;
  completedAt?: number;
  notes?: string;
}

// Habit streak data
export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0-100
  lastCompletedDate: string | null;
}

// Habit stack (linked habits)
export interface HabitStack {
  id: string;
  name: string;
  habitIds: string[];
  triggerHabitId: string;
  createdAt: number;
}

// Daily habit summary
export interface DailyHabitSummary {
  date: string;
  totalHabits: number;
  completedHabits: number;
  skippedHabits: number;
  pendingHabits: number;
  completionRate: number;
}

// Habit insight
export interface HabitInsight {
  type: 'streak' | 'improvement' | 'suggestion' | 'warning';
  message: string;
  habitId?: string;
  timestamp: number;
}

// Habit Formation state
export interface HabitFormationState {
  habits: Habit[];
  completions: HabitCompletion[];
  streaks: HabitStreak[];
  stacks: HabitStack[];
  todaySummary: DailyHabitSummary | null;
  insights: HabitInsight[];
  isLoading: boolean;
  lastUpdated: number;
}

// Constants
export const HABIT_CONSTANTS = {
  MAX_HABITS: 20,
  MAX_COMPLETIONS_DAYS: 90,
  STREAK_MILESTONES: [7, 14, 21, 30, 60, 90],
  MIN_COMPLETION_RATE_WARNING: 50,
};

// Default habits suggestions
export const SUGGESTED_HABITS: Omit<Habit, 'id' | 'createdAt' | 'isActive'>[] = [
  {
    name: 'Morning Water',
    description: 'Drink a glass of water upon waking',
    category: 'hydration',
    icon: 'water',
    frequency: 'daily',
    targetTime: '07:00',
    reminderEnabled: true,
  },
  {
    name: 'Log Meals',
    description: 'Track all meals in the app',
    category: 'nutrition',
    icon: 'restaurant',
    frequency: 'daily',
    reminderEnabled: true,
  },
  {
    name: 'Daily Walk',
    description: 'Take a 15-minute walk',
    category: 'fitness',
    icon: 'walk',
    frequency: 'daily',
    targetTime: '12:00',
    reminderEnabled: true,
  },
  {
    name: 'Weigh In',
    description: 'Log weight in the morning',
    category: 'fitness',
    icon: 'scale',
    frequency: 'daily',
    targetTime: '07:30',
    reminderEnabled: true,
  },
  {
    name: 'Sleep by 10pm',
    description: 'Be in bed by 10pm',
    category: 'sleep',
    icon: 'moon',
    frequency: 'daily',
    targetTime: '22:00',
    reminderEnabled: true,
  },
  {
    name: 'Mindful Eating',
    description: 'Eat without distractions',
    category: 'mindfulness',
    icon: 'leaf',
    frequency: 'daily',
    reminderEnabled: false,
  },
  {
    name: 'Workout',
    description: 'Complete planned workout',
    category: 'fitness',
    icon: 'barbell',
    frequency: 'specific_days',
    specificDays: [1, 2, 3, 4, 5], // Mon-Fri
    reminderEnabled: true,
  },
];

// Category icons
export const CATEGORY_ICONS: Record<HabitCategory, string> = {
  nutrition: 'nutrition',
  fitness: 'fitness',
  sleep: 'moon',
  mindfulness: 'leaf',
  hydration: 'water',
  custom: 'star',
};
