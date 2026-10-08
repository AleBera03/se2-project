import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globalSetup: ['tests/globalSetup.js'],
    setupFiles: ['tests/setup.js'],
    env: { NODE_ENV: 'test' },
    fileParallelism: false, // all test files share oqms-test.sqlite
  },
});