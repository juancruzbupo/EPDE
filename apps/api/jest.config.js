/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: { statements: 67, branches: 61, functions: 68, lines: 68 },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@epde/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
  },
};
