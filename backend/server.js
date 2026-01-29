// Heirclark Health App - Local Backend Server
// OpenAI Integration for Meal Logging (GPT-4.1-mini)

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Heirclark Health App Backend - Running',
    timestamp: new Date().toISOString(),
  });
});

// Text-to-Nutrition Analysis (GPT-4.1-mini)
app.post('/api/v1/nutrition/ai/meal-from-text', async (req, res) => {
  try {
    const { text, shopifyCustomerId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text description required' });
    }

    console.log(`[Text Analysis] Request from ${shopifyCustomerId}: "${text}"`);

    // Call OpenAI GPT-4.1-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert. Analyze meal descriptions and provide detailed nutritional information.
          Return a JSON object with: mealName, calories, protein (g), carbs (g), fat (g), confidence (low/medium/high),
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

    console.log('[Text Analysis] Result:', analysis);

    res.json({
      success: true,
      analysis: {
        mealName: analysis.mealName || analysis.name || 'Meal',
        calories: parseInt(analysis.calories) || 0,
        protein: parseInt(analysis.protein) || 0,
        carbs: parseInt(analysis.carbs) || 0,
        fat: parseInt(analysis.fat) || 0,
        confidence: analysis.confidence || 'medium',
        foods: analysis.foods || [],
        suggestions: analysis.suggestions || [],
      },
    });
  } catch (error) {
    console.error('[Text Analysis] Error:', error);
    res.status(500).json({
      error: 'AI analysis failed',
      message: error.message,
    });
  }
});

// Image-to-Nutrition Analysis (GPT-4.1-mini with Vision)
app.post('/api/v1/nutrition/ai/meal-from-photo', upload.single('photo'), async (req, res) => {
  try {
    const { shopifyCustomerId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Photo required' });
    }

    console.log(`[Image Analysis] Request from ${shopifyCustomerId}, file size: ${req.file.size} bytes`);

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    // Call OpenAI GPT-4.1-mini with Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert analyzing food images. Identify all foods visible, estimate portions,
          and calculate nutritional information. Return a JSON object with: mealName, calories, protein (g), carbs (g),
          fat (g), confidence (low/medium/high), foods array with [{name, portion, calories, protein, carbs, fat}],
          and suggestions array. Be conservative with estimates if portions are unclear.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this meal photo and provide detailed nutritional information for all visible foods.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    console.log('[Image Analysis] Result:', analysis);

    res.json({
      success: true,
      analysis: {
        mealName: analysis.mealName || analysis.name || 'Meal',
        calories: parseInt(analysis.calories) || 0,
        protein: parseInt(analysis.protein) || 0,
        carbs: parseInt(analysis.carbs) || 0,
        fat: parseInt(analysis.fat) || 0,
        confidence: analysis.confidence || 'medium',
        foods: analysis.foods || [],
        suggestions: analysis.suggestions || [],
      },
    });
  } catch (error) {
    console.error('[Image Analysis] Error:', error);
    res.status(500).json({
      error: 'AI image analysis failed',
      message: error.message,
    });
  }
});

