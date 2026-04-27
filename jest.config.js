module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/*.test.js'],
  testEnvironmentOptions: {
    env: {
      NODE_ENV: 'test',
    },
  },
};