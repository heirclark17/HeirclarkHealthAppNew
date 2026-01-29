# 🔌 Fitness MCP Setup Guide

Complete guide to connecting Fitbit, Google Fit, and Apple Health to your app.

---

## 📋 Prerequisites

You mentioned you already have the API credentials for each provider. This guide will show you how to configure them properly.

---

## 🎯 Step 1: Backend API Endpoints

First, you need to add these endpoints to your Railway backend (`https://heirclarkinstacartbackend-production.up.railway.app`):

### Required Endpoints:

#### 1. Fitbit Token Exchange
```
POST /api/v1/fitness/fitbit/token
Body: { "code": "authorization_code" }
Response: { "access_token": "...", "refresh_token": "..." }
```

#### 2. Fitbit Token Refresh
```
POST /api/v1/fitness/fitbit/refresh
Body: { "refreshToken": "..." }
Response: { "access_token": "..." }
```

#### 3. Google Fit Token Exchange
```
POST /api/v1/fitness/googlefit/token
Body: { "code": "authorization_code" }
Response: { "access_token": "...", "refresh_token": "..." }
```

#### 4. Google Fit Token Refresh
```
POST /api/v1/fitness/googlefit/refresh
Body: { "refreshToken": "..." }
Response: { "access_token": "..." }
```

---

## 🔑 Step 2: Update fitnessMCP.ts with Your Credentials

Open `services/fitnessMCP.ts` and replace the placeholder values:

### Fitbit Configuration

```typescript
private getFitbitAuthUrl(): string {
  const clientId = 'YOUR_ACTUAL_FITBIT_CLIENT_ID';  // ← Replace this
  const redirectUri = 'heirclark://fitbit/callback';
  const scope = 'activity heartrate sleep weight';

  return `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
}
```

**To get Fitbit credentials:**
1. Go to https://dev.fitbit.com/apps
2. Create new application
3. OAuth 2.0 Application Type: **Personal**
4. Callback URL: `heirclark://fitbit/callback`
5. Default Access Type: **Read-Only**
6. Copy **OAuth 2.0 Client ID**

### Google Fit Configuration

```typescript
private getGoogleFitAuthUrl(): string {
  const clientId = 'YOUR_ACTUAL_GOOGLE_CLIENT_ID.apps.googleusercontent.com';  // ← Replace this
  const redirectUri = 'heirclark://googlefit/callback';
  const scope = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read';

  return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
}
```

**To get Google Fit credentials:**
1. Go to https://console.cloud.google.com
2. Create new project (or select existing)
3. Enable **Fitness API**
4. Create **OAuth 2.0 Client ID** credentials
5. Application type: **iOS**
6. Bundle ID: Your app's bundle ID (e.g., `com.heirclark.health`)
7. Copy **Client ID**

---

## 📱 Step 3: Configure Deep Linking

### Update app.json

Add URL scheme for OAuth callbacks:

```json
{
  "expo": {
    "scheme": "heirclark",
    "ios": {
      "bundleIdentifier": "com.heirclark.health",
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

### Handle Deep Link Callbacks

The app needs to handle OAuth callback URLs. Add this to your `app/_layout.tsx` or main app file:

```typescript
import * as Linking from 'expo-linking';
import { fitnessMCP } from '../services/fitnessMCP';

