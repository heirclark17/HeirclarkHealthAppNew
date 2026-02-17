// Background Selection System - iOS 26 Liquid Glass Aesthetic
// Defines available backgrounds with light/dark mode variants
// Includes gradient and pattern backgrounds optimized for frosted glass overlays

import { ImageSourcePropType } from 'react-native';

// Pattern types from PatternBackground component
export type PatternType =
  | 'noise-grain'
  | 'geometric-hexagons'
  | 'organic-blobs'
  | 'topographic'
  | 'waves'
  | 'dots-grid'
  | 'circuit-board'
  | 'mesh-gradient'
  | 'bokeh'
  | 'crystals'
  | 'marble'
  | 'water-ripples'
  | 'fabric-weave'
  | 'starfield'
  | 'aurora-bands'
  | 'midnight-gold-leopard'
  | 'classic-safari-leopard'
  | 'snow-leopard-frost'
  | 'rose-gold-leopard'
  | 'obsidian-leopard'
  | 'cheetah-luxe'
  // Holiday patterns
  | 'christmas-festive'
  | 'halloween-spooky'
  | 'thanksgiving-harvest'
  | 'fourth-of-july'
  | 'valentines-hearts'
  | 'easter-spring'
  | 'cinco-de-mayo';

export type BackgroundId =
  | 'default'
  // Sand theme backgrounds (warm beige/cream)
  | 'sand-warm'
  | 'sand-tan'
  | 'sand-cream'
  // Pattern backgrounds (NEW - actual textures/pictures)
  | 'pattern-noise'
  | 'pattern-hexagons'
  | 'pattern-blobs'
  | 'pattern-topographic'
  | 'pattern-waves'
  | 'pattern-dots'
  | 'pattern-circuit'
  | 'pattern-mesh'
  | 'pattern-bokeh'
  | 'pattern-crystals'
  | 'pattern-marble'
  | 'pattern-ripples'
  | 'pattern-fabric'
  | 'pattern-stars'
  | 'pattern-aurora'
  | 'pattern-midnight-gold-leopard'
  | 'pattern-classic-safari-leopard'
  | 'pattern-snow-leopard-frost'
  | 'pattern-rose-gold-leopard'
  | 'pattern-obsidian-leopard'
  | 'pattern-cheetah-luxe'
  // Holiday pattern backgrounds
  | 'pattern-christmas-festive'
  | 'pattern-halloween-spooky'
  | 'pattern-thanksgiving-harvest'
  | 'pattern-fourth-of-july'
  | 'pattern-valentines-hearts'
  | 'pattern-easter-spring'
  | 'pattern-cinco-de-mayo'
  // Legacy gradient backgrounds
  | 'wellness-gradient'
  | 'aurora'
  | 'organic-blobs'
  | 'geometric'
  | 'noise-texture'
  | 'dynamic'
  // Nature backgrounds
  | 'forest-canopy'
  | 'ocean-depths'
  | 'desert-dunes'
  | 'mountain-mist'
  | 'tropical-paradise'
  | 'cherry-blossom'
  | 'autumn-leaves'
  | 'lavender-fields'
  | 'moss-garden'
  | 'sunset-horizon'
  // Weather backgrounds
  | 'rainy-day'
  | 'snow-fall'
  | 'foggy-morning'
  | 'storm-clouds'
  | 'clear-sky'
  // Animal prints
  | 'leopard-spots'
  | 'tiger-stripes'
  | 'zebra-pattern'
  | 'snake-scales'
  | 'peacock-feathers'
  | 'custom';

export type BackgroundType = 'solid' | 'gradient' | 'animated' | 'pattern';

export interface GradientColors {
  light: string[];
  dark: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export interface BackgroundOption {
  id: BackgroundId;
  name: string;
  description: string;
  type: BackgroundType;
  premium?: boolean;
  // Gradient colors for light/dark modes
  colors?: GradientColors;
  // For pattern backgrounds
  patternType?: PatternType;
  // For animated backgrounds
  lottieSource?: {
    light: any;
    dark: any;
  };
  // Category for organization in selector
  category?: 'pattern' | 'nature' | 'weather' | 'animal' | 'abstract' | 'holiday';
}

// Background gradient configurations optimized for glass overlay
export const BACKGROUNDS: BackgroundOption[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean solid background',
    type: 'solid',
  },

