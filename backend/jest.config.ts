import type { Config } from 'jest';

const config: Config = {
  rootDir: '..',
  roots: ['<rootDir>/backend/tests'],
  testRegex: '.*\\.spec\\.ts$',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/backend/tests/helpers/global-setup.ts',
  setupFiles: ['<rootDir>/backend/tests/helpers/env.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.backend.json', diagnostics: false },
    ],
  },
  moduleNameMapper: { '^@domain/(.*)$': '<rootDir>/shared/$1' },
  // Tests share one database, so files must not run in parallel.
  maxWorkers: 1,
  collectCoverageFrom: [
    '<rootDir>/backend/src/**/*.ts',
    '!<rootDir>/backend/src/generated/**',
    '!<rootDir>/backend/src/main.ts',
    '!<rootDir>/backend/src/**/*.module.ts',
    '!<rootDir>/backend/src/**/dto/**',
  ],
  coverageDirectory: '<rootDir>/coverage/backend',
};

export default config;
