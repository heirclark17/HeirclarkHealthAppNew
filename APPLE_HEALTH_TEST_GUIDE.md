# Apple Health Calories Integration - Manual Test Guide

## ✅ What Was Implemented

1. **Apple Health Service Integration**
   - Fetches active energy burned (calories out) from Apple Health
   - Automatically syncs when app loads and when date changes
   - Syncs when pulling to refresh

2. **Dashboard Display**
   - "CALORIES OUT" card shows Apple Health calories
   - Daily Balance gauge uses the data
   - Daily Fat Loss card calculates deficit using Apple Health calories

3. **WearableSyncCard Integration**
   - Triggers refresh after successful Apple Health connection
   - Triggers refresh after manual sync

## 🧪 Manual Testing Steps

### Test 1: Verify Initial Load
1. **Reload the app** in Heirclark (shake device → Reload)
2. **Watch the dev server logs** for:
   ```
   [Dashboard] Fetching Apple Health calories...
   [Dashboard] Apple Health data received: {...}
   [Dashboard] Setting caloriesOut to: [number]
   ```
3. **Check the "CALORIES OUT" card** on the dashboard
   - Should display a number (not 0 if you have activity today)
   - Number should match your Apple Health active calories

### Test 2: Verify Calories Display
1. Open **Apple Health** app on iPhone
2. Go to **Browse** → **Activity** → **Active Energy**
3. Note today's active energy burned (in kcal)
4. Open **Heirclark** app
5. **Compare** the "CALORIES OUT" value with Apple Health
   - Should be approximately the same (may differ by a few calories due to timing)

### Test 3: Verify Sync After Connection
1. **Disconnect** Apple Health (if connected):
   - Tap "WEARABLE SYNC" to expand
   - Tap "Disconnect" on Apple Health
2. **Reconnect** Apple Health:
   - Tap "Connect" on Apple Health
   - Grant permissions
   - Wait for "Success" alert
3. **Check logs** for:
   ```
   [Dashboard] Fetching Apple Health calories...
   [Dashboard] Apple Health data received
   ```
4. **Verify** "CALORIES OUT" card updated

### Test 4: Verify Manual Sync
1. In **WEARABLE SYNC** card, tap **"Sync"** on Apple Health
2. Wait for success message
3. **Check** that "CALORIES OUT" updates if Apple Health has new data

### Test 5: Verify Pull-to-Refresh
1. **Pull down** on the dashboard to refresh
2. **Watch logs** for Apple Health fetch
3. **Verify** "CALORIES OUT" updates

### Test 6: Verify Date Change
1. Tap the **calendar** at the top
2. Select **yesterday's date**
3. **Watch logs** - should fetch Apple Health data for yesterday
4. Return to **today** and verify it fetches today's data again

### Test 7: Verify Calorie Balance
1. Log a meal with known calories (e.g., 500 kcal)
2. Note your **Calories In** (should be 500)
3. Note your **Calories Out** (from Apple Health)
4. Open **DAILY FAT LOSS** card
5. **Verify** the deficit calculation:
   - Expected: Calories In - Calories Out
   - Should show surplus (+) or deficit (-)

## 📊 Expected Console Logs

When everything is working, you should see these logs in order:

```
[AppleHealth] Module loaded successfully
[AppleHealth] Module is available and ready
[Dashboard] Fetching Apple Health calories...
[AppleHealth] Module is available and ready
[Dashboard] Apple Health data received: {steps: X, caloriesOut: Y, restingEnergy: Z, distance: A}
[Dashboard] Setting caloriesOut to: Y
```

## ❌ Troubleshooting

### No "[Dashboard] Fetching..." logs
- **Solution**: Reload the app (shake → Reload)
- App needs to pick up new code changes

### Calories Out shows 0
- **Possible reasons**:
  1. No activity recorded in Apple Health today
  2. App doesn't have permission to read Active Energy
  3. App needs to be reloaded

- **Fix**:
  1. Check Apple Health has activity data for today
  2. Go to Settings → Privacy & Security → Health → Heirclark
  3. Ensure "Active Energy Burned" is enabled
  4. Reload app

### "[AppleHealth] Module not available" error
- **Solution**: Need to rebuild the app with HealthKit entitlements
- Use the development build from: https://expo.dev/accounts/heirclarks-organization/projects/heirclark/builds/0767f3cd-3649-4358-8015-55016571b1f3

### Calories don't match Apple Health exactly
- **This is normal**: Apple Health updates throughout the day
- **Timing difference**: The fetch happens at different times
- **Try**: Pull to refresh to get latest data

## ✨ Success Criteria

- ✅ "CALORIES OUT" displays a number from Apple Health
- ✅ Number updates when pulling to refresh
- ✅ Number updates after manual sync
- ✅ Number changes when selecting different dates
- ✅ Daily Fat Loss card shows accurate deficit/surplus
- ✅ Console logs show successful Apple Health data fetch

## 🎯 Test Status

After completing all tests, verify:
1. [ ] Initial load fetches Apple Health calories
2. [ ] Calories Out card displays correct value
3. [ ] Sync after connection works
4. [ ] Manual sync updates calories
5. [ ] Pull-to-refresh works
6. [ ] Date change triggers new fetch
7. [ ] Calorie balance calculation is accurate

---

**Date Created**: January 20, 2026
**Build Version**: Build #7
**Feature**: Apple Health Calories Integration
