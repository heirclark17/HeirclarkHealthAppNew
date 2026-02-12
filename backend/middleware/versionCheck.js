/**
 * Version Check Middleware
 * Blocks old app versions with known bugs from making API requests
 */

const MIN_REQUIRED_VERSION = '1.0.1'; // Auth token fix version
const MIN_BUILD_NUMBER = 10;

function parseVersion(versionString) {
  if (!versionString) return { major: 0, minor: 0, patch: 0 };
  const parts = versionString.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

function isVersionSupported(clientVersion) {
  const minVersion = parseVersion(MIN_REQUIRED_VERSION);
  const client = parseVersion(clientVersion);

  if (client.major < minVersion.major) return false;
  if (client.major > minVersion.major) return true;

  if (client.minor < minVersion.minor) return false;
  if (client.minor > minVersion.minor) return true;

  return client.patch >= minVersion.patch;
}

function checkAppVersion(req, res, next) {
  // Get version from headers (mobile app should send this)
  const clientVersion = req.headers['x-app-version'];
  const clientBuild = parseInt(req.headers['x-app-build-number']);

  // Skip version check for health endpoints
  if (req.path === '/api/v1/health') {
    return next();
  }

  // If no version header, log warning but allow (for backwards compatibility during rollout)
  if (!clientVersion) {
    console.warn('[Version Check] No app version header found - allowing request');
    return next();
  }

  // Check version
  if (!isVersionSupported(clientVersion)) {
    console.warn(`[Version Check] Blocking old app version: ${clientVersion} (min required: ${MIN_REQUIRED_VERSION})`);
    return res.status(426).json({
      error: 'App Update Required',
      message: 'Please update your app to the latest version to continue using this feature.',
      currentVersion: clientVersion,
      minimumVersion: MIN_REQUIRED_VERSION,
      updateRequired: true,
    });
  }

  // Check build number if provided
  if (clientBuild && clientBuild < MIN_BUILD_NUMBER) {
    console.warn(`[Version Check] Blocking old build number: ${clientBuild} (min required: ${MIN_BUILD_NUMBER})`);
    return res.status(426).json({
      error: 'App Update Required',
      message: 'Please update your app to the latest version to continue using this feature.',
      currentBuild: clientBuild,
      minimumBuild: MIN_BUILD_NUMBER,
      updateRequired: true,
    });
  }

  console.log(`[Version Check] ✅ Version ${clientVersion} (build ${clientBuild}) is supported`);
  next();
}

module.exports = { checkAppVersion, MIN_REQUIRED_VERSION, MIN_BUILD_NUMBER };
