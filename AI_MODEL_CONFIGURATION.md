# AI Model Configuration

## ⚠️ CRITICAL: Model Selection

**DO NOT CHANGE THE AI MODEL WITHOUT EXPLICIT APPROVAL**

---

## Current Configuration

### Model: `gpt-4.1-mini`

**All AI generation endpoints MUST use:** `gpt-4.1-mini`

### Model Specifications

- **Official Docs:** https://platform.openai.com/docs/models/gpt-4.1-mini
- **Model Name:** `gpt-4.1-mini` (exact spelling, including the dot)
- **Context Window:** 1,000,000 tokens
- **Max Output Tokens:** 32,768 tokens
- **Knowledge Cutoff:** June 1, 2024

### Pricing
- **Input:** $0.40 per 1M tokens
- **Cached Input:** $0.10 per 1M tokens
- **Output:** $1.60 per 1M tokens

### Performance
- Hard instruction evals: 45.1%
- MultiChallenge: 35.8%
- IFEval: 84.1%
- Aider polyglot diff: 31.6%
- Strong coding and vision understanding capabilities

---

## Implementation

### Backend (server-complete.js)

All OpenAI API calls use:
```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4.1-mini',  // ← DO NOT CHANGE
  // ...
});
```

### Affected Endpoints (20 total instances)

1. `/api/v1/ai/generate-meal-plan` (line ~827)
2. `/api/v1/ai/generate-workout-plan` (line ~931)
3. `/api/v1/ai/meal-recommendations` (line ~618)
4. `/api/v1/ai/suggest-meal-swap` (line ~672)
5. `/api/v1/ai/analyze-nutrition-image` (line ~996)
6. `/api/v1/ai/suggest-meal-prep` (line ~1061)
7. `/api/v1/ai/generate-grocery-list` (line ~1124)
8. `/api/v1/ai/coach-check-in` (line ~1317)
9. `/api/v1/ai/analyze-progress` (line ~1363)
10. `/api/v1/ai/adjust-plan` (line ~1409)
11. `/api/v1/ai/habit-coaching` (line ~1458)
12. `/api/v1/ai/workout-form-feedback` (line ~1498)
13. `/api/v1/ai/injury-prevention` (line ~1554)
14. `/api/v1/ai/recovery-recommendations` (line ~1605)
15. `/api/v1/ai/restaurant-menu-analysis` (line ~1677)
16. `/api/v1/ai/meal-timing-optimization` (line ~1719)
17. `/api/v1/ai/supplement-recommendations` (line ~1762)
18. `/api/v1/ai/sleep-analysis` (line ~2135)
19. `/api/v1/ai/stress-management` (line ~2186)
20. `/api/v1/ai/accountability-partner` (line ~2267)

---

## Alternative Models (DO NOT USE)

The following models exist but are **NOT approved for this project:**
- ❌ `gpt-4o-mini` - Different model, different capabilities
- ❌ `gpt-4o` - More expensive, not necessary
- ❌ `gpt-4-turbo` - Not the approved model
- ❌ `gpt-3.5-turbo` - Lower quality

**Only `gpt-4.1-mini` is approved.**

---

## Environment Configuration

### Required Environment Variable

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

**Must have access to GPT-4.1-mini model.**

---

## Verification

To verify the model is being used:

1. Check Railway logs after deployment:
   ```
   [Meal Plan] Calling OpenAI with model: gpt-4.1-mini
   ```

2. Search codebase for incorrect models:
   ```bash
   grep -r "gpt-4o-mini" backend/
   # Should return ZERO results

   grep -r "gpt-4.1-mini" backend/
   # Should return 20 results in server-complete.js
   ```

3. Test AI generation endpoints and monitor API usage dashboard

---

## History

### 2026-02-02
- **INITIAL CONFIGURATION:** Set all endpoints to use `gpt-4.1-mini`
- **REASON:** GPT-4.1-mini provides optimal balance of performance, cost, and context window
- **DOCUMENTED BY:** User explicit requirement
- **STATUS:** Locked - do not modify without approval

### Previous Error (2026-02-02)
- ~~Temporarily changed to `gpt-4o-mini` in error~~
- ~~Immediately corrected back to `gpt-4.1-mini`~~
- **LESSON:** Always verify model names before making changes

---

## Support Resources

- **OpenAI Platform Docs:** https://platform.openai.com/docs/models/gpt-4.1-mini
- **OpenRouter Docs:** https://openrouter.ai/openai/gpt-4.1-mini
- **AI/ML API Docs:** https://docs.aimlapi.com/api-references/text-models-llm/openai/gpt-4.1-mini

---

**Last Updated:** 2026-02-02
**Configuration Status:** ✅ LOCKED
**Model in Use:** `gpt-4.1-mini` (20 instances)
