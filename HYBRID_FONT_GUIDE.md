# Hybrid Font System - Urbanist + SF Pro

## Overview

The app uses a **hybrid font approach** combining:
- **Urbanist** (Google Font) - for text and letters
- **SF Pro** (Apple System Font) - for numbers and numeric values

This provides:
- Professional typography with Urbanist's modern aesthetic
- Native iOS feel with SF Pro's optimized number rendering
- Improved readability for metrics, calories, steps, and all numeric data

---

## How It Works

### Font Configuration

In `constants/Theme.ts`:

```typescript
export const Fonts = {
  // Urbanist for text (letters)
  regular: 'Urbanist_400Regular',
  medium: 'Urbanist_500Medium',
  semiBold: 'Urbanist_600SemiBold',
  bold: 'Urbanist_700Bold',

  // SF Pro for numbers (iOS system font)
  numericRegular: Platform.select({
    ios: 'System',           // Uses SF Pro on iOS
    android: 'Urbanist_400Regular',  // Fallback
    default: 'Urbanist_400Regular',
  }),
  numericMedium: Platform.select({ ... }),
  numericSemiBold: Platform.select({ ... }),
  numericBold: Platform.select({ ... }),
};
```

---

## Using NumberText Component

### Basic Usage

```typescript
import { NumberText } from '../components/NumberText';

// Display calories
<NumberText weight="bold" style={{ fontSize: 48, color: Colors.text }}>
  1,450
</NumberText>

// Display steps
<NumberText weight="semiBold" style={{ fontSize: 24 }}>
  8,543 steps
</NumberText>

// Display protein
<NumberText weight="regular" style={{ fontSize: 16 }}>
  150g
</NumberText>
```

### Props

- `weight`: `'regular' | 'medium' | 'semiBold' | 'bold'` (default: `'regular'`)
- `style`: Standard React Native `TextStyle`
- All standard `TextProps` are supported

---

## When to Use NumberText

### ✅ Use NumberText for:

- Calorie counts: `1,450 kcal`
- Step counts: `8,543 steps`
- Macro values: `150g protein`, `250g carbs`
- Percentages: `75%`, `100%`
- Goal values: `2,200 / 2,500`
- Time values: `12:30`, `45 mins`
- Weights: `185 lbs`, `84 kg`
- Distances: `5.2 miles`, `8.4 km`
- Any numeric metrics or measurements

### ❌ Use regular Text for:

- Headings and titles: `"Daily Progress"`, `"Settings"`
- Labels: `"Calories"`, `"Protein"`, `"Steps"`
- Descriptions: `"Track your daily intake"`
- Button text: `"Save"`, `"Cancel"`, `"Log Meal"`
- Mixed text: `"Good Morning"`, `"Week 3 of 12"`

---

## Components Using NumberText

Already implemented:
- ✅ `CircularGauge.tsx` - Main value display
- ✅ `SemiCircularGauge.tsx` - Value and goal displays

Should be updated:
- 🔄 Dashboard calorie cards
- 🔄 Macro ring displays (protein, carbs, fat)
- 🔄 Step counter
- 🔄 Weekly progress numbers
- 🔄 Goal calculation results
- 🔄 Meal logging forms (calorie inputs)

---

## Platform Behavior

### iOS
- Uses **SF Pro** (system font) via `fontFamily: 'System'`
- Applies `fontVariant: ['tabular-nums']` for monospaced numbers
- Numbers align perfectly in tables and lists
- Native iOS aesthetic

### Android / Web
- Falls back to **Urbanist** for consistency
- Maintains visual hierarchy with weight variants
- Cross-platform compatibility

---

## Benefits

### Visual Consistency
- iOS users see Apple's native number font
- Android users see consistent Urbanist throughout
- No jarring font switches mid-sentence

### Readability
- SF Pro optimized for numeric clarity
- Tabular nums ensure alignment in columns
- Better at-a-glance metric scanning

### Performance
- System fonts load instantly on iOS
- No additional font files to download
- Smaller bundle size

