module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@opencode-ai/sdk$': '<rootDir>/__mocks__/@opencode-ai/sdk.ts',
    '^react-native-mmkv$': '<rootDir>/__mocks__/react-native-mmkv.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/.expo/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/', '/__mocks__/'],
  collectCoverageFrom: ['stores/**/*.ts', 'services/**/*.ts', '!**/node_modules/**'],
};
