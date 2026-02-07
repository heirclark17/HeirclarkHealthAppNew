/**
 * Tests for weatherService.ts
 */

import { weatherService } from '../weatherService';

describe('weatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper to create a successful backend response
  function createSuccessResponse(overrides: Record<string, any> = {}) {
    return {
      success: true,
      weather: {
        temp: 72.5,
        feelsLike: 70.2,
        tempMin: 65.0,
        tempMax: 78.0,
        condition: 'Clear',
        description: 'clear sky',
        humidity: 45,
        wind: { speed: 8.3 },
        rain: null,
        ...overrides.weather,
      },
      location: {
        name: 'Houston',
        ...overrides.location,
      },
    };
  }

  // =============================================
  // getWeatherByCoords
  // =============================================
  describe('getWeatherByCoords', () => {
    it('should return weather data on success', async () => {
      const mockResponse = createSuccessResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await weatherService.getWeatherByCoords(29.76, -95.37);
      expect(result).not.toBeNull();
      expect(result!.temp).toBe(73); // Math.round(72.5)
      expect(result!.feels_like).toBe(70);
      expect(result!.temp_min).toBe(65);
      expect(result!.temp_max).toBe(78);
      expect(result!.condition).toBe('Clear');
      expect(result!.description).toBe('clear sky');
      expect(result!.city).toBe('Houston');
      expect(result!.humidity).toBe(45);
      expect(result!.wind_speed).toBe(8);
      expect(result!.rain_chance).toBe(0);
    });

    it('should construct correct URL with coordinates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createSuccessResponse(),
      });

      await weatherService.getWeatherByCoords(29.76, -95.37);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('lat=29.76&lon=-95.37&units=imperial')
      );
    });

    it('should return null on HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await weatherService.getWeatherByCoords(29.76, -95.37);
      expect(result).toBeNull();
    });

    it('should return null on invalid data format (no success)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      });

      const result = await weatherService.getWeatherByCoords(29.76, -95.37);
      expect(result).toBeNull();
    });

    it('should return null on invalid data format (no weather)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, weather: null }),
      });

      const result = await weatherService.getWeatherByCoords(29.76, -95.37);
      expect(result).toBeNull();
    });

    it('should return null on fetch exception', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await weatherService.getWeatherByCoords(29.76, -95.37);
      expect(result).toBeNull();
    });

    it('should calculate rain_chance from rain data', async () => {
      const mockResponse = createSuccessResponse({
        weather: {
          rain: { '1h': 0.5 },
        },
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await weatherService.getWeatherByCoords(29.76, -95.37);
      expect(result!.rain_chance).toBe(5); // Math.round(0.5 * 10)
    });

    it('should return correct weather emoji for different conditions', async () => {
      const conditions = [
        { condition: 'Clear', expected: '\u2600\uFE0F' },
        { condition: 'Clouds', expected: '\u2601\uFE0F' },
        { condition: 'Rain', expected: '\uD83C\uDF27\uFE0F' },
        { condition: 'Snow', expected: '\u2744\uFE0F' },
        { condition: 'Thunderstorm', expected: '\u26C8\uFE0F' },
        { condition: 'Fog', expected: '\uD83C\uDF2B\uFE0F' },
      ];

      for (const { condition, expected } of conditions) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => createSuccessResponse({ weather: { condition } }),
        });

        const result = await weatherService.getWeatherByCoords(29.76, -95.37);
        expect(result!.icon).toBe(expected);
      }
    });
  });

  // =============================================
  // getWeatherByCity
  // =============================================
  describe('getWeatherByCity', () => {
    it('should return weather data on success', async () => {
      const mockResponse = createSuccessResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await weatherService.getWeatherByCity('Houston');
      expect(result).not.toBeNull();
      expect(result!.city).toBe('Houston');
      expect(result!.temp).toBe(73);
    });

    it('should encode city name in URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createSuccessResponse({ location: { name: 'San Antonio' } }),
      });

      await weatherService.getWeatherByCity('San Antonio');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('city=San%20Antonio&units=imperial')
      );
    });

    it('should return null on HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await weatherService.getWeatherByCity('NonexistentCity');
      expect(result).toBeNull();
    });

    it('should return null on invalid data format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'wrong format' }),
      });

      const result = await weatherService.getWeatherByCity('Houston');
      expect(result).toBeNull();
    });

    it('should return null on fetch exception', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await weatherService.getWeatherByCity('Houston');
      expect(result).toBeNull();
    });
  });

  // =============================================
  // getHealthTip
  // =============================================
  describe('getHealthTip', () => {
    it('should return hydration tip for hot weather (>80)', () => {
      const tip = weatherService.getHealthTip(95);
      expect(tip).toContain('hydrated');
    });

    it('should return cold weather tip for cold weather (<50)', () => {
      const tip = weatherService.getHealthTip(35);
      expect(tip).toContain('Cold');
    });

    it('should return outdoor activity tip for moderate weather', () => {
      const tip = weatherService.getHealthTip(65);
      expect(tip).toContain('outdoor');
    });

    it('should return hydration tip at boundary (81)', () => {
      const tip = weatherService.getHealthTip(81);
      expect(tip).toContain('hydrated');
    });

    it('should return cold tip at boundary (49)', () => {
      const tip = weatherService.getHealthTip(49);
      expect(tip).toContain('Cold');
    });

    it('should return outdoor tip at boundary (50)', () => {
      const tip = weatherService.getHealthTip(50);
      expect(tip).toContain('outdoor');
    });

    it('should return outdoor tip at boundary (80)', () => {
      const tip = weatherService.getHealthTip(80);
      expect(tip).toContain('outdoor');
    });
  });
});
