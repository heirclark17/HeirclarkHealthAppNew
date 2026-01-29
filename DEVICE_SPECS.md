# 📱 Heirclark Health App - Device Specifications

**Last Updated:** January 17, 2026

---

## 🎯 Target Device Configuration

### Primary Target Device
**iPhone 16 Pro Max** (Latest flagship model)

### Display Specifications
- **Screen Size:** 6.9 inches
- **Resolution:** 1320 × 2868 pixels
- **Width:** 430 points
- **Height:** 932 points
- **Aspect Ratio:** 19.5:9
- **Display Technology:** Super Retina XDR OLED
- **ProMotion:** 120Hz adaptive refresh rate

### iOS Requirements
- **Minimum iOS Version:** iOS 15.0
- **Recommended iOS Version:** iOS 18.2+ (latest)
- **Target iOS SDK:** Latest available

---

## 🌐 Web Browser View

When testing in browser at http://localhost:8085:

**Mobile Frame Dimensions:**
- Width: **430px** (iPhone 16 Pro Max)
- Height: **932px** (iPhone 16 Pro Max)
- Background: Dark gray (#1a1a1a) centered frame
- Platform Detection: Auto-mobile on web, native on iOS

---

## 📐 Screen Dimensions by iPhone Model

| Model | Width | Height | Screen Size |
|-------|-------|--------|-------------|
| **iPhone 16 Pro Max** | 430px | 932px | 6.9" | ⭐ **Current Target**
| iPhone 16 Pro | 402px | 874px | 6.3" |
| iPhone 16 Plus | 430px | 932px | 6.7" |
| iPhone 16 | 393px | 852px | 6.1" |
| iPhone 15 Pro Max | 430px | 932px | 6.7" |
| iPhone 15 Pro | 393px | 852px | 6.1" |
| iPhone 14 Pro Max | 430px | 932px | 6.7" |
| iPhone 14 Pro | 393px | 852px | 6.1" |
| iPhone SE (3rd gen) | 375px | 667px | 4.7" |

---

## 🎨 Design System Optimizations

### Safe Areas (iPhone 16 Pro Max)
- **Status Bar Height:** ~59px (with Dynamic Island)
- **Home Indicator Height:** ~34px
- **Dynamic Island:** Present (requires design accommodation)
- **Notch:** No (replaced by Dynamic Island)

### Screen Considerations
- **Always-On Display:** Supported
- **HDR Content:** Supported
- **Wide Color Gamut:** P3 color space
- **True Tone:** Enabled by default

---

## 🔧 App Configuration

### Bundle Settings (app.json)
```json
{
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.heirclark.health",
    "buildNumber": "1",
    "deploymentTarget": "15.0",
    "infoPlist": {
      "NSHealthShareUsageDescription": "Access to health data for tracking",
      "NSHealthUpdateUsageDescription": "Update health data with meals",
      "UIRequiresFullScreen": false
    }
  }
}
```

### Web Layout (_layout.tsx)
```typescript
mobileFrame: {
  width: 430,        // iPhone 16 Pro Max width
  height: '100%',
  maxHeight: 932,    // iPhone 16 Pro Max height
  backgroundColor: '#000000',
  overflow: 'hidden',
}
```

---

## ✅ Supported Features

### iOS-Specific Features
- ✅ **Glass Blur Effects** (expo-blur, iOS 10+)
- ✅ **ProMotion 120Hz** (smooth animations)
- ✅ **Haptic Feedback** (via Haptics API)
- ✅ **Face ID / Touch ID** (biometric auth ready)
- ✅ **Health Kit Integration** (permissions configured)
- ✅ **Dark Mode** (automatic with userInterfaceStyle)
- ✅ **Dynamic Island** (safe area insets)

### Cross-Platform Features
- ✅ **React Native 0.81.5**
- ✅ **Expo SDK 54**
- ✅ **TypeScript**
- ✅ **Expo Router** (file-based routing)
- ✅ **Urbanist Font Family** (Google Fonts)

---

## 🧪 Testing Configurations

### Expo Go Testing
**Supported iOS Versions:** iOS 15.0 - iOS 18.x
**Recommended Device:** iPhone 16 Pro Max or iPhone 15 Pro Max
**Connection:** WiFi (same network as dev machine)
**Server URL:** `exp://[YOUR_IP]:8085`

### TestFlight Testing (Pre-Production)
**Build Profile:** `preview`
**Distribution:** Internal (100 testers max)
**Build Command:** `eas build --platform ios --profile preview`

### Production Build
**Build Profile:** `production`
**Distribution:** App Store
**Build Command:** `eas build --platform ios --profile production`

---

## 📊 Performance Targets

### Frame Rate
- **Target:** 60 FPS (stable)
- **ProMotion:** 120 FPS (where applicable)
- **Minimum:** 30 FPS (under heavy load)

### Bundle Size
- **Current:** ~25MB (with all assets)
- **Target:** <50MB (App Store limit: 200MB over-the-air)
- **Optimizations:** Code splitting, asset compression

### Memory Usage
- **Target:** <200MB RAM usage
- **Limit:** 1.5GB (before iOS terminates app)

---

## 🔐 Privacy & Permissions

### Required Permissions
1. **Health Data Access** (NSHealthShareUsageDescription)
   - Read: Steps, calories, heart rate
   - Write: Nutrition data, workouts

2. **Camera** (future - for food photo scanning)
   - NSCameraUsageDescription: "Scan food barcodes and analyze meals"

3. **Photo Library** (future - for meal photos)
   - NSPhotoLibraryUsageDescription: "Save and upload meal photos"

### Optional Permissions
- **Notifications** - Meal reminders, goal achievements
- **Location** - Restaurant recommendations (future)

---

## 📱 Device Testing Checklist

Before App Store submission, test on:

**Minimum Requirement:**
- [ ] iPhone SE (3rd gen) - iOS 15.0 (smallest screen)
- [ ] iPhone 16 Pro Max - iOS 18.2 (largest screen)

**Recommended Coverage:**
- [ ] iPhone 14 Pro - iOS 17.x (Dynamic Island)
- [ ] iPhone 15 - iOS 18.x (standard model)
- [ ] iPhone 16 Pro - iOS 18.2 (current Pro)
- [ ] iPad Air - iOS 18.x (tablet support)

**Test Scenarios:**
- [ ] Light mode / Dark mode switching
- [ ] Landscape orientation (if supported)
- [ ] Split screen multitasking (iPad)
- [ ] Low battery mode
- [ ] Airplane mode (offline functionality)
- [ ] Accessibility (VoiceOver, Dynamic Type)

---

## 🚀 Deployment Targets

### App Store Metadata
**Supported Devices:**
- iPhone (iOS 15.0 or later)
- iPad (iOS 15.0 or later)

**Screenshot Requirements:**
- 6.9" Display (iPhone 16 Pro Max): 1320 × 2868
- 6.7" Display (iPhone 15 Pro Max): 1290 × 2796
- 5.5" Display (iPhone 8 Plus): 1242 × 2208
- 12.9" Display (iPad Pro): 2048 × 2732

### Version History
- **v1.0.0** (Build 1) - Initial release
  - Target: iPhone 16 Pro Max
  - iOS: 15.0 minimum, 18.2 recommended
  - Features: Dashboard, Meal tracking, Glass UI

---

## 📝 Notes

**iPhone 16 Pro Max vs iPhone 15 Pro Max:**
- Same screen dimensions (430 × 932)
- Improved A18 Pro chip (better performance)
- Enhanced ProMotion (smoother animations)
- Better battery life (optimize accordingly)
- Titanium design (premium feel)

**Dynamic Island Considerations:**
- Appears in center-top of screen
- Covers ~154 × 37 pixels when idle
- Expands for Live Activities
- Use safe area insets to avoid overlap

**Glass Blur Optimization:**
- Best on A15+ chips (iPhone 13 and newer)
- Intensity: 100 (maximum frosted glass effect)
- Fallback: Semi-transparent for older devices
- Performance: Monitor FPS during heavy blur usage

---

**Device Spec Status:** ✅ Optimized for iPhone 16 Pro Max
**iOS Target:** 15.0 minimum, 18.2+ recommended
**Last Verified:** January 17, 2026
