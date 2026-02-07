import { renderHook } from '@testing-library/react-native';
import { breakpoints } from '../useResponsive';

// Note: These hooks rely heavily on Platform and Dimensions which are difficult to mock
// in Jest. Most of the logic is tested through integration tests.
// Here we test what we can unit test: constants and basic structure.

describe('useResponsive hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('breakpoints constant', () => {
    it('exports correct breakpoint values', () => {
      expect(breakpoints).toEqual({
        mobile: 0,
        tablet: 768,
        desktop: 1024,
        wide: 1280,
        ultrawide: 1536,
      });
    });

    it('breakpoints are in ascending order', () => {
      const values = Object.values(breakpoints);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });

    it('has expected breakpoint keys', () => {
      expect(breakpoints).toHaveProperty('mobile');
      expect(breakpoints).toHaveProperty('tablet');
      expect(breakpoints).toHaveProperty('desktop');
      expect(breakpoints).toHaveProperty('wide');
      expect(breakpoints).toHaveProperty('ultrawide');
    });

    it('all breakpoint values are numbers', () => {
      Object.values(breakpoints).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });

    it('all breakpoint values are non-negative', () => {
      Object.values(breakpoints).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('hook exports', () => {
    it('useBreakpoint is a function', () => {
      const { useBreakpoint } = require('../useResponsive');
      expect(typeof useBreakpoint).toBe('function');
    });

    it('useResponsiveValue is a function', () => {
      const { useResponsiveValue } = require('../useResponsive');
      expect(typeof useResponsiveValue).toBe('function');
    });

    it('useWindowDimensions is a function', () => {
      const { useWindowDimensions } = require('../useResponsive');
      expect(typeof useWindowDimensions).toBe('function');
    });

    it('useScrollReveal is a function', () => {
      const { useScrollReveal } = require('../useResponsive');
      expect(typeof useScrollReveal).toBe('function');
    });
  });

  describe('breakpoint type safety', () => {
    it('mobile breakpoint starts at 0', () => {
      expect(breakpoints.mobile).toBe(0);
    });

    it('tablet breakpoint is standard 768px', () => {
      expect(breakpoints.tablet).toBe(768);
    });

    it('desktop breakpoint is 1024px', () => {
      expect(breakpoints.desktop).toBe(1024);
    });

    it('wide breakpoint is 1280px', () => {
      expect(breakpoints.wide).toBe(1280);
    });

    it('ultrawide breakpoint is 1536px', () => {
      expect(breakpoints.ultrawide).toBe(1536);
    });
  });
});
