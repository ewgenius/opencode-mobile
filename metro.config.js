const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Mock node:child_process for React Native
config.resolver.extraNodeModules = {
  'node:child_process': path.resolve(__dirname, 'mocks/child-process.js'),
};

module.exports = config;
