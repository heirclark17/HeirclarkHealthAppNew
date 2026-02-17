# Heirclark Health App - Development Guide

## OpenAI Integration

### Overview
The app uses OpenAI's **GPT-4.1 mini** model for generating personalized AI guidance content.

### Model Information
- **Model**: `gpt-4.1-mini`
- **Description**: Smaller, faster version of GPT-4.1
- **Use Cases**: Personalized workout guidance, daily health guidance, nutrition recommendations
- **Documentation**: https://platform.openai.com/docs/models/gpt-4.1-mini

### Available OpenAI Models (as of Feb 2026)

#### Frontier Models (Recommended for most tasks)
- **GPT-5.2**: The best model for coding and agentic tasks
- **GPT-5 mini**: Faster, cost-efficient version of GPT-5
- **GPT-5 nano**: Fastest, most cost-efficient version of GPT-5
- **GPT-4.1**: Smartest non-reasoning model
- **GPT-4.1 mini**: Smaller, faster version of GPT-4.1 ⭐ **(Currently used)**
- **GPT-4.1 nano**: Fastest, most cost-efficient version of GPT-4.1

#### Legacy Models
- **GPT-4o**: Fast, intelligent, flexible GPT model
- **GPT-4o mini**: Fast, affordable small model for focused tasks
- **GPT-4 Turbo**: An older high-intelligence GPT model
- **GPT-3.5 Turbo**: Legacy GPT model for cheaper tasks

### Implementation Files

#### Service Layer
**File**: `services/openaiService.ts`

Contains three main functions for generating AI content:

1. **generateWorkoutGuidance(params)**
   - Generates 3-4 paragraph personalized workout plan
   - Inputs: goal, workout frequency, duration, activity level, equipment, injuries
   - Temperature: 0.7
   - Max tokens: 600

2. **generateDailyGuidance(params)**
   - Generates 2-3 paragraph daily health guidance
   - Inputs: goal, weight data, activity level, macro targets
   - Temperature: 0.7
   - Max tokens: 400

3. **generateNutritionGuidance(params)**
   - Generates 3-4 paragraph nutrition guidance
   - Inputs: diet style, allergies, cuisines, cooking time, budget, meals/day
   - Temperature: 0.7
   - Max tokens: 600

#### UI Integration
**File**: `components/goals/SuccessScreen.tsx`

AI content is displayed in three cards:
1. **Workout Plan Card**: Shows AI-generated workout guidance with loading state
2. **Daily Guidance Card**: Shows AI-generated daily tips with loading state
3. **Nutrition Preferences Card**: Shows AI-generated nutrition guidance at bottom

### Environment Configuration

#### Required Environment Variable
```env
# .env file
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...your-key-here
```

#### Getting Your API Key
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to `.env` file as shown above

#### Expo Configuration
The service uses Expo's built-in environment variable system:
```typescript
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.openaiApiKey ||
               process.env.EXPO_PUBLIC_OPENAI_API_KEY;
```

### Usage Example

```typescript
import { generateWorkoutGuidance } from '@/services/openaiService';

// Generate workout guidance
const guidance = await generateWorkoutGuidance({
  primaryGoal: 'lose_weight',
  workoutsPerWeek: 3,
  workoutDuration: 30,
  activityLevel: 'moderate',
  equipmentAccess: ['dumbbells', 'bodyweight'],
  injuries: 'Lower back pain',
});

console.log(guidance);
// Output: "Based on your goal to lose weight and your moderate
// activity level, we recommend a fat-burning HIIT program..."
```

### Error Handling

All AI generation functions include try-catch blocks with fallback messages:

```typescript
try {
  const guidance = await generateWorkoutGuidance(params);
  setWorkoutGuidance(guidance);
} catch (error) {
  console.error('[SuccessScreen] Error generating workout guidance:', error);
  setWorkoutGuidance('Your personalized workout plan is being prepared. Please check back soon.');
}
```

### Loading States

Each AI content section has its own loading state:
- `isLoadingWorkout` - Workout plan card
- `isLoadingDaily` - Daily guidance card
- `isLoadingNutrition` - Nutrition guidance section

