# Adding FIGMA_API_KEY to Railway Environment Variables

## Step 1: Get Your Figma API Key

1. Go to https://www.figma.com/
2. Click your profile picture (top right)
3. Select **Settings**
4. Scroll to **Personal Access Tokens**
5. Click **Create new token**
6. Name it: "Railway MCP Access"
7. Click **Generate token**
8. **Copy the token** (you'll only see it once!)

Example token format:
```
figd_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Step 2: Add to Railway Project

### Via Railway Dashboard (Easiest):

1. **Login to Railway:**
   - Go to https://railway.app
   - Click "Login" (top right)
   - Sign in with GitHub/Google

2. **Select Your Project:**
   - Click on your project (MCP server or backend)
   - You should see your deployed service

3. **Open Variables Tab:**
   - Click on your service
   - Click **"Variables"** tab (left sidebar)
   - Or click the service → **Settings** → **Environment Variables**

4. **Add New Variable:**
   - Click **"+ New Variable"** or **"Raw Editor"**
   - Add this line:
     ```
     FIGMA_API_KEY=figd_YOUR_TOKEN_HERE
     ```
   - Replace `figd_YOUR_TOKEN_HERE` with your actual Figma token

5. **Deploy:**
   - Click **"Deploy"** or **"Save"**
   - Railway will automatically redeploy your service
   - Wait 1-2 minutes for deployment to complete

---

### Via Railway CLI (Alternative):

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set environment variable
railway variables --set FIGMA_API_KEY=figd_YOUR_TOKEN_HERE

# Trigger redeploy
railway up
```

---

## Step 3: Verify in Code

Your Figma MCP server should read the environment variable like this:

```typescript
const FIGMA_API_KEY = process.env.FIGMA_API_KEY;

if (!FIGMA_API_KEY) {
  throw new Error('FIGMA_API_KEY environment variable is required');
}
```

---

## Step 4: Test Figma MCP Connection

After deployment:

1. **Check Railway Logs:**
   ```bash
   railway logs
   ```
   Look for: "✅ Figma MCP server started" or similar

2. **Test API connection:**
   - Your MCP should now be able to access Figma files
   - Check for errors in Railway logs

3. **Verify in Claude Code:**
   - Open Claude Code settings
   - MCP servers should show Figma as "Connected"

---

## Troubleshooting

### Error: "FIGMA_API_KEY is not defined"
- **Fix:** Make sure you saved the variable in Railway
- **Fix:** Redeploy the service after adding the variable

### Error: "Invalid Figma token"
- **Fix:** Generate a new token from Figma
- **Fix:** Make sure you copied the entire token (starts with `figd_`)

### Error: "Permission denied"
- **Fix:** Your Figma token needs access to the files
- **Fix:** Make sure you're the owner or have editor access

---

## Security Best Practices

✅ **DO:**
- Store API keys in environment variables
- Use Railway's encrypted variable storage
- Generate separate tokens for dev/production

❌ **DON'T:**
- Commit API keys to Git
- Share tokens in public repos
- Use the same token across multiple services

---

## Example Railway Setup

**Project Structure:**
```
Railway Project: Heirclark Backend
├── Service: MCP Server
│   └── Environment Variables:
│       ├── FIGMA_API_KEY=figd_xxx...
│       ├── NODE_ENV=production
│       └── PORT=3000
└── Service: Main API
    └── Environment Variables:
        └── DATABASE_URL=postgres://...
```

---

## Quick Reference

| Action | Command/Location |
|--------|------------------|
| Add variable | Railway Dashboard → Variables → + New Variable |
| View logs | Railway Dashboard → Deployments → View Logs |
| Redeploy | Railway Dashboard → Service → Deploy |
| CLI login | `railway login` |
| Set variable (CLI) | `railway variables --set KEY=VALUE` |

---

**Status:** Once the variable is added and deployed, your Figma MCP will have full access to Figma files for design extraction.

**Next Steps:** Use Claude Code to fetch Figma designs and generate components automatically!
