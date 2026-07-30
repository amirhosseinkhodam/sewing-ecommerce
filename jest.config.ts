import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  setupFiles: ['<rootDir>/setup-jest.ts'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/tsconfig.spec.json' },
    ],
  },
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
  },
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'src/**/*.service.ts',
    'src/**/*.component.ts',
    'src/**/*.pipe.ts',
    'src/**/*.store.ts',
    '!src/**/*.module.ts',
    '!src/**/*.routes.ts',
  ],
  transformIgnorePatterns: ['node_modules/(?!(@ngrx|@ng-select|rxjs|@angular))'],
};

export default config;
