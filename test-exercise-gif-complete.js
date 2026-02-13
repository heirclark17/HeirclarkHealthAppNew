/**
 * Complete Exercise GIF Integration Test
 *
 * This test verifies the entire exercise GIF flow:
 * 1. Backend exercises API returns correct proxy URLs
 * 2. Backend proxy endpoint successfully fetches GIFs from ExerciseDB
 * 3. GIF images are valid and loadable
 */

const https = require('https');
const http = require('http');

// Test configuration
const BACKEND_URL = 'https://heirclarkinstacartbackend-production.up.railway.app';
const TEST_EXERCISE_IDS = ['0001', '0002', '0003', '0025', '0227'];

// Color codes for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';

function log(color, message) {
  console.log(`${color}${message}${RESET}`);
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = [];

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer,
          bodyText: buffer.toString('utf8')
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testExercisesAPI() {
  log(BLUE, '\n=== TEST 1: Exercises API Returns Proxy URLs ===');

  try {
    const url = `${BACKEND_URL}/api/v1/exercises?limit=5`;
    log(YELLOW, `Fetching: ${url}`);

    const response = await fetchUrl(url);

    if (response.statusCode !== 200) {
      log(RED, `❌ FAILED: Status code ${response.statusCode}`);
      return false;
    }

    const data = JSON.parse(response.bodyText);

    if (!data.success || !data.exercises || data.exercises.length === 0) {
      log(RED, '❌ FAILED: No exercises returned');
      return false;
    }

    log(GREEN, `✅ Received ${data.exercises.length} exercises`);

    // Check if gifUrl uses proxy endpoint
    let proxyUrlCount = 0;
    for (const exercise of data.exercises) {
      if (exercise.gifUrl && exercise.gifUrl.includes('/api/v1/exercise-gif/')) {
        proxyUrlCount++;
        log(GREEN, `✅ ${exercise.name}: ${exercise.gifUrl.substring(0, 80)}...`);
      } else {
        log(RED, `❌ ${exercise.name}: Wrong URL format: ${exercise.gifUrl}`);
      }
    }

    if (proxyUrlCount === data.exercises.length) {
      log(GREEN, `✅ All ${proxyUrlCount} exercises use proxy URLs`);
      return true;
    } else {
      log(RED, `❌ Only ${proxyUrlCount}/${data.exercises.length} use proxy URLs`);
      return false;
    }

  } catch (error) {
    log(RED, `❌ ERROR: ${error.message}`);
    return false;
  }
}

async function testGIFProxy() {
  log(BLUE, '\n=== TEST 2: GIF Proxy Endpoint Returns Valid GIFs ===');

  let successCount = 0;
  let failCount = 0;

  for (const exerciseId of TEST_EXERCISE_IDS) {
    try {
      const url = `${BACKEND_URL}/api/v1/exercise-gif/${exerciseId}?resolution=180`;
      log(YELLOW, `\nTesting Exercise ${exerciseId}...`);

      const response = await fetchUrl(url);

      if (response.statusCode !== 200) {
        log(RED, `❌ HTTP ${response.statusCode}`);
        failCount++;
        continue;
      }

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('image/gif')) {
        log(RED, `❌ Wrong content-type: ${contentType}`);
        failCount++;
        continue;
      }

      const gifSize = response.body.length;
      if (gifSize < 1000) {
        log(RED, `❌ GIF too small (${gifSize} bytes) - likely error`);
        failCount++;
        continue;
      }

      // Check GIF header (magic bytes)
      const gifHeader = response.body.toString('ascii', 0, 6);
      if (!gifHeader.startsWith('GIF89a') && !gifHeader.startsWith('GIF87a')) {
        log(RED, `❌ Invalid GIF header: ${gifHeader}`);
        failCount++;
        continue;
      }

      const cacheStatus = response.headers['x-cache'] || 'UNKNOWN';
      log(GREEN, `✅ Valid GIF - ${(gifSize / 1024).toFixed(1)}KB - Cache: ${cacheStatus}`);
      successCount++;

    } catch (error) {
      log(RED, `❌ ERROR: ${error.message}`);
      failCount++;
    }
  }

  log(BLUE, `\nResults: ${successCount} passed, ${failCount} failed`);

  if (successCount === TEST_EXERCISE_IDS.length) {
    log(GREEN, '✅ All GIF proxy tests passed!');
    return true;
  } else {
    log(RED, `❌ Some tests failed (${failCount}/${TEST_EXERCISE_IDS.length})`);
    return false;
  }
}