UI shows `<ActivityIndicator>` with context-specific message during generation.

### API Configuration

```typescript
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Required for React Native
});
```

**Note**: `dangerouslyAllowBrowser: true` is required because OpenAI SDK uses fetch, which is available in React Native but flagged as "browser environment."

### Cost Optimization

**GPT-4.1 mini** is cost-effective for this use case:
- **Input**: ~$0.15 per 1M tokens
- **Output**: ~$0.60 per 1M tokens
- **Typical request**: ~200 input tokens, ~400 output tokens
- **Cost per generation**: ~$0.00027 (less than a cent per user)

### Prompt Engineering Best Practices

1. **Clear Role Definition**: Each function defines the AI as a specific professional (fitness coach, nutrition specialist)

2. **Structured Inputs**: User data is clearly organized and labeled:
   ```
   Goal: lose weight
   Training Frequency: 3 days per week
   Session Duration: 30 minutes
   ```

3. **Specific Output Requirements**: Prompts specify paragraph count, tone, and perspective:
   ```
   "Create a detailed, personalized workout guidance summary (3-4 paragraphs)"
   "Write in second person ('you should...')"
   "Be encouraging, specific, and evidence-based"
   ```

4. **Context-Aware**: Prompts adapt to user constraints:
   ```typescript
   ${params.injuries ? `Injuries/Limitations: ${params.injuries}` : ''}
   ```

### Testing Locally

1. Add your OpenAI API key to `.env`:
   ```bash
   echo "EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-your-key-here" > .env
   ```

2. Start Expo dev server:
   ```bash
   npm start
   ```

3. Navigate to Success Screen after completing goal wizard

4. Watch console for AI generation logs:
   ```
   [SuccessScreen] Generating workout guidance...
   [OpenAI Service] Generating workout guidance for lose_weight goal
   [SuccessScreen] ✅ Workout guidance generated
   ```

### Rate Limiting

OpenAI has rate limits based on your tier:
- **Free tier**: 3 requests per minute
- **Tier 1**: 60 requests per minute
- **Tier 2+**: Higher limits

For production, implement request queuing if needed.

### Security Best Practices

✅ **DO:**
- Keep API key in `.env` file (gitignored)
- Use `EXPO_PUBLIC_` prefix for client-side keys
- Monitor API usage in OpenAI dashboard
- Implement error handling with fallback content

❌ **DON'T:**
- Commit API keys to git
- Hardcode API keys in source code
- Expose API key in logs or error messages
- Use production keys in development

### Future Enhancements

Potential improvements:
1. **Caching**: Store AI-generated content to avoid regenerating for same inputs
2. **Streaming**: Use OpenAI streaming API for real-time content generation
3. **Fine-tuning**: Fine-tune GPT-4.1 mini on fitness/nutrition domain data
4. **Conversation**: Allow users to ask follow-up questions about their guidance
5. **Localization**: Generate content in user's preferred language
6. **A/B Testing**: Test different prompt strategies for better engagement

### Troubleshooting

#### "API key not found" error
- Ensure `.env` file exists in project root
- Verify `EXPO_PUBLIC_OPENAI_API_KEY` is set correctly
- Restart Expo dev server after changing `.env`

#### "Rate limit exceeded" error
- You're hitting OpenAI rate limits
- Wait 60 seconds and try again
- Upgrade OpenAI tier if needed

#### Content not generating
- Check browser/Expo console for errors
- Verify API key is valid at https://platform.openai.com/api-keys
- Test with curl to isolate issue:
  ```bash
  curl https://api.openai.com/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
      "model": "gpt-4.1-mini",
      "messages": [{"role": "user", "content": "Hello"}]
    }'
  ```

#### "dangerouslyAllowBrowser" warning
- This is expected in React Native - it's safe to ignore
- The SDK uses fetch which is available in RN 0.60+

### Related Documentation
- OpenAI Platform Docs: https://platform.openai.com/docs
- GPT-4.1 mini: https://platform.openai.com/docs/models/gpt-4.1-mini
- Expo Environment Variables: https://docs.expo.dev/guides/environment-variables/

