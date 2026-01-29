# Meal Logging Feature - Complete Setup Guide

## Overview

The meal logging feature uses **OpenAI GPT-4.1-mini** for text and image analysis, and **Whisper** for voice transcription.

## ✅ Completed Implementation

### Backend Server (Node.js + Express)
- ✅ GPT-4.1-mini text analysis endpoint
- ✅ GPT-4.1-mini vision API for food photos
- ✅ Whisper API for voice transcription
- ✅ CORS enabled for mobile app
- ✅ Comprehensive error handling

### Frontend (React Native)
- ✅ 4 input methods: Text, Voice, Photo, Barcode
- ✅ Voice recording with Whisper transcription
- ✅ Photo analysis with vision AI
- ✅ Barcode scanning with Open Food Facts
- ✅ Automatic macro calculation
- ✅ Real-time calorie/macro updates on dashboard

---

## 🚀 Quick Start

### Step 1: Get OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy the key (starts with `sk-`)

### Step 2: Configure Environment

Edit `.env` file in project root:

```env
# Add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-key-here

# Backend will run on localhost (already configured)
EXPO_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Start Backend Server

```bash
cd backend
npm install
npm start
```

You should see:
```
🚀 Heirclark Health Backend running on http://localhost:3001
📊 AI Service: OpenAI GPT-4.1-mini with Vision + Whisper
🔑 API Key configured: Yes
```

### Step 4: Start Mobile App

```bash
# In main project directory
npm start
```

### Step 5: Test Meal Logging

1. Open app and expand "Today's Meals" card
2. Click "+ Log Meal"
3. Try each method:
   - **Text**: "grilled chicken breast with rice and broccoli"
   - **Voice**: Tap mic, speak meal description, tap to stop
   - **Photo**: Take photo of food
   - **Barcode**: Scan packaged food barcode

---

## 📱 Available Meal Logging Methods

### 1. Text Description (AI-Powered)
- Describe meal in natural language
- GPT-4.1-mini analyzes and calculates nutrition
- Example: "2 scrambled eggs, toast with butter, orange juice"

**Cost:** ~$0.0002 per analysis

### 2. Voice Recording (Whisper + AI)
- Tap mic and speak what you ate
- Whisper transcribes speech to text
- GPT-4.1-mini analyzes transcription
- Example: "I ate a chicken caesar salad for lunch"

**Cost:** ~$0.001 per transcription + ~$0.0002 for analysis

### 3. Photo Analysis (Vision AI)
- Take photo or upload from gallery
- GPT-4.1-mini vision identifies foods
- Estimates portions and calculates nutrition
- Works best with clear, well-lit photos

**Cost:** ~$0.0005 per image analysis

### 4. Barcode Scanning (Free)
- Scan packaged food barcode
- Looks up in Open Food Facts database
- Instant nutrition facts (no AI required)
- Free - no API costs

---

## 🔧 API Endpoints

### Health Check
```http
GET http://localhost:3001/api/v1/health
```

### Text Analysis
```http
POST http://localhost:3001/api/v1/nutrition/ai/meal-from-text
Content-Type: application/json

{
  "text": "grilled chicken with rice and broccoli",
  "shopifyCustomerId": "guest_ios_app"
}
```

### Photo Analysis
```http
POST http://localhost:3001/api/v1/nutrition/ai/meal-from-photo
Content-Type: multipart/form-data

photo: [image file]
shopifyCustomerId: guest_ios_app
```

### Voice Transcription
```http
POST http://localhost:3001/api/v1/nutrition/ai/transcribe-voice
Content-Type: multipart/form-data

audio: [audio file]
shopifyCustomerId: guest_ios_app
```

---

## 🧪 Testing the Feature

### Manual Testing Checklist

- [ ] Backend starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Text analysis: Describe "chicken salad" → Get nutrition data
- [ ] Voice recording: Record "I ate pizza" → Transcribe → Analyze
- [ ] Photo analysis: Upload food photo → Identify foods → Calculate
- [ ] Barcode scan: Scan product → Get nutrition from database
- [ ] Dashboard updates: Calories and macros reflect logged meals
- [ ] Multiple meals: Add breakfast, lunch, dinner → Totals accumulate

### Test Accounts & Data

**Test Barcodes:**
- Coca-Cola: `5449000000996`
- Snickers: `040000514893`
- Cheerios: `016000119178`

**Test Meals (Text):**
- "2 scrambled eggs with whole wheat toast"
- "Grilled chicken breast, brown rice, steamed broccoli"
- "Greek yogurt with granola and berries"

---

## 📊 Data Flow

```
User Input → Frontend (React Native)
  ↓
AI Service (aiService.ts)
  ↓
Backend Server (Express + OpenAI)
  ↓
OpenAI API (GPT-4.1-mini / Whisper)
  ↓
Backend Response (Nutrition Data)
  ↓
Frontend Saves Meal (api.logMeal)
  ↓
Railway Backend Database
  ↓
Dashboard Refreshes (fetchData)
  ↓
Gauges Update (Calories, Protein, Carbs, Fat)
```

---

## ⚙️ Configuration

### Frontend Configuration

**File:** `services/aiService.ts`
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
```

