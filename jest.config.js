// See: https://jestjs.io/docs/configuration

/** @type {import('jest').Config} */
export default {
  clearMocks: true,
  moduleFileExtensions: ['js'],
  reporters: ['default'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  transform: {
    '\\.gql$': '<rootDir>/jest-transformer.js',
  },
  verbose: true,
}
