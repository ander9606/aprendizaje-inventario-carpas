module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'modules/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**'
  ]
};
