# Apple-Only Authentication Migration ✅

## Summary

Successfully migrated from Shopify + Apple hybrid authentication to **Apple Sign In ONLY**. This is a simpler, more secure architecture specifically designed for iOS apps.

---

## What Changed

### ❌ Removed (Shopify Dependencies)
- `X-Shopify-Customer-Id` header
- `shopifyCustomerId` property in frontend
- `setUserIds()` method (legacy)
- `POST /api/v1/auth/token` endpoint (deprecated)
- Legacy header-based authentication

### ✅ Added (Apple-Only)
- Strict JWT Bearer token authentication ONLY
- `strictAuth: true` on all user routes
- Clear error messages for legacy auth attempts
- Simplified authentication flow

---

## Architecture Changes

### Before (Hybrid - INSECURE)
```
Frontend sends:
  - X-Shopify-Customer-Id: guest_ios_app (hardcoded)
  - Authorization: Bearer <token>

Backend accepts:
  - X-Shopify-Customer-Id header (priority #1) ❌ IDOR vulnerability
  - Authorization: Bearer token (priority #2)

Result: Header injection vulnerability, mismatched customer IDs
```

### After (Apple-Only - SECURE)
```
Frontend sends:
  - Authorization: Bearer <token> (ONLY)

Backend accepts:
  - Authorization: Bearer token (ONLY)
  - Rejects X-Shopify-Customer-Id with 401 error

Result: Strict JWT validation, no header injection possible
```

---

## API Changes

### Authentication Endpoints

**✅ POST /api/v1/auth/apple** (PRIMARY AUTH)
```typescript
Request:
{
  appleId: string,
  email?: string,
  fullName?: string
}

Response:
{
  success: true,
  token: "eyJhbGc...",
  user: {
    id: "apple_001234567890",
    email: "user@icloud.com",
    fullName: "John Doe"
  }
}
```

**❌ POST /api/v1/auth/token** (DEPRECATED)
```typescript
Response (410 Gone):
{
  ok: false,
  error: "This endpoint is deprecated. Use POST /api/v1/auth/apple for authentication."
}
```

**✅ GET /api/v1/auth/me**
```typescript
Headers:
  Authorization: Bearer <token>

Response:
{
  success: true,
  user: {
    id: "apple_001234567890",
    email: null,
    fullName: null
  }
}
```

**✅ POST /api/v1/auth/logout**
```typescript
Response:
{
  success: true,
  message: "Logged out successfully. Token cleared client-side."
}
```

---

## User Routes (Strict Auth)

All `/api/v1/user/*` routes now enforce `strictAuth: true`:

**✅ Accepts:**
- `Authorization: Bearer <token>`

**❌ Rejects (401 Unauthorized):**
- `X-Shopify-Customer-Id` header
- `X-Customer-ID` header
- `shopifyCustomerId` query parameter
- `shopifyCustomerId` body parameter

**Examples:**

```bash
# ✅ CORRECT - Will work
curl -H "Authorization: Bearer eyJhbGc..." \
  https://heirclarkinstacartbackend-production.up.railway.app/api/v1/user/goals

# ❌ WRONG - Will fail with 401
curl -H "X-Shopify-Customer-Id: guest_ios_app" \
  https://heirclarkinstacartbackend-production.up.railway.app/api/v1/user/goals
```

---

## Frontend Changes

### HeirclarkAPI Class

**Before:**
```typescript
class HeirclarkAPI {
  private baseUrl: string;
  private authToken: string | null = null;
  private odooId: string;                    // ❌ Removed
  private shopifyCustomerId: string;         // ❌ Removed

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.odooId = 'guest_user';              // ❌ Removed
    this.shopifyCustomerId = 'guest_ios_app'; // ❌ Removed
    this.loadAuthToken();
  }

  setUserIds(odooId: string, shopifyCustomerId?: string) { // ❌ Removed
    this.odooId = odooId;
    this.shopifyCustomerId = shopifyCustomerId;
  }

  private getHeaders(): HeadersInit {
    return {
      'X-Shopify-Customer-Id': this.shopifyCustomerId, // ❌ Removed
      'Authorization': `Bearer ${this.authToken}`,
    };
  }
}
```