---

## AI-Powered Calendar Integration

### Overview
The app includes a comprehensive AI-powered daily planner that intelligently schedules workouts and meals around device calendar events using GPT-4.1-mini. The system analyzes user preferences, calendar availability, fasting windows, recovery status, and completion patterns to generate conflict-free daily timelines.

### Architecture

#### Core Services
1. **aiSchedulingService.ts** (348 lines)
   - Primary AI scheduling engine using OpenAI GPT-4.1-mini
   - Structured JSON prompts (not free-text responses)
   - Handles fasting windows with strict validation
   - Post-generation conflict detection
   - Respects calendar events as immovable anchors
   - Temperature: 0.3 (fast, consistent)
   - Max tokens: 1200
   - Response format: JSON object

2. **schedulingEngine.ts** (812 lines)
   - Algorithmic fallback using constraint satisfaction
   - Recovery-aware adjustments
   - Meeting density detection
   - Fasting window enforcement
   - Intelligent buffer management between blocks
   - Conflict detection and resolution

3. **DayPlannerContext.tsx**
   - State management for planner
   - Tries AI scheduling first, falls back to algorithm on error
   - Extracts workouts from TrainingContext
   - Extracts meals from MealPlanContext
   - Integrates device calendar events (expo-calendar)
   - Manages completion tracking

### User Interface Components

#### Event Detail Modals
Located in `components/planner/modals/`:

1. **WorkoutDetailModal.tsx**
   - Shows workout exercises, sets/reps, weight
   - Estimated duration and calories
   - Mark complete / Skip actions
   - Reschedule button
   - Liquid glass design with blur effects

2. **MealDetailModal.tsx**
   - Shows macro breakdown (protein, carbs, fat, calories)
   - Ingredient list
   - Prep/cook time
   - Mark complete / Skip actions
   - Reschedule button

3. **CalendarEventDetailModal.tsx**
   - Shows calendar event details
   - Time, location, notes
   - "Open in Calendar" deep link button

4. **BlockDetailModal.tsx**
   - Wrapper component that routes to appropriate modal based on block type
   - Handles workout, meal_eating, meal_prep, calendar_event types

#### Weekly Completion Tracking
Located in `components/planner/stats/`:

**WeeklyCompletionRing.tsx**
- Animated SVG ring showing weekly adherence percentage
- Color-coded by completion level:
  - Green (80%+): Excellent adherence
  - Yellow (60-79%): Good adherence
  - Red (<60%): Needs improvement
- Breakdown by category:
  - Overall completion (completed/total blocks)
  - Workout completion
  - Meal completion
- Excludes sleep, buffer, and calendar events from stats
- Animated spring physics for progress updates

#### "Plan My Week" Flow
Located in `components/planner/actions/`:

**PlanMyWeekButton.tsx**
- Floating action button with liquid glass design
- Triggers AI re-planning for all 7 days
- Loading modal with states:
  - **Planning**: Shows spinner and "Planning Your Week" message
  - **Success**: Shows checkmark and confirmation
  - **Conflicts**: Shows conflict list with resolution options
- Haptic feedback for all interactions
- Auto-dismisses success state after 2 seconds

#### Timeline Rendering
Located in `components/planner/timeline/`:

1. **DailyTimelineView.tsx** (Enhanced)
   - Main daily timeline with hourly grid
   - All-day event banner chips (birthdays, holidays, OOO days)
   - Timed event blocks with absolute positioning
   - Fasting window overlay (blue transparent zone)
   - Sleep window overlay (purple transparent zone)
   - Current time indicator
   - Floating AI chat button
   - **NEW**: Integrated BlockDetailModal (replaces TODO comment)
   - **NEW**: Modal handlers for complete/skip/reschedule actions

2. **TimeBlockCard.tsx**
   - Individual time block with swipe gestures
   - Tap to open detail modal
   - Swipe right to mark complete
   - Swipe left to skip
   - Color-coded by event type
   - Compact mode for events < 30 minutes
   - Shows completion status (checkmark or X icon)

