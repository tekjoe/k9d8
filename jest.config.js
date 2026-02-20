/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?(-.*)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@react-native-async-storage/.*|@supabase/.*|@rnmapbox/.*|nativewind|react-native-css-interop|date-fns|expo-modules-core|aes-js)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '__tests__/helpers/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/types/**',
    '!src/**/ParkMap*',
    '!src/services/moderation.web.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
