import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tests/browser/**'],
    coverage: { reporter: ['text', 'html'], include: ['packages/**/*.ts', 'apps/server/src/**/*.ts'] }
  }
});