  // ============================================
  // PATTERN BACKGROUNDS (15) - Real textures!
  // These are SVG-based patterns that blur beautifully
  // ============================================
  {
    id: 'pattern-noise',
    name: 'Film Grain',
    description: 'Subtle noise texture like analog film',
    type: 'pattern',
    patternType: 'noise-grain',
    category: 'pattern',
  },
  {
    id: 'pattern-hexagons',
    name: 'Honeycomb',
    description: 'Geometric hexagonal grid pattern',
    type: 'pattern',
    patternType: 'geometric-hexagons',
    category: 'pattern',
  },
  {
    id: 'pattern-blobs',
    name: 'Lava Lamp',
    description: 'Organic flowing blob shapes',
    type: 'pattern',
    patternType: 'organic-blobs',
    category: 'pattern',
  },
  {
    id: 'pattern-topographic',
    name: 'Topo Map',
    description: 'Topographic contour lines',
    type: 'pattern',
    patternType: 'topographic',
    category: 'pattern',
  },
  {
    id: 'pattern-waves',
    name: 'Ocean Waves',
    description: 'Layered wave patterns',
    type: 'pattern',
    patternType: 'waves',
    category: 'pattern',
  },
  {
    id: 'pattern-dots',
    name: 'Dot Matrix',
    description: 'Halftone-style dot grid',
    type: 'pattern',
    patternType: 'dots-grid',
    category: 'pattern',
  },
  {
    id: 'pattern-circuit',
    name: 'Circuit Board',
    description: 'Tech-inspired circuit traces',
    type: 'pattern',
    patternType: 'circuit-board',
    category: 'pattern',
  },
  {
    id: 'pattern-mesh',
    name: 'Mesh Gradient',
    description: 'Multi-point gradient blending',
    type: 'pattern',
    patternType: 'mesh-gradient',
    category: 'pattern',
  },
  {
    id: 'pattern-bokeh',
    name: 'Bokeh Lights',
    description: 'Out-of-focus light circles',
    type: 'pattern',
    patternType: 'bokeh',
    category: 'pattern',
  },
  {
    id: 'pattern-crystals',
    name: 'Crystal Shards',
    description: 'Geometric crystal formations',
    type: 'pattern',
    patternType: 'crystals',
    category: 'pattern',
  },
  {
    id: 'pattern-marble',
    name: 'Marble Stone',
    description: 'Natural marble veining',
    type: 'pattern',
    patternType: 'marble',
    category: 'pattern',
  },
  {
    id: 'pattern-ripples',
    name: 'Water Ripples',
    description: 'Concentric water circles',
    type: 'pattern',
    patternType: 'water-ripples',
    category: 'pattern',
  },
  {
    id: 'pattern-fabric',
    name: 'Linen Texture',
    description: 'Woven fabric pattern',
    type: 'pattern',
    patternType: 'fabric-weave',
    category: 'pattern',
  },
  {
    id: 'pattern-stars',
    name: 'Starfield',
    description: 'Night sky with stars',
    type: 'pattern',
    patternType: 'starfield',
    category: 'pattern',
  },
  {
    id: 'pattern-aurora',
    name: 'Northern Lights',
    description: 'Aurora borealis bands',
    type: 'pattern',
    patternType: 'aurora-bands',
    category: 'pattern',
  },
  {
    id: 'pattern-midnight-gold-leopard',
    name: 'Midnight Gold Leopard',
    description: 'Luxe black & gold leopard print',
    type: 'pattern',
    patternType: 'midnight-gold-leopard',
    category: 'animal',
    premium: true,
  },
  {
    id: 'pattern-classic-safari-leopard',
    name: 'Classic Safari',
    description: 'Warm tan with brown rosettes',
    type: 'pattern',
    patternType: 'classic-safari-leopard',
    category: 'animal',
  },
  {
    id: 'pattern-snow-leopard-frost',
    name: 'Snow Leopard',
    description: 'Cool gray & white frost tones',
    type: 'pattern',
    patternType: 'snow-leopard-frost',
    category: 'animal',
  },
  {
    id: 'pattern-rose-gold-leopard',
    name: 'Rose Gold Leopard',
    description: 'Blush pink with rose gold',
    type: 'pattern',
    patternType: 'rose-gold-leopard',
    category: 'animal',
    premium: true,
  },
  {
    id: 'pattern-obsidian-leopard',
    name: 'Obsidian Leopard',
    description: 'Ultra-modern stealth monochrome',
    type: 'pattern',
    patternType: 'obsidian-leopard',
    category: 'animal',
  },
  {
    id: 'pattern-cheetah-luxe',
    name: 'Cheetah Luxe',
    description: 'Golden tan with gold accents',
    type: 'pattern',
    patternType: 'cheetah-luxe',
    category: 'animal',
    premium: true,
  },

