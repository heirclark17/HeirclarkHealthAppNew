/**
 * Hydration Agent Types
 * Track water intake and hydration goals
 */

export interface WaterEntry {
  id: string;
  date: string;
  amount: number; // milliliters
  timestamp: string;
  source: 'water' | 'coffee' | 'tea' | 'sports_drink' | 'juice' | 'other';
}

export interface DailyHydration {
  date: string;
  totalIntake: number; // milliliters
  goal: number; // milliliters
  entries: WaterEntry[];
  percentComplete: number;
  goalMet: boolean;
}

export interface HydrationGoal {
  dailyGoal: number; // milliliters
  reminderEnabled: boolean;
  reminderInterval: number; // minutes
  wakeTime: string; // HH:mm
  sleepTime: string; // HH:mm
}

export interface HydrationStreak {
  currentStreak: number;
  longestStreak: number;
  lastGoalMetDate: string | null;
}

export interface HydrationState {
  todayIntake: number;
  todayGoal: number;
  todayEntries: WaterEntry[];
  hydrationGoal: HydrationGoal;
  streak: HydrationStreak;
  weeklyHistory: DailyHydration[];
  isLoading: boolean;
}

// Water source multipliers for hydration value
export const HYDRATION_MULTIPLIERS: Record<WaterEntry['source'], number> = {
  water: 1.0,
  tea: 0.9,
  coffee: 0.8, // Mild diuretic effect
  sports_drink: 1.1, // Contains electrolytes
  juice: 0.85,
  other: 0.9,
};

// Quick add amounts in milliliters
export const QUICK_ADD_AMOUNTS = [
  { label: '100ml', value: 100, icon: 'water-outline' },
  { label: '250ml', value: 250, icon: 'water' },
  { label: '500ml', value: 500, icon: 'water' },
  { label: '750ml', value: 750, icon: 'water' },
  { label: '1L', value: 1000, icon: 'water' },
];

export const WATER_SOURCES = [
  { id: 'water', label: 'Water', icon: 'water', color: '#4FC3F7' },
  { id: 'coffee', label: 'Coffee', icon: 'cafe', color: '#8D6E63' },
  { id: 'tea', label: 'Tea', icon: 'leaf', color: '#81C784' },
  { id: 'sports_drink', label: 'Sports Drink', icon: 'fitness', color: '#FFB74D' },
  { id: 'juice', label: 'Juice', icon: 'nutrition', color: '#FFD54F' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#90A4AE' },
];

export const HYDRATION_TIPS = [
  'Start your day with a glass of water',
  'Keep a water bottle at your desk',
  'Drink water before meals to aid digestion',
  'Set hourly reminders to drink water',
  'Eat water-rich foods like cucumber and watermelon',
  'Track your intake to stay accountable',
  'Drink more during exercise and hot weather',
  'Replace sugary drinks with water',
  'Add lemon or fruit for natural flavor',
  'Match each caffeinated drink with a glass of water',
];

export const DEFAULT_HYDRATION_GOAL: HydrationGoal = {
  dailyGoal: 2500, // 2.5 liters
  reminderEnabled: true,
  reminderInterval: 60, // hourly
  wakeTime: '07:00',
  sleepTime: '22:00',
};

// Calculate recommended water intake based on weight (ml per kg body weight)
export function calculateRecommendedIntake(weightKg: number, activityLevel: 'low' | 'moderate' | 'high' = 'moderate'): number {
  const basePerKg = 30; // 30ml per kg body weight
  const activityMultiplier = {
    low: 1.0,
    moderate: 1.2,
    high: 1.5,
  };
  return Math.round(weightKg * basePerKg * activityMultiplier[activityLevel]);
}
