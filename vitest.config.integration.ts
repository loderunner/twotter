import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
