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

**Last Updated**: February 7, 2026
**OpenAI SDK Version**: latest
**Model Used**: gpt-4.1-mini