// Listen for deep links
Linking.addEventListener('url', async (event) => {
  const { url } = event;

  // Handle Fitbit callback
  if (url.startsWith('heirclark://fitbit/callback')) {
    const code = new URL(url).searchParams.get('code');
    if (code) {
      const success = await fitnessMCP.handleFitbitCallback(code);
      if (success) {
        Alert.alert('Success', 'Fitbit connected!');
      }
    }
  }

  // Handle Google Fit callback
  if (url.startsWith('heirclark://googlefit/callback')) {
    const code = new URL(url).searchParams.get('code');
    if (code) {
      const success = await fitnessMCP.handleGoogleFitCallback(code);
      if (success) {
        Alert.alert('Success', 'Google Fit connected!');
      }
    }
  }
});
```

---

## 🍎 Step 4: Apple Health Setup

Apple Health uses HealthKit (iOS only) and doesn't require OAuth. You need to:

### 1. Add HealthKit Capability

In Xcode:
1. Open your iOS project
2. Select target → **Signing & Capabilities**
3. Click **+ Capability**
4. Add **HealthKit**
5. Check required data types:
   - Steps
   - Active Energy
   - Distance
   - Heart Rate
   - Sleep Analysis

### 2. Update Info.plist

Add privacy descriptions:

```xml
<key>NSHealthShareUsageDescription</key>
<string>This app needs access to your health data to track your fitness progress.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>This app needs to update your health data.</string>
```

### 3. Install react-native-health

```bash
npx expo install react-native-health
npx expo prebuild
```

### 4. Update fitnessMCP.ts Apple Health Methods

Replace the mock Apple Health implementation:

```typescript
import AppleHealthKit, { HealthValue } from 'react-native-health';

