# Fix TypeScript "Maximum Call Stack Size Exceeded" Error

## The Problem

You're getting:
```
RangeError: Maximum call stack size exceeded
```

This causes the black screen because the app can't compile.

---

## QUICK FIX (Works Immediately)

**Run this command:**
```bash
set EXPO_NO_TYPESCRIPT_CHECK=1 && npx expo start --clear --tunnel
```

**Or double-click:** `quick-start.bat`

This **disables TypeScript checking** so your app runs while we fix the root cause.

---

## Root Cause Analysis

The "Maximum call stack size exceeded" error in TypeScript is usually caused by:

1. **Type recursion** - A type that references itself infinitely
2. **Corrupted TypeScript cache**
3. **TypeScript version incompatibility**
4. **Very complex type unions**
5. **Circular imports** (though madge found none)

---

## Permanent Fix Options

### Option 1: Update TypeScript (Recommended)

```bash
npm install typescript@latest --save-dev
npx expo start --clear
```

### Option 2: Clear ALL caches

```bash
# Kill Node
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"

# Clear everything
rm -rf node_modules/.cache
rm -rf .expo
rm -rf node_modules/.tmp
npm cache clean --force

# Restart
npx expo start --clear
```

### Option 3: Reinstall node_modules

```bash
rm -rf node_modules
rm package-lock.json
npm install
npx expo start --clear
```

### Option 4: Disable TypeScript checking in app.json

Add this to your `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "build": {
          "experimental": {
            "skipTypeScriptChecks": true
          }
        }
      }
    }
  }
}
```

### Option 5: Create tsconfig with more lenient settings

Update `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": false,
    "skipLibCheck": true,
    "noImplicitAny": false,
    "incremental": true
  }
}
```

---

## Scripts Available

**quick-start.bat** - Starts Expo with TypeScript disabled
```bash
double-click quick-start.bat
```

**reset-dev-clients.bat** - Full reset of all caches
```bash
double-click reset-dev-clients.bat
```

**kill-metro.bat** - Just kills Node.js
```bash
double-click kill-metro.bat
```

---

## If Still Black Screen After TypeScript Fix

### Check Metro Logs

Look in your terminal for errors like:
- "Module not found"
- "Invariant Violation"
- Any red error messages

### Check Device Logs

**iOS:**
```bash
# In another terminal
npx react-native log-ios
```

**Android:**
```bash
# In another terminal
npx react-native log-android
```

### Use ErrorBoundary (After Rebuild)

The ErrorBoundary I added will show errors instead of black screen, but you need to:

1. Stop Metro
2. Run: `eas build --platform ios --profile development`
3. Download new build
4. Install on device
5. Now errors will show instead of black screen

---

## Debugging TypeScript Errors

### Find the problematic type:

```bash
# Run TypeScript compiler with verbose output
npx tsc --noEmit --listFiles > tsc-files.txt 2>&1
```

Look for files being processed repeatedly at the end of `tsc-files.txt`.

### Check specific file:

```bash
npx tsc --noEmit path/to/SuspiciousFile.tsx
```

### Common culprits:

1. **Context files with complex types**
   - GoalWizardContext.tsx
   - TrainingContext.tsx
   - Any context with many providers

2. **Type files with recursive definitions**
   - types/index.ts
   - constants/goals.ts

3. **Component props with circular references**

---

## Working Around the Issue

While we debug, you can work with:

```bash
# Start without TypeScript
set EXPO_NO_TYPESCRIPT_CHECK=1
npx expo start --clear

# Or add to package.json:
"scripts": {
  "start": "EXPO_NO_TYPESCRIPT_CHECK=1 expo start",
  "start:clean": "EXPO_NO_TYPESCRIPT_CHECK=1 expo start --clear"
}
```

Then: `npm start`

---

## Check TypeScript Version

```bash
npx tsc --version
```

Should be: **5.3.x or higher**

If lower:
```bash
npm install typescript@latest --save-dev
```

---

## Nuclear Option (If Nothing Works)

```bash
# Backup your .env and important config files first!

# Delete everything
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared
rm package-lock.json

# Fresh install
npm install

# Rebuild dev client
eas build --platform ios --profile development

# Start fresh
npx expo start --clear
```

---

## After Fix is Complete

1. Remove the TypeScript disable flag
2. Rebuild dev client to get ErrorBoundary
3. Test that TypeScript checking works:
   ```bash
   npx tsc --noEmit
   ```
4. If successful, remove quick-start.bat (or update it to remove the flag)

---

## Prevention

1. **Use TypeScript 5.3+**
2. **Keep dependencies updated**
3. **Avoid deeply nested type definitions**
4. **Use `skipLibCheck: true` in tsconfig**
5. **Clear cache regularly**: `npx expo start --clear`