// Voice-to-Text Transcription (OpenAI Whisper)
app.post('/api/v1/nutrition/ai/transcribe-voice', upload.single('audio'), async (req, res) => {
  try {
    const { shopifyCustomerId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    console.log(`[Voice Transcription] Request from ${shopifyCustomerId}, file size: ${req.file.size} bytes`);

    // Create a File object from buffer
    const audioFile = new File([req.file.buffer], 'audio.m4a', { type: req.file.mimetype });

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    console.log('[Voice Transcription] Result:', transcription.text);

    res.json({
      success: true,
      text: transcription.text,
    });
  } catch (error) {
    console.error('[Voice Transcription] Error:', error);
    res.status(500).json({
      error: 'Voice transcription failed',
      message: error.message,
    });
  }
});

// ============================================
// MEAL PLAN AI COACHING ENDPOINT
// Generates personalized coaching scripts for 7-day meal plans
// ============================================

app.post('/api/v1/avatar/coach/meal-plan', async (req, res) => {
  try {
    const { userId, weeklyPlan, selectedDayIndex, userGoals, preferences } = req.body;

    if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
      return res.status(400).json({
        ok: false,
        error: 'Weekly meal plan data required'
      });
    }

    console.log(`[Meal Plan Coaching] Request from ${userId}, day ${selectedDayIndex}`);

    // Get the selected day's plan
    const selectedDay = weeklyPlan[selectedDayIndex] || weeklyPlan[0];
    const todaysMeals = selectedDay?.meals || [];

    // Calculate week stats
    const weekStats = weeklyPlan.reduce((acc, day) => {
      const dayTotals = day.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      return {
        totalCalories: acc.totalCalories + dayTotals.calories,
        totalProtein: acc.totalProtein + dayTotals.protein,
        totalCarbs: acc.totalCarbs + dayTotals.carbs,
        totalFat: acc.totalFat + dayTotals.fat,
      };
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });

    const avgCalories = Math.round(weekStats.totalCalories / 7);
    const avgProtein = Math.round(weekStats.totalProtein / 7);

    // Build detailed meal descriptions
    const mealDescriptions = todaysMeals.map(meal => {
      const ingredients = meal.ingredients?.map(i => i.name).join(', ') || 'various ingredients';
      return `${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}: ${meal.name} (${meal.calories} cal, ${meal.protein}g protein) - made with ${ingredients}`;
    }).join('\n');

    // Create the AI prompt for personalized coaching
    const systemPrompt = `You are a friendly, knowledgeable nutrition coach having a personal conversation with a user about their meal plan.

Your speaking style should be:
- Warm and encouraging like a supportive friend
- Conversational and natural (avoid bullet points or lists when speaking)
- Specific to THEIR meals (mention actual meal names and ingredients)
- Brief but informative (aim for 45-60 seconds of speaking time)
- End with motivation or a helpful tip

Do NOT:
- Use generic phrases like "your meal plan looks great"
- List things in bullet format
- Be overly formal or clinical
- Exceed 200 words`;

    const userPrompt = `Generate a personalized coaching script for this user's meal plan.

TODAY'S MEALS (${selectedDay?.dayName || 'Today'}):
${mealDescriptions}

Daily totals: ${selectedDay?.dailyTotals?.calories || 0} calories, ${selectedDay?.dailyTotals?.protein || 0}g protein, ${selectedDay?.dailyTotals?.carbs || 0}g carbs, ${selectedDay?.dailyTotals?.fat || 0}g fat

USER'S GOALS:
- Daily calorie target: ${userGoals?.dailyCalories || 2000} calories
- Daily protein target: ${userGoals?.dailyProtein || 150}g
- Diet style: ${preferences?.dietStyle || 'standard'}

WEEK AVERAGES:
- Average daily calories: ${avgCalories}
- Average daily protein: ${avgProtein}g

Create a conversational coaching script that:
1. Greets them warmly and acknowledges the specific day
2. Discusses 1-2 specific meals by name, highlighting something positive about ingredients or nutrition
3. Mentions how today fits their calorie/protein goals
4. Gives one practical tip (prep tip, timing suggestion, or ingredient swap)
5. Ends with brief encouragement

Keep it natural and conversational - this will be spoken by an AI avatar.`;

    // Call OpenAI to generate the personalized script
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const script = completion.choices[0].message.content;

    console.log('[Meal Plan Coaching] Generated script:', script.substring(0, 100) + '...');

    // Return the script (streaming session would be added by Railway backend)
    res.json({
      ok: true,
      streamingAvailable: false, // Local backend doesn't have HeyGen integration
      script: script,
      message: 'Coaching script generated successfully',
      metadata: {
        dayName: selectedDay?.dayName,
        mealCount: todaysMeals.length,
        dailyCalories: selectedDay?.dailyTotals?.calories,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('[Meal Plan Coaching] Error:', error);
    res.status(500).json({
      ok: false,
      streamingAvailable: false,
      script: '',
      error: error.message || 'Failed to generate coaching script',
    });
  }
});

// ============================================
// ADAPTIVE TDEE AGENT ENDPOINT
// Calculates personalized TDEE from weight and calorie data
// ============================================

app.post('/api/v1/agents/tdee/calculate', async (req, res) => {
  try {
    const { weightHistory, calorieHistory, userProfile } = req.body;

    if (!weightHistory || !calorieHistory || !userProfile) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required data: weightHistory, calorieHistory, and userProfile are required'
      });
    }

    console.log(`[Adaptive TDEE] Calculation request - ${weightHistory.length} weight logs, ${calorieHistory.length} calorie logs`);

    // Constants
    const CALORIES_PER_POUND = 3500;
    const MIN_DAYS = 14;
    const SMOOTHING_FACTOR = 0.3;

    // Helper: Calculate formula-based TDEE (Mifflin-St Jeor)
    const calculateFormulaTDEE = (weightKg, heightCm, age, sex, activityLevel) => {
      let bmr;
      if (sex === 'male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
      } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      }

      const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      };

      return Math.round(bmr * (multipliers[activityLevel] || 1.55));
    };

    // Helper: Group by week
    const getWeekKey = (dateStr) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day;
      const sunday = new Date(d.setDate(diff));
      return sunday.toISOString().split('T')[0];
    };

    // Group data by week
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

    // Calculate weekly TDEE data points
    const sortedWeeks = [...weeks.keys()].sort();
    const dataPoints = [];
    let previousAvgWeight = null;

    sortedWeeks.forEach(weekKey => {
      const week = weeks.get(weekKey);

      if (week.weights.length < 3 || week.calories.length < 3) return;

      // Average weight (convert to lbs if needed)
      const totalWeight = week.weights.reduce((sum, log) => {
        const w = log.unit === 'kg' ? log.weight * 2.20462 : log.weight;
        return sum + w;
      }, 0);
      const avgWeight = totalWeight / week.weights.length;

      // Average calories
      const totalCalories = week.calories.reduce((sum, log) => sum + log.caloriesConsumed, 0);
      const avgCalories = totalCalories / week.calories.length;

      // Calculate TDEE from energy balance
      if (previousAvgWeight !== null) {
        const weightChange = avgWeight - previousAvgWeight;
        const weeklyCalorieChange = weightChange * CALORIES_PER_POUND;
        const dailyTDEE = avgCalories - (weeklyCalorieChange / 7);

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

    // Calculate smoothed adaptive TDEE
    let adaptiveTDEE = 0;
    if (dataPoints.length > 0) {
      adaptiveTDEE = dataPoints[0].calculatedTDEE;
      for (let i = 1; i < dataPoints.length; i++) {
        adaptiveTDEE = SMOOTHING_FACTOR * dataPoints[i].calculatedTDEE + (1 - SMOOTHING_FACTOR) * adaptiveTDEE;
      }
      adaptiveTDEE = Math.round(adaptiveTDEE);
    }

    // Calculate formula TDEE for comparison
    const latestWeight = weightHistory.length > 0
      ? (weightHistory[0].unit === 'kg' ? weightHistory[0].weight : weightHistory[0].weight * 0.453592)
      : 80;

    const formulaTDEE = calculateFormulaTDEE(
      latestWeight,
      userProfile.heightCm,
      userProfile.age,
      userProfile.sex,
      userProfile.activityLevel
    );

    // If not enough data, use formula
    if (dataPoints.length < 2) {
      adaptiveTDEE = formulaTDEE;
    }

    // Calculate confidence
    let confidenceScore = 0;
    if (dataPoints.length >= 8) confidenceScore += 40;
    else if (dataPoints.length >= 4) confidenceScore += 30;
    else if (dataPoints.length >= 2) confidenceScore += 20;
    else confidenceScore += 10;

    // Consistency bonus
    if (dataPoints.length >= 2) {
      const tdeeValues = dataPoints.map(dp => dp.calculatedTDEE);
      const avg = tdeeValues.reduce((a, b) => a + b, 0) / tdeeValues.length;
      const variance = tdeeValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / tdeeValues.length;
      const cv = Math.sqrt(variance) / avg;

      if (cv < 0.05) confidenceScore += 30;
      else if (cv < 0.10) confidenceScore += 25;
      else if (cv < 0.15) confidenceScore += 20;
      else confidenceScore += 10;
    }

    // Data days bonus
    const uniqueDays = new Set([
      ...weightHistory.map(w => w.date),
      ...calorieHistory.map(c => c.date)
    ]).size;

    if (uniqueDays >= 28) confidenceScore += 30;
    else if (uniqueDays >= 21) confidenceScore += 25;
    else if (uniqueDays >= 14) confidenceScore += 20;
    else confidenceScore += 10;

    let confidence = 'low';
    if (confidenceScore >= 80) confidence = 'high';
    else if (confidenceScore >= 50) confidence = 'medium';

    // Calculate differences
    const difference = adaptiveTDEE - formulaTDEE;
    const differencePercent = Math.round((difference / formulaTDEE) * 100);

    // Metabolism trend
    let metabolismTrend = 'normal';
    if (differencePercent > 8) metabolismTrend = 'faster';
    else if (differencePercent < -8) metabolismTrend = 'slower';

    // Calculate recommended calories
    let targetWeeklyChange = 0;
    if (userProfile.goalType === 'lose') targetWeeklyChange = -1;
    else if (userProfile.goalType === 'gain') targetWeeklyChange = 0.5;

    const dailyAdjustment = (targetWeeklyChange * CALORIES_PER_POUND) / 7;
    let recommendedCalories = Math.max(1200, Math.round(adaptiveTDEE + dailyAdjustment));

    // Generate insights
    const insights = [];

    if (differencePercent > 8) {
      insights.push(`Your metabolism is ${differencePercent}% higher than predicted. This is advantageous for ${userProfile.goalType === 'lose' ? 'fat loss' : 'your goals'}!`);
    } else if (differencePercent < -8) {
      insights.push(`Your metabolism is ${Math.abs(differencePercent)}% lower than predicted. We've adjusted your targets accordingly.`);
    } else {
      insights.push(`Your metabolism closely matches predictions (within ${Math.abs(differencePercent)}%).`);
    }

    if (dataPoints.length < 4) {
      insights.push(`After ${4 - dataPoints.length} more weeks of data, predictions will become more accurate.`);
    }

    if (userProfile.goalType === 'lose') {
      const weeklyLoss = 500 * 7 / CALORIES_PER_POUND;
      insights.push(`At ${recommendedCalories} calories daily, expect ~${weeklyLoss.toFixed(1)} lb/week loss.`);
    }

    const now = new Date();
    const nextRecalc = new Date();
    nextRecalc.setDate(nextRecalc.getDate() + 7);

    const result = {
      adaptiveTDEE,
      formulaTDEE,
      difference,
      differencePercent,
      confidence,
      confidenceScore,
      dataPoints: dataPoints.length,
      recommendedCalories,
      adjustmentFromFormula: recommendedCalories - (formulaTDEE + dailyAdjustment),
      metabolismTrend,
      insights,
      weeklyHistory: dataPoints.slice(-8),
      lastCalculated: now.toISOString(),
      nextRecalculationDate: nextRecalc.toISOString(),
    };

    console.log('[Adaptive TDEE] Result:', {
      adaptiveTDEE: result.adaptiveTDEE,
      formulaTDEE: result.formulaTDEE,
      confidence: result.confidence,
      dataPoints: result.dataPoints,
    });

    res.json({
      ok: true,
      result,
      message: 'Adaptive TDEE calculated successfully',
    });

  } catch (error) {
    console.error('[Adaptive TDEE] Error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to calculate adaptive TDEE',
    });
  }
});

