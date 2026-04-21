const { withNativewind } = require("nativewind/metro");
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Add .wasm to the source extensions
config.resolver.sourceExts.push('wasm');

// module.exports = config
module.exports = withNativewind(config);