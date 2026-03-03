/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: { statements: 75, branches: 60, functions: 65, lines: 75 },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@epde/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
  },
};
