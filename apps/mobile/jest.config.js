/* global module */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./src/test-setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@tanstack/.*|@epde/.*)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
  },
  coverageThreshold: {
    // Next milestone: 60% statements/lines. Pre-requisite: add unit tests for
    // hooks/mutations (use-task-operations, use-budgets-mutations, use-properties)
    // and expand lib/ coverage (auth, api-client, token-service).
    global: { statements: 51, branches: 48, functions: 39, lines: 52.5 },
  },
};
