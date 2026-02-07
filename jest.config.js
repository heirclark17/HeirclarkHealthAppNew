/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',

  // Transform TypeScript files
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|@sentry/react-native|native-base|react-native-svg|moti|@gorhom/.*|lucide-react-native|@callstack/.*|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-web|react-native-webview|@quidone/.*|react-native-draggable-flatlist|react-native-worklets|react-native-health)',
  ],

  // Setup files
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],

  // Module name mapping for path aliases and native modules
  moduleNameMapper: {
    // Mock asset imports (images, fonts)
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'constants/**/*.{ts,tsx}',
    'data/**/*.{ts,tsx}',
    'types/**/*.{ts,tsx}',
    // Exclusions
    '!**/node_modules/**',
    '!**/index.ts',         // barrel files
    '!**/*.d.ts',
    '!**/*.backup',
    '!**/*.bak',
    '!**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Test match patterns
  testMatch: [
    '<rootDir>/**/__tests__/**/*.test.{ts,tsx}',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Timeout for async tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
};
