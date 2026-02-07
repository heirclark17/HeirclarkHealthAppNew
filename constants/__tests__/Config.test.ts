import { API_BASE_URL, APP_NAME, COLORS } from '../Config';

describe('Config Constants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API_BASE_URL', () => {
    it('should be defined', () => {
      expect(API_BASE_URL).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof API_BASE_URL).toBe('string');
    });

    it('should be a valid URL', () => {
      expect(API_BASE_URL).toBe('https://heirclarkinstacartbackend-production.up.railway.app');
      expect(API_BASE_URL.startsWith('http')).toBe(true);
    });
  });

  describe('APP_NAME', () => {
    it('should be defined', () => {
      expect(APP_NAME).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof APP_NAME).toBe('string');
    });

    it('should have expected app name', () => {
      expect(APP_NAME).toBe('Heirclark Health');
    });

    it('should not be empty', () => {
      expect(APP_NAME.length).toBeGreaterThan(0);
    });
  });

  describe('COLORS', () => {
    it('should be defined', () => {
      expect(COLORS).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof COLORS).toBe('object');
    });

    it('should have expected color keys', () => {
      expect(COLORS).toHaveProperty('primary');
      expect(COLORS).toHaveProperty('white');
      expect(COLORS).toHaveProperty('background');
    });

    it('should have valid color values', () => {
      expect(COLORS.primary).toBe('#4c669f');
      expect(COLORS.white).toBe('#FFFFFF');
      expect(COLORS.background).toBe('#F5F5F5');
    });

    it('should have all color values as strings', () => {
      Object.values(COLORS).forEach((color) => {
        expect(typeof color).toBe('string');
      });
    });

    it('should have color values in valid hex format', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      Object.values(COLORS).forEach((color) => {
        expect(hexRegex.test(color)).toBe(true);
      });
    });
  });
});
