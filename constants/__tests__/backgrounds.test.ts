import {
  BACKGROUNDS,
  getBackgroundById,
  getGradientColors,
  getBackgroundsByCategory,
  getPatternBackgrounds,
  DEFAULT_BACKGROUND,
  BackgroundId,
  BackgroundType,
  PatternType,
} from '../backgrounds';

describe('Backgrounds Constants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BACKGROUNDS Array', () => {
    it('should be defined and be an array', () => {
      expect(BACKGROUNDS).toBeDefined();
      expect(Array.isArray(BACKGROUNDS)).toBe(true);
    });

    it('should have at least one background', () => {
      expect(BACKGROUNDS.length).toBeGreaterThan(0);
    });

    it('should have required properties in each background', () => {
      BACKGROUNDS.forEach((bg) => {
        expect(bg).toHaveProperty('id');
        expect(bg).toHaveProperty('name');
        expect(bg).toHaveProperty('description');
        expect(bg).toHaveProperty('type');
        expect(typeof bg.id).toBe('string');
        expect(typeof bg.name).toBe('string');
        expect(typeof bg.description).toBe('string');
        expect(['solid', 'gradient', 'animated', 'pattern']).toContain(bg.type);
      });
    });

    it('should have no duplicate background IDs', () => {
      const ids = BACKGROUNDS.map((bg) => bg.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have default background', () => {
      const defaultBg = BACKGROUNDS.find((bg) => bg.id === 'default');
      expect(defaultBg).toBeDefined();
      expect(defaultBg?.name).toBe('Default');
    });

    it('should have pattern backgrounds', () => {
      const patternBgs = BACKGROUNDS.filter((bg) => bg.type === 'pattern');
      expect(patternBgs.length).toBeGreaterThan(0);
    });

    it('should have gradient backgrounds', () => {
      const gradientBgs = BACKGROUNDS.filter((bg) => bg.type === 'gradient');
      expect(gradientBgs.length).toBeGreaterThan(0);
    });
  });

  describe('Background Categories', () => {
    it('should have backgrounds with valid categories', () => {
      const validCategories = ['pattern', 'nature', 'weather', 'animal', 'abstract', 'holiday'];
      BACKGROUNDS.forEach((bg) => {
        if (bg.category) {
          expect(validCategories).toContain(bg.category);
        }
      });
    });

    it('should have at least one background per major category', () => {
      const categories = ['pattern', 'abstract', 'nature'];
      categories.forEach((category) => {
        const bgsInCategory = BACKGROUNDS.filter((bg) => bg.category === category);
        expect(bgsInCategory.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Gradient Colors', () => {
    it('should have light and dark arrays in gradient colors', () => {
      BACKGROUNDS.filter((bg) => bg.colors).forEach((bg) => {
        expect(bg.colors).toHaveProperty('light');
        expect(bg.colors).toHaveProperty('dark');
        expect(Array.isArray(bg.colors!.light)).toBe(true);
        expect(Array.isArray(bg.colors!.dark)).toBe(true);
      });
    });

    it('should have matching array lengths for light and dark colors', () => {
      BACKGROUNDS.filter((bg) => bg.colors).forEach((bg) => {
        expect(bg.colors!.light.length).toBe(bg.colors!.dark.length);
      });
    });

    it('should have valid color strings in gradient arrays', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      BACKGROUNDS.filter((bg) => bg.colors).forEach((bg) => {
        [...bg.colors!.light, ...bg.colors!.dark].forEach((color) => {
          expect(hexRegex.test(color)).toBe(true);
        });
      });
    });
  });

  describe('Pattern Backgrounds', () => {
    it('should have patternType for pattern backgrounds', () => {
      BACKGROUNDS.filter((bg) => bg.type === 'pattern').forEach((bg) => {
        expect(bg.patternType).toBeDefined();
        expect(typeof bg.patternType).toBe('string');
      });
    });

    it('should have sand theme backgrounds', () => {
      const sandBgs = BACKGROUNDS.filter((bg) => bg.id.includes('sand'));
      expect(sandBgs.length).toBeGreaterThan(0);
    });

    it('should have leopard print backgrounds', () => {
      const leopardBgs = BACKGROUNDS.filter((bg) => bg.id.includes('leopard'));
      expect(leopardBgs.length).toBeGreaterThan(0);
    });

    it('should have holiday pattern backgrounds', () => {
      const holidayBgs = BACKGROUNDS.filter((bg) => bg.category === 'holiday');
      expect(holidayBgs.length).toBeGreaterThan(0);
    });
  });

  describe('getBackgroundById', () => {
    it('should return background for valid ID', () => {
      const bg = getBackgroundById('default');
      expect(bg).toBeDefined();
      expect(bg?.id).toBe('default');
    });

    it('should return undefined for invalid ID', () => {
      const bg = getBackgroundById('nonexistent-id' as BackgroundId);
      expect(bg).toBeUndefined();
    });

    it('should return correct background for pattern IDs', () => {
      const bg = getBackgroundById('pattern-noise');
      expect(bg).toBeDefined();
      expect(bg?.type).toBe('pattern');
    });
  });

  describe('getGradientColors', () => {
    it('should return dark colors for dark theme', () => {
      const bg = BACKGROUNDS.find((b) => b.colors);
      if (bg) {
        const colors = getGradientColors(bg, true);
        expect(colors).toEqual(bg.colors!.dark);
      }
    });

    it('should return light colors for light theme', () => {
      const bg = BACKGROUNDS.find((b) => b.colors);
      if (bg) {
        const colors = getGradientColors(bg, false);
        expect(colors).toEqual(bg.colors!.light);
      }
    });

    it('should return fallback colors for undefined background', () => {
      const colors = getGradientColors(undefined, true);
      expect(colors).toEqual(['#000000', '#000000']);
    });

    it('should return fallback colors for background without gradient colors', () => {
      const solidBg = BACKGROUNDS.find((b) => b.type === 'solid');
      const colors = getGradientColors(solidBg, false);
      expect(colors).toEqual(['#F5F5F7', '#F5F5F7']);
    });
  });

  describe('getBackgroundsByCategory', () => {
    it('should return backgrounds matching category', () => {
      const patternBgs = getBackgroundsByCategory('pattern');
      expect(patternBgs.length).toBeGreaterThan(0);
      patternBgs.forEach((bg) => {
        expect(bg.category).toBe('pattern');
      });
    });

    it('should return empty array for non-existent category', () => {
      const bgs = getBackgroundsByCategory('nonexistent' as any);
      expect(bgs).toEqual([]);
    });

    it('should return animal backgrounds', () => {
      const animalBgs = getBackgroundsByCategory('animal');
      expect(animalBgs.length).toBeGreaterThan(0);
    });
  });

  describe('getPatternBackgrounds', () => {
    it('should return only pattern type backgrounds', () => {
      const patternBgs = getPatternBackgrounds();
      expect(patternBgs.length).toBeGreaterThan(0);
      patternBgs.forEach((bg) => {
        expect(bg.type).toBe('pattern');
      });
    });

    it('should include leopard patterns', () => {
      const patternBgs = getPatternBackgrounds();
      const leopardPattern = patternBgs.find((bg) => bg.id.includes('leopard'));
      expect(leopardPattern).toBeDefined();
    });
  });

  describe('DEFAULT_BACKGROUND', () => {
    it('should be defined', () => {
      expect(DEFAULT_BACKGROUND).toBeDefined();
    });

    it('should equal "default"', () => {
      expect(DEFAULT_BACKGROUND).toBe('default');
    });

    it('should exist in BACKGROUNDS array', () => {
      const bg = getBackgroundById(DEFAULT_BACKGROUND);
      expect(bg).toBeDefined();
    });
  });

  describe('Premium Backgrounds', () => {
    it('should have some premium backgrounds', () => {
      const premiumBgs = BACKGROUNDS.filter((bg) => bg.premium === true);
      expect(premiumBgs.length).toBeGreaterThan(0);
    });

    it('should have midnight gold leopard as premium', () => {
      const midnightGold = getBackgroundById('pattern-midnight-gold-leopard');
      expect(midnightGold?.premium).toBe(true);
    });
  });
});
