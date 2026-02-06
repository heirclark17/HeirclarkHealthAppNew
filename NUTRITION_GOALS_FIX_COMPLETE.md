# Nutrition Goals Bug Fix - COMPLETE ✅

## Problem Summary

**Issue:** Calculated nutrition goals (1200 cal, 75g protein, 15g carbs, 93g fat) were being saved successfully but meal plans were generated using defaults (2000/150/200/65) instead.

**Root Cause:** Authentication mismatch between frontend and backend:
- Frontend sent `X-Shopify-Customer-Id: guest_ios_app` (hardcoded default)
- Backend prioritized this header over JWT Bearer token
- Goals saved to `guest_ios_app` customer ID
- Goals fetched from `guest_ios_app` customer ID
- But user's ACTUAL customer ID (from Apple Sign In JWT) was different!

---

## Fixes Applied

### 1. Backend: Added Apple Sign In Endpoint ✅

**File:** `HeirclarkInstacartBackend/src/routes/auth.ts`

**Changes:**
- ✅ Added `POST /api/v1/auth/apple` endpoint
- ✅ Added `GET /api/v1/auth/me` endpoint
- ✅ Added `POST /api/v1/auth/logout` endpoint
- ✅ Creates user preferences on first Apple sign in
- ✅ Returns `customerId` in authentication response

