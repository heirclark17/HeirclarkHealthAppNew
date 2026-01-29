const { withInfoPlist, withEntitlementsPlist, withXcodeProject } = require('@expo/config-plugins');

/**
 * Custom Expo config plugin to enable HealthKit for react-native-health
 */
function withHealthKit(config) {
  // Add HealthKit entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = [];
    return config;
  });

  // Add Info.plist entries for HealthKit permissions
  config = withInfoPlist(config, (config) => {
    config.modResults['NSHealthShareUsageDescription'] =
      config.modResults['NSHealthShareUsageDescription'] ||
      'This app needs access to your health data to track your fitness and nutrition goals.';

    config.modResults['NSHealthUpdateUsageDescription'] =
      config.modResults['NSHealthUpdateUsageDescription'] ||
      'This app needs permission to update your health data with tracked meals and activities.';

    // Add HealthKit to UIRequiredDeviceCapabilities if not present
    const capabilities = config.modResults['UIRequiredDeviceCapabilities'] || [];
    if (!capabilities.includes('healthkit')) {
      config.modResults['UIRequiredDeviceCapabilities'] = [...capabilities, 'healthkit'];
    }

    return config;
  });

  // Add HealthKit capability to Xcode project
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Get the target
    const targetKey = xcodeProject.getFirstTarget()?.uuid;
    if (targetKey) {
      // Add HealthKit capability
      const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();

      for (const key in buildConfigurations) {
        const buildConfig = buildConfigurations[key];
        if (buildConfig.buildSettings) {
          // Ensure CODE_SIGN_ENTITLEMENTS points to our entitlements file
          // This is usually handled automatically by Expo
        }
      }
    }

    return config;
  });

  return config;
}

module.exports = withHealthKit;
