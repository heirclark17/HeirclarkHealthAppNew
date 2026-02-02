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

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// DATABASE CONNECTION
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Initialize OpenAI client with timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 180000, // 3 minute timeout for AI generation (handles cold starts and complex requests)
  maxRetries: 2, // Retry failed requests up to 2 times
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
    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, dailyWaterOz, dailySteps, sleepHours, workoutDaysPerWeek } = req.body;

    // Validate and set defaults for required fields
    const calories = parseInt(dailyCalories) || 2000;
    const protein = parseInt(dailyProtein) || 150;
    const carbs = parseInt(dailyCarbs) || 200;
    const fat = parseInt(dailyFat) || 65;
    const waterOz = parseInt(dailyWaterOz) || 64;
    const steps = parseInt(dailySteps) || 10000;
    const sleep = parseFloat(sleepHours) || 8;
    const workoutDays = parseInt(workoutDaysPerWeek) || 4;

    console.log('[Goals] Saving goals for user:', req.userId, { calories, protein, carbs, fat, waterOz, steps, sleep, workoutDays });

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
    - Meal diversity: ${preferences?.mealDiversity || 'moderate'}
    - Cooking skill: ${preferences?.cookingSkill || 'intermediate'}
    - Cheat days: ${preferences?.cheatDays?.join(', ') || 'none'}

    Include ${preferences?.mealsPerDay || 3} meals per day plus snacks as needed.
    Make meals practical with common ingredients.
    Vary the proteins and vegetables throughout the week.
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
      max_tokens: 16000,
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
    res.status(500).json({ error: 'Failed to generate meal plan', message: error.message });
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

    // Save to database
    await pool.query(
      `INSERT INTO workout_plans (user_id, plan_name, description, weekly_schedule, goal_type, difficulty_level)
       VALUES ($1, $2, $3, $4, $5, $6)
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
    const { mealName, basicInfo } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional chef providing detailed recipes. Return JSON with:
          {
            "name": "Recipe Name",
            "description": "Brief description",
            "servings": 4,
            "prepTime": 15,
            "cookTime": 30,
            "difficulty": "easy/medium/hard",
            "nutrition": {"calories": 400, "protein": 30, "carbs": 40, "fat": 15},
            "ingredients": [{"item": "ingredient", "amount": "1 cup", "notes": "optional prep notes"}],
            "instructions": ["Step 1", "Step 2"],
            "tips": ["Pro tip 1"],
            "substitutions": [{"original": "item", "substitute": "alternative"}],
            "storage": "Storage instructions"
          }`
        },
        {
          role: 'user',
          content: `Provide detailed recipe for: ${mealName}. ${basicInfo ? `Basic info: ${JSON.stringify(basicInfo)}` : ''}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 2000,
    });

    const recipe = JSON.parse(completion.choices[0].message.content);
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
    streamingAvailable: !!process.env.HEYGEN_API_KEY,
    avatarId: process.env.HEYGEN_AVATAR_ID || 'default',
  });
});

app.post('/api/v1/avatar/coach/goals', authenticateToken, async (req, res) => {
  try {
    const { goals, progress } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a friendly, encouraging fitness coach giving a brief video message about the user's goals. Keep it to 30-45 seconds of speaking time (about 80-100 words). Be specific to their goals and progress.`
        },
        {
          role: 'user',
          content: `User goals: ${JSON.stringify(goals)}. Current progress: ${JSON.stringify(progress)}. Generate an encouraging coaching script.`
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    res.json({
      ok: true,
      script: completion.choices[0].message.content,
      streamingAvailable: false,
    });
  } catch (error) {
    console.error('[Avatar Goals] Error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/v1/avatar/coach/meal-plan', authenticateToken, async (req, res) => {
  try {
    const { weeklyPlan, selectedDayIndex, userGoals, preferences } = req.body;

    if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
      return res.status(400).json({ ok: false, error: 'Weekly meal plan data required' });
    }

    const selectedDay = weeklyPlan[selectedDayIndex] || weeklyPlan[0];
    const todaysMeals = selectedDay?.meals || [];

    const weekStats = weeklyPlan.reduce((acc, day) => {
      const dayTotals = day.dailyTotals || { calories: 0, protein: 0 };
      return {
        totalCalories: acc.totalCalories + dayTotals.calories,
        totalProtein: acc.totalProtein + dayTotals.protein,
      };
    }, { totalCalories: 0, totalProtein: 0 });

    const mealDescriptions = todaysMeals.map(meal => {
      const ingredients = meal.ingredients?.map(i => i.name).join(', ') || 'various ingredients';
      return `${meal.mealType}: ${meal.name} (${meal.calories} cal, ${meal.protein}g protein)`;
    }).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a friendly nutrition coach. Create a brief, conversational coaching script (45-60 seconds speaking time). Mention specific meals by name. Be warm and encouraging.`
        },
        {
          role: 'user',
          content: `Today's meals (${selectedDay?.dayName}):\n${mealDescriptions}\n\nDaily totals: ${selectedDay?.dailyTotals?.calories || 0} cal, ${selectedDay?.dailyTotals?.protein || 0}g protein\nUser goals: ${userGoals?.dailyCalories || 2000} cal, ${userGoals?.dailyProtein || 150}g protein`
        }
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    res.json({
      ok: true,
      script: completion.choices[0].message.content,
      streamingAvailable: false,
      metadata: {
        dayName: selectedDay?.dayName,
        mealCount: todaysMeals.length,
        dailyCalories: selectedDay?.dailyTotals?.calories,
      }
    });
  } catch (error) {
    console.error('[Avatar Meal Plan] Error:', error);
    res.status(500).json({ ok: false, error: error.message });
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
