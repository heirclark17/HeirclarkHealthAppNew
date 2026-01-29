# 📱 iOS App Store Deployment Guide - Heirclark Health

**Date:** January 17, 2026
**App:** Heirclark Health
**Bundle ID:** com.heirclark.health
**Version:** 1.0.0

---

## ✅ Completed Fixes

### 1. Gradient Background Added
- **Issue:** Solid black background prevented glass blur effect from being visible
- **Fix:** Added `LinearGradient` with subtle gradient (`#000000 → #0a0a0a → #1a1a1a`)
- **Result:** Glass blur now has variation to blur, creating visible frosted glass effect on iOS

### 2. App Store Configuration Updated
- **app.json:** Added iOS-specific settings for App Store submission
- **eas.json:** Created EAS Build configuration for production builds
- **Package:** Installed `expo-linear-gradient` for gradient background

---

## 📋 Prerequisites

Before building for the App Store, ensure you have:

### Apple Developer Account
- [ ] **Enrolled in Apple Developer Program** ($99/year)
  - Go to [developer.apple.com](https://developer.apple.com)
  - Sign in with Apple ID
  - Enroll in developer program

### Expo Account
- [ ] **Create Expo Account** (free)
  - Go to [expo.dev](https://expo.dev)
  - Sign up with email or GitHub
  - Verify email address

### App Store Connect Setup
- [ ] **Create App in App Store Connect**
  - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
  - Click "My Apps" → "+"
  - Fill in app information:
    - **Name:** Heirclark Health
    - **Bundle ID:** com.heirclark.health
    - **SKU:** heirclark-health-001
    - **Primary Language:** English

---

## 🎨 Step 1: Prepare App Assets

### App Icon (Required)
Create a **1024x1024px** PNG icon with:
- No transparency
- No rounded corners (iOS adds them automatically)
- High quality, recognizable at small sizes

**Save as:** `assets/icon.png`

**Design Tips:**
- Use simple, bold design
- Avoid text (hard to read at small sizes)
- Match Heirclark branding (black background, white logo)

### Splash Screen (Required)
Create a splash screen image:
- **Recommended size:** 1284x2778px (iPhone 14 Pro Max)
- Background: Black (`#000000`)
- Center: Heirclark logo

**Save as:** `assets/splash-icon.png`

---

## 🔧 Step 2: Configure Bundle Identifier

Your bundle ID is already set: `com.heirclark.health`

**To change it (if needed):**
1. Open `app.json`
2. Update `ios.bundleIdentifier`
3. Update in App Store Connect to match

---

## 🏗️ Step 3: Build the iOS App

### Option A: Using EAS Build (Recommended)

#### Install EAS CLI
```bash
npm install -g eas-cli
```

#### Login to Expo
```bash
eas login
```

#### Configure EAS Build
```bash
eas build:configure
```
- Select "iOS" when prompted
- This creates/updates `eas.json`

#### Build for App Store
```bash
eas build --platform ios --profile production
```

**What happens:**
- Code is uploaded to Expo servers
- iOS app is built in the cloud (no Mac required!)
- Build takes 10-20 minutes
- You'll get a download link when complete

**Build output:**
- `.ipa` file (iOS app package)
- Download to your computer

---

### Option B: Local Build (Requires Mac)

If you have a Mac:

```bash
npx expo prebuild
cd ios
pod install
cd ..
npx expo run:ios --configuration Release
```

Then archive in Xcode:
1. Open `ios/HeirclarkHealth.xcworkspace` in Xcode
2. Product → Archive
3. Upload to App Store Connect

---

## 📝 Step 4: App Store Connect Information

### App Information
Fill out these fields in App Store Connect:

**Privacy Policy URL:**
- Create a privacy policy page
- Host on heirclark.com/privacy
- Required by Apple

**Support URL:**
- Support page or contact form
- Example: heirclark.com/support

**Marketing URL (Optional):**
- heirclark.com

**App Category:**
- Primary: Health & Fitness
- Secondary: Food & Drink

**Content Rights:**
- Check if you own or have rights to all content

---

### App Description

**Subtitle** (30 characters max):
```
Track meals, macros & fitness
```

**Promotional Text** (170 characters max):
```
The easiest way to track your nutrition and fitness goals. AI-powered meal logging, macro tracking, and personalized recommendations.
```

**Description** (4000 characters max):
```
HEIRCLARK HEALTH - Your Personal Nutrition & Fitness Companion

Transform your health journey with Heirclark Health, the all-in-one app for tracking meals, macros, and fitness goals.

🎯 KEY FEATURES:

• AI Voice Meal Logging - Simply describe your meal, and our AI calculates calories and macros automatically
• Photo Analysis - Snap a picture of your food for instant nutritional estimates
• Barcode Scanner - Scan packaged foods for accurate nutrition data
• Macro Tracking - Monitor protein, carbs, and fats with beautiful visual gauges
• Daily Fat Loss Calculator - See your daily calorie deficit/surplus and projected fat loss
• Weekly Progress - Track 7-day trends for steps, calories, and macros
• Dining Out Recommendations - Get healthy meal suggestions for 25+ restaurants
• Wearable Sync - Connect Fitbit, Apple Health, or Google Fit for automatic tracking
• Meal Database - Search 100,000+ foods and save your favorites
• Recipe Builder - Create custom recipes with automatic macro calculations

💪 DESIGNED FOR SUCCESS:

Whether you're cutting, bulking, or maintaining, Heirclark Health makes tracking effortless. Our sleek black and white interface with liquid glass effects provides a premium experience that motivates you to stay consistent.

📊 COMPREHENSIVE TRACKING:

• Daily calorie balance (in vs. out)
• Protein, carbs, and fat macros
• Steps and activity tracking
• Meal history and patterns
• Weekly progress reports

🔐 PRIVACY FIRST:

Your health data stays private. We never sell your information to third parties.

🌟 PREMIUM FEATURES:

• Advanced analytics and insights
• Personalized meal planning
• Custom macro targets
• Priority support

Download Heirclark Health today and take control of your nutrition!

SUPPORT:
Questions? Email support@heirclark.com
Visit heirclark.com for more information

SUBSCRIPTION:
Premium features available via in-app purchase
```

**Keywords** (100 characters max):
```
nutrition,macro,calories,fitness,diet,health,meal,tracker,weight,protein,carbs,fat
```

---

### Screenshots (Required)

You need screenshots for each iPhone screen size:

**6.7" Display (iPhone 14 Pro Max, 15 Pro Max):**
- Resolution: 1290 x 2796 pixels
- Quantity: 3-10 screenshots

**6.5" Display (iPhone 11 Pro Max, XS Max):**
- Resolution: 1242 x 2688 pixels
- Quantity: 3-10 screenshots

**5.5" Display (iPhone 8 Plus, 7 Plus):**
- Resolution: 1242 x 2208 pixels
- Quantity: 3-10 screenshots

**Suggested screenshots:**
1. Dashboard with Daily Balance card
2. Macros tracking with circular gauges
3. Meal logging interface
4. Weekly progress card
5. Dining out recommendations

**How to take screenshots:**
1. Open app on iPhone (via Expo Go or TestFlight)
2. Navigate to each screen
3. Take screenshots: Volume Up + Side Button
4. Transfer to computer via AirDrop or iCloud

---

## 🚀 Step 5: Submit to App Store

### Upload Build
```bash
eas submit --platform ios
```

Or manually upload `.ipa` file using **Transporter** app (Mac only).

### Add Build to App Version
1. Go to App Store Connect
2. Select your app → TestFlight tab
3. Wait for build to appear (5-15 minutes)
4. Go to "App Store" tab → "+" to create version 1.0.0
5. Select the build you just uploaded
6. Fill in App Information (description, screenshots, etc.)

### Submit for Review
1. Complete all required fields (marked with red dots)
2. Answer App Review questions:
   - **Uses advertising identifier?** No (unless you use ads)
   - **Uses encryption?** No (unless you encrypt user data)
   - **Content rights?** Yes, I own the rights
3. Click "Submit for Review"

**Review time:** 24-48 hours (usually)

---

## 🧪 Step 6: TestFlight Testing (Recommended Before Submission)

### Internal Testing (Up to 100 testers)
```bash
eas build --platform ios --profile preview
```

Then:
1. Go to App Store Connect → TestFlight
2. Add internal testers (your email, team emails)
3. Testers get email with TestFlight invite
4. Download TestFlight app → Install your app
5. Test thoroughly before App Store submission

### External Testing (Up to 10,000 testers)
1. Create external testing group
2. Add testers via email or public link
3. Submit for Beta App Review (1-2 days)
4. Once approved, testers can install

---

## 📊 Step 7: App Analytics & Monitoring

### Required Information

**Age Rating:**
- Run through App Store Connect questionnaire
- Likely rating: **4+** (No objectionable content)
  - Unless meal photos could be considered medical/health data → **12+**

**App Review Information:**
- **Demo account credentials** (if app requires login):
  - Username: demo@heirclark.com
  - Password: DemoPass123!
- **Review notes:** "App integrates with health data. Please test meal logging, macro tracking, and weekly progress features."

---

## ⚠️ Common Rejection Reasons (And How to Avoid)

### 1. Incomplete Metadata
**Solution:** Fill out ALL fields in App Store Connect before submitting

### 2. Missing Privacy Policy
**Solution:** Create privacy policy page at heirclark.com/privacy

### 3. Crashes or Bugs
**Solution:** Test thoroughly with TestFlight first

### 4. Placeholder Content
**Solution:** Use real data in screenshots (not "Lorem Ipsum")

### 5. Health Claims
**Solution:** Don't make medical claims ("lose 10 lbs in 1 week"). Use general language ("track your nutrition goals")

---

## 🔄 Updating the App (Future Versions)

### Version Updates

1. **Update version in app.json:**
```json
{
  "version": "1.1.0",
  "ios": {
    "buildNumber": "2"
  }
}
```

2. **Build new version:**
```bash
eas build --platform ios --profile production
```

3. **Submit update:**
```bash
eas submit --platform ios
```

4. **In App Store Connect:**
   - Click "+ Version or Platform"
   - Select new build
   - Add "What's New" text
   - Submit for review

---

## 🛠️ Troubleshooting

### Build Fails
```bash
# Clear Expo cache
npx expo start -c

# Clear npm cache
rm -rf node_modules
npm install

# Try build again
eas build --platform ios --clear-cache
```

### Can't Find Build in App Store Connect
- Wait 10-15 minutes after build completes
- Check for email from Apple about compliance issues
- Refresh App Store Connect page

### Missing Permissions
If app crashes when accessing health data:
- Make sure `infoPlist` in `app.json` includes health permissions
- Currently set:
  - `NSHealthShareUsageDescription`
  - `NSHealthUpdateUsageDescription`

---

## 📞 Support Resources

### Expo Documentation
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [App Store deployment](https://docs.expo.dev/submit/ios/)

### Apple Resources
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Contact
- **Expo Community:** forums.expo.dev
- **Apple Developer Support:** developer.apple.com/contact
- **Heirclark Support:** support@heirclark.com

---

## ✅ Pre-Submission Checklist

Before submitting, verify:

**Assets:**
- [ ] App icon (1024x1024px, no transparency)
- [ ] Splash screen (black background, Heirclark logo)
- [ ] Screenshots (3-10 per screen size)

**App Store Connect:**
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] Description written (no typos!)
- [ ] Keywords added
- [ ] Age rating completed
- [ ] Demo account created (if needed)

**Technical:**
- [ ] App builds successfully
- [ ] Tested on real iPhone (via TestFlight)
- [ ] No crashes or major bugs
- [ ] All features work as expected

**Legal:**
- [ ] Privacy policy created
- [ ] Terms of service (if applicable)
- [ ] Apple Developer Program enrollment complete

**Notifications:**
- [ ] Team notified of pending launch
- [ ] Marketing materials prepared
- [ ] Social media posts scheduled

---

## 🎉 After Approval

Once Apple approves your app (usually 24-48 hours):

1. **Go Live:**
   - App Store Connect → "Release this Version"
   - Or schedule for specific date/time

2. **Monitor:**
   - Check App Analytics daily
   - Read user reviews
   - Watch for crash reports

3. **Marketing:**
   - Post on social media
   - Email existing users
   - Submit to app review sites

4. **Update Regularly:**
   - Fix bugs quickly
   - Add new features based on feedback
   - Keep app updated for new iOS versions

---

## 🔐 Security Notes

**Never commit to Git:**
- Apple ID password
- Team ID
- App Store Connect API keys
- `.p12` certificate files

**Already in .gitignore:**
- `eas.json` with credentials
- `ios/` build folder (if using local builds)

---

**Good luck with your App Store submission!** 🚀

**Questions?** Contact support@heirclark.com or open an issue on GitHub.

---

**Last Updated:** January 17, 2026
**Status:** Ready for App Store Submission
**Next Steps:** Test on iPhone → TestFlight → Submit for Review
