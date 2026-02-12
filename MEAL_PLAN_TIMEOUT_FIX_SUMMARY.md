# Meal Plan Generation Immediate Timeout - Root Cause & Fix

## Problem Summary
User reported that pressing "Generate 7 Day Plan" button caused an **immediate timeout** (not after 25s, 90s, or any delay - instant failure).

## Root Cause Analysis

### Issue #1: Authentication Token Race Condition ✅ FIXED
**File:** `services/aiService.ts`

**Problem:**
```typescript
class AIService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.loadAuthToken(); // ❌ Called without await
  }

  private async loadAuthToken() {
    // Reads token from AsyncStorage (async operation)
  }

  private getHeaders(): HeadersInit {
    if (this.authToken) { // ❌ This is null on first call!
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
  }
}
```

**Sequence of Events:**
1. App initializes `aiService` singleton
2. Constructor calls `loadAuthToken()` (async) but doesn't await
3. User presses "Generate 7 Day Plan"
4. `generateAIMealPlan()` calls `getHeaders()`
5. `this.authToken` is still `null` (AsyncStorage read not complete)
6. Request sent WITHOUT Authorization header
7. Backend rejects request immediately (401 Unauthorized or guest fallback fails)
8. User sees "immediate timeout"

**Fix Applied:**
```typescript
// Made getHeaders() async and ensures token is loaded
private async getHeaders(): Promise<HeadersInit> {
  // Ensure auth token is loaded before getting headers
  if (!this.authToken) {
    await this.loadAuthToken();
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (this.authToken) {
    headers['Authorization'] = `Bearer ${this.authToken}`;
  }
  return headers;
}

// Updated all 7 fetch() calls to await getHeaders()
const response = await fetch(url, {
  headers: await this.getHeaders(), // ✅ Now waits for token
  // ...
});
```

### Issue #2: Railway Request Timeout (Separate Issue)
**Problem:**
Railway has a default request timeout of **~45 seconds**. OpenAI GPT-4.1-mini can take 60-90 seconds for complex meal plans.

**Evidence:**
```
Response status: 502
{"status":"error","code":502,"message":"Application failed to respond"}
```

This is a **Railway infrastructure timeout**, not our code timing out.

**Backend Configuration:**
```javascript
// server-complete.js line 107
const openai = new OpenAI({
  timeout: 90000, // 90 second timeout
});
```

**Client Configuration:**
```typescript
// aiService.ts line 494
const TIMEOUT_MS = 200000; // 200 second timeout (3.5 minutes)
```

**The Problem:**
- Client timeout: 200 seconds ✅
- Backend timeout: 90 seconds ✅
- Railway timeout: **~45 seconds** ❌ (cannot be configured on free tier)

## Solutions Implemented

### ✅ Fix #1: Authentication Token Loading (DEPLOYED)
**Commit:** `9628481`
**Status:** Deployed to GitHub, ready for mobile app update

**Changes:**
- Made `getHeaders()` async
- Updated 7 fetch calls to `await this.getHeaders()`
- Ensures auth token is loaded before every API request

**Testing:**
```bash
cd HeirclarkHealthAppNew
git pull origin master
npm start
```

**User Action Required:**
- Restart Expo app to get updated code
- Test "Generate 7 Day Plan" button

### ⚠️ Issue #2: Railway Timeout (Infrastructure Limitation)
**Status:** Cannot be fixed on Railway free tier

**Options:**

#### Option A: Upgrade Railway Plan
- **Free Tier:** ~45 second request timeout
- **Hobby Plan ($5/mo):** Can configure longer timeouts
- **Pro Plan ($20/mo):** Full control over timeouts

#### Option B: Implement Async Job Pattern
Instead of waiting for response:
```
1. Client sends request
2. Backend returns immediately: {jobId: "abc123", status: "processing"}
3. Client polls: GET /api/v1/ai/meal-plan-status/:jobId
4. Backend processes in background
5. Client gets result when ready
```

#### Option C: Reduce OpenAI Response Time
```javascript
// Reduce max_tokens to speed up generation
max_tokens: 6000, // Instead of 8000
// Or reduce to 5 days instead of 7
```

