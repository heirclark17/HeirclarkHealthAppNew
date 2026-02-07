import { liquidGlass, glassBlur, spacing, radius, typography, responsiveTypography } from '../landingTheme';

describe('Landing Theme Constants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('liquidGlass', () => {
    it('should be defined', () => {
      expect(liquidGlass).toBeDefined();
    });

    it('should have background colors', () => {
      expect(liquidGlass.void).toBeDefined();
      expect(liquidGlass.deepSpace).toBeDefined();
      expect(liquidGlass.ambient).toBeDefined();
      expect(liquidGlass.surface).toBeDefined();
    });

    it('should have glass fill variants', () => {
      expect(liquidGlass.glass).toBeDefined();
      expect(liquidGlass.glass.clear).toBeDefined();
      expect(liquidGlass.glass.subtle).toBeDefined();
      expect(liquidGlass.glass.standard).toBeDefined();
      expect(liquidGlass.glass.elevated).toBeDefined();
      expect(liquidGlass.glass.solid).toBeDefined();
    });

    it('should have border variants', () => {
      expect(liquidGlass.border).toBeDefined();
      expect(liquidGlass.border.subtle).toBeDefined();
      expect(liquidGlass.border.standard).toBeDefined();
      expect(liquidGlass.border.visible).toBeDefined();
      expect(liquidGlass.border.active).toBeDefined();
    });

    it('should have accent colors', () => {
      expect(liquidGlass.accent).toBeDefined();
      expect(liquidGlass.accent.primary).toBe('#4ECDC4');
      expect(liquidGlass.accent.secondary).toBe('#96CEB4');
      expect(liquidGlass.accent.tertiary).toBeDefined();
      expect(liquidGlass.accent.glow).toBeDefined();
    });

    it('should have macro colors', () => {
      expect(liquidGlass.macros).toBeDefined();
      expect(liquidGlass.macros.calories).toBeDefined();
      expect(liquidGlass.macros.protein).toBeDefined();
      expect(liquidGlass.macros.carbs).toBeDefined();
      expect(liquidGlass.macros.fat).toBeDefined();
    });

    it('should have text variants', () => {
      expect(liquidGlass.text).toBeDefined();
      expect(liquidGlass.text.primary).toBeDefined();
      expect(liquidGlass.text.secondary).toBeDefined();
      expect(liquidGlass.text.tertiary).toBeDefined();
      expect(liquidGlass.text.disabled).toBeDefined();
    });

    it('should have semantic colors', () => {
      expect(liquidGlass.success).toBeDefined();
      expect(liquidGlass.warning).toBeDefined();
      expect(liquidGlass.error).toBeDefined();
    });
  });

  describe('glassBlur', () => {
    it('should be defined', () => {
      expect(glassBlur).toBeDefined();
    });

    it('should have all blur intensity variants', () => {
      expect(glassBlur.subtle).toBeDefined();
      expect(glassBlur.standard).toBeDefined();
      expect(glassBlur.elevated).toBeDefined();
      expect(glassBlur.intense).toBeDefined();
    });

    it('should have numeric blur values', () => {
      expect(typeof glassBlur.subtle).toBe('number');
      expect(typeof glassBlur.standard).toBe('number');
      expect(typeof glassBlur.elevated).toBe('number');
      expect(typeof glassBlur.intense).toBe('number');
    });

    it('should have expected blur values', () => {
      expect(glassBlur.subtle).toBe(40);
      expect(glassBlur.standard).toBe(60);
      expect(glassBlur.elevated).toBe(80);
      expect(glassBlur.intense).toBe(100);
    });

    it('should have blur values in ascending order', () => {
      expect(glassBlur.standard).toBeGreaterThan(glassBlur.subtle);
      expect(glassBlur.elevated).toBeGreaterThan(glassBlur.standard);
      expect(glassBlur.intense).toBeGreaterThan(glassBlur.elevated);
    });
  });

  describe('spacing', () => {
    it('should be defined', () => {
      expect(spacing).toBeDefined();
    });

    it('should have all spacing sizes', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
      expect(spacing['2xl']).toBe(48);
      expect(spacing['3xl']).toBe(64);
      expect(spacing['4xl']).toBe(96);
      expect(spacing['5xl']).toBe(128);
    });

    it('should follow 8-point grid system', () => {
      [spacing.sm, spacing.md, spacing.lg, spacing.xl, spacing['2xl'], spacing['3xl']].forEach(
        (value) => {
          expect(value % 8).toBe(0);
        }
      );
    });

    it('should have all numeric values', () => {
      Object.values(spacing).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });
  });

  describe('radius', () => {
    it('should be defined', () => {
      expect(radius).toBeDefined();
    });

    it('should have all radius sizes', () => {
      expect(radius.sm).toBe(8);
      expect(radius.md).toBe(12);
      expect(radius.lg).toBe(16);
      expect(radius.xl).toBe(24);
      expect(radius['2xl']).toBe(32);
      expect(radius.full).toBe(9999);
    });

    it('should have all numeric values', () => {
      Object.values(radius).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });
  });

  describe('typography', () => {
    it('should be defined', () => {
      expect(typography).toBeDefined();
    });

    it('should have display variants', () => {
      expect(typography.displayLarge).toBeDefined();
      expect(typography.displayMedium).toBeDefined();
      expect(typography.displaySmall).toBeDefined();
    });

    it('should have heading variants', () => {
      expect(typography.h1).toBeDefined();
      expect(typography.h2).toBeDefined();
      expect(typography.h3).toBeDefined();
      expect(typography.h4).toBeDefined();
    });

    it('should have body variants', () => {
      expect(typography.bodyLarge).toBeDefined();
      expect(typography.bodyMedium).toBeDefined();
      expect(typography.bodySmall).toBeDefined();
    });

    it('should have label variants', () => {
      expect(typography.labelLarge).toBeDefined();
      expect(typography.labelMedium).toBeDefined();
      expect(typography.labelSmall).toBeDefined();
    });

    it('should have fontFamily in all variants', () => {
      Object.values(typography).forEach((style) => {
        expect(style).toHaveProperty('fontFamily');
      });
    });

    it('should have fontSize in all variants', () => {
      Object.values(typography).forEach((style) => {
        expect(style).toHaveProperty('fontSize');
        expect(typeof style.fontSize).toBe('number');
      });
    });

    it('should have lineHeight in all variants', () => {
      Object.values(typography).forEach((style) => {
        expect(style).toHaveProperty('lineHeight');
        expect(typeof style.lineHeight).toBe('number');
      });
    });
  });

  describe('responsiveTypography', () => {
    it('should be defined', () => {
      expect(responsiveTypography).toBeDefined();
    });

    it('should have responsive display variants', () => {
      expect(responsiveTypography.displayLarge).toBeDefined();
      expect(responsiveTypography.displayMedium).toBeDefined();
      expect(responsiveTypography.displaySmall).toBeDefined();
    });

    it('should have mobile, tablet, and desktop sizes', () => {
      expect(responsiveTypography.displayLarge.mobile).toBeDefined();
      expect(responsiveTypography.displayLarge.tablet).toBeDefined();
      expect(responsiveTypography.displayLarge.desktop).toBeDefined();
    });

    it('should have fontSize and lineHeight in each breakpoint', () => {
      Object.values(responsiveTypography).forEach((variant) => {
        expect(variant.mobile).toHaveProperty('fontSize');
        expect(variant.mobile).toHaveProperty('lineHeight');
        expect(variant.tablet).toHaveProperty('fontSize');
        expect(variant.tablet).toHaveProperty('lineHeight');
        expect(variant.desktop).toHaveProperty('fontSize');
        expect(variant.desktop).toHaveProperty('lineHeight');
      });
    });

    it('should have increasing font sizes from mobile to desktop', () => {
      Object.values(responsiveTypography).forEach((variant) => {
        expect(variant.tablet.fontSize).toBeGreaterThanOrEqual(variant.mobile.fontSize);
        expect(variant.desktop.fontSize).toBeGreaterThanOrEqual(variant.tablet.fontSize);
      });
    });
  });
});
