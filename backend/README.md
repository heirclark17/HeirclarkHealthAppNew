# Heirclark Health App - Backend Server

Backend API server for meal logging with OpenAI GPT-4.1-mini integration.

## Features

- ✅ **Text Analysis**: Analyze meal descriptions using GPT-4.1-mini
- ✅ **Vision Analysis**: Analyze food photos using GPT-4.1-mini Vision API
- ✅ **Voice Transcription**: Transcribe voice recordings using Whisper API
- ✅ **CORS Enabled**: Works with React Native mobile app

## Requirements

- Node.js 18+ or 20+
- OpenAI API Key with GPT-4.1-mini access

## Setup

1. **Install Dependencies**

```bash
cd backend
npm install
```

2. **Configure Environment Variables**

Create `.env` file in the project root (parent directory):

```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. **Start Server**

```bash
npm start
```

Or with auto-restart on changes:

```bash
npm run dev
```

Server runs on: `http://localhost:3001`

## API Endpoints

### Health Check

```http
GET /api/v1/health
```

Returns server status and timestamp.

### Text-to-Nutrition Analysis

```http
POST /api/v1/nutrition/ai/meal-from-text
Content-Type: application/json

{
  "text": "grilled chicken breast with rice and broccoli",
  "shopifyCustomerId": "guest_ios_app"
}
```

**Response:**

```json
{
  "success": true,
  "analysis": {
    "mealName": "Grilled Chicken with Rice and Broccoli",
    "calories": 450,
    "protein": 35,
    "carbs": 50,
    "fat": 8,
    "confidence": "high",
    "foods": [...],
    "suggestions": [...]
  }
}
```

### Image-to-Nutrition Analysis

```http
POST /api/v1/nutrition/ai/meal-from-photo
Content-Type: multipart/form-data

photo: [image file]
shopifyCustomerId: guest_ios_app
```

**Response:** Same as text analysis

### Voice Transcription

```http
POST /api/v1/nutrition/ai/transcribe-voice
Content-Type: multipart/form-data

audio: [audio file]
shopifyCustomerId: guest_ios_app
```

**Response:**

```json
{
  "success": true,
  "text": "I ate grilled chicken with rice and broccoli"
}
```

## OpenAI Models Used

- **GPT-4.1-mini**: Text and vision analysis
- **Whisper-1**: Voice transcription

## Development

The server includes:

- Request logging for debugging
- CORS for mobile app access
- 50MB JSON payload limit
- 10MB file upload limit
- Comprehensive error handling

## Troubleshooting

### "OPENAI_API_KEY not configured"

Make sure `.env` file exists in the project root (not in backend folder) with your OpenAI API key.

### "Port 3001 already in use"

Change the PORT in `.env` or stop the conflicting process:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill
```

### "AI analysis failed"

Check:
1. OpenAI API key is valid
2. API key has access to GPT-4.1-mini model
3. API quota/billing is active

## Production Deployment

For Railway/Render/Heroku deployment:

1. Set `OPENAI_API_KEY` environment variable
2. The server will use `process.env.PORT` automatically
3. Update frontend `aiService.ts` to use production URL

## Security Notes

- API key is never exposed to frontend
- All AI requests proxied through backend
- CORS restricted to known origins in production
- File uploads sanitized and size-limited

## Cost Estimates

**GPT-4.1-mini Pricing:**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**Typical meal analysis:**
- ~200 tokens input
- ~300 tokens output
- **Cost: ~$0.0002 per analysis** ($0.20 per 1000 meals)

**Whisper Pricing:**
- $0.006 per minute

**Typical 10-second voice recording:**
- **Cost: ~$0.001 per transcription**

## Support

For issues, check console logs with:

```bash
npm start
```

All requests and errors are logged to console for debugging.
