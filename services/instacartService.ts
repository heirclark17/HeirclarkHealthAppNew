// Instacart Deep Linking Service
// Handles opening Instacart app with deep links and web fallback

import { Platform, Linking } from 'react-native';

const INSTACART_APP_SCHEME = 'instacart://';
const INSTACART_WEB_URL = 'https://www.instacart.com';

class InstacartService {
  /**
   * Opens an Instacart URL - tries app first, then falls back to web
   */
  async openInstacart(url?: string): Promise<boolean> {
    try {
      // If we have a specific URL (like a products_link), open it directly
      if (url) {
        console.log('[InstacartService] Opening Instacart URL:', url);

        // Check if it's a deep link
        if (url.startsWith('instacart://')) {
          return this.openDeepLink(url);
        }

        // For HTTPS URLs (like products_link URLs), open directly in browser
        // Don't check canOpenURL for https - it should always work
        if (url.startsWith('https://')) {
          console.log('[InstacartService] Opening products link in browser');
          await Linking.openURL(url);
          return true;
        }

        // For other URLs, check if we can open them
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        }
      }

      // No URL provided or can't open - try to open Instacart app directly
      console.log('[InstacartService] No URL provided, opening Instacart app');
      const appUrl = INSTACART_APP_SCHEME;
      const canOpenApp = await Linking.canOpenURL(appUrl);

      if (canOpenApp) {
        await Linking.openURL(appUrl);
        return true;
      }

      // Fall back to opening Instacart website
      await Linking.openURL(INSTACART_WEB_URL);
      return true;
    } catch (error) {
      console.error('[InstacartService] Failed to open Instacart:', error);

      // Last resort - try web URL
      try {
        await Linking.openURL(INSTACART_WEB_URL);
        return true;
      } catch (webError) {
        console.error('[InstacartService] Failed to open web fallback:', webError);
        return false;
      }
    }
  }

  /**
   * Opens an Instacart deep link directly
   */
  private async openDeepLink(deepLink: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(deepLink);

      if (canOpen) {
        await Linking.openURL(deepLink);
        return true;
      }

      // Deep link not supported, fall back to web
      console.log('[InstacartService] Deep link not supported, using web fallback');
      await Linking.openURL(INSTACART_WEB_URL);
      return true;
    } catch (error) {
      console.error('[InstacartService] Deep link error:', error);
      return false;
    }
  }

  /**
   * Opens Instacart search with pre-filled items
   */
  async openSearch(searchQuery: string): Promise<boolean> {
    const encodedQuery = encodeURIComponent(searchQuery);

    // Try app deep link first
    const appDeepLink = `instacart://search?query=${encodedQuery}`;
    const webUrl = `${INSTACART_WEB_URL}/store/search/${encodedQuery}`;

    try {
      const canOpenApp = await Linking.canOpenURL(appDeepLink);

      if (canOpenApp) {
        await Linking.openURL(appDeepLink);
        return true;
      }

      // Fall back to web
      await Linking.openURL(webUrl);
      return true;
    } catch (error) {
      console.error('[InstacartService] Search error:', error);
      return false;
    }
  }

  /**
   * Checks if Instacart app is installed
   */
  async isAppInstalled(): Promise<boolean> {
    try {
      return await Linking.canOpenURL(INSTACART_APP_SCHEME);
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const instacartService = new InstacartService();
export default instacartService;