3. **TimeSlotGrid.tsx**
   - Hourly grid lines and labels
   - 60px per hour scale (1 minute = 1 pixel)
   - 12-hour time format with AM/PM

4. **CurrentTimeIndicator.tsx**
   - Red line showing current time position
   - Updates every minute
   - Only visible during waking hours

### AI Scheduling Logic

#### Prompt Engineering
The `buildSchedulingPrompt()` function creates comprehensive prompts with:

1. **Sleep Schedule**: Wake time and sleep time
2. **Intermittent Fasting Rules** (if active):
   - Strict eating window enforcement
   - Examples of valid/invalid meal times
   - Explicit instructions to avoid fasting hours
3. **Workouts to Schedule**: List from TrainingContext
4. **Meals to Schedule**: List from MealPlanContext
5. **Calendar Events**: Immovable time blocks from device calendar
6. **Critical Rules**:
   - Never overlap workouts with meals
   - Never overlap with calendar events
   - Leave 15-minute buffers between blocks
   - All meals must be within eating window (if fasting)

#### Post-Generation Validation
After AI returns scheduled blocks:

1. **Fasting Window Filter** (lines 109-140):
   - Removes any meals outside eating window
   - Logs which meals were filtered
   - Only applies when fasting is active AND not a cheat day

2. **Conflict Detection** (lines 143-182):
   - Checks for overlapping blocks
   - Logs all conflicts with block details
   - Warns if AI generated conflicting blocks

