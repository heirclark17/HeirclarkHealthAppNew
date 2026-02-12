// Heirclark Health App - Complete Backend Server
// Full PostgreSQL Integration + All AI Endpoints + Authentication

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const OpenAI = require('openai');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();
const liveAvatarService = require('./services/liveAvatarService');
const { checkAppVersion } = require('./middleware/versionCheck');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Enable trust proxy for Railway deployment
// Railway (and other hosting platforms) put the app behind a reverse proxy
// This allows express-rate-limit to correctly identify users via X-Forwarded-For header
app.set('trust proxy', 1); // trust first proxy

// ============================================
// DATABASE CONNECTION
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows[0].now);
  }
});

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration - Restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:19006', 'http://localhost:8081', 'exp://192.168.1.*'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Prevent API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit auth attempts to 10 per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/v1/auth/', authLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Version check middleware - blocks old app versions with known bugs
app.use(checkAppVersion);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Initialize OpenAI client with timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 300000, // 5 minute timeout (allows complex meal plan generation)
  maxRetries: 0, // Don't retry on timeout to avoid duplicate requests
});

// JWT Secret - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
// Use crypto.randomBytes for dev fallback
const EFFECTIVE_JWT_SECRET = JWT_SECRET || crypto.randomBytes(32).toString('hex');

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Allow guest access for certain endpoints (no token provided)
  if (!token) {
    req.userId = process.env.GUEST_USER_ID || '00000000-0000-0000-0000-000000000001';
    req.isGuest = true;
    return next();
  }

  try {
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    req.isGuest = false;
    next();
  } catch (error) {
    // Invalid token - return error instead of silent fallback
    console.error('[Auth] Invalid token:', error.message);
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: 'Please log in again',
      code: 'TOKEN_INVALID'
    });
  }
};

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/v1/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      message: 'Heirclark Health App Backend - Running',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: dbResult.rows[0].now
    });
  } catch (error) {
    res.json({
      status: 'ok',
      message: 'Heirclark Health App Backend - Running (DB offline)',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Apple Sign-In
app.post('/api/v1/auth/apple', async (req, res) => {
  try {
    const { appleId, email, fullName, identityToken } = req.body;

    if (!appleId) {
      return res.status(400).json({ error: 'Apple ID required' });
    }

    // Check if user exists
    let user = await pool.query(
      'SELECT * FROM users WHERE apple_id = $1',
      [appleId]
    );

    if (user.rows.length === 0) {
      // Create new user
      user = await pool.query(
        `INSERT INTO users (apple_id, email, full_name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [appleId, email, fullName]
      );

      // Create default profile and goals
      await pool.query(
        `INSERT INTO user_profiles (user_id) VALUES ($1)`,
        [user.rows[0].id]
      );
      await pool.query(
        `INSERT INTO user_goals (user_id) VALUES ($1)`,
        [user.rows[0].id]
      );
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.rows[0].id]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: user.rows[0].id, email: user.rows[0].email },
      EFFECTIVE_JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Save session
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.rows[0].id, tokenHash]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        fullName: user.rows[0].full_name,
        avatarUrl: user.rows[0].avatar_url
      }
    });

  } catch (error) {
    console.error('[Apple Auth] Error:', error);
    res.status(500).json({ error: 'Authentication failed', message: error.message });
  }
});

// Logout
app.post('/api/v1/auth/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
app.get('/api/v1/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.*, up.*, ug.daily_calories, ug.daily_protein, ug.daily_carbs, ug.daily_fat
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN user_goals ug ON u.id = ug.user_id AND ug.is_active = true
       WHERE u.id = $1`,
      [req.userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: user.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Delete current user account (self-delete)
app.delete('/api/v1/auth/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    console.log(`[Delete Account] Deleting user ${userId} and all related data...`);

    // Delete all user data in correct order (foreign keys)
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_goals WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM meals WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM health_metrics WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM habits WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM fasting_sessions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    console.log(`[Delete Account] ✅ User ${userId} deleted successfully`);

    res.json({
      success: true,
      message: 'Account deleted successfully. You can now sign in with a fresh Apple ID.'
    });
  } catch (error) {
    console.error('[Delete Account] Error:', error);
    res.status(500).json({ error: 'Failed to delete account', message: error.message });
  }
});

// ============================================
// USER GOALS ENDPOINTS
// ============================================

app.get('/api/v1/user/goals', authenticateToken, async (req, res) => {
  try {
    const goals = await pool.query(
      `SELECT * FROM user_goals WHERE user_id = $1 AND is_active = true`,
      [req.userId]
    );

    if (goals.rows.length === 0) {
      return res.json({
        success: true,
        goals: {
          dailyCalories: 2000,
          dailyProtein: 150,
          dailyCarbs: 200,
          dailyFat: 65,
          dailyWaterOz: 64,
          dailySteps: 10000
        }
      });
    }

    const g = goals.rows[0];
    res.json({
      success: true,
      goals: {
        dailyCalories: g.daily_calories,
        dailyProtein: g.daily_protein,
        dailyCarbs: g.daily_carbs,
        dailyFat: g.daily_fat,
        dailyWaterOz: g.daily_water_oz,
        dailySteps: g.daily_steps,
        sleepHours: parseFloat(g.sleep_hours),
        workoutDaysPerWeek: g.workout_days_per_week
      }
    });
  } catch (error) {
    console.error('[Goals] Error:', error);
    res.status(500).json({ error: 'Failed to get goals' });
  }
});

app.post('/api/v1/user/goals', authenticateToken, async (req, res) => {
  try {
    // Frontend sends: { goals: { calories, protein, carbs, fat, ... } }
    // Extract from req.body.goals instead of req.body directly
    const goalsData = req.body.goals || req.body; // Support both formats for backward compatibility
    const { calories: dailyCalories, protein: dailyProtein, carbs: dailyCarbs, fat: dailyFat, hydration, goalWeight, timezone } = goalsData;

    // Validate and set defaults for required fields
    const calories = parseInt(dailyCalories) || 2000;
    const protein = parseInt(dailyProtein) || 150;
    const carbs = parseInt(dailyCarbs) || 200;
    const fat = parseInt(dailyFat) || 65;
    const waterOz = hydration ? Math.round(hydration / 29.5735) : 64; // Convert ml to oz
    const steps = 10000; // Default steps
    const sleep = 8; // Default sleep
    const workoutDays = 4; // Default workout days

    console.log('[Goals] Saving goals for user:', req.userId, { calories, protein, carbs, fat, waterOz, steps, sleep, workoutDays });
    console.log('[Goals] 📥 Received payload:', JSON.stringify(req.body, null, 2));

    // Deactivate old goals
    await pool.query(
      'UPDATE user_goals SET is_active = false WHERE user_id = $1',
      [req.userId]
    );

    // Insert new goals
    const result = await pool.query(
      `INSERT INTO user_goals
       (user_id, daily_calories, daily_protein, daily_carbs, daily_fat, daily_water_oz, daily_steps, sleep_hours, workout_days_per_week)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.userId, calories, protein, carbs, fat, waterOz, steps, sleep, workoutDays]
    );

    res.json({ success: true, goals: result.rows[0] });
  } catch (error) {
    console.error('[Goals] Error:', error);
    res.status(500).json({ error: 'Failed to update goals', message: error.message });
  }
});

// ============================================
// USER PROFILE ENDPOINTS (Weight Goal Alignment)
// ============================================

// GET /api/v1/user/profile - Get user profile including weight goals
app.get('/api/v1/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, profile: null });
    }

    const p = result.rows[0];
    res.json({
      success: true,
      profile: {
        heightCm: p.height_cm,
        weightKg: p.weight_kg,
        age: p.age,
        sex: p.sex,
        activityLevel: p.activity_level,
        goalType: p.goal_type,
        targetWeightKg: p.target_weight_kg,
        targetDate: p.target_date,
        timezone: p.timezone,
      }
    });
  } catch (error) {
    console.error('[Profile] Error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PATCH /api/v1/user/profile - Update user profile including weight goals
app.patch('/api/v1/user/profile', authenticateToken, async (req, res) => {
  try {
    const {
      height_cm,
      weight_kg,
      age,
      sex,
      activity_level,
      goal_type,
      target_weight_kg,
      target_date,
      timezone
    } = req.body;

    // Upsert profile (insert or update)
    const result = await pool.query(
      `INSERT INTO user_profiles
         (user_id, height_cm, weight_kg, age, sex, activity_level, goal_type, target_weight_kg, target_date, timezone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
         height_cm = COALESCE(EXCLUDED.height_cm, user_profiles.height_cm),
         weight_kg = COALESCE(EXCLUDED.weight_kg, user_profiles.weight_kg),
         age = COALESCE(EXCLUDED.age, user_profiles.age),
         sex = COALESCE(EXCLUDED.sex, user_profiles.sex),
         activity_level = COALESCE(EXCLUDED.activity_level, user_profiles.activity_level),
         goal_type = COALESCE(EXCLUDED.goal_type, user_profiles.goal_type),
         target_weight_kg = COALESCE(EXCLUDED.target_weight_kg, user_profiles.target_weight_kg),
         target_date = COALESCE(EXCLUDED.target_date, user_profiles.target_date),
         timezone = COALESCE(EXCLUDED.timezone, user_profiles.timezone),
         updated_at = NOW()
       RETURNING *`,
      [req.userId, height_cm, weight_kg, age, sex, activity_level, goal_type, target_weight_kg, target_date, timezone]
    );

    const p = result.rows[0];
    res.json({
      success: true,
      profile: {
        heightCm: p.height_cm,
        weightKg: p.weight_kg,
        age: p.age,
        sex: p.sex,
        activityLevel: p.activity_level,
        goalType: p.goal_type,
        targetWeightKg: p.target_weight_kg,
        targetDate: p.target_date,
      }
    });
  } catch (error) {
    console.error('[Profile] Error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============================================
// USER PREFERENCES ENDPOINTS (Workout/Diet Prefs)
// ============================================

// GET /api/v1/user/preferences - Get user preferences
app.get('/api/v1/user/preferences', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      // Return defaults if no preferences exist
      return res.json({
        success: true,
        preferences: {
          cardioPreference: 'walking',
          fitnessLevel: 'intermediate',
          workoutDuration: 30,
          workoutsPerWeek: 3,
          dietStyle: 'standard',
          mealsPerDay: 3,
          intermittentFasting: false,
          fastingStart: '12:00',
          fastingEnd: '20:00',
          allergies: [],
          availableEquipment: ['bodyweight'],
          injuries: [],
          waterGoalOz: 64,
          sleepGoalHours: 8,
          stepGoal: 10000,
        }
      });
    }

    const p = result.rows[0];
    res.json({
      success: true,
      preferences: {
        cardioPreference: p.cardio_preference,
        fitnessLevel: p.fitness_level,
        workoutDuration: p.workout_duration,
        workoutsPerWeek: p.workouts_per_week,
        dietStyle: p.diet_style,
        mealsPerDay: p.meals_per_day,
        intermittentFasting: p.intermittent_fasting,
        fastingStart: p.fasting_start,
        fastingEnd: p.fasting_end,
        allergies: p.allergies || [],
        availableEquipment: p.available_equipment || ['bodyweight'],
        injuries: p.injuries || [],
        waterGoalOz: p.water_goal_oz,
        sleepGoalHours: parseFloat(p.sleep_goal_hours),
        stepGoal: p.step_goal,
      }
    });
  } catch (error) {
    console.error('[Preferences] Get error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// POST /api/v1/user/preferences - Update user preferences
app.post('/api/v1/user/preferences', authenticateToken, async (req, res) => {
  try {
    const {
      cardioPreference,
      fitnessLevel,
      workoutDuration,
      workoutsPerWeek,
      dietStyle,
      mealsPerDay,
      intermittentFasting,
      fastingStart,
      fastingEnd,
      allergies,
      availableEquipment,
      injuries,
      waterGoalOz,
      sleepGoalHours,
      stepGoal,
    } = req.body;

    console.log('[Preferences] Saving for user:', req.userId, req.body);

    // Upsert preferences (insert or update)
    const result = await pool.query(
      `INSERT INTO user_preferences (
        user_id, cardio_preference, fitness_level, workout_duration, workouts_per_week,
        diet_style, meals_per_day, intermittent_fasting, fasting_start, fasting_end,
        allergies, available_equipment, injuries, water_goal_oz, sleep_goal_hours, step_goal
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (user_id) DO UPDATE SET
        cardio_preference = COALESCE($2, user_preferences.cardio_preference),
        fitness_level = COALESCE($3, user_preferences.fitness_level),
        workout_duration = COALESCE($4, user_preferences.workout_duration),
        workouts_per_week = COALESCE($5, user_preferences.workouts_per_week),
        diet_style = COALESCE($6, user_preferences.diet_style),
        meals_per_day = COALESCE($7, user_preferences.meals_per_day),
        intermittent_fasting = COALESCE($8, user_preferences.intermittent_fasting),
        fasting_start = COALESCE($9, user_preferences.fasting_start),
        fasting_end = COALESCE($10, user_preferences.fasting_end),
        allergies = COALESCE($11, user_preferences.allergies),
        available_equipment = COALESCE($12, user_preferences.available_equipment),
        injuries = COALESCE($13, user_preferences.injuries),
        water_goal_oz = COALESCE($14, user_preferences.water_goal_oz),
        sleep_goal_hours = COALESCE($15, user_preferences.sleep_goal_hours),
        step_goal = COALESCE($16, user_preferences.step_goal),
        updated_at = NOW()
      RETURNING *`,
      [
        req.userId,
        cardioPreference || 'walking',
        fitnessLevel || 'intermediate',
        workoutDuration || 30,
        workoutsPerWeek || 3,
        dietStyle || 'standard',
        mealsPerDay || 3,
        intermittentFasting || false,
        fastingStart || '12:00',
        fastingEnd || '20:00',
        allergies || [],
        availableEquipment || ['bodyweight'],
        injuries || [],
        waterGoalOz || 64,
        sleepGoalHours || 8,
        stepGoal || 10000,
      ]
    );

    const p = result.rows[0];
    console.log('[Preferences] ✅ Saved successfully');

    res.json({
      success: true,
      preferences: {
        cardioPreference: p.cardio_preference,
        fitnessLevel: p.fitness_level,
        workoutDuration: p.workout_duration,
        workoutsPerWeek: p.workouts_per_week,
        dietStyle: p.diet_style,
        mealsPerDay: p.meals_per_day,
        intermittentFasting: p.intermittent_fasting,
        fastingStart: p.fasting_start,
        fastingEnd: p.fasting_end,
        allergies: p.allergies || [],
        availableEquipment: p.available_equipment || ['bodyweight'],
        injuries: p.injuries || [],
        waterGoalOz: p.water_goal_oz,
        sleepGoalHours: parseFloat(p.sleep_goal_hours),
        stepGoal: p.step_goal,
      }
    });
  } catch (error) {
    console.error('[Preferences] Save error:', error);
    res.status(500).json({ error: 'Failed to save preferences', message: error.message });
  }
});

// ============================================
// WORKOUT TRACKING ENDPOINTS
// ============================================

// POST /api/v1/workouts/log - Log a completed workout
app.post('/api/v1/workouts/log', authenticateToken, async (req, res) => {
  try {
    const {
      sessionName,
      workoutType,
      exercises,
      durationMinutes,
      caloriesBurned,
      notes,
      rating,
      completedAt,
    } = req.body;

    console.log('[Workout] Logging workout for user:', req.userId, sessionName);

    const result = await pool.query(
      `INSERT INTO workout_sessions (
        user_id, session_name, exercises, duration_minutes, calories_burned, notes, rating, completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.userId,
        sessionName || workoutType || 'Workout',
        JSON.stringify(exercises || []),
        durationMinutes || 0,
        caloriesBurned || 0,
        notes,
        rating,
        completedAt || new Date().toISOString(),
      ]
    );

    // Update daily calorie burned log
    const today = completedAt ? new Date(completedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO calorie_logs (user_id, date, calories_burned)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET calories_burned = calorie_logs.calories_burned + $3`,
      [req.userId, today, caloriesBurned || 0]
    );

    console.log('[Workout] ✅ Logged successfully');

    res.json({ success: true, workout: result.rows[0] });
  } catch (error) {
    console.error('[Workout] Log error:', error);
    res.status(500).json({ error: 'Failed to log workout', message: error.message });
  }
});

// GET /api/v1/workouts/history - Get workout history
app.get('/api/v1/workouts/history', authenticateToken, async (req, res) => {
  try {
    const { days, limit } = req.query;
    const daysBack = parseInt(days) || 30;
    const rowLimit = parseInt(limit) || 50;

    const result = await pool.query(
      `SELECT * FROM workout_sessions
       WHERE user_id = $1
         AND started_at >= NOW() - INTERVAL '${daysBack} days'
       ORDER BY started_at DESC
       LIMIT $2`,
      [req.userId, rowLimit]
    );

    res.json({
      success: true,
      workouts: result.rows.map(w => ({
        id: w.id,
        sessionName: w.session_name,
        exercises: w.exercises,
        durationMinutes: w.duration_minutes,
        caloriesBurned: w.calories_burned,
        notes: w.notes,
        rating: w.rating,
        startedAt: w.started_at,
        completedAt: w.completed_at,
      }))
    });
  } catch (error) {
    console.error('[Workout] History error:', error);
    res.status(500).json({ error: 'Failed to get workout history' });
  }
});

// GET /api/v1/workouts/stats - Get workout statistics
app.get('/api/v1/workouts/stats', authenticateToken, async (req, res) => {
  try {
    // Get total workouts and stats
    const totalStats = await pool.query(
      `SELECT
        COUNT(*) as total_workouts,
        SUM(duration_minutes) as total_minutes,
        SUM(calories_burned) as total_calories,
        AVG(rating) as avg_rating
       FROM workout_sessions
       WHERE user_id = $1 AND completed_at IS NOT NULL`,
      [req.userId]
    );

    // Get this week's workouts
    const weekStats = await pool.query(
      `SELECT
        COUNT(*) as workouts_this_week,
        SUM(duration_minutes) as minutes_this_week,
        SUM(calories_burned) as calories_this_week
       FROM workout_sessions
       WHERE user_id = $1
         AND completed_at IS NOT NULL
         AND DATE_TRUNC('week', completed_at) = DATE_TRUNC('week', NOW())`,
      [req.userId]
    );

    // Get streak (consecutive days with workouts)
    const streakResult = await pool.query(
      `WITH workout_dates AS (
        SELECT DISTINCT DATE(completed_at) as workout_date
        FROM workout_sessions
        WHERE user_id = $1 AND completed_at IS NOT NULL
        ORDER BY workout_date DESC
      ),
      consecutive AS (
        SELECT workout_date,
               workout_date - ROW_NUMBER() OVER (ORDER BY workout_date DESC)::INTEGER AS grp
        FROM workout_dates
      )
      SELECT COUNT(*) as streak
      FROM consecutive
      WHERE grp = (SELECT grp FROM consecutive WHERE workout_date = CURRENT_DATE)`,
      [req.userId]
    );

    const stats = totalStats.rows[0];
    const week = weekStats.rows[0];

    res.json({
      success: true,
      stats: {
        totalWorkouts: parseInt(stats.total_workouts) || 0,
        totalMinutes: parseInt(stats.total_minutes) || 0,
        totalCaloriesBurned: parseInt(stats.total_calories) || 0,
        averageRating: parseFloat(stats.avg_rating) || 0,
        workoutsThisWeek: parseInt(week.workouts_this_week) || 0,
        minutesThisWeek: parseInt(week.minutes_this_week) || 0,
        caloriesThisWeek: parseInt(week.calories_this_week) || 0,
        currentStreak: parseInt(streakResult.rows[0]?.streak) || 0,
      }
    });
  } catch (error) {
    console.error('[Workout] Stats error:', error);
    res.status(500).json({ error: 'Failed to get workout stats' });
  }
});

// POST /api/v1/workouts/plan - Save workout plan to backend
app.post('/api/v1/workouts/plan', authenticateToken, async (req, res) => {
  try {
    const { planData, programId, programName, weekly_schedule } = req.body;

    console.log('[Workout] Saving workout plan for user:', req.userId);

    // Upsert the workout plan - include all required columns including weekly_schedule
    const result = await pool.query(
      `INSERT INTO workout_plans (user_id, plan_name, plan_data, program_id, program_name, weekly_schedule, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         plan_name = EXCLUDED.plan_name,
         plan_data = EXCLUDED.plan_data,
         program_id = EXCLUDED.program_id,
         program_name = EXCLUDED.program_name,
         weekly_schedule = EXCLUDED.weekly_schedule,
         updated_at = NOW()
       RETURNING id, created_at, updated_at`,
      [
        req.userId,
        programName || 'Custom Plan',
        JSON.stringify(planData),
        programId || null,
        programName || null,
        JSON.stringify(weekly_schedule || [])
      ]
    );

    console.log('[Workout] ✅ Plan saved successfully');
    res.json({
      success: true,
      plan: {
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      }
    });
  } catch (error) {
    console.error('[Workout] Save plan error:', error.message);
    res.status(500).json({ error: 'Failed to save workout plan', message: error.message });
  }
});

// GET /api/v1/workouts/plan - Get saved workout plan
app.get('/api/v1/workouts/plan', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, plan_data, program_id, program_name, weekly_schedule, created_at, updated_at
       FROM workout_plans
       WHERE user_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, plan: null });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      plan: {
        id: row.id,
        planData: row.plan_data,
        programId: row.program_id,
        programName: row.program_name,
        weeklySchedule: row.weekly_schedule,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    });
  } catch (error) {
    console.error('[Workout] Get plan error:', error);
    res.status(500).json({ error: 'Failed to get workout plan' });
  }
});

// POST /api/v1/workouts/pr - Save personal record
app.post('/api/v1/workouts/pr', authenticateToken, async (req, res) => {
  try {
    const { exerciseName, weight, reps, notes } = req.body;

    console.log('[Workout] Saving PR for user:', req.userId, exerciseName, weight, reps);

    // Insert or update the PR
    const result = await pool.query(
      `INSERT INTO personal_records (user_id, exercise_name, weight, reps, notes, achieved_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, exercise_name)
       DO UPDATE SET
         weight = CASE WHEN EXCLUDED.weight > personal_records.weight THEN EXCLUDED.weight ELSE personal_records.weight END,
         reps = CASE WHEN EXCLUDED.weight > personal_records.weight THEN EXCLUDED.reps ELSE personal_records.reps END,
         notes = CASE WHEN EXCLUDED.weight > personal_records.weight THEN EXCLUDED.notes ELSE personal_records.notes END,
         achieved_at = CASE WHEN EXCLUDED.weight > personal_records.weight THEN NOW() ELSE personal_records.achieved_at END
       RETURNING *`,
      [req.userId, exerciseName.toLowerCase(), weight, reps || 1, notes || null]
    );

    console.log('[Workout] ✅ PR saved');
    res.json({
      success: true,
      pr: result.rows[0]
    });
  } catch (error) {
    console.error('[Workout] Save PR error:', error);
    res.status(500).json({ error: 'Failed to save personal record' });
  }
});

// GET /api/v1/workouts/prs - Get all personal records
app.get('/api/v1/workouts/prs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT exercise_name, weight, reps, notes, achieved_at
       FROM personal_records
       WHERE user_id = $1
       ORDER BY exercise_name`,
      [req.userId]
    );

    // Convert to object keyed by exercise name
    const prs = {};
    result.rows.forEach(row => {
      prs[row.exercise_name] = {
        weight: row.weight,
        reps: row.reps,
        notes: row.notes,
        achievedAt: row.achieved_at,
      };
    });

    res.json({ success: true, prs });
  } catch (error) {
    console.error('[Workout] Get PRs error:', error);
    res.status(500).json({ error: 'Failed to get personal records' });
  }
});

// POST /api/v1/workouts/state - Save complete training state (weekly stats, goal alignment, etc.)
app.post('/api/v1/workouts/state', authenticateToken, async (req, res) => {
  try {
    const { weeklyStats, goalAlignment, planSummary, preferences } = req.body;

    console.log('[Workout] Saving training state for user:', req.userId);

    // First ensure the user has a workout_plans row (create if doesn't exist)
    await pool.query(
      `INSERT INTO workout_plans (user_id, plan_name, weekly_schedule, plan_data, training_state)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO NOTHING`,
      [
        req.userId,
        'Default Plan',
        JSON.stringify([]),
        JSON.stringify({}),
        JSON.stringify({ weeklyStats, goalAlignment, planSummary, preferences })
      ]
    );

    // Update the training_state
    await pool.query(
      `UPDATE workout_plans
       SET training_state = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [JSON.stringify({ weeklyStats, goalAlignment, planSummary, preferences }), req.userId]
    );

    console.log('[Workout] ✅ Training state saved');
    res.json({ success: true });
  } catch (error) {
    console.error('[Workout] Save training state error:', error.message);
    res.status(500).json({ error: 'Failed to save training state', message: error.message });
  }
});

// GET /api/v1/workouts/state - Get complete training state
app.get('/api/v1/workouts/state', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT training_state FROM workout_plans WHERE user_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].training_state) {
      return res.json({ success: true, state: null });
    }

    res.json({
      success: true,
      state: result.rows[0].training_state
    });
  } catch (error) {
    console.error('[Workout] Get training state error:', error);
    res.status(500).json({ error: 'Failed to get training state' });
  }
});

// ============================================
// MEAL LOGGING ENDPOINTS
// ============================================

// Log a meal
app.post('/api/v1/meals', authenticateToken, async (req, res) => {
  try {
    const { mealName, mealType, calories, protein, carbs, fat, fiber, sodium, photoUrl, notes, source, confidence, foods } = req.body;

    const meal = await pool.query(
      `INSERT INTO meals (user_id, meal_name, meal_type, calories, protein, carbs, fat, fiber, sodium, photo_url, notes, source, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [req.userId, mealName, mealType || 'snack', calories || 0, protein || 0, carbs || 0, fat || 0, fiber || 0, sodium || 0, photoUrl, notes, source || 'manual', confidence || 'medium']
    );

    // Insert foods if provided
    if (foods && foods.length > 0) {
      for (const food of foods) {
        await pool.query(
          `INSERT INTO meal_foods (meal_id, food_name, portion, calories, protein, carbs, fat)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [meal.rows[0].id, food.name, food.portion, food.calories || 0, food.protein || 0, food.carbs || 0, food.fat || 0]
        );
      }
    }

    // Update daily calorie log
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO calorie_logs (user_id, date, calories_consumed)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET calories_consumed = calorie_logs.calories_consumed + $3`,
      [req.userId, today, calories || 0]
    );

    res.json({ success: true, meal: meal.rows[0] });
  } catch (error) {
    console.error('[Meal Log] Error:', error);
    res.status(500).json({ error: 'Failed to log meal' });
  }
});

// Get meals for a date
app.get('/api/v1/meals', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date || new Date().toISOString().split('T')[0];

    const meals = await pool.query(
      `SELECT m.*,
              COALESCE(json_agg(mf.*) FILTER (WHERE mf.id IS NOT NULL), '[]') as foods
       FROM meals m
       LEFT JOIN meal_foods mf ON m.id = mf.meal_id
       WHERE m.user_id = $1 AND DATE(m.logged_at) = $2
       GROUP BY m.id
       ORDER BY m.logged_at`,
      [req.userId, queryDate]
    );

    res.json({ success: true, meals: meals.rows });
  } catch (error) {
    console.error('[Get Meals] Error:', error);
    res.status(500).json({ error: 'Failed to get meals' });
  }
});

// Delete a meal
app.delete('/api/v1/meals/:mealId', authenticateToken, async (req, res) => {
  try {
    const { mealId } = req.params;

    // Get meal calories first
    const meal = await pool.query(
      'SELECT calories, logged_at FROM meals WHERE id = $1 AND user_id = $2',
      [mealId, req.userId]
    );

    if (meal.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Delete meal
    await pool.query('DELETE FROM meals WHERE id = $1', [mealId]);

    // Update calorie log
    const mealDate = new Date(meal.rows[0].logged_at).toISOString().split('T')[0];
    await pool.query(
      `UPDATE calorie_logs
       SET calories_consumed = GREATEST(0, calories_consumed - $3)
       WHERE user_id = $1 AND date = $2`,
      [req.userId, mealDate, meal.rows[0].calories]
    );

    res.json({ success: true, message: 'Meal deleted' });
  } catch (error) {
    console.error('[Delete Meal] Error:', error);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

// ============================================
// SAVED MEALS (Favorites)
// ============================================

app.get('/api/v1/meals/saved', authenticateToken, async (req, res) => {
  try {
    const saved = await pool.query(
      `SELECT * FROM saved_meals WHERE user_id = $1 ORDER BY last_used_at DESC NULLS LAST, created_at DESC`,
      [req.userId]
    );
    res.json({ success: true, savedMeals: saved.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get saved meals' });
  }
});

app.post('/api/v1/meals/saved', authenticateToken, async (req, res) => {
  try {
    const { mealName, mealType, calories, protein, carbs, fat, ingredients, recipe, prepTimeMinutes, photoUrl, tags } = req.body;

    const saved = await pool.query(
      `INSERT INTO saved_meals (user_id, meal_name, meal_type, calories, protein, carbs, fat, ingredients, recipe, prep_time_minutes, photo_url, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [req.userId, mealName, mealType, calories, protein, carbs, fat, JSON.stringify(ingredients || []), recipe, prepTimeMinutes, photoUrl, tags || []]
    );

    res.json({ success: true, savedMeal: saved.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save meal' });
  }
});

app.delete('/api/v1/meals/saved/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM saved_meals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete saved meal' });
  }
});

// POST /api/v1/meals/plan - Save meal plan to backend
app.post('/api/v1/meals/plan', authenticateToken, async (req, res) => {
  try {
    const { planData, weekStart, dietStyle } = req.body;
    console.log(`[Meal Plan Save] Saving meal plan for user ${req.userId}`);

    // Upsert the meal plan
    const result = await pool.query(
      `INSERT INTO meal_plans (user_id, week_start_date, daily_plans, diet_style, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, week_start_date)
       DO UPDATE SET daily_plans = $3, diet_style = $4, updated_at = NOW()
       RETURNING *`,
      [req.userId, weekStart || new Date().toISOString().split('T')[0], JSON.stringify(planData), dietStyle || 'standard']
    );

    console.log(`[Meal Plan Save] ✅ Plan saved successfully`);
    res.json({ success: true, mealPlan: result.rows[0] });
  } catch (error) {
    console.error('[Meal Plan Save] Error:', error);
    res.status(500).json({ error: 'Failed to save meal plan' });
  }
});

// GET /api/v1/meals/plan - Get saved meal plan from backend
app.get('/api/v1/meals/plan', authenticateToken, async (req, res) => {
  try {
    const { weekStart } = req.query;
    console.log(`[Meal Plan Get] Fetching meal plan for user ${req.userId}`);

    // Get the most recent meal plan (or specific week if provided)
    let query = 'SELECT * FROM meal_plans WHERE user_id = $1';
    let params = [req.userId];

    if (weekStart) {
      query += ' AND week_start_date = $2';
      params.push(weekStart);
    } else {
      query += ' ORDER BY updated_at DESC LIMIT 1';
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      console.log('[Meal Plan Get] No plan found');
      return res.json({ success: true, mealPlan: null });
    }

    const plan = result.rows[0];
    console.log(`[Meal Plan Get] ✅ Found plan from ${plan.week_start_date}`);

    res.json({
      success: true,
      mealPlan: {
        planData: plan.daily_plans,
        weekStart: plan.week_start_date,
        dietStyle: plan.diet_style,
        updatedAt: plan.updated_at,
      },
    });
  } catch (error) {
    console.error('[Meal Plan Get] Error:', error);
    res.status(500).json({ error: 'Failed to get meal plan' });
  }
});

// ============================================
// FOOD PREFERENCES ENDPOINTS
// ============================================

// POST /api/v1/food-preferences - Save food preferences to backend
app.post('/api/v1/food-preferences', authenticateToken, async (req, res) => {
  try {
    const {
      dietaryPreferences,
      allergens,
      favoriteCuisines,
      favoriteProteins,
      favoriteVegetables,
      favoriteFruits,
      favoriteStarches,
      favoriteSnacks,
      hatedFoods,
      mealStyle,
      mealDiversity,
      cheatDays,
      cookingSkill,
    } = req.body;

    console.log(`[Food Preferences Save] Saving for user ${req.userId}`);

    // Upsert the food preferences
    const result = await pool.query(
      `INSERT INTO food_preferences (
        user_id, dietary_preferences, allergens, favorite_cuisines, favorite_proteins,
        favorite_vegetables, favorite_fruits, favorite_starches, favorite_snacks,
        hated_foods, meal_style, meal_diversity, cheat_days, cooking_skill, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        dietary_preferences = $2,
        allergens = $3,
        favorite_cuisines = $4,
        favorite_proteins = $5,
        favorite_vegetables = $6,
        favorite_fruits = $7,
        favorite_starches = $8,
        favorite_snacks = $9,
        hated_foods = $10,
        meal_style = $11,
        meal_diversity = $12,
        cheat_days = $13,
        cooking_skill = $14,
        updated_at = NOW()
      RETURNING *`,
      [
        req.userId,
        dietaryPreferences || [],
        allergens || [],
        favoriteCuisines || [],
        favoriteProteins || [],
        favoriteVegetables || [],
        favoriteFruits || [],
        favoriteStarches || [],
        favoriteSnacks || [],
        hatedFoods || '',
        mealStyle || '',
        mealDiversity || '',
        cheatDays || [],
        cookingSkill || '',
      ]
    );

    console.log(`[Food Preferences Save] ✅ Preferences saved successfully`);
    res.json({ success: true, preferences: result.rows[0] });
  } catch (error) {
    console.error('[Food Preferences Save] Error:', error);
    res.status(500).json({ error: 'Failed to save food preferences' });
  }
});

// GET /api/v1/food-preferences - Get food preferences from backend
app.get('/api/v1/food-preferences', authenticateToken, async (req, res) => {
  try {
    console.log(`[Food Preferences Get] Fetching for user ${req.userId}`);

    const result = await pool.query(
      'SELECT * FROM food_preferences WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      console.log('[Food Preferences Get] No preferences found');
      return res.json({ success: true, preferences: null });
    }

    const prefs = result.rows[0];
    console.log(`[Food Preferences Get] ✅ Found preferences`);

    // Transform snake_case to camelCase for frontend
    res.json({
      success: true,
      preferences: {
        dietaryPreferences: prefs.dietary_preferences || [],
        allergens: prefs.allergens || [],
        favoriteCuisines: prefs.favorite_cuisines || [],
        favoriteProteins: prefs.favorite_proteins || [],
        favoriteVegetables: prefs.favorite_vegetables || [],
        favoriteFruits: prefs.favorite_fruits || [],
        favoriteStarches: prefs.favorite_starches || [],
        favoriteSnacks: prefs.favorite_snacks || [],
        hatedFoods: prefs.hated_foods || '',
        mealStyle: prefs.meal_style || '',
        mealDiversity: prefs.meal_diversity || '',
        cheatDays: prefs.cheat_days || [],
        cookingSkill: prefs.cooking_skill || '',
        updatedAt: prefs.updated_at,
      },
    });
  } catch (error) {
    console.error('[Food Preferences Get] Error:', error);
    res.status(500).json({ error: 'Failed to get food preferences' });
  }
});

// ============================================
// NUTRITION AI ENDPOINTS
// ============================================

// Text-to-Nutrition Analysis (GPT-4.1-mini)
app.post('/api/v1/nutrition/ai/meal-from-text', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text description required' });
    }

    console.log(`[Text Analysis] Request from ${req.userId}: "${text}"`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert. Analyze meal descriptions and provide detailed nutritional information.
          Return a JSON object with: mealName, calories, protein (g), carbs (g), fat (g), fiber (g), confidence (low/medium/high),
          foods array with [{name, portion, calories, protein, carbs, fat}], and suggestions array.
          Be accurate and conservative with estimates. If unsure, indicate lower confidence.`,
        },
        {
          role: 'user',
          content: `Analyze this meal and provide nutritional information: "${text}"`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    res.json({
      success: true,
      analysis: {
        mealName: analysis.mealName || analysis.name || 'Meal',
        calories: parseInt(analysis.calories) || 0,
        protein: parseInt(analysis.protein) || 0,
        carbs: parseInt(analysis.carbs) || 0,
        fat: parseInt(analysis.fat) || 0,
        fiber: parseInt(analysis.fiber) || 0,
        confidence: analysis.confidence || 'medium',
        foods: analysis.foods || [],
        suggestions: analysis.suggestions || [],
      },
    });
  } catch (error) {
    console.error('[Text Analysis] Error:', error);
    res.status(500).json({ error: 'AI analysis failed', message: error.message });
  }
});

// Image-to-Nutrition Analysis
app.post('/api/v1/nutrition/ai/meal-from-photo', upload.single('photo'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo required' });
    }

    console.log(`[Image Analysis] Request from ${req.userId}, file size: ${req.file.size} bytes`);

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert analyzing food images. Identify all foods visible, estimate portions,
          and calculate nutritional information. Return a JSON object with: mealName, calories, protein (g), carbs (g),
          fat (g), fiber (g), confidence (low/medium/high), foods array with [{name, portion, calories, protein, carbs, fat}],
          and suggestions array. Be conservative with estimates if portions are unclear.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this meal photo and provide detailed nutritional information for all visible foods.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    res.json({
      success: true,
      analysis: {
        mealName: analysis.mealName || analysis.name || 'Meal',
        calories: parseInt(analysis.calories) || 0,
        protein: parseInt(analysis.protein) || 0,
        carbs: parseInt(analysis.carbs) || 0,
        fat: parseInt(analysis.fat) || 0,
        fiber: parseInt(analysis.fiber) || 0,
        confidence: analysis.confidence || 'medium',
        foods: analysis.foods || [],
        suggestions: analysis.suggestions || [],
      },
    });
  } catch (error) {
    console.error('[Image Analysis] Error:', error);
    res.status(500).json({ error: 'AI image analysis failed', message: error.message });
  }
});

// Voice-to-Text Transcription
app.post('/api/v1/nutrition/ai/transcribe-voice', upload.single('audio'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    console.log(`[Voice Transcription] Request from ${req.userId}, file size: ${req.file.size} bytes`);

    const audioFile = new File([req.file.buffer], 'audio.m4a', { type: req.file.mimetype });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    res.json({ success: true, text: transcription.text });
  } catch (error) {
    console.error('[Voice Transcription] Error:', error);
    res.status(500).json({ error: 'Voice transcription failed', message: error.message });
  }
});

// Generate Food Image
app.post('/api/v1/nutrition/ai/generate-food-image', authenticateToken, async (req, res) => {
  try {
    const { mealName, description } = req.body;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Professional food photography of ${mealName}. ${description || 'Beautifully plated, appetizing, high quality restaurant presentation.'}`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    res.json({ success: true, imageUrl: response.data[0].url });
  } catch (error) {
    console.error('[Food Image] Error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// ============================================
// AI MEAL PLAN GENERATION
// ============================================

app.post('/api/v1/ai/generate-meal-plan', authenticateToken, async (req, res) => {
  try {
    // FIXED: Accept preferences object directly (matches frontend MealPlanContext.tsx line 239-259)
    const { preferences, days } = req.body;

    console.log(`[Meal Plan] Generating ${days || 7}-day plan for ${req.userId}`);
    console.log('[Meal Plan] Received preferences:', JSON.stringify(preferences, null, 2));

    const systemPrompt = `You are an expert nutritionist creating personalized meal plans.
    Generate detailed meal plans with specific recipes, portions, and nutritional information.

    CRITICAL - MEAL DESCRIPTIONS:
    - The "description" field is MANDATORY and must be VIVID, APPETIZING, and make the meal sound DELICIOUS
    - Use sensory words: tender, crispy, fresh, savory, zesty, creamy, rich, flavorful, juicy, aromatic
    - Highlight textures, flavors, and cooking techniques
    - Make the reader CRAVE the meal
    - Examples:
      * "Tender grilled chicken breast seasoned with aromatic herbs, nestled beside fluffy jasmine rice and vibrant steamed broccoli florets"
      * "Velvety Greek yogurt layered with vibrant mixed berries and crunchy honey granola, creating a perfect balance of creamy, sweet, and satisfying textures"
      * "Succulent salmon fillet with a crispy herb crust, accompanied by roasted asparagus spears and buttery garlic mashed cauliflower"

    Return a JSON object with:
    {
      "weeklyPlan": [
        {
          "dayName": "Monday",
          "dayIndex": 0,
          "meals": [
            {
              "mealType": "breakfast",
              "name": "Meal Name",
              "description": "VIVID, APPETIZING 1-2 sentence description that makes the meal irresistible",
              "calories": 400,
              "protein": 25,
              "carbs": 40,
              "fat": 15,
              "ingredients": [{"name": "item", "amount": "1 cup", "calories": 100}],
              "instructions": "Step by step...",
              "prepTime": 15,
              "cookTime": 10
            }
          ],
          "dailyTotals": {"calories": 2000, "protein": 150, "carbs": 200, "fat": 65}
        }
      ],
      "weeklyTotals": {"avgCalories": 2000, "avgProtein": 150},
      "groceryList": [{"item": "Chicken breast", "amount": "2 lbs", "category": "protein"}]
    }`;

    // FIXED: Use actual frontend field names from preferences object
    // Build meal diversity instruction
    let mealDiversityInstruction = '';
    if (preferences?.mealDiversity === 'diverse') {
      mealDiversityInstruction = `
    MEAL DIVERSITY REQUIREMENT: DIVERSE
    - Create DIFFERENT meals for EACH DAY of the week
    - Day 1 breakfast should be DIFFERENT from Day 2 breakfast, Day 3 breakfast, etc.
    - Day 1 lunch should be DIFFERENT from Day 2 lunch, Day 3 lunch, etc.
    - Day 1 dinner should be DIFFERENT from Day 2 dinner, Day 3 dinner, etc.
    - Provide maximum variety across the week for an engaging eating experience
    - Use different proteins, vegetables, cuisines, and cooking methods throughout the week`;
    } else if (preferences?.mealDiversity === 'sameDaily') {
      mealDiversityInstruction = `
    MEAL DIVERSITY REQUIREMENT: MEAL PREP STYLE (SAME DAILY)
    - Create the SAME breakfast for ALL 7 DAYS (meal prep - make once, eat all week)
    - Create the SAME lunch for ALL 7 DAYS (meal prep - make once, eat all week)
    - Create the SAME dinner for ALL 7 DAYS (meal prep - make once, eat all week)
    - This makes meal preparation efficient: cook once on Sunday, portion into containers, eat all week
    - Each meal type (breakfast/lunch/dinner) should be IDENTICAL across all 7 days
    - Optimize for easy batch cooking and storage/reheating`;
    } else {
      mealDiversityInstruction = `
    MEAL DIVERSITY REQUIREMENT: MODERATE VARIETY
    - Provide some variety but allow for 2-3 repeating meals throughout the week
    - Balance between diversity and meal prep efficiency`;
    }

    const userPrompt = `Create a ${days || 7}-day meal plan with these requirements:
    - Daily calories: ${preferences?.calorieTarget || 2000}
    - Daily protein: ${preferences?.proteinTarget || 150}g
    - Daily carbs: ${preferences?.carbsTarget || 200}g
    - Daily fat: ${preferences?.fatTarget || 65}g
    - Diet type: ${preferences?.dietType || 'balanced'}
    - Meals per day: ${preferences?.mealsPerDay || 3}
    - Cuisine preferences: ${preferences?.favoriteCuisines?.join(', ') || 'varied'}
    - Favorite proteins: ${preferences?.favoriteProteins?.join(', ') || 'varied'}
    - Favorite vegetables: ${preferences?.favoriteVegetables?.join(', ') || 'varied'}
    - Favorite fruits: ${preferences?.favoriteFruits?.join(', ') || 'varied'}
    - Favorite starches: ${preferences?.favoriteStarches?.join(', ') || 'varied'}
    - Allergies/restrictions: ${preferences?.allergies?.join(', ') || 'none'}
    - Hated foods: ${preferences?.hatedFoods || 'none'}
    - Meal style: ${preferences?.mealStyle || 'balanced'}
    - Cooking skill: ${preferences?.cookingSkill || 'intermediate'}
    - Cheat days: ${preferences?.cheatDays?.join(', ') || 'none'}
${mealDiversityInstruction}

    Include ${preferences?.mealsPerDay || 3} meals per day plus snacks as needed.
    Make meals practical with common ingredients.
    Respect all dietary restrictions and allergies.
    Use preferred cuisines and foods when possible, avoid hated foods completely.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 8000, // Reduced from 16000 to prevent timeouts (still enough for 7-day plan)
    });

    const rawContent = completion.choices[0].message.content;
    let mealPlan;
    try {
      mealPlan = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('[Meal Plan] JSON parse error, attempting recovery...');
      // Try to fix truncated JSON by finding last complete day
      const fixedContent = rawContent.replace(/,\s*$/, '') + ']}';
      try {
        mealPlan = JSON.parse(fixedContent);
      } catch {
        throw new Error('AI response was truncated. Please try again.');
      }
    }

    // Save to database
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    await pool.query(
      `INSERT INTO meal_plans (user_id, week_start_date, daily_plans, total_calories, total_protein, diet_style)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, week_start_date) DO UPDATE SET daily_plans = $3, updated_at = NOW()`,
      [req.userId, weekStart.toISOString().split('T')[0], JSON.stringify(mealPlan.weeklyPlan), mealPlan.weeklyTotals?.avgCalories, mealPlan.weeklyTotals?.avgProtein, preferences?.dietStyle]
    );

    res.json({
      success: true,
      mealPlan: mealPlan.weeklyPlan,
      weeklyTotals: mealPlan.weeklyTotals,
      groceryList: mealPlan.groceryList,
    });
  } catch (error) {
    console.error('[Meal Plan] Error:', error);
    console.error('[Meal Plan] Error type:', error.constructor.name);
    console.error('[Meal Plan] Error code:', error.code);
    console.error('[Meal Plan] Error status:', error.status);

    // Specific error handling for common issues
    // Check for timeout errors (multiple possible formats)
    if (error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.toLowerCase().includes('timeout') ||
        error.message?.toLowerCase().includes('timed out') ||
        error.name === 'TimeoutError') {
      return res.status(504).json({
        error: 'Request timeout',
        message: 'AI generation took too long. Try reducing the number of days or simplifying preferences.',
      });
    }

    if (error.status === 401 || error.message?.includes('API key')) {
      console.error('[Meal Plan] ⚠️ OpenAI API key missing or invalid');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'AI service not configured. Please contact support.',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many AI requests. Please try again in a few minutes.',
      });
    }

    res.status(500).json({
      error: 'Failed to generate meal plan',
      message: error.message || 'Unknown error occurred',
    });
  }
});

// ============================================
// AI WORKOUT PLAN GENERATION
// ============================================

app.post('/api/v1/ai/generate-workout-plan', authenticateToken, async (req, res) => {
  try {
    // FIXED: Accept preferences object directly (matches frontend TrainingContext.tsx line 222-230)
    const { preferences, weeks } = req.body;

    console.log(`[Workout Plan] Generating ${preferences?.daysPerWeek || 4}-day plan for ${req.userId}`);
    console.log('[Workout Plan] Received preferences:', JSON.stringify(preferences, null, 2));

    const systemPrompt = `You are an expert fitness coach creating personalized workout plans.
    Return a JSON object with:
    {
      "planName": "Program Name",
      "description": "Brief description",
      "weeklySchedule": [
        {
          "day": "Monday",
          "dayType": "Push",
          "exercises": [
            {
              "name": "Bench Press",
              "sets": 4,
              "reps": "8-10",
              "restSeconds": 90,
              "notes": "Focus on controlled movement",
              "targetMuscles": ["chest", "triceps"]
            }
          ],
          "estimatedDuration": 45,
          "warmup": "5 min cardio + dynamic stretches",
          "cooldown": "5 min stretching"
        }
      ],
      "progressionPlan": "Weekly progression guidelines",
      "tips": ["Tip 1", "Tip 2"]
    }`;

    // FIXED: Use actual frontend field names from preferences object
    const userPrompt = `Create a ${preferences?.daysPerWeek || 4}-day workout plan:
    - Goal: ${preferences?.fitnessGoal || 'general_fitness'}
    - Fitness level: ${preferences?.experienceLevel || 'intermediate'}
    - Available equipment: ${preferences?.availableEquipment?.join(', ') || 'full gym'}
    - Days per week: ${preferences?.daysPerWeek || 4}
    - Session length: ${preferences?.sessionDuration || 45} minutes
    - Cardio preference: ${preferences?.cardioPreference || 'moderate'}
    - Injuries to avoid: ${preferences?.injuries?.length > 0 ? preferences.injuries.join(', ') : 'none'}

    Create workouts that match the user's fitness goal (${preferences?.fitnessGoal || 'general_fitness'}).
    Use only the available equipment: ${preferences?.availableEquipment?.join(', ') || 'full gym'}.
    If injuries are listed, avoid exercises that could aggravate them.
    Include appropriate cardio based on preference: ${preferences?.cardioPreference || 'moderate'}.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const workoutPlan = JSON.parse(completion.choices[0].message.content);

    // Save to database (upsert - update if user already has a plan)
    await pool.query(
      `INSERT INTO workout_plans (user_id, plan_name, description, weekly_schedule, goal_type, difficulty_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         plan_name = EXCLUDED.plan_name,
         description = EXCLUDED.description,
         weekly_schedule = EXCLUDED.weekly_schedule,
         goal_type = EXCLUDED.goal_type,
         difficulty_level = EXCLUDED.difficulty_level,
         updated_at = NOW()
       RETURNING id`,
      [req.userId, workoutPlan.planName, workoutPlan.description, JSON.stringify(workoutPlan.weeklySchedule), preferences?.fitnessGoal, preferences?.experienceLevel]
    );

    res.json({ success: true, workoutPlan });
  } catch (error) {
    console.error('[Workout Plan] Error:', error);
    res.status(500).json({ error: 'Failed to generate workout plan', message: error.message });
  }
});

// ============================================
// AI COACH CHAT
// ============================================

app.post('/api/v1/ai/coach-message', authenticateToken, async (req, res) => {
  try {
    const { message, conversationType, context } = req.body;

    // Get conversation history
    let conversation = await pool.query(
      `SELECT * FROM coach_conversations WHERE user_id = $1 AND conversation_type = $2 ORDER BY updated_at DESC LIMIT 1`,
      [req.userId, conversationType || 'general']
    );

    let messages = [];
    if (conversation.rows.length > 0) {
      messages = conversation.rows[0].messages || [];
    }

    // Add user message
    messages.push({ role: 'user', content: message });

    // Get user data for context
    const userData = await pool.query(
      `SELECT up.*, ug.daily_calories, ug.daily_protein
       FROM user_profiles up
       LEFT JOIN user_goals ug ON up.user_id = ug.user_id AND ug.is_active = true
       WHERE up.user_id = $1`,
      [req.userId]
    );

    const systemPrompt = `You are a friendly, knowledgeable health and fitness coach for the Heirclark app.
    Be conversational, supportive, and specific. Reference the user's actual data when available.
    Keep responses concise (2-4 sentences) unless asked for detailed explanations.
    ${userData.rows.length > 0 ? `User context: Calorie goal: ${userData.rows[0].daily_calories}, Protein goal: ${userData.rows[0].daily_protein}g` : ''}
    ${context ? `Additional context: ${JSON.stringify(context)}` : ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10), // Last 10 messages for context
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0].message.content;
    messages.push({ role: 'assistant', content: assistantMessage });

    // Save conversation
    if (conversation.rows.length > 0) {
      await pool.query(
        `UPDATE coach_conversations SET messages = $2, updated_at = NOW() WHERE id = $1`,
        [conversation.rows[0].id, JSON.stringify(messages)]
      );
    } else {
      await pool.query(
        `INSERT INTO coach_conversations (user_id, conversation_type, messages, context)
         VALUES ($1, $2, $3, $4)`,
        [req.userId, conversationType || 'general', JSON.stringify(messages), JSON.stringify(context)]
      );
    }

    res.json({ success: true, message: assistantMessage });
  } catch (error) {
    console.error('[Coach Chat] Error:', error);
    res.status(500).json({ error: 'Coach chat failed', message: error.message });
  }
});

// ============================================
// AI CHEAT DAY GUIDANCE
// ============================================

app.post('/api/v1/ai/cheat-day-guidance', authenticateToken, async (req, res) => {
  try {
    const { dayName, userGoals, userName } = req.body;

    console.log(`[Cheat Day Guidance] Request for ${dayName} from user ${req.userId}`);

    // Get user profile for context
    let userContext = '';
    try {
      const userData = await pool.query(
        `SELECT up.*, ug.daily_calories, ug.daily_protein, ug.goal_type
         FROM user_profiles up
         LEFT JOIN user_goals ug ON up.user_id = ug.user_id AND ug.is_active = true
         WHERE up.user_id = $1`,
        [req.userId]
      );

      if (userData.rows.length > 0) {
        const profile = userData.rows[0];
        userContext = `User's calorie goal: ${profile.daily_calories || 'not set'}, ` +
          `protein goal: ${profile.daily_protein || 'not set'}g, ` +
          `goal type: ${profile.goal_type || userGoals?.goalType || 'general fitness'}`;
      }
    } catch (dbError) {
      console.warn('[Cheat Day Guidance] Could not fetch user data:', dbError.message);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a supportive, encouraging health coach specializing in balanced nutrition and sustainable wellness.

Your task is to provide warm, personalized guidance for someone on their designated cheat day. Be positive and understanding - cheat days are important for mental health and sustainability!

Return a JSON object with exactly this structure:
{
  "greeting": "A warm, personalized greeting acknowledging their cheat day (1-2 sentences)",
  "encouragement": "Positive encouragement about enjoying their day without guilt (2-3 sentences)",
  "mindfulTips": [
    "3-4 practical tips for mindful indulgence that won't derail progress"
  ],
  "hydrationReminder": "A friendly reminder about staying hydrated (1 sentence)",
  "balanceTip": "One tip about getting back on track tomorrow (1-2 sentences)",
  "motivationalQuote": "An inspiring quote about balance, self-care, or enjoying life"
}

Keep the tone warm, supportive, and non-judgmental. Avoid using words like "cheat" in a negative way - frame it as a "flexible" or "enjoyment" day.`
        },
        {
          role: 'user',
          content: `Today is ${dayName} and it's the user's planned cheat/flexible day.
${userContext ? `Context: ${userContext}` : ''}
${userName ? `User's name: ${userName}` : ''}

Generate personalized, encouraging guidance for their cheat day that helps them enjoy it mindfully without guilt.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
      max_tokens: 800,
    });

    const guidance = JSON.parse(completion.choices[0].message.content);

    console.log(`[Cheat Day Guidance] Generated successfully for ${dayName}`);
    res.json({
      success: true,
      guidance,
      dayName,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cheat Day Guidance] Error:', error);
    res.status(500).json({
      error: 'Failed to generate cheat day guidance',
      message: error.message
    });
  }
});

// ============================================
// AI RECIPE DETAILS
// ============================================

app.post('/api/v1/ai/recipe-details', authenticateToken, async (req, res) => {
  try {
    // Accept both old format (mealName, basicInfo) and new format (dishName, mealType, calories, macros)
    const { mealName, dishName, basicInfo, mealType, calories, macros } = req.body;

    const name = dishName || mealName;
    if (!name) {
      return res.status(400).json({ error: 'Missing meal name (dishName or mealName required)' });
    }

    // Build context from provided data
    let context = '';
    if (mealType) context += `Meal type: ${mealType}. `;
    if (calories) context += `Target calories: ${calories}. `;
    if (macros) context += `Macros - Protein: ${macros.protein}g, Carbs: ${macros.carbs}g, Fat: ${macros.fat}g. `;
    if (basicInfo) context += `Additional info: ${JSON.stringify(basicInfo)}`;

    console.log(`[Recipe Details] Generating recipe for: ${name}`, context ? `with context: ${context}` : '');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional chef providing detailed recipes. Return JSON with:
          {
            "ingredients": [{"name": "ingredient", "quantity": 1, "unit": "cup"}],
            "instructions": ["Step 1", "Step 2", "Step 3"],
            "prepMinutes": 15,
            "cookMinutes": 30,
            "tips": "Optional cooking tips"
          }

          IMPORTANT FORMAT REQUIREMENTS:
          - ingredients array must have objects with: name (string), quantity (number), unit (string)
          - instructions array must be array of strings (each step as a string)
          - prepMinutes and cookMinutes must be numbers
          - Match the provided calorie and macro targets if given`
        },
        {
          role: 'user',
          content: `Provide detailed recipe for: ${name}. ${context}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 2000,
    });

    const recipe = JSON.parse(completion.choices[0].message.content);
    console.log('[Recipe Details] Generated recipe with', recipe.ingredients?.length || 0, 'ingredients and', recipe.instructions?.length || 0, 'steps');
    res.json({ success: true, recipe });
  } catch (error) {
    console.error('[Recipe Details] Error:', error);
    res.status(500).json({ error: 'Failed to get recipe details' });
  }
});

// ============================================
// ADAPTIVE TDEE AGENT
// ============================================

app.post('/api/v1/agents/tdee/calculate', authenticateToken, async (req, res) => {
  try {
    const { weightHistory, calorieHistory, userProfile } = req.body;

    if (!weightHistory || !calorieHistory || !userProfile) {
      return res.status(400).json({ ok: false, error: 'Missing required data' });
    }

    console.log(`[Adaptive TDEE] Calculation for ${req.userId}`);

    const CALORIES_PER_POUND = 3500;
    const SMOOTHING_FACTOR = 0.3;

    // Mifflin-St Jeor formula
    const calculateFormulaTDEE = (weightKg, heightCm, age, sex, activityLevel) => {
      let bmr = sex === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

      const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
      return Math.round(bmr * (multipliers[activityLevel] || 1.55));
    };

    // Group by week
    const getWeekKey = (dateStr) => {
      const d = new Date(dateStr);
      const diff = d.getDate() - d.getDay();
      return new Date(d.setDate(diff)).toISOString().split('T')[0];
    };

    const weeks = new Map();
    weightHistory.forEach(log => {
      const weekKey = getWeekKey(log.date);
      if (!weeks.has(weekKey)) weeks.set(weekKey, { weights: [], calories: [] });
      weeks.get(weekKey).weights.push(log);
    });
    calorieHistory.forEach(log => {
      const weekKey = getWeekKey(log.date);
      if (!weeks.has(weekKey)) weeks.set(weekKey, { weights: [], calories: [] });
      weeks.get(weekKey).calories.push(log);
    });

    // Calculate data points
    const sortedWeeks = [...weeks.keys()].sort();
    const dataPoints = [];
    let previousAvgWeight = null;

    sortedWeeks.forEach(weekKey => {
      const week = weeks.get(weekKey);
      if (week.weights.length < 3 || week.calories.length < 3) return;

      const avgWeight = week.weights.reduce((sum, log) => {
        return sum + (log.unit === 'kg' ? log.weight * 2.20462 : log.weight);
      }, 0) / week.weights.length;

      const avgCalories = week.calories.reduce((sum, log) => sum + log.caloriesConsumed, 0) / week.calories.length;

      if (previousAvgWeight !== null) {
        const weightChange = avgWeight - previousAvgWeight;
        const dailyTDEE = avgCalories - (weightChange * CALORIES_PER_POUND / 7);

        if (dailyTDEE > 800 && dailyTDEE < 6000) {
          dataPoints.push({
            weekEndDate: weekKey,
            avgWeight: Math.round(avgWeight * 10) / 10,
            avgCalories: Math.round(avgCalories),
            weightChange: Math.round(weightChange * 100) / 100,
            calculatedTDEE: Math.round(dailyTDEE),
          });
        }
      }
      previousAvgWeight = avgWeight;
    });

    // Calculate smoothed TDEE
    let adaptiveTDEE = dataPoints.length > 0 ? dataPoints[0].calculatedTDEE : 0;
    for (let i = 1; i < dataPoints.length; i++) {
      adaptiveTDEE = SMOOTHING_FACTOR * dataPoints[i].calculatedTDEE + (1 - SMOOTHING_FACTOR) * adaptiveTDEE;
    }
    adaptiveTDEE = Math.round(adaptiveTDEE);

    // Formula TDEE
    const latestWeight = weightHistory.length > 0
      ? (weightHistory[0].unit === 'kg' ? weightHistory[0].weight : weightHistory[0].weight * 0.453592)
      : 80;

    const formulaTDEE = calculateFormulaTDEE(
      latestWeight, userProfile.heightCm, userProfile.age, userProfile.sex, userProfile.activityLevel
    );

    if (dataPoints.length < 2) adaptiveTDEE = formulaTDEE;

    // Confidence calculation
    let confidenceScore = dataPoints.length >= 8 ? 40 : dataPoints.length >= 4 ? 30 : dataPoints.length >= 2 ? 20 : 10;

    if (dataPoints.length >= 2) {
      const tdeeValues = dataPoints.map(dp => dp.calculatedTDEE);
      const avg = tdeeValues.reduce((a, b) => a + b, 0) / tdeeValues.length;
      const cv = Math.sqrt(tdeeValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / tdeeValues.length) / avg;
      confidenceScore += cv < 0.05 ? 30 : cv < 0.10 ? 25 : cv < 0.15 ? 20 : 10;
    }

    const uniqueDays = new Set([...weightHistory.map(w => w.date), ...calorieHistory.map(c => c.date)]).size;
    confidenceScore += uniqueDays >= 28 ? 30 : uniqueDays >= 21 ? 25 : uniqueDays >= 14 ? 20 : 10;

    const confidence = confidenceScore >= 80 ? 'high' : confidenceScore >= 50 ? 'medium' : 'low';
    const difference = adaptiveTDEE - formulaTDEE;
    const differencePercent = Math.round((difference / formulaTDEE) * 100);
    const metabolismTrend = differencePercent > 8 ? 'faster' : differencePercent < -8 ? 'slower' : 'normal';

    // Recommended calories
    const targetWeeklyChange = userProfile.goalType === 'lose' ? -1 : userProfile.goalType === 'gain' ? 0.5 : 0;
    const recommendedCalories = Math.max(1200, Math.round(adaptiveTDEE + (targetWeeklyChange * CALORIES_PER_POUND / 7)));

    const result = {
      adaptiveTDEE, formulaTDEE, difference, differencePercent, confidence, confidenceScore,
      dataPoints: dataPoints.length, recommendedCalories, metabolismTrend,
      weeklyHistory: dataPoints.slice(-8),
      lastCalculated: new Date().toISOString(),
    };

    // Save to database
    await pool.query(
      `INSERT INTO tdee_calculations (user_id, adaptive_tdee, formula_tdee, difference, difference_percent, confidence, confidence_score, data_points, recommended_calories, metabolism_trend, weekly_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [req.userId, adaptiveTDEE, formulaTDEE, difference, differencePercent, confidence, confidenceScore, dataPoints.length, recommendedCalories, metabolismTrend, JSON.stringify(dataPoints.slice(-8))]
    );

    res.json({ ok: true, result });
  } catch (error) {
    console.error('[Adaptive TDEE] Error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================
// SMART MEAL LOGGER AGENT
// ============================================

app.post('/api/v1/agents/smart-meal-logger/suggestions', authenticateToken, async (req, res) => {
  try {
    const { timeOfDay, recentMeals } = req.body;

    // Get user's meal history for patterns
    const mealHistory = await pool.query(
      `SELECT meal_name, meal_type, calories, protein, logged_at
       FROM meals WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 50`,
      [req.userId]
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a smart meal suggestion assistant. Based on the user's meal history patterns, suggest meals they're likely to eat. Return JSON:
          {
            "suggestions": [
              {"name": "Meal Name", "confidence": 0.85, "reason": "You often eat this for breakfast", "calories": 400, "protein": 25}
            ],
            "quickLogOptions": ["Greek Yogurt with Berries", "Oatmeal", "Protein Shake"]
          }`
        },
        {
          role: 'user',
          content: `Time of day: ${timeOfDay || 'morning'}. Recent meals: ${JSON.stringify(recentMeals || [])}. Meal history: ${JSON.stringify(mealHistory.rows.slice(0, 20))}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 800,
    });

    const suggestions = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...suggestions });
  } catch (error) {
    console.error('[Smart Logger] Error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// ============================================
// ACCOUNTABILITY PARTNER AGENT
// ============================================

app.post('/api/v1/agents/accountability/check-in', authenticateToken, async (req, res) => {
  try {
    const { todayProgress, goals, streak } = req.body;

    // Get user's recent data
    const recentMeals = await pool.query(
      `SELECT SUM(calories) as total_calories, SUM(protein) as total_protein
       FROM meals WHERE user_id = $1 AND DATE(logged_at) = CURRENT_DATE`,
      [req.userId]
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are an encouraging accountability partner. Provide a brief, personalized check-in message. Be specific about their progress. Return JSON:
          {
            "message": "Encouraging message",
            "progressScore": 85,
            "tips": ["Specific tip 1"],
            "celebration": "Achievement to celebrate" or null,
            "focus": "One thing to focus on"
          }`
        },
        {
          role: 'user',
          content: `Today's progress: ${JSON.stringify(todayProgress)}. Goals: ${JSON.stringify(goals)}. Current streak: ${streak || 0} days. Today's meals: ${JSON.stringify(recentMeals.rows[0])}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 500,
    });

    const checkIn = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...checkIn });
  } catch (error) {
    console.error('[Accountability] Error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// ============================================
// PROGRESS PREDICTION AGENT
// ============================================

app.post('/api/v1/agents/prediction/forecast', authenticateToken, async (req, res) => {
  try {
    const { currentWeight, targetWeight, averageDeficit, startDate } = req.body;

    // Get historical weight data
    const weightHistory = await pool.query(
      `SELECT weight, logged_at FROM weight_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 30`,
      [req.userId]
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a progress prediction specialist. Analyze weight trends and provide realistic forecasts. Return JSON:
          {
            "predictedDate": "2025-03-15",
            "confidenceLevel": "medium",
            "weeklyProjections": [{"week": 1, "predictedWeight": 185, "range": [184, 186]}],
            "factors": ["Current deficit is sustainable", "Weight loss may slow after week 4"],
            "recommendations": ["Consider a diet break", "Increase protein slightly"],
            "milestones": [{"weight": 180, "estimatedDate": "2025-02-28", "celebration": "First 10 lbs!"}]
          }`
        },
        {
          role: 'user',
          content: `Current: ${currentWeight}lbs, Target: ${targetWeight}lbs, Avg deficit: ${averageDeficit}cal/day. History: ${JSON.stringify(weightHistory.rows)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1000,
    });

    const prediction = JSON.parse(completion.choices[0].message.content);

    // Save prediction
    await pool.query(
      `INSERT INTO progress_predictions (user_id, prediction_type, target_metric, current_value, target_value, predicted_date, confidence, factors)
       VALUES ($1, 'weight', 'weight_lbs', $2, $3, $4, $5, $6)`,
      [req.userId, currentWeight, targetWeight, prediction.predictedDate, prediction.confidenceLevel === 'high' ? 0.9 : 0.7, JSON.stringify(prediction.factors)]
    );

    res.json({ success: true, ...prediction });
  } catch (error) {
    console.error('[Prediction] Error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// ============================================
// HABIT FORMATION AGENT
// ============================================

app.post('/api/v1/agents/habits/analyze', authenticateToken, async (req, res) => {
  try {
    const { habits, completions } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a habit formation expert using behavioral psychology. Analyze habit patterns and provide insights. Return JSON:
          {
            "streaks": [{"habit": "name", "currentStreak": 7, "bestStreak": 14}],
            "patterns": ["You're most consistent on weekdays", "Morning habits have 80% completion"],
            "recommendations": [{"habit": "name", "suggestion": "Stack with existing habit", "science": "Habit stacking increases success by 40%"}],
            "nextMilestone": {"habit": "name", "target": 21, "current": 18, "message": "3 days to form the habit!"},
            "weeklyScore": 85
          }`
        },
        {
          role: 'user',
          content: `Habits: ${JSON.stringify(habits)}. Recent completions: ${JSON.stringify(completions)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 800,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...analysis });
  } catch (error) {
    console.error('[Habits] Error:', error);
    res.status(500).json({ error: 'Habit analysis failed' });
  }
});

// ============================================
// RESTAURANT MENU AGENT
// ============================================

app.post('/api/v1/agents/restaurant/analyze', authenticateToken, async (req, res) => {
  try {
    const { restaurantName, menuItems, goals } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a restaurant menu nutrition analyst. Help users make healthy choices while dining out. Return JSON:
          {
            "recommendations": [
              {"item": "Grilled Salmon", "reason": "High protein, healthy fats", "estimatedNutrition": {"calories": 450, "protein": 40}, "modifications": ["Ask for sauce on side"]}
            ],
            "avoid": [{"item": "Loaded Nachos", "reason": "High calorie, low protein"}],
            "tips": ["Ask for dressing on the side", "Request grilled instead of fried"],
            "bestChoices": ["Item 1", "Item 2"],
            "calorieEstimates": {"appetizer": 300, "entree": 600, "sides": 200}
          }`
        },
        {
          role: 'user',
          content: `Restaurant: ${restaurantName}. Menu items: ${JSON.stringify(menuItems)}. Goals: ${JSON.stringify(goals)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 1200,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    // Save analysis
    await pool.query(
      `INSERT INTO restaurant_analyses (user_id, restaurant_name, menu_items, recommendations)
       VALUES ($1, $2, $3, $4)`,
      [req.userId, restaurantName, JSON.stringify(menuItems), JSON.stringify(analysis)]
    );

    res.json({ success: true, ...analysis });
  } catch (error) {
    console.error('[Restaurant] Error:', error);
    res.status(500).json({ error: 'Menu analysis failed' });
  }
});

// ============================================
// SLEEP RECOVERY AGENT
// ============================================

app.post('/api/v1/agents/sleep/analyze', authenticateToken, async (req, res) => {
  try {
    const { recentSleep, goals } = req.body;

    // Get sleep history
    const sleepHistory = await pool.query(
      `SELECT * FROM sleep_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 14`,
      [req.userId]
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a sleep and recovery specialist. Analyze sleep patterns and provide recommendations. Return JSON:
          {
            "averageSleep": 7.2,
            "sleepDebt": 3.5,
            "quality": "good",
            "trends": ["Improving over past week", "Consistent bedtime"],
            "recommendations": [{"priority": "high", "tip": "Avoid screens 1hr before bed", "impact": "Could improve quality by 15%"}],
            "recoveryScore": 75,
            "optimalBedtime": "10:30 PM",
            "optimalWakeTime": "6:30 AM"
          }`
        },
        {
          role: 'user',
          content: `Recent sleep: ${JSON.stringify(recentSleep)}. History: ${JSON.stringify(sleepHistory.rows)}. Goal: ${goals?.sleepHours || 8} hours`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 800,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...analysis });
  } catch (error) {
    console.error('[Sleep] Error:', error);
    res.status(500).json({ error: 'Sleep analysis failed' });
  }
});

// ============================================
// HYDRATION AGENT
// ============================================

app.post('/api/v1/agents/hydration/status', authenticateToken, async (req, res) => {
  try {
    const { todayIntake, goal, activityLevel, weather } = req.body;

    // Get hydration history
    const hydrationHistory = await pool.query(
      `SELECT date, SUM(amount_oz) as total FROM hydration_logs
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY date ORDER BY date`,
      [req.userId]
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a hydration specialist. Analyze water intake and provide recommendations. Return JSON:
          {
            "currentStatus": "slightly dehydrated",
            "percentOfGoal": 65,
            "adjustedGoal": 80,
            "remainingOz": 32,
            "schedule": [{"time": "2:00 PM", "amount": 8, "reminder": "Post-lunch hydration"}],
            "tips": ["Add lemon for flavor", "Keep water bottle visible"],
            "weeklyAverage": 58,
            "trend": "improving"
          }`
        },
        {
          role: 'user',
          content: `Today: ${todayIntake}oz, Goal: ${goal}oz, Activity: ${activityLevel}, Weather: ${weather}. History: ${JSON.stringify(hydrationHistory.rows)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 600,
    });

    const status = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('[Hydration] Error:', error);
    res.status(500).json({ error: 'Hydration analysis failed' });
  }
});

// Log hydration
app.post('/api/v1/health/hydration', authenticateToken, async (req, res) => {
  try {
    const { amountOz, date } = req.body;
    const logDate = date || new Date().toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO hydration_logs (user_id, date, amount_oz) VALUES ($1, $2, $3)`,
      [req.userId, logDate, amountOz]
    );

    // Get today's total
    const total = await pool.query(
      `SELECT SUM(amount_oz) as total FROM hydration_logs WHERE user_id = $1 AND date = $2`,
      [req.userId, logDate]
    );

    res.json({ success: true, todayTotal: parseFloat(total.rows[0].total) || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log hydration' });
  }
});

// ============================================
// CALORIE BANKING AGENT
// ============================================

app.post('/api/v1/agents/banking/calculate', authenticateToken, async (req, res) => {
  try {
    const { weeklyBudget, dailyLogs, specialEvents } = req.body;

    // Get banking history
    const bankHistory = await pool.query(
      `SELECT * FROM calorie_bank WHERE user_id = $1 ORDER BY date DESC LIMIT 14`,
      [req.userId]
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a calorie banking strategist helping users save/spend calories wisely. Return JSON:
          {
            "currentBalance": 500,
            "weeklyStatus": {"saved": 700, "spent": 200, "net": 500},
            "todayBudget": 1800,
            "strategy": "Save 100 cal today for Saturday dinner",
            "eventPlanning": [{"event": "Saturday dinner", "allocatedCalories": 2500, "strategy": "Light breakfast, skip snacks"}],
            "safeWithdrawalLimit": 300,
            "recommendations": ["Don't exceed 500 cal deficit any single day", "Plan ahead for events"]
          }`
        },
        {
          role: 'user',
          content: `Weekly budget: ${weeklyBudget}cal. Daily logs: ${JSON.stringify(dailyLogs)}. Events: ${JSON.stringify(specialEvents)}. History: ${JSON.stringify(bankHistory.rows)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 800,
    });

    const banking = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...banking });
  } catch (error) {
    console.error('[Banking] Error:', error);
    res.status(500).json({ error: 'Banking calculation failed' });
  }
});

// ============================================
// WORKOUT FORM COACH AGENT
// ============================================

app.post('/api/v1/agents/form-coach/analyze', authenticateToken, async (req, res) => {
  try {
    const { exercise, videoData, userDescription } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert exercise form coach. Provide detailed form corrections and tips. Return JSON:
          {
            "exercise": "Squat",
            "overallScore": 75,
            "formIssues": [{"issue": "Knees caving in", "severity": "high", "correction": "Push knees out over toes"}],
            "positives": ["Good depth", "Back stays neutral"],
            "cues": ["Screw feet into ground", "Brace core before descent"],
            "commonMistakes": ["Going too fast", "Bouncing at bottom"],
            "progressions": ["Add pause at bottom", "Try tempo squats"],
            "safetyNote": "If knee pain persists, reduce weight and consult professional"
          }`
        },
        {
          role: 'user',
          content: `Exercise: ${exercise}. User description: ${userDescription || 'Need form check'}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 800,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...analysis });
  } catch (error) {
    console.error('[Form Coach] Error:', error);
    res.status(500).json({ error: 'Form analysis failed' });
  }
});

// ============================================
// NUTRITION ACCURACY AGENT
// ============================================

app.post('/api/v1/agents/nutrition-accuracy/verify', authenticateToken, async (req, res) => {
  try {
    const { meal, estimatedNutrition, source } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition accuracy verifier. Cross-check nutrition estimates and flag potential issues. Return JSON:
          {
            "isAccurate": true,
            "confidenceScore": 85,
            "issues": [{"field": "calories", "issue": "Seems low for portion size", "suggestedValue": 450}],
            "verifiedNutrition": {"calories": 450, "protein": 35, "carbs": 40, "fat": 15},
            "reasoning": "Based on typical portion sizes and USDA data",
            "suggestions": ["Consider weighing portions for accuracy", "This meal is high in sodium"]
          }`
        },
        {
          role: 'user',
          content: `Meal: ${meal}. Estimated: ${JSON.stringify(estimatedNutrition)}. Source: ${source}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 600,
    });

    const verification = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...verification });
  } catch (error) {
    console.error('[Nutrition Accuracy] Error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// HEALTH DATA ENDPOINTS
// ============================================

// Get today's metrics
app.get('/api/v1/health/metrics', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [meals, steps, hydration, weight, sleep] = await Promise.all([
      pool.query(`SELECT SUM(calories) as calories, SUM(protein) as protein, SUM(carbs) as carbs, SUM(fat) as fat FROM meals WHERE user_id = $1 AND DATE(logged_at) = $2`, [req.userId, today]),
      pool.query(`SELECT steps, active_minutes FROM step_logs WHERE user_id = $1 AND date = $2`, [req.userId, today]),
      pool.query(`SELECT SUM(amount_oz) as water FROM hydration_logs WHERE user_id = $1 AND date = $2`, [req.userId, today]),
      pool.query(`SELECT weight, unit FROM weight_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 1`, [req.userId]),
      pool.query(`SELECT total_hours, quality_score FROM sleep_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 1`, [req.userId]),
    ]);

    res.json({
      success: true,
      metrics: {
        calories: parseInt(meals.rows[0]?.calories) || 0,
        protein: parseInt(meals.rows[0]?.protein) || 0,
        carbs: parseInt(meals.rows[0]?.carbs) || 0,
        fat: parseInt(meals.rows[0]?.fat) || 0,
        steps: steps.rows[0]?.steps || 0,
        activeMinutes: steps.rows[0]?.active_minutes || 0,
        waterOz: parseFloat(hydration.rows[0]?.water) || 0,
        weight: weight.rows[0]?.weight || null,
        weightUnit: weight.rows[0]?.unit || 'lbs',
        sleepHours: parseFloat(sleep.rows[0]?.total_hours) || null,
        sleepQuality: sleep.rows[0]?.quality_score || null,
      }
    });
  } catch (error) {
    console.error('[Metrics] Error:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Ingest health data (from Apple Health, etc.)
app.post('/api/v1/health/ingest-simple', authenticateToken, async (req, res) => {
  try {
    const { steps, activeCalories, weight, sleepHours, date } = req.body;
    const logDate = date || new Date().toISOString().split('T')[0];

    if (steps !== undefined) {
      await pool.query(
        `INSERT INTO step_logs (user_id, date, steps, source) VALUES ($1, $2, $3, 'apple_health')
         ON CONFLICT (user_id, date) DO UPDATE SET steps = $3`,
        [req.userId, logDate, steps]
      );
    }

    if (activeCalories !== undefined) {
      await pool.query(
        `INSERT INTO calorie_logs (user_id, date, calories_burned) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, date) DO UPDATE SET calories_burned = $3`,
        [req.userId, logDate, activeCalories]
      );
    }

    if (weight !== undefined) {
      await pool.query(
        `INSERT INTO weight_logs (user_id, weight, unit, source) VALUES ($1, $2, 'lbs', 'apple_health')`,
        [req.userId, weight]
      );
    }

    if (sleepHours !== undefined) {
      await pool.query(
        `INSERT INTO sleep_logs (user_id, date, total_hours, source) VALUES ($1, $2, $3, 'apple_health')
         ON CONFLICT (user_id, date) DO UPDATE SET total_hours = $3`,
        [req.userId, logDate, sleepHours]
      );
    }

    res.json({ success: true, message: 'Health data ingested' });
  } catch (error) {
    console.error('[Health Ingest] Error:', error);
    res.status(500).json({ error: 'Failed to ingest health data' });
  }
});

// Get health history
app.get('/api/v1/health/history', authenticateToken, async (req, res) => {
  try {
    const { days } = req.query;
    const daysBack = parseInt(days) || 30;

    const [weights, calories, steps] = await Promise.all([
      pool.query(
        `SELECT weight, unit, logged_at FROM weight_logs WHERE user_id = $1 AND logged_at >= NOW() - INTERVAL '${daysBack} days' ORDER BY logged_at`,
        [req.userId]
      ),
      pool.query(
        `SELECT date, calories_consumed, calories_burned FROM calorie_logs WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${daysBack} days' ORDER BY date`,
        [req.userId]
      ),
      pool.query(
        `SELECT date, steps FROM step_logs WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${daysBack} days' ORDER BY date`,
        [req.userId]
      ),
    ]);

    res.json({
      success: true,
      history: {
        weights: weights.rows,
        calories: calories.rows,
        steps: steps.rows,
      }
    });
  } catch (error) {
    console.error('[History] Error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Get connected devices
app.get('/api/v1/health/devices', authenticateToken, async (req, res) => {
  try {
    const devices = await pool.query(
      `SELECT provider, last_sync_at, sync_status, data_types FROM connected_devices WHERE user_id = $1`,
      [req.userId]
    );
    res.json({ success: true, devices: devices.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Sync fitness data
app.post('/api/v1/health/sync', authenticateToken, async (req, res) => {
  try {
    const { provider, data } = req.body;

    // Update or create device connection
    await pool.query(
      `INSERT INTO connected_devices (user_id, provider, last_sync_at, sync_status)
       VALUES ($1, $2, NOW(), 'active')
       ON CONFLICT (user_id, provider) DO UPDATE SET last_sync_at = NOW(), sync_status = 'active'`,
      [req.userId, provider]
    );

    // Process data based on type
    if (data.steps) {
      for (const entry of data.steps) {
        await pool.query(
          `INSERT INTO step_logs (user_id, date, steps, source) VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, date) DO UPDATE SET steps = $3`,
          [req.userId, entry.date, entry.value, provider]
        );
      }
    }

    res.json({ success: true, message: `Synced ${provider} data` });
  } catch (error) {
    console.error('[Sync] Error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// ============================================
// WEIGHT LOGGING
// ============================================

app.post('/api/v1/health/weight', authenticateToken, async (req, res) => {
  try {
    const { weight, unit, bodyFatPercent, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO weight_logs (user_id, weight, unit, body_fat_percent, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, weight, unit || 'lbs', bodyFatPercent, notes]
    );

    res.json({ success: true, weightLog: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log weight' });
  }
});

// ============================================
// SLEEP LOGGING
// ============================================

app.post('/api/v1/health/sleep', authenticateToken, async (req, res) => {
  try {
    const { date, bedTime, wakeTime, totalHours, deepSleepHours, remSleepHours, qualityScore, notes } = req.body;
    const logDate = date || new Date().toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO sleep_logs (user_id, date, bed_time, wake_time, total_hours, deep_sleep_hours, rem_sleep_hours, quality_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, date) DO UPDATE SET total_hours = $5, quality_score = $8`,
      [req.userId, logDate, bedTime, wakeTime, totalHours, deepSleepHours, remSleepHours, qualityScore, notes]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log sleep' });
  }
});

// Get sleep history
app.get('/api/v1/health/sleep', authenticateToken, async (req, res) => {
  try {
    const { days } = req.query;
    const sleep = await pool.query(
      `SELECT * FROM sleep_logs WHERE user_id = $1 ORDER BY date DESC LIMIT $2`,
      [req.userId, parseInt(days) || 14]
    );
    res.json({ success: true, sleepLogs: sleep.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sleep data' });
  }
});

// ============================================
// HABITS
// ============================================

app.get('/api/v1/habits', authenticateToken, async (req, res) => {
  try {
    const habits = await pool.query(
      `SELECT h.*,
              (SELECT COUNT(*) FROM habit_completions hc WHERE hc.habit_id = h.id AND hc.date >= CURRENT_DATE - INTERVAL '7 days') as week_completions
       FROM habits h WHERE h.user_id = $1 AND h.is_active = true`,
      [req.userId]
    );
    res.json({ success: true, habits: habits.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get habits' });
  }
});

app.post('/api/v1/habits', authenticateToken, async (req, res) => {
  try {
    const { habitName, habitType, frequency, targetValue, unit, reminderTime } = req.body;

    const result = await pool.query(
      `INSERT INTO habits (user_id, habit_name, habit_type, frequency, target_value, unit, reminder_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, habitName, habitType, frequency || 'daily', targetValue || 1, unit, reminderTime]
    );

    res.json({ success: true, habit: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.post('/api/v1/habits/:habitId/complete', authenticateToken, async (req, res) => {
  try {
    const { habitId } = req.params;
    const { date, value } = req.body;
    const completionDate = date || new Date().toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO habit_completions (habit_id, user_id, date, value)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (habit_id, date) DO UPDATE SET value = $4`,
      [habitId, req.userId, completionDate, value || 1]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete habit' });
  }
});

// ============================================
// FASTING
// ============================================

app.post('/api/v1/fasting/start', authenticateToken, async (req, res) => {
  try {
    const { fastingType, targetHours } = req.body;
    const startedAt = new Date();
    const targetEndAt = new Date(startedAt.getTime() + (targetHours || 16) * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO fasting_sessions (user_id, fasting_type, started_at, target_end_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, fastingType || '16:8', startedAt, targetEndAt]
    );

    res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start fast' });
  }
});

app.post('/api/v1/fasting/end', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE fasting_sessions SET actual_end_at = NOW(), is_completed = true
       WHERE user_id = $1 AND is_completed = false
       ORDER BY started_at DESC LIMIT 1 RETURNING *`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active fast found' });
    }

    res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end fast' });
  }
});

app.get('/api/v1/fasting/current', authenticateToken, async (req, res) => {
  try {
    const session = await pool.query(
      `SELECT * FROM fasting_sessions WHERE user_id = $1 AND is_completed = false ORDER BY started_at DESC LIMIT 1`,
      [req.userId]
    );
    res.json({ success: true, session: session.rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get fasting status' });
  }
});

// ============================================
// AVATAR COACHING ENDPOINTS
// ============================================

app.post('/api/v1/avatar/config', authenticateToken, async (req, res) => {
  res.json({
    ok: true,
    streamingAvailable: liveAvatarService.isConfigured(),
    avatarId: process.env.LIVEAVATAR_AVATAR_ID || 'default',
  });
});

// Helper: create and start a LiveAvatar streaming session
async function createLiveAvatarSession() {
  console.log('[LiveAvatar] createLiveAvatarSession called. Configured:', liveAvatarService.isConfigured(),
    'API_KEY set:', !!process.env.LIVEAVATAR_API_KEY,
    'AVATAR_ID set:', !!process.env.LIVEAVATAR_AVATAR_ID);

  if (!liveAvatarService.isConfigured()) {
    console.log('[LiveAvatar] Not configured - missing LIVEAVATAR_API_KEY or LIVEAVATAR_AVATAR_ID');
    return null;
  }
  try {
    console.log('[LiveAvatar] Creating and starting session...');
    const session = await liveAvatarService.createAndStartSession();
    console.log('[LiveAvatar] Session ready:', session.sessionId);
    return session;
  } catch (err) {
    console.error('[LiveAvatar] Session creation/start failed:', err.message);
    console.error('[LiveAvatar] Full error:', err.stack || err);
    return null;
  }
}

app.post('/api/v1/avatar/coach/goals', authenticateToken, async (req, res) => {
  try {
    const { goalData, userInputs } = req.body;

    // Build a rich context string from all available user data
    const userName = userInputs?.userName || 'there';
    const primaryGoal = userInputs?.primaryGoal || 'improve_health';
    const activityLevel = userInputs?.activityLevel || 'moderate';
    const currentWeight = userInputs?.currentWeight;
    const targetWeight = userInputs?.targetWeight;
    const heightFt = userInputs?.heightFt;
    const heightIn = userInputs?.heightIn;
    const age = userInputs?.age;
    const sex = userInputs?.sex;
    const dietStyle = userInputs?.dietStyle || 'standard';
    const workoutsPerWeek = userInputs?.workoutsPerWeek || 3;
    const weightUnit = userInputs?.weightUnit || 'lbs';

    const calories = goalData?.calories;
    const protein = goalData?.protein;
    const carbs = goalData?.carbs;
    const fat = goalData?.fat;
    const bmr = goalData?.bmr;
    const tdee = goalData?.tdee;
    const bmi = goalData?.bmi;
    const dailyDelta = goalData?.dailyDelta;
    const weeklyChange = goalData?.weeklyChange;
    const totalWeeks = goalData?.totalWeeks;

    const goalLabels = {
      lose_weight: 'lose weight',
      build_muscle: 'build muscle',
      maintain: 'maintain their current weight',
      improve_health: 'improve overall health',
    };
    const goalLabel = goalLabels[primaryGoal] || primaryGoal;

    const activityLabels = {
      sedentary: 'sedentary (little to no exercise)',
      lightly_active: 'lightly active (1-3 days/week)',
      moderate: 'moderately active (3-5 days/week)',
      very_active: 'very active (6-7 days/week)',
      extra_active: 'extra active (athlete/physical job)',
    };
    const activityLabel = activityLabels[activityLevel] || activityLevel;

    const dietLabels = {
      standard: 'standard balanced',
      keto: 'keto',
      high_protein: 'high protein',
      vegetarian: 'vegetarian',
      vegan: 'vegan',
      mediterranean: 'Mediterranean',
    };
    const dietLabel = dietLabels[dietStyle] || dietStyle;

    const weightDiff = currentWeight && targetWeight ? Math.abs(currentWeight - targetWeight) : null;
    const isLosing = primaryGoal === 'lose_weight';
    const isGaining = primaryGoal === 'build_muscle';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable, honest, and motivating personal health coach delivering a personalized video coaching session. You are speaking directly to the user through a live video avatar — talk naturally and conversationally as if you're face to face.

Your coaching script should be 90-120 seconds of speaking time (roughly 225-300 words). Be detailed, specific, and reference their EXACT numbers. Do NOT be vague or generic. Cover all of the following in a natural, flowing conversation:

1. GREETING: Address them by name. Acknowledge the goal they just set and that their plan is ready.

2. BODY STATS BREAKDOWN: Explain their BMR, TDEE, and BMI in plain language — what these numbers mean for them specifically. For example: "Your body burns about X calories just existing — that's your BMR. With your activity level, your total daily burn is about Y calories."

3. DAILY TARGETS: Walk through their specific calorie target and macro split (protein, carbs, fat in grams). Explain WHY these numbers matter for their specific goal. For example, if losing weight: "We've set you at X calories — that's a Y calorie deficit from your TDEE, which means you'll lose about Z pounds per week."

4. THE PLAN TIMELINE: If they have a weight change goal, give them the honest timeline. "You want to go from A to B — that's C pounds. At your rate, you're looking at roughly D weeks. That's realistic and healthy."

5. DIET & TRAINING: Mention their diet style and workout frequency. Give one or two practical tips specific to their approach.

6. HONEST MOTIVATION: Be real with them — not fake-positive. Acknowledge the work ahead but express genuine confidence based on the fact that they've already taken the first step by setting up their plan.

IMPORTANT RULES:
- Use their actual numbers — never round excessively or say "around" when you have exact figures
- Speak in second person ("you", "your")
- No bullet points or lists — this is spoken coaching, make it flow naturally
- No emojis or markdown formatting
- Don't say "as your coach" or "as an AI" — just speak naturally
- Keep the tone warm but direct, like a trusted coach who respects their intelligence`
        },
        {
          role: 'user',
          content: `Generate a detailed coaching script for this user:

NAME: ${userName}
AGE: ${age || 'not provided'}
SEX: ${sex || 'not provided'}
HEIGHT: ${heightFt ? `${heightFt}'${heightIn || 0}"` : 'not provided'}
CURRENT WEIGHT: ${currentWeight ? `${currentWeight} ${weightUnit}` : 'not provided'}
TARGET WEIGHT: ${targetWeight ? `${targetWeight} ${weightUnit}` : 'not provided'}
${weightDiff ? `WEIGHT TO ${isLosing ? 'LOSE' : isGaining ? 'GAIN' : 'CHANGE'}: ${weightDiff} ${weightUnit}` : ''}
PRIMARY GOAL: ${goalLabel}
ACTIVITY LEVEL: ${activityLabel}
DIET STYLE: ${dietLabel}
WORKOUTS PER WEEK: ${workoutsPerWeek}

CALCULATED METRICS:
- BMR (Basal Metabolic Rate): ${bmr || 'N/A'} calories/day
- TDEE (Total Daily Energy Expenditure): ${tdee || 'N/A'} calories/day
- BMI: ${bmi ? bmi.toFixed(1) : 'N/A'}
- Daily Calorie Target: ${calories || 'N/A'} calories
- Daily Deficit/Surplus: ${dailyDelta ? `${dailyDelta > 0 ? '+' : ''}${dailyDelta} calories` : 'N/A'}
- Protein Target: ${protein || 'N/A'}g
- Carbs Target: ${carbs || 'N/A'}g
- Fat Target: ${fat || 'N/A'}g
${weeklyChange ? `- Expected Weekly Change: ${weeklyChange > 0 ? '+' : ''}${weeklyChange} ${weightUnit}/week` : ''}
${totalWeeks ? `- Estimated Timeline: ${totalWeeks} weeks to reach goal` : ''}`
        }
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const script = completion.choices[0].message.content;
    const avatarSession = await createLiveAvatarSession();

    if (avatarSession) {
      res.json({
        ok: true,
        script,
        streamingAvailable: true,
        token: avatarSession.sessionToken,
        session: avatarSession,
        defaultAvatarId: process.env.LIVEAVATAR_AVATAR_ID,
        defaultVoiceId: process.env.LIVEAVATAR_VOICE_ID || null,
      });
    } else {
      res.json({
        ok: true,
        script,
        streamingAvailable: false,
      });
    }
  } catch (error) {
    console.error('[Avatar Goals] Error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/v1/avatar/coach/meal-plan', authenticateToken, async (req, res) => {
  try {
    const { weeklyPlan, selectedDayIndex, userGoals, preferences, userName } = req.body;

    if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
      return res.status(400).json({ ok: false, error: 'Weekly meal plan data required' });
    }

    const name = userName || 'there';
    const selectedDay = weeklyPlan[selectedDayIndex] || weeklyPlan[0];
    const todaysMeals = selectedDay?.meals || [];
    const dayName = selectedDay?.dayName || `Day ${selectedDayIndex + 1}`;
    const dailyTotals = selectedDay?.dailyTotals || {};

    // Detailed meal breakdown with ingredients, macros, and prep info
    const mealDetails = todaysMeals.map(meal => {
      const ingredients = meal.ingredients?.map(i => {
        let detail = i.name;
        if (i.amount) detail += ` (${i.amount}${i.unit ? ' ' + i.unit : ''})`;
        return detail;
      }).join(', ') || 'various ingredients';

      return `  ${meal.mealType?.toUpperCase() || 'MEAL'}: ${meal.name}
    Calories: ${meal.calories || 0} | Protein: ${meal.protein || 0}g | Carbs: ${meal.carbs || 0}g | Fat: ${meal.fat || 0}g
    Ingredients: ${ingredients}${meal.prepTime ? `\n    Prep time: ${meal.prepTime} min` : ''}`;
    }).join('\n');

    // Weekly overview stats
    const weekStats = weeklyPlan.reduce((acc, day, idx) => {
      const dt = day.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      return {
        totalCalories: acc.totalCalories + (dt.calories || 0),
        totalProtein: acc.totalProtein + (dt.protein || 0),
        totalCarbs: acc.totalCarbs + (dt.carbs || 0),
        totalFat: acc.totalFat + (dt.fat || 0),
        daysPlanned: acc.daysPlanned + 1,
      };
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, daysPlanned: 0 });

    const avgCalories = weekStats.daysPlanned > 0 ? Math.round(weekStats.totalCalories / weekStats.daysPlanned) : 0;
    const avgProtein = weekStats.daysPlanned > 0 ? Math.round(weekStats.totalProtein / weekStats.daysPlanned) : 0;

    // How today compares to goals
    const calorieDiff = dailyTotals.calories && userGoals?.dailyCalories
      ? dailyTotals.calories - userGoals.dailyCalories : null;
    const proteinDiff = dailyTotals.protein && userGoals?.dailyProtein
      ? dailyTotals.protein - userGoals.dailyProtein : null;

    const dietStyle = preferences?.dietStyle || 'standard';
    const allergies = preferences?.allergies?.length > 0 ? preferences.allergies.join(', ') : null;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable, honest nutrition coach delivering a personalized video meal plan review. You are speaking directly to the user through a live video avatar — talk naturally as if you're sitting across from them reviewing their meal plan together.

Your coaching script should be 90-120 seconds of speaking time (roughly 225-300 words). Be specific, reference their EXACT meals by name, and give real nutritional insight. Cover all of the following in a natural, flowing conversation:

1. GREETING: Address them by name and reference what day's meal plan you're reviewing.

2. MEAL-BY-MEAL WALKTHROUGH: Go through each meal of the day by name. Comment on what's good about each choice — highlight protein sources, nutrient density, or smart combinations. Don't just list them, give insight. For example: "That grilled chicken with quinoa at lunch is a solid move — you're getting about 45 grams of protein right there, plus the quinoa gives you complete amino acids and slow-burning carbs."

3. DAILY MACRO ANALYSIS: Tell them exactly how today's plan stacks up against their goals. Be specific: "Today you're hitting X calories versus your Y calorie target — that's Z over/under. Your protein is at Xg out of your Yg goal." If they're over or under on something, explain what that means practically and what small adjustment they could make.

4. WEEKLY CONTEXT: Put today in perspective with the rest of their week. "Across your full week, you're averaging about X calories per day, which lines up well with your target" or "you're running a bit high on average — here's where to tighten up."

5. PRACTICAL TIPS: Give 1-2 specific, actionable nutrition tips based on what you see in their actual meals. Maybe a swap suggestion, a timing tip, or a way to hit a macro target they're short on.

6. ENCOURAGEMENT: Close with honest motivation tied to their specific plan.

IMPORTANT RULES:
- Reference specific meal names and actual numbers — never be vague
- Speak in second person ("you", "your")
- No bullet points or lists — this is spoken coaching, make it flow naturally
- No emojis or markdown formatting
- Don't say "as your coach" or "as an AI" — just speak naturally
- Keep the tone warm but knowledgeable, like a nutrition expert who genuinely cares`
        },
        {
          role: 'user',
          content: `Generate a detailed meal plan coaching script for this user:

USER NAME: ${name}
DIET STYLE: ${dietStyle}${allergies ? `\nALLERGIES/RESTRICTIONS: ${allergies}` : ''}

DAY BEING REVIEWED: ${dayName}
NUMBER OF MEALS: ${todaysMeals.length}

TODAY'S MEALS:
${mealDetails || '  No meals planned for this day'}

TODAY'S TOTALS:
- Calories: ${dailyTotals.calories || 0}
- Protein: ${dailyTotals.protein || 0}g
- Carbs: ${dailyTotals.carbs || 0}g
- Fat: ${dailyTotals.fat || 0}g

USER'S DAILY GOALS:
- Calorie Target: ${userGoals?.dailyCalories || 'not set'}
- Protein Target: ${userGoals?.dailyProtein || 'not set'}g
- Carbs Target: ${userGoals?.dailyCarbs || 'not set'}g
- Fat Target: ${userGoals?.dailyFat || 'not set'}g

${calorieDiff !== null ? `CALORIE DIFFERENCE: ${calorieDiff > 0 ? '+' : ''}${calorieDiff} calories (${calorieDiff > 0 ? 'over' : 'under'} target)` : ''}
${proteinDiff !== null ? `PROTEIN DIFFERENCE: ${proteinDiff > 0 ? '+' : ''}${proteinDiff}g (${proteinDiff > 0 ? 'over' : 'under'} target)` : ''}

WEEKLY OVERVIEW (${weekStats.daysPlanned} days planned):
- Average Daily Calories: ${avgCalories}
- Average Daily Protein: ${avgProtein}g
- Total Week Calories: ${weekStats.totalCalories}
- Total Week Protein: ${weekStats.totalProtein}g`
        }
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const script = completion.choices[0].message.content;
    const avatarSession = await createLiveAvatarSession();

    if (avatarSession) {
      res.json({
        ok: true,
        script,
        streamingAvailable: true,
        token: avatarSession.sessionToken,
        session: avatarSession,
        defaultAvatarId: process.env.LIVEAVATAR_AVATAR_ID,
        defaultVoiceId: process.env.LIVEAVATAR_VOICE_ID || null,
        metadata: {
          dayName: selectedDay?.dayName,
          mealCount: todaysMeals.length,
          dailyCalories: selectedDay?.dailyTotals?.calories,
        }
      });
    } else {
      res.json({
        ok: true,
        script,
        streamingAvailable: false,
        metadata: {
          dayName: selectedDay?.dayName,
          mealCount: todaysMeals.length,
          dailyCalories: selectedDay?.dailyTotals?.calories,
        }
      });
    }
  } catch (error) {
    console.error('[Avatar Meal Plan] Error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Chat session endpoint - creates a LiveAvatar session for the AI Coach chat
app.post('/api/v1/avatar/coach/chat-session', authenticateToken, async (req, res) => {
  try {
    const greeting = "Hey! I'm your AI coach. Ask me anything about nutrition, workouts, or your health goals.";
    const avatarSession = await createLiveAvatarSession();

    if (avatarSession) {
      res.json({
        ok: true,
        streamingAvailable: true,
        token: avatarSession.sessionToken,
        session: avatarSession,
        greeting,
      });
    } else {
      res.json({
        ok: true,
        streamingAvailable: false,
        greeting,
      });
    }
  } catch (error) {
    console.error('[Avatar Chat Session] Error:', error);
    res.json({
      ok: true,
      streamingAvailable: false,
      greeting: "Hey! I'm your AI coach. Ask me anything about nutrition, workouts, or your health goals.",
    });
  }
});

// Stop a LiveAvatar streaming session
app.post('/api/v1/avatar/coach/stop-session', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId && liveAvatarService.isConfigured()) {
      await liveAvatarService.stopSession(sessionId);
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('[Avatar Stop Session] Error:', error);
    res.json({ ok: true }); // Don't fail client on cleanup errors
  }
});

// ============================================
// FOOD SEARCH (External API)
// ============================================

app.get('/api/v1/food/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    // Use Open Food Facts API
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`
    );
    const data = await response.json();

    const foods = (data.products || []).map(p => ({
      name: p.product_name || 'Unknown',
      brand: p.brands || '',
      calories: p.nutriments?.['energy-kcal_100g'] || 0,
      protein: p.nutriments?.proteins_100g || 0,
      carbs: p.nutriments?.carbohydrates_100g || 0,
      fat: p.nutriments?.fat_100g || 0,
      servingSize: p.serving_size || '100g',
      barcode: p.code,
      imageUrl: p.image_url,
    }));

    res.json({ success: true, foods });
  } catch (error) {
    console.error('[Food Search] Error:', error);
    res.status(500).json({ error: 'Food search failed' });
  }
});

// ============================================
// TDEE INSIGHTS (AI)
// ============================================

app.post('/api/v1/agents/tdee/insights', authenticateToken, async (req, res) => {
  try {
    const { tdeeResult, userProfile } = req.body;

    if (!tdeeResult) {
      return res.status(400).json({ ok: false, error: 'TDEE result required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable nutrition coach analyzing metabolic data. Provide 3 personalized, encouraging insights. Be specific to their numbers.`
        },
        {
          role: 'user',
          content: `TDEE: ${tdeeResult.adaptiveTDEE} vs formula ${tdeeResult.formulaTDEE} (${tdeeResult.differencePercent}% diff). Metabolism: ${tdeeResult.metabolismTrend}. Confidence: ${tdeeResult.confidence}. Goal: ${userProfile?.goalType || 'maintain'}. Recommended: ${tdeeResult.recommendedCalories} cal/day.`
        }
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    res.json({
      ok: true,
      insights: completion.choices[0].message.content,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TDEE Insights] Error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

// Register push token
app.post('/api/v1/notifications/register', authenticateToken, async (req, res) => {
  try {
    const { expoPushToken, platform } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({ error: 'Push token required' });
    }

    // Create push_tokens table if doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        expo_push_token VARCHAR(255) NOT NULL UNIQUE,
        platform VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Upsert token
    await pool.query(`
      INSERT INTO push_tokens (user_id, expo_push_token, platform)
      VALUES ($1, $2, $3)
      ON CONFLICT (expo_push_token)
      DO UPDATE SET user_id = $1, platform = $3, updated_at = NOW()
    `, [req.userId, expoPushToken, platform]);

    console.log(`[Notifications] Registered push token for user ${req.userId}`);
    res.json({ success: true, message: 'Push token registered' });
  } catch (error) {
    console.error('[Notifications] Register error:', error);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

// Unregister push token
app.post('/api/v1/notifications/unregister', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM push_tokens WHERE user_id = $1', [req.userId]);
    res.json({ success: true, message: 'Push token unregistered' });
  } catch (error) {
    console.error('[Notifications] Unregister error:', error);
    res.status(500).json({ error: 'Failed to unregister push token' });
  }
});

// Send test notification
app.post('/api/v1/notifications/test', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    // Get user's push token
    const result = await pool.query(
      'SELECT expo_push_token FROM push_tokens WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No push token found for user' });
    }

    const pushToken = result.rows[0].expo_push_token;

    // Send push notification via Expo Push Notification service
    const expoPushMessage = {
      to: pushToken,
      sound: 'default',
      title: 'Heirclark Health',
      body: message || 'Test notification',
      data: { type: 'test' },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoPushMessage),
    });

    const data = await response.json();
    console.log('[Notifications] Test notification sent:', data);

    res.json({ success: true, message: 'Test notification sent', data });
  } catch (error) {
    console.error('[Notifications] Send test error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Send notification to specific user (internal use by AI agents)
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const result = await pool.query(
      'SELECT expo_push_token FROM push_tokens WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`[Notifications] No push token for user ${userId}`);
      return false;
    }

    const pushToken = result.rows[0].expo_push_token;

    const expoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoPushMessage),
    });

    const responseData = await response.json();
    console.log('[Notifications] Push sent:', responseData);
    return true;
  } catch (error) {
    console.error('[Notifications] Send error:', error);
    return false;
  }
}

// Export for use by other endpoints/agents
module.exports.sendPushNotification = sendPushNotification;

// ============================================
// INSTACART INTEGRATION
// ============================================

const INSTACART_API_KEY = process.env.INSTACART_API_KEY || '';
const INSTACART_BASE_URL = process.env.INSTACART_ENV === 'production'
  ? 'https://connect.instacart.com'
  : 'https://connect.dev.instacart.tools';

// POST /api/instacart/products-link - Create Instacart shopping cart
app.post('/api/instacart/products-link', async (req, res) => {
  try {
    const { items, title } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Missing or empty items array'
      });
    }

    if (!INSTACART_API_KEY) {
      console.error('[Instacart] INSTACART_API_KEY not configured');
      return res.status(503).json({
        ok: false,
        error: 'Instacart integration not configured'
      });
    }

    // Format line items for Instacart API
    const lineItems = items.map(item => ({
      name: item.name || item.query,
      quantity: item.quantity || 1,
      unit: item.unit || 'each'
    }));

    console.log('[Instacart] Creating products link with', lineItems.length, 'items');

    // Call Instacart IDP API
    const response = await fetch(`${INSTACART_BASE_URL}/idp/v1/products/products_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSTACART_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: title || 'Shopping List',
        line_items: lineItems
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Instacart] API error:', response.status, data);
      return res.status(502).json({
        ok: false,
        error: 'Failed to create Instacart link'
      });
    }

    console.log('[Instacart] ✅ Products link created');

    return res.json({
      ok: true,
      data: {
        link_url: data.products_link_url || data.link_url,
        items_count: items.length
      }
    });

  } catch (error) {
    console.error('[Instacart] Error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to create Instacart link'
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ============================================
// AUTO-MIGRATIONS (run on startup)
// ============================================

async function runMigrations() {
  try {
    console.log('[Migrations] Running database migrations...');

    // Add workout_days_per_week column if missing
    await pool.query(`
      ALTER TABLE user_goals
      ADD COLUMN IF NOT EXISTS workout_days_per_week INTEGER DEFAULT 3
    `);

    console.log('[Migrations] Completed successfully');
  } catch (error) {
    console.error('[Migrations] Error:', error.message);
    // Don't crash - the column might already exist in a different form
  }
}

// ============================================
// START SERVER
// ============================================

runMigrations().then(() => {
  app.listen(PORT, () => {
  console.log(`\n🚀 Heirclark Health Backend running on http://localhost:${PORT}`);
  console.log(`📊 AI Service: OpenAI GPT-4.1-mini with Vision + Whisper`);
  console.log(`🗄️  Database: PostgreSQL ${process.env.DATABASE_URL ? '(configured)' : '(not configured)'}`);
  console.log(`🔐 Auth: JWT ${JWT_SECRET !== 'heirclark-health-secret-key-change-in-production' ? '(custom secret)' : '(default secret)'}`);
  console.log(`\n📡 Available Endpoints:`);
  console.log(`   - Auth: /api/v1/auth/apple, /api/v1/auth/me`);
  console.log(`   - Goals: /api/v1/user/goals`);
  console.log(`   - Meals: /api/v1/meals, /api/v1/meals/saved`);
  console.log(`   - AI Analysis: /api/v1/nutrition/ai/*`);
  console.log(`   - AI Generation: /api/v1/ai/generate-meal-plan, generate-workout-plan`);
  console.log(`   - AI Coach: /api/v1/ai/coach-message, recipe-details`);
  console.log(`   - Agents: /api/v1/agents/tdee/*, smart-meal-logger/*, accountability/*, etc.`);
  console.log(`   - Health: /api/v1/health/metrics, history, hydration, sleep`);
  console.log(`   - Habits: /api/v1/habits`);
  console.log(`   - Fasting: /api/v1/fasting/*`);
  console.log(`   - Avatar: /api/v1/avatar/coach/*`);
  console.log(`\n✅ All 11 AI agents implemented!`);
  });
});

module.exports = app;
