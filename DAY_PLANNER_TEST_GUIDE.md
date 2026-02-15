# AI-Powered Day & Week Planner - Complete Test Guide

## 🎯 Feature Status: 100% COMPLETE & READY FOR TESTING

All 4 implementation phases are complete:
- ✅ Phase 1: Foundation (Types, Context, Scheduling Engine)
- ✅ Phase 2: Onboarding Flow (8-step wizard)
- ✅ Phase 3: Daily Timeline UI (Daily/Weekly views)
- ✅ Phase 4: Backend API (6 endpoints, 2 tables)
- ✅ Dependencies Installed (expo-calendar, datetimepicker)

---

## 📱 End-to-End Test Scenarios

### **Test 1: First-Time User Onboarding**

**Expected Flow:**
1. ✅ Open app
2. ✅ Navigate to **Planner** tab (calendar icon, 6th tab from left)
3. ✅ Onboarding modal appears automatically (full screen, blurred background)
4. ✅ See Welcome screen with 3 feature highlights
5. ✅ Tap "Get Started"

**Step-by-Step Onboarding:**

**Step 1/8 - Welcome:**
- See: Calendar icon, "Welcome to Day Planner" title
- See: 3 features (Smart Scheduling, Energy Optimization, Calendar Integration)
- See: "Step 1 of 8" progress indicator
- Tap: "Get Started" button

**Step 2/8 - Wake Time:**
- See: Sun icon, "What time do you wake up?" title
- See: iOS spinner time picker (or Android default picker)
- Default: 6:00 AM
- Action: Scroll to your actual wake time (e.g., 7:00 AM)
- See: Large preview of selected time
- Tap: "Next" button

**Step 3/8 - Sleep Time:**
- See: Moon icon, "What time do you go to bed?" title
- See: Time picker
- Default: 10:00 PM
- Action: Set your actual bedtime (e.g., 11:00 PM)
- See: Large preview of selected time
- Buttons: "Back" and "Next"

**Step 4/8 - Priorities:**
- See: "What are your top priorities?" title
- See: "Select up to 3 areas" subtitle
- See: 6 priority cards in grid:
  - Health & Fitness (dumbbell icon)
  - Work & Career (briefcase icon)
  - Family & Friends (heart icon)
  - Learning (book icon)
  - Hobbies (gamepad icon)
  - Relaxation (coffee icon)
- Action: Tap 3 cards (e.g., Health, Work, Family)
- See: Selected cards highlighted with colored border
- See: "3 / 3 selected" counter
- Tap: "Next" (disabled until at least 1 selected)

**Step 5/8 - Energy Peak:**
- See: "When is your peak energy time?" title
- See: 3 options:
  - Morning Person (6 AM - 12 PM) - sunrise icon
  - Afternoon Peak (12 PM - 5 PM) - sun icon
  - Night Owl (5 PM - 10 PM) - sunset icon
- Action: Tap your energy peak (e.g., Morning Person)
- See: Selected option highlighted
- Tap: "Next"

**Step 6/8 - Flexibility:**
- See: "How flexible is your schedule?" title
- See: 3 options:
  - Very Flexible
  - Somewhat Flexible
  - Not Very Flexible
- Action: Select one (e.g., Somewhat Flexible)
- Tap: "Next"

**Step 7/8 - Calendar Permission:**
- See: CalendarCheck icon, "Sync with your calendar?" title
- See: Privacy notices:
  - 🔒 Calendar data stays on your device
  - 🛡️ Never shared with our servers
- Buttons: "Back", "Skip", "Allow Access"
- Action: Tap "Allow Access"
- See: iOS/Android permission dialog
- Action: Tap "Allow" or "OK"
- See: Green "✓ Calendar access granted" banner
- Tap: "Continue"

**Step 8/8 - Review:**
- See: CheckCircle icon, "Review Your Preferences" title
- See: 6 preference rows with edit buttons:
  - Wake Time: 7:00 AM
  - Sleep Time: 11:00 PM
  - Priorities: Health & Fitness, Work & Career, Family & Friends
  - Energy Peak: Morning Person (6 AM - 12 PM)
  - Flexibility: Somewhat Flexible
  - Calendar Sync: Enabled
