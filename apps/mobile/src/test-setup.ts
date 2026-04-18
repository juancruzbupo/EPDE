// Mock axios to avoid Expo fetch adapter initialization errors in Jest
jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(() => Promise.resolve({ data: { data: null } })),
    post: jest.fn(() => Promise.resolve({ data: { data: null } })),
    patch: jest.fn(() => Promise.resolve({ data: { data: null } })),
    put: jest.fn(() => Promise.resolve({ data: { data: null } })),
    delete: jest.fn(() => Promise.resolve({ data: { data: null } })),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  const axiosMock = jest.fn(() => mockInstance);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (axiosMock as any).create = jest.fn(() => mockInstance);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (axiosMock as any).isAxiosError = jest.fn(() => false);
  return { __esModule: true, default: axiosMock };
});

// Mock expo-haptics (native module not available in Jest)
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

// Mock expo-image (native module not available in Jest)
jest.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

// Mock @react-native-community/netinfo for test environment
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
  },
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
}));

// Mock AsyncStorage (NativeModule not available in Jest)
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
