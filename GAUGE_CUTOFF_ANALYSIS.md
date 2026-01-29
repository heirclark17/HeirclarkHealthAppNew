# SemiCircularGauge Text Cutoff Analysis

## Problem Description
The calorie value text (e.g., "-044 kcal") is being cut off at the top on actual devices when rendered in the large SemiCircularGauge component (340px size with 72px font).

## Current Component Settings

### Large Gauge (Main Calorie Gauge)
- **size**: 340px
- **strokeWidth**: 36px
- **valueFontSize**: 72px
- **centerContentBottom**: 50px
- **Container height**: `size / 2 + strokeWidth / 2 + 80` = `170 + 18 + 80` = **268px**
- **SVG height**: `size / 2 + strokeWidth / 2` = `170 + 18` = **188px**
- **paddingTop**: 20px

### Small Gauge (Macro Gauges)
- **size**: 100px
- **strokeWidth**: 14px
- **valueFontSize**: 24px
- **centerContentBottom**: `size * 0.25` = 25px
- **Container height**: `50 + 7 + 80` = **137px**

## Root Cause Analysis

### 1. Text Positioning Calculation
The text is positioned absolutely with `bottom: 50` (for large gauge):
- Text bottom position: 50px from container bottom
- Container height: 268px
- Text position from top: `268 - 50` = **218px**
- With 72px font size, text top would be at approximately: `218 - 72` = **146px** from container top

### 2. Available Space Above Text
- Container has paddingTop: 20px
- SVG takes up: 188px (including stroke)
- Text starts at: ~146px from top
- **Space above text**: `146 - 20` (padding) = **126px**

This calculation shows that the text should theoretically fit, BUT:

### 3. Why It Still Gets Cut Off

#### a) **Line Height > Font Size**
React Native text rendering often has a line-height that's larger than the font size (typically 1.2x to 1.4x):
- Font size: 72px
- Actual line height: ~86-100px (estimated)
- This means the text box extends beyond the 72px we calculated

#### b) **Font Ascenders and Descenders**
Fonts have ascenders (parts that go above the baseline) and descenders (below):
- The actual rendered height includes these
- Numbers like "0", "4" have ascenders that extend beyond the nominal font size
- Minus sign "-" position may also affect vertical bounds

#### c) **Absolute Positioning Quirks**
With `position: absolute` and `bottom: 50`:
- The text is positioned relative to container bottom
- The alignment point might be the text baseline, not the bounding box
- This can cause the actual top of the text to extend higher than calculated

#### d) **React Native Web vs Native Differences**
- React Native Web may render fonts differently than iOS/Android
- Native platforms may have tighter font metrics
- What works in web preview may not work on actual device

## Spatial Analysis

### Current Layout (Large Gauge)
```
[Container: 268px height]
├─ paddingTop: 20px
├─ SVG: 188px height
│  └─ Arc curves from left → top → right
└─ Text Area: 80px available (268 - 188)
   └─ Text positioned at bottom: 50px
      ├─ Text height: 72px (nominal)
      ├─ Actual text box: ~86-100px (with line-height)
      └─ Text top: 218 - 100 = 118px from container top
```

**Problem**: Text top at 118px with paddingTop of 20px means text might extend into the SVG area or beyond container top.

## Recommended Fixes (In Priority Order)

### Fix 1: Increase Container Height ✅ (BEST)
**Changes:**
- Change container height calculation: `size / 2 + strokeWidth / 2 + 100` (was +80)
- Or: `size / 2 + strokeWidth / 2 + 120` for extra safety

**For 340px gauge:**
- New height: 170 + 18 + 100 = **288px** (vs 268px)
- Text position from top: 288 - 50 = 238px
- Space above text: 238 - 100 = **138px** (more clearance)

**Code change:**
```typescript
// Line 84 in SemiCircularGauge.tsx
<View
  style={[styles.container, {
    width: size,
    height: size / 2 + strokeWidth / 2 + 100  // Changed from +80
  }]}
>
```

**Pros:**
- Simple one-line change
- Doesn't affect text positioning logic
- Provides more vertical space
- Safe for all device types

**Cons:**
- Slightly larger component overall
- More whitespace below gauge

---

### Fix 2: Move Text Down (Increase centerContentBottom) ✅
**Changes:**
- Increase `centerContentBottom` from 50 to 65-70 for large gauges

**For 340px gauge:**
- New centerContentBottom: 65
- Text position from top: 268 - 65 = **203px**
- Space above text: 203 - 100 = **103px** (marginal improvement)

