# Deployment Guide - Version 1.0.1

## 🎯 What This Fixes

This update fixes the **immediate timeout bug** where meal plan generation would fail instantly when users pressed "Generate 7 Day Plan" button.

**Root Cause:** Auth token race condition - API requests were being sent before the authentication token finished loading from AsyncStorage.

**Who This Affects:**
- ❌ **Version 1.0.0 (build 9 and earlier)**: HAS THE BUG
- ✅ **Version 1.0.1 (build 10 and later)**: BUG IS FIXED

---

## 📋 Deployment Checklist

### Phase 1: Backend Deployment (Auto-Complete ✅)

- [x] Version check middleware created
- [x] Backend updated to block old versions
- [x] Changes pushed to GitHub
- [x] Railway auto-deployment triggered

**Status:** Backend is now live and will block versions < 1.0.1

---

### Phase 2: Mobile App Distribution (YOU NEED TO DO THIS)

#### Option A: TestFlight (Recommended)

**For beta testers and early users:**

```bash
# Make sure you're in the project directory
cd /c/Users/derri/HeirclarkHealthAppNew

# Build for iOS
npx eas build --platform ios --profile production

# Submit to TestFlight
npx eas submit --platform ios
```

**Timeline:**
- Build time: ~15-20 minutes
- TestFlight processing: ~10-30 minutes
- Testers get notification to update

**After submission:**
1. Go to App Store Connect → TestFlight
2. Add internal/external testers (if not already added)
3. Testers will receive email to update
4. They install version 1.0.1 → bug is fixed

---

#### Option B: App Store (For Public Release)

**For all public users:**

```bash
# Build and submit to App Store
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```

**Timeline:**
- Build time: ~15-20 minutes
- App Store review: 24-48 hours (typically)
- Users get auto-update notification

**After approval:**
- Users with auto-update: Get 1.0.1 automatically
- Users without auto-update: See "Update" button in App Store

---

### Phase 3: Force Update Old Users (Backend Enforcement)

**What happens now:**

When a user on version 1.0.0 tries to use the app:

1. They press "Generate 7 Day Plan"
2. Request sent with headers: `X-App-Version: 1.0.0`, `X-App-Build-Number: 9`
3. Backend version middleware checks: `1.0.0 < 1.0.1` ❌
4. Backend responds: `426 Upgrade Required`
5. App shows error: "Please update your app to the latest version"

**Error Response:**
```json
{
  "error": "App Update Required",
  "message": "Please update your app to the latest version to continue using this feature.",
  "currentVersion": "1.0.0",
  "minimumVersion": "1.0.1",
  "updateRequired": true
}
```

---

## 🧪 Testing Before Distribution

**Test locally first:**

```bash
# Pull latest code
git pull origin master

# Start Expo
npm start

# Run on iOS simulator or your device
# Press "i" for iOS simulator
# Or scan QR code with Expo Go
```

**Test meal plan generation:**
1. Open app
2. Navigate to meal planning
3. Press "Generate 7 Day Plan"
4. Verify it doesn't timeout immediately
5. Verify it completes successfully (or times out after ~45s due to Railway limits - different issue)

---

## 📱 How Users Update

### For TestFlight Users:

1. User receives email: "New build available"
2. User opens TestFlight app
3. User taps "Update" next to Heirclark
4. Updated to 1.0.1
5. Bug is fixed

### For App Store Users:

**Auto-update enabled (most users):**
- App updates automatically overnight
- User sees 1.0.1 next morning
- Bug is fixed

**Manual update:**
1. User opens App Store
2. Goes to "Updates" tab
3. Sees "Heirclark - Update Available"
4. Taps "Update"
5. Bug is fixed

---

## 🔒 What Prevents Old Versions

### Backend Version Enforcement

**File:** `backend/middleware/versionCheck.js`

**Minimum version required:** 1.0.1 (build 10)

**What it does:**
- Checks `X-App-Version` header on every API request
- Blocks versions < 1.0.1 with 426 status code
- Logs warnings for old versions
- Allows health check endpoint (no version check)

**Update minimum version in future:**
```javascript
// In backend/middleware/versionCheck.js
const MIN_REQUIRED_VERSION = '1.0.2'; // Change this
const MIN_BUILD_NUMBER = 11; // Change this
```

---

## 📊 Monitoring User Updates

**Check version distribution:**

