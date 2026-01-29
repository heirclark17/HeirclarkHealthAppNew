# iOS Release Checklist for Heirclark

This guide walks you through preparing your Apple Developer account and App Store Connect for EAS Build and EAS Submit.

---

## Prerequisites

- **Apple Developer Program membership** ($99/year)
- **Apple ID**: derrick88clark@yahoo.com
- **App bundle identifier**: `com.heirclark.health`
- **App name**: Heirclark

---

## Step 1: Apple Developer Portal Setup

### 1.1 Create App Identifier

1. Go to [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click **"+"** to create a new identifier
3. Select **"App IDs"** → Continue
4. Select **"App"** → Continue
5. Fill in:
   - **Description**: Heirclark Health App
   - **Bundle ID**: `com.heirclark.health` (Explicit)
6. **Capabilities** (enable these):
   - ✅ **HealthKit** (REQUIRED - app uses Apple Health integration)
   - ✅ **Push Notifications** (optional, recommended for future)
   - ✅ **Associated Domains** (optional, for deep linking)
7. Click **Continue** → **Register**

### 1.2 Verify Team ID

1. Go to [Apple Developer → Membership](https://developer.apple.com/account#/membership)
2. Note your **Team ID** (10-character code, e.g., `A1B2C3D4E5`)
3. You'll need this for `eas.json` if not using automatic credentials

---

## Step 2: App Store Connect Setup

### 2.1 Create App Record

1. Go to [App Store Connect → My Apps](https://appstoreconnect.apple.com/apps)
2. Click **"+"** → **New App**
3. Fill in:
   - **Platforms**: iOS
   - **Name**: Heirclark
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select `com.heirclark.health` from dropdown
   - **SKU**: `com.heirclark.health` (or any unique identifier)
   - **User Access**: Full Access
4. Click **Create**
5. **Note your App Store Connect App ID** (numeric, e.g., `1234567890`)
   - Found in App Information → General Information → Apple ID

### 2.2 Complete Agreements & Banking (If Not Done)

1. Go to [App Store Connect → Agreements, Tax, and Banking](https://appstoreconnect.apple.com/agreements)
2. Accept **Paid Apps Agreement** (even if app is free)
3. Complete **Tax Information**
4. Complete **Banking Information** (for payments/settlements)

### 2.3 Fill Out App Information (Before Submission)

Required fields:
- **Category**: Health & Fitness
- **Content Rights**: (confirm you have rights to all content)
- **Age Rating**: Complete questionnaire
- **App Privacy**: Add privacy policy URL (required for health apps)
- **App Clips**: Not applicable
- **Routing App Coverage File**: Not applicable

---

## Step 3: App Store Connect API Key (RECOMMENDED)

Using an API key allows EAS Submit to upload builds without 2FA prompts and enables CI/CD automation.

### 3.1 Create API Key

1. Go to [App Store Connect → Users and Access → Keys](https://appstoreconnect.apple.com/access/api)
2. Click **"+"** to create a new key
3. Fill in:
   - **Name**: EAS CLI
   - **Access**: **App Manager** (recommended) or **Admin**
4. Click **Generate**
5. **Download the `.p8` file** (you can only download once!)
6. Note the **Issuer ID** (UUID at top of page)
7. Note the **Key ID** (10-character code, e.g., `ABC123DEFG`)

### 3.2 Configure EAS Submit with API Key

**Option A: Environment variables (recommended for CI)**
```bash
export EXPO_APPLE_APP_SPECIFIC_PASSWORD=your_app_specific_password  # If using Apple ID method
export EXPO_APPLE_API_KEY_ID=ABC123DEFG
export EXPO_APPLE_API_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export EXPO_APPLE_API_KEY_PATH=/path/to/AuthKey_ABC123DEFG.p8
```

**Option B: Add to eas.json** (NOT recommended - keeps secrets out of repo)
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "derrick88clark@yahoo.com",
        "ascAppId": "1234567890",
        "appleTeamId": "A1B2C3D4E5",
        "ascApiKeyPath": "./path/to/AuthKey_ABC123DEFG.p8",
        "ascApiKeyIssuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "ascApiKeyId": "ABC123DEFG"
      }
    }
  }
}
```

**Option C: Interactive prompt** (default, simplest for one-time use)
- EAS Submit will prompt for Apple ID credentials and handle 2FA
- Credentials stored securely in EAS servers

---

## Step 4: Update eas.json Placeholders

After completing App Store Connect setup, update `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "derrick88clark@yahoo.com",
        "ascAppId": "1234567890",  // ← Replace with your App Store Connect App ID
        "appleTeamId": "A1B2C3D4E5"  // ← Replace with your Team ID
      }
    }
  }
}
```

**How to find these values:**
- **ascAppId**: App Store Connect → Your App → App Information → Apple ID (numeric)
- **appleTeamId**: Apple Developer → Membership → Team ID (10 characters)

---

## Step 5: HealthKit Entitlement

**IMPORTANT:** This app uses `react-native-health` for Apple Health integration.

### 5.1 Enable HealthKit in Xcode (After First Build)

After running your first EAS development build, EAS will automatically configure HealthKit entitlements. However, verify:

1. Download the build from EAS and extract the `.app` or check build logs
2. Verify `HealthKit` capability is enabled in entitlements
3. Ensure `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` are present in Info.plist (already configured in app.json)

### 5.2 App Store Review Notes for Health Data

When submitting to App Store, include in **App Review Information → Notes**:
```
This app uses HealthKit to:
- Read step count, active calories, and distance for fitness tracking
- Write meal and calorie data for nutrition logging
- Sync fitness data with backend for goal tracking

