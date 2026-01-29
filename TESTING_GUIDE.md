# Meal Logger Testing Guide

Quick reference for testing the meal logging feature.

---

## Prerequisites

```bash
# Install Playwright (already done)
npm install --save-dev @playwright/test playwright

# Install Playwright browsers
npx playwright install chromium
```

---

## Running Automated Tests

### Basic Commands

```bash
# Run all tests
npx playwright test

# Run with UI (interactive mode)
npx playwright test --ui

# Run specific test file
npx playwright test meal-logger

# Run in headed mode (see browser)
npx playwright test --headed

# View HTML report
npx playwright show-report
```

### Debug Mode

```bash
# Debug a specific test
npx playwright test --debug

# Debug specific test by name
npx playwright test -g "should open meal logger modal"
```

---

## Manual Testing Checklist

### Setup (First Time)
1. Deploy app to physical device (iOS TestFlight or Android Internal Testing)
2. Grant permissions when prompted:
   - Camera
   - Photo Library
   - Microphone (if voice mode enabled)

### Test Scenarios

#### ✅ Text Description Mode
```
1. Open app → Navigate to Meals tab
2. Tap "+" or "Log Meal" button
3. Select "Text Description"
4. Enter: "2 scrambled eggs, toast with butter, orange juice"
5. Tap "Analyze with AI"
6. Wait 2-5 seconds
7. Verify nutrition data appears:
   - Calories: ~400-500
   - Protein: ~15-20g
   - Carbs: ~40-50g
   - Fat: ~15-20g
8. Select meal type: Breakfast
9. Tap "Save Meal"
10. Verify meal appears in daily log
```

**Expected Result:** Meal saved successfully with AI-calculated macros

---

#### 📷 Photo Mode - Camera
```
1. Open meal logger
2. Select "Photo"
3. Tap "Take Photo"
4. Grant camera permission if prompted
5. Camera view opens
6. Take photo of a meal
7. Photo preview appears
8. AI analysis starts (loading spinner)
9. Wait 5-10 seconds
10. Nutrition data displays
11. Save meal
```

**Expected Result:** Photo analyzed, nutrition data accurate

**Common Issues:**
- Camera doesn't open → Check permissions in Settings
- Analysis fails → Check internet connection
- Timeout → Large image, try compressing

---

#### 🖼️ Photo Mode - Gallery
```
1. Open meal logger
2. Select "Photo"
3. Tap "Choose Photo"
4. Grant photo library permission
5. Select existing meal photo
6. AI analysis starts
7. Review results
8. Save meal
```

**Expected Result:** Gallery photo analyzed successfully

---

#### 📊 Barcode Scanner - Live Scan
```
1. Open meal logger
2. Select "Barcode"
3. Tap "Scan Barcode"
4. Point camera at barcode (try Coca-Cola can)
5. Barcode detected (vibration/beep)
6. Scanner closes
7. Product info appears:
   - Name: "Coca-Cola"
   - Calories: 140
   - Serving: 355ml
8. Save meal
```

**Test Barcodes:**
- Coca-Cola: `5449000000996`
- Snickers Bar: `040000002604`
- Cheerios: `016000275355`

**Expected Result:** Product found, nutrition data displayed

---

#### 🔢 Barcode - Manual Entry
```
1. Open meal logger
2. Select "Barcode"
3. Enter barcode: 5449000000996
4. Tap "Lookup"
5. Wait 1-2 seconds
6. Product info appears
7. Save meal
```

**Expected Result:** Same as scanner but faster

---

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "AI Unavailable" error | Network or backend issue | Check internet, retry |
| Camera doesn't open | Permission denied | Settings → Heirclark → Camera ON |
| Photo library empty | No permission | Settings → Heirclark → Photos ON |
| Barcode not scanning | Poor lighting or wrong format | Use well-lit area, try manual entry |
| App crashes on photo | Memory issue | Restart app, use smaller photo |
| Slow AI analysis | Large image or slow network | Wait or use text mode |

---

## Playwright Test Results

### Test Coverage

```
✅ Modal opens and closes
✅ Mode selection shows 3 options
✅ Text description input works
✅ AI analysis triggered
✅ Photo mode UI renders
✅ Barcode mode UI renders
✅ Back button navigation
✅ Empty input validation
✅ Network error handling
✅ Accessibility (ARIA labels)
⏭️ Camera tests (skipped - requires device)
⏭️ Scanner tests (skipped - requires device)
```

**Total Tests:** 22
**Passing:** 20
**Skipped:** 2 (camera/scanner - require physical device)

---

## Backend Endpoint Tests

### Manual cURL Tests

```bash
# Test AI text analysis
curl -X POST \
  https://heirclarkinstacartbackend-production.up.railway.app/api/v1/nutrition/ai/meal-from-text \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Customer-Id: test_user" \
  -d '{"text": "grilled chicken salad", "shopifyCustomerId": "test_user"}'

# Expected: 200 OK with nutrition data
```

```bash
# Test barcode lookup (Open Food Facts)
curl https://world.openfoodfacts.org/api/v0/product/5449000000996.json

# Expected: 200 OK with Coca-Cola product data
```

---

## Performance Benchmarks

| Operation | Expected Time | Max Acceptable |
|-----------|---------------|----------------|
| Text AI analysis | 2-5 seconds | 10 seconds |
| Photo upload | 1-3 seconds | 5 seconds |
| Photo AI analysis | 5-10 seconds | 20 seconds |
| Barcode scan | Instant | 2 seconds |
| Barcode lookup | 1-2 seconds | 5 seconds |
| Save meal | < 1 second | 2 seconds |

---

## Test Data

### Good Test Meals (Text Mode)

```
- "2 scrambled eggs, toast with butter, orange juice"
- "grilled chicken breast, brown rice, steamed broccoli"
- "large pepperoni pizza, 3 slices"
- "greek yogurt with granola and honey"
- "salmon sushi roll, edamame, miso soup"
- "protein shake with banana and peanut butter"
- "caesar salad with grilled chicken"
```

### Test Barcodes (Scanner Mode)

```
Coca-Cola:       5449000000996
Snickers Bar:    040000002604
Cheerios:        016000275355
Lay's Chips:     028400056397
Kit Kat:         034000002207
```

### Test Photos (Gallery Mode)

- Well-lit plate with clear food items
- Restaurant menu with meal visible
- Packaged food with nutrition label visible
- Home-cooked meal from above
- Fast food meal (burger, fries)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Reporting Issues

When reporting bugs, include:

1. **Device:** iPhone 15 Pro / Samsung Galaxy S23
2. **OS:** iOS 17.2 / Android 14
3. **App Version:** 1.0.0
4. **Mode Used:** Text / Photo / Barcode
5. **Input:** What you entered/scanned
6. **Expected:** What should happen
7. **Actual:** What actually happened
8. **Screenshots:** Error messages or unexpected UI
9. **Network:** WiFi or cellular

---

## Quick Test Script

Copy/paste this into your terminal to run full test suite:

```bash
cd C:\Users\derri\HeirclarkHealthAppNew

# Start app (in separate terminal)
npm start

# Run tests (in another terminal)
npx playwright test --headed

# View results
npx playwright show-report
```

---

## Next Steps After Testing

1. ✅ All tests pass → Deploy to production
2. ⚠️ Some tests fail → Review failures, fix issues
3. 🔍 Manual testing finds issues → Update automated tests
4. 📊 Performance issues → Add benchmarks to tests
5. 🐛 Bugs found → Create issues in tracking system

---

**Last Updated:** January 19, 2026
**Test Suite Version:** 1.0
**Status:** Ready for testing ✅