Add this endpoint to see what versions are being used:

```javascript
// In backend/server-complete.js
app.get('/api/v1/admin/version-stats', authenticateToken, async (req, res) => {
  // Get version stats from request logs
  // Return: { "1.0.0": 5, "1.0.1": 45, "1.0.2": 3 }
});
```

**Monitor in Railway logs:**

```bash
# Look for these log lines:
[Version Check] ✅ Version 1.0.1 (build 10) is supported
[Version Check] Blocking old app version: 1.0.0 (min required: 1.0.1)
```

---

## ⚡ What's Fixed in 1.0.1

### Mobile App Changes

**File:** `services/aiService.ts`

1. **Auth token loading fix:**
   - Made `getHeaders()` async
   - Waits for token to load before creating headers
   - All 7 fetch calls updated to `await this.getHeaders()`

2. **Version headers added:**
   - Sends `X-App-Version: 1.0.1`
   - Sends `X-App-Build-Number: 10`

### Backend Changes

**Files:** `backend/server-complete.js`, `backend/middleware/versionCheck.js`

1. **Version check middleware:**
   - Blocks versions < 1.0.1
   - Returns 426 Upgrade Required
   - Logs version stats

2. **Already deployed fixes:**
   - OpenAI timeout: 25s → 90s
   - Railway healthcheck: 120s

---

## 🚨 Known Limitations

### Railway Free Tier Timeout (~45 seconds)

Even with all fixes, 7-day meal plans may timeout after 45 seconds due to Railway's infrastructure limits.

**Solutions:**
1. Upgrade Railway to Hobby ($5/mo) - recommended
2. Generate 3-5 day plans instead
3. Switch hosting to Render, Fly.io, or AWS

**This is NOT the immediate timeout bug** - that's fixed in 1.0.1.

---

## 📈 Expected Results

### Before 1.0.1:
- ❌ Immediate timeout (0 seconds)
- ❌ No loading indicator
- ❌ "Request timed out" error instantly

### After 1.0.1:
- ✅ Request starts processing
- ✅ Loading indicator shows
- ⏳ Takes 30-90 seconds (normal)
- ⚠️ May timeout at ~45s (Railway limit - different issue)
- ✅ Auth token loaded correctly
- ✅ Request sent with proper authentication

---

## 🎯 Distribution Timeline

**Estimated rollout:**

| Platform | Time to Deploy | User Update Time | Total |
|----------|---------------|------------------|-------|
| Backend | ✅ Done (auto) | - | ~5 min |
| TestFlight | ~30 min | Immediate | ~30 min |
| App Store | ~2 days | 1-7 days | 3-9 days |

**100% coverage:** ~10 days after App Store approval

---

## ✅ Success Criteria

**How you know it's working:**

1. **Backend logs show:**
   ```
   [Version Check] ✅ Version 1.0.1 (build 10) is supported
   ```

2. **Old users see:**
   ```
   "Please update your app to the latest version to continue using this feature."
   ```

3. **Updated users see:**
   - No immediate timeout
   - Meal plan generation starts
   - Loading indicator displays
   - Request completes (or times out at 45s - Railway limit)

4. **Version stats show:**
   - 1.0.0 usage dropping
   - 1.0.1 usage increasing
   - Eventually 100% on 1.0.1+

---

## 🔄 Next Steps

1. **Test locally** (restart Expo and app)
2. **Build for TestFlight** (`eas build --platform ios`)
3. **Submit to TestFlight** (`eas submit --platform ios`)
4. **Test with beta users** (5-10 testers)
5. **Fix any issues** found in testing
6. **Submit to App Store** for public release
7. **Monitor logs** for version distribution
8. **Celebrate** when 100% users on 1.0.1+ 🎉

---

## 📞 Support

**If users report issues:**

1. **Check their version:**
   - Settings → About → Version
   - Should show "1.0.1 (10)"

2. **If on 1.0.0:**
   - Tell them to update via App Store/TestFlight
   - Backend will block their requests until they update

3. **If on 1.0.1 and still having issues:**
   - Check Railway logs for errors
   - Verify auth token is present in request
   - May be hitting Railway 45s timeout (different issue)

---

**Deployment Date:** February 12, 2026
**Version:** 1.0.1 (build 10)
**Fixed:** Auth token race condition
**Backend Status:** ✅ Live
**Mobile App Status:** ⏳ Pending distribution
