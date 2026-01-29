# Meal Logger Architecture & Data Flow

Visual documentation of the meal logging system architecture.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Heirclark Health App                         │
│                  (React Native + Expo)                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   AIMealLogger.tsx    │
                    │   (Modal Component)   │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼─────┐         ┌──────▼──────┐        ┌──────▼──────┐
   │   Text   │         │    Photo    │        │   Barcode   │
   │   Mode   │         │    Mode     │        │    Mode     │
   └────┬─────┘         └──────┬──────┘        └──────┬──────┘
        │                      │                       │
        │              ┌───────┴────────┐              │
        │              │                │              │
        │         ┌────▼─────┐    ┌────▼─────┐        │
        │         │  Camera  │    │ Gallery  │        │
        │         │  Capture │    │  Picker  │        │
        │         └────┬─────┘    └────┬─────┘        │
        │              │                │              │
        │              └───────┬────────┘              │
        │                      │                       │
        └──────────────────────┼───────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   aiService.ts      │
                    │  (API Client)       │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼─────┐         ┌─────▼──────┐       ┌──────▼──────┐
   │ Backend  │         │  Backend   │       │ Open Food   │
   │ AI Text  │         │ AI Photo   │       │   Facts     │
   │ Analysis │         │  Analysis  │       │     API     │
   └────┬─────┘         └─────┬──────┘       └──────┬──────┘
        │                     │                      │
        └──────────────────────┼──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  NutritionAnalysis  │
                    │    (Data Model)     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │      api.ts         │
                    │  (Backend Client)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Railway Backend    │
                    │   /api/v1/meals     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Odoo Database     │
                    │   (Meal Storage)    │
                    └─────────────────────┘
```

---

## Component Hierarchy

```
AIMealLogger (Modal)
├── Header
│   ├── Close Button
│   └── Title: "Log Meal"
│
├── ScrollView
│   │
│   ├── Mode Selection (mode === 'select')
│   │   ├── Text Description Card
│   │   ├── Photo Card
│   │   └── Barcode Card
│   │
│   ├── Text Mode (mode === 'manual')
│   │   ├── TextInput (multiline)
│   │   ├── "Analyze with AI" Button
│   │   └── Loading Spinner (when analyzing)
│   │
│   ├── Photo Mode (mode === 'photo')
│   │   ├── Camera View (if cameraActive)
│   │   │   ├── CameraView Component
│   │   │   ├── Capture Button
│   │   │   └── Cancel Button
│   │   │
│   │   └── Photo Options (if !cameraActive)
│   │       ├── Photo Preview (if photoUri exists)
│   │       ├── "Take Photo" Button
│   │       ├── "Choose Photo" Button
│   │       └── Analyzing Spinner
│   │
│   ├── Barcode Mode (mode === 'barcode')
│   │   ├── Scanner View (if scannerActive)
│   │   │   ├── CameraView with barcode scanning
│   │   │   ├── Scanner Frame Overlay
│   │   │   └── Cancel Button
│   │   │
│   │   └── Manual Entry (if !scannerActive)
│   │       ├── Barcode Input (numeric)
│   │       ├── "Scan Barcode" Button
│   │       ├── "Lookup" Button
│   │       └── Analyzing Spinner
│   │
│   ├── Analysis Results (if analysis exists)
│   │   ├── Meal Name
│   │   ├── Confidence Level
│   │   ├── Macro Summary
│   │   │   ├── Calories
│   │   │   ├── Protein
│   │   │   ├── Carbs
│   │   │   └── Fat
│   │   │
│   │   └── Food List (if available)
│   │       └── Individual Food Items
│   │
│   ├── Meal Type Selector (if analysis exists)
│   │   ├── Breakfast
│   │   ├── Lunch
│   │   ├── Dinner
│   │   └── Snack
│   │
│   ├── Save Button (if analysis exists)
│   │   └── "Save Meal" (with loading state)
│   │
│   └── Back Button (if mode !== 'select')
│
└── KeyboardAvoidingView (iOS only)
```

---

## Data Flow Diagrams

### Text Description Flow

```
User Input
    │
    ▼
