# 🎨 Heirclark Landing Page - iOS 26 Liquid Glass Design

## Overview

A stunning marketing landing page featuring the **iOS 26 Liquid Glass aesthetic** with:
- ✨ Frosted glass blur effects and translucent materials
- 🎭 Premium animations and micro-interactions
- 📱 Responsive design (mobile, tablet, desktop)
- 🚀 Scroll-triggered animations
- 💎 Refined minimalist design with generous white space

## File Location

```
C:\Users\derri\HeirclarkHealthAppNew\landing-page.html
```

## Quick Start

1. **Open in browser:**
   - Double-click `landing-page.html`
   - Or drag into Chrome/Safari/Edge

2. **View locally:**
   ```bash
   cd C:\Users\derri\HeirclarkHealthAppNew
   # Use any local server, e.g.:
   npx serve .
   # Then open http://localhost:3000/landing-page.html
   ```

## 📸 Adding App Screenshots

The page has **placeholder boxes** for screenshots. Replace them with actual app screenshots:

### Screenshot Locations

#### 1. **Hero Phone Mockup** (Line 849)
```html
<div class="screenshot-placeholder">
  Add App Screenshot Here<br/>
  (9:19.5 ratio)
</div>
```

**Replace with:**
```html
<img
  src="./screenshots/hero-screenshot.png"
  alt="Heirclark App Home Screen"
  style="width: 100%; height: 100%; object-fit: cover;"
/>
```

**Recommended screenshot:** Home dashboard or goals screen
**Aspect ratio:** 9:19.5 (iPhone dimensions)
**Size:** 1170x2532px (iPhone 14 Pro)

---

#### 2. **Feature 1: AI Meal Planning** (Line 993)
```html
<div class="feature-image">
  <!-- Add screenshot of meal planning interface -->
</div>
```

**Replace with:**
```html
<div class="feature-image">
  <img
    src="./screenshots/meal-plan.png"
    alt="AI Meal Planning Interface"
    style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-lg);"
  />
</div>
```

**Recommended screenshot:** Meal plan screen showing:
- Weekly meal calendar
- Macro breakdown
- AI-generated meals

---

#### 3. **Feature 2: Smart Training Programs** (Line 1025)
```html
<div class="feature-image">
  <!-- Add screenshot of training program interface -->
</div>
```

**Replace with:**
```html
<div class="feature-image">
  <img
    src="./screenshots/training-program.png"
    alt="Training Program Interface"
    style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-lg);"
  />
</div>
```

**Recommended screenshot:** Programs tab showing:
- Week X of Y header
- Workout cards with exercises
- Progress indicators

---

#### 4. **Feature 3: AI Day Planner** (Line 1057)
```html
<div class="feature-image">
  <!-- Add screenshot of day planner interface -->
</div>
```

**Replace with:**
```html
<div class="feature-image">
  <img
    src="./screenshots/day-planner.png"
    alt="AI Day Planner Interface"
    style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-lg);"
  />
</div>
```

**Recommended screenshot:** Planner tab showing:
- Daily timeline with blocks
- Workout and meal scheduling
- Calendar integration

---

#### 5. **Feature 4: Apple Health Sync** (Line 1089)
```html
<div class="feature-image">
  <!-- Add screenshot of health dashboard -->
</div>
```

**Replace with:**
```html
<div class="feature-image">
  <img
    src="./screenshots/health-dashboard.png"
    alt="Apple Health Dashboard"
    style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-lg);"
  />
</div>
```

**Recommended screenshot:** Steps/Health tab showing:
- Agent cards (Steps, Calories, Sleep)
- Apple Health integration
- Progress rings

---

## 📂 Organizing Screenshots

### Recommended Folder Structure

```
HeirclarkHealthAppNew/
├── landing-page.html
├── screenshots/
│   ├── hero-screenshot.png       (1170x2532px - iPhone mockup)
│   ├── meal-plan.png             (1200x800px - landscape)
│   ├── training-program.png      (1200x800px - landscape)
│   ├── day-planner.png           (1200x800px - landscape)
│   └── health-dashboard.png      (1200x800px - landscape)
```

### Creating Screenshot Folder

```bash
cd C:\Users\derri\HeirclarkHealthAppNew
mkdir screenshots
```

---

## 🎨 Design Specifications

### Typography
- **Display Font:** SF Pro Display (system-ui fallback)
- **Rounded Numbers:** SF Pro Rounded
- **Body Text:** SF Pro Text
- **Hero Headline:** 48-84px (responsive)
- **Section Headings:** 36-56px
- **Feature Headings:** 28-42px
- **Body Text:** 19-21px

### Colors
- **Primary:** #007AFF (iOS blue)
- **Accent:** #5E5CE6 (purple)
- **Success:** #34C759 (green)
- **Gradients:** Purple-to-pink, blue-to-purple
- **Glass:** rgba(255, 255, 255, 0.72) with backdrop blur

### Animations
- **Fade In Up:** Feature cards, stats
- **Float:** Hero phone mockup (6s loop)
- **Slide Down:** Header (on page load)
- **Hover States:** Buttons, cards, links
- **Number Animation:** Stats count up on scroll

### Spacing
- **Section Padding:** 80-160px (responsive)
- **Card Padding:** 32-48px (responsive)
- **Border Radius:** 12px (small), 20px (medium), 32px (large), 48px (xl)

---

## 🖼️ Taking App Screenshots

### Using iOS Simulator (Recommended)

1. **Open your app in Xcode simulator:**
   ```bash
   cd C:\Users\derri\HeirclarkHealthAppNew
   npx expo start --ios
   ```

2. **Take screenshots:**
   - **macOS:** `Cmd + S` in Simulator
   - Screenshots save to Desktop