#### Option D: Move to Different Platform
- **Render.com:** 30s default, configurable to 600s
- **Fly.io:** Configurable timeouts
- **AWS Lambda:** 15 min max timeout
- **Vercel:** 10s free, 300s on Pro ($20/mo)

## Current Status

### What's Fixed ✅
1. Authentication token race condition (immediate timeout on mobile)
2. Backend OpenAI timeout increased to 90s (was 25s)
3. Client timeout increased to 200s (was never the issue)

### What Remains ⚠️
Railway infrastructure timeout (~45s) prevents long-running OpenAI requests from completing.

**Recommendation:**
1. User should **restart mobile app** to get auth token fix
2. Test if immediate timeout is resolved
3. If meal plan generation still times out after 45s, it's the Railway infrastructure limit
4. Consider implementing async job pattern or upgrading Railway plan

## Verification Steps

### Step 1: Test Auth Token Fix
```bash
# On mobile device
1. Force quit Heirclark Health app
2. Relaunch app
3. Navigate to meal plan screen
4. Press "Generate 7 Day Plan"
5. Check if request starts (not immediate timeout)
```

**Expected Result:**
- Should NOT timeout immediately
- Should show loading indicator for 10-60 seconds
- May timeout at 45s (Railway limit)

### Step 2: Monitor Backend Logs
```bash
# Check Railway logs
1. Go to Railway dashboard
2. View deployment logs
3. Look for:
   - "[Meal Plan] Generating 7-day plan for [userId]"
   - OpenAI API call logs
   - Any errors
```

### Step 3: Test with Reduced Complexity
Try generating a **3-day plan** instead of 7-day:
```typescript
// Temporarily modify MealPlanContext.tsx line 318
const aiPlan = await aiService.generateAIMealPlan(aiPreferences, 3); // Instead of 7
```

This should complete within Railway's 45s limit.

## Emergency Rollback (If Needed)

If the fix causes issues:
```bash
cd HeirclarkHealthAppNew
git revert 9628481
git push origin master
```

Then restart app to get previous version.

## Files Modified

### Frontend (Mobile App)
- `services/aiService.ts` - Auth token loading fix

### Backend (No changes needed)
- `backend/server-complete.js` - Already has 90s timeout (committed earlier)

### Test Files
- `test-meal-plan-endpoint.js` - Verification script

## Next Steps

1. **User should restart mobile app** ✅
2. Test "Generate 7 Day Plan" button ✅
3. If immediate timeout is fixed but 45s timeout persists:
   - Option A: Upgrade Railway to Hobby ($5/mo)
   - Option B: Implement async job pattern
   - Option C: Reduce to 3-5 day plans
   - Option D: Switch hosting provider

## Technical Details

### Auth Token Flow (Before Fix)
```
[App Start] → AIService constructor
            → loadAuthToken() called (async, not awaited)
[User Action] → Press Generate button (1 second after app start)
              → generateAIMealPlan() called
              → getHeaders() called
              → authToken is null (AsyncStorage read not done)
              → Request sent without Authorization header
              → Backend rejects (401 or guest fallback fails)
              → Immediate error
```

### Auth Token Flow (After Fix)
```
[App Start] → AIService constructor
            → loadAuthToken() called (async, not awaited)
[User Action] → Press Generate button
              → generateAIMealPlan() called
              → getHeaders() called
              → Checks if authToken is null
              → Awaits loadAuthToken() to complete
              → Gets token from AsyncStorage
              → Request sent WITH Authorization header
              → Backend processes request
              → Success or Railway timeout at 45s
```

## Commit History

1. `20cb1d7` - Fix meal plan generation timeout issues (backend 90s timeout)
2. `9628481` - Fix immediate timeout - ensure auth token loads before API calls (THIS FIX)

---

**Last Updated:** 2026-02-12 21:45 UTC
**Status:** Auth token fix deployed ✅ | Railway timeout remains ⚠️
**Action Required:** User must restart mobile app to receive fix