"2 scrambled eggs, toast, coffee"
    │
    ▼
[Analyze with AI] Button Click
    │
    ▼
handleManualAnalyze()
    │
    ▼
aiService.analyzeMealText(text)
    │
    ▼
POST /api/v1/nutrition/ai/meal-from-text
Headers: { X-Shopify-Customer-Id: guest_ios_app }
Body: { text: "...", shopifyCustomerId: "..." }
    │
    ▼
Backend AI Service (Railway)
    │
    ▼
AI Analysis (OpenAI, etc.)
    │
    ▼
Response JSON:
{
  analysis: {
    mealName: "Scrambled Eggs Breakfast",
    calories: 450,
    protein: 18,
    carbs: 35,
    fat: 22,
    confidence: "high",
    foods: [...]
  }
}
    │
    ▼
Transform to NutritionAnalysis
    │
    ▼
setAnalysis(result)
    │
    ▼
Display Results in UI
    │
    ▼
User selects meal type
    │
    ▼
[Save Meal] Button Click
    │
    ▼
handleSaveMeal()
    │
    ▼
api.logMeal(mealData)
    │
    ▼
POST /api/v1/meals
Body: {
  date: "2026-01-19",
  mealType: "breakfast",
  name: "Scrambled Eggs Breakfast",
  calories: 450,
  protein: 18,
  carbs: 35,
  fat: 22,
  time: "2026-01-19T08:30:00Z",
  shopifyCustomerId: "guest_ios_app"
}
    │
    ▼
Backend saves to Odoo
    │
    ▼
Success Response
    │
    ▼
Modal closes, refresh daily view
```

---

### Photo Analysis Flow

```
User Action
    │
    ├─── [Take Photo] ──────────┐
    │                           │
    │                           ▼
    │                   Request Camera Permission
    │                           │
    │                           ▼
    │                   setCameraActive(true)
    │                           │
    │                           ▼
    │                   CameraView Renders
    │                           │
    │                           ▼
    │                   User taps Capture
    │                           │
    │                           ▼
    │           cameraRef.current.takePictureAsync()
    │                           │
    │                           └──────┐
    │                                  │
    └─── [Choose Photo] ───────┐      │
                                │      │
                                ▼      ▼
                    ImagePicker.launchImageLibraryAsync()
                                │
                                ▼
                        Photo URI obtained
                                │
                                ▼
                    FileSystem.readAsStringAsync()
                    (Convert to Base64)
                                │
                                ▼
                        Base64 String
                                │
                                ▼
                aiService.analyzeMealPhoto(base64)
                                │
                                ▼
            POST /api/v1/nutrition/ai/meal-from-photo
            Headers: { X-Shopify-Customer-Id: ... }
            Body: FormData {
              photo: Blob,
              shopifyCustomerId: "..."
            }
                                │
                                ▼
                Backend AI Vision Analysis
                                │
                                ▼
                Response with nutrition data
                                │
                                ▼
                        Display Results
                                │
                                ▼
                            Save Meal
```

---

### Barcode Lookup Flow

```
User Action
    │
    ├─── [Scan Barcode] ────────┐
    │                            │
    │                            ▼
    │                Request Camera Permission
    │                            │
    │                            ▼
    │                setScannerActive(true)
    │                            │
    │                            ▼
    │            CameraView with barcodeScannerSettings
    │                            │
    │                            ▼
    │            Barcode detected: "5449000000996"
    │                            │
    │                            ▼
    │                handleBarcodeScan(result)
    │                            │
    │                            └──────┐
    │                                   │
    └─── [Manual Entry] ───────┐       │
                                │       │
                                ▼       ▼
                    User enters barcode number
                                │
                                ▼
                    lookupBarcode(code)
                                │
                                ▼
        GET https://world.openfoodfacts.org/api/v0/product/{code}.json
                                │
                                ▼
        Open Food Facts Database
                                │
                                ▼
        Response JSON:
        {
          status: 1,
          product: {
            product_name: "Coca-Cola",
            nutriments: {
              energy-kcal_100g: 42,
              proteins_100g: 0,
              carbohydrates_100g: 10.6,
              fat_100g: 0
            },
            serving_quantity: 355
          }
        }
                                │
                                ▼
        Convert per-100g to per-serving
                                │
                                ▼
        Transform to NutritionAnalysis
                                │
                                ▼
                    Display Product Info
                                │
                                ▼
                        Save Meal