  // ============================================
  // HOLIDAY PATTERNS (7) - Festive seasonal themes!
  // ============================================
  {
    id: 'pattern-christmas-festive',
    name: 'Christmas Festive',
    description: 'Red, green & gold with ornaments and snowflakes',
    type: 'pattern',
    patternType: 'christmas-festive',
    category: 'holiday',
  },
  {
    id: 'pattern-halloween-spooky',
    name: 'Halloween Spooky',
    description: 'Bats, pumpkins & spiderwebs',
    type: 'pattern',
    patternType: 'halloween-spooky',
    category: 'holiday',
  },
  {
    id: 'pattern-thanksgiving-harvest',
    name: 'Thanksgiving Harvest',
    description: 'Fall leaves, wheat & pumpkins',
    type: 'pattern',
    patternType: 'thanksgiving-harvest',
    category: 'holiday',
  },
  {
    id: 'pattern-fourth-of-july',
    name: 'Fourth of July',
    description: 'Patriotic stars & fireworks',
    type: 'pattern',
    patternType: 'fourth-of-july',
    category: 'holiday',
  },
  {
    id: 'pattern-valentines-hearts',
    name: "Valentine's Day",
    description: 'Romantic hearts & sparkles',
    type: 'pattern',
    patternType: 'valentines-hearts',
    category: 'holiday',
  },
  {
    id: 'pattern-easter-spring',
    name: 'Easter Spring',
    description: 'Pastel eggs, flowers & butterflies',
    type: 'pattern',
    patternType: 'easter-spring',
    category: 'holiday',
  },
  {
    id: 'pattern-cinco-de-mayo',
    name: 'Cinco de Mayo',
    description: 'Vibrant papel picado & marigolds',
    type: 'pattern',
    patternType: 'cinco-de-mayo',
    category: 'holiday',
  },

