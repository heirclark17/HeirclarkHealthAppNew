// Test version of backend with mock AI responses
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Heirclark Health App Backend - Test Mode',
    timestamp: new Date().toISOString(),
  });
});

// Mock Text-to-Nutrition Analysis
app.post('/api/v1/nutrition/ai/meal-from-text', async (req, res) => {
  try {
    const { text, shopifyCustomerId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text description required' });
    }

    console.log(`[Test Mode] Text Analysis: "${text}" from ${shopifyCustomerId}`);

    // Mock AI response
    const mockAnalysis = {
      mealName: `Mock Analysis: ${text}`,
      calories: 450,
      protein: 35,
      carbs: 45,
      fat: 12,
      confidence: 'high',
      foods: [
        {
          name: 'Grilled Chicken',
          portion: '6 oz',
          calories: 280,
          protein: 30,
          carbs: 0,
          fat: 8
        },
        {
          name: 'Brown Rice',
          portion: '1 cup',
          calories: 170,
          protein: 5,
          carbs: 45,
          fat: 4
        }
      ],
      suggestions: ['Good protein source', 'Consider adding vegetables']
    };

    res.json({
      success: true,
      analysis: mockAnalysis,
      testMode: true
    });
  } catch (error) {
    console.error('[Test Mode] Text Analysis Error:', error);
    res.status(500).json({
      error: 'AI analysis failed',
      message: error.message,
    });
  }
});

// Mock Image-to-Nutrition Analysis
app.post('/api/v1/nutrition/ai/meal-from-photo', upload.single('photo'), async (req, res) => {
  try {
    const { shopifyCustomerId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Photo required' });
    }

    console.log(`[Test Mode] Image Analysis: ${req.file.size} bytes from ${shopifyCustomerId}`);

    // Mock AI response
    const mockAnalysis = {
      mealName: 'Grilled Chicken with Vegetables (from photo)',
      calories: 380,
      protein: 42,
      carbs: 28,
      fat: 10,
      confidence: 'medium',
      foods: [
        {
          name: 'Grilled Chicken Breast',
          portion: '8 oz',
          calories: 280,
          protein: 35,
          carbs: 0,
          fat: 8
        },
        {
          name: 'Mixed Vegetables',
          portion: '1.5 cups',
          calories: 100,
          protein: 7,
          carbs: 28,
          fat: 2
        }
      ],
      suggestions: ['Well-balanced meal', 'Good portion sizes visible']
    };

    res.json({
      success: true,
      analysis: mockAnalysis,
      testMode: true
    });
  } catch (error) {
    console.error('[Test Mode] Image Analysis Error:', error);
    res.status(500).json({
      error: 'AI image analysis failed',
      message: error.message,
    });
  }
});

// Mock Voice-to-Text Transcription
app.post('/api/v1/nutrition/ai/transcribe-voice', upload.single('audio'), async (req, res) => {
  try {
    const { shopifyCustomerId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    console.log(`[Test Mode] Voice Transcription: ${req.file.size} bytes from ${shopifyCustomerId}`);

    // Mock transcription
    const mockTranscription = 'I ate grilled chicken with brown rice and broccoli';

    res.json({
      success: true,
      text: mockTranscription,
      testMode: true
    });
  } catch (error) {
    console.error('[Test Mode] Voice Transcription Error:', error);
    res.status(500).json({
      error: 'Voice transcription failed',
      message: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 TEST MODE - Heirclark Health Backend running on http://localhost:${PORT}`);
  console.log(`📊 AI Service: Mock responses (no OpenAI key required)`);
  console.log(`✅ Ready for Playwright testing`);
});

module.exports = app;
