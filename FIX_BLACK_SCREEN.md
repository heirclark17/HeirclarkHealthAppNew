# Fix Expo Black Screen on Reload

## The Problem
Your app goes black when you reload, forcing you to download the build again. This is a Metro bundler connection issue.

---

## Solution 1: Enable Dev Client Debugging (RECOMMENDED)

**Step 1: Shake device or press Ctrl+M (Android) / Cmd+D (iOS)**

**Step 2: Enable "Fast Refresh"**
- In dev menu, ensure "Fast Refresh" is enabled
- This prevents full reloads

**Step 3: Check connection indicator**
- Look for "Connected to Metro" at bottom of screen
- If it says "Disconnected", the bundler crashed

---

## Solution 2: Restart Metro with Clean Cache

**Option A: Use the batch file (Windows)**
```bash
# Double-click this file in the project root:
clear-expo-cache.bat
```

**Option B: Manual commands**
```bash
# Stop Metro
taskkill /F /IM node.exe

# Clear cache and restart
npx expo start --clear

# Or with tunnel for better connectivity:
npx expo start --clear --tunnel
```

---

## Solution 3: Fix Metro Bundler Settings

**Create/Edit metro.config.js:**

Add this configuration to improve reliability:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Increase timeouts to prevent black screen
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Increase timeout
      res.setTimeout(60000); // 60 seconds
      return middleware(req, res, next);
    };
  },
};

// Better caching
config.resetCache = true;

module.exports = config;
```

---

## Solution 4: Use Tunnel Mode for Better Connectivity

**Why it helps:** Tunnel mode uses ngrok to create a stable connection, preventing Metro disconnect issues.

```bash
# Start with tunnel
npx expo start --tunnel

# Or add to package.json:
"scripts": {
  "start": "expo start",
  "start:tunnel": "expo start --tunnel",
  "start:clean": "expo start --clear"
}
```

Then run: `npm run start:tunnel`

---

## Solution 5: Enable Dev Client Error Overlay

**Add to app.json:**

```json
{
  "expo": {
    "developmentClient": {
      "silentLaunch": false
    },
    "extra": {
      "devClient": {
        "showErrorOverlay": true
      }
    }
  }
}
```

This will show errors instead of black screen.

---

## Solution 6: Check for Context Errors

**The issue might be a crash in one of your contexts.**

**Add error boundary to _layout.tsx:**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10, color: 'red' }}>
            App Crashed
          </Text>
          <Text style={{ marginBottom: 20, textAlign: 'center' }}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ padding: 10, backgroundColor: '#007AFF', borderRadius: 5 }}
          >
            <Text style={{ color: 'white' }}>Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrap your app in ErrorBoundary
export default function RootLayout() {
  // ... existing code ...

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {/* ... rest of your providers ... */}
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
```

---

## Solution 7: Disable Unused Providers (IF Needed)

**Note:** Your PROVIDERS_ARRAY is defined but not used. Clean this up:

Remove lines 24-30 in `app/_layout.tsx`:
```typescript
// DELETE THIS (unused code):
const PROVIDERS_ARRAY = [
  SafeAreaProvider,
  AuthProvider,
  SettingsProvider,
];
```

---

## Solution 8: Network Firewall Check

**Windows Firewall might be blocking Metro:**

```powershell
# Run as Administrator in PowerShell:
New-NetFirewallRule -DisplayName "Expo Metro Bundler" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

---

## Solution 9: Use USB Debugging (Most Reliable)

**Android:**
```bash
# Enable USB debugging on phone
# Connect via USB
adb devices

# Forward Metro port
adb reverse tcp:8081 tcp:8081

# Then start Expo
npx expo start --localhost
```

**iOS:**
- USB debugging works automatically with physical device

---

## Solution 10: Check Metro Logs for Errors

**Run Metro in separate terminal with verbose logging:**

```bash
# Terminal 1: Start Metro with verbose logs
npx expo start --clear 2>&1 | tee metro-debug.log

# Terminal 2: Watch for errors
tail -f metro-debug.log
```

**Look for:**
- "Bundling failed"
- "Module not found"
- "TypeError" or "ReferenceError"
- Connection timeouts

---

## Quick Checklist When Black Screen Occurs

1. ☐ Check if Metro bundler is still running in terminal
2. ☐ Look for red error messages in Metro terminal
3. ☐ Shake device → Check dev menu shows "Connected"
4. ☐ Try `npx expo start --clear` to restart with clean cache
5. ☐ Try `npx expo start --tunnel` for more stable connection
6. ☐ Check phone is on same WiFi network as computer
7. ☐ Restart Metro bundler completely (Ctrl+C, then restart)
8. ☐ If all else fails: Delete .expo folder and restart

---

## Prevention Tips

1. **Keep Metro running** - Don't close the terminal
2. **Use Fast Refresh** - Don't manually reload unless needed
3. **Save files properly** - Give Metro time to rebuild (2-3 seconds)
4. **Stable WiFi** - Use wired connection for dev machine if possible
5. **Close other Metro instances** - Only run one at a time
6. **Update Expo SDK** - `npx expo-doctor` to check for issues

---

## Last Resort: Full Clean

```bash
# Stop everything
taskkill /F /IM node.exe
taskkill /F /IM watchman.exe

# Clean everything
rd /s /q node_modules
rd /s /q .expo
del /f package-lock.json

# Reinstall
npm install

# Start fresh
npx expo start --clear
```

---

## Most Common Cause

**90% of black screens are caused by Metro bundler losing connection.**

**The fix:** Use tunnel mode for more stable connection:
```bash
npx expo start --tunnel
```

Or use USB debugging with localhost:
```bash
adb reverse tcp:8081 tcp:8081
npx expo start --localhost
```
