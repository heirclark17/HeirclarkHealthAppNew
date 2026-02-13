import Constants from 'expo-constants';

const PEXELS_API_KEY = Constants.expoConfig?.extra?.pexelsApiKey ||
                       process.env.EXPO_PUBLIC_PEXELS_API_KEY;

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

// In-memory cache to avoid repeated API calls for same meals
const photoCache = new Map<string, string>();

class PexelsService {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/v1';

  constructor() {
    this.apiKey = PEXELS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[PexelsService] API key not configured. Using fallback images.');
    }
  }

  /**
   * Search for food photos based on meal name
   */
  async searchFoodPhoto(mealName: string, size: 'card' | 'modal' = 'card'): Promise<string> {
    // Check cache first
    const cacheKey = `${mealName}-${size}`;
    if (photoCache.has(cacheKey)) {
      return photoCache.get(cacheKey)!;
    }

    // If no API key, try TheMealDB fallback
    if (!this.apiKey) {
      console.log('[PexelsService] No Pexels API key, trying TheMealDB fallback');
      return this.getFallbackImageAsync(mealName, size);
    }

    try {
      // Extract main food item from meal name for better search
      const searchTerm = this.extractFoodKeywords(mealName);

      console.log('[PexelsService] Searching for:', searchTerm);

      const response = await fetch(
        `${this.baseUrl}/search?query=${encodeURIComponent(searchTerm)}&per_page=3&orientation=landscape`,
        {
          headers: {
            Authorization: this.apiKey,
          },
        }
      );

      if (!response.ok) {
        console.error('[PexelsService] API error:', response.status, response.statusText);
        return this.getFallbackImageAsync(mealName, size);
      }

      const data: PexelsSearchResponse = await response.json();

      if (data.photos && data.photos.length > 0) {
        // Use deterministic selection for consistency
        const hash = this.hashString(mealName);
        const idx = Math.abs(hash) % data.photos.length;
        const photo = data.photos[idx];

        // Choose appropriate size
        const imageUrl = size === 'card' ? photo.src.medium : photo.src.large;

        // Cache the result
        photoCache.set(cacheKey, imageUrl);

        console.log('[PexelsService] Found photo by:', photo.photographer);
        return imageUrl;
      }

      // No photos found, use TheMealDB fallback
      console.log('[PexelsService] No Pexels photos found for:', searchTerm);
      return this.getFallbackImageAsync(mealName, size);

    } catch (error) {
      console.error('[PexelsService] Error fetching photo:', error);
      return this.getFallbackImageAsync(mealName, size);
    }
  }

  /**
   * Extract main food keywords from meal name for better search results
   */
  private extractFoodKeywords(mealName: string): string {
    // Common food terms that make good search queries
    const foodKeywords = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp',
      'pasta', 'rice', 'noodles', 'quinoa', 'oatmeal',
      'salad', 'soup', 'stew', 'burger', 'sandwich', 'wrap', 'taco', 'burrito',
      'pizza', 'stir fry', 'curry', 'grilled', 'roasted', 'baked',
      'eggs', 'omelet', 'pancakes', 'waffles', 'toast', 'bacon',
      'smoothie', 'bowl', 'plate', 'vegetables', 'fruit',
      'avocado', 'turkey', 'steak', 'lamb', 'tofu', 'tempeh',
      'yogurt', 'granola', 'cereal', 'muffin', 'bread',
      'sweet potato', 'broccoli', 'spinach', 'kale',
    ];

    const lowerName = mealName.toLowerCase();

    // Find matching food keywords
    const matches = foodKeywords.filter(keyword => lowerName.includes(keyword));

    if (matches.length > 0) {
      // Use up to 2 matching keywords for more specific results
      return matches.slice(0, 2).join(' ') + ' food dish';
    }

    // If no specific match, use the full meal name for search
    return `${mealName} food dish`;
  }

  /**
   * Get fallback image using TheMealDB (free, no API key needed)
   * Falls back to a food-keyword-seeded image if that also fails
   */
  private async getFallbackImageAsync(mealName: string, size: 'card' | 'modal' = 'card'): Promise<string> {
    try {
      // Try TheMealDB search (free, no API key)
      const searchTerm = this.extractFoodKeywords(mealName).split(' ')[0];
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.meals && data.meals.length > 0) {
          // Use a deterministic index based on meal name hash
          const hash = this.hashString(mealName);
          const idx = Math.abs(hash) % data.meals.length;
          const thumbUrl = data.meals[idx].strMealThumb;
          if (thumbUrl) {
            // TheMealDB supports size suffixes
            const sizedUrl = size === 'card'
              ? `${thumbUrl}/preview`
              : thumbUrl;
            const cacheKey = `${mealName}-${size}`;
            photoCache.set(cacheKey, sizedUrl);
            console.log('[PexelsService] Using TheMealDB fallback:', data.meals[idx].strMeal);
            return sizedUrl;
          }
        }
      }
    } catch (error) {
      console.log('[PexelsService] TheMealDB fallback failed, using static fallback');
    }

    // Final fallback: return empty string to trigger placeholder UI
    return '';
  }

  /**
   * Simple hash function for deterministic image selection
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Synchronous fallback for legacy callers (returns empty to trigger placeholder)
   */
  private getFallbackImage(mealName: string, size: 'card' | 'modal' = 'card'): string {
    return '';
  }

  /**
   * Clear the photo cache (useful for testing or memory management)
   */
  clearCache(): void {
    photoCache.clear();
    console.log('[PexelsService] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: photoCache.size,
      keys: Array.from(photoCache.keys()),
    };
  }
}

// Export singleton instance
export const pexelsService = new PexelsService();