---

## Migration Guide

### Before (Old Approach)
```typescript
<Text style={{ fontSize: 48, fontFamily: Fonts.bold, color: Colors.text }}>
  {value.toLocaleString()}
</Text>
```

### After (Hybrid Approach)
```typescript
<NumberText weight="bold" style={{ fontSize: 48, color: Colors.text }}>
  {value.toLocaleString()}
</NumberText>
```

### Mixed Content
```typescript
{/* Numbers only */}
<NumberText weight="semiBold">{calories}</NumberText>

{/* Mixed text and numbers - use separate components */}
<View style={{ flexDirection: 'row' }}>
  <Text style={styles.label}>Calories: </Text>
  <NumberText weight="bold">{calories}</NumberText>
  <Text style={styles.unit}> kcal</Text>
</View>
```

---

## Typography Scale Reference

Use these styles with NumberText:

```typescript
// Large metrics (dashboard main values)
<NumberText weight="bold" style={{ fontSize: 72 }}>1,450</NumberText>

// Medium metrics (card values)
<NumberText weight="semiBold" style={{ fontSize: 48 }}>150g</NumberText>

// Small metrics (inline values)
<NumberText weight="medium" style={{ fontSize: 24 }}>8,543</NumberText>

// Tiny metrics (footnotes, labels)
<NumberText weight="regular" style={{ fontSize: 16 }}>2,200</NumberText>
```

---

## Example: Complete Card

```typescript
import { NumberText } from '../components/NumberText';

export const CalorieCard = ({ consumed, goal }) => (
  <View style={styles.card}>
    <Text style={styles.title}>CALORIES</Text>

    {/* Main value - SF Pro on iOS */}
    <NumberText weight="bold" style={styles.mainValue}>
      {consumed.toLocaleString()}
    </NumberText>

    {/* Label - Urbanist */}
    <Text style={styles.unit}>kcal consumed</Text>

    {/* Goal - SF Pro on iOS */}
    <Text style={styles.goal}>
      of <NumberText weight="regular">{goal.toLocaleString()}</NumberText> goal
    </Text>
  </View>
);
```

---

## Best Practices

1. **Always use NumberText for pure numeric values**
   - Use it when 80%+ of the content is numbers
   - Example: `1,450`, `150g`, `75%`

2. **Use regular Text for labels + numbers**
   - Keep labels in Urbanist for consistency
   - Example: `"Protein: "` (Text) + `"150g"` (NumberText)

3. **Maintain weight consistency**
   - Bold main values: `weight="bold"`
   - Regular supporting values: `weight="regular"`
   - Match visual hierarchy

4. **Format numbers consistently**
   - Use `.toLocaleString()` for thousands separators
   - Example: `1450` → `"1,450"`

5. **Test on iOS device**
   - Verify SF Pro renders correctly
   - Check tabular num alignment
   - Ensure readability at all sizes

---

## Troubleshooting

### Numbers look the same as text
- ✅ Verify you're testing on iOS (Android uses Urbanist fallback)
- ✅ Check that `fontVariant: ['tabular-nums']` is applied
- ✅ Ensure `weight` prop is set correctly

### Alignment issues in tables
- ✅ Use `weight="regular"` or `weight="medium"` for tables
- ✅ Ensure `fontVariant: ['tabular-nums']` is present
- ✅ Set consistent `fontSize` for all rows

### Font weight not working
- ✅ Check that Urbanist fonts are loaded in `_layout.tsx`
- ✅ Verify weight prop: `'regular' | 'medium' | 'semiBold' | 'bold'`
- ✅ Test on device, not just simulator

---

## Future Enhancements

- [ ] Auto-detect numbers in mixed text
- [ ] Support for decimal places (e.g., `150.5g`)
- [ ] Animated number transitions
- [ ] Currency formatting ($1,450.00)
- [ ] Percentage calculations (75% of goal)

---

**Last Updated:** January 2026
**Status:** ✅ Production Ready
