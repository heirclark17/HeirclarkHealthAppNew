# Railway Deployment Guide - AI Backend
## Complete Step-by-Step Instructions

---

## 🎯 What We're Deploying

A Node.js Express backend with OpenAI GPT-4.1-mini integration for meal logging:
- **Text Analysis** - Analyze meal descriptions
- **Photo Analysis** - Identify foods from images
- **Voice Transcription** - Convert audio to text via Whisper
- **No Authentication** - Publicly accessible for mobile app

---

## 📋 Prerequisites

1. Railway account (free tier works): https://railway.app/
2. OpenAI API key with GPT-4.1-mini access: https://platform.openai.com/api-keys
3. GitHub account (optional, but recommended)

---

## 🚀 Deployment Method 1: Railway Dashboard (Easiest)

### Step 1: Prepare Backend Files

All files are ready in the `backend/` directory:
```
backend/
├── server.js          # Main Express server
├── package.json       # Dependencies
├── railway.toml       # Railway configuration
└── Procfile           # Process configuration
```

### Step 2: Create New Railway Project

1. Go to https://railway.app/dashboard
2. Click **"+ New Project"**
3. Select **"Deploy from GitHub repo"** OR **"Empty Project"**

### Step 3A: If Using GitHub (Recommended)

1. Create a new GitHub repository
2. Push backend folder to GitHub:
   ```bash
   cd C:\Users\derri\HeirclarkHealthAppNew\backend
   git init
   git add .
   git commit -m "Initial commit: AI backend for meal logging"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
3. In Railway dashboard, connect the GitHub repository
4. Railway will auto-detect Node.js and deploy

### Step 3B: If Using Empty Project

1. Click **"Empty Project"**
2. Click **"+ New"** → **"GitHub Repo"** or **"Empty Service"**
3. If Empty Service:
   - Install Railway CLI: `npm install -g @railway/cli`
   - Login: `railway login` (opens browser)
   - Link project: `railway link` (select your project)
   - Deploy: `railway up`

### Step 4: Configure Environment Variables

In Railway dashboard:
1. Go to your project
2. Click on the service
3. Go to **"Variables"** tab
4. Add these variables:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   PORT=3001
   ```
5. Click **"Save"**

### Step 5: Wait for Deployment

- Railway will build and deploy automatically
- Watch the deployment logs for any errors
- Once deployed, you'll see a URL like:
  ```
  https://your-service-name.up.railway.app
  ```

### Step 6: Test the Deployment

```bash
# Test health endpoint
curl https://your-service-name.up.railway.app/api/v1/health

# Should return:
# {"status":"ok","message":"Heirclark Health App Backend - Running","timestamp":"..."}
```

### Step 7: Update Frontend Configuration

Edit `.env` file in project root:
```env
EXPO_PUBLIC_API_URL=https://your-service-name.up.railway.app
```

---

## 🚀 Deployment Method 2: Railway CLI

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open a browser for authentication.

### Step 3: Initialize Railway Project

```bash
cd C:\Users\derri\HeirclarkHealthAppNew\backend
railway init
```

Select **"Create new project"** and name it (e.g., "heirclark-ai-backend").

### Step 4: Set Environment Variables

```bash
railway variables set OPENAI_API_KEY=sk-your-openai-api-key-here
railway variables set PORT=3001
```

### Step 5: Deploy

```bash
railway up
```

Railway will:
1. Detect Node.js application
2. Install dependencies
3. Run `npm start`
4. Expose the service publicly

### Step 6: Get Deployment URL

```bash
railway open
```

This opens the Railway dashboard showing your service URL.

---

## 🚀 Deployment Method 3: Docker (Advanced)

### Step 1: Create Dockerfile

Already created at `backend/Dockerfile` (if not, create it):

```dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

### Step 2: Deploy to Railway

1. Railway dashboard → **"+ New"** → **"Deploy from Dockerfile"**
2. Connect GitHub repo or upload files
3. Railway detects Dockerfile and builds
4. Configure environment variables as above

---

## ✅ Verification Checklist

After deployment, test all endpoints:

### 1. Health Check
```bash
curl https://your-service.up.railway.app/api/v1/health
```

Expected: `{"status":"ok",...}`

### 2. Text Analysis
```bash
curl -X POST https://your-service.up.railway.app/api/v1/nutrition/ai/meal-from-text \
  -H "Content-Type: application/json" \
  -d '{"text":"grilled chicken with rice","shopifyCustomerId":"test"}'
```

Expected: JSON with calories, protein, carbs, fat

### 3. Photo Analysis
```bash
curl -X POST https://your-service.up.railway.app/api/v1/nutrition/ai/meal-from-photo \
  -F "photo=@test-image.jpg" \
  -F "shopifyCustomerId=test"