```

---

## State Management

### Component State

```typescript
// Mode tracking
mode: 'select' | 'manual' | 'photo' | 'barcode'
mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'

// Text mode
manualText: string
analyzing: boolean

// Photo mode
photoUri: string | null
cameraActive: boolean

// Barcode mode
barcode: string
scannerActive: boolean

// Results
analysis: NutritionAnalysis | null
saving: boolean

// Refs
cameraRef: RefObject<CameraView>
```

### State Transitions

```
Initial State: mode = 'select'
    │
    ├─ User selects "Text" → mode = 'manual'
    │   ├─ User enters text → manualText = "..."
    │   ├─ User clicks Analyze → analyzing = true
    │   ├─ AI returns → analysis = {...}, analyzing = false
    │   └─ User clicks Back → mode = 'select', analysis = null
    │
    ├─ User selects "Photo" → mode = 'photo'
    │   ├─ User clicks Take Photo → cameraActive = true
    │   ├─ User captures → photoUri = "...", cameraActive = false
    │   ├─ Auto analyze → analyzing = true
    │   ├─ AI returns → analysis = {...}, analyzing = false
    │   └─ User clicks Back → mode = 'select', photoUri = null
    │
    └─ User selects "Barcode" → mode = 'barcode'
        ├─ User clicks Scan → scannerActive = true
        ├─ Barcode detected → barcode = "...", scannerActive = false
        ├─ Auto lookup → analyzing = true
        ├─ API returns → analysis = {...}, analyzing = false
        └─ User clicks Back → mode = 'select', barcode = ""

If analysis exists:
    ├─ User selects meal type → mealType = "breakfast"
    ├─ User clicks Save → saving = true
    ├─ API success → saving = false, modal closes
    └─ API error → saving = false, show alert
```

---

## API Endpoints

### Backend (Railway)

```
Base URL: https://heirclarkinstacartbackend-production.up.railway.app

┌────────────────────────────────────────────────────────────────┐
│ POST /api/v1/nutrition/ai/meal-from-text                       │
├────────────────────────────────────────────────────────────────┤
│ Request:                                                        │
│   Headers: { X-Shopify-Customer-Id: string }                   │
│   Body: { text: string, shopifyCustomerId: string }            │
│                                                                 │
│ Response:                                                       │
│   { analysis: NutritionAnalysis }                              │
│                                                                 │
│ Status: ✅ WORKING (200 OK)                                     │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ POST /api/v1/nutrition/ai/meal-from-photo                      │
├────────────────────────────────────────────────────────────────┤
│ Request:                                                        │
│   Headers: { X-Shopify-Customer-Id: string }                   │
│   Body: FormData { photo: Blob, shopifyCustomerId: string }    │
│                                                                 │
│ Response:                                                       │
│   { analysis: NutritionAnalysis }                              │
│                                                                 │
│ Status: ⚠️ NEEDS VERIFICATION                                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ POST /api/v1/meals                                             │
├────────────────────────────────────────────────────────────────┤
│ Request:                                                        │
│   Headers: { X-Shopify-Customer-Id: string }                   │
│   Body: MealData                                               │
│                                                                 │
│ Response:                                                       │
│   { success: boolean }                                         │
│                                                                 │
│ Status: ⚠️ NEEDS VERIFICATION                                   │
└────────────────────────────────────────────────────────────────┘
```

### External APIs

```
┌────────────────────────────────────────────────────────────────┐
│ GET https://world.openfoodfacts.org/api/v0/product/{code}.json│
├────────────────────────────────────────────────────────────────┤
│ Request:                                                        │
│   No auth required (public API)                                │
│   {code} = UPC/EAN barcode number                              │
│                                                                 │
│ Response:                                                       │
│   { status: 0|1, product: {...} }                              │
│                                                                 │
│ Status: ✅ WORKING (Free, unlimited)                            │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### NutritionAnalysis

