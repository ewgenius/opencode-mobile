// Basic jest setup without Expo-specific imports

// Mock react-native-mmkv (v2.x API - only MMKV class, no createMMKV)
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn(),
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
const MockXMLHttpRequest = jest.fn(() => ({
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
})) as any;

// Define readyState constants on the mock constructor
(MockXMLHttpRequest as any).UNSENT = 0;
(MockXMLHttpRequest as any).OPENED = 1;
(MockXMLHttpRequest as any).HEADERS_RECEIVED = 2;
(MockXMLHttpRequest as any).LOADING = 3;
(MockXMLHttpRequest as any).DONE = 4;

global.XMLHttpRequest = MockXMLHttpRequest as typeof XMLHttpRequest;

// Suppress console during tests unless needed
global.console = {
  ...console,
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