  // ============================================
  // SAND THEME (Warm Beige/Cream) - User Requested
  // ============================================
  {
    id: 'sand-warm',
    name: 'Sand',
    description: 'Warm beige and cream tones',
    type: 'gradient',
    category: 'abstract',
    colors: {
      light: ['#FAF6F1', '#F5EDE4', '#EDE5DB', '#FAF6F1'],
      dark: ['#2C2620', '#3D352D', '#4E443A', '#2C2620'],
      locations: [0, 0.35, 0.65, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
  {
    id: 'sand-tan',
    name: 'Sand Tan',
    description: 'Deeper parchment and tan tones',
    type: 'gradient',
    category: 'abstract',
    colors: {
      light: ['#F5EDE4', '#EDE5DB', '#E5DDD2', '#F5EDE4'],
      dark: ['#3D352D', '#4E443A', '#5A4F44', '#3D352D'],
      locations: [0, 0.35, 0.65, 1],
      start: { x: 0.2, y: 0 },
      end: { x: 0.8, y: 1 },
    },
  },
  {
    id: 'sand-cream',
    name: 'Sand Cream',
    description: 'Light warm cream palette',
    type: 'gradient',
    category: 'abstract',
    colors: {
      light: ['#FFFCF8', '#FAF6F1', '#F5EDE4', '#FFFCF8'],
      dark: ['#1E1A16', '#2C2620', '#3D352D', '#1E1A16'],
      locations: [0, 0.35, 0.65, 1],
      start: { x: 0.1, y: 0.1 },
      end: { x: 0.9, y: 0.9 },
    },
  },

  // ============================================
  // ABSTRACT GRADIENTS (6)
  // ============================================
  {
    id: 'wellness-gradient',
    name: 'Wellness',
    description: 'Calming teal and purple tones',
    type: 'gradient',
    category: 'abstract',
    colors: {
      light: ['#E8F5F3', '#EDE8F5', '#F5EDE8', '#F8F5F0'],
      dark: ['#0A1514', '#100A14', '#14100A', '#0D0D0D'],
      locations: [0, 0.3, 0.6, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
  {
    id: 'aurora',
    name: 'Aurora Gradient',
    description: 'Northern lights inspired',
    type: 'gradient',
    category: 'abstract',
    colors: {
      light: ['#E5F5EC', '#E8E5F5', '#F5E8EC', '#F0F5F0'],
      dark: ['#051A10', '#0A0518', '#180510', '#0A0A0A'],
      locations: [0, 0.35, 0.7, 1],
      start: { x: 0.2, y: 0 },
      end: { x: 0.8, y: 1 },
    },
  },
  {
    id: 'organic-blobs',
    name: 'Organic',
    description: 'Soft flowing shapes',
    type: 'gradient',
    category: 'abstract',
    colors: {
      light: ['#FFF0EB', '#EBF5EE', '#F5F0E5', '#FFFAF5'],
      dark: ['#1A0F0A', '#0A140D', '#14120A', '#0D0D0A'],
      locations: [0, 0.4, 0.75, 1],
      start: { x: 0.3, y: 0 },
      end: { x: 0.7, y: 1 },
    },
  },
  {
    id: 'geometric',
    name: 'Geometric',
    description: 'Subtle 3D depth',
    type: 'gradient',
    category: 'abstract',
    colors: {
      light: ['#F0F2F5', '#E8EEF5', '#F5F5F8', '#FAFBFC'],
      dark: ['#0A0B0D', '#08090D', '#0D0D10', '#0A0A0A'],
      locations: [0, 0.5, 0.8, 1],
      start: { x: 0, y: 0.2 },
      end: { x: 1, y: 0.8 },
    },
  },
  {
    id: 'noise-texture',
    name: 'Texture',
    description: 'Film grain aesthetic',
    type: 'gradient',
    category: 'abstract',
    colors: {
      light: ['#F5EEE6', '#EAE6F0', '#F0F0F5', '#FAF8F5'],
      dark: ['#14100A', '#0D0A10', '#101014', '#0D0D0D'],
      locations: [0, 0.4, 0.7, 1],
      start: { x: 0.1, y: 0.1 },
      end: { x: 0.9, y: 0.9 },
    },
  },
  {
    id: 'dynamic',
    name: 'Dynamic',
    description: 'Animated particles',
    type: 'animated',
    premium: true,
    category: 'abstract',
    colors: {
      // Fallback gradient when animation disabled
      light: ['#E8F0F5', '#F0E8F5', '#F5F0E8', '#F5F5F5'],
      dark: ['#0A1014', '#100A14', '#14100A', '#0A0A0A'],
      locations: [0, 0.33, 0.66, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },

  // ============================================
  // NATURE BACKGROUNDS (10)
  // ============================================
  {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    description: 'Deep emerald forest tones',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#E8F5ED', '#EDF5E8', '#E8F0EB', '#F0F8F5'],
      dark: ['#0A1410', '#0D140A', '#0A100D', '#0A0F0D'],
      locations: [0, 0.3, 0.65, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    description: 'Tranquil deep blue waters',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#E5F0F5', '#E8F5F8', '#EBF8FA', '#F0FAFC'],
      dark: ['#051014', '#081418', '#0A181A', '#0D1A1C'],
      locations: [0, 0.4, 0.7, 1],
      start: { x: 0.3, y: 0 },
      end: { x: 0.7, y: 1 },
    },
  },
  {
    id: 'desert-dunes',
    name: 'Desert Dunes',
    description: 'Warm sand and earth tones',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#FAF5ED', '#F8F0E5', '#F5EDE0', '#FFF8F0'],
      dark: ['#1A140D', '#18100A', '#140D08', '#1C1610'],
      locations: [0, 0.35, 0.65, 1],
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    },
  },
  {
    id: 'mountain-mist',
    name: 'Mountain Mist',
    description: 'Cool misty mountain air',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#F0F2F5', '#EDF0F5', '#E8EDF2', '#F5F8FA'],
      dark: ['#0D0E10', '#0A0D10', '#080B0E', '#10121A'],
      locations: [0, 0.4, 0.75, 1],
      start: { x: 0, y: 0.3 },
      end: { x: 1, y: 0.7 },
    },
  },
  {
    id: 'tropical-paradise',
    name: 'Tropical Paradise',
    description: 'Vibrant tropical greens',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#E8F8F0', '#EDF8F5', '#F0FAF5', '#F5FFF8'],
      dark: ['#081810', '#0D180F', '#0A1A10', '#0D1F12'],
      locations: [0, 0.3, 0.6, 1],
      start: { x: 0.1, y: 0 },
      end: { x: 0.9, y: 1 },
    },
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: 'Soft pink sakura petals',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#FFF0F5', '#FFEEF5', '#FFE8F0', '#FFF5FA'],
      dark: ['#1A0D10', '#180C0F', '#14080D', '#1C1014'],
      locations: [0, 0.35, 0.7, 1],
      start: { x: 0.2, y: 0 },
      end: { x: 0.8, y: 1 },
    },
  },
  {
    id: 'autumn-leaves',
    name: 'Autumn Leaves',
    description: 'Warm fall color palette',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#FFF0E5', '#FFF5EB', '#FFEEE0', '#FFF8F0'],
      dark: ['#1A0F05', '#1C140A', '#180D00', '#1A1410'],
      locations: [0, 0.3, 0.65, 1],
      start: { x: 0, y: 0.2 },
      end: { x: 1, y: 0.8 },
    },
  },
  {
    id: 'lavender-fields',
    name: 'Lavender Fields',
    description: 'Serene purple meadows',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#F0E8F8', '#F5F0FA', '#F8F5FC', '#FAFAFE'],
      dark: ['#0D080F', '#0F0A12', '#12101A', '#14121C'],
      locations: [0, 0.4, 0.7, 1],
      start: { x: 0.3, y: 0 },
      end: { x: 0.7, y: 1 },
    },
  },
  {
    id: 'moss-garden',
    name: 'Moss Garden',
    description: 'Soft earthy green tones',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#EEF5E8', '#F0F5ED', '#F5F8F0', '#F8FAF5'],
      dark: ['#0C100A', '#0D120C', '#10140D', '#12140F'],
      locations: [0, 0.35, 0.7, 1],
      start: { x: 0.1, y: 0.1 },
      end: { x: 0.9, y: 0.9 },
    },
  },
  {
    id: 'sunset-horizon',
    name: 'Sunset Horizon',
    description: 'Golden hour warmth',
    type: 'gradient',
    category: 'nature',
    colors: {
      light: ['#FFF5E5', '#FFEDE8', '#FFE8F0', '#FFF0F5'],
      dark: ['#1A1005', '#1C0D08', '#18080D', '#1A0D10'],
      locations: [0, 0.3, 0.65, 1],
      start: { x: 0, y: 0.4 },
      end: { x: 1, y: 0.6 },
    },
  },

  // ============================================
  // WEATHER BACKGROUNDS (5)
  // ============================================
  {
    id: 'rainy-day',
    name: 'Rainy Day',
    description: 'Cool misty rain vibes',
    type: 'gradient',
    category: 'weather',
    colors: {
      light: ['#E8EDF2', '#EDF2F5', '#F0F5F8', '#F5F8FA'],
      dark: ['#080B0E', '#0A0D10', '#0D1014', '#0F1216'],
      locations: [0, 0.4, 0.7, 1],
      start: { x: 0.2, y: 0 },
      end: { x: 0.8, y: 1 },
    },
  },
  {
    id: 'snow-fall',
    name: 'Snow Fall',
    description: 'Pristine winter white',
    type: 'gradient',
    category: 'weather',
    colors: {
      light: ['#F5F8FA', '#F8FAFC', '#FAFCFE', '#FCFEFF'],
      dark: ['#0D1014', '#0F1216', '#12141A', '#14161C'],
      locations: [0, 0.35, 0.65, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
  {
    id: 'foggy-morning',
    name: 'Foggy Morning',
    description: 'Soft misty atmosphere',
    type: 'gradient',
    category: 'weather',
    colors: {
      light: ['#F0F2F5', '#F2F5F8', '#F5F8FA', '#F8FAFC'],
      dark: ['#0A0C0F', '#0C0E12', '#0E1014', '#10121A'],
      locations: [0, 0.3, 0.6, 1],
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.7, y: 0.7 },
    },
  },
  {
    id: 'storm-clouds',
    name: 'Storm Clouds',
    description: 'Dramatic stormy skies',
    type: 'gradient',
    category: 'weather',
    colors: {
      light: ['#E5E8ED', '#E8EBF0', '#EBEEF2', '#EDF0F5'],
      dark: ['#050608', '#08090C', '#0A0C0F', '#0C0E12'],
      locations: [0, 0.35, 0.65, 1],
      start: { x: 0.1, y: 0.2 },
      end: { x: 0.9, y: 0.8 },
    },
  },
  {
    id: 'clear-sky',
    name: 'Clear Sky',
    description: 'Bright sunny day blue',
    type: 'gradient',
    category: 'weather',
    colors: {
      light: ['#E5F2FF', '#EBF5FF', '#F0F8FF', '#F5FAFF'],
      dark: ['#05101A', '#0A1420', '#0D1825', '#101C2A'],
      locations: [0, 0.3, 0.6, 1],
      start: { x: 0, y: 0.2 },
      end: { x: 1, y: 0.8 },
    },
  },

  // ============================================
  // ANIMAL PRINT BACKGROUNDS (5)
  // ============================================
  {
    id: 'leopard-spots',
    name: 'Leopard Spots',
    description: 'Elegant golden leopard',
    type: 'gradient',
    category: 'animal',
    colors: {
      light: ['#FFF5E8', '#FFF0E0', '#FFEBD5', '#FFF8F0'],
      dark: ['#1A1408', '#1C1005', '#180C00', '#1A1410'],
      locations: [0, 0.3, 0.6, 1],
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    },
  },
  {
    id: 'tiger-stripes',
    name: 'Tiger Stripes',
    description: 'Bold tiger pattern',
    type: 'gradient',
    category: 'animal',
    colors: {
      light: ['#FFF0E5', '#FFEBDD', '#FFE5D0', '#FFF5EB'],
      dark: ['#1A0F05', '#1C0A00', '#180500', '#1A1008'],
      locations: [0, 0.35, 0.65, 1],
      start: { x: 0.1, y: 0 },
      end: { x: 0.9, y: 1 },
    },
  },
  {
    id: 'zebra-pattern',
    name: 'Zebra Pattern',
    description: 'Classic black and white',
    type: 'gradient',
    category: 'animal',
    colors: {
      light: ['#F5F5F5', '#F0F0F0', '#EBEBEB', '#F8F8F8'],
      dark: ['#0D0D0D', '#0A0A0A', '#080808', '#101010'],
      locations: [0, 0.3, 0.6, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
  {
    id: 'snake-scales',
    name: 'Snake Scales',
    description: 'Iridescent reptilian',
    type: 'gradient',
    category: 'animal',
    colors: {
      light: ['#E8F5F0', '#EDF8F5', '#F0FAF8', '#F5FFFC'],
      dark: ['#081410', '#0A180F', '#0D1A12', '#0F1C14'],
      locations: [0, 0.35, 0.65, 1],
      start: { x: 0.3, y: 0 },
      end: { x: 0.7, y: 1 },
    },
  },
  {
    id: 'peacock-feathers',
    name: 'Peacock Feathers',
    description: 'Vibrant blue and teal',
    type: 'gradient',
    category: 'animal',
    colors: {
      light: ['#E5F5F8', '#E8F8FA', '#EBF8FC', '#F0FAFE'],
      dark: ['#051418', '#081820', '#0A1A25', '#0D1C28'],
      locations: [0, 0.3, 0.6, 1],
      start: { x: 0.2, y: 0.1 },
      end: { x: 0.8, y: 0.9 },
    },
  },
];

// Get background by ID
export function getBackgroundById(id: BackgroundId): BackgroundOption | undefined {
  return BACKGROUNDS.find(bg => bg.id === id);
}

// Get gradient colors for current theme
export function getGradientColors(
  background: BackgroundOption | undefined,
  isDark: boolean
): string[] {
  if (!background?.colors) {
    // Return solid color fallback
    return isDark
      ? ['#000000', '#000000']
      : ['#F5F5F7', '#F5F5F7'];
  }
  return isDark ? background.colors.dark : background.colors.light;
}

// Get backgrounds by category
export function getBackgroundsByCategory(category: BackgroundOption['category']): BackgroundOption[] {
  return BACKGROUNDS.filter(bg => bg.category === category);
}

// Get pattern backgrounds only
export function getPatternBackgrounds(): BackgroundOption[] {
  return BACKGROUNDS.filter(bg => bg.type === 'pattern');
}

// Default background ID
export const DEFAULT_BACKGROUND: BackgroundId = 'default';
