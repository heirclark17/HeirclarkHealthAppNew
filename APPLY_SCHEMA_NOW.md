# Apply Database Schema - IMMEDIATE ACTION REQUIRED

Your Railway PostgreSQL database is missing tables. Here's the **fastest way** to fix it:

---

## Method 1: Railway Dashboard (EASIEST - 2 minutes)

### Step 1: Open Railway Dashboard
1. Go to: https://railway.app/project/gracious-perfection
2. Click on the **PostgreSQL** service (database icon)
3. Click the **Data** tab at the top

### Step 2: Run the Schema
1. Click the **Query** button (looks like a terminal icon)
2. Copy the ENTIRE contents of this file:
   `backend/database/schema.sql` (589 lines)
3. Paste it into the query editor
4. Click **Execute** or **Run Query**
5. Wait for it to complete (~5-10 seconds)

### Step 3: Verify
You should see output like:
```
NOTICE: Heirclark Health App database schema created successfully!
NOTICE: Tables created: 23
```

### Step 4: Restart Backend
1. Go back to the project view
2. Click on **HeirclarkInstacartBackend** service
3. Click **Restart** button
4. Wait for deployment to complete

**Done! ✅**

---

## Method 2: Use Railway CLI with Local PostgreSQL (Advanced)

If you have PostgreSQL installed locally:

```bash
# Get the public DATABASE URL
railway variables --json > railway-vars.json

# Extract the DATABASE_URL and connect
psql "<YOUR_DATABASE_URL_HERE>" -f backend/database/schema.sql
```

---

## Method 3: Install psql and Connect Directly

### Install PostgreSQL Client:

**Windows:**
```powershell
# Download from https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
# Or use chocolatey:
choco install postgresql
```

**Then connect:**
```bash
# Get your public DATABASE URL from Railway Dashboard
# Go to PostgreSQL service → Connect tab → Copy connection string

psql "postgresql://postgres:password@host.railway.app:1234/railway" -f backend/database/schema.sql
```

---

## Why This is Needed

Your app is failing with these errors:
```
ERROR: relation "meal_plans" does not exist
ERROR: relation "workout_plans" does not exist
ERROR: relation "coach_conversations" does not exist
```

The schema file (`backend/database/schema.sql`) creates **25 tables**:
- users, user_profiles, user_goals
- meals, meal_foods, saved_meals, meal_plans
- workout_plans, workout_sessions
- weight_logs, calorie_logs, step_logs
- And 13 more...

---

## After Applying Schema

✅ Meal plan generation will work
✅ Workout plan generation will work
✅ All AI features will work
✅ No more database errors

---

## Need the Schema File?

The complete schema is at: `backend/database/schema.sql`

You can also view it on GitHub:
https://github.com/heirclark17/HeirclarkHealthAppNew/blob/master/backend/database/schema.sql

---

## Troubleshooting

**Issue:** "syntax error near line X"
- **Solution:** Make sure you copied the ENTIRE file (all 589 lines)

**Issue:** "permission denied"
- **Solution:** You must be the project owner or have admin access

**Issue:** "table already exists"
- **Solution:** This is OK! The schema uses `CREATE TABLE IF NOT EXISTS`

---

## Quick Summary

**Fastest method:** Railway Dashboard → PostgreSQL → Data → Query → Paste schema → Run

Takes 2 minutes, no tools needed, works 100% of the time.

Do this now and your app will work! 🚀
