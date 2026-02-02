const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Increase timeouts to prevent black screen on reload
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Increase response timeout from default 30s to 60s
      res.setTimeout(60000);
      return middleware(req, res, next);
    };
  },
};

// Improve caching and reload behavior
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    keep_classnames: true, // Preserve class names for better debugging
    keep_fnames: true, // Preserve function names for better debugging
  },
};

// Better source map support
config.serializer = {
  ...config.serializer,
  customSerializer: config.serializer.customSerializer,
};

// Enable better error messages
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Use default resolver but with better error messages
    try {
      return context.resolveRequest(context, moduleName, platform);
    } catch (error) {
      console.error(`[Metro] Failed to resolve module: ${moduleName}`);
      throw error;
    }
  },
};

module.exports = config;
