/**
 * Avatar Service
 * Handles communication with the HeyGen LiveAvatar backend
 */

// Use environment variable for API URL, fallback to Railway production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://heirclarkinstacartbackend-production.up.railway.app';

export interface GoalData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmr: number;
  tdee: number;
  bmi: number;
  dailyDelta?: number;
  weeklyChange?: number;
  totalWeeks?: number;
}

export interface UserInputs {
  primaryGoal: string;
  activityLevel: string;
  currentWeight: number | null;
  targetWeight: number | null;
  heightFt: number | null;
  heightIn: number | null;
  age: number | null;
  sex: string | null;
  dietStyle: string;
  workoutsPerWeek: number;
  weightUnit: string;
  userName?: string | null; // User's first name for personalized coaching
}

export interface MealPlanCoachingRequest {
  userId: string;
  userName?: string | null; // User's first name for personalized coaching
  weeklyPlan: any[];
  selectedDayIndex: number;
  userGoals: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
  };
  preferences?: {
    dietStyle?: string;
    allergies?: string[];
  };
}

export interface StreamingSession {
  sessionId: string;
  accessToken: string;
  url: string;
  roomName?: string;
  sessionDurationLimit?: number;
  isPaid?: boolean;
  avatarId?: string;
  voiceId?: string;
}

export interface CoachingResponse {
  ok: boolean;
  streamingAvailable: boolean;
  token?: string;
  session?: StreamingSession;
  script: string;
  defaultAvatarId?: string | null;
  defaultVoiceId?: string | null;
  message?: string;
  error?: string;
}

export interface AvatarConfigResponse {
  ok: boolean;
  configured: boolean;
  features: {
    streaming: boolean;
    voiceChat: boolean;
  };
}

export interface SpeakResponse {
  ok: boolean;
  taskId?: string;
  error?: string;
}

