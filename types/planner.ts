/**
 * Type definitions for AI-Powered Day & Week Planner
 * Complete type system for scheduling, preferences, and optimization
 */

export interface PlannerPreferences {
  wakeTime: string;           // "06:00"
  sleepTime: string;          // "22:00"
  priorities: Priority[];     // ['health', 'work', 'family']
  energyPeak: EnergyPeak;     // 'morning' | 'afternoon' | 'evening'
  flexibility: Flexibility;   // 'very' | 'somewhat' | 'not_very'
  calendarSyncEnabled: boolean;
}

export interface TimeBlock {
  id: string;
  type: BlockType;
  title: string;
  startTime: string;          // "08:00"
  endTime: string;            // "09:00"
  duration: number;           // minutes
  status: BlockStatus;
  color: string;
  icon: string;
  priority: number;           // 1-5
  flexibility: number;        // 0-1
  aiGenerated: boolean;
  relatedId?: string;         // workout_logs.id, meal_plans.id
  deviceEventId?: string;     // expo-calendar event ID (client-only)
}

export type BlockType =
  | 'workout'
  | 'meal_prep'
  | 'meal_eating'
  | 'work'
  | 'sleep'
  | 'personal'
  | 'commute'
  | 'calendar_event'
  | 'buffer';

export type BlockStatus = 'scheduled' | 'completed' | 'skipped' | 'in_progress';

export type Priority =
  | 'health'
  | 'work'
  | 'family'
  | 'hobbies'
  | 'learning'
  | 'relaxation';

export type EnergyPeak = 'morning' | 'afternoon' | 'evening';

export type Flexibility = 'very' | 'somewhat' | 'not_very';

export interface DailyTimeline {
  date: string;               // "2026-02-16"
  dayOfWeek: string;          // "Sunday"
  blocks: TimeBlock[];
  totalScheduledMinutes: number;
  totalFreeMinutes: number;
  completionRate: number;     // 0-100
}

export interface WeeklyPlan {
  weekStartDate: string;      // Sunday date "2026-02-16"
  days: DailyTimeline[];      // 7 days
  weeklyStats: WeeklyStats;
  generatedAt: string;        // ISO timestamp
}

export interface WeeklyStats {
  workoutsCompleted: number;
  workoutsScheduled: number;
  mealsCompleted: number;
  mealsScheduled: number;
  avgFreeTime: number;        // minutes/day
  productivityScore: number;  // 0-100
}

export interface AIOptimization {
  weeklyInsights: string;     // 2-3 paragraph analysis
  suggestions: OptimizationSuggestion[];
  predictedImprovements: {
    completionRateIncrease: number;
    stressReduction: string;
  };
  generatedAt: string;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'reschedule' | 'add_buffer' | 'consolidate' | 'remove';
  recommendation: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  blockId?: string;
  newStartTime?: string;
}

export interface DeviceCalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
}

export interface SchedulingRequest {
  date: string;
  preferences: PlannerPreferences;
  workoutBlocks: TimeBlock[];
  mealBlocks: TimeBlock[];
  calendarBlocks: TimeBlock[];  // CLIENT-SIDE ONLY
}

export interface SchedulingResult {
  success: boolean;
  timeline: DailyTimeline;
  conflicts: SchedulingConflict[];
  warnings: string[];
  suggestions: string[];
}

export interface SchedulingConflict {
  type: 'overlap' | 'too_tight' | 'impossible';
  blockIds: string[];
  message: string;
}

// Constants
export const PLANNER_CONSTANTS = {
  MIN_BLOCK_DURATION: 15,      // minutes
  DEFAULT_BUFFER: 10,          // minutes
  MAX_DAILY_BLOCKS: 20,
  CACHE_EXPIRY_DAYS: 7,
  AI_MODEL: 'gpt-4.1-mini',

  BLOCK_COLORS: {
    workout: '#CC7722',        // activeEnergy
    meal_prep: '#4ECDC4',      // teal
    meal_eating: '#F39C12',    // protein
    work: '#3D5A80',           // navy
    sleep: '#8860D0',          // purple
    personal: '#FFD93D',       // yellow
    commute: '#A8DADC',        // light blue
    calendar_event: '#457B9D', // blue
    buffer: '#E0E0E0',         // light gray
  },

  BLOCK_ICONS: {
    workout: 'dumbbell',
    meal_prep: 'chef-hat',
    meal_eating: 'utensils',
    work: 'briefcase',
    sleep: 'moon',
    personal: 'user',
    commute: 'car',
    calendar_event: 'calendar',
    buffer: 'clock',
  }
};

// Helper types
export interface CompletionHistory {
  date: string;
  completionRate: number;
  skippedBlocks: string[];
  completedBlocks: string[];
}
