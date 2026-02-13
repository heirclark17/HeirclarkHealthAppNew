# ExerciseDB API Setup Guide

## Get Your Free API Key (2 minutes)

### 1. Sign Up for RapidAPI
1. Go to https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
2. Click **"Sign Up"** (top right)
3. Create account with email or Google/GitHub

### 2. Subscribe to ExerciseDB (FREE)
1. On the ExerciseDB page, click **"Pricing"** tab
2. Select **"Basic"** plan (FREE - 10,000 requests/month)
3. Click **"Subscribe"**

### 3. Get Your API Key
1. Click **"Endpoints"** tab
2. Look for **"X-RapidAPI-Key"** in the code snippet
3. Copy the key (starts with something like: `a1b2c3d4e5...`)

### 4. Add to Your App
1. Open `C:\Users\derri\HeirclarkHealthAppNew\.env`
2. Add this line:
   ```env
   EXPO_PUBLIC_EXERCISEDB_API_KEY=YOUR_KEY_HERE
   ```
3. Paste your actual key (no quotes needed)
4. Save the file

### 5. Restart Expo
```bash
# Stop Expo (Ctrl+C)
# Start again
npm start
```

## ✅ Verification

Once configured, you'll see:
- Animated GIFs in Exercise Library
- Loading spinners while GIFs fetch
- "Form Demo" section in exercise details

## Example .env File

```env
# OpenAI API Key
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...

# Backend API URL
EXPO_PUBLIC_API_URL=https://heirclarkinstacartbackend-production.up.railway.app

# ExerciseDB API Key (RapidAPI)
EXPO_PUBLIC_EXERCISEDB_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

## API Limits (Free Tier)

- **10,000 requests/month** (more than enough!)
- ~333 requests/day
- Each exercise GIF fetch = 1 request
- GIFs are cached locally (only fetch once)

## Troubleshooting

### "No API key configured" warning
- Check `.env` file has the key
- Restart Expo after adding key
- Verify key starts with lowercase letters/numbers

### GIFs not loading
- Check internet connection
- Verify API key is valid on RapidAPI dashboard
- Check console logs for error messages

### Rate limit exceeded
- Free tier allows 10k/month
- App caches GIFs so same exercise won't re-fetch
- Upgrade to Pro plan ($10/month) if needed

---

**Ready?** Get your key, add it to `.env`, then restart Expo! 🚀
