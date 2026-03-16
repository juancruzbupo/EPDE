import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/integration/.+\\.integration\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  testTimeout: 30000,
  moduleNameMapper: {
    '^@epde/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@epde/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^file-type$': '<rootDir>/test/__mocks__/file-type.ts',
  },
};

export default config;
