module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['./jest.setup.js'],
  collectCoverageFrom: [
    'modules/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**'
  ]
};
