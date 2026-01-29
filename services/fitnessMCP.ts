// Fitness MCP Integration Service
// Connects to Fitbit, Google Fit, and Apple Health MCPs

export interface FitnessProvider {
  id: 'fitbit' | 'google-fit' | 'apple-health';
  name: string;
  connected: boolean;
  lastSync?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface FitnessData {
  date: string;
  steps: number;
  caloriesOut: number;
  distance: number;
  heartRate?: number;
  activeMinutes?: number;
  sleep?: {
    duration: number;
    quality: string;
  };
}

class FitnessMCPService {
  private providers: Map<string, FitnessProvider> = new Map();

  constructor() {
    // Initialize provider states
    this.providers.set('fitbit', {
      id: 'fitbit',
      name: 'Fitbit',
      connected: false,
    });
    this.providers.set('google-fit', {
      id: 'google-fit',
      name: 'Google Fit',
      connected: false,
    });
    this.providers.set('apple-health', {
      id: 'apple-health',
      name: 'Apple Health',
      connected: false,
    });
  }

  // Get all providers and their connection status
  async getProviders(): Promise<FitnessProvider[]> {
    return Array.from(this.providers.values());
  }

  // Connect to Fitbit
  async connectFitbit(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    try {
      // For Fitbit, we need to initiate OAuth flow
      // This would typically open a browser window for user authorization
      const authUrl = this.getFitbitAuthUrl();

      return {
        success: true,
        authUrl,
      };
    } catch (error) {
      // console.error('Fitbit connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Handle Fitbit OAuth callback
  async handleFitbitCallback(code: string): Promise<boolean> {
    try {
      // Exchange authorization code for access token
      // This would call the Fitbit MCP server
      const tokenResponse = await this.exchangeFitbitCode(code);

      if (tokenResponse.access_token) {
        const provider = this.providers.get('fitbit');
        if (provider) {
          provider.connected = true;
          provider.accessToken = tokenResponse.access_token;
          provider.refreshToken = tokenResponse.refresh_token;
          provider.lastSync = new Date().toISOString();
          this.providers.set('fitbit', provider);
        }
        return true;
      }
      return false;
    } catch (error) {
      // console.error('Fitbit callback error:', error);
      return false;
    }
  }

  // Get Fitbit data
  async getFitbitData(date?: string): Promise<FitnessData | null> {
    const provider = this.providers.get('fitbit');
    if (!provider?.connected || !provider.accessToken) {
      throw new Error('Fitbit not connected');
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Call Fitbit API through MCP
      const response = await fetch('https://api.fitbit.com/1/user/-/activities/date/' + targetDate + '.json', {
        headers: {
          'Authorization': `Bearer ${provider.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          await this.refreshFitbitToken();
          return this.getFitbitData(date);
        }
        throw new Error('Failed to fetch Fitbit data');
      }

      const data = await response.json();

      return {
        date: targetDate,
        steps: data.summary?.steps || 0,
        caloriesOut: data.summary?.caloriesOut || 0,
        distance: data.summary?.distances?.[0]?.distance || 0,
        activeMinutes: data.summary?.veryActiveMinutes + data.summary?.fairlyActiveMinutes || 0,
      };
    } catch (error) {
      // console.error('Get Fitbit data error:', error);
      return null;
    }
  }

  // Connect to Google Fit
  async connectGoogleFit(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    try {
      const authUrl = this.getGoogleFitAuthUrl();

      return {
        success: true,
        authUrl,
      };
    } catch (error) {
      // console.error('Google Fit connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Handle Google Fit OAuth callback
  async handleGoogleFitCallback(code: string): Promise<boolean> {
    try {
      const tokenResponse = await this.exchangeGoogleFitCode(code);

      if (tokenResponse.access_token) {
        const provider = this.providers.get('google-fit');
        if (provider) {
          provider.connected = true;
          provider.accessToken = tokenResponse.access_token;
          provider.refreshToken = tokenResponse.refresh_token;
          provider.lastSync = new Date().toISOString();
          this.providers.set('google-fit', provider);
        }
        return true;
      }
      return false;
    } catch (error) {
      // console.error('Google Fit callback error:', error);
      return false;
    }
  }

  // Get Google Fit data
  async getGoogleFitData(date?: string): Promise<FitnessData | null> {
    const provider = this.providers.get('google-fit');
    if (!provider?.connected || !provider.accessToken) {
      throw new Error('Google Fit not connected');
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const startTime = new Date(targetDate).getTime();
      const endTime = startTime + 86400000; // +24 hours

      // Call Google Fit API through MCP
      const response = await fetch(
        'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [
              { dataTypeName: 'com.google.step_count.delta' },
              { dataTypeName: 'com.google.calories.expended' },
              { dataTypeName: 'com.google.distance.delta' },
            ],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: startTime,
            endTimeMillis: endTime,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshGoogleFitToken();
          return this.getGoogleFitData(date);
        }
        throw new Error('Failed to fetch Google Fit data');
      }

      const data = await response.json();

      return {
        date: targetDate,
        steps: this.extractGoogleFitValue(data, 'step_count') || 0,
        caloriesOut: this.extractGoogleFitValue(data, 'calories') || 0,
        distance: this.extractGoogleFitValue(data, 'distance') || 0,
      };
    } catch (error) {
      // console.error('Get Google Fit data error:', error);
      return null;
    }
  }

  // Connect to Apple Health
  async connectAppleHealth(): Promise<{ success: boolean; error?: string }> {
    try {
      // Apple Health on iOS uses HealthKit, not OAuth
      // We would use expo-health or similar library
      const provider = this.providers.get('apple-health');
      if (provider) {
        // Check if we have HealthKit permissions
        // This would typically use a native module
        provider.connected = true;
        provider.lastSync = new Date().toISOString();
        this.providers.set('apple-health', provider);
      }

      return { success: true };
    } catch (error) {
      // console.error('Apple Health connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get Apple Health data
  async getAppleHealthData(date?: string): Promise<FitnessData | null> {
    const provider = this.providers.get('apple-health');
    if (!provider?.connected) {
      throw new Error('Apple Health not connected');
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      // This would use expo-health or react-native-health
      // For now, return mock structure
      // In production, you'd read from HealthKit

      return {
        date: targetDate,
        steps: 0,
        caloriesOut: 0,
        distance: 0,
      };
    } catch (error) {
      // console.error('Get Apple Health data error:', error);
      return null;
    }
  }

  // Disconnect a provider
  async disconnectProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.connected = false;
      provider.accessToken = undefined;
      provider.refreshToken = undefined;
      provider.lastSync = undefined;
      this.providers.set(providerId, provider);
      return true;
    }
    return false;
  }

  // Sync all connected providers
  async syncAllProviders(date?: string): Promise<{
    fitbit?: FitnessData | null;
    googleFit?: FitnessData | null;
    appleHealth?: FitnessData | null;
    errors: string[];
  }> {
    const results: any = { errors: [] };

    // Sync Fitbit
    const fitbit = this.providers.get('fitbit');
    if (fitbit?.connected) {
      try {
        results.fitbit = await this.getFitbitData(date);
      } catch (error) {
        results.errors.push(`Fitbit: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Sync Google Fit
    const googleFit = this.providers.get('google-fit');
    if (googleFit?.connected) {
      try {
        results.googleFit = await this.getGoogleFitData(date);
      } catch (error) {
        results.errors.push(`Google Fit: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Sync Apple Health
    const appleHealth = this.providers.get('apple-health');
    if (appleHealth?.connected) {
      try {
        results.appleHealth = await this.getAppleHealthData(date);
      } catch (error) {
        results.errors.push(`Apple Health: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  // Private helper methods

  private getFitbitAuthUrl(): string {
    // In production, this would come from environment variables
    const clientId = 'YOUR_FITBIT_CLIENT_ID';
    const redirectUri = 'heirclark://fitbit/callback';
    const scope = 'activity heartrate sleep weight';

    return `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  }

  private async exchangeFitbitCode(code: string): Promise<any> {
    // This would call your backend to exchange the code for tokens
    // Never expose client secrets in the mobile app
    const response = await fetch('https://heirclarkinstacartbackend-production.up.railway.app/api/v1/fitness/fitbit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return response.json();
  }

  private async refreshFitbitToken(): Promise<void> {
    const provider = this.providers.get('fitbit');
    if (!provider?.refreshToken) return;

    const response = await fetch('https://heirclarkinstacartbackend-production.up.railway.app/api/v1/fitness/fitbit/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: provider.refreshToken }),
    });

    const data = await response.json();
    if (data.access_token) {
      provider.accessToken = data.access_token;
      this.providers.set('fitbit', provider);
    }
  }

  private getGoogleFitAuthUrl(): string {
    const clientId = 'YOUR_GOOGLE_CLIENT_ID';
    const redirectUri = 'heirclark://googlefit/callback';
    const scope = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read';

    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  }

  private async exchangeGoogleFitCode(code: string): Promise<any> {
    const response = await fetch('https://heirclarkinstacartbackend-production.up.railway.app/api/v1/fitness/googlefit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return response.json();
  }

  private async refreshGoogleFitToken(): Promise<void> {
    const provider = this.providers.get('google-fit');
    if (!provider?.refreshToken) return;

    const response = await fetch('https://heirclarkinstacartbackend-production.up.railway.app/api/v1/fitness/googlefit/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: provider.refreshToken }),
    });

    const data = await response.json();
    if (data.access_token) {
      provider.accessToken = data.access_token;
      this.providers.set('google-fit', provider);
    }
  }

  private extractGoogleFitValue(data: any, type: string): number | undefined {
    try {
      const bucket = data.bucket?.[0];
      const dataset = bucket?.dataset?.find((ds: any) =>
        ds.dataSourceId?.includes(type)
      );
      return dataset?.point?.[0]?.value?.[0]?.intVal ||
             dataset?.point?.[0]?.value?.[0]?.fpVal;
    } catch {
      return undefined;
    }
  }
}

// Export singleton instance
export const fitnessMCP = new FitnessMCPService();
export default fitnessMCP;
