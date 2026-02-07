/**
 * Tests for avatarService.ts
 * Avatar/HeyGen LiveAvatar backend communication testing
 */

import { avatarService } from '../avatarService';

// Helper to mock fetch responses
function mockFetch(data: any, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function mockFetchError(error: Error) {
  (global.fetch as jest.Mock).mockRejectedValueOnce(error);
}

describe('avatarService', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  // ============ checkConfig ============

  describe('checkConfig', () => {
    it('should return config when backend responds OK', async () => {
      const mockConfig = {
        ok: true,
        configured: true,
        features: { streaming: true, voiceChat: true },
      };
      mockFetch(mockConfig);

      const result = await avatarService.checkConfig();

      expect(result.ok).toBe(true);
      expect(result.configured).toBe(true);
      expect(result.features.streaming).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/avatar/config'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return unconfigured when response is not ok', async () => {
      mockFetch({}, false, 500);

      const result = await avatarService.checkConfig();

      expect(result.ok).toBe(false);
      expect(result.configured).toBe(false);
      expect(result.features.streaming).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockFetchError(new Error('Network error'));

      const result = await avatarService.checkConfig();

      expect(result.ok).toBe(false);
      expect(result.configured).toBe(false);
    });
  });

  // ============ getGoalCoaching ============

  describe('getGoalCoaching', () => {
    const userId = 'user-123';
    const goalData = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 67,
      bmr: 1800,
      tdee: 2500,
      bmi: 25,
    };
    const userInputs = {
      primaryGoal: 'lose',
      activityLevel: 'moderate',
      currentWeight: 180,
      targetWeight: 160,
      heightFt: 5,
      heightIn: 10,
      age: 30,
      sex: 'male',
      dietStyle: 'balanced',
      workoutsPerWeek: 4,
      weightUnit: 'lb',
    };

    it('should return coaching response with streaming session', async () => {
      mockFetch({
        ok: true,
        streamingAvailable: true,
        token: 'test-token',
        script: 'Great job setting your goals!',
        defaultAvatarId: 'avatar-1',
        defaultVoiceId: 'voice-1',
        session: {
          sessionId: 'sess-1',
          accessToken: 'access-token',
          url: 'wss://livekit.example.com',
        },
      });

      const result = await avatarService.getGoalCoaching(userId, goalData, userInputs);

      expect(result.ok).toBe(true);
      expect(result.streamingAvailable).toBe(true);
      expect(result.script).toBe('Great job setting your goals!');
      expect(result.token).toBe('test-token');
      expect(result.session).toBeDefined();
      expect(result.session!.sessionId).toBe('sess-1');
    });

    it('should return script-only when streaming not available', async () => {
      mockFetch({
        ok: true,
        streamingAvailable: false,
        script: 'Here is your coaching script.',
        message: 'Streaming unavailable',
      });

      const result = await avatarService.getGoalCoaching(userId, goalData, userInputs);

      expect(result.ok).toBe(true);
      expect(result.streamingAvailable).toBe(false);
      expect(result.script).toBe('Here is your coaching script.');
      expect(result.session).toBeUndefined();
    });

    it('should fall back to script when session details are missing', async () => {
      mockFetch({
        ok: true,
        streamingAvailable: true,
        script: 'Script text',
        session: { sessionId: 'sess-1' }, // missing url and accessToken
      });

      const result = await avatarService.getGoalCoaching(userId, goalData, userInputs);

      expect(result.ok).toBe(true);
      expect(result.streamingAvailable).toBe(false);
      expect(result.script).toBe('Script text');
    });

    it('should handle backend error response', async () => {
      mockFetch({ ok: false, error: 'Server error' }, false, 500);

      const result = await avatarService.getGoalCoaching(userId, goalData, userInputs);

      expect(result.ok).toBe(false);
      expect(result.streamingAvailable).toBe(false);
      expect(result.script).toBe('');
      expect(result.error).toBeTruthy();
    });

    it('should handle network errors', async () => {
      mockFetchError(new Error('Connection refused'));

      const result = await avatarService.getGoalCoaching(userId, goalData, userInputs);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('should send correct payload', async () => {
      mockFetch({ ok: true, streamingAvailable: false, script: 'test' });

      await avatarService.getGoalCoaching(userId, goalData, userInputs);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/avatar/coach/goals'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(userId),
        })
      );
    });
  });

  // ============ createChatSession ============

  describe('createChatSession', () => {
    it('should create a chat session with streaming', async () => {
      mockFetch({
        ok: true,
        streamingAvailable: true,
        token: 'chat-token',
        greeting: 'Hello! How can I help?',
        session: {
          sessionId: 'chat-sess-1',
          accessToken: 'chat-access',
          url: 'wss://chat.example.com',
        },
      });

      const result = await avatarService.createChatSession('user-1', 'general', 'Alice');

      expect(result.ok).toBe(true);
      expect(result.streamingAvailable).toBe(true);
      expect(result.session!.sessionId).toBe('chat-sess-1');
      expect(result.script).toBe('Hello! How can I help?');
    });

    it('should return script-only response when streaming not available', async () => {
      mockFetch({
        ok: true,
        streamingAvailable: false,
        greeting: 'Hi there!',
      });

      const result = await avatarService.createChatSession('user-1');

      expect(result.ok).toBe(true);
      expect(result.streamingAvailable).toBe(false);
      expect(result.script).toBe('Hi there!');
    });

    it('should handle backend errors', async () => {
      mockFetch({ ok: false, error: 'Quota exceeded' }, false, 429);

      const result = await avatarService.createChatSession('user-1');

      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle network errors', async () => {
      mockFetchError(new Error('Timeout'));

      const result = await avatarService.createChatSession('user-1');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Timeout');
    });
  });

  // ============ stopChatSession ============

  describe('stopChatSession', () => {
    it('should stop a chat session successfully', async () => {
      mockFetch({ ok: true });

      const result = await avatarService.stopChatSession('sess-1');

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/avatar/coach/stop-session'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ sessionId: 'sess-1' }),
        })
      );
    });

    it('should return ok even on network error (does not fail on cleanup)', async () => {
      mockFetchError(new Error('Network error'));

      const result = await avatarService.stopChatSession('sess-1');

      expect(result.ok).toBe(true);
    });
  });

  // ============ speak ============

  describe('speak', () => {
    it('should return ok (handled by WebView)', async () => {
      const result = await avatarService.speak('sess-1', 'Hello there!');

      expect(result.ok).toBe(true);
    });

    it('should accept optional taskType', async () => {
      const result = await avatarService.speak('sess-1', 'Hello', 'talk');

      expect(result.ok).toBe(true);
    });
  });

  // ============ stopSession ============

  describe('stopSession', () => {
    it('should return ok (handled by WebView room.disconnect)', async () => {
      const result = await avatarService.stopSession('sess-1');

      expect(result.ok).toBe(true);
    });
  });

  // ============ getSessionToken ============

  describe('getSessionToken', () => {
    it('should return token on success', async () => {
      mockFetch({ token: 'session-token-123' });

      const result = await avatarService.getSessionToken('user-1');

      expect(result.ok).toBe(true);
      expect(result.token).toBe('session-token-123');
    });

    it('should return error when backend fails', async () => {
      mockFetch({ error: 'Invalid user' }, false, 400);

      const result = await avatarService.getSessionToken('user-1');

      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle network errors', async () => {
      mockFetchError(new Error('DNS resolution failed'));

      const result = await avatarService.getSessionToken('user-1');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('DNS resolution failed');
    });
  });

  // ============ getMealPlanCoaching ============

  describe('getMealPlanCoaching', () => {
    const mockRequest = {
      userId: 'user-1',
      userName: 'Alice',
      weeklyPlan: [{ meals: [{ name: 'Chicken Salad' }] }],
      selectedDayIndex: 0,
      userGoals: {
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 67,
      },
    };

    it('should return meal plan coaching with streaming', async () => {
      mockFetch({
        ok: true,
        streamingAvailable: true,
        token: 'meal-token',
        script: 'Here is your meal plan coaching...',
        defaultAvatarId: 'avatar-1',
        defaultVoiceId: 'voice-1',
        session: {
          sessionId: 'meal-sess-1',
          accessToken: 'meal-access',
          url: 'wss://meal.example.com',
        },
      });

      const result = await avatarService.getMealPlanCoaching(mockRequest);

      expect(result.ok).toBe(true);
      expect(result.streamingAvailable).toBe(true);
      expect(result.script).toContain('meal plan coaching');
      expect(result.session!.sessionId).toBe('meal-sess-1');
    });

    it('should return script-only when streaming not available', async () => {
      mockFetch({
        ok: true,
        streamingAvailable: false,
        script: 'Your meals look great!',
        message: 'No streaming',
      });

      const result = await avatarService.getMealPlanCoaching(mockRequest);

      expect(result.ok).toBe(true);
      expect(result.streamingAvailable).toBe(false);
      expect(result.script).toBe('Your meals look great!');
    });

    it('should fall back to script when session details incomplete', async () => {
      mockFetch({
        ok: true,
        streamingAvailable: true,
        script: 'Coaching text',
        session: { sessionId: 'sess' }, // missing url/accessToken
      });

      const result = await avatarService.getMealPlanCoaching(mockRequest);

      expect(result.ok).toBe(true);
      expect(result.streamingAvailable).toBe(false);
    });

    it('should handle backend errors', async () => {
      mockFetch({ ok: false, error: 'Internal error' }, false, 500);

      const result = await avatarService.getMealPlanCoaching(mockRequest);

      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle network errors', async () => {
      mockFetchError(new Error('Network failure'));

      const result = await avatarService.getMealPlanCoaching(mockRequest);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Network failure');
    });
  });
});
