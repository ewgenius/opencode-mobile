// Basic jest setup without Expo-specific imports

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn(),
  })),
  createMMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(key => {
      const storage: Record<string, string> = {};
      return storage[key] || null;
    }),
    set: jest.fn((key, value) => {
      const storage: Record<string, string> = {};
      storage[key] = value;
    }),
    remove: jest.fn(),
  })),
}));

// Mock expo modules
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

// Mock XMLHttpRequest for SSE client
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  abort: jest.fn(),
  get responseText() {
    return '';
  },
  readyState: 4,
  status: 200,
  statusText: 'OK',
  onprogress: null,
  onreadystatechange: null,
  onerror: null,
})) as unknown as typeof XMLHttpRequest;

// Suppress console during tests unless needed
global.console = {
  ...console,
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
