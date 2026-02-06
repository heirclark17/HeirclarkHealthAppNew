/**
 * HeyGen API Service
 * Wrapper for creating, starting, and stopping HeyGen streaming avatar sessions
 * Uses v2 LiveKit-based streaming protocol
 * Docs: https://docs.heygen.com/reference/streaming-api
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
   * Create a short-lived session token from the permanent API key.
   * Recommended for security - avoids exposing the permanent key.
   * @returns {string} Session token for Bearer auth
   */
  async createSessionToken() {
    const apiKey = process.env.HEYGEN_API_KEY;

    const response = await fetch(`${HEYGEN_API_BASE}/streaming.create_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HeyGenService] Create token failed:', response.status, errorText);
      throw new Error(`HeyGen create token failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const token = data.data?.token || data.token;
    console.log('[HeyGenService] Session token created');
    return token;
  }

  /**
   * Create a new streaming session using v2 (LiveKit) protocol.
   * Returns LiveKit connection credentials.
   * @returns {{ session_id: string, access_token: string, url: string }}
   */
  async createStreamingSession(avatarId, voiceId, knowledgeBaseId) {
    const aid = avatarId || process.env.HEYGEN_AVATAR_ID;
    const vid = voiceId || process.env.HEYGEN_VOICE_ID;
    const kid = knowledgeBaseId || process.env.HEYGEN_CONTEXT_ID;

    // Get a short-lived session token first
    const sessionToken = await this.createSessionToken();

    const body = {
      avatar_name: aid,           // SDK uses avatar_name, not avatar_id
      version: 'v2',              // Required for LiveKit-based streaming
      video_encoding: 'H264',     // Better device compatibility than VP8
      quality: 'medium',          // medium = 480p/1000kbps (good for mobile)
    };

    if (vid) {
      body.voice = { voice_id: vid };
    }

    if (kid) {
      body.knowledge_base_id = kid;
    }

    console.log('[HeyGenService] Creating v2 streaming session:', JSON.stringify({
      avatar_name: aid,
      voice_id: vid || 'default',
      knowledge_base_id: kid || 'none',
    }));

    const response = await fetch(`${HEYGEN_API_BASE}/streaming.new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
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

    console.log('[HeyGenService] Session created:', {
      session_id: sessionData.session_id,
      has_url: !!sessionData.url,
      has_access_token: !!sessionData.access_token,
      is_paid: sessionData.is_paid,
      duration_limit: sessionData.session_duration_limit,
    });

    if (!sessionData.session_id || !sessionData.url || !sessionData.access_token) {
      throw new Error('HeyGen session response missing required fields (session_id, url, or access_token)');
    }

    // Store the session token for subsequent calls (start, stop)
    this._lastSessionToken = sessionToken;

    return {
      session_id: sessionData.session_id,
      access_token: sessionData.access_token,
      url: sessionData.url,
      session_duration_limit: sessionData.session_duration_limit,
      is_paid: sessionData.is_paid,
    };
  }

  /**
   * Start an existing streaming session.
   * Must be called after createStreamingSession and before LiveKit connect.
   */
  async startSession(sessionId) {
    // Use the session token from createStreamingSession, or fall back to API key
    const authHeader = this._lastSessionToken
      ? { 'Authorization': `Bearer ${this._lastSessionToken}` }
      : { 'x-api-key': process.env.HEYGEN_API_KEY };

    console.log('[HeyGenService] Starting session:', sessionId);

    const response = await fetch(`${HEYGEN_API_BASE}/streaming.start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HeyGenService] Start session failed:', response.status, errorText);
      throw new Error(`HeyGen start session failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[HeyGenService] Session started successfully:', sessionId);
    return data;
  }

  /**
   * Stop a streaming session
   */
  async stopSession(sessionId) {
    const authHeader = this._lastSessionToken
      ? { 'Authorization': `Bearer ${this._lastSessionToken}` }
      : { 'x-api-key': process.env.HEYGEN_API_KEY };

    console.log('[HeyGenService] Stopping session:', sessionId);

    const response = await fetch(`${HEYGEN_API_BASE}/streaming.stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
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
    this._lastSessionToken = null;
    return data;
  }
}

module.exports = new HeyGenService();