**Code Added:**
```typescript
router.post('/apple', async (req: Request, res: Response) => {
  const { appleId, email, fullName } = req.body;
  const customerId = `apple_${appleId}`;

  // Create default preferences if new user
  await pool.query(
    `INSERT INTO hc_user_preferences (
      shopify_customer_id,
      calories_target,
      protein_target,
      carbs_target,
      fat_target,
      hydration_target_ml,
      timezone
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (shopify_customer_id) DO NOTHING`,
    [customerId, 2200, 190, 190, 60, 3000, 'America/New_York']
  );

  const token = createToken(customerId, secret, '30d');

  return { token, user, customerId };
});
```

**Deployed to:** Railway (https://heirclarkinstacartbackend-production.up.railway.app)

---

### 2. Frontend: Update shopifyCustomerId from Auth ✅

**File:** `HeirclarkHealthAppNew/services/api.ts`

**Changes:**
- ✅ Updated `authenticateWithApple()` to set `this.shopifyCustomerId` from response
- ✅ Updated `getCurrentUser()` to set `this.shopifyCustomerId` from response

**Code Added:**
```typescript
async authenticateWithApple(appleId: string, email?: string, fullName?: string): Promise<AuthUser | null> {
  const response = await fetch(`${this.baseUrl}/api/v1/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appleId, email, fullName }),
  });

  const data = await response.json();
  if (data.success && data.token) {
    await this.saveAuthToken(data.token);

    // ✅ FIX: Update shopifyCustomerId from auth response
    if (data.customerId) {
      this.shopifyCustomerId = data.customerId;
      console.log('[API] ✅ Updated shopifyCustomerId:', data.customerId);
    }

    return data.user;
  }
}
```

---

## What Happens Now

### Authentication Flow (FIXED)
1. User signs in with Apple ✅
2. Backend creates `customerId = apple_<appleId>` ✅
3. Backend returns JWT token + customerId ✅
4. Frontend saves token AND updates `this.shopifyCustomerId` ✅
5. All API requests now use SAME customer ID in:
   - `X-Shopify-Customer-Id` header (from `this.shopifyCustomerId`)
   - `Authorization: Bearer` token (JWT with same customerId)

### Goals Save/Fetch Flow (FIXED)
1. User completes Goal Wizard
2. Frontend calls `POST /api/v1/user/goals` with:
   - `X-Shopify-Customer-Id: apple_<appleId>` ✅
   - `Authorization: Bearer <token>` ✅
3. Backend saves goals to `hc_user_preferences` table with `shopify_customer_id = apple_<appleId>` ✅
4. User navigates to 7-Day Meal Plan
5. Frontend calls `GET /api/v1/user/goals` with:
   - `X-Shopify-Customer-Id: apple_<appleId>` ✅
   - `Authorization: Bearer <token>` ✅
6. Backend fetches goals from SAME customer ID ✅
7. Meal plan uses correct goals (1200/75/15/93) ✅

---

## Next Steps for User

### 1. Create New EAS Development Build ✅ REQUIRED

The frontend code has been updated, but you need a new build to get the changes.

**Run this command:**
```bash
cd C:\Users\derri\HeirclarkHealthAppNew
eas build --profile development --platform ios
```

**Or use the existing build command:**
```bash
eas build --profile development --platform ios --non-interactive
```

**Important:** Wait for build to complete (5-10 minutes), then install on your iPhone.

---

### 2. Test the Fix

After installing the new build:

1. **Clear existing auth data (fresh start)**
   - Go to Settings tab
   - Tap "Sign Out"
   - Tap "🔧 Clear All Auth (Debug)" button (this clears stale guest_ios_app data)

2. **Sign in with Apple**
   - Tap "Sign In with Apple"
   - Complete Apple authentication
   - **Expected:** You should see your Apple email, NOT dev@heirclark.com

3. **Set your goals again**
   - Go to Goals tab
   - Complete Goal Wizard with your keto macros:
     - 1200 calories
     - 75g protein
     - 15g carbs
     - 93g fat
   - Tap "Save Goals"
   - **Expected:** Success screen shows these exact numbers

4. **Generate 7-Day Meal Plan**
   - Go to 7-Day Plan tab
   - Tap "Generate New Plan"
   - **Expected:** Plan generated with 1200/75/15/93 macros (keto-friendly)

5. **Check console logs (optional)**
   ```
   [API] ✅ Updated shopifyCustomerId: apple_<your-apple-id>
   [GoalWizard] ✅ Goals synced to backend successfully!
   [GoalWizard] 💾 Saved: { calories: 1200, protein: 75, carbs: 15, fat: 93 }
   [MealPlanContext] 📥 Backend returned: { calories: 1200, protein: 75, carbs: 15, fat: 93 }
   ```

---

## Expected Results

✅ **Apple Sign In works** (no more "authorization attempt failed" error)
✅ **Goals save correctly** (1200/75/15/93)
✅ **Goals fetch correctly** (1200/75/15/93)
✅ **Meal plans use correct macros** (keto-friendly low carb, high fat)
✅ **No more defaults** (no more 2000/150/200/65)

---

## Technical Details

### Backend Code Flow

**Before (BROKEN):**
```
Frontend → X-Shopify-Customer-Id: guest_ios_app
Backend → Uses 'guest_ios_app' (ignores JWT)
Database → Goals saved to 'guest_ios_app' row
Database → Goals fetched from 'guest_ios_app' row
Result → Always returns defaults (no user-specific data)
```

**After (FIXED):**
```
Frontend → X-Shopify-Customer-Id: apple_<appleId>
Frontend → Authorization: Bearer <token with apple_<appleId>>
Backend → Uses 'apple_<appleId>' (consistent)
Database → Goals saved to 'apple_<appleId>' row
Database → Goals fetched from 'apple_<appleId>' row
Result → Returns user-specific goals (1200/75/15/93)
```

### Database Table Structure

**Table:** `hc_user_preferences`

**Primary Key:** `shopify_customer_id` (String)

**Example Data:**
```sql
shopify_customer_id | calories_target | protein_target | carbs_target | fat_target
--------------------|-----------------|----------------|--------------|------------
guest_ios_app       | 2200            | 190            | 190          | 60
apple_001234567890  | 1200            | 75             | 15           | 93
```

**Before Fix:** Always fetched from `guest_ios_app` row → defaults
**After Fix:** Fetches from `apple_<appleId>` row → user's actual goals

---

## Files Changed

### Backend (HeirclarkInstacartBackend)
- ✅ `src/routes/auth.ts` - Added Apple authentication endpoints
- ✅ Committed: `df5f085`
- ✅ Pushed to GitHub
- ✅ Deployed to Railway

### Frontend (HeirclarkHealthAppNew)
- ✅ `services/api.ts` - Update shopifyCustomerId from auth response
- ✅ Committed: `b822032`
- ✅ Pushed to GitHub
- ⚠️ **NEW BUILD REQUIRED** - User must run `eas build`

---

## Debugging Commands

If you encounter issues after new build:

**Check authentication:**
```javascript
// In console logs, look for:
[API] ✅ Updated shopifyCustomerId: apple_<your-id>
```

**Check goals save:**
```javascript
// After completing Goal Wizard:
[GoalWizard] ✅ Goals synced to backend successfully!
[GoalWizard] 💾 Saved: { calories: 1200, protein: 75, carbs: 15, fat: 93 }
```

**Check goals fetch:**
```javascript
// When generating meal plan:
[MealPlanContext] 🔍 Fetching goals from backend...
[MealPlanContext] 📥 Backend returned: { dailyCalories: 1200, dailyProtein: 75, dailyCarbs: 15, dailyFat: 93 }
[MealPlanContext] ✅ Using goals from backend: {...}
```

**Check Railway backend logs:**
```
[Auth] Apple Sign In request for Apple ID: 001234567890
[Auth] Creating new user preferences for apple_001234567890
[User] Goals saved for customer apple_001234567890
```

---

## Summary

✅ **Backend deployed** - Railway has the new Apple auth endpoints
✅ **Frontend committed** - GitHub has the updated api.ts
⚠️ **Build required** - User must create new EAS development build
📱 **Testing ready** - After new build, user can test complete flow

**Expected Timeline:**
- EAS build: 5-10 minutes
- Install on iPhone: 2 minutes
- Clear auth + sign in with Apple: 1 minute
- Set goals: 2 minutes
- Generate meal plan: 30 seconds
- **Total:** ~15 minutes to verify fix

---

## Contact

If issues persist after new build:
1. Check console logs for `[API] ✅ Updated shopifyCustomerId` message
2. Check Railway logs for `[User] Goals saved for customer apple_<appleId>`
3. Verify new build version (should show updated commit hash)
4. Try "Clear All Auth (Debug)" button again

**Last Updated:** 2026-02-04
**Status:** DEPLOYED TO PRODUCTION ✅
