/**
 * Figma API Configuration
 * Reads FIGMA_API_KEY from Railway environment variables
 */

// Read from environment variable (Railway)
const FIGMA_API_KEY = process.env.FIGMA_API_KEY;

if (!FIGMA_API_KEY) {
  console.error('❌ FIGMA_API_KEY environment variable is missing!');
  console.error('Add it in Railway: Dashboard → Variables → FIGMA_API_KEY=figd_YOUR_TOKEN');
  throw new Error('FIGMA_API_KEY is required. Add it to Railway environment variables.');
}

console.log('✅ Figma API Key loaded successfully');

// Figma API configuration
export const figmaConfig = {
  apiKey: FIGMA_API_KEY,
  baseUrl: 'https://api.figma.com/v1',
  timeout: 30000, // 30 seconds
};

/**
 * Get headers for Figma API requests
 */
export function getFigmaHeaders(): HeadersInit {
  return {
    'X-Figma-Token': figmaConfig.apiKey,
    'Content-Type': 'application/json',
  };
}

export { FIGMA_API_KEY };