**File:** `.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

### Backend Configuration

**File:** `backend/server.js`
```javascript
const PORT = process.env.PORT || 3001;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**Models Used:**
- Text/Vision: `gpt-4.1-mini`
- Voice: `whisper-1`

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** "OPENAI_API_KEY environment variable is missing"

**Fix:** Add API key to `.env` file in project root

```env
OPENAI_API_KEY=sk-your-key-here
```

### "AI Unavailable" error

**Possible causes:**
1. Backend not running (start with `npm start`)
2. Wrong API URL (check `.env`)
3. Network connectivity issues
4. OpenAI API key invalid/expired

**Fix:** Check backend console for errors

### Voice recording not working

**Causes:**
- Microphone permission denied
- Simulator (use real device for mic/camera)
- Audio file format not supported

**Fix:**
1. Grant microphone permission in Settings
2. Test on physical device
3. Check backend logs for Whisper errors

### Photo analysis fails

**Causes:**
- Image too large (>10MB)
- Backend vision endpoint down
- Poor image quality

**Fix:**
1. Compress images before upload
2. Use well-lit, clear photos
3. Check backend logs

### Barcode scanner not working

**Causes:**
- Camera permission denied
- Simulator (camera doesn't work)
- Product not in Open Food Facts database

**Fix:**
1. Grant camera permission
2. Use real device
3. Try manual entry if barcode fails

---

## 💰 Cost Estimates

### OpenAI API Pricing (GPT-4.1-mini)

**Text Analysis:**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- Average meal: ~500 tokens
- **Cost: ~$0.0002 per analysis**

**Image Analysis:**
- Same pricing as text
- Images count as ~85 tokens per 512×512 tile
- Average photo: 1 tile + analysis
- **Cost: ~$0.0005 per photo**

**Voice Transcription (Whisper):**
- $0.006 per minute
- Average recording: 10-15 seconds
- **Cost: ~$0.001 per recording**

### Monthly Estimates

**Light User** (3 meals/day, mostly text):
- 90 text analyses: $0.018
- Total: **~$0.02/month**

**Regular User** (3 meals/day, mixed methods):
- 60 text analyses: $0.012
- 20 photos: $0.010
- 10 voice recordings: $0.010
- Total: **~$0.03/month**

**Heavy User** (5 meals/day, photos for everything):
- 150 photos: $0.075
- Total: **~$0.08/month**

**Barcode scans are FREE** (no OpenAI API usage)

---

## 📝 Developer Notes

### File Structure

```
HeirclarkHealthAppNew/
├── backend/                    # Backend server (NEW)
│   ├── server.js              # Express server with OpenAI
│   ├── package.json           # Dependencies
│   └── README.md              # Backend docs
├── services/
│   ├── aiService.ts           # AI integration (UPDATED)
│   └── api.ts                 # Railway API client
├── components/
│   └── AIMealLogger.tsx       # Meal logging UI (UPDATED)
├── app/(tabs)/
│   └── index.tsx              # Dashboard (uses logged meals)
└── .env                       # Environment variables (CONFIGURE THIS)
```

### Key Changes Made

1. **Created `backend/` directory** with Express server
2. **Updated `aiService.ts`** to use localhost:3001
3. **Implemented voice transcription** in AIMealLogger
4. **Added voice mode** back to UI (4 modes total)
5. **Switched all AI calls** from GPT-4o-mini to GPT-4.1-mini

### Next Steps (Optional Enhancements)

- [ ] Deploy backend to Railway/Render/Heroku
- [ ] Add image compression before upload
- [ ] Implement offline caching
- [ ] Add meal templates/favorites
- [ ] Multi-language support
- [ ] Nutrition goal recommendations
- [ ] Weekly meal insights/reports

---

## 📚 OpenAI Documentation

### GPT-4.1-mini
- [Model Overview](https://platform.openai.com/docs/models/gpt-4.1-mini)
- [Vision Capabilities](https://platform.openai.com/docs/guides/vision)
- [Chat Completions API](https://platform.openai.com/docs/api-reference/chat)

### Whisper
- [Speech to Text](https://platform.openai.com/docs/guides/speech-to-text)
- [Audio API Reference](https://platform.openai.com/docs/api-reference/audio)

### Pricing
- [Current Pricing](https://openai.com/api/pricing/)
- [Usage Tracking](https://platform.openai.com/usage)

---

## ✅ Feature Verification

All issues resolved:

- ✅ Quick Entry mode removed (as requested)
- ✅ GPT-4.1-mini implemented (not GPT-4o-mini)
- ✅ Vision API using GPT-4.1-mini for food photos
- ✅ Voice feature fully implemented with Whisper
- ✅ Backend server created and configured
- ✅ All 4 input methods ready to test
- ✅ Comprehensive documentation provided

---

## 🆘 Support

If you encounter issues:

1. Check backend console logs (`npm start` in backend/)
2. Check mobile app console (Expo DevTools)
3. Verify OpenAI API key is valid and has credits
4. Test backend endpoints with Postman/cURL
5. Review this documentation for troubleshooting steps

**Backend logs show:**
- Incoming requests
- AI analysis results
- Errors with full details

**Frontend logs show:**
- API calls
- Analysis results
- User interactions

---

**Last Updated:** January 19, 2026
**Status:** Ready for testing with OpenAI API key
