/**
 * Accountability Partner Agent Types
 * Provides daily check-ins, streak tracking, reminders, and motivational messages
 */

// Streak tracking for different activities
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null; // ISO date string
  totalDaysLogged: number;
  startDate: string; // ISO date string
}

// Different activities to track
export interface ActivityStreaks {
  mealLogging: StreakData;
  weightLogging: StreakData;
  workoutCompletion: StreakData;
  waterIntake: StreakData;
  calorieGoalMet: StreakData;
}

// Daily check-in status
export interface DailyCheckIn {
  date: string; // ISO date string
  morningCheckIn: boolean;
  eveningCheckIn: boolean;
  moodRating: 1 | 2 | 3 | 4 | 5 | null;
  energyLevel: 1 | 2 | 3 | 4 | 5 | null;
  notes: string;
  goalsForToday: string[];
  accomplishments: string[];
  timestamp: number;
}

// Motivational message types
export type MessageType =
  | 'streak_milestone'
  | 'goal_achieved'
  | 'encouragement'
  | 'reminder'
  | 'check_in'
  | 'weekly_summary'
  | 'comeback';

// Motivational message
export interface MotivationalMessage {
  id: string;
  type: MessageType;
  title: string;
  message: string;
  icon: string;
  timestamp: number;
  read: boolean;
  actionRequired: boolean;
  actionType?: 'log_meal' | 'log_weight' | 'log_workout' | 'check_in' | 'view_stats';
}

// Reminder settings
export interface ReminderSettings {
  morningCheckIn: {
    enabled: boolean;
    time: string; // HH:mm format
  };
  eveningCheckIn: {
    enabled: boolean;
    time: string; // HH:mm format
  };
  mealReminders: {
    enabled: boolean;
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  workoutReminder: {
    enabled: boolean;
    time: string;
    daysOfWeek: number[]; // 0-6, Sunday-Saturday
  };
  waterReminder: {
    enabled: boolean;
    intervalMinutes: number;
    startTime: string;
    endTime: string;
  };
  weightReminder: {
    enabled: boolean;
    time: string;
    daysOfWeek: number[];
  };
}

// Weekly summary data
export interface WeeklySummary {
  weekStartDate: string;
  weekEndDate: string;
  mealsLogged: number;
  workoutsCompleted: number;
  daysOnTarget: number;
  averageCalories: number;
  averageProtein: number;
  weightChange: number | null;
  topAccomplishment: string;
  areasToImprove: string[];
  motivationalNote: string;
  overallScore: number; // 0-100
}

// User engagement metrics
export interface EngagementMetrics {
  appOpensThisWeek: number;
  lastAppOpen: number;
  averageDailyEngagementMinutes: number;
  preferredCheckInTime: string | null;
  mostActiveDay: string | null;
  consistencyScore: number; // 0-100
}

// Accountability Partner state
export interface AccountabilityPartnerState {
  streaks: ActivityStreaks;
  todayCheckIn: DailyCheckIn | null;
  recentMessages: MotivationalMessage[];
  reminderSettings: ReminderSettings;
  lastWeeklySummary: WeeklySummary | null;
  engagement: EngagementMetrics;
  isLoading: boolean;
  lastUpdated: number;
}

// Constants for accountability tracking
export const ACCOUNTABILITY_CONSTANTS = {
  // Streak milestones that trigger celebrations
  STREAK_MILESTONES: [3, 7, 14, 21, 30, 60, 90, 100, 150, 200, 365],

  // Default reminder times
  DEFAULT_MORNING_CHECK_IN: '07:00',
  DEFAULT_EVENING_CHECK_IN: '20:00',
  DEFAULT_BREAKFAST_REMINDER: '08:00',
  DEFAULT_LUNCH_REMINDER: '12:00',
  DEFAULT_DINNER_REMINDER: '18:00',
  DEFAULT_WORKOUT_REMINDER: '06:00',
  DEFAULT_WEIGHT_REMINDER: '07:30',

  // Water reminder defaults
  DEFAULT_WATER_INTERVAL: 60, // minutes
  DEFAULT_WATER_START: '08:00',
  DEFAULT_WATER_END: '20:00',

  // Engagement thresholds
  INACTIVE_DAYS_WARNING: 2,
  INACTIVE_DAYS_COMEBACK: 7,

  // Message limits
  MAX_RECENT_MESSAGES: 20,
  MAX_UNREAD_MESSAGES: 10,

  // Scoring weights
  CONSISTENCY_WEIGHT: 0.3,
  GOAL_ACHIEVEMENT_WEIGHT: 0.4,
  ENGAGEMENT_WEIGHT: 0.3,
};

// Motivational message templates
export const MOTIVATION_TEMPLATES = {
  STREAK_MESSAGES: {
    3: "3 days in a row! You're building momentum!",
    7: "One week strong! Habits are forming!",
    14: "Two weeks! You're becoming unstoppable!",
    21: "21 days - they say this is when habits stick!",
    30: "A whole month! You're truly committed!",
    60: "60 days of dedication. Incredible!",
    90: "90 days! You've transformed your routine!",
    100: "TRIPLE DIGITS! You're a legend!",
  },
  ENCOURAGEMENT: [
    "Every step forward counts, no matter how small.",
    "You're doing better than you think you are.",
    "Progress, not perfection, is what matters.",
    "Your consistency is your superpower.",
    "Today is another chance to be your best self.",
    "Small daily improvements lead to big results.",
    "You've got this! Keep pushing forward.",
    "Remember why you started. Keep going!",
  ],
  COMEBACK: [
    "Welcome back! Ready to pick up where you left off?",
    "It's great to see you again! Let's get back on track.",
    "Every expert was once a beginner. Let's restart together.",
    "Missing a few days doesn't erase your progress. Let's continue!",
    "The best time to start was yesterday. The second best time is now.",
  ],
  GOAL_ACHIEVED: [
    "You crushed your goal today! Amazing work!",
    "Goal achieved! Your hard work is paying off.",
    "Target hit! Keep this momentum going!",
    "You did it! Another successful day in the books.",
  ],
};

// Default activity streak data
export const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastLoggedDate: null,
  totalDaysLogged: 0,
  startDate: new Date().toISOString().split('T')[0],
};