```typescript
interface NutritionAnalysis {
  mealName: string;           // "Scrambled Eggs Breakfast"
  calories: number;           // 450
  protein: number;            // 18 (grams)
  carbs: number;              // 35 (grams)
  fat: number;                // 22 (grams)
  confidence: string;         // "high" | "medium" | "low"
  foods: Array<{
    name: string;             // "Scrambled Eggs"
    portion: string;          // "2 large"
    calories: number;         // 180
    protein: number;          // 12g
    carbs: number;            // 2g
    fat: number;              // 12g
  }>;
  suggestions?: string[];     // ["Add vegetables", ...]
}
```

### MealData

```typescript
interface MealData {
  id?: string;                // Auto-generated
  odooId?: string;            // Backend user ID
  odooContactId?: string;     // Backend contact ID
  date: string;               // "2026-01-19"
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;               // "Scrambled Eggs Breakfast"
  calories: number;           // 450
  protein: number;            // 18
  carbs: number;              // 35
  fat: number;                // 22
  time?: string;              // "2026-01-19T08:30:00Z"
}
```

---

## Permission Flow

### iOS (app.json configuration)

```
NSCameraUsageDescription
  └─> "This app needs camera access to take photos of your meals"
      └─> Required for: Photo mode (camera), Barcode scanner

NSMicrophoneUsageDescription
  └─> "This app needs microphone access to record meal descriptions"
      └─> Required for: Voice mode (future)

NSPhotoLibraryUsageDescription
  └─> "This app needs photo library access to select meal photos"
      └─> Required for: Photo mode (gallery picker)
```

### Android (app.json configuration)

```
android.permission.CAMERA
  └─> Required for: Photo mode (camera), Barcode scanner

android.permission.READ_EXTERNAL_STORAGE
  └─> Required for: Photo mode (gallery picker)

android.permission.RECORD_AUDIO
  └─> Required for: Voice mode (future)
```

### Runtime Permission Flow

```
User clicks "Take Photo"
    │
    ▼
expo-camera checks permission
    │
    ├─ Granted ────────> Open camera immediately
    │
    ├─ Not Determined ─> Show permission dialog
    │                       │
    │                       ├─ User grants ──> Open camera
    │                       │
    │                       └─ User denies ──> Show alert:
    │                                          "Please allow camera access"
    │
    └─ Denied ─────────> Show alert with Settings link
```

---

## Error Handling

### Network Errors

```
User triggers AI analysis
    │
    ▼
fetch() throws NetworkError
    │
    ▼
catch block logs error
    │
    ▼
Return null from aiService
    │
    ▼
Component checks if result is null
    │
    ▼
Alert: "AI Unavailable"
"Please try again later or use a different logging method."
```

### Backend Errors

```
Backend returns 500 Internal Server Error
    │
    ▼
response.ok === false
    │
    ▼
Log error to console
    │
    ▼
Return null from aiService
    │
    ▼
Show error alert to user
```

### Barcode Not Found

```
Open Food Facts returns { status: 0 }
    │
    ▼
Product not in database
    │
    ▼
Return null from lookupBarcode()
    │
    ▼
Alert: "Product not found. Try entering manually."
```

---

## Performance Considerations

### Image Upload Optimization

```
Original Photo (Camera)
    │ (3-5 MB)
    │
    ▼
takePictureAsync({ quality: 0.8 })
    │ (Reduced to ~1-2 MB)
    │
    ▼
Base64 Encoding
    │ (+33% size = ~2.6 MB)
    │
    ▼
Network Upload
    │ (Depends on connection speed)
    │ (WiFi: 2-3s, 4G: 5-10s, 3G: 15-30s)
    │
    ▼
Backend Processing

⚠️ Recommendation: Add client-side compression
    └─> Target: < 500KB before upload
```

### AI Analysis Timing

```
Text Analysis:    2-5 seconds   (Backend AI processing)
Photo Analysis:   5-15 seconds  (Upload + Vision AI)
Barcode Lookup:   1-2 seconds   (External API)
```

---

**Last Updated:** January 19, 2026
**Architecture Version:** 1.0
**Maintained by:** Development Team
