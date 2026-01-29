# iOS 26 Liquid Glass Background System - Research Document

## Executive Summary

This document contains comprehensive research findings for implementing a background selection system for the Heirclark nutrition app, supporting iOS 26 Liquid Glass aesthetic with dark/light mode support.

---

## Phase 1: iOS 26 Liquid Glass Guidelines

### 1.1 Official Apple Documentation Summary

**Source:** [Apple Developer - Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass)

Liquid Glass is Apple's unified visual theme announced at WWDC 2025 (June 9, 2025) for iOS 26, iPadOS 26, macOS Tahoe 26, watchOS 26, tvOS 26, and visionOS 26.

#### Key Visual Characteristics:
- **Translucent material** that reflects and refracts surrounding content
- **Real-time light bending** (lensing) - concentrates light vs traditional blur that scatters
- **Specular highlights** responding to device motion
- **Adaptive shadows** and interactive behaviors
- **Dynamic adaptation** to background content, light conditions, and user interactions

#### Design Principles:
1. **Hierarchy**: Clear separation between content and controls
2. **Content Layer**: Sits beneath UI layer - best place for brand identity
3. **Contrast**: Controls sit on system material, not directly on content
4. **Legibility**: Without separation, contrast suffers

### 1.2 Technical Specifications

**Source:** [iOS 26 Liquid Glass Reference](https://github.com/conorluddy/LiquidGlassReference)

#### Performance Budgets:
| Device | Max Blur Radius | Max Compositing Layers |
|--------|-----------------|------------------------|
| iPhone | 40px | 4 per screen |
| iPad/Mac | 60px | 4 per screen |

#### Blur Intensity Recommendations:
- **Light blur**: 10-20 (subtle depth)
- **Medium blur**: 20-40 (standard glass cards)
- **Heavy blur**: 40-60 (modals, prominent overlays)

#### Accessibility Requirements:
- Minimum contrast ratio: **4.5:1** text/background after blur
- Honor system settings: Reduced Transparency, Reduced Motion, High Contrast
- Use Xcode Accessibility Inspector for validation

### 1.3 Material Vibrancy Guidelines

**Source:** [Apple HIG - Materials](https://developer-mdn.apple.com/design/human-interface-guidelines/foundations/materials/)

- Materials combine **blur + vibrancy** for depth perception
- Vibrancy pulls color from behind material to enhance depth
- Thicker materials = better contrast for fine text
- System adapts color/contrast to underlying content

---

## Phase 2: Competitor Analysis

### 2.1 Tier 1 - Direct Competitors (Nutrition/Calorie Apps)

| App | Background Type | Blur Intensity | Glass Style | Dark Mode |
|-----|-----------------|----------------|-------------|-----------|
| **Apple Health** | Solid color + subtle gradient | 20-30 | Native iOS materials | Yes, system-linked |
| **MyFitnessPal** | Solid white/dark | None | Flat cards | Yes |
| **Cronometer** | Warm solid colors | Minimal | Subtle shadows | Yes |
| **MacroFactor** | Clean solid | None | Flat with borders | Yes |
| **Noom** | Gradient accents | Light | Soft cards | Limited |
| **Lifesum** | Gradient headers | Light | Rounded cards | Yes |

**Key Findings:**
- Most nutrition apps use **solid backgrounds** for clarity
- Apple Health sets the standard with native materials
- Glassmorphism rarely used in production nutrition apps
- Dark mode is expected but often basic

### 2.2 Tier 2 - Premium Fitness Apps

| App | Background Type | Notable Effects |
|-----|-----------------|-----------------|
| **Nike Training Club** | Dark solid + video | High-contrast, content-focused |
| **Peloton** | Dark with gradient accents | Premium feel, minimal glass |
| **Strava** | Map + blur overlays | Functional blur for data overlay |
| **Future** | Luxury dark aesthetic | Subtle gradients |
| **Caliber** | Clean minimalist | Focus on data visibility |

**Key Findings:**
- Premium apps prioritize **readability over effects**
- Dark mode with subtle gradients = professional feel
- Video/image backgrounds only for hero sections

### 2.3 Tier 3 - Design Excellence (Glass UI Leaders)

| App | Glass Implementation |
|-----|---------------------|
| **Mercury Weather** | Full glassmorphism with weather imagery |
| **Flighty** | Premium glass cards over map backgrounds |
| **Linear** | Subtle glass with dark mode |
| **Airbnb** | Glass cards for search/filters |

**Key Findings:**
- Glassmorphism works best with **dynamic/visual content behind**
- Static apps (like nutrition trackers) benefit less from heavy glass
- Subtle glass + solid background = professional balance

---

## Phase 3: Technical Implementation Research

### 3.1 expo-blur Best Practices

**Source:** [Expo BlurView Documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/)

#### Platform Support:
- **iOS**: Native blur via UIVisualEffectView (smooth)
- **Android**: Experimental, can cause performance issues

#### Performance Optimization:
1. Keep blur area **as small as possible**
2. Avoid blur in scrolling lists (FlatList/SectionList)
3. Static blurs more performant than dynamic
4. Use `React.memo` or `useMemo` to prevent re-renders
5. Test on real devices, not emulators

#### Intensity Scale:
- 1-100 range
- Recommended: 20-80 for visible effect
- Animatable with react-native-reanimated

#### Implementation Notes:
```typescript
// Recommended pattern
<BlurView
  intensity={80}
  tint={isDark ? 'dark' : 'light'}
  style={[StyleSheet.absoluteFill, styles.glass]}
/>
```

### 3.2 Animated Backgrounds

**Source:** [React Native Skia + Reanimated](https://reactiive.io/articles/animated-gradient)

#### Recommended Approaches:
1. **Static Gradients**: `expo-linear-gradient` (best performance)
2. **Animated Gradients**: React Native Skia + Reanimated
3. **Lottie**: For complex animations (watch performance)

#### Lottie Performance Tips:
- Keep JSON files small (avoid heavy gradients/masks)
- Use `cacheStrategy="strong"` and `renderMode="HARDWARE"`
- Constrain width/height (don't render full-screen)
- Limit simultaneous Lottie instances

### 3.3 Image Optimization

For static background images:
- **Resolution**: 1290 x 2796 (iPhone 15 Pro Max)
- **Format**: PNG or WebP
- **File Size**: <500KB per image
- **Color Profile**: Display P3 for vibrancy

---

## Phase 4: Design Recommendations for Heirclark

### 4.1 Background Options (7 Total)

Based on research, these backgrounds complement the liquid glass aesthetic while maintaining readability:

| ID | Name | Type | Description | Best For |
|----|------|------|-------------|----------|
| `default` | Solid | Color | App's current solid background | Users preferring minimal |
| `wellness-gradient` | Gradient | LinearGradient | Soft teal/purple mesh | Default recommendation |
| `aurora` | Gradient | LinearGradient | Northern lights effect | Active/energetic users |
| `organic-blobs` | Gradient | LinearGradient | Soft organic shapes | Wellness-focused |
| `geometric` | Gradient | LinearGradient | Subtle 3D depth | Professional users |
| `noise-texture` | Gradient | LinearGradient + noise | Film grain aesthetic | Premium feel |
| `dynamic` | Animated | Lottie | Slow-moving particles | Wow factor (battery cost) |

### 4.2 Color Palettes by Background

#### Wellness Gradient (Default)
- **Light Mode**: `#E8F5F3` → `#F3E8F5` → `#FFF5EB`
- **Dark Mode**: `#0A1A18` → `#180A1A` → `#1A150A`

#### Aurora
- **Light Mode**: `#E5FBE5` → `#E5E5FB` → `#FBE5E5`
- **Dark Mode**: `#051A05` → `#05051A` → `#1A0505`

#### Organic Blobs
- **Light Mode**: `#FFE5D9` → `#E0F5E9` → `#FFF8E1`
- **Dark Mode**: `#1A100A` → `#0A1A0F` → `#1A1805`

### 4.3 Glass Card Intensity Levels

| Level | Blur Intensity | Background Opacity | Use Case |
|-------|---------------|-------------------|----------|
| Subtle | 10 | 0.7 | Secondary cards, lists |
| Standard | 20 | 0.8 | Primary cards |
| Prominent | 30 | 0.85 | Modals, important actions |

### 4.4 Accessibility Compliance

1. All text must maintain **4.5:1 contrast** with blurred background
2. Respect `Reduce Transparency` system setting
3. Respect `Reduce Motion` (disable animated backgrounds)
4. Test with both light and dark backgrounds

---

## Phase 5: Implementation Architecture

### 5.1 File Structure

```
/constants
  └── backgrounds.ts          # Background definitions

/components
  └── BackgroundLayer.tsx     # Global background renderer
  └── BackgroundSelector.tsx  # Settings UI component

/contexts
  └── SettingsContext.tsx     # Already has backgroundImage field
```

### 5.2 State Management

**Existing Infrastructure:**
- `SettingsContext` already has `backgroundImage: string` field
- `setBackgroundImage(image: string)` method exists
- AsyncStorage persistence in place

**Required Updates:**
- Add background options constant
- Add BackgroundLayer component
- Update settings page UI

### 5.3 Integration Points

1. **_layout.tsx**: Add BackgroundLayer inside SettingsProvider
2. **settings.tsx**: Add background selector modal
3. **All screens**: Ensure transparent SafeAreaView backgrounds

---

## Phase 6: AI Image Generation Prompts

### Wellness Gradient (Primary)
```
Abstract mesh gradient background, soft flowing colors,
teal #4ECDC4 to purple #9B59B6 to warm peach #FFB6C1,
smooth organic shapes, iPhone wallpaper, 4K resolution,
minimal clean design, soft diffused lighting, no text,
blurred edges fading to solid color, Apple iOS aesthetic,
suitable for glassmorphism UI overlay
--ar 9:19 --v 6 --style raw
```

### Aurora Northern Lights
```
Northern lights aurora borealis abstract background,
soft green #2ECC71 purple #9B59B6 pink #FFB6C1 waves,
smooth flowing ribbons of light, iPhone wallpaper,
4K resolution, ethereal glow, no stars, minimal,
clean gradient transitions, soft focus, dreamlike,
suitable for dark mode app background
--ar 9:19 --v 6 --style raw
```

### Organic Blobs
```
Abstract organic blob shapes background, soft edges,
coral #FF6B6B sage green #4ECDC4 cream #FFF8E1 palette,
large flowing amorphous shapes, iPhone wallpaper,
4K resolution, modern minimalist, soft shadows,
Instagram wellness aesthetic, no patterns, clean
--ar 9:19 --v 6 --style raw
```

### Geometric Depth
```
Subtle 3D geometric shapes background, soft depth,
monochromatic gray to soft blue #3498DB gradient,
layered translucent polygons, iPhone wallpaper,
4K resolution, professional minimal design,
corporate wellness app aesthetic, subtle shadows
--ar 9:19 --v 6 --style raw
```

---

## Phase 7: Testing Checklist

### Functional Tests
- [ ] Background selector displays all options
- [ ] Selection persists after app restart
- [ ] Background visible on all pages
- [ ] Light/dark mode switching works
- [ ] Glass cards render correctly over all backgrounds

### Performance Tests
- [ ] No frame drops when scrolling
- [ ] App launch time acceptable
- [ ] Memory usage < 50MB increase
- [ ] Battery drain acceptable with animated option

### Accessibility Tests
- [ ] Contrast ratios pass WCAG AA (4.5:1)
- [ ] Reduce Motion setting respected
- [ ] VoiceOver/TalkBack compatible

### Device Tests
- [ ] iPhone SE (small screen)
- [ ] iPhone 15 Pro Max (large screen)
- [ ] Android mid-range device

---

## Sources

- [Apple Liquid Glass Documentation](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WWDC25: Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/)
- [iOS 26 Liquid Glass Reference](https://github.com/conorluddy/LiquidGlassReference)
- [Expo BlurView Documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [Glassmorphism Fitness App - Dribbble](https://dribbble.com/shots/22279119-Fitness-App-Glassmorphism-Design-Style)
- [Glassmorphism in 2025](https://www.everydayux.net/glassmorphism-apple-liquid-glass-interface-design/)
- [React Native Animated Gradients](https://reactiive.io/articles/animated-gradient)

---

*Document created: January 2026*
*For: Heirclark Health App Background Selection System*
