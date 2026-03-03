module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./src/test-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@tanstack/.*|@epde/.*)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
  },
  coverageThreshold: {
    global: { statements: 35, branches: 20, functions: 35, lines: 35 },
  },
};
