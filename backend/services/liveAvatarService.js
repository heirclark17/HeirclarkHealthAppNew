/**
 * LiveAvatar API Service
 * Wrapper for creating, starting, and stopping LiveAvatar streaming sessions
 * Uses LiveKit-based streaming protocol
 * Docs: https://docs.liveavatar.ai
 *
 * Flow:
 *   1. Backend: POST /v1/sessions/token  (X-API-KEY) -> session_token
 *   2. Backend: POST /v1/sessions/start  (Bearer session_token) -> livekit_url + livekit_client_token
 *   3. Client:  Connect to LiveKit room with url + token
 *   4. Client:  Send speak commands via data channel topic "agent-control"
 *   5. Backend: POST /v1/sessions/stop   (Bearer session_token) -> cleanup
 */

const LIVEAVATAR_API_BASE = 'https://api.liveavatar.ai/v1';

class LiveAvatarService {
  /**
   * Check if LiveAvatar is configured with required env vars
   */
  isConfigured() {
    return !!(process.env.LIVEAVATAR_API_KEY && process.env.LIVEAVATAR_AVATAR_ID);
  }

  /**
   * Step 1: Create a session token
   * Uses X-API-KEY header with the LiveAvatar API key
   * @returns {string} session_token for subsequent API calls
   */
  async createSessionToken(avatarId, voiceId, contextId) {
    const aid = avatarId || process.env.LIVEAVATAR_AVATAR_ID;
    const vid = voiceId || process.env.LIVEAVATAR_VOICE_ID;
    const cid = contextId || process.env.LIVEAVATAR_CONTEXT_ID;
    const isSandbox = process.env.LIVEAVATAR_SANDBOX === 'true';

    const body = {
      mode: 'FULL',
      avatar_id: aid,
      is_sandbox: isSandbox,
    };

    // Add avatar persona if voice or context are configured
    if (vid || cid) {
      body.avatar_persona = {
        language: 'en',
      };
      if (vid) body.avatar_persona.voice_id = vid;
      if (cid) body.avatar_persona.context_id = cid;
    }

    console.log('[LiveAvatarService] Creating session token:', JSON.stringify({
      avatar_id: aid,
      voice_id: vid || 'default',
      context_id: cid || 'none',
      is_sandbox: isSandbox,
    }));

    const response = await fetch(`${LIVEAVATAR_API_BASE}/sessions/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.LIVEAVATAR_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[LiveAvatarService] Token creation failed:', response.status, responseText);
      throw new Error(`LiveAvatar sessions/token failed: ${response.status} ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[LiveAvatarService] Failed to parse token response:', responseText);
      throw new Error('LiveAvatar sessions/token returned non-JSON response');
    }

    const tokenData = data.data || data;
    const sessionToken = tokenData.session_token || tokenData.token;

    if (!sessionToken) {
      console.error('[LiveAvatarService] No session_token in response:', JSON.stringify(data));
      throw new Error('LiveAvatar sessions/token response missing session_token');
    }

    console.log('[LiveAvatarService] Session token created successfully');
    return sessionToken;
  }

  /**
   * Step 2: Start a session using the session token
   * Uses Bearer auth with the session token from step 1
   * @returns {{ session_id: string, livekit_url: string, livekit_client_token: string, max_session_duration: number }}
   */
  async startSession(sessionToken) {
    console.log('[LiveAvatarService] Starting session...');

    const response = await fetch(`${LIVEAVATAR_API_BASE}/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[LiveAvatarService] Start session failed:', response.status, responseText);
      throw new Error(`LiveAvatar sessions/start failed: ${response.status} ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[LiveAvatarService] Failed to parse start response:', responseText);
      throw new Error('LiveAvatar sessions/start returned non-JSON response');
    }

    const sessionData = data.data || data;

    console.log('[LiveAvatarService] Session started:', {
      session_id: sessionData.session_id,
      has_livekit_url: !!sessionData.livekit_url,
      has_livekit_client_token: !!sessionData.livekit_client_token,
      max_session_duration: sessionData.max_session_duration,
    });

    if (!sessionData.session_id || !sessionData.livekit_url || !sessionData.livekit_client_token) {
      console.error('[LiveAvatarService] Start response missing fields:', JSON.stringify(data));
      throw new Error('LiveAvatar sessions/start response missing required fields');
    }

    return {
      session_id: sessionData.session_id,
      livekit_url: sessionData.livekit_url,
      livekit_client_token: sessionData.livekit_client_token,
      max_session_duration: sessionData.max_session_duration || 0,
    };
  }

  /**
   * Step 3: Stop a session
   * Uses Bearer auth with the session token
   */
  async stopSession(sessionToken) {
    console.log('[LiveAvatarService] Stopping session...');

    const response = await fetch(`${LIVEAVATAR_API_BASE}/sessions/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LiveAvatarService] Stop session failed:', response.status, errorText);
      throw new Error(`LiveAvatar sessions/stop failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[LiveAvatarService] Session stopped successfully');
    return data;
  }

  /**
   * Combined flow: Create token + Start session
   * Returns data mapped to the frontend StreamingSession interface:
   *   { sessionId, accessToken (=livekit_client_token), url (=livekit_url), sessionToken, ... }
   */
  async createAndStartSession(avatarId, voiceId, contextId) {
    // Step 1: Get session token
    const sessionToken = await this.createSessionToken(avatarId, voiceId, contextId);

    // Step 2: Start session with that token
    const sessionData = await this.startSession(sessionToken);

    // Map to frontend-friendly field names matching StreamingSession interface
    return {
      sessionId: sessionData.session_id,
      accessToken: sessionData.livekit_client_token,  // Maps to session.accessToken in frontend
      url: sessionData.livekit_url,                    // Maps to session.url in frontend
      sessionToken: sessionToken,                       // Needed for stop/cleanup
      maxSessionDuration: sessionData.max_session_duration,
    };
  }
}

module.exports = new LiveAvatarService();
