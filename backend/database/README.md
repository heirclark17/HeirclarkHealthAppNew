# Heirclark Health App - Database Setup Guide

## Database Schema Overview

The PostgreSQL database schema is production-ready with **23 tables**, **30+ indexes**, **3 views**, and **5 triggers**.

### Core Tables

#### Authentication & Users
- `users` - User accounts (UUID, email, Apple ID, avatar)
- `user_sessions` - JWT token sessions (token hash, expiry, device info)

#### Profiles & Goals
- `user_profiles` - Physical stats (height, weight, age, sex, activity level, **target weight**, **target date**)
- `user_goals` - Daily nutrition targets (calories, macros, steps, water, sleep, workout days)

#### Nutrition
- `meals` - Logged meals with full macros and source tracking
- `meal_foods` - Individual food items within meals
- `saved_meals` - Favorite meals and templates
- `meal_plans` - AI-generated weekly meal plans

#### Training
- `workout_plans` - Training programs with weekly schedules
- `workout_sessions` - Completed workouts with exercise details

#### Health Metrics
- `weight_logs` - Weight tracking with body fat percentage
- `calorie_logs` - Daily calorie consumed/burned totals
- `step_logs` - Step count and distance
- `hydration_logs` - Water intake tracking
- `sleep_logs` - Sleep quality and duration

#### Habits & Tracking
- `habits` - User habit definitions
- `habit_completions` - Habit completion streaks
- `calorie_bank` - Calorie banking for flexible dieting
- `fasting_sessions` - Intermittent fasting tracking

#### AI Features
- `tdee_calculations` - Adaptive TDEE results with confidence scores
- `coach_conversations` - AI coach chat history
- `progress_predictions` - AI predictions for goal timelines
- `restaurant_analyses` - Restaurant menu recommendations

#### Integrations
- `connected_devices` - Apple Health, Fitbit, Google Fit, Garmin
- `accountability_partnerships` - Accountability partner system

### Views for Common Queries

```sql
-- Daily nutrition summary
SELECT * FROM daily_nutrition_summary WHERE user_id = ? AND date = ?;

-- Weekly weight progress
SELECT * FROM weekly_progress WHERE user_id = ? AND week_start = ?;

-- Habit streaks
SELECT * FROM habit_streaks WHERE habit_id = ?;
```

### Indexes

All critical query paths are indexed:
- User lookups: `idx_*_user`
- Date ranges: `idx_*_date`
- Token validation: `idx_sessions_token`
- Favorites: `idx_meals_favorite`
- Full-text tags: `idx_saved_meals_tags` (GIN index)

### Triggers

Auto-update timestamps on:
- `users.updated_at`
- `user_profiles.updated_at`
- `user_goals.updated_at`
- `meal_plans.updated_at`
- `coach_conversations.updated_at`

---

## Setup Instructions

### 1. Railway PostgreSQL Setup

```bash
# Railway automatically creates a PostgreSQL database
# Get connection string from Railway dashboard:
# Settings > Variables > DATABASE_URL
```

### 2. Apply Schema

**Option A: Railway CLI**
```bash
railway run psql < backend/database/schema.sql
```

**Option B: psql command**
```bash
psql "postgresql://postgres:password@server.railway.app:5432/railway" < backend/database/schema.sql
```

**Option C: TablePlus/pgAdmin**
1. Connect to Railway PostgreSQL
2. Open SQL editor
3. Paste contents of `schema.sql`
4. Execute

### 3. Verify Setup

```sql
-- Check tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

-- Verify guest user exists
SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
```

Expected output:
```
Heirclark Health App database schema created successfully!
Tables created: 23
Indexes created: 30+
Views created: 3
Triggers created: 5
```

---

## Environment Variables

Ensure these are set in Railway:

```env
DATABASE_URL=postgresql://postgres:password@server.railway.app:5432/railway
JWT_SECRET=your-secure-random-secret-256-bits
GUEST_USER_ID=00000000-0000-0000-0000-000000000001
OPENAI_API_KEY=sk-...
ALLOWED_ORIGINS=https://yourapp.com,http://localhost:19006
```

---

## Migration Strategy

### Initial Setup (Fresh Database)
```bash
psql $DATABASE_URL < backend/database/schema.sql
```

### Future Schema Updates

Create migration files in `backend/database/migrations/`:

