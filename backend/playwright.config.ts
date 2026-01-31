import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests serially for API testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.API_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
  timeout: 60000, // 60 second timeout for API tests
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: 'api-tests',
      testMatch: '**/*.e2e.spec.ts',
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3001/api/v1/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