// Default reminder settings
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  morningCheckIn: {
    enabled: true,
    time: ACCOUNTABILITY_CONSTANTS.DEFAULT_MORNING_CHECK_IN,
  },
  eveningCheckIn: {
    enabled: true,
    time: ACCOUNTABILITY_CONSTANTS.DEFAULT_EVENING_CHECK_IN,
  },
  mealReminders: {
    enabled: true,
    breakfast: ACCOUNTABILITY_CONSTANTS.DEFAULT_BREAKFAST_REMINDER,
    lunch: ACCOUNTABILITY_CONSTANTS.DEFAULT_LUNCH_REMINDER,
    dinner: ACCOUNTABILITY_CONSTANTS.DEFAULT_DINNER_REMINDER,
  },
  workoutReminder: {
    enabled: true,
    time: ACCOUNTABILITY_CONSTANTS.DEFAULT_WORKOUT_REMINDER,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
  },
  waterReminder: {
    enabled: false,
    intervalMinutes: ACCOUNTABILITY_CONSTANTS.DEFAULT_WATER_INTERVAL,
    startTime: ACCOUNTABILITY_CONSTANTS.DEFAULT_WATER_START,
    endTime: ACCOUNTABILITY_CONSTANTS.DEFAULT_WATER_END,
  },
  weightReminder: {
    enabled: true,
    time: ACCOUNTABILITY_CONSTANTS.DEFAULT_WEIGHT_REMINDER,
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
  },
};

// Default engagement metrics
export const DEFAULT_ENGAGEMENT_METRICS: EngagementMetrics = {
  appOpensThisWeek: 0,
  lastAppOpen: Date.now(),
  averageDailyEngagementMinutes: 0,
  preferredCheckInTime: null,
  mostActiveDay: null,
  consistencyScore: 0,
};