**After:**
```typescript
class HeirclarkAPI {
  private baseUrl: string;
  private authToken: string | null = null;  // ✅ ONLY this

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.loadAuthToken();                    // ✅ Simplified
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`; // ✅ JWT only
    }
    return headers;
  }
}
```

---

## Security Improvements

### 1. Eliminated IDOR Vulnerability ✅
**Before:** Attacker could send `X-Shopify-Customer-Id: victim_user_id` to access other users' data.

**After:** Only JWT Bearer tokens accepted. Token contains validated customer ID from Apple authentication.

### 2. Strict Authentication Enforcement ✅
**Before:** Multiple authentication methods (headers, query params, body params) created confusion and attack surface.

**After:** Single authentication method (JWT Bearer token only). Clear error messages for wrong auth method.

### 3. No Legacy Auth Methods ✅
**Before:** Legacy Shopify authentication paths still accessible.

**After:** All legacy endpoints deprecated or return 410 Gone. Forces migration to secure Apple auth.

---

## Database Schema

Still uses `hc_user_preferences` table with `shopify_customer_id` column, but now stores Apple IDs:

**Format:** `apple_<appleId>`

**Example:**
```sql
shopify_customer_id     | calories_target | protein_target | carbs_target | fat_target
------------------------|-----------------|----------------|--------------|------------
apple_001234567890      | 1200            | 75             | 15           | 93
apple_009876543210      | 2000            | 150            | 200          | 65
```

**Why not rename column?**
- Maintains backward compatibility with existing database schema
- No migration needed for existing users
- Column name doesn't affect functionality (just an identifier)
- Future schema updates can rename if needed

---

## Migration Timeline

### ✅ Phase 1: Backend Migration (COMPLETE)
- Deprecated `/auth/token` endpoint
- Added strict auth to user routes
- Deployed to Railway

### ✅ Phase 2: Frontend Migration (COMPLETE)
- Removed Shopify dependencies
- Simplified authentication
- Committed to GitHub

### ⚠️ Phase 3: User Testing (REQUIRED)
- User must create new EAS development build
- Test Apple Sign In flow
- Verify goals save/fetch correctly
- Confirm meal plans use correct macros

---

## Testing Instructions

### 1. Create New Build
```bash
cd C:\Users\derri\HeirclarkHealthAppNew
eas build --profile development --platform ios --non-interactive
```

### 2. Install on iPhone
- Wait for build to complete (5-10 minutes)
- Install new build from Expo dashboard

### 3. Test Authentication
```
1. Open app
2. Tap "Sign In with Apple"
3. Complete Apple authentication
4. Check console logs:
   [API] 🍎 Authenticating with Apple ID...
   [API] ✅ Apple authentication successful
```

### 4. Test Goals Save
```
1. Go to Goals tab
2. Complete Goal Wizard (1200/75/15/93)
3. Tap "Save Goals"
4. Check console logs:
   [GoalWizard] ✅ Goals synced to backend successfully!
   [GoalWizard] 💾 Saved: { calories: 1200, protein: 75, carbs: 15, fat: 93 }
```

### 5. Test Goals Fetch (7-Day Meal Plan)
```
1. Go to 7-Day Plan tab
2. Tap "Generate New Plan"
3. Check console logs:
   [MealPlanContext] 📥 Backend returned: { dailyCalories: 1200, dailyProtein: 75, ... }
   [MealPlanContext] ✅ Using goals from backend
4. Verify meal plan uses keto macros (low carb, high fat)
```

### 6. Test Logout
```
1. Go to Settings tab
2. Tap "Sign Out"
3. Verify you're signed out
4. Try signing back in with Apple
```

---

## Expected Console Logs

### ✅ Successful Authentication
```
[API] 🍎 Authenticating with Apple ID...
[API] ✅ Apple authentication successful
```

### ✅ Successful Goals Save
```
[GoalWizard] 🔄 Attempting to save goals to backend...
[GoalWizard] 📊 Goals payload: { dailyCalories: 1200, dailyProtein: 75, ... }
[GoalWizard] ✅ Goals synced to backend successfully!
```

### ✅ Successful Goals Fetch
```
[MealPlanContext] 🔍 Fetching goals from backend...
[MealPlanContext] 📥 Backend returned: { dailyCalories: 1200, ... }
[MealPlanContext] ✅ Using goals from backend
```

### ❌ Authentication Error (Old Build)
```
[API] ❌ Apple auth failed: 401
Error: Authorization token required
```

---

## Rollback Plan (If Needed)

If issues occur, you can temporarily rollback:

**Backend Rollback:**
```bash
cd C:\Users\derri\HeirclarkInstacartBackend
git revert 8069be8
git push
```

**Frontend Rollback:**
```bash
cd C:\Users\derri\HeirclarkHealthAppNew
git revert 2acc2f1
git push
```

Then create new EAS build with reverted code.

---

## Future Cleanup (Optional)

### Database Schema Update
Rename `shopify_customer_id` → `user_id` or `apple_id`:

```sql
ALTER TABLE hc_user_preferences
  RENAME COLUMN shopify_customer_id TO apple_id;
```

### Remove Legacy Code
- Search for any remaining Shopify references
- Remove deprecated `/auth/token` endpoint entirely
- Clean up legacy error messages

---

## Benefits

### ✅ Security
- Eliminated IDOR vulnerability
- Strict JWT-only authentication
- No header injection attacks possible

### ✅ Simplicity
- Single authentication method
- Cleaner codebase
- Easier to maintain

### ✅ iOS-Native
- Apple Sign In integration
- No web-based Shopify dependencies
- Native iOS experience

### ✅ Performance
- Fewer authentication checks
- Simpler request headers
- Faster backend validation

---

## Commits

**Backend:**
- `8069be8` - Migrate to Apple-only authentication (remove Shopify)

**Frontend:**
- `2acc2f1` - Remove Shopify authentication (Apple-only iOS app)

---

## Status

✅ **Backend:** Deployed to Railway
✅ **Frontend:** Committed to GitHub
⚠️ **Build:** User must create new EAS development build
📱 **Testing:** Awaiting user verification

---

**Last Updated:** 2026-02-04
**Status:** READY FOR TESTING ✅