- Action: Tap edit button (✏️) on any row to go back to that step
- Tap: "Complete Setup"
- See: Modal closes, loading indicator
- See: "Generate Schedule" appears

**Auto-Generation:**
- Backend saves preferences to `planner_onboarding` table
- Frontend calls `generateWeeklyPlan()`
- Scheduling engine creates 7 daily timelines
- Backend saves to `planner_weekly_plans` table
- See: Daily timeline view appears

---

### **Test 2: Daily Timeline View**

**Expected State After Onboarding:**

**Header:**
- See: Today's date (e.g., "Saturday, Feb 15")
- See: Calendar sync button (calendar icon)
- See: Regenerate button (refresh icon)

**Timeline Grid:**
- See: Hourly labels from 6 AM to 6 AM (next day)
- See: Horizontal grid lines every hour
- See: Red "current time" indicator line (with time badge)
- Current time line should be at correct hour

**Time Blocks:**
- See: Multiple colored blocks for the day:
  - **Purple block**: Sleep (11:00 PM - 7:00 AM)
  - **Orange block**: Workout (7:00 AM - 7:30 AM) - scheduled at morning energy peak
  - **Teal/Yellow blocks**: Meals (breakfast, lunch, dinner)
  - **Blue blocks**: Calendar events (if you granted permission and have events today)
- Each block shows:
  - Activity icon
  - Title
  - Start time - End time
  - Duration (if tall enough)

**Stats Footer:**
- See: 3 stat columns:
  - Completion: 0% (initially)
  - Scheduled: ~8h
  - Free Time: ~8h

**Interactions to Test:**

**1. Swipe Gestures:**
- Find a non-sleep block (e.g., workout)
- Swipe RIGHT → Should mark as completed
  - ✅ Block gets checkmark icon
  - ✅ Haptic success feedback
  - ✅ Completion % increases in footer
- Swipe LEFT on another block → Should skip
  - ✅ Block gets X icon
  - ✅ Haptic warning feedback
  - ✅ Block grayed out

**2. Calendar Sync:**
- Tap "Calendar Sync" button (top right)
- See: Loading spinner
- ✅ Calendar events imported (check console logs)
- ✅ New blue blocks appear if you have calendar events today
- **IMPORTANT**: Calendar events should NOT appear in backend database (privacy check)

**3. Regenerate Schedule:**
- Tap "Regenerate" button (refresh icon)
- See: Loading state
- ✅ New timeline generated with different block times
- ✅ Stats footer updates

**4. Auto-Scroll:**
- Force close app and reopen
- Navigate to Planner tab
- ✅ Timeline should auto-scroll to current time (minus 1 hour for context)

---

### **Test 3: Weekly Overview**

**Switch to Weekly View:**
- Tap "Weekly" in segmented control (top)
- See: View switches from daily to weekly

**Weekly Stats Card:**
- See: "This Week" title
- See: 4 stats in grid:
  - Workouts: 0/7
  - Meals: 0/21
  - Free Time/Day: ~8h
  - Productivity: 0%

**Day Cards (Horizontal Scroll):**
- See: 7 day cards (Sun - Sat)
- Each card shows:
  - Day abbreviation (Sun, Mon, Tue, etc.)
  - Day number (15, 16, 17, etc.)
  - Progress bar (based on completion rate)
  - "X/Y done" stats
- Current day should have blue border
- Swipe left/right to scroll through week

**Interactions:**
- Tap any day card
- ✅ Should navigate to that day's timeline
- ✅ Daily view should load with that date
- ✅ Segmented control should switch back to "Daily"

---

### **Test 4: Backend API Integration**

**Check Backend Logs:**

Open Railway dashboard or local backend console and verify:

**1. Onboarding Save:**
```
[Planner] Onboarding saved for user <user_id>
```

**2. Weekly Plan Save:**
```
[Planner] Weekly plan saved for user <user_id>, week 2026-02-16
```

**3. Block Status Updates:**
```
[Planner] Block <block_id> status updated to completed for user <user_id>
```

**Database Verification:**

Connect to PostgreSQL and run:

