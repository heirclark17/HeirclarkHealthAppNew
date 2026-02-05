/**
 * Type definitions for programs and onboarding features
 * Migrated from HeirclarkHealthApp
 */

export interface Program {
  id: string;
  type: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_days: number;
  is_default_onboarding: boolean;
  target_audience?: string[];
  learning_objectives?: string[];
  methodology?: string;
  estimated_daily_minutes: number;
  thumbnail_url?: string;
  coach_name?: string;
  total_tasks: number;
  total_points: number;
  total_estimated_minutes: number;
  user_enrollment?: UserEnrollment | null;
}

export interface UserEnrollment {
  enrollment_id: string;
  status: 'active' | 'paused' | 'completed';
  started_at: string;
  completed_at?: string;
  current_day: number;
  tasks_completed: number;
  points_earned: number;
  streak_days: number;
  completion_percentage?: number;
}

export type TaskType = 'lesson' | 'action' | 'reflection' | 'quiz' | 'habit_check' | 'goal_setting' | 'coach_video';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface Task {
  id: string;
  task_order: number;
  day_number: number;
  task_type: TaskType;
  title: string;
  content: string;
  points_value: number;
  action_type?: string;
  quiz_questions?: QuizQuestion[];
  estimated_minutes: number;
}

export interface DayTasks {
  day: number;
  tasks: Task[];
  total_points: number;
  estimated_minutes: number;
}

export interface ProgramTasksResponse {
  ok: boolean;
  data?: {
    program_id: string;
    total_days: number;
    total_tasks: number;
    days: DayTasks[];
  };
  error?: string;
}

export interface TaskCompletionResponse {
  ok: boolean;
  data?: {
    task_id: string;
    completed: boolean;
    points_awarded: number;
    streak_bonus: number;
    total_points_earned: number;
    total_points: number;
    quiz_score?: number;
    quiz_passed?: boolean;
    day_progress: {
      day: number;
      tasks_completed: number;
      total_tasks: number;
      day_complete: boolean;
    };
    streak: {
      current: number;
      longest: number;
      updated: boolean;
      broken: boolean;
      milestone?: StreakMilestone;
    };
    program_complete: boolean;
  };
  error?: string;
}

export interface UserProgress {
  enrolled: boolean;
  enrollment?: {
    id: string;
    status: string;
    started_at: string;
    completed_at?: string;
    points_earned: number;
    tasks_completed: number;
    streak_days: number;
  };
  days: DayProgress[];
  overall: {
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
  };
}

export interface DayProgress {
  day: number;
  tasks_completed: number;
  total_tasks: number;
  is_complete: boolean;
  completed_task_ids: string[];
}

export interface StreakMilestone {
  days: number;
  points: number;
  name: string;
  icon?: string;
  achieved_at?: string;
  status: 'achieved' | 'next' | 'upcoming';
  days_remaining?: number;
  progress_percent?: number;
}

export interface StreakMilestonesResponse {
  ok: boolean;
  data?: {
    current_streak: number;
    longest_streak: number;
    is_streak_active: boolean;
    last_activity?: string;
    milestones: {
      achieved: StreakMilestone[];
      upcoming: StreakMilestone[];
      next?: StreakMilestone;
    };
    points: {
      earned_from_milestones: number;
      total_possible: number;
      remaining: number;
    };
    summary: {
      milestones_achieved: number;
      milestones_remaining: number;
      total_milestones: number;
    };
  };
  error?: string;
}

export interface EnrollmentResponse {
  ok: boolean;
  data?: {
    enrollment_id: string;
    program_id: string;
    program_name: string;
    program_slug?: string;
    status: string;
    started_at: string;
    current_day: number;
    total_tasks: number;
    duration_days: number;
    message: string;
    already_enrolled?: boolean;
    re_enrolled?: boolean;
  };
  error?: string;
}
