# Heirclark Health App

Premium iOS health and nutrition tracking app with AI-powered meal logging.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or physical iOS device
- Python 3.8+ (for diagnostics)

### Installation

```bash
# Install dependencies
npm install

# Install Expo CLI globally
npm install -g expo-cli

# Start development server
npx expo start
```

### API Keys Setup

1. Copy `.env.example` to `.env`
2. Add your API keys:

```bash
# OpenAI (for meal analysis)
OPENAI_API_KEY=your-openai-key-here

# OpenWeatherMap (for weather)
OPENWEATHERMAP_API_KEY=your-openweather-key-here
```

**Get API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- Weather: https://openweathermap.org/api

---

## ✨ Features

### 1. AI Meal Logging (4 Methods)
- **Manual Entry**: Type meal description, AI calculates nutrition
- **Voice**: Speak what you ate, AI analyzes
- **Photo**: Take/upload meal photo, AI vision identifies foods
- **Barcode**: Scan packaged foods, get verified nutrition data

### 2. Apple Health Integration
- Sync steps, calories, distance
- Real-time health data
- Multiple provider support (Fitbit, Google Fit)

### 3. Weather Integration
- Current conditions with location
- Temperature-based health tips
- Humidity, wind, rain chance

### 4. Nutrition Tracking
- Daily calorie balance
- Macro tracking (Protein, Fat, Carbs)
- Weekly progress charts
- Meal history

---

## 📱 Running on iOS

### Simulator
```bash
npx expo start
# Press 'i' for iOS simulator
```

### Physical Device (Required for Apple Health)
```bash
npx expo run:ios --device
```

---

## 🧪 Testing

### Run Comprehensive Diagnostics
```bash
# Start Expo server first
npx expo start

# In another terminal, run diagnostics
python comprehensive_diagnostic.py
```

This will:
- Test all 18 app features
- Capture screenshots to `diagnostics/` folder
- Verify UI improvements
- Check API integrations

---

## 📁 Project Structure

```
HeirclarkHealthAppNew/
├── app/                    # Screens & navigation
│   ├── _layout.tsx        # Root layout
│   └── (tabs)/            # Tab navigation
│       ├── index.tsx      # Dashboard
│       ├── goals.tsx      # Goals setup
│       ├── meals.tsx      # Meals screen
│       └── settings.tsx   # Settings
├── components/            # Reusable components
│   ├── AIMealLogger.tsx   # AI meal logging modal
│   ├── WeatherWidget.tsx  # Weather display
│   ├── WearableSyncCard.tsx # Apple Health sync
│   └── [other components]
├── services/              # API & service layers
│   ├── aiService.ts       # OpenAI integration
│   ├── weatherService.ts  # Weather API
│   ├── appleHealthService.ts # Apple Health SDK
│   └── api.ts             # Backend API
├── constants/             # Theme & design tokens
│   └── Theme.ts           # Colors, fonts, spacing
└── assets/                # Images & icons
```

---

## 🎨 Design System

### Colors (Black & White Only)
```typescript
background: #000000
card: #1a1a1a
text: #ffffff
textMuted: #888888
border: #1a1a1a
```

### Typography
- Font: Urbanist (300-700 weights)
- iOS Standard Sizes: 11pt - 34pt
- 8-point grid system

### Components
- Glass morphism effects
- Collapsible cards
- Semi-circular gauges
- iOS-style animations

---

## 🔐 Permissions

### iOS (app.json)
- Health data (steps, calories, weight)
- Camera (meal photos)
- Microphone (voice logging)
- Photo library (meal photos)
- Location (weather)

### Android
- Camera, microphone, storage
- Location (GPS & network)
- Activity recognition (Google Fit)

All permissions requested at first use with clear explanations.

---

## 🌐 Backend API

**Railway Deployment:**
- URL: https://heirclarkinstacartbackend-production.up.railway.app
- GitHub: https://github.com/heirclark17/HeirclarkInstacartBackend

**Endpoints:**
- `POST /api/v1/meals` - Log meals
- `GET /api/v1/meals?date=YYYY-MM-DD` - Get meals
- `POST /api/v1/health/ingest` - Submit health data
- `GET /api/v1/health/metrics` - Get today's metrics

---

## 📚 Documentation

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Detailed feature documentation
- [.env.example](./.env.example) - Environment variables template
- [app.json](./app.json) - App configuration

---

## 🐛 Troubleshooting

### Weather Not Loading
- Check API key in `.env`
- Ensure location permission granted
- Check OpenWeatherMap API limits (1,000/day free)

### Apple Health Not Syncing
- Only works on physical iOS devices
- Check Health app permissions in iOS Settings
- Grant "Read" access for steps, calories, distance

### AI Meal Analysis Failing
- Verify OpenAI API key in `.env`
- Check API quota (usage-based pricing)
- Ensure internet connection

### Barcode Scanner Not Working
- Grant camera permission
- Use well-lit environment
- Try manual entry if product not found

---

## 🚢 Deployment

### Build iOS App
```bash
# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios
```

### Publish Updates
```bash
eas update --branch production
```

---

## 📊 Performance

- **App Size**: ~50MB
- **Startup Time**: <2s on iPhone 12+
- **API Latency**:
  - OpenAI: 2-5s (meal analysis)
  - Weather: <1s
  - Backend: <500ms
- **Battery Impact**: Low (background sync disabled)

---

## 🤝 Contributing

This is a private project for Heirclark. For questions or support, contact:

**Developer**: Justin Washington
**Email**: justinwashington@gmail.com

---

## 📄 License

Proprietary - All rights reserved by Heirclark

---

## 🎉 Version History

### v1.0.0 (January 2026)
- ✅ Complete AI meal logging system
- ✅ Apple Health integration
- ✅ Weather integration
- ✅ iOS HIG compliance
- ✅ Comprehensive testing suite

---

**Built with**: React Native, Expo, TypeScript, OpenAI
**Last Updated**: January 19, 2026