```sql
-- Check onboarding table
SELECT * FROM planner_onboarding;
-- Should show 1 row with your preferences JSON

-- Check weekly plans table
SELECT * FROM planner_weekly_plans;
-- Should show 1 row with plan_data JSON

-- Verify calendar events are NOT in database (privacy check)
SELECT plan_data::text FROM planner_weekly_plans WHERE plan_data::text LIKE '%calendar_event%';
-- Should return no results (calendar events filtered)
```

---

### **Test 5: AI Optimization (Manual Trigger)**

**Note:** AI optimization is currently manual (no auto-Sunday trigger yet).

To test AI optimization:

1. Use Postman/Insomnia or cURL:

```bash
curl -X POST https://heirclarkinstacartbackend-production.up.railway.app/api/v1/planner/optimize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentWeekPlan": {
      "weeklyStats": {
        "workoutsCompleted": 3,
        "workoutsScheduled": 5,
        "mealsCompleted": 15,
        "mealsScheduled": 21,
        "avgFreeTime": 480,
        "productivityScore": 65
      }
    },
    "completionHistory": [
      {"date": "2026-02-15", "completionRate": 70, "skippedBlocks": ["block_123"], "completedBlocks": ["block_456"]},
      {"date": "2026-02-14", "completionRate": 80, "skippedBlocks": [], "completedBlocks": ["block_789"]}
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "optimization": {
    "weeklyInsights": "Your completion rate of 65% shows room for improvement...",
    "suggestions": [
      {
        "type": "reschedule",
        "recommendation": "Move evening workouts to morning (your energy peak)",
        "reason": "You're a morning person and 2/3 missed workouts were scheduled in evening",
        "priority": "high"
      }
    ],
    "predictedImprovements": {
      "completionRateIncrease": 15,
      "stressReduction": "moderate"
    },
    "generatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### **Test 6: Edge Cases & Error Handling**

**1. No Weekly Plan:**
- Clear AsyncStorage: Settings → Developer → Clear Cache
- Reopen Planner tab
- ✅ Should show "No timeline available" message
- ✅ "Generate Schedule" button should appear
- Tap button → Plan generates

**2. Calendar Permission Denied:**
- Go through onboarding again
- On calendar permission step, tap "Skip"
- ✅ Should continue without calendar sync
- ✅ calendarSyncEnabled = false in preferences
- ✅ No calendar events in timeline

**3. Offline Mode:**
- Turn off WiFi/data
- Complete onboarding
- ✅ Preferences save to AsyncStorage
- ✅ Weekly plan generates client-side
- ✅ Timeline renders (backend sync fails gracefully)
- Turn WiFi back on
- Navigate away and back
- ✅ Data syncs to backend

**4. Large Number of Events:**
- Create 20+ calendar events for today
- Sync calendar
- ✅ All events should import
- ✅ Timeline should handle overflow gracefully
- ✅ Scroll should work smoothly

---

## 🐛 Expected Issues (Known Limitations)

**1. Calendar Events Not Synced Automatically:**
- **Current:** Must tap "Sync Calendar" button manually
- **Workaround:** Tap sync button when you open planner
- **Future:** Auto-sync on app open

**2. AI Optimization Requires Manual API Call:**
- **Current:** No UI button to trigger optimization
- **Workaround:** Use API directly (Postman/cURL)
- **Future:** Add "Optimize Week" button + Sunday cron job

**3. No Drag-and-Drop:**
- **Current:** Can only swipe to complete/skip, not reschedule
- **Workaround:** Use regenerate button to get new schedule
- **Future:** Implement drag-and-drop with collision detection

**4. Calendar Events Show in UI But Not in Backend:**
- **Expected:** This is intentional (privacy-first design)
- Calendar events are CLIENT-SIDE ONLY
- They appear in timeline UI but are filtered before database save

---

## ✅ Success Criteria Checklist

**Onboarding:**
- [ ] Modal appears on first planner tab visit
- [ ] All 8 steps are navigable (back/next buttons work)
- [ ] Time pickers show iOS spinner or Android default
- [ ] Priority selection enforces max 3
- [ ] Calendar permission request works (iOS/Android)
- [ ] Review screen shows all selections correctly
- [ ] Edit buttons navigate to correct steps
- [ ] "Complete Setup" saves to backend (check console logs)
- [ ] Weekly plan auto-generates after completion

**Daily Timeline:**
- [ ] 24-hour grid renders (6 AM - 6 AM)
- [ ] Current time indicator shows at correct hour
- [ ] Current time updates every minute
- [ ] Auto-scroll to current time on mount
- [ ] Time blocks positioned correctly (no overlaps)
- [ ] Swipe right marks complete with haptic
- [ ] Swipe left skips with warning haptic
- [ ] Completion % updates in stats footer
- [ ] Calendar sync imports events (CLIENT-SIDE)
- [ ] Regenerate creates new schedule

**Weekly Overview:**
- [ ] Segmented control switches views
- [ ] Weekly stats card shows correct metrics
- [ ] 7 day cards render (Sun-Sat)
- [ ] Current day highlighted with border
- [ ] Horizontal scroll works smoothly
- [ ] Tap day card navigates to daily view
- [ ] Progress bars reflect completion

**Backend:**
- [ ] Onboarding saved to database
- [ ] Weekly plan saved to database
- [ ] Calendar events NOT in database (privacy check)
- [ ] Block status updates logged
- [ ] All endpoints require authentication
- [ ] Auto-migrations run on server startup
- [ ] AI optimization returns JSON response

**Performance:**
- [ ] Timeline renders in <100ms
- [ ] Swipe gestures feel responsive (60fps)
- [ ] No janky scrolling
- [ ] AsyncStorage loads instantly
- [ ] Backend sync doesn't block UI

---

## 🎓 Test Completion Report Template

After testing, fill out this report:

**Test Date:** _______________________
**Tester:** _______________________
**App Version:** _______________________
**Device:** _______________________

**Results:**

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| First-Time Onboarding | ✅ / ❌ | |
| Daily Timeline View | ✅ / ❌ | |
| Weekly Overview | ✅ / ❌ | |
| Backend API Integration | ✅ / ❌ | |
| AI Optimization | ✅ / ❌ | |
| Edge Cases | ✅ / ❌ | |

**Bugs Found:**
1. _______________________
2. _______________________
3. _______________________

**Feature Requests:**
1. _______________________
2. _______________________
3. _______________________

**Overall Assessment:**
- Production Ready: YES / NO
- Confidence Level: Low / Medium / High
- Recommended Actions: _______________________

---

## 📞 Support & Troubleshooting

**Common Issues:**

**1. "Onboarding modal doesn't appear"**
- Check: Is planner tab accessible?
- Fix: Ensure DayPlannerProvider is in app layout
- Verify: Look for `[Planner]` logs in console

**2. "Time blocks not showing"**
- Check: Did weekly plan generate?
- Fix: Tap "Generate Schedule" button
- Verify: Check AsyncStorage for `hc_planner_weekly_plan`

**3. "Calendar sync not working"**
- Check: Permission granted?
- Fix: Go to Settings → App Permissions → Calendar → Enable
- Verify: See `[Planner] ✅ Synced X calendar events` in logs

**4. "Backend endpoints returning 401"**
- Check: User authenticated?
- Fix: Login again to get fresh JWT token
- Verify: Check Authorization header in API calls

**5. "Database tables don't exist"**
- Check: Did migrations run?
- Fix: Restart backend server
- Verify: Look for `[Migrations] ✅ Completed successfully` in logs

---

## 🚀 Next Steps After Testing

**If All Tests Pass:**
1. ✅ Feature is production-ready!
2. Announce to team/users
3. Monitor backend logs for errors
4. Collect user feedback
5. Plan future enhancements (drag-and-drop, auto-sync, etc.)

**If Issues Found:**
1. Document bugs in this file
2. Create GitHub issues
3. Prioritize by severity (critical/high/medium/low)
4. Fix critical bugs before release
5. Re-test affected areas

---

**Feature Status:** 🟢 COMPLETE & READY FOR TESTING
**Last Updated:** February 15, 2026
**Implementation:** Claude Sonnet 4.5
**Total Time:** ~4 hours (Phases 1-4)
