# Quick Start: Deploy Version 1.0.1 NOW

## ✅ What's Already Done

- [x] Backend updated with version enforcement
- [x] Backend deployed to Railway (LIVE)
- [x] App version bumped to 1.0.1 (build 10)
- [x] Auth token race condition fixed
- [x] Version headers added to API requests

**Your backend is LIVE and blocking old versions right now.**

---

## 🚀 What YOU Need to Do (5 Steps)

### Step 1: Test Locally First (5 minutes)

```bash
# Pull latest code
cd /c/Users/derri/HeirclarkHealthAppNew
git pull origin master

# Restart Expo
npm start
```

**Test the fix:**
1. Open app on your iPhone
2. Go to meal planning
3. Press "Generate 7 Day Plan"
4. ✅ Should NOT timeout immediately
5. ✅ Should start processing (takes 30-90 seconds)

---

### Step 2: Build for TestFlight (20 minutes)

```bash
# Build iOS app
npx eas build --platform ios --profile production
```

**Wait for build to complete (~15-20 min)**

You'll see:
```
✔ Build complete!
Build URL: https://expo.dev/accounts/.../builds/...
```

---

### Step 3: Submit to TestFlight (10 minutes)

```bash
# Submit to Apple TestFlight
npx eas submit --platform ios
```

**You'll need:**
- Apple ID credentials
- App-specific password (if using 2FA)

**TestFlight processing:** 10-30 minutes

---

### Step 4: Notify Beta Testers

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select "Heirclark" app
3. Go to TestFlight tab
4. Your testers will automatically get notification
5. They update → bug is fixed for them

---

### Step 5: Submit to App Store (For Public)

**After TestFlight testing is successful:**

```bash
# Same build can be promoted to App Store
# Or build fresh and submit:
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```

**App Store Review:** 24-48 hours

---

## 🛡️ What Happens to Old Users

**Users on version 1.0.0 will see:**

```
⚠️ App Update Required

Please update your app to the latest version to continue using this feature.

[Update Now]
```

**They cannot use meal planning until they update.**

This forces them to get the bug fix.

---

## ⏱️ Timeline

| Action | Time | Status |
|--------|------|--------|
| Backend deployment | Done | ✅ LIVE |
| Local testing | 5 min | ⏳ YOU DO THIS |
| Build for iOS | 15-20 min | ⏳ YOU DO THIS |
| Submit to TestFlight | 10-30 min | ⏳ YOU DO THIS |
| TestFlight beta testing | 1-3 days | ⏳ OPTIONAL |
| Submit to App Store | - | ⏳ AFTER TESTING |
| App Store review | 1-2 days | ⏳ APPLE REVIEWS |
| Public release | - | ✅ DONE |

**Total time to users:** 2-4 days (if you start now)

---

## 🧪 How to Test

**Before submitting to TestFlight, verify:**

✅ **Auth token loads correctly:**
```
# Look for this in Expo logs:
[AIService] ✅ Auth token loaded: hc_...
[AIService] Meal plan request sent
```

✅ **Version headers sent:**
```
# Backend logs should show:
[Version Check] ✅ Version 1.0.1 (build 10) is supported
```

✅ **Meal plan generation works:**
- No immediate timeout
- Loading indicator shows
- Completes successfully (or times out at ~45s due to Railway limit)

---

## 🚨 Troubleshooting

### "Build failed"
**Problem:** EAS build error

**Solution:**
```bash
# Check for errors in package.json or app.json
npx expo-doctor
```

### "Submission failed"
**Problem:** Apple credentials issue

**Solution:**
```bash
# Use app-specific password if 2FA enabled
# Generate at: appleid.apple.com
npx eas submit --platform ios --apple-id your@email.com
```

### "Testers not seeing update"
**Problem:** TestFlight not notifying

**Solution:**
1. Check App Store Connect → TestFlight
2. Verify testers are added to "Internal Testing" or "External Testing"
3. Make sure build is "Ready for Testing"
4. Testers may need to open TestFlight app manually

---

## 📱 Commands Cheatsheet

```bash
# Test locally
npm start

# Build for TestFlight
npx eas build --platform ios --profile production

# Submit to TestFlight
npx eas submit --platform ios

# Check build status
npx eas build:list

# Check submission status
npx eas submit:list
```

---

## ✅ Success Checklist

- [ ] Tested locally - no immediate timeout
- [ ] Built for iOS - build completed successfully
- [ ] Submitted to TestFlight - processing complete
- [ ] Beta testers notified - emails sent
- [ ] Beta testers updated - version 1.0.1 installed
- [ ] Beta testers tested - meal plans working
- [ ] Submitted to App Store - awaiting review
- [ ] App Store approved - live to public
- [ ] 100% users on 1.0.1+ - bug eliminated

---

## 🎯 Start Here

**Right now, do this:**

1. Open terminal
2. Run: `cd /c/Users/derri/HeirclarkHealthAppNew`
3. Run: `git pull origin master`
4. Run: `npm start`
5. Test meal plan generation on your iPhone
6. If working → Build for TestFlight
7. If not working → Report the issue

**Estimated time to TestFlight:** 30-40 minutes from now

**Estimated time to App Store:** 2-4 days from now

**LET'S DO THIS! 🚀**
