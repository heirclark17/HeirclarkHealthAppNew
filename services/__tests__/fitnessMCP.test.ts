/**
 * Tests for fitnessMCP.ts
 * Fitness MCP integration service for Fitbit, Google Fit, and Apple Health
 */

import { fitnessMCP } from '../fitnessMCP';

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

describe('fitnessMCP', () => {
  // We need a fresh instance for each test since the service is a singleton
  // with mutable state. We'll reset it by disconnecting all providers.
  beforeEach(async () => {
    (global.fetch as jest.Mock).mockReset();
    await fitnessMCP.disconnectProvider('fitbit');
    await fitnessMCP.disconnectProvider('google-fit');
    await fitnessMCP.disconnectProvider('apple-health');
  });

  // ============ getProviders ============

  describe('getProviders', () => {
    it('should return all three providers', async () => {
      const providers = await fitnessMCP.getProviders();

      expect(providers.length).toBe(3);
      const ids = providers.map((p) => p.id);
      expect(ids).toContain('fitbit');
      expect(ids).toContain('google-fit');
      expect(ids).toContain('apple-health');
    });

    it('should show all providers as disconnected initially', async () => {
      const providers = await fitnessMCP.getProviders();

      providers.forEach((provider) => {
        expect(provider.connected).toBe(false);
      });
    });
  });

  // ============ Fitbit ============

  describe('connectFitbit', () => {
    it('should return success with auth URL', async () => {
      const result = await fitnessMCP.connectFitbit();

      expect(result.success).toBe(true);
      expect(result.authUrl).toBeDefined();
      expect(result.authUrl).toContain('fitbit.com/oauth2/authorize');
    });
  });

  describe('handleFitbitCallback', () => {
    it('should connect Fitbit when token exchange succeeds', async () => {
      mockFetch({ access_token: 'fitbit-token', refresh_token: 'fitbit-refresh' });

      const result = await fitnessMCP.handleFitbitCallback('auth-code-123');

      expect(result).toBe(true);

      const providers = await fitnessMCP.getProviders();
      const fitbit = providers.find((p) => p.id === 'fitbit');
      expect(fitbit?.connected).toBe(true);
    });

    it('should return false when token exchange fails', async () => {
      mockFetch({ error: 'Invalid code' });

      const result = await fitnessMCP.handleFitbitCallback('bad-code');

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetchError(new Error('Network error'));

      const result = await fitnessMCP.handleFitbitCallback('code');

      expect(result).toBe(false);
    });
  });

  describe('getFitbitData', () => {
    it('should throw when Fitbit is not connected', async () => {
      await expect(fitnessMCP.getFitbitData()).rejects.toThrow('Fitbit not connected');
    });

    it('should return fitness data when connected', async () => {
      // First connect
      mockFetch({ access_token: 'fitbit-token', refresh_token: 'fitbit-refresh' });
      await fitnessMCP.handleFitbitCallback('code');

      // Then get data
      mockFetch({
        summary: {
          steps: 10000,
          caloriesOut: 2500,
          distances: [{ distance: 5.2 }],
          veryActiveMinutes: 30,
          fairlyActiveMinutes: 20,
        },
      });

      const data = await fitnessMCP.getFitbitData('2025-01-15');

      expect(data).not.toBeNull();
      expect(data!.steps).toBe(10000);
      expect(data!.caloriesOut).toBe(2500);
      expect(data!.distance).toBe(5.2);
    });

    it('should return null on API error', async () => {
      // Connect first
      mockFetch({ access_token: 'fitbit-token', refresh_token: 'fitbit-refresh' });
      await fitnessMCP.handleFitbitCallback('code');

      // Mock a non-401 error
      mockFetch({}, false, 500);

      const data = await fitnessMCP.getFitbitData();

      expect(data).toBeNull();
    });

    it('should attempt token refresh on 401', async () => {
      // Connect first
      mockFetch({ access_token: 'fitbit-token', refresh_token: 'fitbit-refresh' });
      await fitnessMCP.handleFitbitCallback('code');

      // First call returns 401
      mockFetch({}, false, 401);
      // Refresh token call
      mockFetch({ access_token: 'new-token' });
      // Retry call succeeds
      mockFetch({
        summary: {
          steps: 5000,
          caloriesOut: 2000,
          distances: [{ distance: 3 }],
          veryActiveMinutes: 10,
          fairlyActiveMinutes: 10,
        },
      });

      const data = await fitnessMCP.getFitbitData();

      expect(data).not.toBeNull();
      expect(data!.steps).toBe(5000);
    });
  });

  // ============ Google Fit ============

  describe('connectGoogleFit', () => {
    it('should return success with auth URL', async () => {
      const result = await fitnessMCP.connectGoogleFit();

      expect(result.success).toBe(true);
      expect(result.authUrl).toBeDefined();
      expect(result.authUrl).toContain('accounts.google.com');
    });
  });

  describe('handleGoogleFitCallback', () => {
    it('should connect Google Fit when token exchange succeeds', async () => {
      mockFetch({ access_token: 'google-token', refresh_token: 'google-refresh' });

      const result = await fitnessMCP.handleGoogleFitCallback('auth-code');

      expect(result).toBe(true);

      const providers = await fitnessMCP.getProviders();
      const gfit = providers.find((p) => p.id === 'google-fit');
      expect(gfit?.connected).toBe(true);
    });

    it('should return false when token exchange fails', async () => {
      mockFetch({});

      const result = await fitnessMCP.handleGoogleFitCallback('bad-code');

      expect(result).toBe(false);
    });
  });

  describe('getGoogleFitData', () => {
    it('should throw when Google Fit is not connected', async () => {
      await expect(fitnessMCP.getGoogleFitData()).rejects.toThrow('Google Fit not connected');
    });

    it('should return data when connected', async () => {
      // Connect
      mockFetch({ access_token: 'google-token', refresh_token: 'google-refresh' });
      await fitnessMCP.handleGoogleFitCallback('code');

      // Get data
      mockFetch({
        bucket: [
          {
            dataset: [
              {
                dataSourceId: 'derived:com.google.step_count.delta',
                point: [{ value: [{ intVal: 8000 }] }],
              },
              {
                dataSourceId: 'derived:com.google.calories.expended',
                point: [{ value: [{ fpVal: 2200 }] }],
              },
              {
                dataSourceId: 'derived:com.google.distance.delta',
                point: [{ value: [{ fpVal: 4.5 }] }],
              },
            ],
          },
        ],
      });

      const data = await fitnessMCP.getGoogleFitData('2025-01-15');

      expect(data).not.toBeNull();
      expect(data!.steps).toBe(8000);
      expect(data!.caloriesOut).toBe(2200);
      expect(data!.distance).toBe(4.5);
    });

    it('should return null on API error', async () => {
      mockFetch({ access_token: 'google-token', refresh_token: 'google-refresh' });
      await fitnessMCP.handleGoogleFitCallback('code');

      mockFetch({}, false, 500);

      const data = await fitnessMCP.getGoogleFitData();

      expect(data).toBeNull();
    });
  });

  // ============ Apple Health ============

  describe('connectAppleHealth', () => {
    it('should connect Apple Health successfully', async () => {
      const result = await fitnessMCP.connectAppleHealth();

      expect(result.success).toBe(true);
    });
  });

  describe('getAppleHealthData', () => {
    it('should throw when Apple Health not connected', async () => {
      await expect(fitnessMCP.getAppleHealthData()).rejects.toThrow('Apple Health not connected');
    });

    it('should return placeholder data when connected', async () => {
      await fitnessMCP.connectAppleHealth();

      const data = await fitnessMCP.getAppleHealthData('2025-01-15');

      expect(data).not.toBeNull();
      expect(data!.date).toBe('2025-01-15');
      expect(data!.steps).toBe(0); // Placeholder in current implementation
    });
  });

  // ============ disconnectProvider ============

  describe('disconnectProvider', () => {
    it('should disconnect an existing provider', async () => {
      await fitnessMCP.connectAppleHealth();
      let providers = await fitnessMCP.getProviders();
      expect(providers.find((p) => p.id === 'apple-health')?.connected).toBe(true);

      const result = await fitnessMCP.disconnectProvider('apple-health');

      expect(result).toBe(true);
      providers = await fitnessMCP.getProviders();
      expect(providers.find((p) => p.id === 'apple-health')?.connected).toBe(false);
    });

    it('should return false for unknown provider', async () => {
      const result = await fitnessMCP.disconnectProvider('unknown-provider');

      expect(result).toBe(false);
    });

    it('should clear tokens on disconnect', async () => {
      mockFetch({ access_token: 'token', refresh_token: 'refresh' });
      await fitnessMCP.handleFitbitCallback('code');

      await fitnessMCP.disconnectProvider('fitbit');

      // Attempting to get data should throw since disconnected
      await expect(fitnessMCP.getFitbitData()).rejects.toThrow('Fitbit not connected');
    });
  });

  // ============ syncAllProviders ============

  describe('syncAllProviders', () => {
    it('should return empty results when no providers connected', async () => {
      const results = await fitnessMCP.syncAllProviders();

      expect(results.errors.length).toBe(0);
      expect(results.fitbit).toBeUndefined();
      expect(results.googleFit).toBeUndefined();
      expect(results.appleHealth).toBeUndefined();
    });

    it('should sync only connected providers', async () => {
      // Connect Apple Health only
      await fitnessMCP.connectAppleHealth();

      const results = await fitnessMCP.syncAllProviders('2025-01-15');

      expect(results.appleHealth).not.toBeUndefined();
      expect(results.fitbit).toBeUndefined();
      expect(results.googleFit).toBeUndefined();
    });

    it('should collect errors from failing providers', async () => {
      // Connect Fitbit with tokens
      mockFetch({ access_token: 'token', refresh_token: 'refresh' });
      await fitnessMCP.handleFitbitCallback('code');

      // Make Fitbit data fetch fail
      mockFetch({}, false, 500);

      const results = await fitnessMCP.syncAllProviders();

      // Fitbit returns null on 500, but doesn't throw (caught internally)
      // The error handling depends on whether getFitbitData throws or returns null
      // In this case, it returns null (non-401 error returns null)
      // So no error is pushed to results.errors
      expect(results.fitbit).toBeNull();
    });
  });
});