```bash
backend/database/migrations/
  001_add_push_tokens.sql
  002_add_recipe_ratings.sql
  003_add_exercise_library.sql
```

Apply sequentially:
```bash
for file in backend/database/migrations/*.sql; do
  echo "Applying $file"
  psql $DATABASE_URL < $file
done
```

---

## Backup & Recovery

### Backup
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore
```bash
psql $DATABASE_URL < backup_20260131_152000.sql
```

### Railway Auto-Backups
- Railway automatically backs up PostgreSQL databases
- Retention: 7 days for Hobby plan, 14 days for Pro
- Access backups in Railway dashboard: Database > Backups

---

## Performance Optimization

### Recommended Indexes (Already Applied)

All critical queries are optimized:

- ✅ User lookups: `idx_meals_user`, `idx_weight_user`, etc.
- ✅ Date range queries: `idx_meals_date`, `idx_weight_date`, etc.
- ✅ Token validation: `idx_sessions_token` (SHA256 hash lookup)
- ✅ Favorites: `idx_meals_favorite` (partial index for favorites only)
- ✅ Tag search: `idx_saved_meals_tags` (GIN index for array searches)

### Query Optimization Tips

**Use parameterized queries:**
```javascript
// ✅ GOOD - Uses index
pool.query('SELECT * FROM meals WHERE user_id = $1 AND logged_at > $2', [userId, date]);

// ❌ BAD - String concatenation vulnerable to injection
pool.query(`SELECT * FROM meals WHERE user_id = '${userId}'`);
```

**Use LIMIT for pagination:**
```javascript
// ✅ GOOD - Limits results
pool.query('SELECT * FROM meals WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 20', [userId]);

// ❌ BAD - Loads all rows into memory
pool.query('SELECT * FROM meals WHERE user_id = $1', [userId]);
```

**Use views for complex aggregations:**
```javascript
// ✅ GOOD - Uses pre-computed view
pool.query('SELECT * FROM daily_nutrition_summary WHERE user_id = $1', [userId]);

// ❌ BAD - Recomputes aggregation every time
pool.query('SELECT SUM(calories) FROM meals WHERE user_id = $1 GROUP BY DATE(logged_at)', [userId]);
```

---

## Security Best Practices

### ✅ Implemented

- **Cascade deletes** - Deleting a user removes all their data
- **Token hashing** - JWT tokens stored as SHA256 hashes
- **Unique constraints** - Prevent duplicate sessions, goals, daily logs
- **Foreign keys** - Enforce referential integrity
- **Updated_at triggers** - Auto-track data modifications

### 🔒 Production Checklist

- [ ] SSL enabled on database connection
- [ ] JWT_SECRET is 256-bit random string
- [ ] Database user has limited permissions (not superuser)
- [ ] Sensitive fields encrypted at application level (not implemented yet)
- [ ] Regular backups automated
- [ ] Connection pooling configured (pg.Pool)
- [ ] Rate limiting on auth endpoints (implemented)
- [ ] SQL injection prevention via parameterized queries (implemented)

---

## Monitoring

### Health Check Query

```sql
-- Check database is responsive
SELECT NOW();

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT
  datname,
  count(*) as connections
FROM pg_stat_activity
GROUP BY datname;
```

### Common Admin Tasks

```sql
-- Reset guest user goals
UPDATE user_goals SET daily_calories = 2000 WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Clear expired sessions
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Get user statistics
SELECT
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_meals,
  SUM(calories) as total_calories_logged
FROM meals
WHERE logged_at > NOW() - INTERVAL '30 days';
```

---

## Troubleshooting

### Connection Errors

```
Error: ECONNREFUSED
```
**Fix:** Check `DATABASE_URL` environment variable, verify Railway database is running.

### Schema Already Exists

```
ERROR: relation "users" already exists
```
**Fix:** Schema uses `CREATE TABLE IF NOT EXISTS` - safe to re-run. To start fresh:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\i backend/database/schema.sql
```

### JWT Errors

```
Error: Invalid or expired token
```
**Fix:** Frontend token may be stale. Call `refreshAuth()` or sign in again. Backend validates tokens against `user_sessions` table.

---

## Schema Version

**Current Version:** 1.0
**Last Updated:** January 31, 2026
**Compatibility:** PostgreSQL 12+

For questions or issues: [GitHub Issues](https://github.com/heirclark/health-app/issues)
