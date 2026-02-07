/**
 * Tests for instacartService.ts
 * Instacart deep linking and web fallback testing
 */

import { Linking } from 'react-native';
import { instacartService } from '../instacartService';

describe('instacartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
  });

  // ============ openInstacart ============

  describe('openInstacart', () => {
    it('should open an HTTPS URL directly in browser', async () => {
      const url = 'https://www.instacart.com/store/products/123';

      const result = await instacartService.openInstacart(url);

      expect(result).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith(url);
      // Should NOT call canOpenURL for https URLs
      expect(Linking.canOpenURL).not.toHaveBeenCalled();
    });

    it('should open a deep link when supported', async () => {
      const deepLink = 'instacart://store/products/123';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await instacartService.openInstacart(deepLink);

      expect(result).toBe(true);
      expect(Linking.canOpenURL).toHaveBeenCalledWith(deepLink);
      expect(Linking.openURL).toHaveBeenCalledWith(deepLink);
    });

    it('should fall back to web when deep link not supported', async () => {
      const deepLink = 'instacart://store/products/123';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const result = await instacartService.openInstacart(deepLink);

      expect(result).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.instacart.com');
    });

    it('should try app scheme when no URL provided', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await instacartService.openInstacart();

      expect(result).toBe(true);
      expect(Linking.canOpenURL).toHaveBeenCalledWith('instacart://');
      expect(Linking.openURL).toHaveBeenCalledWith('instacart://');
    });

    it('should fall back to web when app not installed and no URL provided', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const result = await instacartService.openInstacart();

      expect(result).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.instacart.com');
    });

    it('should check canOpenURL for non-https non-instacart URLs', async () => {
      const url = 'custom-scheme://something';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await instacartService.openInstacart(url);

      expect(result).toBe(true);
      expect(Linking.canOpenURL).toHaveBeenCalledWith(url);
      expect(Linking.openURL).toHaveBeenCalledWith(url);
    });

    it('should try web fallback when custom scheme URL cannot be opened', async () => {
      const url = 'custom-scheme://something';
      (Linking.canOpenURL as jest.Mock)
        .mockResolvedValueOnce(false)  // custom URL cannot open
        .mockResolvedValueOnce(false); // instacart:// cannot open either

      const result = await instacartService.openInstacart(url);

      expect(result).toBe(true);
      // Should eventually open the web URL
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.instacart.com');
    });

    it('should handle openURL throwing error with web fallback', async () => {
      (Linking.openURL as jest.Mock)
        .mockRejectedValueOnce(new Error('Cannot open'))
        .mockResolvedValueOnce(undefined); // web fallback succeeds

      const result = await instacartService.openInstacart('https://www.instacart.com/store');

      expect(result).toBe(true);
      // Second call should be the web fallback
      expect(Linking.openURL).toHaveBeenCalledTimes(2);
    });

    it('should return false when both primary and web fallback fail', async () => {
      (Linking.openURL as jest.Mock)
        .mockRejectedValueOnce(new Error('Cannot open'))
        .mockRejectedValueOnce(new Error('Web also failed'));

      const result = await instacartService.openInstacart('https://bad-url.com');

      expect(result).toBe(false);
    });
  });

  // ============ openSearch ============

  describe('openSearch', () => {
    it('should open search in app when app is installed', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await instacartService.openSearch('chicken breast');

      expect(result).toBe(true);
      expect(Linking.canOpenURL).toHaveBeenCalledWith(
        expect.stringContaining('instacart://search?query=chicken%20breast')
      );
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('instacart://search?query=chicken%20breast')
      );
    });

    it('should fall back to web search when app not installed', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const result = await instacartService.openSearch('eggs');

      expect(result).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://www.instacart.com/store/search/eggs'
      );
    });

    it('should encode search query properly', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      await instacartService.openSearch('organic free range eggs');

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('organic%20free%20range%20eggs')
      );
    });

    it('should return false on error', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('Error'));

      const result = await instacartService.openSearch('test');

      expect(result).toBe(false);
    });
  });

  // ============ isAppInstalled ============

  describe('isAppInstalled', () => {
    it('should return true when Instacart app can be opened', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await instacartService.isAppInstalled();

      expect(result).toBe(true);
      expect(Linking.canOpenURL).toHaveBeenCalledWith('instacart://');
    });

    it('should return false when Instacart app cannot be opened', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const result = await instacartService.isAppInstalled();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const result = await instacartService.isAppInstalled();

      expect(result).toBe(false);
    });
  });
});