**Code change:**
```typescript
// Line 79
const centerContentBottom = isSmall ? size * 0.25 : 65;  // Changed from 50
```

**Pros:**
- Moves text away from top
- No container size change

**Cons:**
- May make text look too low relative to gauge
- Less elegant visual positioning

---

### Fix 3: Reduce Font Size ⚠️
**Changes:**
- Reduce `valueFontSize` from 72 to 64 or 68

**Code change:**
```typescript
// Line 76
const valueFontSize = isSmall ? 24 : 64;  // Changed from 72
```

**Pros:**
- Guaranteed to fit
- More conservative sizing

**Cons:**
- Reduces visual impact
- May require design approval
- Text might look too small for the gauge

---

### Fix 4: Increase paddingTop ✅
**Changes:**
- Increase `paddingTop` from 20 to 35-40

**Code change:**
```typescript
// Line 156 in styles
container: {
  // ...
  paddingTop: 35,  // Changed from 20
}
```

**Pros:**
- Adds safety margin at top
- Simple change

**Cons:**
- Shifts entire gauge down
- May affect vertical centering in card

---

### Fix 5: Use Flexible Layout (Advanced) ⚙️
**Changes:**
- Remove absolute positioning
- Use flexbox for vertical centering
- Let React Native calculate text bounds

**Code change:**
```typescript
// Replace absolute positioning with flex
<View style={styles.centerContent}>
  <View style={styles.valueRow}>
    {/* Text content */}
  </View>
</View>

// Update styles
centerContent: {
  // Remove: position: 'absolute', bottom: 50
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 20, // Adjust as needed
},
```

**Pros:**
- More flexible and adaptive
- React Native handles text bounds
- Better cross-platform consistency

**Cons:**
- Requires more testing
- May need repositioning of goal text
- More complex change

---

## Recommended Solution

### Combined Approach (Safest)

Apply **Fix 1 + Fix 4** together:

1. **Increase container height to +100**
2. **Increase paddingTop to 30**

```typescript
// In SemiCircularGauge.tsx

// Line 84: Increase container height
<View
  style={[styles.container, {
    width: size,
    height: size / 2 + strokeWidth / 2 + 100  // +20px more space
  }]}
>

// Line 156: Increase top padding
container: {
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  paddingTop: 30,  // +10px more padding
},
```

**Result:**
- Container: 288px (vs 268px)
- Padding: 30px (vs 20px)
- Text position from top: 288 - 50 = 238px
- Text top: 238 - 100 = 138px
- Clearance: 138 - 30 = **108px above text** ✅

This provides substantial clearance while maintaining the visual design.

---

## Testing Checklist

After applying fixes, test on:
- [ ] iOS device (iPhone 12+, iPhone 15)
- [ ] Android device (Pixel, Samsung)
- [ ] Different screen sizes
- [ ] Both positive and negative calorie values
- [ ] Large numbers (e.g., -1234 vs -44)
- [ ] Different calorie goals (1500 vs 3000)

---

## Additional Notes

### Why Web Preview May Look Fine
- Web browsers use different font rendering engines
- CSS and React Native handle line-height differently
- Browser developer tools may not show the exact native rendering
- Always test on actual devices for text layout issues

### Font Rendering Differences
- **iOS**: Uses Core Text, renders fonts tightly
- **Android**: Uses Skia, may have different metrics
- **Web**: Uses browser font engine (varies)

### React Native Text Layout
React Native doesn't expose precise control over:
- Baseline alignment
- Cap height vs x-height
- Exact ascender/descender bounds
- Line-height algorithm

This is why generous padding/spacing is recommended for text-heavy layouts.

---

## Next Steps

1. **Run Playwright tests** to capture actual rendering measurements
2. **Apply recommended fix** (Fix 1 + Fix 4)
3. **Test on actual device** (deploy to iPhone/Android)
4. **Verify with different data** (negative values, large numbers)
5. **Document final settings** once confirmed working

---

## File Locations

- **Component**: `C:\Users\derri\HeirclarkHealthAppNew\components\SemiCircularGauge.tsx`
- **Usage**: `C:\Users\derri\HeirclarkHealthAppNew\app\(tabs)\index.tsx` (lines 593-601)
- **Tests**: `C:\Users\derri\HeirclarkHealthAppNew\tests\gauge-cutoff-inspection.spec.ts`
- **Analysis**: This file

---

*Analysis created: 2026-01-21*
*Component version: Current (with paddingTop: 20, height: +80)*
