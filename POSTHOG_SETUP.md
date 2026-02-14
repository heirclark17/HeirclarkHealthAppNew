# PostHog Analytics Setup

## Overview
PostHog is an open-source product analytics platform that helps track user behavior, measure feature usage, and understand how users interact with the Heirclark Health App.

## Features Enabled
- ✅ Event tracking (custom events like button clicks, screen views)
- ✅ User identification (track users across sessions)
- ✅ Session tracking (automatic application lifecycle events)
- ✅ Device and platform properties (iOS version, device model, etc.)
- ⚠️ Session replay (disabled by default for privacy)

## Getting Your PostHog API Key

### Option 1: PostHog Cloud (Recommended)
1. Visit https://us.posthog.com/signup (or https://eu.posthog.com for EU hosting)
2. Create a free account
3. Create a new project
4. Go to **Settings → Project** in the PostHog dashboard
5. Copy your **Project API Key** (starts with `phc_`)
6. Copy your **Host URL** (usually `https://us.i.posthog.com` or `https://eu.i.posthog.com`)

### Option 2: Self-Hosted PostHog
1. Deploy PostHog to your own infrastructure following: https://posthog.com/docs/self-host
2. Get your API key from your PostHog instance settings
3. Use your self-hosted URL as the host (e.g., `https://posthog.yourcompany.com`)

## Configuration

### 1. Add API Key to .env file
```env
# PostHog Analytics (for product analytics and user tracking)
# Get your API key from: https://us.posthog.com/settings/project
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 2. Verify Installation
The PostHog SDK is already installed via:
```bash
npm install posthog-react-native
```

### 3. Provider is Already Configured
PostHog is automatically initialized in `app/_layout.tsx` via the `PostHogProvider`.

## Usage in Components

### Import the Hook
```typescript
import { usePostHog } from '@/contexts/PostHogContext';
```

### Track Events
```typescript
const { capture } = usePostHog();

// Track button click
capture('button_clicked', {
  button_name: 'Start Workout',
  screen: 'Programs',
});

// Track screen view
capture('screen_viewed', {
  screen_name: 'Meal Plan',
  previous_screen: 'Home',
});
```

### Identify Users
```typescript
const { identify } = usePostHog();

// After user logs in
identify('user_abc123', {
  email: 'user@example.com',
  plan: 'premium',
  signup_date: '2026-02-14',
});
```

### Reset Session
```typescript
const { reset } = usePostHog();

// On logout
reset();
```

## Default Properties
The following properties are automatically sent with every event:
- `app_version`: App version from app.json
- `app_build`: Build number from app.json (iOS)
- `platform`: Operating system (iOS/Android)
- `device_model`: Device model (e.g., "iPhone 16 Pro Max")
- `device_year`: Device year class

## Privacy Considerations

### Session Recording
Session recording is **disabled by default** to protect user privacy. If you enable it:
```typescript
// In contexts/PostHogContext.tsx
enableSessionReplay: true, // Change to true to enable
```

**Note:** Be sure to update your privacy policy if enabling session recording.

### GDPR Compliance
PostHog is GDPR compliant. You can:
- Delete user data via PostHog dashboard
- Respect user opt-out preferences
- Anonymize events before sending

### User Opt-Out
To respect user privacy preferences, check before tracking:
```typescript
const { capture } = usePostHog();

if (userHasConsentedToAnalytics) {
  capture('event_name', properties);
}
```

## Testing Analytics

### Development Testing
1. Add your PostHog API key to `.env`
2. Start the Expo dev server: `npm start`
3. Open the app and navigate around
4. Check the Expo console for PostHog logs:
   ```
   [PostHog] ✅ Initialized successfully
   [PostHog] User identified: user_abc123
   [PostHog] Event captured: screen_viewed { screen_name: 'Home' }
   ```

### Verify Events in PostHog Dashboard
1. Go to https://us.posthog.com (or your instance)
2. Click **Activity** in the sidebar
3. You should see events appearing in real-time
4. Click on an event to see its properties

## Event Naming Conventions

Follow these best practices for event names:

### Screen Views
```typescript
capture('screen_viewed', {
  screen_name: 'Meal Plan',
  previous_screen: 'Home',
});
```

### User Actions
```typescript
capture('button_clicked', {
  button_name: 'Log Meal',
  screen: 'Home',
});

capture('feature_used', {
  feature_name: 'AI Meal Logger',
  input_method: 'voice',
});
```

### Goal Completions
```typescript
capture('goal_completed', {
  goal_type: 'workout',
  goal_name: 'Complete 3 workouts this week',
  completion_time_days: 5,
});
```

## Cost Considerations

### PostHog Cloud Pricing (2026)
- **Free tier**: 1 million events/month
- **Paid plans**: $0.00031 per event after free tier
- **Typical usage**: 10-50 events per user per day
- **Estimated cost**: Free for most apps (< 30K active users)

### Self-Hosted
- No per-event costs
- Infrastructure costs only (hosting, storage, etc.)

## Troubleshooting

### "API key not configured" warning
- Check that `EXPO_PUBLIC_POSTHOG_API_KEY` is set in `.env`
- Restart Expo dev server after changing `.env`
- Verify the API key starts with `phc_`

### Events not appearing in dashboard
- Check internet connection
- Verify API key is correct
- Events are flushed every 30 seconds by default
- Check PostHog console logs for errors

### "Not initialized" warnings
- PostHog initializes on app start - wait for `isReady` state
- Check that `PostHogProvider` wraps your app in `_layout.tsx`
- Verify no errors in PostHog initialization logs

## Related Documentation
- PostHog Docs: https://posthog.com/docs
- React Native SDK: https://posthog.com/docs/libraries/react-native
- Event Tracking Best Practices: https://posthog.com/docs/integrate/send-events

## Files Modified
- `contexts/PostHogContext.tsx` - PostHog provider and hooks
- `app/_layout.tsx` - Provider integration
- `.env` - API key configuration
- `.env.example` - Example configuration

---

**Last Updated**: February 14, 2026
**PostHog SDK Version**: latest
**Status**: ✅ Installed and configured
