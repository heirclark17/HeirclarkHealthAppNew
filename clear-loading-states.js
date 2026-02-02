// Clear any stuck loading states from AsyncStorage
// Run this in the app's debug console or as a temporary component

// Paste this into Chrome DevTools console when connected to Metro:

(async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  console.log('🔧 Clearing stuck loading states...');

  // Get all keys
  const keys = await AsyncStorage.getAllKeys();
  console.log('📦 Found keys:', keys);

  // Load all values to check for loading states
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);

        // Check for loading flags
        if (parsed.isGenerating || parsed.isLoading || parsed.isSaving) {
          console.log(`⚠️  Found stuck loading state in ${key}:`, {
            isGenerating: parsed.isGenerating,
            isLoading: parsed.isLoading,
            isSaving: parsed.isSaving
          });

          // Clear the loading flags
          parsed.isGenerating = false;
          parsed.isLoading = false;
          parsed.isSaving = false;

          await AsyncStorage.setItem(key, JSON.stringify(parsed));
          console.log(`✅ Cleared loading flags in ${key}`);
        }
      } catch (e) {
        // Not JSON, skip
      }
    }
  }

  console.log('✅ Loading state cleanup complete! Reload the app.');
})();
