import type { Config } from 'jest';
import nextJest from 'next/jest.js';
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/analytics/**',
    '!**/app/**',
    '!**/pl-design-system/**',
    '!**/prototypes/**',
    '!**/design-canvas/**',
    '!jest.config.ts',
    '!next.config.js',
    '!next-i18next.config.js',
    '!tsconfig.json',
    '!jest.setup.ts',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/pl-design-system/',
    '<rootDir>/prototypes/',
    '<rootDir>/design-canvas/',
  ],
  silent: true,
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  coverageReporters: ['text', 'json', 'html'],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  setupFiles: ['<rootDir>/jest.setup.js'],
};

/**
 * Packages that ship ES modules only, so jest must transform them like our own code: react-calendar (the event form's
 * pickers and the All Events month picker, LAB-3460) and its ESM dependencies. next/jest ignores `node_modules` but
 * for the packages Next transpiles, and only lets a config append patterns; a file is skipped when any pattern matches,
 * so these are added to next's own list of exceptions.
 */
const ESM_PACKAGES = ['react-calendar', '@wojtekmaj/date-utils', 'get-user-locale', 'memoize', 'mimic-function'];
const SPARED = '/node_modules/(?!.pnpm)(?!(';

const spareEsmPackages = (pattern: string) => {
  if (pattern === '/node_modules/') return `${SPARED}${ESM_PACKAGES.join('|')})/)`;
  if (pattern.startsWith(SPARED)) return `${SPARED}${ESM_PACKAGES.join('|')}|${pattern.slice(SPARED.length)}`;
  return pattern;
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
const jestConfig = async () => {
  const resolved = await createJestConfig(config)();
  return { ...resolved, transformIgnorePatterns: (resolved.transformIgnorePatterns ?? []).map(spareEsmPackages) };
};

export default jestConfig;