async connectAppleHealth(): Promise<{ success: boolean; error?: string }> {
  try {
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
        ],
      },
    };

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          resolve({ success: false, error });
        } else {
          const provider = this.providers.get('apple-health');
          if (provider) {
            provider.connected = true;
            provider.lastSync = new Date().toISOString();
            this.providers.set('apple-health', provider);
          }
          resolve({ success: true });
        }
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async getAppleHealthData(date?: string): Promise<FitnessData | null> {
  const provider = this.providers.get('apple-health');
  if (!provider?.connected) {
    throw new Error('Apple Health not connected');
  }

  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const startDate = new Date(targetDate).toISOString();
    const endDate = new Date(targetDate + 'T23:59:59').toISOString();

    return new Promise((resolve, reject) => {
      // Get steps
      AppleHealthKit.getStepCount(
        { startDate, endDate },
        (err: string, results: HealthValue) => {
          if (err) {
            reject(err);
            return;
          }

          // Get calories
          AppleHealthKit.getActiveEnergyBurned(
            { startDate, endDate },
            (err2: string, caloriesResults: HealthValue) => {
              if (err2) {
                reject(err2);
                return;
              }

              // Get distance
              AppleHealthKit.getDistanceWalkingRunning(
                { startDate, endDate },
                (err3: string, distanceResults: HealthValue) => {
                  if (err3) {
                    reject(err3);
                    return;
                  }

                  resolve({
                    date: targetDate,
                    steps: results.value || 0,
                    caloriesOut: caloriesResults.value || 0,
                    distance: distanceResults.value || 0,
                  });
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Get Apple Health data error:', error);
    return null;
  }
}
```

---

## 🔧 Step 5: Backend Implementation

Your Railway backend needs to handle the OAuth token exchange. Here's example Node.js code:

### Fitbit Token Exchange Endpoint

```javascript
// POST /api/v1/fitness/fitbit/token
app.post('/api/v1/fitness/fitbit/token', async (req, res) => {
  const { code } = req.body;

  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;
  const redirectUri = 'heirclark://fitbit/callback';

  try {
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/fitness/fitbit/refresh
app.post('/api/v1/fitness/fitbit/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;

  try {
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Google Fit Token Exchange Endpoint

```javascript
// POST /api/v1/fitness/googlefit/token
app.post('/api/v1/fitness/googlefit/token', async (req, res) => {
  const { code } = req.body;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = 'heirclark://googlefit/callback';

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/fitness/googlefit/refresh
app.post('/api/v1/fitness/googlefit/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Environment Variables for Railway

Add these to your Railway backend:

```env
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 🧪 Testing the Integration

### Test Fitbit Connection:

1. Open app on iPhone
2. Navigate to Dashboard
3. Scroll to **Wearable Sync** card
4. Tap **Connect** on Fitbit
5. Tap **Continue** in alert
6. Browser opens to Fitbit OAuth page
7. Log in and authorize
8. Redirected back to app
9. Status changes to **Connected**
10. Tap **Sync** to retrieve data

### Test Google Fit Connection:

Same process as Fitbit, but with Google account login.

### Test Apple Health Connection:

1. Tap **Connect** on Apple Health
2. iOS system permissions dialog appears
3. Grant access to Steps, Calories, Distance
4. Status changes to **Connected**
5. Tap **Sync** to retrieve data

### Test Sync All:

1. Connect at least 2 providers
2. Tap **Sync All Providers**
3. Loading indicator appears
4. Alert shows combined data synced
5. Dashboard updates with new step count

---

## 🐛 Troubleshooting

### OAuth Redirect Not Working

**Problem:** After authorizing, browser doesn't redirect back to app.

**Solution:**
1. Check `app.json` has correct `scheme: "heirclark"`
2. Verify redirect URI matches in Fitbit/Google console
3. Rebuild app: `npx expo prebuild && npx expo run:ios`

### "Not Connected" After Authorization

**Problem:** OAuth completes but provider shows "Not Connected".

**Solution:**
1. Check browser console for errors
2. Verify backend `/token` endpoint is working
3. Test backend directly with Postman
4. Check access token is being saved to provider state

### Apple Health Permission Denied

**Problem:** HealthKit permissions dialog doesn't appear.

**Solution:**
1. Check Info.plist has NSHealthShareUsageDescription
2. Verify HealthKit capability is added in Xcode
3. Try: Settings → Privacy → Health → Delete app → Reinstall

### Sync Button Does Nothing

**Problem:** Tapping sync button has no effect.

**Solution:**
1. Check Metro bundler console for errors
2. Verify fitnessMCP service is imported
3. Check backend endpoints are reachable
4. Test API calls with curl/Postman first

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   iPhone    │
│             │
│ ┌─────────┐ │
│ │Wearable │ │ ───────► Connect Button Tapped
│ │  Sync   │ │
│ │  Card   │ │
│ └─────────┘ │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ fitnessMCP.connect() │
└──────┬───────────────┘
       │
       ▼
┌─────────────────────┐
│  OAuth URL opened   │
│  (Safari/Chrome)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User logs in & auth │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────┐
│ Redirect: heirclark://   │
│ fitbit/callback?code=XXX │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ fitnessMCP.handleCallback()  │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ POST /api/v1/fitness/token   │
│ Exchange code for tokens     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Save access_token locally    │
│ Mark provider as connected   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ User taps "Sync"             │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ GET Fitbit API /activities   │
│ with Bearer access_token     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Parse: steps, calories, etc  │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ POST /api/v1/health/ingest   │
│ Save to Railway backend      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Dashboard refreshes          │
│ Shows new step count         │
└──────────────────────────────┘
```

---

## ✅ Completion Checklist

- [ ] Fitbit app created at dev.fitbit.com
- [ ] Google Cloud project created with Fitness API enabled
- [ ] Backend endpoints implemented for token exchange
- [ ] Environment variables added to Railway
- [ ] fitnessMCP.ts updated with real client IDs
- [ ] app.json configured with URL scheme
- [ ] Deep link handler added to app
- [ ] HealthKit capability added (iOS only)
- [ ] Info.plist updated with privacy descriptions
- [ ] App rebuilt with `npx expo prebuild`
- [ ] Tested Fitbit connection flow
- [ ] Tested Google Fit connection flow
- [ ] Tested Apple Health connection flow
- [ ] Tested "Sync All" functionality
- [ ] Verified data appears on Dashboard

---

## 📝 Next Steps After Setup

Once everything is connected:

1. **Test daily sync workflow** - Connect all 3 providers and sync daily
2. **Add persistence** - Store tokens securely with expo-secure-store
3. **Add auto-sync** - Background sync every 6 hours
4. **Add history view** - Show sync history in settings
5. **Add error logging** - Track sync failures for debugging
6. **Add offline support** - Queue syncs when offline
7. **Add data reconciliation** - Handle conflicts when multiple providers have data

---

**Last Updated:** January 17, 2026
**Status:** Ready for implementation
**Estimated Setup Time:** 2-3 hours (including backend work)
