const { chromium } = require('playwright');
const fs = require('fs');

async function runDiagnostics() {
  console.log('🔍 Starting Playwright diagnostic test...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const warnings = [];
  const info = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      errors.push({ type: 'console.error', message: text, timestamp: new Date().toISOString() });
      console.log(`❌ ERROR: ${text}`);
    } else if (type === 'warning') {
      warnings.push({ type: 'console.warn', message: text, timestamp: new Date().toISOString() });
      console.log(`⚠️  WARNING: ${text}`);
    } else if (type === 'log') {
      info.push({ type: 'console.log', message: text, timestamp: new Date().toISOString() });
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push({ type: 'page.error', message: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    errors.push({
      type: 'request.failed',
      url: request.url(),
      failure: request.failure()?.errorText,
      timestamp: new Date().toISOString()
    });
    console.log(`❌ REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log('📡 Testing Metro bundler status...');

    // Test Metro bundler
    const statusResponse = await page.goto('http://localhost:8081/status', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    if (statusResponse.ok()) {
      console.log('✅ Metro bundler is running\n');
      info.push({ type: 'metro.status', message: 'Metro bundler running', timestamp: new Date().toISOString() });
    } else {
      throw new Error(`Metro bundler returned ${statusResponse.status()}`);
    }

    // Try to load the index bundle
    console.log('📦 Testing bundle generation...');
    const bundleResponse = await page.goto('http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    if (bundleResponse.ok()) {
      console.log('✅ Bundle generated successfully\n');

      // Check bundle size
      const bundleContent = await bundleResponse.text();
      const bundleSize = (bundleContent.length / 1024).toFixed(2);
      console.log(`📊 Bundle size: ${bundleSize} KB`);
      info.push({ type: 'bundle.size', message: `${bundleSize} KB`, timestamp: new Date().toISOString() });

      // Check for syntax errors in bundle
      const syntaxErrors = bundleContent.match(/SyntaxError:.*?at.*?\n/g);
      if (syntaxErrors) {
        syntaxErrors.forEach(err => {
          errors.push({ type: 'syntax.error', message: err.trim(), timestamp: new Date().toISOString() });
          console.log(`❌ SYNTAX ERROR: ${err.trim()}`);
        });
      }

      // Check for import errors
      const importErrors = bundleContent.match(/Error: Unable to resolve module.*?\n/g);
      if (importErrors) {
        importErrors.forEach(err => {
          errors.push({ type: 'import.error', message: err.trim(), timestamp: new Date().toISOString() });
          console.log(`❌ IMPORT ERROR: ${err.trim()}`);
        });
      }

      // Check for undefined references
      const undefinedRefs = bundleContent.match(/ReferenceError:.*?\n/g);
      if (undefinedRefs) {
        undefinedRefs.forEach(err => {
          errors.push({ type: 'reference.error', message: err.trim(), timestamp: new Date().toISOString() });
          console.log(`❌ REFERENCE ERROR: ${err.trim()}`);
        });
      }

    } else {
      throw new Error(`Bundle generation failed with status ${bundleResponse.status()}`);
    }

    console.log('\n📱 Testing Expo web preview...');

    // Try to load Expo web version
    try {
      const webResponse = await page.goto('http://localhost:8081', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      if (webResponse.ok()) {
        console.log('✅ Expo web server is accessible');

        // Wait for app to potentially load
        await page.waitForTimeout(5000);

        // Check if there are any error elements
        const errorElements = await page.$$('[class*="error"], [class*="Error"]');
        if (errorElements.length > 0) {
          for (const elem of errorElements) {
            const errorText = await elem.textContent();
            if (errorText && errorText.trim()) {
              errors.push({ type: 'dom.error', message: errorText.trim(), timestamp: new Date().toISOString() });
              console.log(`❌ DOM ERROR: ${errorText.trim()}`);
            }
          }
        }
      }
    } catch (webError) {
      warnings.push({ type: 'web.preview', message: `Web preview not available: ${webError.message}`, timestamp: new Date().toISOString() });
      console.log(`⚠️  Web preview not available (expected for mobile-only apps)`);
    }

  } catch (error) {
    errors.push({ type: 'test.error', message: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    console.log(`❌ TEST ERROR: ${error.message}`);
  }

  await browser.close();

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNOSTIC REPORT');
  console.log('='.repeat(80) + '\n');

  console.log(`❌ Errors: ${errors.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`ℹ️  Info: ${info.length}`);

  if (errors.length > 0) {
    console.log('\n🔴 ERRORS FOUND:\n');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. [${err.type}] ${err.message}`);
      if (err.stack) {
        console.log(`   Stack: ${err.stack.substring(0, 200)}...`);
      }
    });
  }

  if (warnings.length > 0) {
    console.log('\n🟡 WARNINGS:\n');
    warnings.forEach((warn, i) => {
      console.log(`${i + 1}. [${warn.type}] ${warn.message}`);
    });
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      errors: errors.length,
      warnings: warnings.length,
      info: info.length
    },
    errors,
    warnings,
    info
  };

  fs.writeFileSync('diagnostic_report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Detailed report saved to: diagnostic_report.json');

  // Exit with error code if errors found
  if (errors.length > 0) {
    console.log('\n❌ DIAGNOSTIC FAILED - Errors found');
    process.exit(1);
  } else {
    console.log('\n✅ DIAGNOSTIC PASSED - No errors found');
    process.exit(0);
  }
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('Fatal error running diagnostics:', error);
  process.exit(1);
});
