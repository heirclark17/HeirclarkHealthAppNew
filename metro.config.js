const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Simplified config - remove custom resolver that can cause issues
config.server = {
  ...config.server,
  // Don't set fixed port - let Expo choose available port
};

module.exports = config;
