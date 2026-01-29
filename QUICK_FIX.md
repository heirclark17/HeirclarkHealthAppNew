# Quick Fix: Gauge Text Cutoff

## The Problem
Text being cut off at the top of the calorie gauge on actual devices.

## The Solution (2 Changes)

### File: `components/SemiCircularGauge.tsx`

#### Change 1 (Line 84)
```typescript
// CHANGE THIS:
height: size / 2 + strokeWidth / 2 + 80

// TO THIS:
height: size / 2 + strokeWidth / 2 + 100
```

#### Change 2 (Line 156)
```typescript
// CHANGE THIS:
paddingTop: 20,

// TO THIS:
paddingTop: 30,
```

## That's It!

Save the file and test on your device.

## What This Does
- Adds 20px more container height
- Adds 10px more top padding
- Creates 108px clearance above text (was 98px)
- Prevents text cutoff on all devices

## Quick Test
1. Run: `npx expo start --ios` (or --android)
2. Check: Calorie gauge with negative value like -044
3. Verify: Top of numbers fully visible
4. Done!

---

*For detailed explanation, see: FIX_IMPLEMENTATION_GUIDE.md*
