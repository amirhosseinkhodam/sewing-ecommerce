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
};

export default config;