class AvatarService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Check if avatar service is configured
   */
  async checkConfig(): Promise<AvatarConfigResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/avatar/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          ok: false,
          configured: false,
          features: { streaming: false, voiceChat: false },
        };
      }

      return await response.json();
    } catch (error) {
      console.error('[AvatarService] Config check failed:', error);
      return {
        ok: false,
        configured: false,
        features: { streaming: false, voiceChat: false },
      };
    }
  }

  /**
   * Get goal coaching script and streaming session (combined flow)
   * 1. Get token + script from backend
   * 2. Start session directly with LiveAvatar API using the token
   */
  async getGoalCoaching(
    userId: string,
    goalData: GoalData,
    userInputs: UserInputs
  ): Promise<CoachingResponse> {
    try {
      console.log('[AvatarService] Requesting goal coaching with streaming...');

      // Step 1: Get coaching script and session token from backend
      const coachingResponse = await fetch(`${this.baseUrl}/api/v1/avatar/coach/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          goalData,
          userInputs,
        }),
      });

      const coachingData = await coachingResponse.json();

      if (!coachingResponse.ok || !coachingData.ok) {
        console.error('[AvatarService] Goal coaching error:', coachingData);
        return {
          ok: false,
          streamingAvailable: false,
          script: '',
          error: coachingData.error || 'Failed to get coaching',
        };
      }

      console.log('[AvatarService] Got coaching response:', {
        streamingAvailable: coachingData.streamingAvailable,
        hasToken: !!coachingData.token,
        hasSession: !!coachingData.session,
        sessionUrl: coachingData.session?.url ? 'present' : 'missing',
        sessionToken: coachingData.session?.accessToken ? 'present' : 'missing',
      });

      // If streaming not available, return script only
      if (!coachingData.streamingAvailable) {
        return {
          ok: true,
          streamingAvailable: false,
          script: coachingData.script,
          message: coachingData.message,
        };
      }

      // Backend now handles full session creation - use session details directly
      if (coachingData.session && coachingData.session.url && coachingData.session.accessToken) {
        console.log('[AvatarService] Using session from backend:', coachingData.session.sessionId);
        return {
          ok: true,
          streamingAvailable: true,
          token: coachingData.token,
          script: coachingData.script,
          defaultAvatarId: coachingData.defaultAvatarId,
          defaultVoiceId: coachingData.defaultVoiceId,
          session: coachingData.session,
        };
      }

      // Session details missing - fall back to script only
      console.warn('[AvatarService] Backend returned streamingAvailable but no valid session details');
      return {
        ok: true,
        streamingAvailable: false,
        script: coachingData.script,
        message: 'Streaming session details unavailable. Text coaching provided.',
      };
    } catch (error) {
      console.error('[AvatarService] Goal coaching request failed:', error);
      return {
        ok: false,
        streamingAvailable: false,
        script: '',
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Send text for avatar to speak via LiveKit data channel
   * Note: For LiveAvatar, speaking is done via LiveKit events, not REST API
   * This method is kept for compatibility but actual speaking happens in the WebView
   */
  async speak(sessionId: string, text: string, taskType: 'talk' | 'repeat' = 'repeat'): Promise<SpeakResponse> {
    // LiveAvatar uses LiveKit events for speaking, not REST API
    // The WebView handles this directly via the SDK
    console.log('[AvatarService] Speak command (handled by WebView):', text.substring(0, 50) + '...');
    return { ok: true };
  }

  /**
   * Stop/close a streaming session
   * Note: Session cleanup is handled by the WebView via room.disconnect()
   */
  async stopSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
    console.log('[AvatarService] Stop session requested:', sessionId);
    // Session cleanup is handled by the WebView's room.disconnect()
    // No need to call external API - LiveKit handles cleanup automatically
    return { ok: true };
  }

  /**
   * Get a session token for streaming
   */
  async getSessionToken(userId: string): Promise<{ ok: boolean; token?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/avatar/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { ok: false, error: data.error || 'Failed to get token' };
      }

      return { ok: true, token: data.token };
    } catch (error) {
      console.error('[AvatarService] Token request failed:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get personalized meal plan coaching script
   * Generates AI-powered coaching that discusses the user's specific meal plan
   */
  async getMealPlanCoaching(request: MealPlanCoachingRequest): Promise<CoachingResponse> {
    try {
      console.log('[AvatarService] Requesting meal plan coaching...');
      console.log('[AvatarService] Day:', request.selectedDayIndex, 'Meals:', request.weeklyPlan[request.selectedDayIndex]?.meals?.length);

      // Call the backend for meal plan coaching (same pattern as goal coaching)
      const response = await fetch(`${this.baseUrl}/api/v1/avatar/coach/meal-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        console.error('[AvatarService] Meal plan coaching error:', data);
        return {
          ok: false,
          streamingAvailable: false,
          script: '',
          error: data.error || 'Failed to get meal plan coaching',
        };
      }

      console.log('[AvatarService] Got meal plan coaching:', {
        streamingAvailable: data.streamingAvailable,
        hasSession: !!data.session,
        hasToken: !!data.token,
        scriptLength: data.script?.length,
      });

      // If streaming not available, return script only
      if (!data.streamingAvailable) {
        return {
          ok: true,
          streamingAvailable: false,
          script: data.script,
          message: data.message,
        };
      }

      // Backend handles full session creation - use session details directly
      if (data.session && data.session.url && data.session.accessToken) {
        console.log('[AvatarService] Using session from backend:', data.session.sessionId);
        return {
          ok: true,
          streamingAvailable: true,
          token: data.token,
          script: data.script,
          defaultAvatarId: data.defaultAvatarId,
          defaultVoiceId: data.defaultVoiceId,
          session: data.session,
        };
      }

      // Session details missing - fall back to script only
      console.warn('[AvatarService] Backend returned streamingAvailable but no valid session details');
      return {
        ok: true,
        streamingAvailable: false,
        script: data.script,
        message: 'Streaming session details unavailable. Text coaching provided.',
      };

    } catch (error) {
      console.error('[AvatarService] Meal plan coaching request failed:', error);
      return {
        ok: false,
        streamingAvailable: false,
        script: '',
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

export const avatarService = new AvatarService();
