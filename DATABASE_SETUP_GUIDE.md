# Database Setup Guide - Fix Missing Tables

## Problem Summary

Your Railway PostgreSQL database is **missing tables**, causing these errors:
- ❌ `relation "meal_plans" does not exist`
- ❌ `Failed to fetch meals`

## Solution: Apply the Database Schema

The complete schema is already defined in `backend/database/schema.sql`. You just need to apply it to your Railway PostgreSQL database.

---

## Option 1: Apply Schema via Railway Dashboard (Easiest)

### Step 1: Get your Railway Database URL

1. Go to https://railway.app
2. Open your project: `heirclarkinstacartbackend-production`
3. Click on the **PostgreSQL** service
4. Go to the **Variables** tab
5. Find `DATABASE_URL` and copy it
   - Should look like: `postgresql://postgres:password@host:5432/railway`

### Step 2: Connect with psql or any PostgreSQL client

Using **psql** (PostgreSQL command line tool):

```bash
# If you have psql installed locally
psql "postgresql://postgres:password@host:5432/railway"

# Then run:
\i backend/database/schema.sql
```

Using **Railway CLI** (recommended):

```bash
# Install Railway CLI if not installed
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to PostgreSQL and run schema
railway run psql -f backend/database/schema.sql
```

---

## Option 2: Apply Schema via Railway Console

1. Go to Railway Dashboard → Your Project
2. Click on **PostgreSQL** service
3. Go to **Data** tab
4. Click **Query** button
5. Copy the entire contents of `backend/database/schema.sql`
6. Paste into the query editor
7. Click **Run**

---

## Option 3: Run the Node.js Script (Requires DATABASE_URL)

### Step 1: Set DATABASE_URL locally

Create a `.env` file in the backend folder:

```bash
cd backend
echo "DATABASE_URL=your-railway-database-url-here" > .env
```

### Step 2: Run the apply script

```bash
cd backend
node scripts/apply-schema-to-railway.js
```

This will:
- Connect to your Railway database
- Apply the complete schema
- Create all 25 tables
- Show you the list of created tables

---

## Verify Tables Were Created

Run the check script:

```bash
cd backend
node scripts/check-missing-tables.js
```

Expected output:
```
✅ All tables exist! Database is ready.
```

---

## What Tables Will Be Created?

The schema creates **25 core tables**:

### Authentication & User Management
- `users` - User accounts
- `user_sessions` - JWT sessions
- `user_profiles` - Height, weight, age, goals
- `user_goals` - Daily calorie/macro targets

### Nutrition & Meals
- `meals` - Logged meals
- `meal_foods` - Individual food items
- `saved_meals` - Favorite/template meals
- `meal_plans` ⭐ **Missing - causes your error**

### Workouts & Training
- `workout_plans` ⭐ **Missing**
- `workout_sessions` - Completed workouts

### Health Metrics
- `weight_logs` - Weight tracking
- `calorie_logs` - Daily calorie summary
- `step_logs` - Step counts
- `hydration_logs` - Water intake
- `sleep_logs` - Sleep tracking

### Habits & Goals
- `habits` - Custom habits
- `habit_completions` - Habit check-ins
- `calorie_bank` - Calorie banking system
- `fasting_sessions` - IF tracking

### AI & Advanced Features
- `tdee_calculations` ⭐ **Missing**
- `coach_conversations` ⭐ **Missing**
- `progress_predictions` ⭐ **Missing**
- `restaurant_analyses` ⭐ **Missing**

### Integrations
- `accountability_partnerships` - Partner system
- `connected_devices` - Apple Health, etc.

---

## After Applying Schema

1. **Restart your Railway backend:**
   ```bash
   # In Railway dashboard, click "Restart" on the backend service
   ```

2. **Test the fix:**
   - Open your app
   - Try generating a meal plan
   - Should work without errors! ✅

3. **Check logs:**
   ```bash
   railway logs
   ```

---

## Common Issues

### Issue: "psql: command not found"
**Solution:** Install PostgreSQL client:
- **Mac:** `brew install postgresql`
- **Windows:** Download from https://www.postgresql.org/download/windows/
- **Or use Railway CLI instead**

### Issue: "permission denied"
**Solution:** Make sure you're using the correct DATABASE_URL from Railway with full permissions.

### Issue: "relation already exists"
**Solution:** This is fine! The schema uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

---

## Need Help?

If you encounter issues:

1. Check Railway logs: `railway logs`
2. Verify DATABASE_URL is correct
3. Make sure PostgreSQL service is running
4. Check Railway service status

---

## Summary

**Quick Fix:**
1. Copy `backend/database/schema.sql` contents
2. Paste into Railway PostgreSQL Query console
3. Run it
4. Restart backend
5. Test app ✅

Your app will work once the tables are created!
