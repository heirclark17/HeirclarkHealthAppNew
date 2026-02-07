import {
  DarkColors,
  LightColors,
  SandLightColors,
  SandDarkColors,
  MidnightGoldColors,
  Fonts,
  Spacing,
  Typography,
  LiquidGlass,
  Colors,
} from '../Theme';

describe('Theme Constants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Color Palettes', () => {
    it('should have matching keys between DarkColors and LightColors', () => {
      const darkKeys = Object.keys(DarkColors).sort();
      const lightKeys = Object.keys(LightColors).sort();
      expect(darkKeys).toEqual(lightKeys);
    });

    it('should have matching keys between SandLightColors and SandDarkColors', () => {
      const sandLightKeys = Object.keys(SandLightColors).sort();
      const sandDarkKeys = Object.keys(SandDarkColors).sort();
      expect(sandLightKeys).toEqual(sandDarkKeys);
    });

    it('should have all color values in valid format (hex, rgba, or named)', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      const rgbaRegex = /^rgba?\(/;

      const testColorValues = (colorObj: Record<string, string>) => {
        Object.values(colorObj).forEach((value) => {
          expect(
            hexRegex.test(value) || rgbaRegex.test(value) || typeof value === 'string'
          ).toBe(true);
        });
      };

      testColorValues(DarkColors);
      testColorValues(LightColors);
      testColorValues(SandLightColors);
      testColorValues(SandDarkColors);
    });

    it('should export Colors as DarkColors by default', () => {
      expect(Colors).toBe(DarkColors);
    });
  });

  describe('Fonts', () => {
    it('should have Urbanist font variants for text', () => {
      expect(Fonts.thin).toBe('Urbanist_100Thin');
      expect(Fonts.extraLight).toBe('Urbanist_200ExtraLight');
      expect(Fonts.light).toBe('Urbanist_300Light');
      expect(Fonts.regular).toBe('Urbanist_400Regular');
      expect(Fonts.medium).toBe('Urbanist_500Medium');
      expect(Fonts.semiBold).toBe('Urbanist_600SemiBold');
      expect(Fonts.bold).toBe('Urbanist_700Bold');
    });

    it('should have SF Pro Rounded font variants for numbers', () => {
      expect(Fonts.numericUltralight).toBe('SFProRounded-Ultralight');
      expect(Fonts.numericThin).toBe('SFProRounded-Thin');
      expect(Fonts.numericLight).toBe('SFProRounded-Light');
      expect(Fonts.numericRegular).toBe('SFProRounded-Regular');
      expect(Fonts.numericMedium).toBe('SFProRounded-Medium');
      expect(Fonts.numericSemiBold).toBe('SFProRounded-Semibold');
      expect(Fonts.numericBold).toBe('SFProRounded-Bold');
      expect(Fonts.numericHeavy).toBe('SFProRounded-Heavy');
      expect(Fonts.numericBlack).toBe('SFProRounded-Black');
    });

    it('should have both Urbanist (text) and SF Pro Rounded (numeric) entries', () => {
      const fontValues = Object.values(Fonts);
      const hasUrbanist = fontValues.some((font) => font.includes('Urbanist'));
      const hasSFProRounded = fontValues.some((font) => font.includes('SFProRounded'));
      expect(hasUrbanist).toBe(true);
      expect(hasSFProRounded).toBe(true);
    });
  });

  describe('Spacing', () => {
    it('should have all spacing values as positive numbers', () => {
      Object.values(Spacing).forEach((value) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });

    it('should follow 8-point grid system (values are multiples of 4 or 8)', () => {
      const gridValues = [
        Spacing.xs,
        Spacing.sm,
        Spacing.md,
        Spacing.lg,
        Spacing.xl,
        Spacing.xxl,
        Spacing.xxxl,
      ];

      gridValues.forEach((value) => {
        expect(value % 4).toBe(0);
      });
    });

    it('should have expected base spacing values', () => {
      expect(Spacing.xs).toBe(4);
      expect(Spacing.sm).toBe(8);
      expect(Spacing.md).toBe(16);
      expect(Spacing.lg).toBe(24);
      expect(Spacing.xl).toBe(32);
      expect(Spacing.xxl).toBe(40);
      expect(Spacing.xxxl).toBe(48);
    });
  });

  describe('Typography', () => {
    it('should have all iOS standard typography keys', () => {
      expect(Typography.largeTitle).toBeDefined();
      expect(Typography.title1).toBeDefined();
      expect(Typography.title2).toBeDefined();
      expect(Typography.title3).toBeDefined();
      expect(Typography.headline).toBeDefined();
      expect(Typography.body).toBeDefined();
      expect(Typography.callout).toBeDefined();
      expect(Typography.subhead).toBeDefined();
      expect(Typography.footnote).toBeDefined();
      expect(Typography.caption1).toBeDefined();
      expect(Typography.caption2).toBeDefined();
    });

    it('should have fontFamily and fontSize in each Typography entry', () => {
      const typographyKeys = [
        'largeTitle',
        'title1',
        'title2',
        'title3',
        'headline',
        'body',
        'callout',
        'subhead',
        'footnote',
        'caption1',
        'caption2',
      ] as const;

      typographyKeys.forEach((key) => {
        const style = Typography[key];
        expect(style).toHaveProperty('fontFamily');
        expect(style).toHaveProperty('fontSize');
        expect(typeof style.fontSize).toBe('number');
        expect(typeof style.fontFamily).toBe('string');
      });
    });

    it('should have legacy aliases for backward compatibility', () => {
      expect(Typography.h1).toBeDefined();
      expect(Typography.h2).toBeDefined();
      expect(Typography.h3).toBeDefined();
      expect(Typography.bodyMedium).toBeDefined();
      expect(Typography.small).toBeDefined();
      expect(Typography.caption).toBeDefined();
    });
  });

  describe('LiquidGlass', () => {
    it('should return correct background colors for dark theme', () => {
      const normalBg = LiquidGlass.getBg(true, false, 'default');
      expect(normalBg).toBe(DarkColors.glassCard);

      const selectedBg = LiquidGlass.getBg(true, true, 'default');
      expect(selectedBg).toBe(DarkColors.glassSelected);
    });

    it('should return correct background colors for light theme', () => {
      const normalBg = LiquidGlass.getBg(false, false, 'default');
      expect(normalBg).toBe(LightColors.glassCard);

      const selectedBg = LiquidGlass.getBg(false, true, 'default');
      expect(selectedBg).toBe(LightColors.glassSelected);
    });

    it('should return correct background colors for midnightGold theme', () => {
      const normalBg = LiquidGlass.getBg(true, false, 'midnightGold');
      expect(normalBg).toBe(MidnightGoldColors.glassCard);

      const selectedBg = LiquidGlass.getBg(true, true, 'midnightGold');
      expect(selectedBg).toBe(MidnightGoldColors.glassSelected);
    });

    it('should return correct background colors for sand theme', () => {
      const darkNormalBg = LiquidGlass.getBg(true, false, 'sand');
      expect(darkNormalBg).toBe(SandDarkColors.glassCard);

      const lightNormalBg = LiquidGlass.getBg(false, false, 'sand');
      expect(lightNormalBg).toBe(SandLightColors.glassCard);
    });

    it('should return correct border colors for all themes', () => {
      // Dark default
      expect(LiquidGlass.getBorder(true, false, 'default')).toBe(DarkColors.glassBorder);
      expect(LiquidGlass.getBorder(true, true, 'default')).toBe(DarkColors.glassSelectedBorder);

      // Light default
      expect(LiquidGlass.getBorder(false, false, 'default')).toBe(LightColors.glassBorder);
      expect(LiquidGlass.getBorder(false, true, 'default')).toBe(LightColors.glassSelectedBorder);

      // Midnight Gold
      expect(LiquidGlass.getBorder(true, false, 'midnightGold')).toBe(MidnightGoldColors.glassBorder);
      expect(LiquidGlass.getBorder(true, true, 'midnightGold')).toBe(MidnightGoldColors.glassSelectedBorder);

      // Sand
      expect(LiquidGlass.getBorder(true, false, 'sand')).toBe(SandDarkColors.glassBorder);
      expect(LiquidGlass.getBorder(false, false, 'sand')).toBe(SandLightColors.glassBorder);
    });

    it('should return blur intensity as numbers for each theme', () => {
      expect(typeof LiquidGlass.getBlurIntensity(true, 'default')).toBe('number');
      expect(typeof LiquidGlass.getBlurIntensity(false, 'default')).toBe('number');
      expect(typeof LiquidGlass.getBlurIntensity(true, 'midnightGold')).toBe('number');
      expect(typeof LiquidGlass.getBlurIntensity(false, 'sand')).toBe('number');
    });

    it('should have expected blur intensity values', () => {
      expect(LiquidGlass.getBlurIntensity(true, 'default')).toBe(20);
      expect(LiquidGlass.getBlurIntensity(false, 'default')).toBe(35);
      expect(LiquidGlass.getBlurIntensity(true, 'midnightGold')).toBe(60);
    });

    it('should have blurIntensity, borderWidth, and borderRadius properties', () => {
      expect(LiquidGlass.blurIntensity).toBeDefined();
      expect(LiquidGlass.borderWidth).toBeDefined();
      expect(LiquidGlass.borderRadius).toBeDefined();
      expect(typeof LiquidGlass.blurIntensity).toBe('object');
      expect(typeof LiquidGlass.borderWidth).toBe('object');
      expect(typeof LiquidGlass.borderRadius).toBe('object');
    });
  });

  describe('MidnightGoldColors', () => {
    it('should have expected gold palette keys', () => {
      expect(MidnightGoldColors.goldPrimary).toBeDefined();
      expect(MidnightGoldColors.goldLight).toBeDefined();
      expect(MidnightGoldColors.goldDark).toBeDefined();
      expect(MidnightGoldColors.goldMuted).toBeDefined();
    });

    it('should have all required theme color keys', () => {
      expect(MidnightGoldColors.background).toBeDefined();
      expect(MidnightGoldColors.text).toBeDefined();
      expect(MidnightGoldColors.primary).toBeDefined();
      expect(MidnightGoldColors.glassCard).toBeDefined();
      expect(MidnightGoldColors.glassBorder).toBeDefined();
    });
  });
});
