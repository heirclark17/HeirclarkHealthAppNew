/**
 * HeyGen API Service
 * Wrapper for creating, starting, and stopping HeyGen streaming avatar sessions
 */

const HEYGEN_API_BASE = 'https://api.heygen.com/v1';

class HeyGenService {
  /**
   * Check if HeyGen is configured with required env vars
   */
  isConfigured() {
    return !!(process.env.HEYGEN_API_KEY && process.env.HEYGEN_AVATAR_ID);
  }

  /**
   * Create a new streaming session
   * @returns {{ session_id: string, access_token: string, url: string }}
   */
  async createStreamingSession(avatarId, voiceId, contextId) {
    const apiKey = process.env.HEYGEN_API_KEY;
    const aid = avatarId || process.env.HEYGEN_AVATAR_ID;
    const vid = voiceId || process.env.HEYGEN_VOICE_ID;
    const kid = contextId || process.env.HEYGEN_CONTEXT_ID;

    const body = {
      avatar_id: aid,
    };

    if (vid) {
      body.voice = { voice_id: vid };
    }

    if (kid) {
      body.knowledge_base_id = kid;
    }

    console.log('[HeyGenService] Creating streaming session for avatar:', aid);

    const response = await fetch(`${HEYGEN_API_BASE}/streaming.new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HeyGenService] Create session failed:', response.status, errorText);
      throw new Error(`HeyGen create session failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const sessionData = data.data || data;

    console.log('[HeyGenService] Session created:', sessionData.session_id);

    return {
      session_id: sessionData.session_id,
      access_token: sessionData.access_token,
      url: sessionData.url,
    };
  }

  /**
   * Start an existing streaming session
   */
  async startSession(sessionId) {
    const apiKey = process.env.HEYGEN_API_KEY;

    console.log('[HeyGenService] Starting session:', sessionId);

    const response = await fetch(`${HEYGEN_API_BASE}/streaming.start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HeyGenService] Start session failed:', response.status, errorText);
      throw new Error(`HeyGen start session failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[HeyGenService] Session started:', sessionId);
    return data;
  }

  /**
   * Stop a streaming session
   */
  async stopSession(sessionId) {
    const apiKey = process.env.HEYGEN_API_KEY;

    console.log('[HeyGenService] Stopping session:', sessionId);

    const response = await fetch(`${HEYGEN_API_BASE}/streaming.stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HeyGenService] Stop session failed:', response.status, errorText);
      throw new Error(`HeyGen stop session failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[HeyGenService] Session stopped:', sessionId);
    return data;
  }
}

module.exports = new HeyGenService();
