// Heirclark AI Service - OpenAI API Integration
// Handles meal analysis via text, voice, and photo

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface NutritionAnalysis {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: string;
  foods: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  suggestions?: string[];
}

class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
  }

  // Analyze meal description text
  async analyzeMealText(description: string): Promise<NutritionAnalysis | null> {
    try {
      const prompt = `You are a nutrition expert. Analyze this meal description and provide detailed nutritional information.

Meal: "${description}"

Provide a JSON response with this exact structure (respond ONLY with valid JSON, no markdown):
{
  "mealName": "Brief name for the meal",
  "calories": total_calories_number,
  "protein": protein_grams_number,
  "carbs": carbs_grams_number,
  "fat": fat_grams_number,
  "confidence": "high/medium/low",
  "foods": [
    {
      "name": "food item name",
      "portion": "portion size",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "suggestions": ["healthier alternative 1", "healthier alternative 2"]
}

Be specific with portions. If portions aren't specified, make reasonable assumptions based on typical serving sizes.`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition expert. Always respond with valid JSON only, no markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON response
      const analysis = JSON.parse(content);
      return analysis;
    } catch (error) {
      console.error('AI meal text analysis error:', error);
      return null;
    }
  }

  // Analyze meal photo
  async analyzeMealPhoto(base64Image: string, mimeType: string = 'image/jpeg'): Promise<NutritionAnalysis | null> {
    try {
      const prompt = `You are a nutrition expert. Analyze this meal photo and provide detailed nutritional information.

Identify all visible foods, estimate portions, and calculate nutritional values.

Provide a JSON response with this exact structure:
{
  "mealName": "Brief name for the meal",
  "calories": total_calories_number,
  "protein": protein_grams_number,
  "carbs": carbs_grams_number,
  "fat": fat_grams_number,
  "confidence": "high/medium/low",
  "foods": [
    {
      "name": "food item name",
      "portion": "estimated portion size",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "suggestions": ["healthier alternative 1", "healthier alternative 2"]
}`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition expert analyzing meal photos. Respond with valid JSON only.',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Extract JSON from response (may have markdown wrapper)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response');
        return null;
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error) {
      console.error('AI meal photo analysis error:', error);
      return null;
    }
  }

  // Lookup barcode from food database API
  async lookupBarcode(barcode: string): Promise<NutritionAnalysis | null> {
    try {
      // Use Open Food Facts API (free, no key required)
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);

      if (!response.ok) {
        console.error('Barcode lookup failed');
        return null;
      }

      const data = await response.json();

      if (data.status === 0) {
        // Product not found
        return null;
      }

      const product = data.product;
      const nutriments = product.nutriments || {};

      // Convert per 100g to per serving if serving size available
      const servingSize = product.serving_quantity || 100;
      const multiplier = servingSize / 100;

      return {
        mealName: product.product_name || 'Unknown Product',
        calories: Math.round((nutriments['energy-kcal_100g'] || 0) * multiplier),
        protein: Math.round((nutriments.proteins_100g || 0) * multiplier),
        carbs: Math.round((nutriments.carbohydrates_100g || 0) * multiplier),
        fat: Math.round((nutriments.fat_100g || 0) * multiplier),
        confidence: 'high',
        foods: [
          {
            name: product.product_name || 'Unknown Product',
            portion: `${servingSize}g`,
            calories: Math.round((nutriments['energy-kcal_100g'] || 0) * multiplier),
            protein: Math.round((nutriments.proteins_100g || 0) * multiplier),
            carbs: Math.round((nutriments.carbohydrates_100g || 0) * multiplier),
            fat: Math.round((nutriments.fat_100g || 0) * multiplier),
          },
        ],
      };
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
