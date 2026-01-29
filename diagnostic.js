const { chromium } = require('playwright');

async function runDiagnostic() {
  console.log('='.repeat(60));
  console.log('HEIRCLARK HEALTH APP - FULL DIAGNOSTIC');
  console.log('='.repeat(60));
  console.log('');

  // 1. Check Expo Dev Server
  console.log('[1] CHECKING EXPO DEV SERVER...');
  console.log('-'.repeat(40));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const expoResponse = await page.goto('http://localhost:8081', { timeout: 10000 });
    if (expoResponse && expoResponse.ok()) {
      console.log('✓ Expo server is running on http://localhost:8081');
      console.log(`  Status: ${expoResponse.status()}`);
    } else {
      console.log('✗ Expo server responded with error');
      console.log(`  Status: ${expoResponse ? expoResponse.status() : 'No response'}`);
    }
  } catch (e) {
    console.log('✗ Expo server is NOT running');
    console.log(`  Error: ${e.message}`);
  }

  console.log('');

  // 2. Check Railway Backend API
  console.log('[2] CHECKING RAILWAY BACKEND API...');
  console.log('-'.repeat(40));

  const apiBaseUrl = 'https://heirclarkinstacartbackend-production.up.railway.app';

  // Health endpoint
  try {
    const healthResponse = await page.goto(`${apiBaseUrl}/api/v1/health`, { timeout: 15000 });
    const healthText = await page.textContent('body');
    console.log('✓ API Health Check:');
    console.log(`  URL: ${apiBaseUrl}/api/v1/health`);
    console.log(`  Status: ${healthResponse.status()}`);
    console.log(`  Response: ${healthText.substring(0, 200)}`);
  } catch (e) {
    console.log('✗ API Health Check FAILED');
    console.log(`  Error: ${e.message}`);
  }

  console.log('');

  // Metrics endpoint
  try {
    const metricsResponse = await page.goto(`${apiBaseUrl}/api/v1/health/metrics?userId=guest_user`, { timeout: 15000 });
    const metricsText = await page.textContent('body');
    console.log('✓ API Metrics Endpoint:');
    console.log(`  URL: ${apiBaseUrl}/api/v1/health/metrics?userId=guest_user`);
    console.log(`  Status: ${metricsResponse.status()}`);
    console.log(`  Response: ${metricsText.substring(0, 200)}`);
  } catch (e) {
    console.log('✗ API Metrics Endpoint FAILED');
    console.log(`  Error: ${e.message}`);
  }

  console.log('');

  // Goals endpoint
  try {
    const goalsResponse = await page.goto(`${apiBaseUrl}/api/v1/users/guest_user/goals`, { timeout: 15000 });
    const goalsText = await page.textContent('body');
    console.log('✓ API Goals Endpoint:');
    console.log(`  URL: ${apiBaseUrl}/api/v1/users/guest_user/goals`);
    console.log(`  Status: ${goalsResponse.status()}`);
    console.log(`  Response: ${goalsText.substring(0, 200)}`);
  } catch (e) {
    console.log('✗ API Goals Endpoint FAILED');
    console.log(`  Error: ${e.message}`);
  }

  console.log('');

  // Devices endpoint
  try {
    const devicesResponse = await page.goto(`${apiBaseUrl}/api/v1/health/devices?userId=guest_user`, { timeout: 15000 });
    const devicesText = await page.textContent('body');
    console.log('✓ API Devices Endpoint:');
    console.log(`  URL: ${apiBaseUrl}/api/v1/health/devices?userId=guest_user`);
    console.log(`  Status: ${devicesResponse.status()}`);
    console.log(`  Response: ${devicesText.substring(0, 200)}`);
  } catch (e) {
    console.log('✗ API Devices Endpoint FAILED');
    console.log(`  Error: ${e.message}`);
  }

  console.log('');

  // 3. Check for JavaScript/TypeScript Errors in Source Files
  console.log('[3] CHECKING SOURCE FILES FOR SYNTAX ERRORS...');
  console.log('-'.repeat(40));

  const fs = require('fs');
  const path = require('path');

  const filesToCheck = [
    'app/(tabs)/index.tsx',
    'app/(tabs)/steps.tsx',
    'app/(tabs)/meals.tsx',
    'app/(tabs)/programs.tsx',
    'app/(tabs)/settings.tsx',
    'app/(tabs)/_layout.tsx',
    'services/api.ts',
  ];

  const appDir = 'C:\\Users\\derri\\HeirclarkHealthAppNew';

  for (const file of filesToCheck) {
    const filePath = path.join(appDir, file);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;

        // Basic syntax checks
        const issues = [];

        // Check for unbalanced braces
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          issues.push(`Unbalanced braces: { = ${openBraces}, } = ${closeBraces}`);
        }

        // Check for unbalanced parentheses
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          issues.push(`Unbalanced parentheses: ( = ${openParens}, ) = ${closeParens}`);
        }

        // Check for common import issues
        if (content.includes("from '../../services/api'") && !content.includes('api')) {
          issues.push('API imported but not used');
        }

        // Check for missing exports
        if (!content.includes('export default') && !content.includes('export {')) {
          issues.push('No default export found');
        }

        if (issues.length === 0) {
          console.log(`✓ ${file} (${lines} lines) - OK`);
        } else {
          console.log(`⚠ ${file} (${lines} lines) - Issues found:`);
          issues.forEach(issue => console.log(`    - ${issue}`));
        }
      } else {
        console.log(`✗ ${file} - FILE NOT FOUND`);
      }
    } catch (e) {
      console.log(`✗ ${file} - Error reading: ${e.message}`);
    }
  }

  console.log('');

  // 4. Check package.json for dependencies
  console.log('[4] CHECKING DEPENDENCIES...');
  console.log('-'.repeat(40));

  try {
    const packagePath = path.join(appDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      console.log(`App Name: ${packageJson.name}`);
      console.log(`Version: ${packageJson.version || 'Not specified'}`);
      console.log('');
      console.log('Key Dependencies:');
      const deps = packageJson.dependencies || {};
      const keyDeps = ['expo', 'react', 'react-native', 'expo-router'];
      keyDeps.forEach(dep => {
        if (deps[dep]) {
          console.log(`  ✓ ${dep}: ${deps[dep]}`);
        } else {
          console.log(`  ✗ ${dep}: NOT INSTALLED`);
        }
      });
    } else {
      console.log('✗ package.json not found');
    }
  } catch (e) {
    console.log(`✗ Error reading package.json: ${e.message}`);
  }

  console.log('');

  // 5. Check Metro bundler logs (try to get error info)
  console.log('[5] CHECKING METRO BUNDLER STATUS...');
  console.log('-'.repeat(40));

  try {
    const bundlerPage = await context.newPage();
    const bundlerResponse = await bundlerPage.goto('http://localhost:8081/status', { timeout: 5000 });
    const bundlerText = await bundlerPage.textContent('body');
    console.log('Metro Bundler Status:');
    console.log(`  ${bundlerText.substring(0, 300)}`);
    await bundlerPage.close();
  } catch (e) {
    console.log('Could not get Metro bundler status');
    console.log(`  Trying alternate endpoint...`);

    try {
      const bundlerPage2 = await context.newPage();
      const debugResponse = await bundlerPage2.goto('http://localhost:8081/debugger-ui', { timeout: 5000 });
      console.log(`  Debugger UI Status: ${debugResponse.status()}`);
      await bundlerPage2.close();
    } catch (e2) {
      console.log(`  ${e2.message}`);
    }
  }

  console.log('');

  // 6. Try to load the app bundle
  console.log('[6] CHECKING APP BUNDLE COMPILATION...');
  console.log('-'.repeat(40));

  try {
    const bundlePage = await context.newPage();

    // Capture console errors
    const errors = [];
    bundlePage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    bundlePage.on('pageerror', err => {
      errors.push(err.message);
    });

    const bundleUrl = 'http://localhost:8081/index.bundle?platform=web&dev=true&hot=false';
    console.log(`Requesting: ${bundleUrl}`);

    const bundleResponse = await bundlePage.goto(bundleUrl, { timeout: 60000, waitUntil: 'networkidle' });

    if (bundleResponse) {
      console.log(`  Bundle Status: ${bundleResponse.status()}`);

      if (bundleResponse.status() === 200) {
        const bundleText = await bundleResponse.text();
        console.log(`  Bundle Size: ${(bundleText.length / 1024).toFixed(2)} KB`);

        // Check for error patterns in bundle
        if (bundleText.includes('SyntaxError') || bundleText.includes('TypeError')) {
          console.log('  ⚠ Bundle contains error references');
        } else {
          console.log('  ✓ Bundle compiled successfully');
        }
      } else if (bundleResponse.status() === 500) {
        const errorText = await bundleResponse.text();
        console.log('  ✗ Bundle compilation FAILED');
        console.log('');
        console.log('  ERROR DETAILS:');
        console.log('  ' + '-'.repeat(36));

        // Extract error message
        const errorMatch = errorText.match(/error:.*?(?=\n|$)/gi);
        if (errorMatch) {
          errorMatch.slice(0, 5).forEach(err => {
            console.log(`  ${err}`);
          });
        } else {
          console.log(`  ${errorText.substring(0, 1000)}`);
        }
      }
    }

    if (errors.length > 0) {
      console.log('');
      console.log('  Console Errors:');
      errors.slice(0, 5).forEach(err => {
        console.log(`  - ${err}`);
      });
    }

    await bundlePage.close();
  } catch (e) {
    console.log(`✗ Bundle check failed: ${e.message}`);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(60));

  await browser.close();
}

runDiagnostic().catch(console.error);
