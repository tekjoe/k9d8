const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    'react-native-linear-gradient': path.resolve(__dirname, 'src/empty-module.js'),
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
