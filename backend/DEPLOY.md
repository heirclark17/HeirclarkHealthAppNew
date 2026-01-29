# Quick Deploy to Railway

## Fastest Way to Deploy (5 minutes)

### Option 1: One-Command Deploy (if Railway CLI works)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login (opens browser)
railway login

# Navigate to backend
cd backend

# Initialize and deploy
railway init
railway up

# Set OpenAI API key
railway variables set OPENAI_API_KEY=sk-your-key-here

# Get your service URL
railway status
```

### Option 2: Manual Deploy via Dashboard

1. Go to https://railway.app/dashboard
2. Click "+ New Project"
3. Select "Empty Project"
4. Click "+ New" → "GitHub Repo" (or "Empty Service")
5. Upload `backend/` folder contents
6. Add environment variable: `OPENAI_API_KEY=sk-your-key-here`
7. Railway auto-deploys
8. Copy your service URL

### Option 3: GitHub Integration (Recommended for CI/CD)

```bash
cd backend

# Initialize git repo
git init
git add .
git commit -m "AI backend for meal logging"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/heirclark-ai-backend.git
git push -u origin main
```

Then in Railway:
1. "+ New Project" → "Deploy from GitHub repo"
2. Select your repository
3. Add `OPENAI_API_KEY` environment variable
4. Railway auto-deploys on every push

---

## After Deployment

Update `.env` in project root:

```env
EXPO_PUBLIC_API_URL=https://your-service-name.up.railway.app
```

Test endpoints:

```bash
# Health check
curl https://your-service-name.up.railway.app/api/v1/health

# Text analysis
curl -X POST https://your-service-name.up.railway.app/api/v1/nutrition/ai/meal-from-text \
  -H "Content-Type: application/json" \
  -d '{"text":"grilled chicken with rice","shopifyCustomerId":"test"}'
```

---

## Troubleshooting

**"Unauthorized" error:**
- Add OPENAI_API_KEY in Railway Variables

**"Command not found: railway":**
- Run: `npm install -g @railway/cli`

**"Login required":**
- Run: `railway login` (opens browser)

---

See `RAILWAY_DEPLOYMENT_GUIDE.md` for complete documentation.