3. **Calendar Block Merge** (line 184):
   - Adds device calendar blocks to final timeline
   - Calendar blocks maintain high priority (can't be moved)

#### Fallback Strategy
```typescript
try {
  timeline = await generateAISchedule(request);  // AI first
} catch (aiError) {
  const result = SchedulingEngine.generateTimeline(request);  // Algorithm fallback
  timeline = result.timeline;
}
```

### Integration with Contexts

#### Data Flow
```
User Profile (GoalWizardContext)
  ├─→ Fasting windows
  ├─→ Sleep schedule
  ├─→ Energy peak preference
  └─→ Activity level

Training Program (TrainingContext)
  └─→ Weekly workout schedule → getWorkoutBlocksForDay()

Meal Plan (MealPlanContext)
  └─→ Weekly meal plan → getMealBlocksForDay()

Device Calendar (expo-calendar)
  └─→ Calendar events → DayPlannerContext.syncDeviceCalendar()

        ↓ All inputs combined

    DayPlannerContext
      ├─→ generateDailyTimeline()
      │   ├─→ Try: generateAISchedule() ✨ AI
      │   └─→ Catch: SchedulingEngine.generateTimeline() 🔧 Algorithm
      │
      └─→ Final DailyTimeline
          └─→ Rendered by DailyTimelineView
```

#### Block Types
```typescript
type BlockType =
  | 'sleep'           // Fixed sleep window
  | 'workout'         // From TrainingContext
  | 'meal_eating'     // From MealPlanContext (eating time)
  | 'meal_prep'       // From MealPlanContext (cooking time)
  | 'calendar_event'  // From device calendar (immovable)
  | 'buffer';         // Transition time between blocks

type BlockStatus =
  | 'scheduled'   // Not started yet
  | 'completed'   // User marked complete (swipe right)
  | 'skipped';    // User marked skipped (swipe left)
```

### User Experience Features

#### Liquid Glass Design
All planner components follow iOS 26 Liquid Glass aesthetic:
- Blur effects (BlurView with intensity 60-80)
- Translucent backgrounds with vibrancy
- Frosted glass cards (GlassCard component)
- Subtle shadows and borders
- Color-coded event types with transparency

#### Haptic Feedback
- **Light**: UI state changes (modal open/close)
- **Medium**: Important actions (reschedule, plan week)
- **Success**: Completion actions (mark complete)
- **Warning**: Skip actions
- **Error**: Conflict detection

#### Interactions
1. **Tap**: Open detail modal
2. **Swipe Right**: Mark complete (green checkmark)
3. **Swipe Left**: Skip (gray X)
4. **Long Press**: (Future) Drag to reschedule
5. **Pull to Refresh**: Re-sync device calendar

### Performance Optimizations

#### AI Response Time
- Model: GPT-4.1-mini (fastest GPT-4.1 variant)
- Temperature: 0.3 (faster than 0.7)
- Max tokens: 1200 (sufficient for full day schedule)
- Average response: 2-3 seconds

#### Caching Strategy
- Device calendar events cached until refresh
- Weekly meal plan cached in MealPlanContext
- Weekly training plan cached in TrainingContext
- User preferences cached in GoalWizardContext

#### Fallback Performance
- Algorithmic scheduling: <100ms
- No network latency
- Deterministic conflict resolution
- Always succeeds (no API failures)

### Testing

#### Key Test Scenarios
1. **Fasting Window Enforcement**
   - Verify meals only scheduled within eating window
   - Test edge cases (meal spanning window boundary)
   - Test cheat day override

2. **Calendar Conflict Handling**
   - Multiple overlapping calendar events
   - All-day events (don't block timed slots)
   - Event updates from device calendar

3. **Completion Tracking**
   - Swipe gestures update block status
   - Weekly stats calculate correctly
   - Completion percentage updates in real-time

4. **AI Fallback**
   - Network offline scenario
   - API rate limit scenario
   - Malformed AI response scenario

### Troubleshooting

#### "AI scheduling failed" error
- Check OpenAI API key is set in `.env`
- Verify network connectivity
- Check Expo console for detailed error logs
- System automatically falls back to algorithm

#### Meals appearing outside fasting window
- Verify `lifeContext.isFasting` is true
- Check `fastingStart` and `fastingEnd` times in GoalWizardContext
- Ensure not a cheat day (`isCheatDay` should be false)
- Check post-validation filter logs in console

#### Calendar events not showing
- Verify iOS calendar permissions granted
- Check `expo-calendar` is installed
- Run `actions.syncDeviceCalendar()` manually
- Check DayPlannerContext logs for sync errors

#### Conflicts not detected
- Check console logs for conflict detection output
- Verify blocks have valid `startTime` and `endTime`
- Ensure all-day events flagged with `isAllDay: true`
- Check buffer requirements between block types

### Future Enhancements

Potential improvements:
1. **Drag-to-Reschedule**: Long press to enter drag mode, drop in new time slot
2. **Multi-Day View**: Week grid showing all 7 days side-by-side
3. **Smart Notifications**: Remind 15 min before each block
4. **Auto-Rescheduling**: If user skips workout, AI suggests new time
5. **Weather Integration**: Adjust outdoor workout times based on forecast
6. **Commute Integration**: Add travel time buffers for gym workouts
7. **Meal Prep Batching**: Group meal prep blocks into single Sunday session
8. **Recovery Integration**: Auto-adjust workout intensity based on sleep/HRV

### Related Files

#### Services
- `services/aiSchedulingService.ts` - AI scheduling engine
- `services/schedulingEngine.ts` - Algorithmic fallback
- `services/openaiService.ts` - OpenAI client configuration

#### Contexts
- `contexts/DayPlannerContext.tsx` - Planner state management
- `contexts/GoalWizardContext.tsx` - User preferences
- `contexts/MealPlanContext.tsx` - Weekly meals
- `contexts/TrainingContext.tsx` - Weekly workouts

#### Components
- `components/planner/timeline/DailyTimelineView.tsx` - Main timeline
- `components/planner/timeline/TimeBlockCard.tsx` - Individual blocks
- `components/planner/modals/BlockDetailModal.tsx` - Detail modals
- `components/planner/stats/WeeklyCompletionRing.tsx` - Completion tracking
- `components/planner/actions/PlanMyWeekButton.tsx` - AI planning trigger

#### Types
- `types/planner.ts` - All TypeScript interfaces for planner system

---

**Last Updated**: February 16, 2026
**OpenAI SDK Version**: latest
**Model Used**: gpt-4.1-mini
**AI Calendar Integration**: ✅ Complete