To test:
1. Grant Health permissions when prompted
2. Navigate to Dashboard to see step count and calorie data
3. Log a meal in "Today's Meals" tab to see calorie tracking
```

---

## iOS Build Profiles Explained

### Development Profile
```bash
eas build -p ios --profile development
```
- **Purpose**: Install on physical device via USB or TestFlight (internal testing)
- **Distribution**: Internal (ad-hoc provisioning)
- **Development client**: Enabled (includes Expo Dev Client for live reloading)
- **Simulator**: Can also run in iOS Simulator
- **Use case**: Day-to-day development and testing with real device

### Preview Profile
```bash
eas build -p ios --profile preview
```
- **Purpose**: Internal testing builds without dev tools
- **Distribution**: Internal (ad-hoc provisioning)
- **Development client**: Disabled (production-like build)
- **Simulator**: Physical devices only
- **Use case**: QA testing, stakeholder demos

### Production Profile
```bash
eas build -p ios --profile production
```
- **Purpose**: App Store submission
- **Distribution**: Store (App Store provisioning)
- **Development client**: Disabled
- **Simulator**: Physical devices only
- **Use case**: Final release builds for TestFlight beta or App Store release

---

## Common Issues & Solutions

### Issue: "No bundle identifier found"
**Solution**: Bundle ID is already set in `app.json` as `com.heirclark.health`. Verify it matches in Apple Developer Portal.

### Issue: "HealthKit capability not found"
**Solution**:
1. Ensure `react-native-health` plugin is in `app.json` plugins array (already configured)
2. Re-run `eas build` to regenerate entitlements
3. Manually enable HealthKit in Apple Developer Portal → Identifiers

### Issue: "Provisioning profile doesn't include HealthKit"
**Solution**:
1. Delete cached provisioning profiles: `eas credentials -p ios`
2. Regenerate credentials: Select "Remove all credentials" → "Set up new credentials"
3. Rebuild: `eas build -p ios --profile production`

### Issue: "Build succeeded but can't install on device"
**Solution**:
1. For development builds: Ensure device UDID is registered in Apple Developer Portal
2. Add device: `eas device:create` → Follow QR code flow
3. Rebuild after adding device

### Issue: "App crashes on launch (HealthKit error)"
**Solution**:
1. Check Xcode logs for specific error
2. Verify health permissions are granted in iOS Settings → Privacy → Health
3. Ensure `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` are in Info.plist

---

## Testing Checklist Before App Store Submission

- [ ] Development build installed on physical iPhone
- [ ] All health permissions granted and working
- [ ] Camera/photo permissions working for meal logging
- [ ] Location permission working for weather
- [ ] Apple Health data syncing correctly
- [ ] AI meal analysis working (text, voice, photo, barcode)
- [ ] No crashes or critical bugs
- [ ] App name displays as "Heirclark" (not "Heirclark Health")
- [ ] App Store screenshots prepared (6.5" and 5.5" required)
- [ ] App privacy policy URL added to App Store Connect
- [ ] Age rating completed
- [ ] App preview video (optional but recommended)

---

## Submission Workflow

### Step 1: Build for Production
```bash
eas build -p ios --profile production
```

### Step 2: Test Production Build
- Download IPA from EAS dashboard
- Install via TestFlight (external testing group) or Xcode
- Verify all features work in production configuration

### Step 3: Submit to App Store Connect
```bash
eas submit -p ios --profile production
```
- Select the build from EAS
- EAS uploads to App Store Connect
- Wait 5-15 minutes for processing

### Step 4: Complete App Store Listing
1. Go to App Store Connect → Your App → Version
2. Add screenshots (required: 6.5" iPhone, 5.5" iPhone)
3. Add description (what the app does)
4. Add keywords (health, fitness, nutrition, calorie tracking, etc.)
5. Set pricing (Free or Paid)
6. Select availability (all countries or specific regions)

### Step 5: Submit for Review
1. Click **"Add for Review"**
2. Click **"Submit to App Review"**
3. Wait 24-48 hours for review (typically)
4. Respond to any feedback from Apple

---

## Important Notes

1. **Health Data Privacy**: Apple is strict about health data. Ensure your privacy policy clearly explains data collection, storage, and sharing.

2. **HealthKit Required Disclosure**: In App Store Connect → App Privacy, you MUST declare:
   - Health & Fitness data collection
   - Purpose: Fitness tracking, nutrition tracking
   - Data linked to user identity (if applicable)

3. **Backend API Keys**: Ensure production backend (Railway) has valid `OPENAI_API_KEY` and `OPENWEATHERMAP_API_KEY` for AI and weather features.

4. **Push Notifications**: Not currently configured, but consider adding for meal reminders and goal notifications.

5. **Versioning**: Increment `version` in `app.json` and `buildNumber` in `ios` config for each App Store submission.

---

## Need Help?

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **HealthKit Guidelines**: https://developer.apple.com/health-fitness/
- **Expo Discord**: https://chat.expo.dev/

---

**Last Updated**: January 19, 2026
**App Version**: 1.0.0
**Bundle ID**: com.heirclark.health