3. **Crop/resize:**
   - Use Preview or Photoshop
   - Target: 1170x2532px for phone mockup
   - Target: 1200x800px for feature images

### Using Physical iPhone

1. **Open TestFlight app**
2. **Navigate to desired screen**
3. **Take screenshot:**
   - iPhone 14+: Volume Up + Side Button
   - iPhone 8: Home + Side Button
4. **AirDrop to Mac**
5. **Resize as needed**

### Using Screen Recording Tools

1. **QuickTime Screen Recording:**
   - Connect iPhone via USB
   - QuickTime → File → New Movie Recording
   - Select iPhone as source
   - Pause at desired frame, export image

2. **Design Tools:**
   - Use Figma/Sketch to create polished mockups
   - Add device frames with [Mockuphone](https://mockuphone.com/)

---

## 🎯 Customization Guide

### Update Stats (Line 1108-1127)

```html
<div class="stat-number">10K+</div>
<div class="stat-label">Meal Plans Generated</div>
```

**Change numbers to reflect real usage data**

### Update Feature Highlights

Each feature has 4 highlight items with icons and text. Customize to match your app's capabilities.

Example (Line 971-988):
```html
<div class="highlight-item">
  <div class="highlight-icon">🍽️</div>
  <div class="highlight-text">Custom meal plans tailored to your macros</div>
</div>
```

### Update Footer Links

Add your actual URLs (Line 1184-1212):
```html
<li><a href="#">About</a></li>
<li><a href="#">Blog</a></li>
```

### Add Social Media Links

Update social links (Line 1217-1221):
```html
<a href="https://twitter.com/heirclark" aria-label="Twitter">𝕏</a>
<a href="https://instagram.com/heirclark" aria-label="Instagram">📷</a>
<a href="https://linkedin.com/company/heirclark" aria-label="LinkedIn">in</a>
```

---

## 🌐 Deployment Options

### 1. **GitHub Pages** (Free)

```bash
cd C:\Users\derri\HeirclarkHealthAppNew
git add landing-page.html screenshots/
git commit -m "Add iOS 26 Liquid Glass landing page"
git push origin master

# Enable GitHub Pages:
# GitHub → Settings → Pages → Source: master branch
# URL: https://heirclark17.github.io/HeirclarkHealthAppNew/landing-page.html
```

### 2. **Netlify** (Free, Custom Domain)

1. Drag `landing-page.html` + `screenshots/` folder to [Netlify Drop](https://app.netlify.com/drop)
2. Get instant URL: `https://[random-name].netlify.app`
3. Add custom domain (optional)

### 3. **Vercel** (Free, Fast CDN)

```bash
npm install -g vercel
cd C:\Users\derri\HeirclarkHealthAppNew
vercel
# Follow prompts, deploys in seconds
```

### 4. **Custom Domain**

After deploying, point your domain (e.g., `heirclark.com`) to:
- GitHub Pages: CNAME record
- Netlify: Automatic SSL + DNS
- Vercel: Automatic SSL + DNS

---

## 📱 Mobile Optimization

The page is **fully responsive** with breakpoints:
- **Desktop:** 1024px+
- **Tablet:** 768px - 1023px
- **Mobile:** < 768px

**Mobile adjustments:**
- Hero: Stacked layout
- Features: Single column
- Nav: Simplified (no links on mobile)
- Footer: Single column

---

## 🎬 Animation Details

### Scroll Animations
- **Feature cards:** Fade in up when scrolling into view
- **Stats:** Fade in + number count animation
- **Threshold:** 10% visible with 100px bottom margin

### Hover Effects
- **Buttons:** Lift 2px + shadow increase
- **Highlight items:** Slide right 8px
- **Social links:** Lift 2px + background change

### Page Load
- **Header:** Slide down from top (0.6s)
- **Hero:** Staggered fade in (text → eyebrow → CTA → visual)
- **Phone mockup:** Continuous float animation (6s loop)

---

## ✅ Pre-Launch Checklist

Before deploying to production:

- [ ] Replace all 5 screenshot placeholders with actual app images
- [ ] Update stats with real numbers
- [ ] Add actual App Store link (replace `#` in Download buttons)
- [ ] Update footer links with real URLs
- [ ] Add social media links
- [ ] Test on mobile (Chrome DevTools responsive mode)
- [ ] Test on actual iPhone/iPad
- [ ] Optimize screenshot file sizes (use TinyPNG)
- [ ] Add favicon (add `<link rel="icon">` in `<head>`)
- [ ] Add Open Graph meta tags for social sharing
- [ ] Test all scroll animations
- [ ] Verify all links work

---

## 🚀 Performance Tips

1. **Optimize Images:**
   ```bash
   # Use TinyPNG or ImageOptim
   # Target: <200KB per screenshot
   ```

2. **Lazy Load Images:**
   ```html
   <img src="..." loading="lazy" alt="...">
   ```

3. **Minify HTML** (optional):
   - Use [HTML Minifier](https://www.willpeavy.com/tools/minifier/)
   - Reduces file size by 20-30%

4. **Enable Caching:**
   - Add `.htaccess` (Apache) or `_headers` (Netlify)
   - Cache static assets for 1 year

---

## 🎨 Design Credits

**Aesthetic:** iOS 26 Liquid Glass
**Inspiration:** Apple.com, iOS design language
**Typography:** SF Pro system fonts
**Color Palette:** iOS system colors + custom gradients
**Effects:** Frosted glass blur, translucent materials, soft shadows

---

## 📧 Support

Questions or customization requests?
- **Email:** derrick88clark@yahoo.com
- **Project:** Heirclark Health App
- **Version:** 1.0

---

**Last Updated:** February 20, 2026
**Status:** ✅ Ready for screenshots & deployment
