/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: { statements: 30, branches: 20, functions: 25, lines: 30 },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@epde/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
  },
};
