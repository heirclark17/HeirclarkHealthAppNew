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
   * Get auth headers using x-api-key directly
   */
  _getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': process.env.HEYGEN_API_KEY,
    };
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

    const body = {
      avatar_name: aid,           // Official SDK uses avatar_name
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
      headers: this._getAuthHeaders(),
      body: JSON.stringify(body),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[HeyGenService] Create session failed:', response.status, responseText);
      throw new Error(`HeyGen streaming.new failed: ${response.status} ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[HeyGenService] Failed to parse response:', responseText);
      throw new Error('HeyGen streaming.new returned non-JSON response');
    }

    const sessionData = data.data || data;

    console.log('[HeyGenService] Session created:', {
      session_id: sessionData.session_id,
      has_url: !!sessionData.url,
      has_access_token: !!sessionData.access_token,
      is_paid: sessionData.is_paid,
      duration_limit: sessionData.session_duration_limit,
    });

    if (!sessionData.session_id || !sessionData.url || !sessionData.access_token) {
      console.error('[HeyGenService] Response missing fields. Full response:', JSON.stringify(data));
      throw new Error('HeyGen session response missing required fields (session_id, url, or access_token)');
    }

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
    console.log('[HeyGenService] Starting session:', sessionId);

    const response = await fetch(`${HEYGEN_API_BASE}/streaming.start`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HeyGenService] Start session failed:', response.status, errorText);
      throw new Error(`HeyGen streaming.start failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[HeyGenService] Session started successfully:', sessionId);
    return data;
  }

  /**
   * Stop a streaming session
   */
  async stopSession(sessionId) {
    console.log('[HeyGenService] Stopping session:', sessionId);

    const response = await fetch(`${HEYGEN_API_BASE}/streaming.stop`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HeyGenService] Stop session failed:', response.status, errorText);
      throw new Error(`HeyGen streaming.stop failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[HeyGenService] Session stopped:', sessionId);
    return data;
  }
}

module.exports = new HeyGenService();