```

Expected: JSON with meal analysis from image

### 4. Voice Transcription
```bash
curl -X POST https://your-service.up.railway.app/api/v1/nutrition/ai/transcribe-voice \
  -F "audio=@test-audio.m4a" \
  -F "shopifyCustomerId=test"
```

Expected: `{"success":true,"text":"transcribed text"}`

---

## 🔍 Troubleshooting

### Issue: "OPENAI_API_KEY not configured"

**Solution:** Add OPENAI_API_KEY in Railway Variables tab

### Issue: "404 Not Found"

**Solution:** Check Railway logs for startup errors. Verify `server.js` is running:
```bash
railway logs
```

### Issue: "Request timeout"

**Solution:** Increase request timeout in Railway settings:
1. Railway dashboard → Service → Settings
2. Healthcheck: Increase timeout to 30s

### Issue: "Out of memory"

**Solution:** GPT-4.1-mini is lightweight, but if needed:
1. Railway dashboard → Service → Settings
2. Increase memory allocation (default 512MB should be enough)

### Issue: "OpenAI API rate limit"

**Solution:**
1. Check OpenAI usage: https://platform.openai.com/usage
2. Add billing method if on free tier
3. Consider adding rate limiting in server.js

---

## 💰 Cost Estimates

### Railway Costs
- **Free Tier:** $5 credit/month (enough for light testing)
- **Hobby Plan:** $5/month for more resources
- **Typical usage:** ~$2-3/month for development

### OpenAI Costs (GPT-4.1-mini)
- **Text:** $0.0002 per request (~5000 requests = $1)
- **Images:** $0.0005 per image (~2000 images = $1)
- **Voice:** $0.001 per 10-second recording (~1000 recordings = $1)

**Total estimated monthly cost:** $5-10 for moderate usage

---

## 📊 Monitoring

### Railway Dashboard

Monitor in real-time:
- **Deployments:** Build logs and status
- **Metrics:** CPU, Memory, Network usage
- **Logs:** Application logs with console output
- **Variables:** Environment configuration

### OpenAI Usage

Track at: https://platform.openai.com/usage
- Daily request counts
- Token usage
- Cost breakdown by model

---

## 🔐 Security Best Practices

1. **Never commit API keys** to Git
2. **Use environment variables** for all secrets
3. **Enable Railway secrets** (auto-encrypted)
4. **Monitor logs** for suspicious activity
5. **Set up billing alerts** on OpenAI
6. **Rate limit** API endpoints (optional)

---

## 🚦 Next Steps After Deployment

### 1. Update Mobile App

Edit `.env`:
```env
EXPO_PUBLIC_API_URL=https://your-railway-service.up.railway.app
```

Restart Expo:
```bash
npm start
```

### 2. Test All Meal Logging Methods

1. Text: "grilled chicken with rice"
2. Photo: Take a picture of food
3. Voice: Record "I ate a salad"
4. Barcode: Scan a product (uses Open Food Facts, not Railway)

### 3. Verify Dashboard Updates

- Log meals
- Check calories increase
- Verify macro gauges update
- Confirm "Today's Meals" shows logged items

### 4. Monitor Performance

- Check Railway logs for errors
- Monitor OpenAI usage/costs
- Track mobile app response times

---

## 📱 Testing the Full Flow

### End-to-End Test:

1. **Open mobile app**
2. **Expand "Today's Meals" card**
3. **Click "+ Log Meal"**
4. **Try text input:**
   - Enter: "grilled chicken with broccoli"
   - Wait for AI analysis
   - Verify calories/macros displayed
   - Click "Save Meal"
5. **Check dashboard:**
   - Calorie gauge should increase
   - Macro gauges should update
   - Meal should appear in "Today's Meals"

---

## 🆘 Support & Resources

**Railway Documentation:**
- https://docs.railway.app/
- https://docs.railway.app/deploy/deployments

**OpenAI Documentation:**
- https://platform.openai.com/docs/models/gpt-4.1-mini
- https://platform.openai.com/docs/guides/vision
- https://platform.openai.com/docs/guides/speech-to-text

**Project Documentation:**
- `READY_TO_TEST.md` - Quick start guide
- `MEAL_LOGGING_SETUP.md` - Complete setup instructions
- `backend/README.md` - API documentation

---

## ✅ Deployment Complete!

Once deployed and tested:
- ✅ Backend running on Railway
- ✅ OpenAI API key configured
- ✅ All endpoints tested and working
- ✅ Mobile app connected to Railway backend
- ✅ Meal logging fully functional

**Status:** Production ready! 🎉

---

**Last Updated:** January 19, 2026
**Deployment Target:** Railway (https://railway.app)
**Backend Framework:** Node.js Express + OpenAI
**Models Used:** GPT-4.1-mini (text/vision) + Whisper-1 (audio)