// Get TDEE insights using AI
app.post('/api/v1/agents/tdee/insights', async (req, res) => {
  try {
    const { tdeeResult, userProfile, recentChanges } = req.body;

    if (!tdeeResult) {
      return res.status(400).json({ ok: false, error: 'TDEE result required' });
    }

    console.log('[TDEE Insights] Generating AI insights');

    const systemPrompt = `You are a knowledgeable nutrition coach analyzing a user's metabolic data.
Provide personalized, encouraging insights based on their adaptive TDEE calculation.
Keep responses concise (2-3 sentences per insight). Be specific to their numbers.
Avoid generic advice - reference their actual TDEE, trends, and goals.`;

    const userPrompt = `Analyze this user's metabolic data and provide 3 personalized insights:

TDEE Data:
- Adaptive TDEE: ${tdeeResult.adaptiveTDEE} cal/day
- Formula TDEE: ${tdeeResult.formulaTDEE} cal/day
- Difference: ${tdeeResult.difference} cal (${tdeeResult.differencePercent}%)
- Metabolism Trend: ${tdeeResult.metabolismTrend}
- Confidence: ${tdeeResult.confidence} (${tdeeResult.confidenceScore}%)
- Weeks of data: ${tdeeResult.dataPoints}

User Profile:
- Goal: ${userProfile.goalType}
- Activity Level: ${userProfile.activityLevel}
- Recommended Intake: ${tdeeResult.recommendedCalories} cal/day

Generate 3 specific, actionable insights for this user.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiInsights = completion.choices[0].message.content;

    res.json({
      ok: true,
      insights: aiInsights,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[TDEE Insights] Error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to generate insights',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Heirclark Health Backend running on http://localhost:${PORT}`);
  console.log(`📊 AI Service: OpenAI GPT-4.1-mini with Vision + Whisper`);
  console.log(`🤖 Meal Plan Coaching: Enabled`);
  console.log(`🔥 Adaptive TDEE Agent: Enabled`);
  console.log(`🔑 API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});

module.exports = app;