async function testImageLoadability() {
  log(BLUE, '\n=== TEST 3: GIF Images Are Loadable in React Native ===');

  // Test if image headers are React Native compatible
  try {
    const url = `${BACKEND_URL}/api/v1/exercise-gif/0001?resolution=180`;
    const response = await fetchUrl(url);

    const requiredHeaders = [
      { name: 'content-type', expected: 'image/gif' },
      { name: 'cache-control', expected: /public/ }
    ];

    let allHeadersValid = true;

    for (const { name, expected } of requiredHeaders) {
      const value = response.headers[name];
      if (!value) {
        log(RED, `❌ Missing header: ${name}`);
        allHeadersValid = false;
      } else if (typeof expected === 'string' && value !== expected) {
        log(RED, `❌ Wrong ${name}: ${value} (expected ${expected})`);
        allHeadersValid = false;
      } else if (expected instanceof RegExp && !expected.test(value)) {
        log(RED, `❌ Wrong ${name}: ${value} (expected ${expected})`);
        allHeadersValid = false;
      } else {
        log(GREEN, `✅ ${name}: ${value}`);
      }
    }

    // Check CORS headers
    const corsOrigin = response.headers['access-control-allow-origin'];
    if (corsOrigin) {
      log(GREEN, `✅ CORS enabled: ${corsOrigin}`);
    } else {
      log(YELLOW, '⚠️  No CORS headers (may cause issues on web)');
    }

    return allHeadersValid;

  } catch (error) {
    log(RED, `❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log(BLUE, '\n╔════════════════════════════════════════════════════╗');
  log(BLUE, '║   EXERCISE GIF INTEGRATION TEST SUITE             ║');
  log(BLUE, '╚════════════════════════════════════════════════════╝');

  const results = {
    exercisesAPI: await testExercisesAPI(),
    gifProxy: await testGIFProxy(),
    imageLoadability: await testImageLoadability()
  };

  log(BLUE, '\n╔════════════════════════════════════════════════════╗');
  log(BLUE, '║   FINAL RESULTS                                    ║');
  log(BLUE, '╚════════════════════════════════════════════════════╝\n');

  log(results.exercisesAPI ? GREEN : RED, `Test 1 - Exercises API: ${results.exercisesAPI ? 'PASSED ✅' : 'FAILED ❌'}`);
  log(results.gifProxy ? GREEN : RED, `Test 2 - GIF Proxy: ${results.gifProxy ? 'PASSED ✅' : 'FAILED ❌'}`);
  log(results.imageLoadability ? GREEN : RED, `Test 3 - Image Headers: ${results.imageLoadability ? 'PASSED ✅' : 'FAILED ❌'}`);

  const allPassed = results.exercisesAPI && results.gifProxy && results.imageLoadability;

  if (allPassed) {
    log(GREEN, '\n🎉 ALL TESTS PASSED! Exercise GIFs are working correctly! 🎉');
    log(GREEN, '\nNext steps:');
    log(GREEN, '1. Open Heirclark Health app on your device');
    log(GREEN, '2. Navigate to Exercises tab');
    log(GREEN, '3. GIF images should now be displaying!');
  } else {
    log(RED, '\n❌ SOME TESTS FAILED - GIF display may not work correctly');
  }

  log(RESET, '\n');
}

runAllTests();
